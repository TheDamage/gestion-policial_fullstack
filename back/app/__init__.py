import os
import logging
from flask import Flask, jsonify
from pythonjsonlogger import jsonlogger

from app.config import config
from app.extensions import db, jwt, ma, cors, limiter


def create_app(config_name=None):
    """Application Factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Configurar logging
    setup_logging(app)
    
    # Inicializar extensiones
    db.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    limiter.init_app(app)
    
    # Registrar blueprints
    register_blueprints(app)
    
    # Manejadores de errores
    register_error_handlers(app)
    
    # JWT callbacks
    register_jwt_callbacks(app)
    
    # Crear directorios necesarios
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'carinfo'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'actas'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'certificados'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'avatars'), exist_ok=True)
    
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'success': True,
            'message': 'API is running',
            'environment': config_name
        })
    
    return app


def setup_logging(app):
    """Configurar logging estructurado"""
    log_handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )
    log_handler.setFormatter(formatter)
    
    app.logger.addHandler(log_handler)
    app.logger.setLevel(app.config['LOG_LEVEL'])


def register_blueprints(app):
    """Registrar todos los blueprints"""
    from app.blueprints.auth import auth_bp
    from app.blueprints.carinfo import carinfo_bp
    from app.blueprints.whoiswho import whoiswho_bp
    from app.blueprints.protocol import protocolo_bp
    from app.blueprints.capacitacion import capacitacion_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(carinfo_bp, url_prefix='/api/carinfo')
    app.register_blueprint(whoiswho_bp, url_prefix='/api/whoiswho')
    app.register_blueprint(protocolo_bp, url_prefix='/api/protocolos')
    app.register_blueprint(capacitacion_bp, url_prefix='/api/capacitaciones')


def register_error_handlers(app):
    """Registrar manejadores de errores personalizados"""
    from app.utils.responses import error_response
    
    @app.errorhandler(400)
    def bad_request(e):
        return error_response('BAD_REQUEST', str(e), 400)
    
    @app.errorhandler(401)
    def unauthorized(e):
        return error_response('UNAUTHORIZED', 'No autenticado', 401)
    
    @app.errorhandler(403)
    def forbidden(e):
        return error_response('FORBIDDEN', 'No autorizado', 403)
    
    @app.errorhandler(404)
    def not_found(e):
        return error_response('NOT_FOUND', 'Recurso no encontrado', 404)
    
    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return error_response('RATE_LIMIT_EXCEEDED', 'Demasiadas solicitudes', 429)
    
    @app.errorhandler(500)
    def internal_error(e):
        app.logger.error(f'Error interno: {str(e)}')
        return error_response('INTERNAL_ERROR', 'Error interno del servidor', 500)


def register_jwt_callbacks(app):
    """Registrar callbacks de JWT"""
    from app.utils.responses import error_response
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response('TOKEN_EXPIRED', 'El token ha expirado', 401)
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return error_response('INVALID_TOKEN', 'Token inválido', 401)
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return error_response('MISSING_TOKEN', 'Token no proporcionado', 401)
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return error_response('TOKEN_REVOKED', 'El token ha sido revocado', 401)