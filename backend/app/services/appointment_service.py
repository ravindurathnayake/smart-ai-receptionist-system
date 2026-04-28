from datetime import datetime, timezone
from app.extensions import db, socketio
from app.models import Patient, Appointment, Queue, Specialist


def move_appointment(appointment_id, new_date, new_doctor_session_id=None):
    appt = Appointment.query.get(appointment_id)
    if not appt:
        raise Exception("Appointment not found")
    
    if appt.status in ["Completed", "Cancelled"]:
        raise Exception(f"Cannot reschedule a {appt.status} appointment")
    
    # If there's an active queue for this appointment, cancel it
    if appt.queue and appt.queue.status == "WAITING":
        db.session.delete(appt.queue)

    appt.appointment_date = new_date
    if new_doctor_session_id:
        appt.doctor_session_id = new_doctor_session_id
    
    appt.status = "Rescheduled" # Updated status to Rescheduled after reschedule
    db.session.commit()

    # EMIT REAL-TIME UPDATE
    socketio.emit('appointment_rescheduled', {
        'appointment_id': appt.id,
        'doctor_session_id': appt.doctor_session_id,
        'date': appt.appointment_date.strftime("%Y-%m-%d") if isinstance(appt.appointment_date, datetime) else str(appt.appointment_date)
    })

    return appt

def get_specialist_availability(specialist_id, target_date_str):
    """
    Returns available sessions for a specialist on a given date.
    """
    from app.models.doctor_session import DoctorSession
    target_date = datetime.fromisoformat(target_date_str).date()
    day_name = target_date.strftime("%A")
    
    sessions = DoctorSession.query.filter(
        DoctorSession.specialist_id == specialist_id,
        ((DoctorSession.day_of_week == day_name) | (DoctorSession.session_date == target_date)),
        DoctorSession.status != "Cancelled"
    ).all()
    
    available_sessions = []
    for sess in sessions:
        # Calculate current bookings for this session on this date
        booking_count = Appointment.query.filter(
            Appointment.doctor_session_id == sess.id,
            db.func.date(Appointment.appointment_date) == target_date,
            Appointment.status != "Cancelled"
        ).count()
        
        if booking_count < sess.max_patients:
            available_sessions.append({
                "id": sess.id,
                "start_time": sess.start_time.strftime("%I:%M %p"),
                "end_time": sess.end_time.strftime("%I:%M %p"),
                "room": sess.room_number,
                "available_slots": sess.max_patients - booking_count,
                "session_number": sess.session_number
            })
            
    return available_sessions


def book_appointment(full_name, phone_number, specialist_id, symptom, appointment_date, doctor_session_id=None, patient_id=None):
    """
    Handles full appointment booking logic:
    - Finds or creates patient
    - Creates appointment
    - Generates queue number
    - Calculates estimated wait time
    - Creates queue record
    """

    # 1️⃣ Find or Create Patient
    patient = None
    if patient_id:
        patient = Patient.query.get(patient_id)
    
    if not patient and phone_number:
        patient = Patient.query.filter_by(phone_number=phone_number).first()
        
    if not patient:
        patient = Patient(
            full_name=full_name,
            phone_number=phone_number
        )
        db.session.add(patient)
        db.session.commit()
    else:
        # Update name if it was missing or different (optional)
        if full_name and not patient.full_name:
            patient.full_name = full_name
            db.session.commit()

    # Validate specialist exists
    specialist = Specialist.query.get(specialist_id)
    if not specialist:
        return {
            "error": "Specialist not found"
        }

    # 2️⃣ Create Appointment
    appointment = Appointment(
        patient_id=patient.id,
        specialist_id=specialist_id,
        symptom=symptom,
        appointment_date=appointment_date,
        doctor_session_id=doctor_session_id,
        status="Booked"
    )
    db.session.add(appointment)
    db.session.commit()

    # EMIT REAL-TIME UPDATE
    socketio.emit('appointment_booked', {
        'doctor_session_id': doctor_session_id,
        'date': str(appointment_date)
    })

    return {
        "appointment_id": appointment.id,
        "patient_id": patient.id,
        "status": "Booked",
        "message": "Appointment reserved. Please check-in upon arrival to get your queue number."
    }


