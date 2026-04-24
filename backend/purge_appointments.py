import sys
import os

# Add the current directory to sys.path to import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app import create_app
from app.extensions import db
from app.models import Appointment, Queue

def purge_appointments():
    app = create_app()
    with app.app_context():
        print("Starting appointment purge...")
        
        try:
            # Delete queue entries first due to foreign key
            num_queues = Queue.query.delete()
            print(f"Deleted {num_queues} queue entries.")
            
            # Delete all appointments
            num_appts = Appointment.query.delete()
            print(f"Deleted {num_appts} appointments.")
            
            db.session.commit()
            print("Database purged successfully!")
        except Exception as e:
            db.session.rollback()
            print(f"Purge failed: {e}")

if __name__ == "__main__":
    purge_appointments()
