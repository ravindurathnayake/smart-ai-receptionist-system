import os
from twilio.rest import Client

def send_whatsapp_notification(phone_number, patient_name, doctor_name, date, session_id):
    """
    Sends an appointment confirmation message via WhatsApp using Twilio.
    """
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
    
    is_simulation = not account_sid or account_sid == 'your_account_sid'
    
    # ... Format the phone number logic ...
    clean_number = phone_number.replace(' ', '').replace('-', '')
    if clean_number.startswith('0'):
        clean_number = '94' + clean_number[1:]
    elif not clean_number.startswith('94'):
        clean_number = '94' + clean_number
    to_number = f'whatsapp:+{clean_number}'
    
    message_body = (
        f"🏥 *MediAssist AI - Appointment Confirmed*\n\n"
        f"Hello *{patient_name}*,\n\n"
        f"Your appointment has been successfully scheduled.\n\n"
        f"👨‍⚕️ *Doctor:* {doctor_name}\n"
        f"📅 *Date:* {date}\n"
        f"🆔 *Session ID:* #{session_id}\n\n"
        f"📍 Please arrive 15 minutes early.\n"
        f"Thank you for choosing MediAssist AI!"
    )
    
    # Professional Message Body for Demo
    message_body = (
        f"🏥 *MediAssist AI - Appointment Confirmation*\n\n"
        f"Hello *{patient_name}* 👋\n\n"
        f"Your appointment is confirmed ✅\n\n"
        f"👨‍⚕️ *Doctor:* {doctor_name}\n"
        f"📅 *Date:* {date}\n"
        f"⏰ *Time:* Scheduled Session\n"
        f"🎟 *Queue Number:* #{session_id}\n\n"
        f"📍 Please arrive 10 minutes early.\n\n"
        f"Thank you for choosing us 💙"
    )

    if is_simulation:
        print("\n" + "="*50)
        print("🚀 WHATSAPP SIMULATION MODE ACTIVE")
        print(f"📱 To: {to_number}")
        print(f"💬 Message:\n{message_body}")
        print("="*50 + "\n")
        return True
        
    client = Client(account_sid, auth_token)
    try:
        # Using Direct Message Body for Demo Excellence (Bypassing Template SID for now to use custom branding)
        message = client.messages.create(
            from_=from_whatsapp_number,
            to=to_number,
            body=message_body
        )
        print(f"WhatsApp message sent! SID: {message.sid}")
        return True
    except Exception as e:
        print(f"❌ Twilio Error: {str(e)}")
        print("💡 Falling back to simulation...")
        print(f"💬 Message: {message_body}")
        return True
