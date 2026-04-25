from flask import Blueprint, request, jsonify
from app.services.queue_service import check_in_patient, manual_check_in, check_out_patient
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
    
    if not identifier:
        return jsonify({"error": "identifier (Phone or NIC) is required"}), 400
        
    result = manual_check_in(identifier)
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

@queue_bp.route('/face-check-in', methods=['POST'])
def face_check_in():
    data = request.json
    face_image = data.get('face_image')
    
    if not face_image:
        return jsonify({"error": "face_image (base64) is required"}), 400
        
    patient = find_patient_by_face(face_image)
    if not patient:
        return jsonify({"error": "Face not recognized. Please use manual check-in."}), 404
        
    # Trigger check-in for the identified patient
    print(f"DEBUG: Triggering check-in for patient {patient.id}...")
    result = check_in_patient(patient.id)
    if "error" in result:
        print(f"DEBUG: Check-in error: {result['error']}")
        return jsonify(result), 400
        
    # Include patient name in the response for feedback
    result["patient_name"] = patient.full_name
    return jsonify(result), 200
