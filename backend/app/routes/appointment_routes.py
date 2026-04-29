from flask import Blueprint, request
from datetime import datetime

from app.services import (
    book_appointment,
    get_queue_status,
    get_all_specialists,
    complete_queue,
    cancel_appointment,
    get_all_appointments,
    check_in_patient,
    check_out_patient,
    get_patient_queue_info,
    move_appointment,
    get_specialist_availability
)

from app.utils.response import success_response, error_response
from app.services.email_service import send_appointment_confirmation
from app.services.whatsapp_service import send_whatsapp_notification
from app.models import Patient, Payment, Appointment, Specialist
from app.extensions import db, socketio

appointment_bp = Blueprint("appointment_bp", __name__)


# BOOK APPOINTMENT
@appointment_bp.route("/book-appointment", methods=["POST"])
def book_appointment_route():
    try:
        data = request.get_json()

        if not data:
            return error_response("Invalid JSON body", 400)

        full_name = data.get("full_name")
        phone_number = data.get("phone_number")
        specialist_id = data.get("specialist_id")
        symptom = data.get("symptom")
        appointment_date_str = data.get("appointment_date")
        doctor_session_id = data.get("doctor_session_id")
        patient_id = data.get("patient_id")

        # Basic validation
        if not all([full_name, specialist_id, symptom, appointment_date_str]):
            return error_response("Missing required fields", 400)

        try:
            appointment_date = datetime.fromisoformat(appointment_date_str)
        except ValueError:
            return error_response("Invalid appointment_date format (use ISO format)", 400)

        result = book_appointment(
            full_name=full_name,
            phone_number=phone_number,
            specialist_id=specialist_id,
            symptom=symptom,
            appointment_date=appointment_date,
            doctor_session_id=doctor_session_id,
            patient_id=patient_id
        )

        if isinstance(result, dict) and result.get("error"):
            return error_response(result["error"], 404)

        # Emit real-time update
        socketio.emit('appointment_created', result)
        
        return success_response("Appointment booked successfully", result, 201)

    except Exception as e:
        return error_response(str(e), 500)


# QUEUE STATUS
@appointment_bp.route("/queue-status", methods=["GET"])
def queue_status_route():
    try:
        result = get_queue_status()
        return success_response("Queue status retrieved successfully", result)

    except Exception as e:
        return error_response(str(e), 500)


# GET SPECIALISTS
@appointment_bp.route("/specialists", methods=["GET"])
def get_specialists_route():
    try:
        specialists = get_all_specialists()
        return success_response("Specialists retrieved successfully", specialists)

    except Exception as e:
        return error_response(str(e), 500)


# COMPLETE QUEUE

@appointment_bp.route("/complete-queue/<int:queue_id>", methods=["PATCH"])
def complete_queue_route(queue_id):
    try:
        result = complete_queue(queue_id)

        if not result:
            return error_response("Queue not found", 404)

        # Emit real-time update
        socketio.emit('appointment_updated', result)
        
        return success_response("Queue marked as completed", result)

    except Exception as e:
        return error_response(str(e), 500)


# CANCEL APPOINTMENT
@appointment_bp.route("/cancel-appointment/<int:appointment_id>", methods=["PATCH"])
def cancel_appointment_route(appointment_id):
    try:
        result = cancel_appointment(appointment_id)

        if not result:
            return error_response("Appointment not found", 404)

        # Emit real-time update
        socketio.emit('appointment_updated', result)
        
        return success_response("Appointment cancelled successfully", result)

    except Exception as e:
        return error_response(str(e), 500)

# GET ALL APPOINTMENTS (Admin)
@appointment_bp.route("/appointments", methods=["GET"])
def get_all_appointments_route():
    try:
        appointments = get_all_appointments()
        return success_response("Appointments retrieved successfully", appointments)
    except Exception as e:
        return error_response(str(e), 500)

# CHECK-IN PATIENT
@appointment_bp.route("/check-in/<int:patient_id>", methods=["POST"])
def check_in_patient_route(patient_id):
    try:
        result = check_in_patient(patient_id)
        if result.get("error"):
            return error_response(result["error"], 400)
            
        # Emit real-time update
        socketio.emit('appointment_updated', result)
        
        return success_response("Patient checked in successfully", result)
    except Exception as e:
        return error_response(str(e), 500)

