from app.services import recommend_specialist, get_queue_status


def detect_intent(message):
    message = message.lower()

    if "queue" in message:
        return "queue_status"

    if "recommend" in message or "pain" in message or "symptom" in message:
        return "recommendation"

    if "book" in message:
        return "booking"

    return "unknown"


def process_message(message):
    intent = detect_intent(message)

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

    return "I'm sorry, I didn't understand your request."
