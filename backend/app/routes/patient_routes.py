from flask import Blueprint, jsonify, request
from ..models import Patient
from ..extensions import db, socketio
from ..utils.response import success_response, error_response
from ..services import get_face_embedding
from ..services.face_service import normalize_profile_image

patient_bp = Blueprint("patient_bp", __name__)

patient_bp = Blueprint("patient_bp", __name__)

@patient_bp.route("/", methods=["GET"])
def get_patients():
    try:
        patients = Patient.query.all()
        result = []
        for p in patients:
            result.append({
                "id": p.id,
                "formatted_id": f"PAT-{p.id:04d}",
                "name": p.full_name,
                "phone": p.phone_number,
                "email": p.email,
                "age": p.age,
                "dob": p.dob,
                "gender": p.gender,
                "nic": p.nic,
                "address": p.address,
                "blood_type": p.blood_type,
                "guardian_name": p.guardian_name,
                "guardian_nic": p.guardian_nic,
                "guardian_phone": p.guardian_phone,
                "guardian_email": p.guardian_email,
                "guardian_relationship": p.guardian_relationship,
                "guardian_id": p.guardian_id,
                "emergency_contact_name": p.emergency_contact_name,
                "emergency_contact_phone": p.emergency_contact_phone,
                "last_visit": p.created_at.strftime("%Y-%m-%d") if p.created_at else "N/A",
                "created_at": p.created_at.strftime("%Y-%m-%d") if p.created_at else "N/A"
            })
        return success_response("Patients retrieved successfully", result)
    except Exception as e:
        return error_response(str(e), 500)

