import sys
import os

# Add the current directory to sys.path to import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app import create_app
from app.extensions import db
from app.models import Appointment, Queue, Payment, Review, DoctorSession

def purge_sessions_appointments():
    app = create_app()
    with app.app_context():
        print("Starting total purge of sessions, appointments, and dependent tables...")
        
        try:
            # 1. Delete reviews first
            num_reviews = Review.query.delete()
            print(f"Deleted {num_reviews} review entries.")
            
            # 2. Delete payments
            num_payments = Payment.query.delete()
            print(f"Deleted {num_payments} payment entries.")
            
            # 3. Delete queue entries
            num_queues = Queue.query.delete()
            print(f"Deleted {num_queues} queue entries.")
            
            # 4. Delete all appointments
            num_appts = Appointment.query.delete()
            print(f"Deleted {num_appts} appointments.")
            
            # 5. Delete all doctor sessions
            num_sessions = DoctorSession.query.delete()
            print(f"Deleted {num_sessions} doctor sessions.")
            
            db.session.commit()
            print("Successfully purged all sessions, appointments, and dependent records!")
        except Exception as e:
            db.session.rollback()
            print(f"Purge failed: {e}")

if __name__ == "__main__":
    purge_sessions_appointments()
