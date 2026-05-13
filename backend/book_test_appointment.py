from app import create_app
from app.models import Patient, Appointment, Specialist
from app.extensions import db
from datetime import datetime

app = create_app()

def book_today_appointment(email):
    with app.app_context():
        p = Patient.query.filter_by(email=email).first()
        if not p:
            print(f"Patient {email} not found.")
            return

        # Check if already has appointment today
        from datetime import date
        existing = Appointment.query.filter(
            Appointment.patient_id == p.id,
            db.func.date(Appointment.appointment_date) == date.today()
        ).first()

        if existing:
            print(f"Appointment already exists for today (ID: {existing.id}, Status: {existing.status})")
            # If it was completed or something, let's reset it to Scheduled
            if existing.status not in ["Booked", "Scheduled", "Confirmed"]:
                existing.status = "Scheduled"
                db.session.commit()
                print("Reset appointment status to Scheduled.")
            return

        # Get a specialist
        s = Specialist.query.first()
        if not s:
            print("No specialists found in database.")
            return

        new_appt = Appointment(
            patient_id=p.id,
            specialist_id=s.id,
            appointment_date=datetime.now(),
            status="Scheduled",
            symptom="Biometric Testing"
        )
        db.session.add(new_appt)
        db.session.commit()
        print(f"Successfully booked appointment for today (ID: {new_appt.id}) for {p.full_name}")

if __name__ == "__main__":
    book_today_appointment("ravindurathnayake258@gmail.com")
