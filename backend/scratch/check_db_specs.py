import sys
import os

# Add the parent directory to sys.path to import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import Specialist

def check_specialists():
    app = create_app()
    with app.app_context():
        specs = Specialist.query.all()
        print(f"Total specialists in database: {len(specs)}")
        for s in specs:
            print(f"ID: {s.id}, Name: {s.name}, Department: {s.department}")

if __name__ == "__main__":
    check_specialists()
