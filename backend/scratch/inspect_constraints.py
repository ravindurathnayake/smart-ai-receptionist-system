import os
import sys
from sqlalchemy import create_engine, inspect, text

DATABASE_URL = "postgresql://postgres:Ravindu%4055@localhost:5432/smart_ai_receptionist_db"

def inspect_db():
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        
        with engine.connect() as conn:
            # Check all constraints on all tables
            print("\n--- ALL UNIQUE/PRIMARY CONSTRAINTS ---")
            res = conn.execute(text("""
                SELECT 
                    relname AS table_name, 
                    conname AS constraint_name, 
                    pg_get_constraintdef(c.oid) AS definition
                FROM pg_constraint c
                JOIN pg_class r ON c.conrelid = r.oid
                JOIN pg_namespace n ON n.oid = r.relnamespace
                WHERE n.nspname = 'public' AND contype IN ('u', 'p')
                ORDER BY table_name;
            """))
            for row in res:
                print(row)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_db()
