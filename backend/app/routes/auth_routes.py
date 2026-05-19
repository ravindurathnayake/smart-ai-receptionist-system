from flask import Blueprint, request, jsonify
from ..models import Specialist

auth_bp = Blueprint("auth_bp", __name__)

# Simple hardcoded credentials for demonstration
ADMIN_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

DOCTOR_CREDENTIALS = {
    "username": "doctor",
    "password": "doctor123"
}

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        if username == ADMIN_CREDENTIALS["username"] and password == ADMIN_CREDENTIALS["password"]:
            return jsonify({
                "message": "Login successful",
                "user": {
                    "username": username,
                    "role": "admin",
                    "token": "mock-jwt-token-12345"
                }
            }), 200
        elif username == DOCTOR_CREDENTIALS["username"] and password == DOCTOR_CREDENTIALS["password"]:
            specialist = Specialist.query.order_by(Specialist.id.asc()).first()
            if not specialist:
                return jsonify({"error": "No specialist profile available for doctor access"}), 404

            display_name = f"{specialist.title or 'Dr.'} {specialist.name}".strip()
            return jsonify({
                "message": "Login successful",
                "user": {
                    "username": username,
                    "role": "doctor",
                    "token": "mock-doctor-token-12345",
                    "specialist_id": specialist.id,
                    "display_name": display_name,
                    "department": specialist.department,
                    "specialization": specialist.specialization,
                }
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500
