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
    from app.models import Specialist

    return app
