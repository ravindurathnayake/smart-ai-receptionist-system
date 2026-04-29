from flask import Flask
from .config import DevelopmentConfig
from .extensions import db, migrate, cors
from app.routes.health_routes import health_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(DevelopmentConfig)
    app.register_blueprint(health_bp, url_prefix="/api")

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    from .extensions import mail, socketio
    mail.init_app(app)
    socketio.init_app(app)

    # IMPORTANT: Import models so Flask-Migrate can detect them
    from app.models import Specialist, Patient, Appointment, Queue, Department, DoctorSession, Payment, User, Review
    
    from app.routes import appointment_bp, specialist_bp, department_bp, admin_bp, patient_bp, queue_bp
    app.register_blueprint(appointment_bp, url_prefix="/api")
    app.register_blueprint(specialist_bp, url_prefix="/api/specialists")
    app.register_blueprint(department_bp, url_prefix="/api/departments")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(patient_bp, url_prefix="/api/patients")
    app.register_blueprint(queue_bp)

    from app.routes.review_routes import review_bp
    app.register_blueprint(review_bp)

    from app.routes import recommendation_bp
    app.register_blueprint(recommendation_bp, url_prefix="/api")

    from app.routes import chatbot_bp
    app.register_blueprint(chatbot_bp, url_prefix="/api")

    from app.routes.chat_routes import chat_bp
    app.register_blueprint(chat_bp, url_prefix="/api/recommend")

    from app.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api")

    from app.routes.notification_routes import notification_bp
    app.register_blueprint(notification_bp, url_prefix="/api/notifications")

    from app.routes.medical_routes import medical_bp
    app.register_blueprint(medical_bp, url_prefix="/api/medical")

    return app
