from flask import Blueprint, request, jsonify
from ..models.notification import Notification
from ..extensions import db, socketio
from ..utils.response import success_response, error_response

notification_bp = Blueprint("notification_bp", __name__)

@notification_bp.route("/", methods=["POST"])
def create_notification():
    try:
        data = request.get_json()
        new_notification = Notification(
            type=data.get("type"),
            message=data.get("message"),
            kiosk_id=data.get("kiosk_id", "Kiosk #1"),
            patient_id=data.get("patient_id")
        )
        db.session.add(new_notification)
        db.session.commit()
        
        # Emit real-time notification to all connected clients (Admin Dashboard)
        socketio.emit('new_notification', new_notification.to_dict())
        
        return success_response("Notification created", new_notification.to_dict())
    except Exception as e:
        return error_response(str(e), 500)

@notification_bp.route("/", methods=["GET"])
def get_notifications():
    try:
        patient_id = request.args.get("patient_id")
        if patient_id:
            notifications = Notification.query.filter(
                (Notification.patient_id == patient_id) | (Notification.patient_id == None)
            ).order_by(Notification.created_at.desc()).limit(20).all()
        else:
            notifications = Notification.query.order_by(Notification.created_at.desc()).limit(20).all()
        return success_response("Notifications retrieved", [n.to_dict() for n in notifications])
    except Exception as e:
        return error_response(str(e), 500)

@notification_bp.route("/<int:id>/read", methods=["PATCH"])
def mark_as_read(id):
    try:
        notification = Notification.query.get(id)
        if not notification:
            return error_response("Notification not found", 404)
        notification.status = "Read"
        db.session.commit()
        return success_response("Notification marked as read", notification.to_dict())
    except Exception as e:
        return error_response(str(e), 500)
