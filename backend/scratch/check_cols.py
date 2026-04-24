import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from app.extensions import db
from sqlalchemy import inspect

def check_columns():
    app = create_app()
    with app.app_context():
        inspector = inspect(db.engine)
        columns = inspector.get_columns('specialists')
        print("Columns in 'specialists' table:")
        for column in columns:
            print(f"Name: {column['name']}, Type: {column['type']}")

if __name__ == "__main__":
    check_columns()
