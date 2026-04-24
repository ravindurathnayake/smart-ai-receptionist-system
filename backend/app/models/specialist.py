from ..extensions import db
from datetime import datetime

class Specialist(db.Model):
    __tablename__ = "specialists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    
    # Old field kept for compatibility or renamed to department_name if needed
    department = db.Column(db.String(100), nullable=True) 
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)
    
    title = db.Column(db.String(20), nullable=True) # Dr, Prof, etc.
    email = db.Column(db.String(120), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    
    specialization = db.Column(db.String(150), nullable=True)
    experience_years = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=0.0)
    languages = db.Column(db.String(255), nullable=True) # Comma separated
    consultation_fee = db.Column(db.Float, default=0.0)
    profile_image = db.Column(db.Text, nullable=True)
    availability_status = db.Column(db.String(50), default="Available")
    bio = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    sessions = db.relationship("DoctorSession", backref="specialist", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Specialist {self.name}>"