from flask import Blueprint, request
from datetime import datetime

from app.services import (
    book_appointment,
    get_queue_status,
    get_all_specialists,
    complete_queue,
    cancel_appointment
)

from app.utils.response import success_response, error_response

appointment_bp = Blueprint("appointment_bp", __name__)


# BOOK APPOINTMENT
@appointment_bp.route("/book-appointment", methods=["POST"])
def book_appointment_route():
    try:
        data = request.get_json()

        if not data:
            return error_response("Invalid JSON body", 400)

        full_name = data.get("full_name")
        phone_number = data.get("phone_number")
        specialist_id = data.get("specialist_id")
        symptom = data.get("symptom")
        appointment_date_str = data.get("appointment_date")

        # Basic validation
        if not all([full_name, specialist_id, symptom, appointment_date_str]):
            return error_response("Missing required fields", 400)

        try:
            appointment_date = datetime.fromisoformat(appointment_date_str)
        except ValueError:
            return error_response("Invalid appointment_date format (use ISO format)", 400)

        result = book_appointment(
            full_name=full_name,
            phone_number=phone_number,
            specialist_id=specialist_id,
            symptom=symptom,
            appointment_date=appointment_date
        )

        return success_response("Appointment booked successfully", result, 201)

    except Exception as e:
        return error_response(str(e), 500)


# QUEUE STATUS
@appointment_bp.route("/queue-status", methods=["GET"])
def queue_status_route():
    try:
        result = get_queue_status()
        return success_response("Queue status retrieved successfully", result)

    except Exception as e:
        return error_response(str(e), 500)


# GET SPECIALISTS
@appointment_bp.route("/specialists", methods=["GET"])
def get_specialists_route():
    try:
        specialists = get_all_specialists()
        return success_response("Specialists retrieved successfully", specialists)

    except Exception as e:
        return error_response(str(e), 500)


# COMPLETE QUEUE

@appointment_bp.route("/complete-queue/<int:queue_id>", methods=["PATCH"])
def complete_queue_route(queue_id):
    try:
        result = complete_queue(queue_id)

        if not result:
            return error_response("Queue not found", 404)

        return success_response("Queue marked as completed", result)

    except Exception as e:
        return error_response(str(e), 500)


# CANCEL APPOINTMENT
@appointment_bp.route("/cancel-appointment/<int:appointment_id>", methods=["PATCH"])
def cancel_appointment_route(appointment_id):
    try:
        result = cancel_appointment(appointment_id)

        if not result:
            return error_response("Appointment not found", 404)

        return success_response("Appointment cancelled successfully", result)

    except Exception as e:
        return error_response(str(e), 500)