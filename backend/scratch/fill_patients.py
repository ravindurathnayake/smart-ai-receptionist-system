import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import Patient
import random
from sqlalchemy import text

def fill_patients():
    app = create_app()
    with app.app_context():
        # Ensure column exists before querying
        db.session.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5)"))
        db.session.commit()

        patients = Patient.query.all()
        
        genders = ["Male", "Female"]
        blood_types = ["O+", "A-", "B+", "AB+", "O-", "A+", "B-"]
        addresses = [
            "123 Main St, Colombo 07",
            "45/A Galle Rd, Mount Lavinia",
            "78 Kandy Rd, Kadawatha",
            "12/1 Negombo Rd, Ja-Ela",
            "200 High Level Rd, Nugegoda",
            "56 Reid Avenue, Colombo 04",
            "34 Flower Rd, Colombo 03"
        ]

        for p in patients:
            if not p.age:
                p.age = random.randint(18, 75)
            if not p.gender:
                p.gender = random.choice(genders)
            if not p.nic:
                p.nic = f"{1970 + random.randint(0, 40)}{random.randint(10000000, 99999999)}"
            if not p.address:
                p.address = random.choice(addresses)
            if not p.email:
                name_part = p.full_name.lower().replace(" ", ".")
                p.email = f"{name_part}{random.randint(10,99)}@example.com"
            if not p.blood_type:
                p.blood_type = random.choice(blood_types)
            
            print(f"Updated patient: {p.full_name} | Blood: {p.blood_type}")

        db.session.commit()
        print("Successfully updated patients.")

if __name__ == "__main__":
    fill_patients()
