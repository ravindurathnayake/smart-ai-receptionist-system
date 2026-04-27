from ..extensions import db
from datetime import datetime

class Prescription(db.Model):
    __tablename__ = 'prescriptions'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=True)
    doctor_name = db.Column(db.String(100), nullable=False)
    medications = db.Column(db.Text, nullable=False) 
    instructions = db.Column(db.Text)
    attachment = db.Column(db.Text) # Base64 file/image
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    patient = db.relationship('Patient', backref=db.backref('prescriptions', lazy=True))
    appointment = db.relationship('Appointment', backref=db.backref('prescription', uselist=False))

class LabReport(db.Model):
    __tablename__ = 'lab_reports'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    test_name = db.Column(db.String(200), nullable=False)
    result_summary = db.Column(db.Text)
    attachment = db.Column(db.Text) # Base64 file/image
    status = db.Column(db.String(50), default='Completed') 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    patient = db.relationship('Patient', backref=db.backref('lab_reports', lazy=True))
