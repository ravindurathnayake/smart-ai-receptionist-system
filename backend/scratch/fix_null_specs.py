import sys
import os

# Add the parent directory to sys.path to import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import Specialist

def fix_null_data():
    app = create_app()
    with app.app_context():
        specs = Specialist.query.all()
        print(f"Checking {len(specs)} specialists for null data...")
        
        for s in specs:
            updated = False
            if not s.specialization:
                s.specialization = f"Senior {s.department}"
                updated = True
            if s.experience_years is None:
                s.experience_years = 10
                updated = True
            if s.rating is None:
                s.rating = 4.8
                updated = True
            if not s.languages:
                s.languages = "Sinhala, English"
                updated = True
            if s.consultation_fee is None:
                s.consultation_fee = 2500.0
                updated = True
            if not s.availability_status:
                s.availability_status = "Available"
                updated = True
            if not s.bio:
                s.bio = f"Experienced {s.department} specialist with a focus on patient care."
                updated = True
            
            if updated:
                print(f"Updated specialist ID {s.id}: {s.name}")
        
        db.session.commit()
        print("Data fix completed.")

if __name__ == "__main__":
    fix_null_data()
