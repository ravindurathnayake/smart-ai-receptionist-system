from app import create_app
from app.extensions import db
from sqlalchemy import text

def update_db():
    app = create_app()
    with app.app_context():
        try:
            db.session.execute(text('ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS attachment TEXT'))
            db.session.execute(text('ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS attachment TEXT'))
            db.session.commit()
            print("Successfully updated database schema with attachment columns.")
        except Exception as e:
            db.session.rollback()
            print(f"Error updating database: {e}")

if __name__ == "__main__":
    update_db()
