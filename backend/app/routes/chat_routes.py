from flask import Blueprint, request, jsonify
from app.services.recommendation_service import recommend_specialist

chat_bp = Blueprint("chat_bp", __name__)


@chat_bp.route("/chat", methods=["POST"])
def chat_route():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        message = data.get("message")

        if not message:
            return jsonify({"error": "Message is required"}), 400

        result = recommend_specialist(message)

        if not result:
            return jsonify({
                "message": "No suitable specialist found"
            }), 404

        return jsonify({
            "department": result["department"],
            "confidence": result["confidence"]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
