from datetime import datetime, timezone, date
from app.extensions import db, socketio
from app.models import Patient, Appointment, Queue
from app.services.email_service import send_checkin_notification, send_checkout_notification
from app.services.whatsapp_service import (
    send_checkin_whatsapp,
    send_checkout_whatsapp,
    get_patient_whatsapp_numbers,
)
from app.services.face_service import normalize_profile_image


def _active_queue_status_filter():
    return db.func.upper(Queue.status).in_(["WAITING", "ACTIVE"])

def check_in_patient(patient_id, appointment_id=None):
    """
    Checks in a patient for their appointment today.
    Enforces single active check-in, handles multiple appointments, and handles ended sessions.
    """
    if patient_id is not None:
        try:
            if isinstance(patient_id, str):
                pid_str = patient_id.strip().lower()
                if pid_str in ("undefined", "null", ""):
                    patient_id = None
                else:
                    patient_id = int(patient_id)
            else:
                patient_id = int(patient_id)
        except (ValueError, TypeError):
            patient_id = None

    if not patient_id:
        return {"error": "Invalid patient ID."}

    today = date.today()
    
    # 1. Enforce Single Active Check-in per Appointment
    if appointment_id:
        active_queue = Queue.query.filter(
            Queue.appointment_id == appointment_id,
            _active_queue_status_filter()
        ).first()
        if active_queue:
            return {"error": "You are already checked in for this appointment."}

    
    # 2. Handle Appointment Selection
    if appointment_id:
        appointment = Appointment.query.get(appointment_id)
        if not appointment or appointment.patient_id != patient_id:
            return {"error": "Invalid appointment selected."}
    else:
        # Fetch all eligible appointments for today
        appointments = Appointment.query.filter(
            Appointment.patient_id == patient_id,
            db.func.date(Appointment.appointment_date) == today,
            Appointment.status.in_(["Booked", "Scheduled", "Confirmed"])
        ).all()
        
        if not appointments:
            return {"error": "No appointment found for today. Please register or book an appointment."}
            
        if len(appointments) > 1:
            # Need user to select which one to check into
            appt_list = []
            for appt in appointments:
                spec = appt.specialist
                title = spec.title if (spec and spec.title) else "Dr."
                sess = appt.session
                appt_list.append({
                    "id": appt.id,
                    "doctor": f"{title} {spec.name}" if spec else "N/A",
                    "department": spec.department if spec else "General",
                    "time": appt.appointment_date.strftime("%I:%M %p") if appt.appointment_date else "N/A",
                    "room": sess.room_number if sess and sess.room_number else "TBD",
                    "session_status": sess.status if sess else "ACTIVE",
                    "priority": appt.priority_level
                })
            return {
                "success": True,
                "requires_selection": True,
                "patient_id": patient_id,
                "appointments": appt_list
            }
            
        appointment = appointments[0]

    # 3. Handle Session Ended
    session = appointment.session
    if session and session.status in ["ENDED", "Cancelled", "NEEDS_RESCHEDULE"]:
        spec = appointment.specialist
        return {
            "success": False, 
            "session_ended": True, 
            "appointment_id": appointment.id,
            "department": spec.department if spec else "General",
            "message": "The session for this appointment has already ended or been cancelled."
        }

    # Prepare full response data for successful check-in
    patient = Patient.query.get(patient_id)
    specialist = appointment.specialist
    title = specialist.title if (specialist and specialist.title) else "Dr."
    doctor_full = f"{title} {specialist.name}" if specialist else "N/A"
    dept_name = specialist.department if specialist else "General"
    room = session.room_number if session and session.room_number else "Room 04"
    app_time = appointment.appointment_date.strftime("%I:%M %p") if appointment.appointment_date else "N/A"
    full_name = patient.full_name if patient else "Patient"

    # Check if already in queue (this shouldn't happen if they don't have an active one, but just in case for COMPLETED ones)
    existing_queue = Queue.query.filter_by(appointment_id=appointment.id).first()
    if existing_queue:
        if existing_queue.status == "COMPLETED":
            return {"error": "You have already completed this appointment."}
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
    
    # Generate next queue number for this specific session
    last_q = Queue.query.filter_by(doctor_session_id=appointment.doctor_session_id).order_by(Queue.queue_number.desc()).first()
    next_num = (last_q.queue_number + 1) if last_q else 1
    
    # Wait time should be based on people ahead in arrival order
    patients_ahead = Queue.query.filter(
        Queue.doctor_session_id == appointment.doctor_session_id,
        Queue.status == "WAITING"
    ).count()
    estimated_wait = patients_ahead * 10

    # Create queue record
    qe = Queue(
        appointment_id=appointment.id,
        patient_id=patient_id,
        doctor_session_id=appointment.doctor_session_id,
        queue_number=next_num,
        estimated_wait_time=estimated_wait,
        status="WAITING",
        check_in_time=datetime.now(timezone.utc)
    )
    
    appointment.status = "Checked-In"
    appointment.queue_number = next_num
    db.session.add(qe)
    db.session.commit()

    # EMIT REAL-TIME UPDATE
    socketio.emit('queue_updated', {'type': 'check_in', 'patient': full_name})
    socketio.emit('specialist_updated', {'specialist_id': specialist.id})
    
    # Trigger Notifications
    notifications = {"email": "skipped", "whatsapp": "skipped"}
    if patient:
        if patient.email:
            email_sent = send_checkin_notification(patient.email, full_name, next_num, next_num * 5, doctor_full)
            notifications["email"] = "sent" if email_sent else "failed"
        whatsapp_numbers = get_patient_whatsapp_numbers(patient)
        if whatsapp_numbers:
            wa_sent = send_checkin_whatsapp(whatsapp_numbers, full_name, next_num, next_num * 5, doctor_full)
            notifications["whatsapp"] = "sent" if wa_sent else "failed"
    
    session_num = session.session_number if session else 1
    
    return {
        "success": True, 
        "queue_number": next_num, 
        "estimated_wait_time": estimated_wait,
        "token": f"S{session_num}-{next_num:02d}",
        "doctor": doctor_full,
        "department": dept_name,
        "room": room,
        "appointment_time": app_time,
        "patient_name": full_name,
        "patient_id": patient_id,
        "notifications": notifications
    }

