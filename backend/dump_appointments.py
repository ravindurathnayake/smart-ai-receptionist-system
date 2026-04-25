from app import create_app
from app.models import Appointment
app = create_app()
with app.app_context():
    appts = Appointment.query.all()
    for a in appts:
        print(f"ID: {a.id}, Patient: {a.patient_id}, Status: {a.status}, Date: {a.appointment_date}")
