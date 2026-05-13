from app.extensions import db
from datetime import datetime

class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    specialist_id = db.Column(db.Integer, db.ForeignKey("specialists.id"), nullable=False)
    
    rating = db.Column(db.Integer, nullable=False) # 1 to 5
    review_text = db.Column(db.Text, nullable=True)
    complaint_text = db.Column(db.Text, nullable=True)
    is_complaint = db.Column(db.Boolean, default=False)
    
    status = db.Column(db.String(20), default="Pending") # Pending, Resolved, Dismissed
    admin_response = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    appointment = db.relationship("Appointment", backref=db.backref("review", uselist=False))
    patient = db.relationship("Patient", backref="reviews_list")
    specialist = db.relationship("Specialist", backref="reviews_list")

    def __repr__(self):
        return f"<Review {self.id} - Appointment {self.appointment_id}>"
