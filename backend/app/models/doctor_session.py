from ..extensions import db
from datetime import datetime

class DoctorSession(db.Model):
    __tablename__ = "doctor_sessions"

    id = db.Column(db.Integer, primary_key=True)
    specialist_id = db.Column(db.Integer, db.ForeignKey("specialists.id"), nullable=False)
    
    day_of_week = db.Column(db.String(20), nullable=True) # Monday, Tuesday, etc. (for recurring)
    session_date = db.Column(db.Date, nullable=True) # Specific date (for one-off)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    max_patients = db.Column(db.Integer, default=20)
    current_count = db.Column(db.Integer, default=0)
    room_number = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default="Active") # Active, Cancelled, Full

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    appointments = db.relationship("Appointment", backref="session", lazy=True)

    def __repr__(self):
        return f"<DoctorSession {self.specialist_id} - {self.day_of_week}>"
