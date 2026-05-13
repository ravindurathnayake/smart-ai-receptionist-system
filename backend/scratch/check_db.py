import os
import sys
from app import create_app
from app.extensions import db
from sqlalchemy import inspect
from app.models.doctor_session import DoctorSession

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    columns = [c['name'] for c in inspector.get_columns('doctor_sessions')]
    print(f"Columns in doctor_sessions: {columns}")
    if 'session_date' not in columns:
        print("MISSING: session_date column")
    else:
        print("SUCCESS: session_date column exists")
