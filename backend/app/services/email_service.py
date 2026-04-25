from flask_mail import Message
from ..extensions import mail
from flask import render_template_string

def send_appointment_confirmation(patient_email, patient_name, appointment_details, doctor_details):
    """
    Sends a formatted email with appointment receipt and details.
    """
    subject = f"Appointment Confirmation - {doctor_details['name']}"
    
    # Professional & Detailed HTML Template
    template = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f4f7f9; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #00478D 0%, #002D5A 100%); border-radius: 16px 16px 0 0; color: white; }
            .content { background-color: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .status-badge { display: inline-block; padding: 6px 16px; background-color: #e3f2fd; color: #00478D; border-radius: 20px; font-weight: 800; font-size: 12px; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 1px; }
            .section-title { font-size: 14px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; letter-spacing: 0.5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-item { margin-bottom: 15px; }
            .info-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
            .info-value { font-size: 15px; color: #1e293b; font-weight: 700; }
            .receipt-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-top: 30px; }
            .receipt-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .receipt-total { border-top: 2px solid #e2e8f0; margin-top: 15px; padding-top: 15px; display: flex; justify-content: space-between; align-items: center; }
            .total-label { font-weight: 800; color: #1e293b; font-size: 16px; }
            .total-amount { font-weight: 900; color: #00478D; font-size: 24px; }
            .footer { text-align: center; padding-top: 30px; color: #94a3b8; font-size: 12px; line-height: 1.5; }
            .button { display: inline-block; padding: 14px 30px; background-color: #00478D; color: white !important; text-decoration: none; border-radius: 10px; font-weight: 700; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 28px;">MediAssist AI</h1>
                <p style="margin: 5px 0 0; opacity: 0.8; font-weight: 500;">Official Appointment Confirmation</p>
            </div>
            
            <div class="content">
                <div class="status-badge">Confirmed & Paid</div>
                
                <h2 style="color: #1e293b; font-size: 24px; margin-top: 0;">Appointment Receipt</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                    Dear <strong>{{ name }}</strong>,<br>
                    Thank you for choosing MediAssist AI. Your appointment has been successfully scheduled. Please present this digital receipt at the kiosk or reception upon arrival.
                </p>

                <div class="section-title">Session Details</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Practitioner</div>
                        <div class="info-value">{{ doctor_name }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Specialization</div>
                        <div class="info-value">{{ specialty }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Appointment Date</div>
                        <div class="info-value">{{ date }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Session ID</div>
                        <div class="info-value">#{{ session_id }}</div>
                    </div>
                </div>

                <div class="section-title">Payment Summary</div>
                <div class="receipt-box">
                    <div class="receipt-row">
                        <span style="color: #64748b;">Consultation Fee</span>
                        <span style="font-weight: 600;">Rs. {{ amount }}</span>
                    </div>
                    <div class="receipt-row">
                        <span style="color: #64748b;">Service Charge</span>
                        <span style="font-weight: 600;">Included</span>
                    </div>
                    <div class="receipt-total">
                        <span class="total-label">Total Paid</span>
                        <span class="total-amount">Rs. {{ amount }}</span>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 40px;">
                    <a href="#" class="button">View Dashboard</a>
                </div>

                <div class="footer">
                    <p>Important: Please arrive 15 minutes prior to your scheduled time.<br>
                    If you need to reschedule, please contact us at least 2 hours in advance.</p>
                    <p style="margin-top: 20px;">&copy; 2026 MediAssist AI Hospital System.<br>
                    123 Healthcare Plaza, Colombo, Sri Lanka</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    html_content = render_template_string(
        template,
        name=patient_name,
        doctor_name=doctor_details['name'],
        specialty=doctor_details['specialty'],
        date=appointment_details['appointment_date'],
        session_id=appointment_details['session_id'],
        amount=doctor_details['consultation_fee']
    )
    
    msg = Message(subject, recipients=[patient_email])
    msg.html = html_content
    
    try:
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def send_checkin_notification(patient_email, patient_name, queue_number, estimated_wait_time, doctor_name):
    """
    Sends an email when a patient checks in.
    """
    subject = f"Check-In Successful - Token #{queue_number}"
    
    template = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
            .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .header { color: #00478D; font-size: 24px; font-weight: 800; margin-bottom: 20px; text-align: center; }
            .token-box { background: #e3f2fd; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
            .token-label { font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; }
            .token-value { font-size: 48px; color: #00478D; font-weight: 900; }
            .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
            .label { color: #64748b; font-weight: 600; }
            .value { color: #1e293b; font-weight: 700; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="header">MediAssist AI Check-In</div>
                <p>Hello <strong>{{ name }}</strong>, your check-in was successful. Please proceed to the waiting area.</p>
                
                <div class="token-box">
                    <div class="token-label">Your Queue Number</div>
                    <div class="token-value">#{{ token }}</div>
                </div>

                <div class="info-row">
                    <span class="label">Consulting Doctor</span>
                    <span class="value">{{ doctor }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Est. Wait Time</span>
                    <span class="value">{{ wait_time }} mins</span>
                </div>

                <p style="margin-top: 20px; font-size: 14px; color: #475569;">
                    We will notify you when the doctor is ready to see you.
                </p>
            </div>
            <div class="footer">
                &copy; 2026 MediAssist AI Hospital System
            </div>
        </div>
    </body>
    </html>
    """
    
    html_content = render_template_string(
        template,
        name=patient_name,
        token=f"{queue_number:02d}",
        doctor=doctor_name,
        wait_time=estimated_wait_time
    )
    
    msg = Message(subject, recipients=[patient_email])
    msg.html = html_content
    
    try:
        print(f"DEBUG: Attempting to send check-in email to {patient_email}")
        mail.send(msg)
        print(f"DEBUG: Check-in email sent successfully to {patient_email}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to send check-in email to {patient_email}: {str(e)}")
        return False

def send_checkout_notification(patient_email, patient_name):
    """
    Sends an email when a patient checks out.
    """
    subject = "Visit Completed - MediAssist AI"
    
    template = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            .header { color: #2e7d32; font-size: 24px; font-weight: 800; margin-bottom: 10px; }
            .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="icon">✅</div>
                <div class="header">Visit Completed</div>
                <p>Hello <strong>{{ name }}</strong>, your visit at MediAssist AI is now complete.</p>
                <p>We hope you had a pleasant experience. Your digital receipt and medical records are available in your dashboard.</p>
                <p style="margin-top: 20px; font-weight: 600; color: #00478D;">Take care and stay healthy!</p>
            </div>
            <div class="footer">
                &copy; 2026 MediAssist AI Hospital System
            </div>
        </div>
    </body>
    </html>
    """
    
    html_content = render_template_string(template, name=patient_name)
    
    msg = Message(subject, recipients=[patient_email])
    msg.html = html_content
    
    try:
        print(f"DEBUG: Attempting to send check-out email to {patient_email}")
        mail.send(msg)
        print(f"DEBUG: Check-out email sent successfully to {patient_email}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to send check-out email to {patient_email}: {str(e)}")
        return False
