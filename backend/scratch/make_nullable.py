from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE doctor_sessions ALTER COLUMN day_of_week DROP NOT NULL"))
            conn.commit()
            print("SUCCESS: day_of_week made nullable.")
    except Exception as e:
        print(f"INFO: {e}")
