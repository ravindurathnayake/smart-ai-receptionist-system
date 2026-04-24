from ..extensions import db
from datetime import datetime

class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=True)
    icon = db.Column(db.String(100), nullable=True) # Material icon name
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    specialists = db.relationship("Specialist", backref="dept", lazy=True)

    def __repr__(self):
        return f"<Department {self.name}>"
