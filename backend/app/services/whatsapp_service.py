import os
from twilio.rest import Client


def is_twilio_sandbox_sender():
    sender = os.getenv('TWILIO_WHATSAPP_NUMBER', '')
    return '14155238886' in sender


def _normalize_phone_number(phone_number):
    if not phone_number:
        return None

    clean_number = ''.join(ch for ch in str(phone_number).strip() if ch.isdigit())
    if not clean_number:
        return None

    if clean_number.startswith('0'):
        clean_number = f"94{clean_number[1:]}"
    elif clean_number.startswith('94'):
        pass
    elif clean_number.startswith('7') and len(clean_number) == 9:
        clean_number = f"94{clean_number}"
    else:
        clean_number = f"94{clean_number}"

    return f"whatsapp:+{clean_number}"


def _normalize_from_whatsapp_number(number):
    if not number:
        return None

    raw = str(number).strip()
    if raw.startswith('whatsapp:'):
        return raw

    digits = ''.join(ch for ch in raw if ch.isdigit())
    if not digits:
        return None

    return f"whatsapp:+{digits}"


def get_patient_whatsapp_numbers(patient):
    if not patient:
        return []

    numbers = []
    for number in [patient.phone_number, patient.guardian_phone]:
        if number and number not in numbers:
            numbers.append(number)

    return numbers


def _send_whatsapp_message(phone_numbers, message_body):
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_whatsapp_number = _normalize_from_whatsapp_number(os.getenv('TWILIO_WHATSAPP_NUMBER'))

    recipients = []
    for phone_number in phone_numbers if isinstance(phone_numbers, (list, tuple, set)) else [phone_numbers]:
        normalized = _normalize_phone_number(phone_number)
        if normalized and normalized not in recipients:
            recipients.append(normalized)

    if not recipients:
        print("WhatsApp skipped: no valid recipient numbers available.")
        return False

    is_simulation = not account_sid or account_sid == 'your_account_sid' or not auth_token or not from_whatsapp_number

    if is_simulation:
        print("\n" + "=" * 50)
        print("WHATSAPP SIMULATION MODE ACTIVE")
        print(f"From: {from_whatsapp_number or 'NOT CONFIGURED'}")
        print(f"To: {', '.join(recipients)}")
        print(f"Message:\n{message_body}")
        print("=" * 50 + "\n")
        return True

    client = Client(account_sid, auth_token)
    success_count = 0

    for recipient in recipients:
        try:
            client.messages.create(
                from_=from_whatsapp_number,
                to=recipient,
                body=message_body
            )
            success_count += 1
        except Exception as e:
            print(f"Twilio Error sending to {recipient}: {str(e)}")

    return success_count == len(recipients) and success_count > 0


def send_whatsapp_notification(
    phone_numbers,
    patient_name,
    doctor_name,
    date,
    doctor_session_id,
    payment_method="Card",
    payment_status="Paid",
    transaction_id=None,
    amount=None
):
    """
    Sends an appointment/payment confirmation message via WhatsApp.
    """
    is_counter_payment = payment_method == 'Cash at Counter'
    amount_label = f"Rs. {amount}" if amount is not None else "Pending at counter"

    if is_counter_payment:
        message_body = (
            f"MediAssist AI - Counter Payment Ticket\n\n"
            f"Hello {patient_name},\n\n"
            f"Your appointment is confirmed, but payment is still pending.\n\n"
            f"Doctor: {doctor_name}\n"
            f"Date: {date}\n"
            f"Session ID: #{doctor_session_id}\n"
            f"Ticket Ref: {transaction_id or 'N/A'}\n"
            f"Amount Due: {amount_label}\n\n"
            f"Please go to the reception counter to complete payment before your session."
        )
    else:
        message_body = (
            f"MediAssist AI - Appointment Confirmation\n\n"
            f"Hello {patient_name},\n\n"
            f"Your appointment is confirmed.\n\n"
            f"Doctor: {doctor_name}\n"
            f"Date: {date}\n"
            f"Session ID: #{doctor_session_id}\n"
            f"Payment: {payment_status}\n"
            f"Reference: {transaction_id or 'N/A'}\n\n"
            f"Please arrive 10 minutes early. Thank you for choosing us."
        )

    return _send_whatsapp_message(phone_numbers, message_body)


def send_checkin_whatsapp(phone_numbers, patient_name, queue_number, estimated_wait_time, doctor_name):
    """
    Sends a check-in confirmation message via WhatsApp.
    """
    message_body = (
        f"MediAssist AI - Check-In Successful\n\n"
        f"Hello {patient_name},\n\n"
        f"You have checked in successfully. Please proceed to the waiting area.\n\n"
        f"Queue Number: #A-{queue_number:02d}\n"
        f"Doctor: {doctor_name}\n"
        f"Estimated Wait: {estimated_wait_time} mins\n\n"
        f"We will notify you when it is your turn."
    )

    return _send_whatsapp_message(phone_numbers, message_body)


def send_checkout_whatsapp(phone_numbers, patient_name):
    """
    Sends a check-out confirmation message via WhatsApp.
    """
    message_body = (
        f"MediAssist AI - Visit Completed\n\n"
        f"Thank you {patient_name} for visiting us today.\n\n"
        f"Your session is now closed. We hope you have a speedy recovery.\n\n"
        f"Take care and stay healthy."
    )

    return _send_whatsapp_message(phone_numbers, message_body)
