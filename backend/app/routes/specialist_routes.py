from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.specialist import Specialist
from ..models.doctor_session import DoctorSession
from datetime import datetime

from ..utils.response import success_response, error_response

specialist_bp = Blueprint("specialist_bp", __name__)

@specialist_bp.route("/", methods=["GET"])
def get_specialists():
    try:
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
                "room_number": sess.room_number
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
                "room_number": sess.room_number,
                "status": sess.status
            } for sess in s.sessions]
        })
    except Exception as e:
        return error_response(str(e), 500)

@specialist_bp.route("/", methods=["POST"])
def add_specialist():
    try:
        data = request.get_json()
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
        for sess in sessions_data:
            start_t = datetime.strptime(sess.get("start_time"), "%H:%M").time()
            end_t = datetime.strptime(sess.get("end_time"), "%H:%M").time()
            s_date = None
            d_of_w = sess.get("day_of_week")
            
            if sess.get("session_date"):
                s_date = datetime.strptime(sess.get("session_date"), "%Y-%m-%d").date()
                # Automatically set day_of_week from date for compatibility
                d_of_w = s_date.strftime("%A")
                
            new_sess = DoctorSession(
                specialist_id=new_s.id,
                day_of_week=d_of_w,
                session_date=s_date,
                start_time=start_t,
                end_time=end_t,
                max_patients=sess.get("max_patients", 20),
                room_number=sess.get("room_number")
            )
            db.session.add(new_sess)
        
        db.session.commit()
        return success_response("Specialist added successfully", {"id": new_s.id}, 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@specialist_bp.route("/<int:specialist_id>", methods=["PUT"])
def update_specialist(specialist_id):
    try:
        s = Specialist.query.get_or_404(specialist_id)
        data = request.get_json()
        
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
        
        # Handle sessions update (simplified: replace all for now if provided)
        if "sessions" in data:
            from ..models.appointment import Appointment
            
            # Get old sessions
            old_sessions = DoctorSession.query.filter_by(specialist_id=s.id).all()
            old_session_ids = [sess.id for sess in old_sessions]
            
            # Set session_id to NULL in linked appointments to avoid FK constraint error
            if old_session_ids:
                Appointment.query.filter(Appointment.session_id.in_(old_session_ids)).update({Appointment.session_id: None}, synchronize_session=False)
            
            # Delete old sessions
            DoctorSession.query.filter_by(specialist_id=s.id).delete()
            
            sessions_data = data.get("sessions", [])
            for sess in sessions_data:
                start_t = datetime.strptime(sess.get("start_time"), "%H:%M").time()
                end_t = datetime.strptime(sess.get("end_time"), "%H:%M").time()
                s_date = None
                d_of_w = sess.get("day_of_week")
                
                if sess.get("session_date"):
                    s_date = datetime.strptime(sess.get("session_date"), "%Y-%m-%d").date()
                    # Automatically set day_of_week from date for compatibility
                    d_of_w = s_date.strftime("%A")

                new_sess = DoctorSession(
                    specialist_id=s.id,
                    day_of_week=d_of_w,
                    session_date=s_date,
                    start_time=start_t,
                    end_time=end_t,
                    max_patients=sess.get("max_patients", 20),
                    room_number=sess.get("room_number")
                )
                db.session.add(new_sess)
        
        db.session.commit()
        return success_response("Specialist updated successfully")
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
        return success_response("Specialist deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@specialist_bp.route("/<int:specialist_id>/sessions", methods=["POST"])
def add_session(specialist_id):
    try:
        data = request.get_json()
        start_t = datetime.strptime(data.get("start_time"), "%H:%M").time()
        end_t = datetime.strptime(data.get("end_time"), "%H:%M").time()
        
        new_sess = DoctorSession(
            specialist_id=specialist_id,
            day_of_week=data.get("day_of_week"),
            start_time=start_t,
            end_time=end_t,
            max_patients=data.get("max_patients", 20),
            room_number=data.get("room_number")
        )
        db.session.add(new_sess)
        db.session.commit()
        return success_response("Session added successfully", {"id": new_sess.id}, 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)
