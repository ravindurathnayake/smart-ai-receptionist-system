from datetime import date, datetime

from flask import Blueprint, request

from ..extensions import db, socketio
from ..models import (
    Appointment,
    DoctorSession,
    DoctorSessionRequest,
    LabReport,
    Patient,
    Prescription,
    Queue,
    Specialist,
    VitalRecord,
)
from ..services.queue_service import (
    call_next_patient,
    end_session,
    get_all_sessions_queues,
    skip_patient,
    start_session,
    toggle_session_pause,
)
from ..utils.response import error_response, success_response


doctor_bp = Blueprint("doctor_bp", __name__)


def _resolve_specialist(specialist_id=None):
    if specialist_id:
        specialist = Specialist.query.get(specialist_id)
        if specialist:
            return specialist
    return Specialist.query.order_by(Specialist.id.asc()).first()


def _doctor_display_name(specialist):
    if not specialist:
        return "Doctor"
    title = specialist.title or "Dr."
    return f"{title} {specialist.name}".strip()


def _serialize_session(session, today=None):
    today = today or date.today()
    session_day = session.session_date or today
    current_bookings = Appointment.query.filter(
        Appointment.doctor_session_id == session.id,
        db.func.date(Appointment.appointment_date) == session_day,
        Appointment.status != "Cancelled",
    ).count()
    waiting_count = db.session.query(db.func.count(Queue.id)).filter(
        Queue.doctor_session_id == session.id,
        Queue.status == "WAITING",
        db.func.date(Queue.check_in_time) == today,
    ).scalar() or 0
    checked_in_count = db.session.query(db.func.count(Queue.id)).filter(
        Queue.doctor_session_id == session.id,
        db.func.date(Queue.check_in_time) == today,
    ).scalar() or 0
    latest_arrival = (
        DoctorSessionRequest.query.filter_by(
            doctor_session_id=session.id,
            request_type="ARRIVAL_CONFIRMATION",
        )
        .order_by(DoctorSessionRequest.created_at.desc())
        .first()
    )

    return {
        "id": session.id,
        "day_of_week": session.day_of_week,
        "session_date": session.session_date.strftime("%Y-%m-%d") if session.session_date else None,
        "start_time": session.start_time.strftime("%H:%M") if session.start_time else None,
        "end_time": session.end_time.strftime("%H:%M") if session.end_time else None,
        "max_patients": session.max_patients,
        "current_count": session.current_count,
        "session_number": session.session_number,
        "room_number": session.room_number,
        "status": session.status,
        "current_bookings": current_bookings,
        "waiting_count": waiting_count,
        "checked_in_count": checked_in_count,
        "arrival_confirmed": bool(latest_arrival),
        "arrival_confirmed_at": latest_arrival.created_at.isoformat() if latest_arrival else None,
    }


def _serialize_appointment(appointment):
    patient = appointment.patient
    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "patient_name": patient.full_name if patient else "Unknown Patient",
        "patient_age": patient.age if patient else None,
        "patient_gender": patient.gender if patient else None,
        "blood_type": patient.blood_type if patient else None,
        "symptom": appointment.symptom,
        "priority_level": appointment.priority_level,
        "appointment_date": appointment.appointment_date.isoformat() if appointment.appointment_date else None,
        "status": appointment.status,
        "queue_number": appointment.queue_number,
        "room_number": appointment.session.room_number if appointment.session else None,
        "session_id": appointment.doctor_session_id,
        "session_number": appointment.session.session_number if appointment.session else None,
        "queue_status": appointment.queue.status if appointment.queue else None,
        "checked_in_at": appointment.queue.check_in_time.isoformat() if appointment.queue and appointment.queue.check_in_time else None,
        "checked_out_at": appointment.queue.check_out_time.isoformat() if appointment.queue and appointment.queue.check_out_time else None,
    }


def _serialize_request(item):
    return {
        "id": item.id,
        "specialist_id": item.specialist_id,
        "doctor_session_id": item.doctor_session_id,
        "request_type": item.request_type,
        "requested_date": item.requested_date.strftime("%Y-%m-%d") if item.requested_date else None,
        "requested_start_time": item.requested_start_time.strftime("%H:%M") if item.requested_start_time else None,
        "requested_end_time": item.requested_end_time.strftime("%H:%M") if item.requested_end_time else None,
        "requested_room_number": item.requested_room_number,
        "requested_max_patients": item.requested_max_patients,
        "reason": item.reason,
        "status": item.status,
        "admin_note": item.admin_note,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        "session": {
            "id": item.session.id,
            "session_date": item.session.session_date.strftime("%Y-%m-%d") if item.session and item.session.session_date else None,
            "start_time": item.session.start_time.strftime("%H:%M") if item.session and item.session.start_time else None,
            "end_time": item.session.end_time.strftime("%H:%M") if item.session and item.session.end_time else None,
            "room_number": item.session.room_number if item.session else None,
            "status": item.session.status if item.session else None,
        } if item.session else None,
    }


