from app.models import Specialist
from app.ai_models.recommendation.model import predict_specialist


def recommend_specialist(message):
    dept, confidence = predict_specialist(message)

    if confidence < 0.15:
        return None

    specialist = Specialist.query.filter_by(department=dept).first()

    if not specialist:
        return None

    return {
        "id": specialist.id,
        "name": specialist.name,
        "department": specialist.department,
        "confidence": round(confidence, 2)
    }