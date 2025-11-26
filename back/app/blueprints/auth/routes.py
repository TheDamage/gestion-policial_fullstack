from datetime import datetime, timedelta
from flask import request
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from werkzeug.security import check_password_hash

from app.blueprints.auth import auth_bp
from app.extensions import db, limiter
from app.models.user import User, RefreshToken, Sesion
from app.blueprints.auth.schemas import LoginSchema, ChangePasswordSchema
from app.utils.responses import success_response, error_response


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """Login de usuario con validación completa"""
    
    # Validar datos de entrada
    schema = LoginSchema()
    try:
        data = schema.load(request.json)
    except Exception as e:
        return error_response('VALIDATION_ERROR', str(e), 400)
    
    legajo = data['legajo']
    password = data['password']
    device_info = data.get('device_info', {})
    
    # Buscar usuario por legajo
    user = User.query.filter_by(legajo=legajo).first()
    
    if not user:
        return error_response('INVALID_CREDENTIALS', 'Credenciales inválidas', 401)
    
    # Verificar si la cuenta está bloqueada
    if user.account_locked_until and user.account_locked_until > datetime.utcnow():
        tiempo_restante = (user.account_locked_until - datetime.utcnow()).seconds // 60
        return error_response(
            'ACCOUNT_LOCKED', 
            f'Cuenta bloqueada. Intente nuevamente en {tiempo_restante} minutos', 
            403
        )
    
    # Verificar contraseña
    if not check_password_hash(user.password_hash, password):
        # Incrementar intentos fallidos
        user.failed_login_attempts += 1
        
        # Bloquear cuenta después de 5 intentos fallidos
        if user.failed_login_attempts >= 5:
            user.account_locked_until = datetime.utcnow() + timedelta(minutes=30)
            db.session.commit()
            return error_response(
                'ACCOUNT_LOCKED', 
                'Cuenta bloqueada por múltiples intentos fallidos. Intente en 30 minutos', 
                403
            )
        
        db.session.commit()
        return error_response('INVALID_CREDENTIALS', 'Credenciales inválidas', 401)
    
    # Verificar si el usuario está activo
    if not user.activo:
        return error_response('USER_INACTIVE', 'Usuario inactivo', 403)
    
    # Login exitoso - resetear intentos fallidos
    user.failed_login_attempts = 0
    user.account_locked_until = None
    user.last_login = datetime.utcnow()
    
    # Crear tokens JWT
    access_token = create_access_token(identity=user.id)
    refresh_token_jwt = create_refresh_token(identity=user.id)
    
    # Guardar refresh token en la base de datos
    refresh_token_record = RefreshToken(
        user_id=user.id,
        token=refresh_token_jwt,
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.session.add(refresh_token_record)
    
    # Crear sesión
    sesion = Sesion(
        user_id=user.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', ''),
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.session.add(sesion)
    
    db.session.commit()
    
    # Preparar respuesta con información del usuario
    user_data = user.to_dict(include_permissions=True)
    
    return success_response({
        'access_token': access_token,
        'refresh_token': refresh_token_jwt,
        'user': user_data,
        'expires_in': 3600  # 1 hora en segundos
    }, message='Login exitoso')


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Renovar access token usando refresh token"""
    user_id = get_jwt_identity()
    
    # Verificar que el usuario existe y está activo
    user = User.query.get(user_id)
    if not user or not user.activo:
        return error_response('USER_INACTIVE', 'Usuario inactivo', 403)
    
    # Verificar que el refresh token existe y no está revocado
    refresh_token = request.json.get('refresh_token')
    token_record = RefreshToken.query.filter_by(
        token=refresh_token,
        user_id=user_id,
        revoked=False
    ).first()
    
    if not token_record:
        return error_response('INVALID_TOKEN', 'Token inválido o revocado', 401)
    
    # Verificar que el token no ha expirado
    if token_record.expires_at < datetime.utcnow():
        return error_response('TOKEN_EXPIRED', 'Token expirado', 401)
    
    # Crear nuevo access token
    access_token = create_access_token(identity=user_id)
    
    return success_response({
        'access_token': access_token,
        'expires_in': 3600
    }, message='Token renovado exitosamente')


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout - revocar tokens"""
    user_id = get_jwt_identity()
    
    # Obtener refresh token del request
    refresh_token = request.json.get('refresh_token')
    
    if refresh_token:
        # Revocar el refresh token
        token_record = RefreshToken.query.filter_by(
            token=refresh_token,
            user_id=user_id
        ).first()
        
        if token_record:
            token_record.revoked = True
            db.session.commit()
    
    return success_response(message='Logout exitoso')


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Obtener información del usuario autenticado"""
    user_id = get_jwt_identity()
    
    user = User.query.get(user_id)
    if not user:
        return error_response('USER_NOT_FOUND', 'Usuario no encontrado', 404)
    
    if not user.activo:
        return error_response('USER_INACTIVE', 'Usuario inactivo', 403)
    
    return success_response(user.to_dict(include_permissions=True))


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Cambiar contraseña del usuario autenticado"""
    user_id = get_jwt_identity()
    
    # Validar datos
    schema = ChangePasswordSchema()
    try:
        data = schema.load(request.json)
    except Exception as e:
        return error_response('VALIDATION_ERROR', str(e), 400)
    
    user = User.query.get(user_id)
    if not user:
        return error_response('USER_NOT_FOUND', 'Usuario no encontrado', 404)
    
    # Verificar contraseña actual
    if not check_password_hash(user.password_hash, data['old_password']):
        return error_response('INVALID_PASSWORD', 'Contraseña actual incorrecta', 401)
    
    # Actualizar contraseña
    from werkzeug.security import generate_password_hash
    user.password_hash = generate_password_hash(data['new_password'])
    user.password_changed_at = datetime.utcnow()
    
    # Revocar todos los refresh tokens del usuario
    RefreshToken.query.filter_by(user_id=user_id, revoked=False).update({'revoked': True})
    
    db.session.commit()
    
    return success_response(message='Contraseña cambiada exitosamente')


@auth_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_active_sessions():
    """Obtener sesiones activas del usuario"""
    user_id = get_jwt_identity()
    
    active_sessions = Sesion.query.filter(
        Sesion.user_id == user_id,
        Sesion.expires_at > datetime.utcnow()
    ).order_by(Sesion.created_at.desc()).all()
    
    sessions_data = [{
        'id': s.id,
        'ip_address': s.ip_address,
        'user_agent': s.user_agent,
        'created_at': s.created_at.isoformat(),
        'last_activity': s.last_activity.isoformat(),
        'expires_at': s.expires_at.isoformat()
    } for s in active_sessions]
    
    return success_response({'sessions': sessions_data})


@auth_bp.route('/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def revoke_session(session_id):
    """Revocar una sesión específica"""
    user_id = get_jwt_identity()
    
    sesion = Sesion.query.filter_by(id=session_id, user_id=user_id).first()
    
    if not sesion:
        return error_response('SESSION_NOT_FOUND', 'Sesión no encontrada', 404)
    
    db.session.delete(sesion)
    db.session.commit()
    
    return success_response(message='Sesión revocada exitosamente')