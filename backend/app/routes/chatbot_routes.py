from flask import Blueprint, request, jsonify
from app.services import process_message

chatbot_bp = Blueprint("chatbot_bp", __name__)


@chatbot_bp.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        message = data.get("message")

        if not message:
            return jsonify({"error": "Message is required"}), 400

        reply = process_message(message)

        return jsonify({
            "reply": reply
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
