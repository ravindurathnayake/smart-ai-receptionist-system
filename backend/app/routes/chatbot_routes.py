from flask import Blueprint, request, jsonify
from app.services import process_message

chatbot_bp = Blueprint("chatbot_bp", __name__)


@chatbot_bp.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        message = data.get("message")
        patient_id = data.get("patient_id")

        if not message:
            return jsonify({"error": "Message is required"}), 400

        reply_data = process_message(message, patient_id)

        return jsonify({
            "reply": reply_data.get("reply"),
            "actions": reply_data.get("actions", [])
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
