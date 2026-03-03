from flask import Blueprint
from sqlalchemy import text
from app.extensions import db
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