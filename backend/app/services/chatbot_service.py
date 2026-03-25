from app.services import recommend_specialist, get_queue_status
from app.ai_models.nlp.model import predict_intent


CONFIDENCE_THRESHOLD = 0.6  # you can tune this


def process_message(message):
    intent, confidence = predict_intent(message.lower())

    # 🛑 LOW CONFIDENCE HANDLING
    if confidence < CONFIDENCE_THRESHOLD:
        return "I'm not fully sure what you mean. Could you please rephrase your question?"

    if intent == "queue_status":
        queue = get_queue_status()
        return f"Your current queue number is {queue['current_queue_number']}. Estimated waiting time is {queue['estimated_wait_time']} minutes."

    if intent == "recommendation":
        result = recommend_specialist(message)
        if result:
            return f"Based on your symptoms, I recommend consulting {result['department']} specialist ({result['name']})."
        return "Sorry, I could not determine the appropriate specialist."

    if intent == "booking":
        return "To book an appointment, please use the booking form."

    if intent == "greeting":
        return "Hello! How can I assist you today?"

    return "I'm sorry, I didn't understand your request."