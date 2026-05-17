import os
import time
from flask import Blueprint, current_app, request
from sqlalchemy import text
from datetime import datetime
from app.extensions import db, socketio
from app.utils.response import success_response, error_response

health_bp = Blueprint("health_bp", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    try:
        # Correct way for SQLAlchemy 2.x
        db.session.execute(text("SELECT 1"))

        return success_response(
            "System is healthy",
            {"database": "connected"}
        )

    except Exception as e:
        return error_response(f"System unhealthy: {str(e)}", 500)


@health_bp.route("/system/health", methods=["GET"])
def system_health_check():
    start_total = time.time()
    is_diagnostic = request.args.get('diagnostic', 'false').lower() == 'true'
    
    results = {
        "database": {"status": "Not Available", "response_time": 0, "reason": None},
        "api": {"status": "Connected", "response_time": 0},
        "email": {"status": "Not Available", "reason": "Missing credentials"},
        "whatsapp": {"status": "Not Available", "reason": "Missing credentials"},
        "websocket": {"status": "Not Available", "reason": None},
        "face_recognition": {"status": "Not Available", "reason": None},
        "overall_status": "Healthy",
        "timestamp": datetime.now().isoformat()
    }

    # 1. Database Check
    db_start = time.time()
    try:
        db.session.execute(text("SELECT 1"))
        results["database"]["status"] = "Connected"
        results["database"]["response_time"] = int((time.time() - db_start) * 1000)
    except Exception as e:
        results["database"]["status"] = "Not Available"
        results["database"]["reason"] = "Database connection failed"
        print(f"Health Check - DB Error: {str(e)}")

    # 2. API (Self)
    results["api"]["response_time"] = int((time.time() - start_total) * 1000)

    # 3. Email Service Check
    if current_app.config.get('MAIL_USERNAME') and current_app.config.get('MAIL_PASSWORD'):
        results["email"]["status"] = "Connected"
        results["email"]["reason"] = None
        
        # If diagnostic, we could check SMTP connection here (simulated as Degraded if missing secondary config)
        if is_diagnostic and not current_app.config.get('MAIL_SERVER'):
            results["email"]["status"] = "Degraded"
            results["email"]["reason"] = "SMTP Server not configured"
    else:
        results["email"]["reason"] = "MAIL_USERNAME or MAIL_PASSWORD missing in .env"

    # 4. WhatsApp Service Check (Twilio)
    twilio_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
    if os.getenv('TWILIO_ACCOUNT_SID') and os.getenv('TWILIO_AUTH_TOKEN'):
        if twilio_number:
            results["whatsapp"]["status"] = "Connected"
            results["whatsapp"]["reason"] = None
            if "14155238886" in twilio_number:
                results["whatsapp"]["status"] = "Degraded"
                results["whatsapp"]["reason"] = "Twilio sandbox sender in use; each recipient must join the sandbox before receiving messages"
        else:
            results["whatsapp"]["status"] = "Degraded"
            results["whatsapp"]["reason"] = "TWILIO_WHATSAPP_NUMBER missing"
        
        if is_diagnostic and not twilio_number:
            results["whatsapp"]["status"] = "Degraded"
            results["whatsapp"]["reason"] = "Twilio WhatsApp Number not configured"
    else:
        results["whatsapp"]["reason"] = "TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing"

    # 5. WebSocket Check
    if socketio:
        results["websocket"]["status"] = "Connected"
    else:
        results["websocket"]["reason"] = "Socket.IO not initialized"

    # 6. Face Recognition Check
    try:
        import face_recognition
        results["face_recognition"]["status"] = "Connected"
    except ImportError:
        results["face_recognition"]["reason"] = "face_recognition library not installed"
    except Exception as e:
        results["face_recognition"]["reason"] = str(e)

    # Calculate Overall Status
    # Healthy = All green
    # Issue Detected = Any red
    # Degraded = No red, but some yellow
    
    statuses = [v["status"] for k, v in results.items() if isinstance(v, dict) and "status" in v]
    
    if "Not Available" in statuses:
        results["overall_status"] = "Issue Detected"
    elif "Degraded" in statuses:
        results["overall_status"] = "Degraded"
    else:
        results["overall_status"] = "Healthy"

    return success_response("System health check completed", results)