# CHECK-OUT PATIENT
@appointment_bp.route("/check-out/<int:patient_id>", methods=["POST"])
def check_out_patient_route(patient_id):
    try:
        result = check_out_patient(patient_id)
        if result.get("error"):
            return error_response(result["error"], 400)
            
        # Emit real-time update
        socketio.emit('appointment_updated', result)
        
        return success_response("Patient checked out successfully", result)
    except Exception as e:
        return error_response(str(e), 500)

# GET PATIENT QUEUE INFO
@appointment_bp.route("/queue-status/patient/<int:patient_id>", methods=["GET"])
def patient_queue_status_route(patient_id):
    try:
        result = get_patient_queue_info(patient_id)
        if not result:
            return success_response("No active queue found for this patient", None)
        return success_response("Patient queue status retrieved successfully", result)
    except Exception as e:
        return error_response(str(e), 500)

# MOVE/RESCHEDULE APPOINTMENT
@appointment_bp.route("/move-appointment/<int:appointment_id>", methods=["POST"])
def reschedule_appointment(appointment_id):
    try:
        data = request.get_json()
        new_date_str = data.get("new_date")
        new_doctor_session_id = data.get("doctor_session_id")
        
        if not new_date_str:
            return error_response("New date is required", 400)
            
        new_date = datetime.fromisoformat(new_date_str)
        appt = move_appointment(appointment_id, new_date, new_doctor_session_id)
        
        # Emit real-time update
        socketio.emit('appointment_updated', {
            "id": appt.id,
            "new_date": appt.appointment_date.strftime("%Y-%m-%d")
        })
        
        return success_response("Appointment rescheduled successfully", {
            "id": appt.id,
            "new_date": appt.appointment_date.strftime("%Y-%m-%d")
        })
    except Exception as e:
        return error_response(str(e), 500)

# GET SPECIALIST AVAILABILITY
@appointment_bp.route("/availability/<int:specialist_id>", methods=["GET"])
def get_availability_route(specialist_id):
    try:
        date_str = request.args.get("date")
        if not date_str:
            return error_response("Date is required", 400)
            
        sessions = get_specialist_availability(specialist_id, date_str)
        return success_response("Availability retrieved successfully", sessions)
    except Exception as e:
        return error_response(str(e), 500)

# CONFIRM PAYMENT & SEND RECEIPT
@appointment_bp.route("/confirm-payment", methods=["POST"])
def confirm_payment_route():
    try:
        data = request.get_json()
        appointment_id = data.get("appointment_id")
        amount = data.get("amount")
        payment_method = data.get("payment_method", "Card")
        transaction_id = data.get("transaction_id")

        if not appointment_id:
            return error_response("Appointment ID is required", 400)

        # 1. Create Payment Record
        payment = Payment(
            appointment_id=appointment_id,
            amount=amount,
            payment_method=payment_method,
            status="Paid",
            transaction_id=transaction_id
        )
        db.session.add(payment)
        
        # 2. Update Appointment Status to 'Scheduled' (if it was 'Pending')
        appointment = Appointment.query.get(appointment_id)
        if appointment:
            appointment.status = "Scheduled"
            
        # 3. Send Email Confirmation (Optional - don't fail if email fails)
        try:
            patient = appointment.patient
            specialist = appointment.specialist
            
            if patient and patient.email:
                doctor_details = {
                    "name": specialist.name if specialist.name.startswith("Dr.") else f"Dr. {specialist.name}",
                    "specialty": specialist.specialization or specialist.department or "General",
                    "consultation_fee": amount
                }
                appointment_details = {
                    "appointment_date": appointment.appointment_date.strftime("%Y-%m-%d %H:%M") if appointment.appointment_date else "N/A",
                    "doctor_session_id": appointment.doctor_session_id
                }
                
                send_appointment_confirmation(
                    patient_email=patient.email,
                    patient_name=patient.full_name,
                    appointment_details=appointment_details,
                    doctor_details=doctor_details
                )
                
            # 4. Send WhatsApp Notification
            if patient and patient.phone_number:
                send_whatsapp_notification(
                    phone_number=patient.phone_number,
                    patient_name=patient.full_name,
                    doctor_name=doctor_details['name'],
                    date=appointment_details['appointment_date'],
                    doctor_session_id=appointment_details['doctor_session_id']
                )
        except Exception as notify_err:
            print(f"Non-critical Error: Notification failed: {str(notify_err)}")

        db.session.commit()
        
        # EMIT REAL-TIME STATS UPDATE
        socketio.emit('stats_updated', {'type': 'payment', 'amount': amount})
        
        return success_response("Payment confirmed and receipt sent", {"payment_id": payment.id})

    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)
