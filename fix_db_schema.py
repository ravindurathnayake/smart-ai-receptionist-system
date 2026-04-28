
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'backend')))
from app import create_app
from app.extensions import db
from sqlalchemy import text

def fix_db():
    app = create_app()
    with app.app_context():
        try:
            # 1. Create all tables (will create doctor_sessions if it doesn't exist)
            db.create_all()
            print("Tables created (if they didn't exist).")

            # 2. Add doctor_session_id to appointments if missing
            try:
                db.session.execute(text('ALTER TABLE appointments ADD COLUMN doctor_session_id INTEGER'))
                db.session.commit()
                print("Added doctor_session_id to appointments.")
            except Exception as e:
                db.session.rollback()
                print("doctor_session_id already exists or error adding it:", e)

            # 3. Add status, check_in_time, check_out_time, completed_at, created_at to queues if missing
            # Note: SQLite doesn't support multiple columns in one ALTER TABLE, but psycopg2 (Postgres) does.
            # However, for safety and compatibility, we'll do them one by one.
            cols = [
                ('status', 'VARCHAR(20) DEFAULT \'WAITING\''),
                ('check_in_time', 'TIMESTAMP'),
                ('check_out_time', 'TIMESTAMP'),
                ('completed_at', 'TIMESTAMP'),
                ('created_at', 'TIMESTAMP')
            ]
            for col_name, col_type in cols:
                try:
                    db.session.execute(text(f'ALTER TABLE queues ADD COLUMN {col_name} {col_type}'))
                    db.session.commit()
                    print(f"Added {col_name} to queues.")
                except Exception as e:
                    db.session.rollback()
                    print(f"{col_name} already exists in queues or error adding it.")

            print("Database schema fix completed.")
        except Exception as e:
            print(f"General error fixing database: {e}")

if __name__ == "__main__":
    fix_db()
