# config.py
import secrets

class Config:
    # Flask-Mail configuration
    MAIL_SERVER = 'smtp.gmail.com'  
    MAIL_PORT = 587
    MAIL_USERNAME = 'allamankonate@gmail.com'  
    MAIL_PASSWORD = 'nrpl tdts mrvy jrxq'  
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_DEFAULT_SENDER = 'donotreply@gmail.com' 

    SECRET_KEY = secrets.token_hex(16)
    SECURITY_PASSWORD_SALT = 'some_random_salt'

    MONGO_URI = 'mongodb://localhost:27017/volunteer_management'
    