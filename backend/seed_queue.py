import sys
import os
from datetime import datetime, time, date, timedelta

# Add the parent directory to sys.path to import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app import create_app
from app.extensions import db
from app.models.patient import Patient
from app.models.specialist import Specialist
from app.models.appointment import Appointment
from app.models.queue import Queue
from app.models.doctor_session import DoctorSession

def seed_queue():
    app = create_app()
    with app.app_context():
        print("Starting queue data seeding...")
        
        today = date.today()
        
        # 1. Ensure we have a patient
        test_patient = Patient.query.filter_by(nic="123456789V").first()
        if not test_patient:
            test_patient = Patient(
                full_name="Test Patient",
                nic="123456789V",
                email="test@example.com",
                phone_number="0771234567",
                age=30,
                gender="Male"
            )
            db.session.add(test_patient)
            db.session.commit()
            print("Created test patient.")

        # 2. Get specialists and sessions
        specialists = Specialist.query.all()
        if not specialists:
            print("No specialists found. Please run seed_db.py first.")
            return

        # 3. Create some appointments and queue entries for today
        rooms = ["Room 10", "Room 12", "Room 05", "Pharmacy", "Radiology Lab"]
        
        for i, specialist in enumerate(specialists[:5]):
            # Find or create a session for today's day of week
            day_name = datetime.now().strftime("%A")
            session = DoctorSession.query.filter_by(specialist_id=specialist.id).first()
            
            if not session:
                session = DoctorSession(
                    specialist_id=specialist.id,
                    day_of_week=day_name,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                    room_number=rooms[i % len(rooms)]
                )
                db.session.add(session)
                db.session.commit()

            # Create an appointment for today
            appointment = Appointment.query.filter_by(
                patient_id=test_patient.id,
                specialist_id=specialist.id,
                status="Checked-In"
            ).filter(db.func.date(Appointment.appointment_date) == today).first()

            if not appointment:
                appointment = Appointment(
                    patient_id=test_patient.id,
                    specialist_id=specialist.id,
                    session_id=session.id,
                    appointment_date=datetime.combine(today, time(10 + (i * 15 // 60), (i * 15 % 60))),
                    status="Checked-In",
                    symptom="General checkup"
                )
                db.session.add(appointment)
                db.session.commit()

            # Create queue entry
            if not Queue.query.filter_by(appointment_id=appointment.id).first():
                qe = Queue(
                    appointment_id=appointment.id,
                    queue_number=100 + i,
                    estimated_wait_time=i * 10,
                    status="Active" if i % 2 == 0 else "WAITING"
                )
                db.session.add(qe)
                db.session.commit()
                print(f"Added queue entry for {specialist.department} - {session.room_number}")

        print("Queue seeding completed!")

if __name__ == "__main__":
    seed_queue()