def _get_doctor_queue_sessions(specialist_id):
    allowed_session_ids = {
        item.id
        for item in DoctorSession.query.filter_by(specialist_id=specialist_id).all()
    }
    sessions = get_all_sessions_queues()
    filtered_sessions = []

    for item in sessions:
        session_id = item.get("session_id")
        if session_id not in allowed_session_ids:
            continue

        latest_arrival = (
            DoctorSessionRequest.query.filter_by(
                doctor_session_id=session_id,
                request_type="ARRIVAL_CONFIRMATION",
            )
            .order_by(DoctorSessionRequest.created_at.desc())
            .first()
        )

        filtered_sessions.append({
            **item,
            "arrival_confirmed": bool(latest_arrival),
            "arrival_confirmed_at": latest_arrival.created_at.isoformat() if latest_arrival else None,
        })

    return filtered_sessions


def _resolve_doctor_session(session_id, specialist_id):
    session = DoctorSession.query.get(session_id)
    if not session or session.specialist_id != specialist_id:
        return None
    return session


@doctor_bp.route("/profile", methods=["GET"])
def get_doctor_profile():
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    return success_response("Doctor profile retrieved", {
        "id": specialist.id,
        "display_name": _doctor_display_name(specialist),
        "name": specialist.name,
        "title": specialist.title,
        "department": specialist.department,
        "specialization": specialist.specialization,
        "email": specialist.email,
        "phone_number": specialist.phone_number,
        "languages": specialist.languages,
        "consultation_fee": specialist.consultation_fee,
        "experience_years": specialist.experience_years,
        "availability_status": specialist.availability_status,
        "bio": specialist.bio,
    })


@doctor_bp.route("/dashboard", methods=["GET"])
def get_doctor_dashboard():
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    today = date.today()
    sessions = DoctorSession.query.filter_by(specialist_id=specialist.id).order_by(
        DoctorSession.session_date.asc().nullslast(),
        DoctorSession.start_time.asc(),
    ).all()
    appointments = Appointment.query.filter_by(specialist_id=specialist.id).order_by(
        Appointment.appointment_date.desc()
    ).all()
    requests = DoctorSessionRequest.query.filter_by(specialist_id=specialist.id).order_by(
        DoctorSessionRequest.created_at.desc()
    ).all()

    upcoming_appointments = [
        _serialize_appointment(appt)
        for appt in appointments
        if appt.appointment_date and appt.appointment_date.date() >= today and appt.status != "Cancelled"
    ][:12]

    unique_recent = []
    seen_patient_ids = set()
    for appt in appointments:
        if appt.patient_id in seen_patient_ids:
            continue
        seen_patient_ids.add(appt.patient_id)
        patient = appt.patient
        unique_recent.append({
            "patient_id": appt.patient_id,
            "patient_name": patient.full_name if patient else "Unknown Patient",
            "latest_visit": appt.appointment_date.strftime("%Y-%m-%d") if appt.appointment_date else None,
            "latest_status": appt.status,
            "blood_type": patient.blood_type if patient else None,
            "age": patient.age if patient else None,
            "gender": patient.gender if patient else None,
            "symptom": appt.symptom,
        })
        if len(unique_recent) >= 10:
            break

    today_patient_count = sum(
        1 for appt in appointments if appt.appointment_date and appt.appointment_date.date() == today and appt.status != "Cancelled"
    )
    pending_request_count = sum(1 for item in requests if item.status == "Pending")

    return success_response("Doctor dashboard retrieved", {
        "doctor": {
            "id": specialist.id,
            "display_name": _doctor_display_name(specialist),
            "name": specialist.name,
            "title": specialist.title,
            "department": specialist.department,
            "specialization": specialist.specialization,
            "availability_status": specialist.availability_status,
            "email": specialist.email,
            "phone_number": specialist.phone_number,
            "bio": specialist.bio,
        },
        "stats": {
            "today_patients": today_patient_count,
            "total_patients": len({appt.patient_id for appt in appointments}),
            "upcoming_sessions": sum(
                1
                for sess in sessions
                if not sess.session_date or sess.session_date >= today
            ),
            "pending_requests": pending_request_count,
        },
        "sessions": [_serialize_session(sess, today=today) for sess in sessions],
        "upcoming_appointments": upcoming_appointments,
        "recent_patients": unique_recent,
        "session_requests": [_serialize_request(item) for item in requests[:10]],
    })


@doctor_bp.route("/session-requests", methods=["GET"])
def get_session_requests():
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    requests_list = DoctorSessionRequest.query.filter_by(specialist_id=specialist.id).order_by(
        DoctorSessionRequest.created_at.desc()
    ).all()
    return success_response("Doctor session requests retrieved", [_serialize_request(item) for item in requests_list])


