from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from app.services import book_appointment

appointment_bp = Blueprint("appointment_bp", __name__)


@appointment_bp.route("/book-appointment", methods=["POST"])
def book_appointment_route():
    try:
        data = request.get_json()

        full_name = data.get("full_name")
        phone_number = data.get("phone_number")
        specialist_id = data.get("specialist_id")
        symptom = data.get("symptom")
        appointment_date_str = data.get("appointment_date")

        # Basic validation
        if not all([full_name, specialist_id, symptom, appointment_date_str]):
            return jsonify({"error": "Missing required fields"}), 400

        # Convert string to datetime
        appointment_date = datetime.fromisoformat(appointment_date_str)

        result = book_appointment(
            full_name=full_name,
            phone_number=phone_number,
            specialist_id=specialist_id,
            symptom=symptom,
            appointment_date=appointment_date
        )

        return jsonify({
            "message": "Appointment booked successfully",
            "data": result
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
