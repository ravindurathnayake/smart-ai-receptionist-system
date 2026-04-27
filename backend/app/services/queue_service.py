from datetime import datetime, timezone, date
from app.extensions import db
from app.models import Patient, Appointment, Queue
from app.services.email_service import send_checkin_notification, send_checkout_notification
from app.services.whatsapp_service import send_checkin_whatsapp, send_checkout_whatsapp

def check_in_patient(patient_id):
    """
    Checks in a patient for their appointment today.
    """
    today = date.today()
    
    # Find today's appointment for the patient (allow multiple active statuses)
    appointment = Appointment.query.filter(
        Appointment.patient_id == patient_id,
        db.func.date(Appointment.appointment_date) == today,
        Appointment.status.in_(["Booked", "Scheduled", "Confirmed"])
    ).first()
    
    if not appointment:
        return {"error": "No appointment found for today. Please register or book an appointment."}
    
    # Prepare full response data
    patient = Patient.query.get(patient_id)
    specialist = appointment.specialist
    title = specialist.title if (specialist and specialist.title) else "Dr."
    doctor_full = f"{title} {specialist.name}" if specialist else "N/A"
    dept_name = specialist.department if specialist else "General"
    room = appointment.session.room_number if appointment.session and appointment.session.room_number else "Room 04"
    app_time = appointment.appointment_date.strftime("%I:%M %p") if appointment.appointment_date else "N/A"
    full_name = patient.full_name if patient else "Patient"

    # Check if already in queue
    existing_queue = Queue.query.filter_by(appointment_id=appointment.id).first()
    if existing_queue:
        return {
            "success": True, 
            "queue_number": existing_queue.queue_number, 
            "estimated_wait_time": existing_queue.estimated_wait_time,
            "doctor": doctor_full,
            "department": dept_name,
            "room": room,
            "appointment_time": app_time,
            "patient_name": full_name,
            "patient_id": patient_id,
            "message": "Already checked in."
        }
    
    # Generate next queue number
    last_q = Queue.query.filter(db.func.date(Queue.created_at) == today).order_by(Queue.queue_number.desc()).first()
    next_num = (last_q.queue_number + 1) if last_q else 1
    
    # Create queue record
    qe = Queue(
        appointment_id=appointment.id,
        queue_number=next_num,
        estimated_wait_time=next_num * 5,
        status="WAITING",
        check_in_time=datetime.now(timezone.utc)
    )
    
    appointment.status = "Checked-In"
    db.session.add(qe)
    db.session.commit()
    
    # Trigger Notifications
    notifications = {"email": "skipped", "whatsapp": "skipped"}
    if patient:
        if patient.email:
            email_sent = send_checkin_notification(patient.email, full_name, next_num, next_num * 5, doctor_full)
            notifications["email"] = "sent" if email_sent else "failed"
        if patient.phone_number:
            wa_sent = send_checkin_whatsapp(patient.phone_number, full_name, next_num, next_num * 5, doctor_full)
            notifications["whatsapp"] = "sent" if wa_sent else "failed"
    
    return {
        "success": True, 
        "queue_number": next_num, 
        "estimated_wait_time": next_num * 5,
        "doctor": doctor_full,
        "department": dept_name,
        "room": room,
        "appointment_time": app_time,
        "patient_name": full_name,
        "patient_id": patient_id,
        "notifications": notifications
    }

def manual_check_in(identifier, patient_id=None):
    """
    Checks in a patient using NIC or Phone Number.
    Supports guardian profile selection.
    """
    if patient_id:
        return check_in_patient(patient_id)

    # Find primary matching patient (usually the adult/guardian)
    primary = Patient.query.filter(
        (Patient.phone_number == identifier) | (Patient.nic == identifier)
    ).first()
    
    if not primary:
        return {"error": "Patient not found. Please check your NIC or Phone Number."}
    
    # Check for linked profiles (children)
    linked = Patient.query.filter(
        (Patient.guardian_id == primary.id) | 
        (Patient.guardian_nic == primary.nic) |
        (Patient.guardian_phone == primary.phone_number)
    ).all()

    # Filter only those who have appointments today (optional but better UX?)
    # The user asked to "show accounts", so we show all even if no appt?
    # Usually we show all linked accounts.
    
    if linked:
        profiles = [{
            "id": primary.id,
            "name": primary.full_name,
            "age": primary.age,
            "nic": primary.nic,
            "role": "Self",
            "image": primary.profile_image
        }]
        for child in linked:
            profiles.append({
                "id": child.id,
                "name": child.full_name,
                "age": child.age,
                "role": "Family Member",
                "image": child.profile_image
            })
        return {"success": True, "profiles": profiles}
    
    # Only one profile found, proceed with check-in
    return check_in_patient(primary.id)

def check_out_patient(patient_id):
    """
    Marks the patient's active queue entry as completed.
    """
    today = date.today()
    
    # Find active queue entry for this patient today
    # Try multiple status values to be safe during migration/transition
    queue_entry = Queue.query.join(Appointment).filter(
        Appointment.patient_id == patient_id,
        db.func.date(Appointment.appointment_date) == today,
        Queue.status.in_(["WAITING", "Active"])
    ).first()
    
    if not queue_entry:
        # Check if they already checked out
        already_done = Queue.query.join(Appointment).filter(
            Appointment.patient_id == patient_id,
            db.func.date(Appointment.appointment_date) == today,
            Queue.status == "COMPLETED"
        ).first()
        
        if already_done:
            return {"success": True, "message": "Already checked out."}
            
        return {"error": "No active check-in found for this patient today."}
    
    queue_entry.status = "COMPLETED"
    queue_entry.check_out_time = datetime.now(timezone.utc)
    queue_entry.completed_at = datetime.now(timezone.utc)
    queue_entry.appointment.status = "Completed"
    
    db.session.commit()
    
    # Trigger Notifications
    patient = Patient.query.get(patient_id)
    notifications = {"email": "skipped", "whatsapp": "skipped"}
    
    if patient:
        if patient.email:
            email_sent = send_checkout_notification(patient.email, patient.full_name)
            notifications["email"] = "sent" if email_sent else "failed"
        if patient.phone_number:
            wa_sent = send_checkout_whatsapp(patient.phone_number, patient.full_name)
            notifications["whatsapp"] = "sent" if wa_sent else "failed"
            
    return {
        "success": True, 
        "message": "Visit Completed",
        "notifications": notifications
    }

def get_patient_queue_status(patient_id):
    """
    Retrieves the active queue position and department for a patient.
    """
    today = date.today()
    queue_entry = Queue.query.join(Appointment).filter(
        Appointment.patient_id == patient_id,
        db.func.date(Appointment.appointment_date) == today,
        Queue.status == "WAITING"
    ).first()
    
    if not queue_entry:
        return None
        
    # Count people ahead
    people_ahead = Queue.query.filter(
        Queue.status == "WAITING",
        Queue.queue_number < queue_entry.queue_number,
        db.func.date(Queue.created_at) == today
    ).count()
    
    return {
        "token": f"TKN-{queue_entry.queue_number:03d}",
        "department": queue_entry.appointment.specialist.department if queue_entry.appointment.specialist else "General",
        "people_ahead": people_ahead,
        "estimated_wait": people_ahead * 5
    }
