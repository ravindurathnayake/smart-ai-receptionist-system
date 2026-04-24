import sys
import os
sys.path.append(os.getcwd())

from app import create_app
from app.routes.appointment_routes import get_specialists_route, queue_status_route
from flask import Flask

app = create_app()

with app.app_context():
    with app.test_request_context():
        try:
            response = queue_status_route()
            print("Response:", response)
        except Exception as e:
            import traceback
            traceback.print_exc()