def manual_check_in(identifier, patient_id=None, appointment_id=None):
    """
    Checks in a patient using NIC or Phone Number.
    Supports guardian profile selection and specific appointment selection.
    """
    if patient_id:
        return check_in_patient(patient_id, appointment_id)

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

    if linked:
        profiles = [{
            "id": primary.id,
            "name": primary.full_name,
            "age": primary.age,
            "nic": primary.nic,
            "role": "Self",
            "image": normalize_profile_image(primary.profile_image)
        }]
        for child in linked:
            profiles.append({
                "id": child.id,
                "name": child.full_name,
                "age": child.age,
                "role": "Family Member",
                "image": normalize_profile_image(child.profile_image)
            })
        return {"success": True, "profiles": profiles}
    
    # Only one profile found, proceed with check-in
    return check_in_patient(primary.id, appointment_id)

def check_out_patient(patient_id, appointment_id=None):
    """
    Marks the patient's active queue entry as completed or checks out a completed queue entry.
    """
    if patient_id is not None:
        try:
            if isinstance(patient_id, str):
                pid_str = patient_id.strip().lower()
                if pid_str in ("undefined", "null", ""):
                    patient_id = None
                else:
                    patient_id = int(patient_id)
            else:
                patient_id = int(patient_id)
        except (ValueError, TypeError):
            patient_id = None

    if not patient_id:
        return {"error": "Invalid patient ID."}

    today = date.today()
    
    # Query any queue entry for this patient today (could be WAITING, ACTIVE, or COMPLETED)
    query = Queue.query.join(Appointment).filter(
        Appointment.patient_id == patient_id,
        db.func.date(Appointment.appointment_date) == today
    )
    if appointment_id:
        query = query.filter(Appointment.id == appointment_id)
        
    queue_entry = query.first()
    
    if not queue_entry:
        return {"error": "No active check-in found for this patient today."}
        
    # Check doctor session status
    session = queue_entry.appointment.session if queue_entry.appointment else None
    if session and session.status == "NOT_STARTED":
        return {"error": "Your doctor session has not started yet. You cannot check out at this time."}
        
    # Reject checkout if they are still waiting or active in the queue
    if queue_entry.status in ["WAITING", "ACTIVE"]:
        return {"error": "You are still in the queue. You can only check out after your consultation has been completed by the doctor."}
        
    # If the doctor already completed their session (status is COMPLETED)
    if queue_entry.status == "COMPLETED":
        # Check if they already checked out (check_out_time is set)
        if queue_entry.check_out_time is not None:
            return {"success": True, "message": "Already checked out."}
            
    # Perform checkout: record check-out time and ensure it is COMPLETED/Completed
    queue_entry.status = "COMPLETED"
    queue_entry.check_out_time = datetime.now(timezone.utc)
    if not queue_entry.completed_at:
        queue_entry.completed_at = datetime.now(timezone.utc)
    if queue_entry.appointment:
        queue_entry.appointment.status = "Completed"
        
    db.session.commit()
    
    # EMIT REAL-TIME UPDATE
    socketio.emit('queue_updated', {'type': 'check_out', 'patient_id': patient_id})
    socketio.emit('stats_updated', {'type': 'check_out', 'patient_id': patient_id})
    if queue_entry.appointment and queue_entry.appointment.specialist_id:
        socketio.emit('specialist_updated', {'specialist_id': queue_entry.appointment.specialist_id})
    
    # Trigger Notifications
    patient = Patient.query.get(patient_id)
    notifications = {"email": "skipped", "whatsapp": "skipped"}
    
    if patient:
        if patient.email:
            email_sent = send_checkout_notification(patient.email, patient.full_name)
            notifications["email"] = "sent" if email_sent else "failed"
        whatsapp_numbers = get_patient_whatsapp_numbers(patient)
        if whatsapp_numbers:
            wa_sent = send_checkout_whatsapp(whatsapp_numbers, patient.full_name)
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
    if patient_id is not None:
        try:
            if isinstance(patient_id, str):
                pid_str = patient_id.strip().lower()
                if pid_str in ("undefined", "null", ""):
                    patient_id = None
                else:
                    patient_id = int(patient_id)
            else:
                patient_id = int(patient_id)
        except (ValueError, TypeError):
            patient_id = None

    if not patient_id:
        return None

    today = date.today()
    queue_entry = Queue.query.join(Appointment).filter(
        Appointment.patient_id == patient_id,
        db.func.date(Appointment.appointment_date) == today,
        _active_queue_status_filter()
    ).first()
    
    if not queue_entry:
        return None
        
    # Count people ahead in the same session based on check-in time
    people_ahead = Queue.query.filter(
        Queue.status == "WAITING",
        Queue.doctor_session_id == queue_entry.doctor_session_id,
        Queue.check_in_time < queue_entry.check_in_time
    ).count()
    
    session = queue_entry.appointment.session
    session_num = session.session_number if session else 1
    token = f"S{session_num}-{queue_entry.queue_number:02d}"
    
    return {
        "token": token,
        "doctor": queue_entry.appointment.specialist.name,
        "department": queue_entry.appointment.specialist.department if queue_entry.appointment.specialist else "General",
        "room": session.room_number if session else "TBD",
        "people_ahead": people_ahead,
        "estimated_wait": people_ahead * 10,
        "session_name": f"Session {session_num}" if session else "Active Session",
        "time": session.start_time.strftime("%I:%M %p") if session else "TBD",
        "date": queue_entry.appointment.appointment_date.strftime("%Y-%m-%d"),
        "status": "In Queue",
        "session_status": session.status if session else "ACTIVE",
        "is_serving": queue_entry.status and queue_entry.status.upper() == "ACTIVE",
        "appointment_id": queue_entry.appointment_id,
        "specialist_id": queue_entry.appointment.specialist_id
    }

