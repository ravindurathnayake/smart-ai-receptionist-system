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
    
    # Check if already in queue
    existing_queue = Queue.query.filter_by(appointment_id=appointment.id).first()
    if existing_queue:
        return {
            "success": True, 
            "queue_number": existing_queue.queue_number, 
            "estimated_wait_time": existing_queue.estimated_wait_time,
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
    patient = Patient.query.get(patient_id)
    doctor_name = appointment.specialist.name if appointment.specialist else "N/A"
    
    notifications = {"email": "skipped", "whatsapp": "skipped"}
    
    if patient:
        if patient.email:
            email_sent = send_checkin_notification(patient.email, patient.full_name, next_num, next_num * 5, doctor_name)
            notifications["email"] = "sent" if email_sent else "failed"
            
        if patient.phone_number:
            wa_sent = send_checkin_whatsapp(patient.phone_number, patient.full_name, next_num, next_num * 5, doctor_name)
            notifications["whatsapp"] = "sent" if wa_sent else "failed"
    
    return {
        "success": True, 
        "queue_number": next_num, 
        "estimated_wait_time": next_num * 5,
        "doctor": doctor_name,
        "notifications": notifications
    }

def manual_check_in(identifier):
    """
    Checks in a patient using NIC or Phone Number.
    """
    patient = Patient.query.filter(
        (Patient.phone_number == identifier) | (Patient.nic == identifier)
    ).first()
    
    if not patient:
        return {"error": "Patient not found. Please check your NIC or Phone Number."}
    
    return check_in_patient(patient.id)

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
