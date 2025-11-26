from functools import wraps
from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User
from app.utils.responses import error_response


def jwt_required_with_user(fn):
    """
    Decorador que verifica JWT y carga el usuario en la request
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.activo:
            return error_response('USER_INACTIVE', 'Usuario inactivo', 403)
        
        request.current_user = user
        return fn(*args, **kwargs)
    
    return wrapper


def permission_required(permission):
    """
    Decorador que verifica si el usuario tiene un permiso específico
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or not user.activo:
                return error_response('USER_INACTIVE', 'Usuario inactivo', 403)
            
            if not user.has_permission(permission):
                return error_response(
                    'INSUFFICIENT_PERMISSIONS',
                    f'Permiso requerido: {permission}',
                    403
                )
            
            request.current_user = user
            return fn(*args, **kwargs)
        
        return wrapper
    return decorator


def role_required(role_name):
    """
    Decorador que verifica si el usuario tiene un rol específico
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or not user.activo:
                return error_response('USER_INACTIVE', 'Usuario inactivo', 403)
            
            if not user.has_role(role_name):
                return error_response(
                    'INSUFFICIENT_PERMISSIONS',
                    f'Rol requerido: {role_name}',
                    403
                )
            
            request.current_user = user
            return fn(*args, **kwargs)
        
        return wrapper
    return decorator