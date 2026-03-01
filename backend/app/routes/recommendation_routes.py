from flask import Blueprint, request, jsonify
from app.services import recommend_specialist

recommendation_bp = Blueprint("recommendation_bp", __name__)


@recommendation_bp.route("/recommend-specialist", methods=["POST"])
def recommend_specialist_route():
    try:
        data = request.get_json()
        symptom = data.get("symptom")

        if not symptom:
            return jsonify({"error": "Symptom is required"}), 400

        result = recommend_specialist(symptom)

        if not result:
            return jsonify({
                "message": "No suitable specialist found"
            }), 404

        return jsonify({
            "message": "Specialist recommended successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500