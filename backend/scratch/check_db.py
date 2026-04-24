import sys
import os
sys.path.append(os.getcwd())
from app import create_app
from app.models import Patient

app = create_app()
with app.app_context():
    patients = Patient.query.all()
    print(f"Total patients: {len(patients)}")
    for p in patients:
        print(f"Patient: {p.full_name}, Blood: {p.blood_type}")