def get_queue_status():
    """
    Returns overall queue status for today
    """
    from datetime import date
    today = date.today()

    # Filter by entries created today (Include WAITING to show who is next)
    today_active = Queue.query.join(Appointment).filter(
        db.func.date(Appointment.appointment_date) == today,
        Queue.status.in_(["ACTIVE", "WAITING"])
    ).order_by(db.case({ "ACTIVE": 0, "WAITING": 1 }, value=Queue.status), Queue.check_in_time.asc()).all()

    # Format the list for the frontend
    queue_list = []
    active_tokens = []
    for i, q in enumerate(today_active):
        appointment = q.appointment
        if not appointment:
            continue
            
        patient_name = appointment.patient.full_name if appointment.patient else "Unknown"
        specialist_name = appointment.specialist.name if appointment.specialist else "Unknown"
        session = appointment.session
        session_num = session.session_number if (session and session.session_number is not None) else 1
        session_name = f"S{session_num}"
        
        token = f"{session_name}-{q.queue_number:02d}"
        active_tokens.append(token)
        
        queue_list.append({
            "id": q.id,
            "token": token,
            "patient": patient_name,
            "doctor": specialist_name if specialist_name.startswith('Dr.') else f"Dr. {specialist_name}",
            "status": "Serving" if (q.status and q.status.upper() == "ACTIVE") else "Waiting",
            "waitTime": "0m" if (q.status and q.status.upper() == "ACTIVE") else f"{i * 10}m",
            "room": session.room_number if session else "04"
        })

    active_serving = [t for t, s in zip(active_tokens, [q.status for q in today_active]) if s and s.upper() == "ACTIVE"]

    # Get session statuses summary
    from app.models.doctor_session import DoctorSession
    sessions_today = DoctorSession.query.filter(
        (DoctorSession.day_of_week == datetime.now().strftime("%A")) | (DoctorSession.session_date == today),
        DoctorSession.status != "Cancelled"
    ).all()
    session_statuses = {s.id: s.status for s in sessions_today}

    return {
        "current_serving": active_serving[0] if active_serving else "---",
        "session_statuses": session_statuses,
        "total_waiting": Queue.query.join(Appointment).filter(db.func.date(Appointment.appointment_date) == today, Queue.status == "WAITING").count(),
        "estimated_wait_time": 0 if not queue_list else (len([q for q in queue_list if q['status'] == 'Waiting']) * 10),
        "queue": queue_list
    }


def get_patient_queue_info(patient_id):
    """
    Returns specific queue info for a patient if they have an active session,
    otherwise returns their next upcoming appointment.
    """
    from datetime import date, datetime
    today = date.today()

    # 1. Try to find active queue entry for this patient today
    queue_entry = Queue.query.join(Appointment).filter(
        Appointment.patient_id == patient_id,
        db.func.date(Appointment.appointment_date) == today,
        Queue.status.in_(["Active", "WAITING"])
    ).first()

    if queue_entry:
        # Calculate people ahead in the SAME SESSION based on check-in time
        people_ahead = Queue.query.filter(
            Queue.doctor_session_id == queue_entry.doctor_session_id,
            Queue.check_in_time < queue_entry.check_in_time,
            Queue.status == "WAITING"
        ).count()
        
        session = queue_entry.appointment.session
        session_num = session.session_number if (session and session.session_number is not None) else 1
        session_name = f"Session {session_num}"
        token = f"S{session_num}-{queue_entry.queue_number:02d}"
        
        return {
            "token": token,
            "people_ahead": people_ahead,
            "estimated_wait": people_ahead * 10,
            "doctor": queue_entry.appointment.specialist.name,
            "department": queue_entry.appointment.specialist.department,
            "room": session.room_number if session else "TBD",
            "session_name": session_name,
            "time": session.start_time.strftime("%I:%M %p") if session else "TBD",
            "date": queue_entry.appointment.appointment_date.strftime("%Y-%m-%d"),
            "status": "In Queue",
            "session_status": session.status if session else "ACTIVE",
            "is_serving": queue_entry.status and queue_entry.status.upper() == "ACTIVE",
            "appointment_id": queue_entry.appointment_id,
            "specialist_id": queue_entry.appointment.specialist_id
        }

    # 2. If no active queue, find the next upcoming appointment
    upcoming = Appointment.query.filter(
        Appointment.patient_id == patient_id,
        Appointment.appointment_date >= datetime.now(),
        Appointment.status == "Booked"
    ).order_by(Appointment.appointment_date.asc()).first()

    if upcoming:
        return {
            "token": "Wait",
            "people_ahead": "---",
            "estimated_wait": "Check-in req.",
            "doctor": upcoming.specialist.name,
            "department": upcoming.specialist.department,
            "room": upcoming.session.room_number if upcoming.session else "TBD",
            "time": upcoming.session.start_time.strftime("%I:%M %p") if upcoming.session else "TBD",
            "date": upcoming.appointment_date.strftime("%Y-%m-%d"),
            "status": "Scheduled",
            "appointment_id": upcoming.id,
            "specialist_id": upcoming.specialist_id
        }

    return None


