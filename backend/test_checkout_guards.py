import sys
import os
from datetime import datetime, time, date, timezone

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import Specialist, DoctorSession, Patient, Appointment, Queue, Payment, Review
from app.services.queue_service import check_in_patient, check_out_patient

def run_tests():
    app = create_app()
    with app.app_context():
        print("\n=== STARTING NEW CHECK-OUT GUARD AUTOMATED TESTING ===\n")
        
        # 1. Setup fresh test specialist, session, patient, and appointment
        today_date = date.today()
        
        # Clean up any existing test records in correct order to respect foreign key constraints
        Review.query.delete()
        Payment.query.delete()
        Queue.query.delete()
        Appointment.query.delete()
        DoctorSession.query.delete()
        Patient.query.filter_by(nic="999999999V").delete()
        Specialist.query.filter_by(name="Guard Tester").delete()
        db.session.commit()
        
        spec = Specialist(
            name="Guard Tester",
            department="Pediatrics",
            specialization="Pediatrician",
            consultation_fee=2500.0,
            availability_status="Available"
        )
        db.session.add(spec)
        db.session.flush()
        
        session = DoctorSession(
            specialist_id=spec.id,
            session_date=today_date,
            start_time=time(10, 0),
            end_time=time(14, 0),
            status="NOT_STARTED",
            room_number="Room 10"
        )
        db.session.add(session)
        db.session.flush()
        
        patient = Patient(
            full_name="Guard Test Patient",
            nic="999999999V",
            phone_number="0779999999",
            age=30,
            gender="Male"
        )
        db.session.add(patient)
        db.session.flush()
        
        appt = Appointment(
            patient_id=patient.id,
            specialist_id=spec.id,
            doctor_session_id=session.id,
            appointment_date=datetime.now(),
            symptom="Fever",
            status="Scheduled"
        )
        db.session.add(appt)
        db.session.commit()
        
        print("Setup complete:")
        print(f" - Patient: {patient.full_name} (ID: {patient.id})")
        print(f" - Specialist: {spec.name} (ID: {spec.id})")
        print(f" - Session Status: {session.status} (ID: {session.id})")
        
        # 2. Check-In Patient
        print("\nChecking in patient...")
        checkin_res = check_in_patient(patient.id, appt.id)
        print(f"Check-In Response: {checkin_res}")
        
        queue_entry = Queue.query.filter_by(appointment_id=appt.id).first()
        print(f"Queue Entry created. Status: {queue_entry.status if queue_entry else 'None'}")
        
        # 3. Test Phase 1: Checkout when session is NOT_STARTED
        print("\nTest Phase 1: Attempting checkout when session is NOT_STARTED...")
        checkout_res1 = check_out_patient(patient.id)
        print(f"Result: {checkout_res1}")
        assert "error" in checkout_res1, "Should have failed checkout!"
        assert "not started" in checkout_res1["error"].lower(), "Should specify that session has not started!"
        print("SUCCESS: Correctly blocked checkout because doctor session has not started!")
        
        # 4. Test Phase 2: Checkout when session is ACTIVE but patient is WAITING in queue
        print("\nActivating doctor session...")
        session.status = "ACTIVE"
        db.session.commit()
        print(f"Session Status is now: {session.status}")
        
        print("Test Phase 2: Attempting checkout when patient is WAITING in the queue...")
        checkout_res2 = check_out_patient(patient.id)
        print(f"Result: {checkout_res2}")
        assert "error" in checkout_res2, "Should have failed checkout!"
        assert "still in the queue" in checkout_res2["error"].lower(), "Should specify patient is still in queue!"
        print("SUCCESS: Correctly blocked checkout because patient is still waiting in the queue!")
        
        # 5. Test Phase 3: Checkout when patient is completed by doctor
        print("\nDoctor completes consultation (simulated by setting queue status to COMPLETED)...")
        queue_entry.status = "COMPLETED"
        queue_entry.appointment.status = "Completed"
        db.session.commit()
        
        print("Test Phase 3: Attempting checkout when patient has been completed...")
        checkout_res3 = check_out_patient(patient.id)
        print(f"Result: {checkout_res3}")
        assert checkout_res3.get("success") is True, "Checkout should have succeeded!"
        print("SUCCESS: Correctly allowed checkout after consultation completion!")
        
        print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
