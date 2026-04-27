from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE doctor_sessions ADD COLUMN session_date DATE"))
            conn.commit()
            print("SUCCESS: session_date column added to PostgreSQL.")
    except Exception as e:
        print(f"ERROR or ALREADY EXISTS: {e}")
