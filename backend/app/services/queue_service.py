from datetime import datetime, timezone, date
from app.extensions import db, socketio
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
    
    # SMART WAIT TIME: 10 mins per patient ahead
    # Count how many are already WAITING or Active today
    patients_ahead = Queue.query.filter(
        db.func.date(Queue.created_at) == today,
        Queue.status.in_(["WAITING", "Active"])
    ).count()
    estimated_wait = patients_ahead * 10 

    # Create queue record
    qe = Queue(
        appointment_id=appointment.id,
        queue_number=next_num,
        estimated_wait_time=estimated_wait,
        status="WAITING",
        check_in_time=datetime.now(timezone.utc)
    )
    
    appointment.status = "Checked-In"
    db.session.add(qe)
    db.session.commit()

    # EMIT REAL-TIME UPDATE
    socketio.emit('queue_updated', {'type': 'check_in', 'patient': full_name})
    
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
    db.session.commit()
    
    # EMIT REAL-TIME UPDATE
    socketio.emit('queue_updated', {'type': 'check_out', 'patient_id': patient_id})
    
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

def get_all_queues_status():
    """
    Returns the current status of all active queues across departments.
    """
    today = date.today()
    
    # Get all WAITING or Active queue entries for today
    active_queues = Queue.query.join(Appointment).filter(
        db.func.date(Appointment.appointment_date) == today,
        Queue.status.in_(["WAITING", "Active"])
    ).order_by(Queue.queue_number.asc()).all()
    
    status_map = {}
    
    for qe in active_queues:
        dept = qe.appointment.specialist.department or "General"
        room = qe.appointment.session.room_number if qe.appointment.session else "TBA"
        
        # We only care about the first (next) person in each department/room combo
        key = f"{dept} - {room}"
        if key not in status_map:
            patient = qe.appointment.patient
            patient_id_formatted = f"PAT-{patient.id:04d}" if patient else "N/A"
            
            status_map[key] = {
                "department": dept,
                "room": room,
                "next_patient": patient_id_formatted,
                "status": "NEXT" if qe.status == "WAITING" else "NOW SERVING"
            }
            
    return list(status_map.values())

def call_next_patient(session_id):
    """
    Completes the current active patient and calls the next one from the waiting list.
    """
    # 1. Complete the currently active patient for this session
    active_qe = Queue.query.join(Appointment).filter(
        Appointment.session_id == session_id,
        Queue.status == "Active"
    ).first()
    
    if active_qe:
        active_qe.status = "COMPLETED"
        active_qe.completed_at = datetime.now(timezone.utc)
        active_qe.appointment.status = "Completed"
    
    # 2. Call the next patient in WAITING
    next_qe = Queue.query.join(Appointment).filter(
        Appointment.session_id == session_id,
        Queue.status == "WAITING"
    ).order_by(Queue.queue_number.asc()).first()
    
    if not next_qe:
        db.session.commit()
        return {"success": True, "message": "Queue cleared. No more patients waiting."}
    
    next_qe.status = "Active"
    db.session.commit()
    
    # EMIT REAL-TIME UPDATE
    socketio.emit('queue_updated', {
        'type': 'call_next', 
        'session_id': session_id,
        'token': f"TKN-{next_qe.queue_number:03d}",
        'patient_name': next_qe.appointment.patient.full_name,
        'room': next_qe.appointment.session.room_number if next_qe.appointment.session else "TBA"
    })
    socketio.emit('session_status_changed', {'session_id': session_id, 'status': 'Active'})
    
    return {
        "success": True, 
        "message": f"Calling next patient: {next_qe.appointment.patient.full_name}",
        "queue_number": next_qe.queue_number,
        "patient_name": next_qe.appointment.patient.full_name
    }

