from flask import Blueprint, jsonify
from ..models import Specialist, Patient, Appointment, Payment, Queue
from ..extensions import db
from datetime import datetime, date

from ..utils.response import success_response, error_response

admin_bp = Blueprint("admin_bp", __name__)

@admin_bp.route("/stats", methods=["GET"])
def get_dashboard_stats():
    try:
        today = date.today()
        # ... (rest of logic same)
        stats = {
            "patients": {
                "total": Patient.query.count(),
                "new_today": Patient.query.filter(db.func.date(Patient.created_at) == today).count()
            },
            "appointments": {
                "total": Appointment.query.count(),
                "today": Appointment.query.filter(db.func.date(Appointment.appointment_date) == today).count()
            },
            "revenue": {
                "total": db.session.query(db.func.sum(Payment.amount)).filter(Payment.status == "Paid").scalar() or 0.0,
                "today": db.session.query(db.func.sum(Payment.amount)).filter(
                    Payment.status == "Paid", 
                    db.func.date(Payment.created_at) == today
                ).scalar() or 0.0
            },
            "queue": {
                "active": Queue.query.filter(
                    Queue.status == "Active",
                    db.func.date(Queue.created_at) == today
                ).count(),
                "completed_today": Queue.query.filter(
                    Queue.status == "Completed",
                    db.func.date(Queue.completed_at) == today
                ).count()
            }
        }
        return success_response("Admin stats retrieved", stats)
    except Exception as e:
        return error_response(str(e), 500)
