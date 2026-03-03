from flask import Blueprint
from app.extensions import db
from app.utils.response import success_response, error_response
from sqlalchemy import text

health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.route("/health", methods=["GET"])
def health_check():
    try:
        db.session.execute(text("SELECT 1"))

        return success_response(
            "System is healthy",
            {"database": "connected"}
        )

    except Exception as e:
        return error_response("Database connection failed", 500)
