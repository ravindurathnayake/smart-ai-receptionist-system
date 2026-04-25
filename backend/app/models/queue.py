from app.extensions import db
from datetime import datetime, timezone


class Queue(db.Model):
    __tablename__ = "queues"

    id = db.Column(db.Integer, primary_key=True)

    appointment_id = db.Column(
        db.Integer,
        db.ForeignKey("appointments.id"),
        nullable=False
    )

    queue_number = db.Column(db.Integer, nullable=False)
    estimated_wait_time = db.Column(db.Integer, nullable=False)

    # NEW FIELDS
    status = db.Column(db.String(20), default="WAITING")  # WAITING, COMPLETED, CANCELLED
    check_in_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    check_out_time = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Queue {self.queue_number} - {self.status}>"