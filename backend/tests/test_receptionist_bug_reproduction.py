import sys
import os

# Mock face_recognition before importing app
import sys
from unittest.mock import MagicMock
sys.modules["face_recognition"] = MagicMock()

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.services.chatbot_service import process_message, user_states
from app.models import Specialist, Department
from app.extensions import db
from datetime import datetime, timedelta

def test_new_patient_persistence():
    app = create_app()
    with app.app_context():
        # Setup: Ensure we have a doctor and session
        doctor = Specialist.query.first()
        if not doctor:
            print("No specialists found in DB!")
            return
        
        from app.models.doctor_session import DoctorSession
        session = DoctorSession.query.filter_by(specialist_id=doctor.id, status="Active").first()
        if not session:
            print(f"Creating mock session for Dr. {doctor.name}")
            session = DoctorSession(
                specialist_id=doctor.id,
                day_of_week=datetime.now().strftime("%A"),
                start_time=datetime.now().time(),
                end_time=(datetime.now() + timedelta(hours=2)).time(),
                max_patients=10,
                room_number="101",
                status="Active"
            )
            db.session.add(session)
            db.session.commit()

        user_states["anonymous"] = {"step": "idle"}
        
        print("\n--- Reproduction: New Patient State Persistence ---")
        
        # 1. Start booking for a doctor
        print(f"Step 1: Book {doctor.name}")
        resp = process_message(f"book {doctor.name}", patient_id=None)
        assert "NIC" in resp['reply']
        
        # 2. Enter NEW NIC
        import random
        new_nic = f"99{random.randint(1000000, 9999999)}V"
        print(f"Step 2: Enter New NIC {new_nic}")
        resp = process_message(new_nic, patient_id=None)
        assert "full name" in resp['reply']
        
        # 3. Enter Name
        print("Step 3: Enter Name 'John Doe'")
        resp = process_message("John Doe", patient_id=None)
        assert "phone number" in resp['reply']
        
        # 4. Enter Phone
        print("Step 4: Enter Phone 0771234567")
        resp = process_message("0771234567", patient_id=None)
        assert "choose one" in resp['reply']
        
        # 5. Select first session
        print("Step 5: Select first session")
        session_payload = resp['actions'][0]['payload']
        resp = process_message(session_payload, patient_id=None)
        assert "confirm" in resp['reply']
        
        # 6. Confirm Booking
        print("Step 6: Confirm Booking")
        resp = process_message("yes confirm it", patient_id=None)
        print(f"Final Reply: {resp['reply']}")
        
        # 7. Verify in DB
        from app.models import Patient, Appointment
        all_p = Patient.query.all()
        all_a = Appointment.query.all()
        print(f"Total patients in DB: {len(all_p)}")
        print(f"Total appointments in DB: {len(all_a)}")
        
        p = Patient.query.filter_by(nic=new_nic).first()
        if p:
            print(f"SUCCESS: Patient {p.full_name} created/found with NIC {new_nic}!")
            appt = Appointment.query.filter_by(patient_id=p.id).order_by(Appointment.created_at.desc()).first()
            if appt:
                print(f"SUCCESS: Appointment created for {p.full_name}! (Specialist ID: {appt.specialist_id})")
            else:
                print("FAILURE: Appointment NOT created for this patient!")
        else:
            # Maybe found by phone?
            p_by_phone = Patient.query.filter_by(phone_number="0771234567").first()
            if p_by_phone:
                print(f"Found patient by phone instead: {p_by_phone.full_name}, NIC: {p_by_phone.nic}")
            print(f"FAILURE: Patient with NIC {new_nic} NOT found in DB!")

        print("\n--- Reproduction Finished ---")

if __name__ == "__main__":
    test_new_patient_persistence()
