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

def test_receptionist_chatbot():
    app = create_app()
    with app.app_context():
        print("\n--- Testing Unified Receptionist Chatbot ---")

        # 1. Test Emergency
        print("Testing Emergency...")
        resp = process_message("I can't breathe")
        print(f"Bot: {resp['reply']}")
        assert "EMERGENCY" in resp['reply']
        assert any(a['label'] == "Show Emergency Map" for a in resp['actions'])
        print("Emergency Test Passed!")

        # 2. Test Navigation
        print("\nTesting Navigation...")
        resp = process_message("where is the pharmacy?")
        print(f"Bot: {resp['reply']}")
        assert "Ground Floor" in resp['reply']
        assert any(a['label'] == "Show Map" for a in resp['actions'])
        print("Navigation Test Passed!")

        # 3. Test Payment
        print("\nTesting Payment...")
        resp = process_message("how can I pay?")
        print(f"Bot: {resp['reply']}")
        assert "Cash" in resp['reply']
        assert any(a['label'] == "Pay Now (Kiosk)" for a in resp['actions'])
        print("Payment Test Passed!")

        # 4. Test Registration
        print("\nTesting Registration...")
        resp = process_message("I am a new patient")
        print(f"Bot: {resp['reply']}")
        assert "NIC" in resp['reply']
        assert any(a['label'] == "Register Now" for a in resp['actions'])
        print("Registration Test Passed!")

        # 5. Test General Help
        print("\nTesting General Help...")
        resp = process_message("help me")
        print(f"Bot: {resp['reply']}")
        assert "MediAssist" in resp['reply']
        assert any(a['label'] == "Hospital Map" for a in resp['actions'])
        print("General Help Test Passed!")

        # 6. Test Doctor Availability
        print("\nTesting Doctor Availability...")
        resp = process_message("show doctors")
        print(f"Bot: {resp['reply']}")
        assert "specialists" in resp['reply']
        assert any(a['label'] == "View All Doctors" for a in resp['actions'])
        print("Doctor Availability Test Passed!")

        print("\n--- All Unified Receptionist Tests Passed! ---")

if __name__ == "__main__":
    test_receptionist_chatbot()