@doctor_bp.route("/queue", methods=["GET"])
def get_doctor_queue():
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    return success_response("Doctor queue retrieved", _get_doctor_queue_sessions(specialist.id))


@doctor_bp.route("/queue/<int:session_id>/start", methods=["POST"])
def start_doctor_queue_session(session_id):
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int) or (request.get_json(silent=True) or {}).get("specialist_id"))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    session = _resolve_doctor_session(session_id, specialist.id)
    if not session:
        return error_response("Session not found for this doctor", 404)

    result = start_session(session.id)
    if result.get("error"):
        return error_response(result["error"], 400)
    return success_response(result.get("message", "Session started"), result)


@doctor_bp.route("/queue/<int:session_id>/call-next", methods=["POST"])
def call_next_doctor_queue_patient(session_id):
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int) or (request.get_json(silent=True) or {}).get("specialist_id"))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    session = _resolve_doctor_session(session_id, specialist.id)
    if not session:
        return error_response("Session not found for this doctor", 404)

    result = call_next_patient(session.id)
    if result.get("error"):
        return error_response(result["error"], 400)
    return success_response(result.get("message", "Next patient called"), result)


@doctor_bp.route("/queue/<int:session_id>/toggle-pause", methods=["POST"])
def toggle_doctor_queue_pause(session_id):
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int) or (request.get_json(silent=True) or {}).get("specialist_id"))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    session = _resolve_doctor_session(session_id, specialist.id)
    if not session:
        return error_response("Session not found for this doctor", 404)

    result = toggle_session_pause(session.id)
    if result.get("error"):
        return error_response(result["error"], 400)
    return success_response(result.get("message", "Session updated"), result)


@doctor_bp.route("/queue/<int:session_id>/end", methods=["POST"])
def end_doctor_queue_session(session_id):
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int) or (request.get_json(silent=True) or {}).get("specialist_id"))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    session = _resolve_doctor_session(session_id, specialist.id)
    if not session:
        return error_response("Session not found for this doctor", 404)

    result = end_session(session.id)
    if result.get("error"):
        return error_response(result["error"], 400)
    return success_response(result.get("message", "Session ended"), result)


@doctor_bp.route("/queue/patients/<int:queue_id>/skip", methods=["POST"])
def skip_doctor_queue_patient(queue_id):
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int) or (request.get_json(silent=True) or {}).get("specialist_id"))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    queue_item = Queue.query.get(queue_id)
    if not queue_item or not queue_item.appointment:
        return error_response("Queue item not found", 404)

    session = _resolve_doctor_session(queue_item.appointment.doctor_session_id, specialist.id)
    if not session:
        return error_response("Queue item does not belong to this doctor", 403)

    result = skip_patient(queue_id)
    if result.get("error"):
        return error_response(result["error"], 400)
    return success_response(result.get("message", "Patient skipped"), result)


@doctor_bp.route("/session-requests", methods=["POST"])
def create_session_request():
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int) or (request.get_json(silent=True) or {}).get("specialist_id"))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    data = request.get_json(silent=True) or {}
    request_type = data.get("request_type")
    if not request_type:
        return error_response("request_type is required", 400)

    request_type = request_type.upper()
    doctor_session_id = data.get("doctor_session_id")
    linked_session = DoctorSession.query.get(doctor_session_id) if doctor_session_id else None

    try:
        requested_date = datetime.strptime(data["requested_date"], "%Y-%m-%d").date() if data.get("requested_date") else None
        requested_start_time = datetime.strptime(data["requested_start_time"], "%H:%M").time() if data.get("requested_start_time") else None
        requested_end_time = datetime.strptime(data["requested_end_time"], "%H:%M").time() if data.get("requested_end_time") else None
    except ValueError:
        return error_response("Invalid requested date/time format", 400)

    status = "Approved" if request_type == "ARRIVAL_CONFIRMATION" else "Pending"
    admin_note = "Doctor arrival confirmed and recorded." if request_type == "ARRIVAL_CONFIRMATION" else None

    new_request = DoctorSessionRequest(
        specialist_id=specialist.id,
        doctor_session_id=doctor_session_id,
        request_type=request_type,
        requested_date=requested_date,
        requested_start_time=requested_start_time,
        requested_end_time=requested_end_time,
        requested_room_number=data.get("requested_room_number"),
        requested_max_patients=data.get("requested_max_patients"),
        reason=data.get("reason"),
        status=status,
        admin_note=admin_note,
    )
    db.session.add(new_request)
    db.session.commit()

    socketio.emit("doctor_request_created", {
        "id": new_request.id,
        "specialist_id": specialist.id,
        "request_type": new_request.request_type,
        "status": new_request.status,
    })

    message = "Arrival confirmation recorded." if request_type == "ARRIVAL_CONFIRMATION" else "Doctor request sent to admin."
    return success_response(message, _serialize_request(new_request), 201)


