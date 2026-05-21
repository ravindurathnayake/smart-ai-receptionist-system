from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.specialist import Specialist
from ..models.doctor_session import DoctorSession
from ..models.appointment import Appointment
from ..models.queue import Queue
from datetime import datetime, date

from ..utils.response import success_response, error_response

specialist_bp = Blueprint("specialist_bp", __name__)

TIME_INPUT_FORMATS = ("%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M:%S %p")


def _parse_session_time(value, field_name):
    if value is None:
        raise ValueError(f"{field_name} is required")

    if hasattr(value, "hour") and hasattr(value, "minute") and not isinstance(value, str):
        return value

    raw_value = str(value).strip()
    if not raw_value:
        raise ValueError(f"{field_name} is required")

    for time_format in TIME_INPUT_FORMATS:
        try:
            return datetime.strptime(raw_value, time_format).time()
        except ValueError:
            continue

    raise ValueError(f"Invalid {field_name} format: {raw_value}")


def _parse_session_date(value):
    if value in (None, ""):
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    raw_value = str(value).strip()
    if not raw_value:
        return None

    try:
        return date.fromisoformat(raw_value)
    except ValueError as exc:
        raise ValueError(f"Invalid session_date format: {raw_value}") from exc


def _normalize_session_status(value):
    if value in (None, ""):
        return "NOT_STARTED"

    normalized = str(value).strip().replace(" ", "_").upper()
    status_map = {
        "NOT_STARTED": "NOT_STARTED",
        "ACTIVE": "ACTIVE",
        "PAUSED": "PAUSED",
        "ENDED": "ENDED",
        "CANCELLED": "Cancelled",
        "NEEDS_RESCHEDULE": "NEEDS_RESCHEDULE",
    }
    return status_map.get(normalized, str(value).strip())


def _coerce_int(value, default=None):
    if value in (None, ""):
        return default

    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid numeric value: {value}") from exc


def _build_session_model(specialist_id, sess, fallback_session_number=None):
    start_t = _parse_session_time(sess.get("start_time"), "start_time")
    end_t = _parse_session_time(sess.get("end_time"), "end_time")
    s_date = _parse_session_date(sess.get("session_date"))
    d_of_w = sess.get("day_of_week")

    if s_date:
        d_of_w = s_date.strftime("%A")

    return DoctorSession(
        specialist_id=specialist_id,
        day_of_week=d_of_w,
        session_date=s_date,
        start_time=start_t,
        end_time=end_t,
        max_patients=_coerce_int(sess.get("max_patients"), 20) or 20,
        session_number=_coerce_int(sess.get("session_number"), fallback_session_number),
        room_number=sess.get("room_number"),
        status=_normalize_session_status(sess.get("status")),
    )


def _apply_session_payload(session, sess, fallback_session_number=None):
    start_t = _parse_session_time(sess.get("start_time"), "start_time")
    end_t = _parse_session_time(sess.get("end_time"), "end_time")
    s_date = _parse_session_date(sess.get("session_date"))
    d_of_w = sess.get("day_of_week")

    if s_date:
        d_of_w = s_date.strftime("%A")

    session.day_of_week = d_of_w
    session.session_date = s_date
    session.start_time = start_t
    session.end_time = end_t
    session.max_patients = _coerce_int(sess.get("max_patients"), 20) or 20
    session.session_number = _coerce_int(sess.get("session_number"), fallback_session_number)
    session.room_number = sess.get("room_number")
    session.status = _normalize_session_status(sess.get("status") or session.status)
    return session

