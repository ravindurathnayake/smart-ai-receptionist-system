from app import create_app
from app.models import Patient

app = create_app()
with app.app_context():
    patients = Patient.query.filter(Patient.face_embedding != None).all()
    print(f"Number of patients with face embeddings: {len(patients)}")
    for p in patients:
        print(f"- ID: {p.id}, Name: {p.full_name}, NIC: {p.nic}")
