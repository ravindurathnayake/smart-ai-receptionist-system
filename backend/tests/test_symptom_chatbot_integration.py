import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Mock face_recognition before importing app
from unittest.mock import MagicMock
sys.modules["face_recognition"] = MagicMock()

from app import create_app
from app.services.chatbot_service import process_message, user_states

def test_symptom_integration():
    app = create_app()
    with app.app_context():
        user_states.clear()
        
        print("\n--- Testing Symptom Integration: Chest Pain ---")
        response1 = process_message("i have a chest pain")
        print(f"User: i have a chest pain")
        print(f"Bot: {response1['reply']}")
        
        assert "Cardiology" in response1['reply']
        state = user_states.get("anonymous")
        assert state['step'] == "symptom_triage_confirmation"
        assert state['dept'] == "Cardiology"
        print("Chest Pain Test Passed!")
        
        user_states.clear()
        
        print("\n--- Testing Symptom Integration: Teeth Main (Typo) ---")
        response2 = process_message("i have a teeth main")
        print(f"User: i have a teeth main")
        print(f"Bot: {response2['reply']}")
        
        assert "Dental" in response2['reply']
        state = user_states.get("anonymous")
        assert state['step'] == "symptom_triage_confirmation"
        assert state['dept'] == "Dental"
        print("Teeth Main Test Passed!")
        
        print("\n--- Testing Symptom Integration: Toothache ---")
        user_states.clear()
        response3 = process_message("i have toothache")
        print(f"User: i have toothache")
        print(f"Bot: {response3['reply']}")
        
        assert "Dental" in response3['reply']
        state = user_states.get("anonymous")
        assert state['step'] == "symptom_triage_confirmation"
        assert state['dept'] == "Dental"
        print("Toothache Test Passed!")

if __name__ == "__main__":
    test_symptom_integration()
