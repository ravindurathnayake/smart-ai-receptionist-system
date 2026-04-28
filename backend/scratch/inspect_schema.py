import os
import sys
from sqlalchemy import inspect, text

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    
    tables = inspector.get_table_names()
    print(f"Tables in DB: {tables}")
    
    for table in ['specialists', 'doctor_sessions', 'appointments', 'queues', 'departments']:
        if table in tables:
            columns = inspector.get_columns(table)
            print(f"\nColumns in {table}:")
            for c in columns:
                print(f" - {c['name']} ({c['type']})")
        else:
            print(f"\nTable {table} MISSING")