@patient_bp.route("/", methods=["POST"])
def create_patient():
    try:
        from flask import request
        data = request.get_json()
        
        def get_val(key):
            val = data.get(key)
            return None if val == "" else val

        new_patient = Patient(
            full_name=data.get("full_name"),
            phone_number=data.get("phone_number"),
            email=get_val("email"),
            age=data.get("age"),
            gender=data.get("gender"),
            dob=data.get("dob"),
            nic=get_val("nic"),
            address=get_val("address"),
            blood_type=get_val("blood_type"),
            medical_history=get_val("medical_history"),
            guardian_name=get_val("guardian_name"),
            guardian_nic=get_val("guardian_nic"),
            guardian_phone=get_val("guardian_phone"),
            guardian_email=get_val("guardian_email"),
            guardian_relationship=get_val("guardian_relationship"),
            guardian_id=get_val("guardian_id"),
            emergency_contact_name=get_val("emergency_contact_name"),
            emergency_contact_phone=get_val("emergency_contact_phone")
        )
        
        # Handle face capture
        face_image = data.get("face_image") # Base64 image
        if face_image:
            embedding = get_face_embedding(face_image)
            if embedding:
                new_patient.face_embedding = embedding
            else:
                return error_response("No face detected in the image. Please try again.", 400)
        
        db.session.add(new_patient)
        db.session.commit()
        
        # Emit real-time update
        socketio.emit('patient_created', {
            "id": new_patient.id,
            "formatted_id": f"PAT-{new_patient.id:04d}",
            "name": new_patient.full_name
        })
        
        return success_response("Patient created successfully", {
            "id": new_patient.id,
            "formatted_id": f"PAT-{new_patient.id:04d}",
            "name": new_patient.full_name
        })
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@patient_bp.route("/<int:patient_id>", methods=["PUT"])
def update_patient(patient_id):
    try:
        patient = Patient.query.get_or_404(patient_id)
        data = request.get_json()
        
        # Only allow admin to update specific fields
        patient.full_name = data.get("full_name", patient.full_name)
        patient.phone_number = data.get("phone_number", patient.phone_number)
        patient.nic = data.get("nic", patient.nic)
        patient.dob = data.get("dob", patient.dob)
        patient.age = data.get("age", patient.age)
        patient.gender = data.get("gender", patient.gender)
        patient.address = data.get("address", patient.address)
        patient.blood_type = data.get("blood_type", patient.blood_type)
        patient.guardian_name = data.get("guardian_name", patient.guardian_name)
        patient.guardian_nic = data.get("guardian_nic", patient.guardian_nic)
        patient.guardian_phone = data.get("guardian_phone", patient.guardian_phone)
        patient.guardian_email = data.get("guardian_email", patient.guardian_email)
        patient.guardian_relationship = data.get("guardian_relationship", patient.guardian_relationship)
        patient.guardian_id = data.get("guardian_id", patient.guardian_id)
        patient.emergency_contact_name = data.get("emergency_contact_name", patient.emergency_contact_name)
        patient.emergency_contact_phone = data.get("emergency_contact_phone", patient.emergency_contact_phone)
        
        db.session.commit()
        return success_response("Patient updated successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@patient_bp.route("/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    try:
        from ..models import Patient, Appointment, Review, Queue, Payment
        patient = Patient.query.get_or_404(patient_id)
        
        # Manually cascade delete associated records
        appointments = Appointment.query.filter_by(patient_id=patient_id).all()
        for appt in appointments:
            Queue.query.filter_by(appointment_id=appt.id).delete()
            Payment.query.filter_by(appointment_id=appt.id).delete()
            Review.query.filter_by(appointment_id=appt.id).delete()
            db.session.delete(appt)
            
        Review.query.filter_by(patient_id=patient_id).delete()
        
        # Handle linked children
        linked_children = Patient.query.filter_by(guardian_id=patient_id).all()
        for child in linked_children:
            child.guardian_id = None
            
        db.session.delete(patient)
        db.session.commit()
        
        socketio.emit('patient_deleted', {"id": patient_id})
        
        return success_response("Patient deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@patient_bp.route("/<int:patient_id>/history", methods=["GET"])
def get_patient_history(patient_id):
    try:
        from ..models import Appointment, Queue, Review
        
        appointments = Appointment.query.filter_by(patient_id=patient_id).order_by(Appointment.appointment_date.desc()).all()
        queue_entries = Queue.query.join(Appointment).filter(Appointment.patient_id == patient_id).order_by(Queue.created_at.desc()).all()
        
        history = {
            "appointments": [{
                "id": appt.id,
                "date": appt.appointment_date.strftime("%Y-%m-%d"),
                "specialist": appt.specialist.name,
                "department": appt.specialist.department,
                "status": appt.status,
                "symptom": appt.symptom,
                "time": appt.appointment_date.strftime("%I:%M %p"),
                "room": appt.session.room_number if appt.session else "Room 04",
                "session_name": f"Session {appt.session.session_number}" if appt.session else "Active Session",
                "specialist_id": appt.specialist_id,
                "has_review": appt.review is not None,
                "queue_status": appt.queue.status if appt.queue else None,
                "check_out_time": appt.queue.check_out_time.isoformat() if (appt.queue and appt.queue.check_out_time) else None,
                "review": {
                    "rating": appt.review.rating,
                    "comment": appt.review.review_text,
                    "complaint": appt.review.complaint_text,
                    "is_complaint": appt.review.is_complaint
                } if appt.review else None
            } for appt in appointments],
            "queue": [{
                "id": q.id,
                "token": f"A-{q.queue_number:02d}",
                "status": q.status,
                "created_at": q.created_at.strftime("%Y-%m-%d %H:%M"),
                "specialist": q.appointment.specialist.name if q.appointment else "N/A"
            } for q in queue_entries]
        }
        
        return success_response("Patient history retrieved", history)
    except Exception as e:
        return error_response(str(e), 500)

@patient_bp.route("/nic-login/<string:nic>", methods=["GET"])
def nic_login(nic):
    try:
        # Find the adult (primary patient)
        # and all minors linked via guardian_nic
        patients = Patient.query.filter(
            (Patient.nic == nic) | (Patient.guardian_nic == nic)
        ).all()
        
        if not patients:
            return error_response("No profiles found for this NIC", 404)
        
        result = []
        for p in patients:
            is_guardian = p.nic == nic
            result.append({
                "id": p.id,
                "formatted_id": f"PAT-{p.id:04d}",
                "full_name": p.full_name,
                "name": p.full_name,
                "phone": p.phone_number,
                "email": p.email,
                "age": p.age,
                "dob": p.dob,
                "gender": p.gender,
                "nic": p.nic,
                "address": p.address,
                "blood_type": p.blood_type,
                "role": "Primary" if is_guardian else "Family Member",
                "image": normalize_profile_image(p.profile_image),
                "guardian_name": p.guardian_name,
                "guardian_nic": p.guardian_nic,
                "guardian_phone": p.guardian_phone,
                "guardian_email": p.guardian_email,
                "guardian_relationship": p.guardian_relationship,
                "guardian_id": p.guardian_id,
                "emergency_contact_name": p.emergency_contact_name,
                "emergency_contact_phone": p.emergency_contact_phone,
                "face_embedding": True if p.face_embedding else False
            })
            
        return success_response(f"Found {len(result)} profiles", result)
    except Exception as e:
        return error_response(str(e), 500)

@patient_bp.route("/find-by-nic/<string:nic>", methods=["GET"])
def find_patient_by_nic(nic):
    try:
        patient = Patient.query.filter_by(nic=nic).first()
        if not patient:
            return error_response("Patient not found", 404)
        
        # Check for linked profiles (children)
        linked = Patient.query.filter(
            (Patient.guardian_id == patient.id) | 
            (Patient.guardian_nic == patient.nic) |
            (Patient.guardian_phone == patient.phone_number)
        ).all()

        if linked:
            profiles = [{
                "id": patient.id,
                "name": patient.full_name,
                "full_name": patient.full_name,
                "age": patient.age,
                "nic": patient.nic,
                "role": "Primary",
                "phone": patient.phone_number,
                "phone_number": patient.phone_number
            }]
            for child in linked:
                profiles.append({
                    "id": child.id,
                    "name": child.full_name,
                    "full_name": child.full_name,
                    "age": child.age,
                    "nic": child.nic,
                    "role": "Family Member",
                    "phone": child.phone_number,
                    "phone_number": child.phone_number
                })
            return success_response("Guardian recognized", {"profiles": profiles})
            
        return success_response("Patient found", {
            "id": patient.id,
            "formatted_id": f"PAT-{patient.id:04d}",
            "name": patient.full_name,
            "full_name": patient.full_name,
            "phone": patient.phone_number,
            "phone_number": patient.phone_number,
            "email": patient.email,
            "nic": patient.nic,
            "age": patient.age,
            "dob": patient.dob,
            "gender": patient.gender,
            "address": patient.address,
            "blood_type": patient.blood_type,
            "guardian_name": patient.guardian_name,
            "guardian_nic": patient.guardian_nic,
            "guardian_phone": patient.guardian_phone,
            "guardian_relationship": patient.guardian_relationship,
            "emergency_contact_name": patient.emergency_contact_name,
            "emergency_contact_phone": patient.emergency_contact_phone
        })
    except Exception as e:
        return error_response(str(e), 500)


@patient_bp.route("/login-face", methods=["POST"])
def login_face():
    try:
        from ..services.face_service import find_patient_by_face
        data = request.get_json()
        face_image = data.get("face_image")
        
        if not face_image:
            return error_response("No face image provided", 400)
            
        patient = find_patient_by_face(face_image)
        
        if not patient:
            return error_response("Face not recognized. Please use NIC login or register.", 404)
            
        # Check for linked profiles (children)
        linked = Patient.query.filter(
            (Patient.guardian_id == patient.id) | 
            (Patient.guardian_nic == patient.nic) |
            (Patient.guardian_phone == patient.phone_number)
        ).all()

        if linked:
            profiles = [{
                "id": patient.id,
                "name": patient.full_name,
                "full_name": patient.full_name,
                "age": patient.age,
                "nic": patient.nic,
                "role": "Primary",
                "image": normalize_profile_image(patient.profile_image)
            }]
            for child in linked:
                profiles.append({
                    "id": child.id,
                    "name": child.full_name,
                    "full_name": child.full_name,
                    "age": child.age,
                    "nic": child.nic,
                    "role": "Family Member",
                    "image": normalize_profile_image(child.profile_image)
                })
            return success_response("Guardian recognized", {"profiles": profiles})

        return success_response("Login successful", {
            "id": patient.id,
            "formatted_id": f"PAT-{patient.id:04d}",
            "full_name": patient.full_name,
            "name": patient.full_name, # Compatibility
            "email": patient.email,
            "nic": patient.nic,
            "phone": patient.phone_number,
            "phone_number": patient.phone_number, # Compatibility
            "age": patient.age,
            "dob": patient.dob,
            "gender": patient.gender,
            "blood_type": patient.blood_type,
            "guardian_name": patient.guardian_name,
            "guardian_nic": patient.guardian_nic,
            "guardian_phone": patient.guardian_phone,
            "guardian_email": patient.guardian_email,
            "guardian_relationship": patient.guardian_relationship,
            "guardian_id": patient.guardian_id,
            "emergency_contact_name": patient.emergency_contact_name,
            "emergency_contact_phone": patient.emergency_contact_phone
        })
    except Exception as e:
        return error_response(str(e), 500)
