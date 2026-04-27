from flask import Blueprint, request
from app.extensions import db
from app.models.review import Review
from app.models.appointment import Appointment
from app.utils.response import success_response, error_response
from datetime import datetime

review_bp = Blueprint("review", __name__, url_prefix="/api/reviews")

@review_bp.route("/", methods=["POST"])
def submit_review():
    try:
        data = request.get_json()
        appointment_id = data.get("appointment_id")
        rating = data.get("rating")
        review_text = data.get("review_text", "")
        complaint_text = data.get("complaint_text", "")
        is_complaint = data.get("is_complaint", False)

        if not appointment_id or not rating:
            return error_response("Appointment ID and rating are required", 400)

        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check if review already exists
        existing_review = Review.query.filter_by(appointment_id=appointment_id).first()
        if existing_review:
            return error_response("Review already submitted for this appointment", 400)

        new_review = Review(
            appointment_id=appointment_id,
            patient_id=appointment.patient_id,
            specialist_id=appointment.specialist_id,
            rating=rating,
            review_text=review_text,
            complaint_text=complaint_text,
            is_complaint=is_complaint
        )
        
        db.session.add(new_review)
        db.session.commit()
        
        return success_response("Review submitted successfully", {
            "id": new_review.id
        })
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@review_bp.route("/", methods=["GET"])
def get_all_reviews():
    try:
        reviews = Review.query.all()
        return success_response("Reviews retrieved", [{
            "id": r.id,
            "appointment_id": r.appointment_id,
            "patient_name": r.patient.full_name,
            "specialist_name": r.specialist.name,
            "rating": r.rating,
            "review_text": r.review_text,
            "complaint_text": r.complaint_text,
            "is_complaint": r.is_complaint,
            "status": r.status,
            "admin_response": r.admin_response,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M")
        } for r in reviews])
    except Exception as e:
        return error_response(str(e), 500)

@review_bp.route("/<int:review_id>/respond", methods=["PATCH"])
def respond_to_review(review_id):
    try:
        data = request.get_json()
        admin_response = data.get("admin_response")
        status = data.get("status", "Resolved")

        review = Review.query.get_or_404(review_id)
        review.admin_response = admin_response
        review.status = status
        
        from app.models.notification import Notification
        new_notif = Notification(
            patient_id=review.patient_id,
            type="Review Response",
            message=f"Administrator has responded to your feedback regarding Dr. {review.specialist.name}.",
            kiosk_id="ADMIN-CONSOLE"
        )
        db.session.add(new_notif)
        db.session.commit()
        return success_response("Response added successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)
