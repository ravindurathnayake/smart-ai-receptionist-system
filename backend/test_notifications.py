from app import create_app
from app.models import Patient, Appointment, Specialist, Queue
from app.services.queue_service import check_in_patient, check_out_patient
from app.extensions import db
from datetime import date, datetime
import sys

app = create_app()

with app.app_context():
    pid = 23 # Ravindu
    patient = Patient.query.get(pid)
    print(f"--- Testing for Patient: {patient.full_name} (ID: {pid}) ---")
    
    today = date.today()
    
    # 1. CLEANUP: Delete any existing queue entries for this patient's appointments today
    q_entries = Queue.query.join(Appointment).filter(
        Appointment.patient_id == pid,
        db.func.date(Appointment.appointment_date) == today
    ).all()
    for q in q_entries:
        db.session.delete(q)
    db.session.commit()
    print("Cleaned up existing queue entries.")

    # 2. ENSURE APPOINTMENT EXISTS
    appt = Appointment.query.filter(
        Appointment.patient_id == pid,
        db.func.date(Appointment.appointment_date) == today
    ).first()
    
    if appt:
        appt.status = "Booked"
    else:
        specialist = Specialist.query.first()
        appt = Appointment(
            patient_id=pid,
            specialist_id=specialist.id,
            symptom="Test",
            appointment_date=datetime.now()
        )
        db.session.add(appt)
    db.session.commit()
    print("Appointment ready.")

    # 3. TEST CHECK-IN
    print(f"\n[STEP 1] Running check_in_patient({pid})...")
    result_in = check_in_patient(pid)
    print(f"Check-in Result: {result_in}")

    # 4. TEST CHECK-OUT
    print(f"\n[STEP 2] Running check_out_patient({pid})...")
    result_out = check_out_patient(pid)
    print(f"Check-out Result: {result_out}")