def toggle_session_pause(session_id):
    """
    Pauses or resumes a doctor's session.
    """
    from app.models.doctor_session import DoctorSession
    session = DoctorSession.query.get(session_id)
    if not session:
        return {"error": "Session not found."}
    
    if session.status == "Paused":
        session.status = "Active"
        msg = "Session resumed."
    else:
        session.status = "Paused"
        msg = "Session paused."
        
    db.session.commit()
    
    # EMIT REAL-TIME UPDATE
    socketio.emit('session_status_changed', {'session_id': session_id, 'status': session.status})
    socketio.emit('queue_updated', {'type': 'session_toggle', 'session_id': session_id})

    return {"success": True, "message": msg, "new_status": session.status}

def end_session(session_id):
    """
    Ends a session and cancels all remaining waiting patients.
    """
    from app.models.doctor_session import DoctorSession
    session = DoctorSession.query.get(session_id)
    if not session:
        return {"error": "Session not found."}
        
    # Cancel all WAITING patients
    waiting_qes = Queue.query.join(Appointment).filter(
        Appointment.session_id == session_id,
        Queue.status == "WAITING"
    ).all()
    
    for qe in waiting_qes:
        qe.status = "CANCELLED"
        qe.appointment.status = "Cancelled"
        
    session.status = "Completed"
    db.session.commit()
    
    # EMIT REAL-TIME UPDATE
    socketio.emit('session_status_changed', {'session_id': session_id, 'status': 'Completed'})
    socketio.emit('queue_updated', {'type': 'session_end', 'session_id': session_id})
    
    return {"success": True, "message": f"Session ended. {len(waiting_qes)} waiting patients cancelled."}

def skip_patient(queue_id):
    """
    Marks a patient as MISSED.
    """
    qe = Queue.query.get(queue_id)
    if not qe:
        return {"error": "Queue entry not found."}
        
    qe.status = "MISSED"
    qe.appointment.status = "Missed"
    db.session.commit()
    
    # EMIT REAL-TIME UPDATE
    socketio.emit('queue_updated', {'type': 'skip', 'queue_id': queue_id})
    
    return { "success": True, "message": "Patient marked as missed." }

def get_all_sessions_queues():
    """
    Returns detailed queue data for all active doctor sessions today.
    Used by Admin Queue Control Center.
    """
    today = date.today()
    from app.models.doctor_session import DoctorSession
    
    # Get all sessions for today
    sessions = DoctorSession.query.filter(
        DoctorSession.day_of_week == datetime.now().strftime("%A"),
        DoctorSession.status != "Cancelled"
    ).all()
    
    results = []
    for session in sessions:
        # Get active patient
        active_qe = Queue.query.join(Appointment).filter(
            Appointment.session_id == session.id,
            db.func.date(Appointment.appointment_date) == today,
            Queue.status == "Active"
        ).first()
        
        # Get waiting list
        waiting_qes = Queue.query.join(Appointment).filter(
            Appointment.session_id == session.id,
            db.func.date(Appointment.appointment_date) == today,
            Queue.status == "WAITING"
        ).order_by(Queue.queue_number.asc()).all()
        
        waiting_list = []
        for i, qe in enumerate(waiting_qes):
            smart_wait = (i + 1) * 10 # 10 mins per person ahead
            waiting_list.append({
                "id": qe.id,
                "token": f"TKN-{qe.queue_number:03d}",
                "patient": qe.appointment.patient.full_name if qe.appointment.patient else "Unknown",
                "patient_id": qe.appointment.patient_id,
                "waitTime": f"{smart_wait}m",
                "priority": qe.appointment.priority_level
            })
            
        results.append({
            "session_id": session.id,
            "doctor": session.specialist.name if session.specialist else "N/A",
            "department": session.specialist.department if session.specialist else "N/A",
            "room": session.room_number or "N/A",
            "status": session.status,
            "current_patient": {
                "id": active_qe.id,
                "token": f"TKN-{active_qe.queue_number:03d}",
                "name": active_qe.appointment.patient.full_name if active_qe.appointment and active_qe.appointment.patient else "Unknown"
            } if active_qe else None,
            "waiting_count": len(waiting_list),
            "waiting_list": waiting_list
        })
        
    return results
