
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'backend')))

from app import create_app
from app.extensions import db
from app.models import Patient, Appointment, Payment, Queue
from datetime import date

app = create_app()
with app.app_context():
    try:
        today = date.today()
        print(f"Today: {today}")
        
        print("Testing Patients...")
        p_total = Patient.query.count()
        p_today = Patient.query.filter(db.func.date(Patient.created_at) == today).count()
        print(f"Patients: total={p_total}, today={p_today}")
        
        print("Testing Appointments...")
        a_total = Appointment.query.count()
        a_today = Appointment.query.filter(db.func.date(Appointment.appointment_date) == today).count()
        print(f"Appointments: total={a_total}, today={a_today}")
        
        print("Testing Revenue...")
        r_total = db.session.query(db.func.sum(Payment.amount)).filter(Payment.status == "Paid").scalar() or 0.0
        r_today = db.session.query(db.func.sum(Payment.amount)).filter(
            Payment.status == "Paid", 
            db.func.date(Payment.created_at) == today
        ).scalar() or 0.0
        print(f"Revenue: total={r_total}, today={r_today}")
        
        print("Testing Queue...")
        q_active = Queue.query.filter(
            Queue.status == "Active",
            db.func.date(Queue.created_at) == today
        ).count()
        q_completed = Queue.query.filter(
            Queue.status == "Completed",
            db.func.date(Queue.completed_at) == today
        ).count()
        print(f"Queue: active={q_active}, completed={q_completed}")
        
        print("All tests passed!")
    except Exception as e:
        print(f"Error occurred: {e}")
        import traceback
        traceback.print_exc()
