from ..extensions import db
from datetime import datetime

class Specialist(db.Model):
    __tablename__ = "specialists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Specialist {self.name}>"