def get_all_specialists():
    """
    Returns list of all specialists with enriched session and booking data
    """
    from datetime import date
    today = date.today()
    specialists = Specialist.query.all()

    result = []
    for s in specialists:
        result.append({
            "id": s.id,
            "name": s.name,
            "title": s.title,
            "email": s.email,
            "phone_number": s.phone_number,
            "department": s.department,
            "department_id": s.department_id,
            "specialization": s.specialization,
            "experience_years": s.experience_years,
            "rating": s.rating,
            "languages": s.languages,
            "consultation_fee": s.consultation_fee,
            "profile_image": s.profile_image,
            "availability_status": s.availability_status,
            "bio": s.bio,
            "sessions": [{
                "id": sess.id,
                "day_of_week": sess.day_of_week,
                "session_date": sess.session_date.strftime("%Y-%m-%d") if sess.session_date else None,
                "start_time": sess.start_time.strftime("%H:%M"),
                "end_time": sess.end_time.strftime("%H:%M"),
                "max_patients": sess.max_patients,
                "current_bookings": Appointment.query.filter(
                    Appointment.doctor_session_id == sess.id,
                    db.func.date(Appointment.appointment_date) == (sess.session_date if sess.session_date else today),
                    Appointment.status != "Cancelled"
                ).count(),
                "session_number": sess.session_number,
                "room_number": sess.room_number
            } for sess in s.sessions]
        })

    return result

def complete_queue(queue_id):
    """
    Marks a queue entry as completed
    """

    queue = Queue.query.get(queue_id)

    if not queue:
        return None

    queue.status = "Completed"
    queue.completed_at = datetime.now(timezone.utc)

    db.session.commit()

    return {
        "queue_id": queue.id,
        "status": queue.status
    }

def get_all_appointments():
    """
    Returns list of all appointments for admin view
    """
    appointments = Appointment.query.order_by(Appointment.created_at.desc()).all()
    
    result = []
    for apt in appointments:
        result.append({
            "id": f"#APT-{apt.id:04d}",
            "raw_id": apt.id,
            "patient": apt.patient.full_name if apt.patient else "Unknown",
            "dr": apt.specialist.name if apt.specialist and apt.specialist.name.startswith('Dr.') else f"Dr. {apt.specialist.name}" if apt.specialist else "Unknown",
            "time": apt.appointment_date.strftime("%I:%M %p"),
            "date": apt.appointment_date.strftime("%Y-%m-%d"),
            "status": apt.status,
            "type": apt.symptom,
            "room": apt.session.room_number if apt.session else "Room 04",
            "session": f"Session {apt.session.session_number}" if apt.session else "Active Session",
            "department": apt.specialist.department if apt.specialist else "General",
            "specialist_id": apt.specialist_id
        })
    return result

def cancel_appointment(appointment_id):
    """
    Cancels an appointment and updates associated queue
    """

    appointment = Appointment.query.get(appointment_id)

    if not appointment:
        return None

    appointment.status = "Cancelled"

    # Find associated queue entry
    queue = Queue.query.filter_by(appointment_id=appointment_id).first()

    if queue:
        queue.status = "Cancelled"

    db.session.commit()

    # EMIT REAL-TIME UPDATE
    from app.extensions import socketio
    socketio.emit('queue_updated', {'type': 'cancel', 'appointment_id': appointment_id})

    return {
        "appointment_id": appointment.id,
        "appointment_status": appointment.status
    }