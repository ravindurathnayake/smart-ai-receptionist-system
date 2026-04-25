from flask import Blueprint, jsonify, request
from ..models import Patient
from ..extensions import db
from ..utils.response import success_response, error_response
from ..services import get_face_embedding

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
                "gender": p.gender,
                "nic": p.nic,
                "address": p.address,
                "blood_type": p.blood_type,
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
        
        new_patient = Patient(
            full_name=data.get("full_name"),
            phone_number=data.get("phone_number"),
            email=data.get("email"),
            age=data.get("age"),
            gender=data.get("gender"),
            nic=data.get("nic"),
            address=data.get("address"),
            blood_type=data.get("blood_type"),
            medical_history=data.get("medical_history")
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
        patient.age = data.get("age", patient.age)
        patient.gender = data.get("gender", patient.gender)
        patient.address = data.get("address", patient.address)
        patient.blood_type = data.get("blood_type", patient.blood_type)
        
        db.session.commit()
        return success_response("Patient updated successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@patient_bp.route("/<int:patient_id>/history", methods=["GET"])
def get_patient_history(patient_id):
    try:
        from ..models import Appointment, Queue
        
        appointments = Appointment.query.filter_by(patient_id=patient_id).order_by(Appointment.appointment_date.desc()).all()
        queue_entries = Queue.query.join(Appointment).filter(Appointment.patient_id == patient_id).order_by(Queue.created_at.desc()).all()
        
        history = {
            "appointments": [{
                "id": appt.id,
                "date": appt.appointment_date.strftime("%Y-%m-%d"),
                "specialist": appt.specialist.name,
                "department": appt.specialist.department,
                "status": appt.status,
                "symptom": appt.symptom
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

@patient_bp.route("/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    try:
        patient = Patient.query.get_or_404(patient_id)
        
        from ..models import Appointment, Queue
        # Delete queue entries first to satisfy foreign key constraints
        appointments = Appointment.query.filter_by(patient_id=patient_id).all()
        appt_ids = [a.id for a in appointments]
        
        if appt_ids:
            Queue.query.filter(Queue.appointment_id.in_(appt_ids)).delete(synchronize_session=False)
            Appointment.query.filter(Appointment.id.in_(appt_ids)).delete(synchronize_session=False)
        
        db.session.delete(patient)
        db.session.commit()
        return success_response("Patient record and history deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(f"Delete failed: {str(e)}", 500)

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
            
        return success_response("Login successful", {
            "id": patient.id,
            "formatted_id": f"PAT-{patient.id:04d}",
            "name": patient.full_name,
            "email": patient.email,
            "nic": patient.nic,
            "phone": patient.phone_number
        })
    except Exception as e:
        return error_response(str(e), 500)