def get_all_queues_status():
    """
    Returns the current status of all active queues across departments.
    """
    today = date.today()
    
    # Get all WAITING or Active queue entries for today
    # Filter by appointment date and ensure we only get entries that have a session
    active_queues = Queue.query.join(Appointment).filter(
        db.func.date(Appointment.appointment_date) == today,
        _active_queue_status_filter()
    ).order_by(db.case({ "ACTIVE": 0, "WAITING": 1 }, value=db.func.upper(Queue.status)), Queue.check_in_time.asc()).all()
    
    status_map = {}
    
    for qe in active_queues:
        session = qe.appointment.session
        if not session: continue
        
        dept = qe.appointment.specialist.department or "General"
        room = session.room_number or "TBA"
        session_id = session.id
        session_num = session.session_number if session.session_number is not None else 1
        session_name = f"Session {session_num}"
        
        # Key by session_id to ensure absolute isolation
        if session_id not in status_map:
            status_map[session_id] = {
                "department": dept,
                "room": room,
                "session": session_name,
                "session_status": session.status,
                "doctor": qe.appointment.specialist.name,
                "token": "---", # Default to no one serving
                "status": "NEXT"
            }
        
        # If we found an ACTIVE patient for this session, they take priority as "NOW SERVING"
        if qe.status and qe.status.upper() == "ACTIVE":
            token = f"S{session_num}-{qe.queue_number:02d}"
            status_map[session_id].update({
                "token": token,
                "status": "NOW SERVING"
            })
        # If no one is active yet, we can show the first WAITING patient as "NEXT"
        elif status_map[session_id]["token"] == "---":
             token = f"S{session_num}-{qe.queue_number:02d}"
             status_map[session_id].update({
                "token": token,
                "status": "NEXT"
            })
            
    return list(status_map.values())
    
