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

    # IMPORTANT: Import models so Flask-Migrate can detect them
    from app.models import Specialist, Patient, Appointment, Queue
    from app.routes import appointment_bp
    app.register_blueprint(appointment_bp, url_prefix="/api")

    from app.routes import recommendation_bp
    app.register_blueprint(recommendation_bp, url_prefix="/api")

    from app.routes import chatbot_bp
    app.register_blueprint(chatbot_bp, url_prefix="/api")

    return app
