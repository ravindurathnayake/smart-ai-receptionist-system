import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Mock face_recognition before importing app
import sys
from unittest.mock import MagicMock
sys.modules["face_recognition"] = MagicMock()

from app import create_app
from app.services.chatbot_service import process_message, user_states, clear_user_state

def test_clear_chat_flow():
    app = create_app()
    with app.app_context():
        # Clear states first
        user_states.clear()
        
        print("--- Testing Clear Chat Flow: 'book appointment' -> Clear -> Check state ---")
        
        # 1. Start booking
        response1 = process_message("book appointment")
        print(f"User: book appointment")
        print(f"Bot: {response1['reply']}")
        
        # Verify state is now booking_department_selection
        state = user_states.get("anonymous")
        assert state is not None
        assert state['step'] == "booking_department_selection"
        
        # 2. Clear state
        clear_user_state(None)
        print("Cleared chat state for anonymous")
        
        # Verify state has returned to idle
        state = user_states.get("anonymous")
        assert state is not None
        assert state['step'] == "idle"
        assert state['data'] == {}
        
        # 3. Test for a specific patient ID
        patient_id = 999
        response2 = process_message("book appointment", patient_id=patient_id)
        assert user_states[str(patient_id)]['step'] == "booking_department_selection"
        
        clear_user_state(patient_id)
        assert user_states[str(patient_id)]['step'] == "idle"
        
        print("--- Clear Chat Flow Test Passed! ---")

if __name__ == "__main__":
    test_clear_chat_flow()
