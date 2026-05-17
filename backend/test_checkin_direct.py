from app import create_app
from app.services.queue_service import check_in_patient
from app.models import Patient

app = create_app()
with app.app_context():
    patient = Patient.query.get(51)
    if patient:
        print(f"Testing check-in for Patient ID: {patient.id}, Appointment: 105")
        result = check_in_patient(51, 105)
        print("Check-in result:", result)
    else:
        print("Patient 51 not found.")
