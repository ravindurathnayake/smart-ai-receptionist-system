from ..extensions import db
from datetime import datetime

class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=False)
    
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default="Cash") # Cash, Card, Online
    status = db.Column(db.String(50), default="Pending") # Pending, Paid, Refunded
    transaction_id = db.Column(db.String(100), unique=True, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Payment {self.id} - {self.status}>"
