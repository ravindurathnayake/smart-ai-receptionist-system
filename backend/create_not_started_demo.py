import sys
import os
from datetime import datetime, time, date, timedelta

# Add parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import Specialist, DoctorSession, Patient, Appointment, Queue

def create_demo_session():
    app = create_app()
    with app.app_context():
        print("Creating demo NOT_STARTED session...")
        
        # 1. Get or Create Specialist
        spec = Specialist.query.filter_by(name="Ravindu Rathnayake").first()
        if not spec:
            print("Specialist Ravindu Rathnayake not found. Please ensure specialists are seeded.")
            return

        # 2. Create NOT_STARTED Session for today
        today_date = date.today()
        # Check if already exists for today
        existing = DoctorSession.query.filter_by(
            specialist_id=spec.id,
            session_date=today_date
        ).first()
        
        if existing:
            print(f"Session already exists for {spec.name} today. Updating status to NOT_STARTED.")
            existing.status = "NOT_STARTED"
            session = existing
        else:
            session = DoctorSession(
                specialist_id=spec.id,
                session_date=today_date,
                start_time=time(14, 30),
                end_time=time(18, 30),
                max_patients=30,
                room_number="Room 12",
                status="NOT_STARTED",
                session_number=2
            )
            db.session.add(session)
        
        db.session.commit()
        print(f"Session ID: {session.id} created/updated as NOT_STARTED.")

        # 3. Add some waiting patients
        patients = Patient.query.limit(3).all()
        if not patients:
            print("No patients found in DB. Please register some patients first.")
            return

        for i, p in enumerate(patients):
            # Check if already has appointment today for this session
            exists = Appointment.query.filter_by(
                patient_id=p.id,
                doctor_session_id=session.id
            ).first()
            
            if not exists:
                app_time = datetime.combine(today_date, time(15, 0)) + timedelta(minutes=i*15)
                appt = Appointment(
                    patient_id=p.id,
                    specialist_id=spec.id,
                    doctor_session_id=session.id,
                    appointment_date=app_time,
                    symptom="General Checkup",
                    status="Scheduled"
                )
                db.session.add(appt)
                db.session.flush() # Get appt.id
                
                # Add to Queue
                q_exists = Queue.query.filter_by(
                    doctor_session_id=session.id,
                    queue_number=i+1
                ).first()
                
                if not q_exists:
                    q = Queue(
                        appointment_id=appt.id,
                        patient_id=p.id,
                        doctor_session_id=session.id,
                        queue_number=i+1,
                        estimated_wait_time=(i+1)*10,
                        status="WAITING"
                    )
                    db.session.add(q)
                    print(f"Added {p.full_name} to queue S{session.session_number}-{i+1:02d}")
                else:
                    print(f"Queue entry for S{session.session_number}-{i+1:02d} already exists.")

        db.session.commit()
        print("Demo data added successfully!")

if __name__ == "__main__":
    create_demo_session()
