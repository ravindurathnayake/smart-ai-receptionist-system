from flask import Flask
from .config import DevelopmentConfig
from .extensions import db, migrate, cors


def create_app():
    app = Flask(__name__)
    app.config.from_object(DevelopmentConfig)

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
