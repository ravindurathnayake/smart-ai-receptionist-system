from flask_mail import Message
from flask import current_app, render_template_string
from ..extensions import mail


def _build_patient_portal_url():
    base_url = current_app.config.get("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
    portal_path = current_app.config.get("PATIENT_PORTAL_PATH", "/patient-login")

    if not portal_path.startswith("/"):
        portal_path = f"/{portal_path}"

    return f"{base_url}{portal_path}"


def send_appointment_confirmation(
    patient_email,
    patient_name,
    appointment_details,
    doctor_details,
    payment_method="Card",
    payment_status="Paid",
    transaction_id=None
):
    """
    Sends a formatted email with appointment receipt and details.
    """
    is_counter_payment = payment_method == "Cash at Counter"
    portal_url = _build_patient_portal_url()
    subject = (
        f"Counter Payment Ticket - {doctor_details['name']}"
        if is_counter_payment
        else f"Appointment Confirmation - {doctor_details['name']}"
    )
    
    # Professional & Detailed HTML Template
    template = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { margin: 0; padding: 0; background-color: #eef4fb; }
            .shell { background: linear-gradient(180deg, #eef4fb 0%, #f8fbff 100%); padding: 28px 12px; }
            .container { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 720px; margin: 0 auto; }
            .header { text-align: center; padding: 34px 28px; background: linear-gradient(135deg, #00478D 0%, #002D5A 100%); border-radius: 24px 24px 0 0; color: white; }
            .header-kicker { display: inline-block; padding: 7px 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.14); font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
            .header-title { margin: 18px 0 8px; font-size: 30px; font-weight: 800; }
            .header-copy { margin: 0; opacity: 0.9; font-size: 15px; line-height: 1.6; }
            .content { background-color: #ffffff; padding: 34px 34px 28px; border-radius: 0 0 24px 24px; box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08); }
            .status-badge { display: inline-block; padding: 8px 16px; background-color: {{ badge_bg }}; color: {{ badge_color }}; border: 1px solid {{ badge_border }}; border-radius: 999px; font-weight: 800; font-size: 12px; text-transform: uppercase; margin-bottom: 18px; letter-spacing: 0.12em; }
            .hero-title { color: #0f172a; font-size: 28px; font-weight: 800; margin: 0 0 12px; }
            .hero-copy { color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 26px; }
            .summary-panel { background: linear-gradient(180deg, #f8fbff 0%, #f8fafc 100%); border: 1px solid #dbe7f5; border-radius: 20px; padding: 24px; margin-bottom: 24px; }
            .section-title { font-size: 12px; font-weight: 800; color: #7c8ea8; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.18em; }
            .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            .info-grid td { padding: 10px 0; vertical-align: top; }
            .info-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding-right: 18px; }
            .info-value { font-size: 15px; color: #0f172a; font-weight: 700; text-align: right; }
            .info-subvalue { display: block; margin-top: 4px; font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }
            .receipt-box { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; margin-top: 14px; }
            .receipt-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 14px; }
            .receipt-brand { font-size: 18px; font-weight: 800; color: #0f172a; }
            .receipt-meta { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; }
            .receipt-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; gap: 18px; }
            .receipt-key { color: #64748b; font-weight: 700; }
            .receipt-value { color: #0f172a; font-weight: 700; text-align: right; }
            .receipt-note { margin-top: 16px; border-radius: 14px; padding: 14px 16px; background: {{ note_bg }}; color: {{ note_color }}; font-size: 13px; line-height: 1.6; font-weight: 700; }
            .receipt-total { border-top: 1px solid #e2e8f0; margin-top: 18px; padding-top: 18px; display: flex; justify-content: space-between; align-items: end; }
            .total-label { font-weight: 800; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; }
            .total-amount { font-weight: 900; color: {{ total_color }}; font-size: 28px; }
            .cta-card { margin-top: 28px; border-radius: 20px; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center; }
            .cta-title { margin: 0 0 8px; color: #ffffff; font-size: 20px; font-weight: 800; }
            .cta-copy { margin: 0 0 18px; color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.6; }
            .button { display: inline-block; padding: 14px 28px; background-color: #38bdf8; color: #082f49 !important; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; }
            .fallback-link { margin-top: 14px; font-size: 12px; color: rgba(255,255,255,0.78); line-height: 1.6; word-break: break-all; }
            .footer { text-align: center; padding-top: 24px; color: #94a3b8; font-size: 12px; line-height: 1.7; }
            @media only screen and (max-width: 640px) {
                .content { padding: 26px 20px 22px; }
                .header { padding: 28px 20px; }
                .hero-title { font-size: 24px; }
                .receipt-head, .receipt-row, .receipt-total { display: block; }
                .info-value, .receipt-value { text-align: left; display: block; margin-top: 4px; }
                .total-amount { display: block; margin-top: 6px; }
            }
        </style>
    </head>
    <body>
        <div class="shell">
            <div class="container">
                <div class="header">
                    <div class="header-kicker">MediAssist Healthcare</div>
                    <h1 class="header-title">{{ email_banner_title }}</h1>
                    <p class="header-copy">{{ email_banner_copy }}</p>
                </div>
                
                <div class="content">
                    <div class="status-badge">{{ badge_text }}</div>
                    
                    <h2 class="hero-title">{{ title_text }}</h2>
                    <p class="hero-copy">
                        Dear <strong>{{ name }}</strong>,<br>
                        {{ intro_text }}
                    </p>

                    <div class="summary-panel">
                        <div class="section-title">Session Details</div>
                        <table class="info-grid" role="presentation">
                            <tr>
                                <td class="info-label">Practitioner</td>
                                <td class="info-value">
                                    {{ doctor_name }}
                                    <span class="info-subvalue">{{ specialty }}</span>
                                </td>
                            </tr>
                            <tr>
                                <td class="info-label">Appointment Date</td>
                                <td class="info-value">{{ date }}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Session ID</td>
                                <td class="info-value">#{{ doctor_session_id }}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Patient Email</td>
                                <td class="info-value">{{ patient_email }}</td>
                            </tr>
                        </table>

                        <div class="receipt-box">
                            <div class="receipt-head">
                                <div>
                                    <div class="receipt-brand">{{ title_text }}</div>
                                    <div class="receipt-meta">{{ receipt_meta }}</div>
                                </div>
                                <div class="receipt-meta">{{ payment_method }}</div>
                            </div>
                            <div class="receipt-row">
                                <span class="receipt-key">Consultation Fee</span>
                                <span class="receipt-value">Rs. {{ amount }}</span>
                            </div>
                            <div class="receipt-row">
                                <span class="receipt-key">Payment Method</span>
                                <span class="receipt-value">{{ payment_method }}</span>
                            </div>
                            {% if reference_label %}
                            <div class="receipt-row">
                                <span class="receipt-key">{{ reference_label }}</span>
                                <span class="receipt-value">{{ transaction_id }}</span>
                            </div>
                            {% endif %}
                            <div class="receipt-row">
                                <span class="receipt-key">Receipt Status</span>
                                <span class="receipt-value">{{ receipt_status }}</span>
                            </div>
                            {% if receipt_note %}
                            <div class="receipt-note">{{ receipt_note }}</div>
                            {% endif %}
                            <div class="receipt-total">
                                <span class="total-label">{{ total_label }}</span>
                                <span class="total-amount">Rs. {{ amount }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="cta-card">
                        <h3 class="cta-title">{{ cta_title }}</h3>
                        <p class="cta-copy">{{ cta_copy }}</p>
                        <a href="{{ portal_url }}" class="button" target="_blank" rel="noopener noreferrer">{{ cta_label }}</a>
                        <div class="fallback-link">
                            If the button does not open automatically, copy this link into your browser:<br>
                            {{ portal_url }}
                        </div>
                    </div>

                    <div class="footer">
                        <p>Important: Please arrive 15 minutes prior to your scheduled time.<br>
                        If you need to reschedule, please contact us at least 2 hours in advance.</p>
                        <p style="margin-top: 18px;">&copy; 2026 MediAssist AI Hospital System.<br>
                        123 Healthcare Plaza, Colombo, Sri Lanka</p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    html_content = render_template_string(
        template,
        name=patient_name,
        patient_email=patient_email,
        doctor_name=doctor_details['name'],
        specialty=doctor_details['specialty'],
        date=appointment_details['appointment_date'],
        doctor_session_id=appointment_details['doctor_session_id'],
        amount=doctor_details['consultation_fee'],
        portal_url=portal_url,
        payment_method=payment_method,
        transaction_id=transaction_id or 'N/A',
        badge_text="Confirmed - Payment Pending" if is_counter_payment else "Confirmed & Paid",
        title_text="Counter Payment Ticket" if is_counter_payment else "Appointment Receipt",
        email_banner_title="Payment Pending" if is_counter_payment else "Appointment Confirmed",
        email_banner_copy=(
            "Your session has been reserved. Complete payment at the reception counter before the consultation begins."
            if is_counter_payment else
            "Your appointment and payment have been recorded successfully. Your digital receipt is ready below."
        ),
        intro_text=(
            "Thank you for choosing MediAssist AI. Your appointment has been successfully scheduled. "
            "Please present this provisional counter-payment ticket at reception to complete payment and activate your session."
            if is_counter_payment else
            "Thank you for choosing MediAssist AI. Your appointment has been successfully scheduled. "
            "Please present this digital receipt at the kiosk or reception upon arrival."
        ),
        reference_label="Ticket Reference" if is_counter_payment else "Transaction ID",
        total_label="Amount Due at Counter" if is_counter_payment else "Total Paid",
        receipt_meta="Payment to be completed on arrival" if is_counter_payment else "Official digital confirmation",
        receipt_status="Pending Payment" if is_counter_payment else "Paid in Full",
        receipt_note=(
            "Bring this ticket to the reception or billing counter. Your session will be activated after payment is completed."
            if is_counter_payment else
            "Keep this receipt for your records. You can also review your visit details from the patient portal after signing in."
        ),
        cta_title="Access Your Patient Portal",
        cta_copy=(
            "Use the button below to sign in and continue to your dashboard."
            if is_counter_payment else
            "Use the button below to sign in and review your dashboard, appointment history, and receipts."
        ),
        cta_label="Open Patient Portal",
        badge_bg="#fff7ed" if is_counter_payment else "#ecfdf3",
        badge_color="#b45309" if is_counter_payment else "#166534",
        badge_border="#fed7aa" if is_counter_payment else "#bbf7d0",
        note_bg="#fff7ed" if is_counter_payment else "#eff6ff",
        note_color="#9a3412" if is_counter_payment else "#1d4ed8",
        total_color="#c2410c" if is_counter_payment else "#00478D"
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
