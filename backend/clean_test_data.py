from app import create_app
from app.extensions import db
from app.models.specialist import Specialist
from app.models.doctor_session import DoctorSession
from app.models.appointment import Appointment
from app.models.queue import Queue
from app.models.review import Review
from app.models.payment import Payment

app = create_app()
with app.app_context():
    try:
        # Delete any remaining sessions linked to "Guard Tester"
        test_specs = Specialist.query.filter_by(name="Guard Tester").all()
        for spec in test_specs:
            # Drop matching doctor sessions, appointments, etc.
            sessions = DoctorSession.query.filter_by(specialist_id=spec.id).all()
            for sess in sessions:
                Queue.query.filter_by(doctor_session_id=sess.id).delete()
                Appointment.query.filter_by(doctor_session_id=sess.id).delete()
                db.session.delete(sess)
            
            # Delete appointments / reviews/ payments linked to specialist directly
            Review.query.filter_by(specialist_id=spec.id).delete()
            Appointment.query.filter_by(specialist_id=spec.id).delete()
            db.session.delete(spec)
        
        db.session.commit()
        print("SUCCESS: Deleted 'Guard Tester' specialist and all related entries successfully!")
    except Exception as e:
        db.session.rollback()
        print("ERROR:", e)
