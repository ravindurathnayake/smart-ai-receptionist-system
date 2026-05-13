from app.services.ml_service import ml_service
from app.models import Specialist, Appointment, Patient, Department, DoctorSession
from app.extensions import db
from datetime import datetime, timedelta
import re

# In-memory state tracker
user_states = {}

CONFIDENCE_THRESHOLD = 0.25 

def get_session_buttons(specialist_id):
    from app.services.appointment_service import get_specialist_availability
    import datetime
    
    today = datetime.date.today()
    buttons = []
    
    for i in range(4): # Next 4 days
        date_obj = today + datetime.timedelta(days=i)
        date_str = date_obj.isoformat()
        day_label = "Today" if i == 0 else "Tomorrow" if i == 1 else date_obj.strftime("%A (%d/%m)")
        
        try:
            sessions = get_specialist_availability(specialist_id, date_str)
            for s in sessions:
                label = f"{day_label} @ {s['start_time']}"
                # We use a structured payload that we can easily parse
                payload = f"session_{s['id']}_{date_str}_{s['start_time']}"
                buttons.append({"label": label, "type": "message", "payload": payload, "variant": "primary"})
                if len(buttons) >= 5: break
        except:
            continue
        if len(buttons) >= 5: break
        
    return buttons

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
    # Ensure state exists for this user
    if user_key not in user_states:
        user_states[user_key] = {"step": "idle", "data": {}}
    state = user_states[user_key]
    data = state.setdefault("data", {})

    # --- 1. HANDLE CONVERSATIONAL FLOWS (Multi-step Tasks) ---

    if state["step"] == "booking_department_selection":
        # Get all departments for matching
        all_depts = Department.query.all()
        selected_dept = next((d for d in all_depts if d.name.lower() in message or message in d.name.lower()), None)
        
        if selected_dept:
            dept_name = selected_dept.name
            doctors = Specialist.query.filter((Specialist.department_id == selected_dept.id) | (Specialist.department == dept_name)).all()
            
            if not doctors:
                user_states[user_key] = {"step": "booking_department_selection"}
                return {
                    "reply": f"No {dept_name} doctors are available today. Would you like to choose another department or view all doctors?",
                    "actions": [
                        {"label": "Choose Another", "type": "message", "payload": "book appointment", "variant": "secondary"},
                        {"label": "View All Doctors", "type": "navigate", "payload": "/doctors", "variant": "outline"}
                    ]
                }
            
            if len(doctors) == 1:
                doc = doctors[0]
                user_states[user_key] = {"step": "booking_select_doctor", "data": {"dept": dept_name}, "doctors": [doc.id]}
                return {
                    "reply": f"I found Dr. {doc.name} for {dept_name}. Would you like to view available sessions?",
                    "actions": [
                        {"label": "Yes, View Sessions", "type": "message", "payload": doc.name, "variant": "primary"},
                        {"label": "Choose Another", "type": "message", "payload": "book appointment", "variant": "warning"}
                    ]
                }
            else:
                user_states[user_key] = {"step": "booking_select_doctor", "data": {"dept": dept_name}, "doctors": [d.id for d in doctors]}
                return {
                    "reply": f"I found {len(doctors)} {dept_name} doctors. Please choose one or open the Find Doctors page.",
                    "actions": [{"label": d.name, "type": "message", "payload": d.name, "variant": "primary"} for d in doctors[:3]] + [
                        {"label": "Open Find Doctors Page", "type": "navigate", "payload": "/doctors", "variant": "info"},
                        {"label": "Choose Another Department", "type": "message", "payload": "book appointment", "variant": "warning"}
                    ]
                }
        
        # If no department matched, check if they want symptoms
        if "don't know" in message or "not sure" in message or "help" in message:
            user_states[user_key] = {"step": "idle"}
            return process_message("I don't know which doctor to see", patient_id)
            
        return {
            "reply": "I couldn't find that department. Which department or doctor would you like to book? (e.g., Cardiology, Neurology)",
            "actions": [{"label": d.name, "type": "message", "payload": d.name, "variant": "primary"} for d in all_depts[:4]] + [
                {"label": "I don't know (Describe Symptoms)", "type": "message", "payload": "I don't know which doctor to see", "variant": "danger"}
            ]
        }

    elif state["step"] == "symptom_triage_confirmation":
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
            session_info = "\n".join([f"- {s.day_of_week}: {s.start_time.strftime('%I:%M %p')} - Room {s.room_number}" for s in sessions]) if sessions else "No specific sessions listed."
            
            # Initialize data if not already there (should be handled by process_message start)
            state["step"] = "booking_collect_info"
            state["last_asked"] = "nic"
            data.update({"doctor_id": selected_doctor.id, "doctor_name": selected_doctor.name})
            
            if patient_id:
                patient = Patient.query.get(patient_id)
                if patient:
                    state["data"].update({"full_name": patient.full_name, "phone_number": patient.phone_number, "nic": patient.nic})
                    state["last_asked"] = "datetime"
                    buttons = get_session_buttons(selected_doctor.id)
                    return {
                        "reply": f"Dr. {selected_doctor.name} is available on these upcoming sessions. Which one works best for you?", 
                        "actions": buttons
                    }
            
            return {"reply": f"Selected Dr. {selected_doctor.name}. To proceed, could you please provide your NIC number for identification?", "actions": []}
        return {"reply": "I didn't quite catch the doctor's name. Please choose one of these specialists:", "actions": [{"label": d.name, "type": "message", "payload": d.name} for d in doctors[:3]]}

    elif state["step"] == "booking_collect_info":
        if state["last_asked"] == "nic":
            # Simple NIC validation (usually 9 digits + V or 12 digits)
            nic_clean = message.replace(" ", "").upper()
            if re.match(r'^(\d{9}[VX]|\d{12})$', nic_clean):
                data["nic"] = nic_clean
                
                # Try to find patient by NIC to get their name
                existing_patient = Patient.query.filter_by(nic=nic_clean).first()
                if existing_patient:
                    data["full_name"] = existing_patient.full_name
                    state["last_asked"] = "phone"
                    return {"reply": f"Welcome back, {existing_patient.full_name.split(' ')[0]}. May I have your contact phone number to confirm?", "actions": []}
                else:
                    state["last_asked"] = "name"
                    return {"reply": "I don't see your NIC in our system. Since you're new, could you please also provide your full name?", "actions": []}
            return {"reply": "That doesn't look like a valid NIC number. Please enter your 9-digit (with V/X) or 12-digit NIC.", "actions": []}
        
        elif state["last_asked"] == "name":
            data["full_name"] = message.title()
            state["last_asked"] = "phone"
            return {"reply": f"Thank you, {data['full_name']}. May I have your contact phone number?", "actions": []}
            
        elif state["last_asked"] == "phone":
            if re.match(r'^\+?1?\d{9,15}$', message.replace(" ", "").replace("-", "")):
                data["phone_number"] = message
                state["last_asked"] = "datetime"
                buttons = get_session_buttons(data["doctor_id"])
                return {
                    "reply": f"Thank you. I found these available sessions for Dr. {data['doctor_name']}. Please choose one:", 
                    "actions": buttons
                }
            return {"reply": "I'm sorry, that doesn't seem to be a valid phone number. Could you please re-enter it?", "actions": []}
        elif state["last_asked"] == "datetime":
            try:
                doctor_session_id = None
                if message.startswith("session_"):
                    parts = message.split("_")
                    doctor_session_id = int(parts[1])
                    dt_str = f"{parts[2]} {parts[3]}"
                    dt_obj = datetime.strptime(dt_str, "%Y-%m-%d %I:%M %p")
                else:
                    dt_obj = parse_date_simple(message)
                
                # Store data and move to confirmation step
                data["appointment_date"] = dt_obj.isoformat()
                data["doctor_session_id"] = doctor_session_id
                state["step"] = "final_booking_confirmation"
                
                summary = (
                    f"Please confirm your appointment details:\n\n"
                    f"Doctor: Dr. {data['doctor_name']}\n"
                    f"Date: {dt_obj.strftime('%Y-%m-%d')}\n"
                    f"Time: {dt_obj.strftime('%I:%M %p')}\n"
                    f"Patient: {data.get('full_name')}\n"
                    f"NIC: {data.get('nic')}\n\n"
                    f"Is this correct?"
                )
                
                return {
                    "reply": summary,
                    "actions": [
                        {"label": "Confirm Booking", "type": "message", "payload": "confirm_booking", "variant": "primary"},
                        {"label": "Cancel/Edit", "type": "message", "payload": "book appointment", "variant": "secondary"}
                    ]
                }
            except Exception as e:
                return {"reply": f"I had trouble understanding that. Could you please choose a session from the buttons above or type the date clearly?", "actions": []}

    elif state["step"] == "final_booking_confirmation":
        if "confirm" in message.lower() or "yes" in message.lower():
            try:
                dt_obj = datetime.fromisoformat(data["appointment_date"])
                from app.services.appointment_service import book_appointment
                booking = book_appointment(
                    full_name=data.get("full_name"), 
                    phone_number=data.get("phone_number"), 
                    specialist_id=data["doctor_id"], 
                    symptom=f"AI Receptionist: {data.get('dept')}", 
                    appointment_date=dt_obj, 
                    nic=data.get("nic"),
                    doctor_session_id=data.get("doctor_session_id"),
                    patient_id=patient_id
                )
                user_states[user_key] = {"step": "idle"}
                if isinstance(booking, dict) and "error" in booking: 
                    return {"reply": f"I apologize, I encountered an error: {booking['error']}", "actions": []}
                
                # Fetch doctor details for the payment page
                doc = Specialist.query.get(data["doctor_id"])
                
                return {
                    "reply": f"Perfect! Your appointment with Dr. {data['doctor_name']} is confirmed for {dt_obj.strftime('%Y-%m-%d at %I:%M %p')}. Now, please proceed to the payment page to settle the consultation and hospital fees to finalize your booking.", 
                    "actions": [
                        {
                            "label": "Proceed to Payment", 
                            "type": "navigate", 
                            "payload": "/payment",
                            "data": {
                                "appointment": {
                                    **booking,
                                    "full_name": data.get("patient_name"),
                                    "phone_number": data.get("phone_number"),
                                    "appointment_date": dt_obj.strftime('%Y-%m-%d %I:%M %p'),
                                    "session_id": data.get("doctor_session_id")
                                },
                                "doctor": {
                                    "id": doc.id,
                                    "name": f"{doc.title} {doc.name}",
                                    "specialty": doc.specialization,
                                    "consultation_fee": doc.consultation_fee
                                }
                            }
                        },
                        {"label": "Back to Dashboard", "type": "navigate", "payload": "/patient-dashboard"}
                    ]
                }
            except Exception as e:
                return {"reply": "I encountered an error while booking. Would you like to try again?", "actions": [{"label": "Try Again", "type": "message", "payload": "book appointment"}]}
        else:
            user_states[user_key] = {"step": "idle"}
            return {"reply": "Booking cancelled. How else can I help you today?", "actions": [{"label": "Book Appointment", "type": "message", "payload": "book appointment"}]}

    # --- 2. HYBRID INTENT DETECTION (Receptionist Logic) ---
    
    # Keyword Overrides
    intent_override = None
    # 1. Emergency (Top Priority)
    if any(w in message for w in ["emergency", "can't breathe", "breathing", "heart attack", "unconscious", "bleeding", "severe chest pain", "suicide", "die"]): 
        intent_override = "emergency"
    elif any(w in message for w in ["hello", "hi", "hey", "ayubowan", "who are you", "what is your name"]): 
        intent_override = "greeting"
    elif any(w in message for w in ["appointment", "next", "when", "scheduled"]) and "next" in message: 
        intent_override = "next_appointment"
    elif any(w in message for w in ["department", "specialist", "list", "show doctors"]): 
        intent_override = "doctor_availability"
    elif any(w in message for w in ["book", "appointment", "schedule", "channel", "doctor", "find doctor", "available"]): 
        intent_override = "book_appointment"
    elif any(w in message for w in ["queue", "wait", "position", "turn", "token"]): 
        intent_override = "queue_status"
    elif any(w in message for w in ["pain", "hurt", "sick", "symptom", "ill", "describe"]): 
        intent_override = "recommend_specialist"
    elif any(w in message for w in ["check in", "check-in", "arrive", "arrived"]): 
        intent_override = "check_in"
    elif any(w in message for w in ["prescription", "medication", "medicine"]): 
        intent_override = "show_prescriptions"
    elif any(w in message for w in ["report", "lab", "test result"]): 
        intent_override = "show_lab_reports"
    elif any(w in message for w in ["pay", "bill", "money", "cost", "price", "method", "card", "qr"]): 
        intent_override = "payment_info"
    elif any(w in message for w in ["register", "new patient", "sign up", "account"]): 
        intent_override = "registration_help"
    elif any(w in message for w in ["where", "location", "map", "room", "pharmacy", "emergency", "lab", "ward", "block", "wing", "hours", "time"]): 
        intent_override = "hospital_faq"
    elif any(w in message for w in ["help", "do", "system", "work", "support"]): 
        intent_override = "general_help"

    intent, confidence = (intent_override, 1.0) if intent_override else ml_service.predict_intent(message)
    
    if confidence < CONFIDENCE_THRESHOLD:
        return {"reply": "I am the MediAssist AI Receptionist. I can assist you with symptom analysis, doctor channeling, checking your queue status, or navigating the hospital. How can I help you right now?", "actions": [{"label": "Symptom Analysis", "type": "message", "payload": "I feel unwell"}, {"label": "Book Doctor", "type": "message", "payload": "I want to book an appointment"}]}

    # --- 3. RECEPTIONIST INTENT HANDLERS ---

    if intent == "emergency":
        return {
            "reply": "EMERGENCY: If you or someone else is in immediate danger, please proceed to the Emergency Room (Block E, Ground Floor) immediately or call our hotline at 1990. I can also show you the hospital map for directions.",
            "actions": [
                {"label": "Show Emergency Map", "type": "navigate", "payload": "/hospital-map?destination=emergency"},
                {"label": "Call Support", "type": "message", "payload": "call for help"}
            ]
        }

    if intent == "greeting":
        patient_name = ""
        if patient_id:
            p = Patient.query.get(patient_id)
            if p: patient_name = f", {p.full_name.split(' ')[0]}"
            
        if any(w in message for w in ["logout", "sign out", "leave"]):
            return {"reply": "Are you sure you want to sign out and end our session?", "actions": [{"label": "Yes, Logout", "type": "navigate", "payload": "/"}, {"label": "No, Stay", "type": "message", "payload": "hi"}]}
        
        if "who are you" in message or "what is your name" in message:
            return {"reply": "I am MediAssist AI, your digital hospital receptionist. I can help you with bookings, queue tracking, and hospital navigation. How can I serve you today?", "actions": [{"label": "Channel a Doctor", "type": "message", "payload": "book appointment"}, {"label": "Check Queue", "type": "message", "payload": "my queue status"}]}
            
        welcome = f"Good {'morning' if datetime.now().hour < 12 else 'afternoon' if datetime.now().hour < 18 else 'evening'}{patient_name}. I am your AI Hospital Receptionist. "
        return {"reply": welcome + "How can I assist you with your medical needs today?", "actions": [{"label": "Channel a Doctor", "type": "message", "payload": "book appointment"}, {"label": "Check Queue", "type": "message", "payload": "my queue status"}]}

    if intent == "recommend_specialist":
        # Bypass symptom prompt if we are in a booking flow, unless explicitly asked
        if state["step"] != "idle" and "don't know" not in message:
            # Re-route to state handler
            pass
        else:
            dept, conf = ml_service.predict_symptom_dept(message)
            if conf > 0.3:
                user_states[user_key] = {"step": "symptom_triage_confirmation", "dept": dept}
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
        all_depts = Department.query.all()
        selected_dept = next((d for d in all_depts if d.name.lower() in message), None)
        if selected_dept:
            user_states[user_key] = {"step": "booking_department_selection"}
            return process_message(selected_dept.name, patient_id)
        
        user_states[user_key] = {"step": "booking_department_selection"}
        return {
            "reply": "I can certainly help you with channelling. Which department or specific doctor are you looking for?", 
            "actions": [{"label": d.name, "type": "message", "payload": d.name, "variant": "primary"} for d in all_depts[:4]] + [
                {"label": "I don't know (Describe Symptoms)", "type": "message", "payload": "I don't know which doctor to see", "variant": "danger"}
            ]
        }

    if intent == "queue_status":
        if not patient_id: return {"reply": "Please log in to your portal to check your live queue position.", "actions": [{"label": "Patient Login", "type": "navigate", "payload": "/patient-login"}]}
        from app.services.queue_service import get_patient_queue_status
        q = get_patient_queue_status(patient_id)
        if q: return {"reply": f"Your current status for {q['department']}:\n- Token: {q['token']}\n- People Ahead: {q['people_ahead']}\n- Est. Wait: {q['estimated_wait']} mins", "actions": [{"label": "Full Queue View", "type": "navigate", "payload": "/queue"}]}
        return {"reply": "You don't have any active queue tokens for today. Would you like to book a new appointment?", "actions": [{"label": "Book Now", "type": "message", "payload": "book appointment"}]}

    if intent == "next_appointment":
        if not patient_id: return {"reply": "Please log in to check your appointments.", "actions": [{"label": "Login", "type": "navigate", "payload": "/patient-login"}]}
        appt = Appointment.query.filter(Appointment.patient_id == patient_id, Appointment.appointment_date >= datetime.now()).order_by(Appointment.appointment_date).first()
        if appt:
            return {"reply": f"Your next appointment is with Dr. {appt.specialist.name} on {appt.appointment_date.strftime('%A, %d %B at %I:%M %p')}.", "actions": [{"label": "View Dashboard", "type": "navigate", "payload": "/patient-dashboard"}]}
        return {"reply": "You don't have any upcoming appointments scheduled.", "actions": [{"label": "Book One Now", "type": "message", "payload": "book appointment"}]}

    if intent == "show_prescriptions":
        if not patient_id: return {"reply": "Please log in to view your prescriptions.", "actions": [{"label": "Login", "type": "navigate", "payload": "/patient-login"}]}
        from app.models import Prescription
        prescs = Prescription.query.filter_by(patient_id=patient_id).order_by(Prescription.created_at.desc()).limit(3).all()
        if not prescs: return {"reply": "I couldn't find any prescriptions in your record.", "actions": []}
        summary = "Here are your recent prescriptions:\n" + "\n".join([f"- {p.created_at.strftime('%Y-%m-%d')}: {p.medications} (Dr. {p.doctor_name})" for p in prescs])
        return {"reply": summary, "actions": [{"label": "View All in Dashboard", "type": "navigate", "payload": "/patient-dashboard"}]}

    if intent == "show_lab_reports":
        if not patient_id: return {"reply": "Please log in to view your lab reports.", "actions": [{"label": "Login", "type": "navigate", "payload": "/patient-login"}]}
        from app.models import LabReport
        reports = LabReport.query.filter_by(patient_id=patient_id).order_by(LabReport.created_at.desc()).limit(3).all()
        if not reports: return {"reply": "I couldn't find any lab reports in your record.", "actions": []}
        summary = "Here are your recent lab reports:\n" + "\n".join([f"- {r.created_at.strftime('%Y-%m-%d')}: {r.test_name} - {r.status}" for r in reports])
        return {"reply": summary, "actions": [{"label": "View All in Dashboard", "type": "navigate", "payload": "/patient-dashboard"}]}

    if intent == "doctor_availability":
        all_depts = Department.query.all()
        return {
            "reply": "We have specialists available across several departments. You can choose a department below to see doctors, or view all available specialists.", 
            "actions": [{"label": d.name, "type": "message", "payload": f"doctors in {d.name}"} for d in all_depts[:4]] + [
                {"label": "View All Doctors", "type": "navigate", "payload": "/doctors"}
            ]
        }

    if intent == "hospital_faq":
        if "pharmacy" in message: return {"reply": "The pharmacy is on the Ground Floor (Block A), open 24/7.", "actions": [{"label": "Show Map", "type": "navigate", "payload": "/hospital-map?destination=pharmacy"}]}
        if "lab" in message or "laboratory" in message: return {"reply": "The Laboratory is on the 1st Floor, Block B. You can follow the blue signs from the lobby.", "actions": [{"label": "Show Map", "type": "navigate", "payload": "/hospital-map?destination=lab"}]}
        if "emergency" in message: return {"reply": "The Emergency wing is on the Ground Floor, Block E. It has its own entrance for vehicles.", "actions": [{"label": "Emergency Map", "type": "navigate", "payload": "/hospital-map?destination=emergency"}]}
        if "hours" in message or "time" in message: return {"reply": "Our general visiting hours are 10:00 AM to 1:00 PM and 4:00 PM to 8:00 PM daily. Intensive care unit (ICU) visiting is limited to immediate family only.", "actions": []}
        if "insurance" in message: return {"reply": "We partner with most major insurance providers including MyMed, LifeSecure, and HealthFirst. Please visit the billing counter for claim assistance.", "actions": []}
        if "map" in message or "where" in message: return {"reply": "I can help you find your way. Use the interactive hospital map to see all floors and departments.", "actions": [{"label": "Open Hospital Map", "type": "navigate", "payload": "/hospital-map"}]}
        return {"reply": "I can assist with hospital directions, visiting hours, pharmacy location, or insurance information. What do you need to know?", "actions": [{"label": "Hospital Map", "type": "navigate", "payload": "/hospital-map"}]}

    if intent == "check_in":
        return {
            "reply": "Welcome! You can check-in for your appointment using our facial recognition scanner (if you've registered your face) or by entering your NIC/Mobile number manually.", 
            "actions": [
                {"label": "Go to Check-In Page", "type": "navigate", "payload": "/checkin-out"},
                {"label": "Manual Check-In", "type": "navigate", "payload": "/manual-checkin"}
            ]
        }


    if intent == "payment_info":
        return {
            "reply": "We accept Cash, Credit/Debit cards (Visa/MasterCard), and LankaQR payments. You can settle your bills at the main billing counter on the Ground Floor or use our automated payment kiosks if you have a QR-coded invoice.",
            "actions": [
                {"label": "Pay Now (Kiosk)", "type": "navigate", "payload": "/payment"},
                {"label": "Show Billing Counter", "type": "navigate", "payload": "/hospital-map?destination=reception"}
            ]
        }

    if intent == "registration_help":
        return {
            "reply": "To register as a new patient, you will need to provide your National Identity Card (NIC) or Passport and basic contact details. You can register right here at the kiosk or at the registration counter in the lobby.",
            "actions": [
                {"label": "Register Now", "type": "navigate", "payload": "/register/step1"},
                {"label": "Registration Counter", "type": "navigate", "payload": "/hospital-map?destination=reception"}
            ]
        }

    if intent == "general_help":
        return {
            "reply": "Welcome to MediAssist! I am your digital assistant. You can ask me to 'book a doctor', 'check your queue position', 'find the pharmacy', or 'explain how to pay'. How can I help you right now?",
            "actions": [
                {"label": "Book Appointment", "type": "message", "payload": "book appointment"},
                {"label": "Check My Queue", "type": "message", "payload": "my queue status"},
                {"label": "How to Check-In", "type": "message", "payload": "how to check in"},
                {"label": "Hospital Map", "type": "navigate", "payload": "/hospital-map"}
            ]
        }

    return {"reply": "I am the MediAssist AI Receptionist. I'm here to help you with symptoms, booking, and hospital information. How can I serve you today?", "actions": [{"label": "Need Help?", "type": "message", "payload": "help"}]}