@specialist_bp.route("/", methods=["GET"])
def get_specialists():
    try:
        today = date.today()
        specialists = Specialist.query.all()
        return success_response("Specialists retrieved successfully", [{
            "id": s.id,
            "name": s.name,
            "title": s.title,
            "email": s.email,
            "phone_number": s.phone_number,
            "department": s.department,
            "department_id": s.department_id,
            "specialization": s.specialization,
            "experience_years": s.experience_years,
            "rating": s.rating,
            "languages": s.languages,
            "consultation_fee": s.consultation_fee,
            "profile_image": s.profile_image,
            "availability_status": s.availability_status,
            "bio": s.bio,
            "sessions": [{
                "id": sess.id,
                "day_of_week": sess.day_of_week,
                "session_date": sess.session_date.strftime("%Y-%m-%d") if sess.session_date else None,
                "start_time": sess.start_time.strftime("%H:%M"),
                "end_time": sess.end_time.strftime("%H:%M"),
                "max_patients": sess.max_patients,
                "current_count": sess.current_count,
                "session_number": sess.session_number,
                "room_number": sess.room_number,
                "status": sess.status,
                "current_bookings": Appointment.query.filter(
                    Appointment.doctor_session_id == sess.id,
                    db.func.date(Appointment.appointment_date) == (sess.session_date if sess.session_date else today),
                    Appointment.status != "Cancelled"
                ).count(),
                "waiting_count": db.session.query(db.func.count(Queue.id)).filter(
                    Queue.doctor_session_id == sess.id,
                    Queue.status == "WAITING",
                    db.func.date(Queue.check_in_time) == today
                ).scalar() or 0,
                "checked_in_count": db.session.query(db.func.count(Queue.id)).filter(
                    Queue.doctor_session_id == sess.id,
                    db.func.date(Queue.check_in_time) == today
                ).scalar() or 0
            } for sess in s.sessions]
        } for s in specialists])
    except Exception as e:
        return error_response(str(e), 500)

@specialist_bp.route("/<int:specialist_id>", methods=["GET"])
def get_specialist(specialist_id):
    try:
        s = Specialist.query.get_or_404(specialist_id)
        return success_response("Specialist details retrieved", {
            "id": s.id,
            "name": s.name,
            "department": s.department,
            "specialization": s.specialization,
            "experience_years": s.experience_years,
            "rating": s.rating,
            "languages": s.languages,
            "consultation_fee": s.consultation_fee,
            "profile_image": s.profile_image,
            "availability_status": s.availability_status,
            "bio": s.bio,
            "sessions": [{
                "id": sess.id,
                "day_of_week": sess.day_of_week,
                "session_date": sess.session_date.strftime("%Y-%m-%d") if sess.session_date else None,
                "start_time": sess.start_time.strftime("%H:%M"),
                "end_time": sess.end_time.strftime("%H:%M"),
                "max_patients": sess.max_patients,
                "current_count": sess.current_count,
                "session_number": sess.session_number,
                "room_number": sess.room_number,
                "status": sess.status,
                "current_bookings": Appointment.query.filter(
                    Appointment.doctor_session_id == sess.id,
                    db.func.date(Appointment.appointment_date) == (sess.session_date if sess.session_date else date.today()),
                    Appointment.status != "Cancelled"
                ).count(),
                "waiting_count": db.session.query(db.func.count(Queue.id)).filter(
                    Queue.doctor_session_id == sess.id,
                    Queue.status == "WAITING",
                    db.func.date(Queue.check_in_time) == date.today()
                ).scalar() or 0,
                "checked_in_count": db.session.query(db.func.count(Queue.id)).filter(
                    Queue.doctor_session_id == sess.id,
                    db.func.date(Queue.check_in_time) == date.today()
                ).scalar() or 0
            } for sess in s.sessions]
        })
    except Exception as e:
        return error_response(str(e), 500)

@specialist_bp.route("/", methods=["POST"])
def add_specialist():
    try:
        data = request.get_json() or {}
        new_s = Specialist(
            name=data.get("name"),
            title=data.get("title", "Dr."),
            email=data.get("email"),
            phone_number=data.get("phone_number"),
            department=data.get("department"),
            department_id=data.get("department_id"),
            specialization=data.get("specialization"),
            experience_years=data.get("experience_years", 0),
            rating=data.get("rating", 4.5),
            languages=data.get("languages", "Sinhala, English"),
            consultation_fee=data.get("consultation_fee", 0.0),
            profile_image=data.get("profile_image"),
            bio=data.get("bio"),
            availability_status=data.get("availability_status", "Available")
        )
        db.session.add(new_s)
        db.session.commit()
        
        # Handle sessions if provided in the same request
        sessions_data = data.get("sessions", [])
        for index, sess in enumerate(sessions_data, start=1):
            new_sess = _build_session_model(new_s.id, sess, index)
            db.session.add(new_sess)
        db.session.commit()
        from ..extensions import socketio
        socketio.emit('specialist_updated', {'specialist_id': new_s.id}, namespace='/')
        return success_response("Specialist added successfully", {"id": new_s.id}, 201)
    except ValueError as e:
        db.session.rollback()
        return error_response(str(e), 400)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@specialist_bp.route("/<int:specialist_id>", methods=["PUT"])
