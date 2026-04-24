from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth_bp", __name__)

# Simple hardcoded credentials for demonstration
ADMIN_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
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
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500
