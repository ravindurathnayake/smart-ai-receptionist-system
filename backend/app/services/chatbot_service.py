from app.services.ml_service import ml_service
from app.models import Specialist, Appointment, Patient, Department, DoctorSession
from app.extensions import db
from datetime import datetime, timedelta
import re

# In-memory state tracker
user_states = {}

CONFIDENCE_THRESHOLD = 0.25 

def parse_date_simple(text):
    text = text.lower()
    now = datetime.now()
    if "today" in text: return now
    if "tomorrow" in text: return now + timedelta(days=1)
    for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d %H:%M", "%H:%M"]:
        try:
            dt = datetime.strptime(text, fmt)
            if fmt == "%H:%M": return now.replace(hour=dt.hour, minute=dt.minute, second=0, microsecond=0)
            return dt
        except ValueError: continue
    return now

def process_message(message, patient_id=None):
    user_key = patient_id if patient_id else "anonymous"
    message = message.lower().strip()
    state = user_states.get(user_key, {"step": "idle"})

    # --- 1. HANDLE CONVERSATIONAL FLOWS (Multi-step Tasks) ---

    if state["step"] == "awaiting_booking_confirmation":
        if any(word in message for word in ["yes", "yeah", "ok", "sure", "yep", "book"]):
            dept_name = state.get("dept")
            doctors = Specialist.query.filter((Specialist.department == dept_name) | (Specialist.department_id == Department.id) & (Department.name == dept_name)).all()
            if not doctors:
                user_states[user_key] = {"step": "idle"}
                return {"reply": f"I apologize, but we don't have any {dept_name} specialists on duty right now. Shall I book you with a General Practitioner instead?", "actions": [{"label": "General Medicine", "type": "message", "payload": "book General Medicine"}]}
            user_states[user_key] = {"step": "booking_select_doctor", "data": {"dept": dept_name}, "doctors": [d.id for d in doctors]}
            return {"reply": f"Excellent choice. We have {len(doctors)} specialists in {dept_name}. Which doctor would you prefer to see?", "actions": [{"label": d.name, "type": "message", "payload": d.name} for d in doctors[:3]]}
        else:
            user_states[user_key] = {"step": "idle"}
            return {"reply": "Understood. I'm here if you have any other questions about our services or hospital navigation.", "actions": []}

    if state["step"] == "booking_select_doctor":
        doctors = Specialist.query.filter(Specialist.id.in_(state["doctors"])).all()
        selected_doctor = next((d for d in doctors if d.name.lower() in message or message in d.name.lower()), None)
        if selected_doctor:
            # Check sessions for this doctor
            sessions = DoctorSession.query.filter_by(specialist_id=selected_doctor.id, status="Active").all()
            session_info = "\n".join([f"• {s.day_of_week}: {s.start_time.strftime('%I:%M %p')} - Room {s.room_number}" for s in sessions]) if sessions else "No specific sessions listed."
            
            state["data"].update({"doctor_id": selected_doctor.id, "doctor_name": selected_doctor.name})
            state["step"] = "booking_collect_info"
            state["last_asked"] = "name"
            user_states[user_key] = state
            
            if patient_id:
                patient = Patient.query.get(patient_id)
                if patient:
                    state["data"].update({"full_name": patient.full_name, "phone_number": patient.phone_number})
                    state["last_asked"] = "datetime"
                    return {"reply": f"Dr. {selected_doctor.name} is available on:\n{session_info}\n\nWhen would you like to schedule your visit?", "actions": []}
            return {"reply": f"Selected Dr. {selected_doctor.name}. To proceed, could you please provide your full name for our records?", "actions": []}
        return {"reply": "I didn't quite catch the doctor's name. Please choose one of these specialists:", "actions": [{"label": d.name, "type": "message", "payload": d.name} for d in doctors[:3]]}

    if state["step"] == "booking_collect_info":
        data = state.get("data", {})
        if state["last_asked"] == "name":
            data["full_name"] = message.title()
            state["last_asked"] = "phone"
            return {"reply": f"Thank you, {data['full_name']}. May I have your contact phone number?", "actions": []}
        elif state["last_asked"] == "phone":
            if re.match(r'^\+?1?\d{9,15}$', message.replace(" ", "").replace("-", "")):
                data["phone_number"] = message
                state["last_asked"] = "datetime"
                return {"reply": "Perfect. Finally, what date and time would you like? (e.g., 'Today at 2pm')", "actions": []}
            return {"reply": "I'm sorry, that doesn't seem to be a valid phone number. Could you please re-enter it?", "actions": []}
        elif state["last_asked"] == "datetime":
            try:
                dt_obj = parse_date_simple(message)
                from app.services.appointment_service import book_appointment
                booking = book_appointment(full_name=data["full_name"], phone_number=data["phone_number"], specialist_id=data["doctor_id"], symptom=f"AI Receptionist: {data.get('dept')}", appointment_date=dt_obj, patient_id=patient_id)
                user_states[user_key] = {"step": "idle"}
                if isinstance(booking, dict) and "error" in booking: return {"reply": f"I apologize, I encountered an error: {booking['error']}", "actions": []}
                return {"reply": f"Your appointment with Dr. {data['doctor_name']} is confirmed for {dt_obj.strftime('%Y-%m-%d at %I:%M %p')}.\n\nToken: TKN-{booking.get('queue_number'):03d}\nEst. Wait: {booking.get('estimated_wait_time')} mins\n\nA confirmation has been sent to your phone.", "actions": [{"label": "View My Appointments", "type": "navigate", "payload": "/patient-dashboard"}]}
            except: return {"reply": "I had trouble understanding the date. Could you please specify it clearly, like 'Monday at 10 AM'?", "actions": []}

    # --- 2. HYBRID INTENT DETECTION (Receptionist Logic) ---
    
    # Keyword Overrides
    intent_override = None
    if any(w in message for w in ["hello", "hi", "hey", "ayubowan", "who are you"]): intent_override = "greeting"
    elif any(w in message for w in ["book", "appointment", "schedule", "channel"]): intent_override = "book_appointment"
    elif any(w in message for w in ["queue", "wait", "position", "turn", "token"]): intent_override = "queue_status"
    elif any(w in message for w in ["pain", "hurt", "sick", "symptom", "ill"]): intent_override = "recommend_specialist"
    elif any(w in message for w in ["check", "arrive", "here"]): intent_override = "check_in"
    elif any(w in message for w in ["doctor", "list", "specialist"]): intent_override = "doctor_availability"
    elif any(w in message for w in ["pharmacy", "map", "location", "hours", "time", "where"]): intent_override = "hospital_faq"

    intent, confidence = (intent_override, 1.0) if intent_override else ml_service.predict_intent(message)
    
    if confidence < CONFIDENCE_THRESHOLD:
        return {"reply": "I am the MediAssist AI Receptionist. I can assist you with symptom analysis, doctor channeling, checking your queue status, or navigating the hospital. How can I help you right now?", "actions": [{"label": "Symptom Analysis", "type": "message", "payload": "I feel unwell"}, {"label": "Book Doctor", "type": "message", "payload": "I want to book an appointment"}]}

    # --- 3. RECEPTIONIST INTENT HANDLERS ---

    if intent == "greeting":
        if any(w in message for w in ["logout", "sign out", "leave"]):
            return {"reply": "Are you sure you want to sign out and end our session?", "actions": [{"label": "Yes, Logout", "type": "navigate", "payload": "/"}, {"label": "No, Stay", "type": "message", "payload": "hi"}]}
        welcome = f"Good {'morning' if datetime.now().hour < 12 else 'afternoon' if datetime.now().hour < 18 else 'evening'}. I am your AI Hospital Receptionist. "
        return {"reply": welcome + "How can I assist you with your medical needs today?", "actions": [{"label": "Channel a Doctor", "type": "message", "payload": "book appointment"}, {"label": "Check Queue", "type": "message", "payload": "my queue status"}]}

    if intent == "recommend_specialist":
        dept, conf = ml_service.predict_symptom_dept(message)
        if conf > 0.3:
            user_states[user_key] = {"step": "awaiting_booking_confirmation", "dept": dept}
            return {"reply": f"Based on your symptoms, I recommend a consultation with our {dept} department. Would you like to view our available specialists and book a session?", "actions": [{"label": "Yes, view doctors", "type": "message", "payload": "yes"}, {"label": "No, thank you", "type": "message", "payload": "no"}]}
        return {"reply": "Could you please describe your symptoms in more detail so I can recommend the right specialist for you?", "actions": []}

    if intent == "book_appointment":
        # Check for specific doctor name in message
        all_docs = Specialist.query.all()
        doc = next((d for d in all_docs if d.name.lower() in message), None)
        if doc:
            user_states[user_key] = {"step": "booking_select_doctor", "data": {"dept": doc.department}, "doctors": [doc.id]}
            return process_message(doc.name, patient_id)
        
        # Check for department
        for dpt in ["Cardiology", "Dermatology", "Neurology", "Orthopedics", "General Medicine"]:
            if dpt.lower() in message:
                user_states[user_key] = {"step": "awaiting_booking_confirmation", "dept": dpt}
                return process_message("yes", patient_id)
        
        return {"reply": "I can certainly help you with channelling. Which department or specific doctor are you looking for?", "actions": [{"label": "Cardiology", "type": "message", "payload": "Cardiology"}, {"label": "Neurology", "type": "message", "payload": "Neurology"}]}

    if intent == "queue_status":
        if not patient_id: return {"reply": "Please log in to your portal to check your live queue position.", "actions": [{"label": "Patient Login", "type": "navigate", "payload": "/patient-login"}]}
        from app.services.queue_service import get_patient_queue_status
        q = get_patient_queue_status(patient_id)
        if q: return {"reply": f"Your current status for {q['department']}:\n• Token: {q['token']}\n• People Ahead: {q['people_ahead']}\n• Est. Wait: {q['estimated_wait']} mins", "actions": [{"label": "Full Queue View", "type": "navigate", "payload": "/queue"}]}
        return {"reply": "You don't have any active queue tokens for today. Would you like to book a new appointment?", "actions": [{"label": "Book Now", "type": "message", "payload": "book appointment"}]}

    if intent == "doctor_availability":
        depts = Department.query.all()
        return {"reply": "We have specialists available across several departments. Which area are you interested in?", "actions": [{"label": d.name, "type": "message", "payload": f"doctors in {d.name}"} for d in depts[:4]]}

    if intent == "hospital_faq":
        if "pharmacy" in message: return {"reply": "The pharmacy is on the Ground Floor, open 24/7.", "actions": []}
        if "hours" in message or "time" in message: return {"reply": "Our general visiting hours are 10 AM to 8 PM daily.", "actions": []}
        if "map" in message or "where" in message: return {"reply": "You can find floor maps near every elevator, or I can guide you to a specific wing.", "actions": [{"label": "Cardiology Wing", "type": "message", "payload": "where is cardiology"}]}
        if "cardiology" in message: return {"reply": "The Cardiology wing is on the 2nd Floor, Block B.", "actions": []}
        if "insurance" in message: return {"reply": "We partner with most major insurance providers. Please visit the billing counter for specific claim assistance.", "actions": []}
        return {"reply": "I can assist with hospital directions, visiting hours, pharmacy location, or insurance information. What do you need to know?", "actions": []}

    if intent == "check_in":
        return {"reply": "Welcome! You can check-in for your appointment using our facial recognition scanner or by entering your details manually.", "actions": [{"label": "Go to Check-In Page", "type": "navigate", "payload": "/checkin-out"}]}

    return {"reply": "I am the MediAssist AI Receptionist. I'm here to help you with symptoms, booking, and hospital information. How can I serve you today?", "actions": []}