from app import create_app
from app.models.appointment import Appointment
from app.models.doctor_session import DoctorSession

app = create_app()
with app.app_context():
    apps = Appointment.query.all()
    print(f"Total Appointments: {len(apps)}")
    for a in apps:
        print(f"App ID: {a.id}, Session ID: {a.session_id}")
    
    sessions = DoctorSession.query.all()
    print(f"Total Sessions: {len(sessions)}")
    for s in sessions:
        print(f"Session ID: {s.id}, Specialist ID: {s.specialist_id}")