def update_specialist(specialist_id):
    try:
        s = Specialist.query.get_or_404(specialist_id)
        data = request.get_json() or {}
        
        s.name = data.get("name", s.name)
        s.title = data.get("title", s.title)
        s.email = data.get("email", s.email)
        s.phone_number = data.get("phone_number", s.phone_number)
        s.department = data.get("department", s.department)
        s.department_id = data.get("department_id", s.department_id)
        s.specialization = data.get("specialization", s.specialization)
        s.experience_years = data.get("experience_years", s.experience_years)
        s.rating = data.get("rating", s.rating)
        s.languages = data.get("languages", s.languages)
        s.consultation_fee = data.get("consultation_fee", s.consultation_fee)
        s.profile_image = data.get("profile_image", s.profile_image)
        s.bio = data.get("bio", s.bio)
        s.availability_status = data.get("availability_status", s.availability_status)
        
        # Handle sessions update by reconciling existing rows instead of replacing all.
        if "sessions" in data:
            from ..models.appointment import Appointment
            from ..models.queue import Queue
            from ..models.doctor_portal import DoctorSessionRequest
            
            sessions_data = data.get("sessions", [])
            existing_sessions = {
                sess.id: sess for sess in DoctorSession.query.filter_by(specialist_id=s.id).all()
            }
            retained_session_ids = set()

            for index, sess in enumerate(sessions_data, start=1):
                session_id = _coerce_int(sess.get("id"))
                existing_session = existing_sessions.get(session_id) if session_id else None

                if existing_session:
                    _apply_session_payload(existing_session, sess, index)
                    retained_session_ids.add(existing_session.id)
                else:
                    new_sess = _build_session_model(s.id, sess, index)
                    db.session.add(new_sess)

            removed_session_ids = [
                session_id for session_id in existing_sessions.keys()
                if session_id not in retained_session_ids
            ]

            if removed_session_ids:
                Appointment.query.filter(Appointment.doctor_session_id.in_(removed_session_ids)).update(
                    {Appointment.doctor_session_id: None},
                    synchronize_session=False,
                )
                Queue.query.filter(Queue.doctor_session_id.in_(removed_session_ids)).update(
                    {Queue.doctor_session_id: None},
                    synchronize_session=False,
                )
                DoctorSessionRequest.query.filter(DoctorSessionRequest.doctor_session_id.in_(removed_session_ids)).update(
                    {DoctorSessionRequest.doctor_session_id: None},
                    synchronize_session=False,
                )
                DoctorSession.query.filter(DoctorSession.id.in_(removed_session_ids)).delete(
                    synchronize_session=False,
                )
        db.session.commit()
        from ..extensions import socketio
        socketio.emit('specialist_updated', {'specialist_id': specialist_id}, namespace='/')
        return success_response("Specialist updated successfully")
    except ValueError as e:
        db.session.rollback()
        return error_response(str(e), 400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return error_response(str(e), 500)

@specialist_bp.route("/<int:specialist_id>", methods=["DELETE"])
def delete_specialist(specialist_id):
    try:
        s = Specialist.query.get_or_404(specialist_id)
        db.session.delete(s)
        db.session.commit()
        from ..extensions import socketio
        socketio.emit('specialist_updated', {'type': 'delete', 'specialist_id': specialist_id})
        return success_response("Specialist deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@specialist_bp.route("/<int:specialist_id>/sessions", methods=["POST"])
def add_session(specialist_id):
    try:
        data = request.get_json() or {}
        new_sess = _build_session_model(specialist_id, data, 1)
        db.session.add(new_sess)
        db.session.commit()
        from ..extensions import socketio
        socketio.emit('specialist_updated', {'specialist_id': specialist_id})
        return success_response("Session added successfully", {"id": new_sess.id}, 201)
    except ValueError as e:
        db.session.rollback()
        return error_response(str(e), 400)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)