def start_session(doctor_session_id):
    """
    Starts a doctor's session, moving it from NOT_STARTED to ACTIVE.
    """
    from app.models.doctor_session import DoctorSession
    session = DoctorSession.query.get(doctor_session_id)
    if not session:
        return {"error": "Session not found."}
        
    session.status = "ACTIVE"
    db.session.commit()
    
    # EMIT REAL-TIME UPDATE
    socketio.emit('session_status_changed', {'doctor_session_id': doctor_session_id, 'status': 'ACTIVE'})
    socketio.emit('queue_updated', {'type': 'session_start', 'doctor_session_id': doctor_session_id})
    
    return {"success": True, "message": "Session started.", "new_status": "ACTIVE"}

def call_next_patient(doctor_session_id):
    """
    Completes the current active patient and calls the next one from the waiting list.
    """
    from app.models.doctor_session import DoctorSession
    session = DoctorSession.query.get(doctor_session_id)
    
    if not session:
        return {"error": "Session not found."}
        
    # SESSION STATUS GUARDS
    if session.status == "NOT_STARTED":
        return {"error": "Session has not started yet."}
    if session.status == "PAUSED":
        return {"error": "Session is currently paused."}
    if session.status == "ENDED":
        return {"error": "Session has ended."}
    if session.status == "Cancelled":
        return {"error": "Session has been cancelled."}

    # 1. Complete the currently active patient for this session
    active_qe = Queue.query.join(Appointment).filter(
        Appointment.doctor_session_id == doctor_session_id,
        db.func.upper(Queue.status) == "ACTIVE"
    ).first()
    
    if active_qe:
        active_qe.status = "COMPLETED"
        active_qe.completed_at = datetime.now(timezone.utc)
        active_qe.appointment.status = "Completed"
    
    # 2. Call the next patient in WAITING
    next_qe = Queue.query.join(Appointment).filter(
        Appointment.doctor_session_id == doctor_session_id,
        Queue.status == "WAITING"
    ).order_by(Queue.check_in_time.asc()).first()
    
    if not next_qe:
        db.session.commit()
        return {"success": True, "message": "Queue cleared. No more patients waiting."}
    
    next_qe.status = "ACTIVE"
    db.session.commit()
    
    # EMIT REAL-TIME UPDATE
    session_num = next_qe.appointment.session.session_number if next_qe.appointment.session else 1
    token = f"S{session_num}-{next_qe.queue_number:02d}"
    
    socketio.emit('queue_updated', {
        'type': 'call_next', 
        'doctor_session_id': doctor_session_id,
        'token': token,
        'patient_name': next_qe.appointment.patient.full_name,
        'room': next_qe.appointment.session.room_number if next_qe.appointment.session else "TBA"
    })
    socketio.emit('session_status_changed', {'doctor_session_id': doctor_session_id, 'status': 'ACTIVE'})
    socketio.emit('specialist_updated', {'specialist_id': session.specialist_id})
    
    return {
        "success": True, 
        "message": f"Calling next patient: {next_qe.appointment.patient.full_name}",
        "queue_number": next_qe.queue_number,
        "patient_name": next_qe.appointment.patient.full_name
    }

