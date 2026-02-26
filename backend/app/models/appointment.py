from app.extensions import db
from datetime import datetime

class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    specialist_id = db.Column(db.Integer, db.ForeignKey("specialists.id"), nullable=False)

    symptom = db.Column(db.String(255), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default="Booked")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    queue = db.relationship("Queue", backref="appointment", uselist=False)

    def __repr__(self):
        return f"<Appointment {self.id}>"