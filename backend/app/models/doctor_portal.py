from datetime import datetime

from ..extensions import db


class DoctorSessionRequest(db.Model):
    __tablename__ = "doctor_session_requests"

    id = db.Column(db.Integer, primary_key=True)
    specialist_id = db.Column(db.Integer, db.ForeignKey("specialists.id"), nullable=False)
    doctor_session_id = db.Column(db.Integer, db.ForeignKey("doctor_sessions.id"), nullable=True)
    request_type = db.Column(db.String(40), nullable=False)
    requested_date = db.Column(db.Date, nullable=True)
    requested_start_time = db.Column(db.Time, nullable=True)
    requested_end_time = db.Column(db.Time, nullable=True)
    requested_room_number = db.Column(db.String(50), nullable=True)
    requested_max_patients = db.Column(db.Integer, nullable=True)
    reason = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default="Pending")
    admin_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    specialist = db.relationship("Specialist", backref=db.backref("session_requests", lazy=True))
    session = db.relationship("DoctorSession", backref=db.backref("doctor_requests", lazy=True))


class VitalRecord(db.Model):
    __tablename__ = "vital_records"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=True)
    specialist_id = db.Column(db.Integer, db.ForeignKey("specialists.id"), nullable=True)
    doctor_name = db.Column(db.String(100), nullable=False)
    blood_pressure = db.Column(db.String(50), nullable=True)
    blood_sugar = db.Column(db.String(50), nullable=True)
    heart_rate = db.Column(db.String(50), nullable=True)
    temperature = db.Column(db.String(50), nullable=True)
    weight = db.Column(db.String(50), nullable=True)
    oxygen_saturation = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship("Patient", backref=db.backref("vital_records", lazy=True))
    appointment = db.relationship("Appointment", backref=db.backref("vital_records", lazy=True))
    specialist = db.relationship("Specialist", backref=db.backref("vital_records", lazy=True))
