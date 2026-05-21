from flask import Blueprint, request, jsonify
from app.services import process_message, clear_user_state

chatbot_bp = Blueprint("chatbot_bp", __name__)


@chatbot_bp.route("/chat/clear", methods=["POST"])
def clear_chat():
    try:
        data = request.get_json() or {}
        patient_id = data.get("patient_id")
        clear_user_state(patient_id)
        return jsonify({"message": "Chat status cleared successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        message = data.get("message")
        patient_id = data.get("patient_id")
        is_web_client = data.get("is_web_client", False)

        if not message:
            return jsonify({"error": "Message is required"}), 400

        reply_data = process_message(message, patient_id, is_web_client=is_web_client)
        import sys
        print(f"CHATBOT REPLY: {reply_data}", file=sys.stderr)

        return jsonify({
            "reply": reply_data.get("reply"),
            "actions": reply_data.get("actions", [])
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
