
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'backend')))

from app import create_app
from app.extensions import db
from sqlalchemy import text
from app.models import Queue, Appointment

def update_schema():
    app = create_app()
    with app.app_context():
        try:
            # 1. Add doctor_session_id to appointments if missing (already done but safe)
            try:
                db.session.execute(text('ALTER TABLE appointments ADD COLUMN doctor_session_id INTEGER'))
                db.session.commit()
                print("Added doctor_session_id to appointments.")
            except Exception:
                db.session.rollback()
                print("doctor_session_id already exists in appointments.")

            # 2. Add queue_number to appointments
            try:
                db.session.execute(text('ALTER TABLE appointments ADD COLUMN queue_number INTEGER'))
                db.session.commit()
                print("Added queue_number to appointments.")
            except Exception:
                db.session.rollback()
                print("queue_number already exists in appointments.")

            # 3. Add patient_id to queues
            try:
                db.session.execute(text('ALTER TABLE queues ADD COLUMN patient_id INTEGER'))
                db.session.commit()
                print("Added patient_id to queues.")
            except Exception:
                db.session.rollback()
                print("patient_id already exists in queues.")

            # 4. Add doctor_session_id to queues
            try:
                db.session.execute(text('ALTER TABLE queues ADD COLUMN doctor_session_id INTEGER'))
                db.session.commit()
                print("Added doctor_session_id to queues.")
            except Exception:
                db.session.rollback()
                print("doctor_session_id already exists in queues.")

            # 5. Populate doctor_session_id and patient_id in queues from appointments
            queues = Queue.query.all()
            for q in queues:
                if q.appointment_id:
                    appt = Appointment.query.get(q.appointment_id)
                    if appt:
                        q.doctor_session_id = appt.doctor_session_id
                        q.patient_id = appt.patient_id
            db.session.commit()
            print("Populated doctor_session_id and patient_id in existing queues.")

            print("Database schema update completed.")
        except Exception as e:
            print(f"Error updating database: {e}")

if __name__ == "__main__":
    update_schema()
