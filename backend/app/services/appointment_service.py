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
