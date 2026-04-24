import os
from dotenv import load_dotenv
from app import create_app
from app.extensions import db
from app.models import Specialist

load_dotenv()

app = create_app()

with app.app_context():
    print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
    try:
        specialists = Specialist.query.all()
        print(f"Total specialists found: {len(specialists)}")
        for s in specialists:
            print(f"ID: {s.id}, Name: {s.name}, Dept: {s.department}")
    except Exception as e:
        print(f"Error querying database: {e}")