@doctor_bp.route("/patients/<int:patient_id>/records", methods=["GET"])
def get_patient_records(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int))

    appointments = Appointment.query.filter_by(patient_id=patient.id).order_by(Appointment.appointment_date.desc()).all()
    prescriptions = Prescription.query.filter_by(patient_id=patient.id).order_by(Prescription.created_at.desc()).all()
    lab_reports = LabReport.query.filter_by(patient_id=patient.id).order_by(LabReport.created_at.desc()).all()
    vitals = VitalRecord.query.filter_by(patient_id=patient.id).order_by(VitalRecord.created_at.desc()).all()

    doctor_visit_history = [
        _serialize_appointment(appt)
        for appt in appointments
        if specialist and appt.specialist_id == specialist.id
    ]

    return success_response("Doctor patient records retrieved", {
        "patient": {
            "id": patient.id,
            "formatted_id": f"PAT-{patient.id:04d}",
            "full_name": patient.full_name,
            "age": patient.age,
            "gender": patient.gender,
            "blood_type": patient.blood_type,
            "nic": patient.nic,
            "phone_number": patient.phone_number,
            "email": patient.email,
            "medical_history": patient.medical_history,
            "guardian_name": patient.guardian_name,
            "guardian_phone": patient.guardian_phone,
            "emergency_contact_name": patient.emergency_contact_name,
            "emergency_contact_phone": patient.emergency_contact_phone,
        },
        "doctor_visits": doctor_visit_history,
        "appointments": [_serialize_appointment(appt) for appt in appointments],
        "prescriptions": [{
            "id": item.id,
            "doctor_name": item.doctor_name,
            "medications": item.medications,
            "instructions": item.instructions,
            "attachment": item.attachment,
            "date": item.created_at.strftime("%Y-%m-%d"),
            "appointment_id": item.appointment_id,
        } for item in prescriptions],
        "lab_reports": [{
            "id": item.id,
            "test_name": item.test_name,
            "result_summary": item.result_summary,
            "attachment": item.attachment,
            "status": item.status,
            "date": item.created_at.strftime("%Y-%m-%d"),
        } for item in lab_reports],
        "vital_records": [{
            "id": item.id,
            "doctor_name": item.doctor_name,
            "blood_pressure": item.blood_pressure,
            "blood_sugar": item.blood_sugar,
            "heart_rate": item.heart_rate,
            "temperature": item.temperature,
            "weight": item.weight,
            "oxygen_saturation": item.oxygen_saturation,
            "notes": item.notes,
            "appointment_id": item.appointment_id,
            "date": item.created_at.strftime("%Y-%m-%d %H:%M"),
        } for item in vitals],
    })


@doctor_bp.route("/patients/<int:patient_id>/prescriptions", methods=["POST"])
def add_doctor_prescription(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int) or (request.get_json(silent=True) or {}).get("specialist_id"))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    data = request.get_json(silent=True) or {}
    if not data.get("medications"):
        return error_response("medications is required", 400)

    new_prescription = Prescription(
        patient_id=patient.id,
        appointment_id=data.get("appointment_id"),
        doctor_name=data.get("doctor_name") or _doctor_display_name(specialist),
        medications=data.get("medications"),
        instructions=data.get("instructions"),
        attachment=data.get("attachment"),
    )
    db.session.add(new_prescription)
    db.session.commit()

    socketio.emit("patient_medical_updated", {"patient_id": patient.id, "type": "prescription"})
    return success_response("Prescription added successfully", {"id": new_prescription.id}, 201)


@doctor_bp.route("/patients/<int:patient_id>/vitals", methods=["POST"])
def add_vital_record(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    specialist = _resolve_specialist(request.args.get("specialist_id", type=int) or (request.get_json(silent=True) or {}).get("specialist_id"))
    if not specialist:
        return error_response("No specialist profile found for doctor access", 404)

    data = request.get_json(silent=True) or {}
    new_record = VitalRecord(
        patient_id=patient.id,
        appointment_id=data.get("appointment_id"),
        specialist_id=specialist.id,
        doctor_name=data.get("doctor_name") or _doctor_display_name(specialist),
        blood_pressure=data.get("blood_pressure"),
        blood_sugar=data.get("blood_sugar"),
        heart_rate=data.get("heart_rate"),
        temperature=data.get("temperature"),
        weight=data.get("weight"),
        oxygen_saturation=data.get("oxygen_saturation"),
        notes=data.get("notes"),
    )
    db.session.add(new_record)
    db.session.commit()

    socketio.emit("patient_medical_updated", {"patient_id": patient.id, "type": "vitals"})
    return success_response("Vital record saved successfully", {"id": new_record.id}, 201)
