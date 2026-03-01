from app.models import Specialist


# Simple rule-based mapping
SYMPTOM_SPECIALIST_MAP = {
    "chest": "Cardiology",
    "heart": "Cardiology",
    "skin": "Dermatology",
    "rash": "Dermatology",
    "headache": "Neurology",
    "brain": "Neurology",
    "bone": "Orthopedics",
    "joint": "Orthopedics"
}


def recommend_specialist(symptom_text):
    """
    Recommend specialist based on symptom keywords
    """

    symptom_text = symptom_text.lower()

    matched_department = None

    for keyword, department in SYMPTOM_SPECIALIST_MAP.items():
        if keyword in symptom_text:
            matched_department = department
            break

    if not matched_department:
        return None

    specialist = Specialist.query.filter_by(department=matched_department).first()

    if not specialist:
        return None

    return {
        "id": specialist.id,
        "name": specialist.name,
        "department": specialist.department
    }