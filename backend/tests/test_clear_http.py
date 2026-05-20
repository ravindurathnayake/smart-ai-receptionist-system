import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Mock face_recognition before importing app
import sys
from unittest.mock import MagicMock
sys.modules["face_recognition"] = MagicMock()

from app import create_app
from app.services.chatbot_service import user_states

def test_clear_route():
    app = create_app()
    client = app.test_client()
    
    # 1. Populate state
    user_states["anonymous"] = {"step": "booking_department_selection", "data": {}}
    user_states["123"] = {"step": "symptom_triage", "data": {}}
    
    # 2. Call clear route for anonymous
    response1 = client.post('/api/chat/clear', json={"patient_id": None})
    assert response1.status_code == 200
    assert user_states["anonymous"]["step"] == "idle"
    
    # 3. Call clear route for patient 123
    response2 = client.post('/api/chat/clear', json={"patient_id": "123"})
    assert response2.status_code == 200
    assert user_states["123"]["step"] == "idle"
    
    print("--- Flask HTTP clear route tests passed successfully! ---")

if __name__ == "__main__":
    test_clear_route()
