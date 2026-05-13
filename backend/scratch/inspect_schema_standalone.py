import os
import sys
from sqlalchemy import create_engine, inspect

# Use the database URL directly from .env if needed, but let's just use it here
DATABASE_URL = "postgresql://postgres:Ravindu%4055@localhost:5432/smart_ai_receptionist_db"

def inspect_db():
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        
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
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_db()
