import sys
import os
from datetime import datetime, time

# Add the parent directory to sys.path to import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import Specialist, Department, DoctorSession, User, Patient, Appointment, Payment, Queue

def seed_database():
    app = create_app()
    with app.app_context():
        print("Starting database seeding...")
        
        # 1. Clear existing data (optional, but good for a fresh start)
        # Be careful with this in production!
        # db.drop_all()
        # db.create_all()

        # 2. Add Departments
        dept_names = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "General Medicine"]
        depts_to_add = []
        for name in dept_names:
            if not Department.query.filter_by(name=name).first():
                depts_to_add.append(Department(name=name, description=f"{name} care"))
        
        if depts_to_add:
            db.session.add_all(depts_to_add)
            db.session.commit()
            print(f"Added {len(depts_to_add)} new departments.")
        else:
            print("Departments already exist.")

        # Re-fetch departments to get IDs
        departments = {d.name: d for d in Department.query.all()}

        # 3. Add Specialists
        specialist_data = [
            {
                "name": "Aruni Rajapaksa",
                "dept": "Cardiology",
                "spec": "Senior Consultant Cardiologist",
                "fee": 4500.0
            },
            {
                "name": "Rohan Jayasinghe",
                "dept": "Neurology",
                "spec": "Neurologist",
                "fee": 3500.0
            },
            {
                "name": "Sarah de Silva",
                "dept": "Pediatrics",
                "spec": "Pediatrician",
                "fee": 3000.0
            }
        ]
        
        specs_added = 0
        for s_info in specialist_data:
            if not Specialist.query.filter_by(name=s_info["name"]).first():
                dept = departments.get(s_info["dept"])
                new_s = Specialist(
                    name=s_info["name"],
                    department=s_info["dept"],
                    department_id=dept.id if dept else None,
                    specialization=s_info["spec"],
                    consultation_fee=s_info["fee"],
                    availability_status="Available",
                    rating=4.8,
                    experience_years=10
                )
                db.session.add(new_s)
                specs_added += 1
        
        if specs_added > 0:
            db.session.commit()
            print(f"Added {specs_added} specialists.")
        else:
            print("Specialists already exist.")

        # 4. Add Doctor Sessions
        db_specs = Specialist.query.all()
        if not db_specs:
            print("No specialists found to add sessions to.")
            return

        sessions_to_add = []
        # Add session for first specialist if no sessions exist
        for s in db_specs:
            if not DoctorSession.query.filter_by(specialist_id=s.id).first():
                sessions_to_add.append(DoctorSession(
                    specialist_id=s.id,
                    day_of_week="Monday",
                    start_time=time(9, 0),
                    end_time=time(13, 0),
                    max_patients=20,
                    room_number="Room 04"
                ))
        
        if sessions_to_add:
            db.session.add_all(sessions_to_add)
            db.session.commit()
            print(f"Added {len(sessions_to_add)} doctor sessions.")
        else:
            print("Sessions already exist.")

        # 5. Add a default Admin User
        if not User.query.filter_by(username="admin").first():
            admin = User(username="admin", email="admin@hospital.com", role="admin")
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
            print("Added default admin user (admin/admin123).")

        print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
