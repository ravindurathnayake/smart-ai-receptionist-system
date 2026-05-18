from flask import Blueprint, request, current_app
import hashlib
from app.extensions import db, socketio
from app.models import Appointment, Payment, Patient, Specialist
from app.utils.response import success_response, error_response
from app.services.email_service import send_appointment_confirmation
from app.services.whatsapp_service import (
    send_whatsapp_notification,
    get_patient_whatsapp_numbers,
    is_twilio_sandbox_sender,
)

payment_bp = Blueprint("payment_bp", __name__)

@payment_bp.route("/payhere-hash", methods=["POST"])
def generate_payhere_hash_route():
    """
    Securely generates the PayHere checkout signature hash.
    Expects JSON body: { "appointment_id": 12, "amount": 5000 }
    """
    try:
        data = request.get_json()
        if not data or not data.get("appointment_id"):
            return error_response("Appointment ID is required", 400)
            
        appointment_id = data.get("appointment_id")
        
        # 1. Fetch Appointment and patient
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return error_response("Appointment not found", 404)
            
        patient = appointment.patient
        specialist = appointment.specialist
        
        if not patient:
            return error_response("Patient details not found for this appointment", 404)
            
        # 2. Determine consultation and total amount
        consultation_fee = specialist.consultation_fee if specialist else 4500.0
        hospital_fee = 500.0
        total_amount = float(data.get("amount", consultation_fee + hospital_fee))
        
        # Format amount to exactly 2 decimal places for PayHere hash matching
        formatted_amount = "{:.2f}".format(total_amount)
        currency = current_app.config.get("PAYHERE_CURRENCY", "LKR")
        
        # 3. Read PayHere configs from app.config
        merchant_id = current_app.config.get("PAYHERE_MERCHANT_ID", "1211149")
        merchant_secret = current_app.config.get("PAYHERE_MERCHANT_SECRET", "4MjM2NTQ3MzE4MjQzMTkyNzI5MzQzMTM0NTc0MjgxMTk1MzYyMjk=")
        
        # Format Order ID (PayHere expects alphanumeric or string)
        order_id = f"APT-{appointment_id}"
        
        # 4. Generate local MD5 hash of merchant_secret
        secret_hash = hashlib.md5(merchant_secret.encode('utf-8')).hexdigest().upper()
        
        # 5. Concatenate elements to hash: MerchantID + OrderID + FormattedAmount + Currency + SecretHash
        hash_payload = f"{merchant_id}{order_id}{formatted_amount}{currency}{secret_hash}"
        payhere_hash = hashlib.md5(hash_payload.encode('utf-8')).hexdigest().upper()
        
        # 6. Extract Patient fields safely
        first_name = patient.full_name.split()[0] if patient.full_name else "Patient"
        last_name = " ".join(patient.full_name.split()[1:]) if patient.full_name and len(patient.full_name.split()) > 1 else "User"
        email = patient.email or "patient@mediassist.lk"
        phone = patient.phone_number or "0771234567"
        
        # Dynamically build base URLs for redirects and webhooks
        backend_base = request.host_url.rstrip('/')
        frontend_base = current_app.config.get("FRONTEND_BASE_URL", "http://localhost:5173").rstrip('/')
        
        notify_url = current_app.config.get("PAYHERE_NOTIFY_URL") or f"{backend_base}/api/payment/payhere-notify"
        return_url = current_app.config.get("PAYHERE_RETURN_URL") or f"{frontend_base}/patient-dashboard"
        cancel_url = current_app.config.get("PAYHERE_CANCEL_URL") or f"{frontend_base}/payment"
        
        # 7. Formulate PayHere checkout payload
        checkout_data = {
            "sandbox": current_app.config.get("PAYHERE_SANDBOX", True),
            "merchant_id": merchant_id,
            "order_id": order_id,
            "items": f"Appointment with Dr. {specialist.name if specialist else 'General Doctor'}",
            "amount": formatted_amount,
            "currency": currency,
            "hash": payhere_hash,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": phone,
            "address": patient.address or "No. 12, Main Road",
            "city": "Colombo",
            "country": "Sri Lanka",
            "notify_url": notify_url,
            "return_url": return_url,
            "cancel_url": cancel_url
        }
        
        return success_response("PayHere hash generated successfully", checkout_data)
        
    except Exception as e:
        return error_response(str(e), 500)


