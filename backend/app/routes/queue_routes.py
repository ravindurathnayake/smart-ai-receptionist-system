from flask import Blueprint, request, jsonify
from app.services.queue_service import check_in_patient, manual_check_in, check_out_patient

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
