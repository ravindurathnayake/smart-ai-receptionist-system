from app.extensions import db
from datetime import datetime

class Queue(db.Model):
    __tablename__ = "queues"

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=False)

    queue_number = db.Column(db.Integer, nullable=False)
    estimated_wait_time = db.Column(db.Integer, nullable=False)  # minutes

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Queue {self.queue_number}>"