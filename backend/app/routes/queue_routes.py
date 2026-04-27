from flask import Blueprint, request, jsonify
from app.services.queue_service import (
    check_in_patient, 
    manual_check_in, 
    check_out_patient, 
    get_all_queues_status,
    call_next_patient,
    toggle_session_pause,
    end_session,
    skip_patient,
    get_all_sessions_queues
)
from app.services import find_patient_by_face

queue_bp = Blueprint('queue', __name__, url_prefix='/api/queue')

@queue_bp.route('/check-in', methods=['POST'])
def check_in():
    data = request.json
    patient_id = data.get('patient_id')
    
    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400
        
    result = check_in_patient(patient_id)
    if "error" in result:
        return jsonify(result), 400
        
    return jsonify(result), 200

@queue_bp.route('/manual-check-in', methods=['POST'])
def manual_check_in_route():
    data = request.json
    identifier = data.get('identifier')
    patient_id = data.get('patient_id')
    
    if not identifier and not patient_id:
        return jsonify({"error": "identifier or patient_id is required"}), 400
        
    result = manual_check_in(identifier, patient_id)
    if "error" in result:
        return jsonify(result), 400
        
    return jsonify(result), 200

@queue_bp.route('/check-out', methods=['POST'])
def check_out():
    data = request.json
    patient_id = data.get('patient_id')
    
    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400
        
    result = check_out_patient(patient_id)
    if "error" in result:
        return jsonify(result), 400
        
    return jsonify(result), 200

@queue_bp.route('/status', methods=['GET'])
def get_all_queues():
    result = get_all_queues_status()
    return jsonify(result), 200

@queue_bp.route('/sessions-queues', methods=['GET'])
def get_sessions_queues():
    result = get_all_sessions_queues()
    return jsonify(result), 200

@queue_bp.route('/call-next/<int:session_id>', methods=['POST'])
def call_next(session_id):
    result = call_next_patient(session_id)
    return jsonify(result), 200

@queue_bp.route('/toggle-pause/<int:session_id>', methods=['POST'])
def toggle_pause(session_id):
    result = toggle_session_pause(session_id)
    return jsonify(result), 200

@queue_bp.route('/end-session/<int:session_id>', methods=['POST'])
def end_session_route(session_id):
    result = end_session(session_id)
    return jsonify(result), 200

@queue_bp.route('/skip/<int:queue_id>', methods=['POST'])
def skip(queue_id):
    result = skip_patient(queue_id)
    return jsonify(result), 200

@queue_bp.route('/face-check-in', methods=['POST'])
def face_check_in():
    data = request.json
    face_image = data.get('face_image')
    patient_id = data.get('patient_id')
    
    if patient_id:
        result = check_in_patient(patient_id)
        return jsonify(result), 200

    if not face_image:
        return jsonify({"error": "face_image (base64) is required"}), 400
        
    patient = find_patient_by_face(face_image)
    if not patient:
        return jsonify({"success": False, "error": "Face not recognized."}), 200
        
    # Check for linked profiles
    from app.models import Patient
    linked = Patient.query.filter(
        (Patient.guardian_id == patient.id) | 
        (Patient.guardian_nic == patient.nic) |
        (Patient.guardian_phone == patient.phone_number)
    ).all()

    if linked:
        profiles = [{
            "id": patient.id,
            "name": patient.full_name,
            "age": patient.age,
            "role": "Self",
            "image": patient.profile_image
        }]
        for child in linked:
            profiles.append({
                "id": child.id,
                "name": child.full_name,
                "age": child.age,
                "role": "Family Member",
                "image": child.profile_image
            })
        return jsonify({"success": True, "profiles": profiles}), 200

    # Trigger check-in for the identified patient
    result = check_in_patient(patient.id)
    return jsonify(result), 200
