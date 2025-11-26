import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuración base"""
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://policia_user:policia2025@localhost:5432/policia_caba')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    JWT_ALGORITHM = 'HS256'
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
    
    # File Upload
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    ALLOWED_EXTENSIONS_IMAGE = {'jpg', 'jpeg', 'png', 'webp'}
    ALLOWED_EXTENSIONS_VIDEO = {'mp4', 'mov'}
    ALLOWED_EXTENSIONS_DOC = {'pdf'}
    
    # Rate Limiting
    RATELIMIT_STORAGE_URI = os.getenv('REDIS_URL', 'memory://')
    
    # Tesseract (OCR)
    TESSERACT_PATH = os.getenv('TESSERACT_PATH', None)
    
    # External APIs (TODO: Implementar cuando estén disponibles)
    DNRPA_API_URL = os.getenv('DNRPA_API_URL', None)
    DNRPA_API_KEY = os.getenv('DNRPA_API_KEY', None)
    RENAPER_API_URL = os.getenv('RENAPER_API_URL', None)
    RENAPER_API_KEY = os.getenv('RENAPER_API_KEY', None)
    SIA_API_URL = os.getenv('SIA_API_URL', None)
    SIA_API_KEY = os.getenv('SIA_API_KEY', None)
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')


class DevelopmentConfig(Config):
    """Configuración de desarrollo"""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Configuración de producción"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Configuración de testing"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://policia_user:policia2025@localhost:5432/policia_caba'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}