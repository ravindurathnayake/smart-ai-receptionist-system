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
from app.models import Patient, Appointment, Specialist, Prescription, LabReport, Department
from app.extensions import db
from datetime import datetime, timedelta

def test_patient_chatbot():
    app = create_app()
    with app.app_context():
        # Setup mock data
        dept = Department.query.filter_by(name="Cardiology").first()
        if not dept:
            dept = Department(name="Cardiology")
            db.session.add(dept)
            db.session.commit()

        spec = Specialist.query.filter_by(name="Test Doctor").first()
        if not spec:
            spec = Specialist(name="Test Doctor", department="Cardiology", department_id=dept.id)
            db.session.add(spec)
            db.session.commit()

        patient = Patient.query.filter_by(nic="PATIENT123").first()
        if not patient:
            patient = Patient(full_name="Jane Doe", nic="PATIENT123", phone_number="0771234567")
            db.session.add(patient)
            db.session.commit()

        # Add an appointment
        appt = Appointment(
            patient_id=patient.id,
            specialist_id=spec.id,
            appointment_date=datetime.now() + timedelta(days=2),
            status="Scheduled",
            symptom="Checkup"
        )
        db.session.add(appt)

        # Add a prescription
        presc = Prescription(
            patient_id=patient.id,
            doctor_name="Test Doctor",
            medications="Paracetamol 500mg",
            created_at=datetime.now() - timedelta(days=5)
        )
        db.session.add(presc)

        # Add a lab report
        report = LabReport(
            patient_id=patient.id,
            test_name="Blood Count",
            status="Completed",
            created_at=datetime.now() - timedelta(days=10)
        )
        db.session.add(report)
        db.session.commit()

        print("\n--- Testing Patient Dashboard Chatbot ---")

        # 1. Test Greeting
        print("Testing Greeting...")
        response1 = process_message("hi", patient_id=patient.id)
        print(f"Bot: {response1['reply']}")
        assert "Jane" in response1['reply']
        print("Greeting Test Passed!")

        # 2. Test Next Appointment
        print("\nTesting Next Appointment...")
        response2 = process_message("when is my next appointment", patient_id=patient.id)
        print(f"Bot: {response2['reply']}")
        assert "Dr. Test Doctor" in response2['reply']
        print("Next Appointment Test Passed!")

        # 3. Test Prescriptions
        print("\nTesting Prescriptions...")
        response3 = process_message("show my prescriptions", patient_id=patient.id)
        print(f"Bot: {response3['reply']}")
        assert "Paracetamol" in response3['reply']
        print("Prescriptions Test Passed!")

        # 4. Test Lab Reports
        print("\nTesting Lab Reports...")
        response4 = process_message("show my lab reports", patient_id=patient.id)
        print(f"Bot: {response4['reply']}")
        assert "Blood Count" in response4['reply']
        print("Lab Reports Test Passed!")

        # 5. Test Booking Flow Skip
        print("\nTesting Booking Identification Skip...")
        user_states.clear()
        response5 = process_message("book appointment", patient_id=patient.id)
        # Choose Cardiology
        response6 = process_message("Cardiology", patient_id=patient.id)
        # Choose Doctor
        response7 = process_message("Test Doctor", patient_id=patient.id)
        print(f"Bot: {response7['reply']}")
        # Should ask for datetime/session buttons, NOT NIC
        assert "available on these upcoming sessions" in response7['reply']
        print("Booking Identification Skip Passed!")

        print("\n--- All Patient Dashboard Chatbot Tests Passed! ---")

if __name__ == "__main__":
    test_patient_chatbot()