@payment_bp.route("/payhere-notify", methods=["POST"])
def payhere_notify_route():
    """
    Webhook (notify_url) that PayHere calls asynchronously.
    Verifies signature and processes the payment completion.
    """
    try:
        # Retrieve form data sent by PayHere (typically application/x-www-form-urlencoded)
        data = request.form
        if not data:
            # Fallback to json if sent in JSON format (e.g. testing)
            data = request.get_json(silent=True) or {}
            
        merchant_id = data.get("merchant_id")
        order_id = data.get("order_id")
        payment_id = data.get("payment_id")
        payhere_amount = data.get("payhere_amount")
        payhere_currency = data.get("payhere_currency")
        status_code = data.get("status_code")
        received_md5sig = data.get("md5sig")
        
        if not all([merchant_id, order_id, payment_id, payhere_amount, payhere_currency, status_code, received_md5sig]):
            return error_response("Missing required PayHere notification parameters", 400)
            
        merchant_secret = current_app.config.get("PAYHERE_MERCHANT_SECRET", "4MjM2NTQ3MzE4MjQzMTkyNzI5MzQzMTM0NTc0MjgxMTk1MzYyMjk=")
        
        # 1. Verify Signature
        secret_md5 = hashlib.md5(merchant_secret.encode('utf-8')).hexdigest().upper()
        # Input format: MerchantID + OrderID + PayHereAmount + PayHereCurrency + StatusCode + SecretMD5
        input_string = f"{merchant_id}{order_id}{payhere_amount}{payhere_currency}{status_code}{secret_md5}"
        local_md5sig = hashlib.md5(input_string.encode('utf-8')).hexdigest().upper()
        
        if local_md5sig != received_md5sig:
            print(f"SECURITY WARNING: Invalid PayHere notify signature! Received: {received_md5sig}, Calculated: {local_md5sig}")
            return error_response("Invalid MD5 signature verification", 401)
            
        # 2. Extract Appointment ID from Order ID (e.g. "APT-12" -> 12)
        try:
            appointment_id_str = order_id.replace("APT-", "")
            appointment_id = int(appointment_id_str)
        except ValueError:
            return error_response("Invalid order_id format", 400)
            
        # 3. Check status code (2 means success)
        if status_code == "2":
            # Successful payment
            payment_status = "Paid"
            
            # Fetch appointment
            appointment = Appointment.query.get(appointment_id)
            if not appointment:
                return error_response("Appointment not found", 404)
                
            # Create or update Payment record
            payment = Payment.query.filter_by(appointment_id=appointment_id).first()
            if not payment:
                payment = Payment(
                    appointment_id=appointment_id,
                    amount=float(payhere_amount),
                    payment_method="Online (PayHere)",
                    status=payment_status,
                    transaction_id=payment_id
                )
                db.session.add(payment)
            else:
                payment.status = payment_status
                payment.transaction_id = payment_id
                payment.payment_method = "Online (PayHere)"
                payment.amount = float(payhere_amount)
                
            # Update appointment status to 'Scheduled'
            appointment.status = "Scheduled"
            
            notifications = {"email": "skipped", "whatsapp": "skipped"}
            warnings = []
            
            # Send confirmations
            try:
                patient = appointment.patient
                specialist = appointment.specialist
                
                doctor_details = {
                    "name": specialist.name if specialist.name.startswith("Dr.") else f"Dr. {specialist.name}" if specialist else "General Doctor",
                    "specialty": specialist.specialization or specialist.department or "General" if specialist else "General",
                    "consultation_fee": float(payhere_amount) - 500.0 # Approximate
                }
                
                appointment_details = {
                    "appointment_date": appointment.appointment_date.strftime("%Y-%m-%d %H:%M") if appointment.appointment_date else "N/A",
                    "doctor_session_id": appointment.doctor_session_id
                }
                
                # Email confirmation
                if patient and patient.email:
                    email_sent = send_appointment_confirmation(
                        patient_email=patient.email,
                        patient_name=patient.full_name,
                        appointment_details=appointment_details,
                        doctor_details=doctor_details,
                        payment_method="Online (PayHere)",
                        payment_status=payment_status,
                        transaction_id=payment_id
                    )
                    notifications["email"] = "sent" if email_sent else "failed"
                    
                # WhatsApp Confirmation
                whatsapp_numbers = get_patient_whatsapp_numbers(patient)
                if patient and whatsapp_numbers:
                    whatsapp_sent = send_whatsapp_notification(
                        phone_numbers=whatsapp_numbers,
                        patient_name=patient.full_name,
                        doctor_name=doctor_details['name'],
                        date=appointment_details['appointment_date'],
                        doctor_session_id=appointment_details['doctor_session_id'],
                        payment_method="Online (PayHere)",
                        payment_status=payment_status,
                        transaction_id=payment_id,
                        amount=float(payhere_amount)
                    )
                    notifications["whatsapp"] = "sent" if whatsapp_sent else "failed"
                    if not whatsapp_sent and is_twilio_sandbox_sender():
                        warnings.append("Twilio sandbox sender requires each recipient to join the sandbox before messages can be delivered.")
            except Exception as notify_err:
                print(f"Non-critical Error in Webhook: Notification failed: {str(notify_err)}")
                
            db.session.commit()
            
            # Emit socket updates in real-time
            socketio.emit('stats_updated', {'type': 'payment', 'amount': float(payhere_amount)})
            socketio.emit('appointment_updated', {
                "id": appointment.id,
                "status": appointment.status,
                "payment_status": payment_status,
                "transaction_id": payment_id
            })
            
            return success_response("Payment updated and confirmed via Webhook", {
                "appointment_id": appointment_id,
                "payment_id": payment.id,
                "status": "Paid",
                "notifications": notifications
            })
            
        else:
            # Payment failed or is pending/canceled
            print(f"PayHere payment notification received with status code: {status_code}")
            
            # Optional: We can mark it as failed if needed
            payment_status = "Failed" if status_code == "-2" else "Canceled" if status_code == "-1" else "Pending"
            
            payment = Payment.query.filter_by(appointment_id=appointment_id).first()
            if payment:
                payment.status = payment_status
                db.session.commit()
                
            return success_response(f"Payment notification processed with status: {payment_status}", {
                "appointment_id": appointment_id,
                "status": payment_status
            })
            
    except Exception as e:
        db.session.rollback()
        print(f"Error in PayHere notify endpoint: {str(e)}")
        return error_response(str(e), 500)
