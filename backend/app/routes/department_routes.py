from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.department import Department

department_bp = Blueprint("department_bp", __name__)

@department_bp.route("/", methods=["GET"])
def get_departments():
    try:
        depts = Department.query.all()
        return jsonify([{
            "id": d.id,
            "name": d.name,
            "description": d.description,
            "icon": d.icon,
            "specialist_count": len(d.specialists)
        } for d in depts]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@department_bp.route("/", methods=["POST"])
def add_department():
    try:
        data = request.get_json()
        new_dept = Department(
            name=data.get("name"),
            description=data.get("description"),
            icon=data.get("icon")
        )
        db.session.add(new_dept)
        db.session.commit()
        return jsonify({"message": "Department created successfully", "id": new_dept.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
