import os
import sys
from sqlalchemy import create_engine, inspect, text

DATABASE_URL = "postgresql://postgres:Ravindu%4055@localhost:5432/smart_ai_receptionist_db"

def inspect_db():
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        
        with engine.connect() as conn:
            # 1. Specialists
            res = conn.execute(text("SELECT id, name, email, phone_number, department FROM specialists"))
            print("--- Specialists ---")
            for row in res:
                print(row)
                
            # 2. Constraints on specialists
            print("\n--- Constraints on specialists ---")
            res = conn.execute(text("""
                SELECT conname, pg_get_constraintdef(c.oid)
                FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE n.nspname = 'public' AND contype IN ('u', 'p')
                AND conrelid = 'specialists'::regclass;
            """))
            for row in res:
                print(row)

            # 3. Doctor Sessions
            res = conn.execute(text("SELECT id, specialist_id, day_of_week, session_date, start_time FROM doctor_sessions LIMIT 5"))
            print("\n--- Doctor Sessions (5) ---")
            for row in res:
                print(row)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_db()
