from app.extensions import db
from datetime import datetime


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    nic = db.Column(db.String(20), unique=True, nullable=True)
    address = db.Column(db.Text, nullable=True)
    blood_type = db.Column(db.String(5), nullable=True)
    medical_history = db.Column(db.Text, nullable=True)
    profile_image = db.Column(db.String(255), nullable=True)
    face_embedding = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    appointments = db.relationship("Appointment", backref="patient", lazy=True)

    def __repr__(self):
        return f"<Patient {self.full_name}>"
