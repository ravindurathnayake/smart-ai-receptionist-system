from datetime import datetime, timezone
from app.extensions import db
from app.models import Patient, Appointment, Queue, Specialist


def move_appointment(appointment_id, new_date, new_session_id=None):
    appt = Appointment.query.get(appointment_id)
    if not appt:
        raise Exception("Appointment not found")
    
    if appt.status in ["Completed", "Cancelled"]:
        raise Exception(f"Cannot reschedule a {appt.status} appointment")
    
    appt.appointment_date = new_date
    if new_session_id:
        appt.session_id = new_session_id
    
    db.session.commit()
    return appt


def book_appointment(full_name, phone_number, specialist_id, symptom, appointment_date, session_id=None, patient_id=None):
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
        session_id=session_id,
        status="Booked"
    )
    db.session.add(appointment)
    db.session.commit()

    # 3️⃣ Generate Next Queue Number
    last_queue = Queue.query.order_by(Queue.queue_number.desc()).first()

    if last_queue:
        next_queue_number = last_queue.queue_number + 1
    else:
        next_queue_number = 1

    # 4️⃣ Calculate Estimated Waiting Time (5 minutes per patient)
    estimated_wait_time = next_queue_number * 5

    # 5️⃣ Create Queue Entry
    queue_entry = Queue(
        appointment_id=appointment.id,
        queue_number=next_queue_number,
        estimated_wait_time=estimated_wait_time
    )
    db.session.add(queue_entry)
    db.session.commit()

    return {
        "appointment_id": appointment.id,
        "patient_id": patient.id,
        "queue_number": next_queue_number,
        "estimated_wait_time": estimated_wait_time
    }


def get_queue_status():
    """
    Returns overall queue status for today
    """
    from datetime import date
    today = date.today()

    # Filter by entries created today
    today_queue = Queue.query.filter(
        db.func.date(Queue.created_at) == today,
        Queue.status == "Active"
    )

    total_waiting = today_queue.count()
    current_serving = today_queue.order_by(Queue.id.asc()).first()

    # Format the list for the frontend
    queue_list = []
    for q in today_queue.order_by(Queue.queue_number.asc()).all():
        appointment = q.appointment
        if not appointment:
            continue
            
        patient_name = appointment.patient.full_name if appointment.patient else "Unknown"
        specialist_name = appointment.specialist.name if appointment.specialist else "Unknown"
        
        queue_list.append({
            "id": q.id,
            "token": f"A-{q.queue_number:02d}", # Formatted like in the UI
            "patient": patient_name,
            "doctor": specialist_name if specialist_name.startswith('Dr.') else f"Dr. {specialist_name}",
            "status": "Waiting", # Default as the DB status is 'Active'
            "waitTime": f"{q.estimated_wait_time}m",
            "room": "04" # Hardcoded for now as it's not in DB
        })

    return {
        "current_serving": current_serving.queue_number if current_serving else None,
        "total_waiting": total_waiting,
        "estimated_wait_time": total_waiting * 5,
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
        Queue.status == "Active"
    ).first()

    if queue_entry:
        # Calculate people ahead
        people_ahead = Queue.query.filter(
            Queue.id < queue_entry.id,
            Queue.status == "Active"
        ).count()
        
        return {
            "token": f"A-{queue_entry.queue_number:02d}",
            "people_ahead": people_ahead,
            "estimated_wait": queue_entry.estimated_wait_time,
            "doctor": queue_entry.appointment.specialist.name,
            "department": queue_entry.appointment.specialist.department,
            "room": queue_entry.appointment.session.room_number if queue_entry.appointment.session else "TBD",
            "time": queue_entry.appointment.session.start_time.strftime("%I:%M %p") if queue_entry.appointment.session else "TBD",
            "date": queue_entry.appointment.appointment_date.strftime("%Y-%m-%d"),
            "status": "In Queue",
            "appointment_id": queue_entry.appointment_id
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
            "appointment_id": upcoming.id
        }

    return None


def get_all_specialists():
    """
    Returns list of all specialists
    """
    specialists = Specialist.query.all()

    result = []
    for specialist in specialists:
        result.append({
            "id": specialist.id,
            "name": specialist.name,
            "department": specialist.department
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
            "type": apt.symptom
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

    if queue and queue.status == "Active":
        queue.status = "Cancelled"

    db.session.commit()

    return {
        "appointment_id": appointment.id,
        "appointment_status": appointment.status
    }