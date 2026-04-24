from datetime import datetime, timezone
from app.extensions import db
from app.models import Patient, Appointment, Queue, Specialist


def book_appointment(full_name, phone_number, specialist_id, symptom, appointment_date):
    """
    Handles full appointment booking logic:
    - Creates patient
    - Creates appointment
    - Generates queue number
    - Calculates estimated wait time
    - Creates queue record
    """

    # 1️⃣ Create Patient
    patient = Patient(
        full_name=full_name,
        phone_number=phone_number
    )
    db.session.add(patient)
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
    Returns current queue status including the list of active entries
    """
    active_queues = Queue.query.filter_by(status="Active").order_by(Queue.queue_number.asc()).all()
    
    total_waiting = len(active_queues)
    
    # "Currently serving" is usually the one with the lowest queue number among Active ones, 
    # but in some systems it might be a specific status. 
    # For now, let's assume the first active queue item is the one being served 
    # or the next one up.
    
    current_serving_number = active_queues[0].queue_number if active_queues else 0
    estimated_wait_time = active_queues[0].estimated_wait_time if active_queues else 0

    # Format the list for the frontend
    queue_list = []
    for q in active_queues:
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
        "current_serving": current_serving_number,
        "total_waiting": total_waiting,
        "estimated_wait_time": estimated_wait_time,
        "queue": queue_list
    }


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