def toggle_session_pause(doctor_session_id):
    """
    Pauses or resumes a doctor's session.
    """
    from app.models.doctor_session import DoctorSession
    session = DoctorSession.query.get(doctor_session_id)
    if not session:
        return {"error": "Session not found."}
    
    if session.status and session.status.upper() == "PAUSED":
        session.status = "ACTIVE"
        msg = "Session resumed."
    elif (session.status and session.status.upper() == "ACTIVE") or not session.status or session.status == "Active":
        session.status = "PAUSED"
        msg = "Session paused."
    else:
        return {"error": f"Cannot pause/resume session in {session.status} state."}
        
    db.session.commit()
    
    # EMIT REAL-TIME UPDATE
    socketio.emit('session_status_changed', {'doctor_session_id': doctor_session_id, 'status': session.status})
    socketio.emit('queue_updated', {'type': 'session_toggle', 'doctor_session_id': doctor_session_id})

    return {"success": True, "message": msg, "new_status": session.status}

def end_session(doctor_session_id):
    """
    Ends a session and cancels all remaining waiting patients.
    """
    from app.models.doctor_session import DoctorSession
    session = DoctorSession.query.get(doctor_session_id)
    if not session:
        return {"error": "Session not found."}
        
    # Cancel all WAITING patients
    waiting_qes = Queue.query.join(Appointment).filter(
        Appointment.doctor_session_id == doctor_session_id,
        Queue.status == "WAITING"
    ).all()
    
    for qe in waiting_qes:
        qe.status = "NEEDS_RESCHEDULE"
        qe.appointment.status = "Needs Reschedule"
        
    session.status = "ENDED"
    db.session.commit()
    
    # EMIT REAL-TIME UPDATE
    socketio.emit('session_status_changed', {'doctor_session_id': doctor_session_id, 'status': 'ENDED'})
    socketio.emit('queue_updated', {'type': 'session_end', 'doctor_session_id': doctor_session_id})
    socketio.emit('specialist_updated', {'specialist_id': session.specialist_id})
    
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
    if qe.appointment and qe.appointment.specialist_id:
        socketio.emit('specialist_updated', {'specialist_id': qe.appointment.specialist_id})
    
    return { "success": True, "message": "Patient marked as missed." }

def get_all_sessions_queues():
    """
    Returns detailed queue data for all active doctor sessions today.
    Used by Admin Queue Control Center.
    """
    today = date.today()
    from app.models.doctor_session import DoctorSession
    
    # Get all sessions for today
    current_day = datetime.now().strftime("%A")
    sessions = DoctorSession.query.filter(
        (DoctorSession.day_of_week == current_day) | (DoctorSession.session_date == today),
        DoctorSession.status != "Cancelled"
    ).all()
    
    results = []
    for session in sessions:
        # Get active patient
        active_qe = Queue.query.join(Appointment).filter(
            Appointment.doctor_session_id == session.id,
            db.func.date(Appointment.appointment_date) == today,
            db.func.upper(Queue.status) == "ACTIVE"
        ).first()
        
        # Get waiting list
        waiting_qes = Queue.query.join(Appointment).filter(
            Appointment.doctor_session_id == session.id,
            db.func.date(Appointment.appointment_date) == today,
            Queue.status == "WAITING"
        ).order_by(Queue.check_in_time.asc()).all()
        
        waiting_list = []
        session_num = session.session_number if session.session_number is not None else 1
        for i, qe in enumerate(waiting_qes):
            smart_wait = i * 10 # 10 mins per person strictly ahead of them
            waiting_list.append({
                "id": qe.id,
                "token": f"S{session_num}-{qe.queue_number:02d}",
                "patient": qe.appointment.patient.full_name if qe.appointment.patient else "Unknown",
                "patient_id": qe.appointment.patient_id,
                "waitTime": f"{smart_wait}m",
                "priority": qe.appointment.priority_level
            })
            
        results.append({
            "session_id": session.id,
            "session_number": session_num,
            "doctor": session.specialist.name if session.specialist else "N/A",
            "department": session.specialist.department if session.specialist else "N/A",
            "room": session.room_number or "N/A",
            "status": session.status,
            "current_patient": {
                "id": active_qe.id,
                "token": f"S{session_num}-{active_qe.queue_number:02d}",
                "name": active_qe.appointment.patient.full_name if active_qe.appointment and active_qe.appointment.patient else "Unknown"
            } if active_qe else None,
            "waiting_count": len(waiting_list),
            "waiting_list": waiting_list
        })
        
    return results
