import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Mock face_recognition before importing app
import sys
from unittest.mock import MagicMock
sys.modules["face_recognition"] = MagicMock()

from app import create_app
from app.services.chatbot_service import process_message, user_states
from app.models import Specialist, Department, DoctorSession
from app.extensions import db

def test_booking_flow():
    app = create_app()
    with app.app_context():
        # Clear states
        user_states.clear()
        
        print("--- Testing Booking Flow: 'book appointment' -> 'Cardiology' ---")
        
        # 1. User says "book appointment"
        response1 = process_message("book appointment")
        print(f"User: book appointment")
        print(f"Bot: {response1['reply']}")
        
        # Verify state is now booking_department_selection
        state = user_states.get("anonymous")
        print(f"Current State: {state['step']}")
        assert state['step'] == "booking_department_selection"
        
        # 2. User says "Cardiology"
        response2 = process_message("Cardiology")
        print(f"User: Cardiology")
        print(f"Bot: {response2['reply']}")
        
        # Verify it didn't ask for symptoms
        assert "symptom" not in response2['reply'].lower()
        assert "describe" not in response2['reply'].lower()
        
        # Verify state transitioned or showed doctors
        state = user_states.get("anonymous")
        print(f"New State: {state['step']}")
        
        if "I found Dr." in response2['reply']:
            assert state['step'] == "booking_select_doctor"
        elif "I found" in response2['reply'] and "doctors" in response2['reply']:
            assert state['step'] == "booking_select_doctor"
        elif "No Cardiology doctors" in response2['reply']:
            assert state['step'] == "booking_department_selection"
            return
        
        # 3. User selects a doctor (e.g. the first one found or just a name)
        # For simplicity, let's assume "Dr. John" was in the list or we just send a name
        from app.models import Specialist
        doc = Specialist.query.filter(Specialist.department.ilike("%Cardiology%")).first()
        if not doc:
            print("No cardiology doctor found in DB to continue test.")
            return

        response3 = process_message(doc.name)
        print(f"User: {doc.name}")
        print(f"Bot: {response3['reply']}")
        assert "NIC" in response3['reply']
        assert user_states["anonymous"]["step"] == "booking_collect_info"
        assert user_states["anonymous"]["last_asked"] == "nic"

        # 4. User provides NIC
        response4 = process_message("199012345678")
        print(f"User: 199012345678")
        print(f"Bot: {response4['reply']}")
        assert "name" in response4['reply'].lower() or "welcome back" in response4['reply'].lower()
        
        if "welcome back" in response4['reply'].lower():
            assert user_states["anonymous"]["last_asked"] == "phone"
        else:
            assert user_states["anonymous"]["last_asked"] == "name"
            # 5. User provides Name
            response5 = process_message("John Doe")
            print(f"User: John Doe")
            print(f"Bot: {response5['reply']}")
            assert "phone" in response5['reply'].lower()
            assert user_states["anonymous"]["last_asked"] == "phone"
            
            # 6. User provides Phone
            response6 = process_message("0771234567")
            print(f"User: 0771234567")
            print(f"Bot: {response6['reply']}")
            assert "sessions" in response6['reply'].lower()
            assert len(response6.get("actions", [])) > 0
            assert user_states["anonymous"]["last_asked"] == "datetime"
            
            # 7. User selects a session
            session_payload = response6["actions"][0]["payload"]
            response7 = process_message(session_payload)
            print(f"User selected session: {session_payload}")
            print(f"Bot: {response7['reply']}")
            assert "confirm" in response7['reply'].lower()
            assert "Dr." in response7['reply']
            assert user_states["anonymous"]["step"] == "final_booking_confirmation"
            
            # 8. User confirms
            response8 = process_message("confirm_booking")
            print(f"User: confirm_booking")
            print(f"Bot: {response8['reply']}")
            assert "confirmed" in response8['reply'].lower()
            assert user_states["anonymous"]["step"] == "idle"
        
        print("--- Test Passed! ---")

def test_returning_patient_flow():
    app = create_app()
    with app.app_context():
        # Clear states
        user_states.clear()
        
        # Ensure a patient exists in DB for testing
        from app.models import Patient
        test_nic = "111111111V"
        patient = Patient.query.filter_by(nic=test_nic).first()
        if not patient:
            patient = Patient(full_name="Existing User", nic=test_nic, phone_number="0771234567")
            db.session.add(patient)
            db.session.commit()
            
        print(f"\n--- Testing Returning Patient Flow: NIC {test_nic} ---")
        
        # 1. Start booking
        process_message("book appointment")
        process_message("Cardiology")
        
        # 2. Select doctor
        from app.models import Specialist
        doc = Specialist.query.filter(Specialist.department.ilike("%Cardiology%")).first()
        process_message(doc.name)
        
        # 3. Provide existing NIC
        response = process_message(test_nic)
        print(f"User: {test_nic}")
        print(f"Bot: {response['reply']}")
        
        assert "Welcome back" in response['reply']
        assert "Existing" in response['reply']
        assert user_states["anonymous"]["last_asked"] == "phone"
        assert user_states["anonymous"]["data"]["full_name"] == "Existing User"
        
        # 4. Confirm phone
        response_phone = process_message("0771234567")
        print(f"User: 0771234567")
        print(f"Bot: {response_phone['reply']}")
        assert "sessions" in response_phone['reply'].lower()
        
        # 5. Select session
        session_payload = response_phone["actions"][0]["payload"]
        response_summary = process_message(session_payload)
        print(f"User selected session: {session_payload}")
        print(f"Bot: {response_summary['reply']}")
        assert "confirm" in response_summary['reply'].lower()
        
        # 6. Confirm
        response_final = process_message("yes")
        print(f"User: yes")
        print(f"Bot: {response_final['reply']}")
        assert "confirmed" in response_final['reply'].lower()
        
        print("--- Returning Patient Test Passed! ---")

if __name__ == "__main__":
    test_booking_flow()
    test_returning_patient_flow()
