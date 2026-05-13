from flask import Blueprint, request, jsonify
from ..models import Prescription, LabReport, Patient, Appointment
from ..extensions import db
from ..utils.response import success_response, error_response
from datetime import datetime

medical_bp = Blueprint("medical_bp", __name__)

# --- PRESCRIPTIONS ---

@medical_bp.route("/prescriptions", methods=["GET"])
def get_prescriptions():
    patient_id = request.args.get("patient_id")
    if not patient_id:
        return error_response("patient_id is required", 400)
    
    prescriptions = Prescription.query.filter_by(patient_id=patient_id).order_by(Prescription.created_at.desc()).all()
    result = [{
        "id": p.id,
        "doctor_name": p.doctor_name,
        "medications": p.medications,
        "instructions": p.instructions,
        "attachment": p.attachment,
        "date": p.created_at.strftime("%Y-%m-%d"),
        "appointment_id": p.appointment_id
    } for p in prescriptions]
    
    return success_response("Prescriptions retrieved", result)

@medical_bp.route("/prescriptions", methods=["POST"])
def add_prescription():
    data = request.get_json()
    try:
        new_p = Prescription(
            patient_id=data.get("patient_id"),
            appointment_id=data.get("appointment_id"),
            doctor_name=data.get("doctor_name"),
            medications=data.get("medications"),
            instructions=data.get("instructions"),
            attachment=data.get("attachment")
        )
        db.session.add(new_p)
        db.session.commit()
        return success_response("Prescription added successfully", {"id": new_p.id})
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

# --- LAB REPORTS ---

@medical_bp.route("/lab-reports", methods=["GET"])
def get_lab_reports():
    patient_id = request.args.get("patient_id")
    if not patient_id:
        return error_response("patient_id is required", 400)
    
    reports = LabReport.query.filter_by(patient_id=patient_id).order_by(LabReport.created_at.desc()).all()
    result = [{
        "id": r.id,
        "test_name": r.test_name,
        "result_summary": r.result_summary,
        "attachment": r.attachment,
        "status": r.status,
        "date": r.created_at.strftime("%Y-%m-%d")
    } for r in reports]
    
    return success_response("Lab reports retrieved", result)

@medical_bp.route("/lab-reports", methods=["POST"])
def add_lab_report():
    data = request.get_json()
    try:
        new_r = LabReport(
            patient_id=data.get("patient_id"),
            test_name=data.get("test_name"),
            result_summary=data.get("result_summary"),
            attachment=data.get("attachment"),
            status=data.get("status", "Completed")
        )
        db.session.add(new_r)
        db.session.commit()
        return success_response("Lab report added successfully", {"id": new_r.id})
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@medical_bp.route("/summary/<int:patient_id>", methods=["GET"])
def get_medical_summary(patient_id):
    try:
        p_count = Prescription.query.filter_by(patient_id=patient_id).count()
        l_count = LabReport.query.filter_by(patient_id=patient_id).count()
        return success_response("Summary retrieved", {
            "prescriptions_count": p_count,
            "lab_reports_count": l_count
        })
    except Exception as e:
        return error_response(str(e), 500)
