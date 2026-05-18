import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
    PATIENT_PORTAL_PATH = os.getenv("PATIENT_PORTAL_PATH", "/patient-login")
    
    # PayHere settings
    PAYHERE_MERCHANT_ID = os.getenv("PAYHERE_MERCHANT_ID", "1211149")
    PAYHERE_MERCHANT_SECRET = os.getenv("PAYHERE_MERCHANT_SECRET", "4MjM2NTQ3MzE4MjQzMTkyNzI5MzQzMTM0NTc0MjgxMTk1MzYyMjk=")
    PAYHERE_SANDBOX = os.getenv("PAYHERE_SANDBOX", "True").lower() == "true"
    PAYHERE_CURRENCY = os.getenv("PAYHERE_CURRENCY", "LKR")
    PAYHERE_RETURN_URL = os.getenv("PAYHERE_RETURN_URL")
    PAYHERE_CANCEL_URL = os.getenv("PAYHERE_CANCEL_URL")
    PAYHERE_NOTIFY_URL = os.getenv("PAYHERE_NOTIFY_URL")
    
    # Mail settings
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")


class DevelopmentConfig(Config):
    DEBUG = True
