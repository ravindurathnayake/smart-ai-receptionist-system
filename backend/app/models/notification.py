from ..extensions import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False) # e.g., 'Emergency', 'Staff Assistance'
    message = db.Column(db.Text, nullable=False)
    kiosk_id = db.Column(db.String(50), default="Kiosk #1")
    status = db.Column(db.String(20), default="Unread") # Unread, Read, Resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "message": self.message,
            "kiosk_id": self.kiosk_id,
            "status": self.status,
            "created_at": self.created_at.isoformat()
        }
