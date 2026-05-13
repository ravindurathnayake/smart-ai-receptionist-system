from app import create_app
from app.models import Patient
from app.extensions import db

app = create_app()

def check_patient(email):
    with app.app_context():
        p = Patient.query.filter_by(email=email).first()
        if p:
            print(f"Patient Found: {p.full_name} (ID: {p.id})")
            print(f"Embedding Status: {'Exists' if p.face_embedding else 'Missing'}")
            
            # Check for today's appointment
            from datetime import date
            from app.models import Appointment
            a = Appointment.query.filter(
                Appointment.patient_id == p.id,
                db.func.date(Appointment.appointment_date) == date.today()
            ).first()
            if a:
                print(f"Today's Appointment: ID {a.id}, Status: {a.status}")
            else:
                print("No appointment found for today.")
        else:
            print(f"No patient found with email: {email}")

def delete_patient(email):
    with app.app_context():
        p = Patient.query.filter_by(email=email).first()
        if p:
            # Delete appointments and queue first
            from app.models import Appointment, Queue, Payment
            appts = Appointment.query.filter_by(patient_id=p.id).all()
            for a in appts:
                # Delete associated payments
                Payment.query.filter_by(appointment_id=a.id).delete()
                # Delete queue entries
                Queue.query.filter_by(appointment_id=a.id).delete()
                db.session.delete(a)
            db.session.delete(p)
            db.session.commit()
            print(f"Deleted patient: {email}")
        else:
            print(f"Patient not found: {email}")

if __name__ == "__main__":
    import sys
    email = "ravindurathnayake258@gmail.com"
    if len(sys.argv) > 1 and sys.argv[1] == "delete":
        delete_patient(email)
    else:
        check_patient(email)
