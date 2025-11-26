# utils/permissions.py - VERSIÓN ALTERNATIVA
from functools import wraps
from flask_jwt_extended import get_jwt_identity
from app.utils.responses import error_response

def require_permission(permission):
    """
    Decorator para requerir un permiso específico
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            
            if not user_id:
                return error_response('UNAUTHORIZED', 'Token requerido', 401)
            
            # Obtener usuario de la base de datos
            from app.models.user import User
            user = User.query.get(user_id)
            
            if not user or not user.activo:
                return error_response('USER_INACTIVE', 'Usuario inactivo', 403)
            
            # Verificar si es admin (tiene todos los permisos)
            if user.role and user.role.name == 'admin':
                return fn(*args, **kwargs)
            
            # Aquí puedes agregar lógica específica para otros permisos
            # Por ahora, solo permitir admin para capacitaciones
            allowed_roles_by_permission = {
                'capacitaciones.ver': ['admin', 'supervisor', 'operador', 'consulta'],
                'capacitaciones.crear': ['admin', 'supervisor'],
                'capacitaciones.editar': ['admin', 'supervisor'],
                'capacitaciones.eliminar': ['admin'],
                'capacitaciones.gestionar_participantes': ['admin', 'supervisor', 'operador'],
                'capacitaciones.asignar': ['admin', 'supervisor'],
                'capacitaciones.exportar': ['admin', 'supervisor']
            }
            
            user_role = user.role.name if user.role else None
            allowed_roles = allowed_roles_by_permission.get(permission, [])
            
            if user_role not in allowed_roles:
                return error_response('FORBIDDEN', 'No tienes permisos para esta acción', 403)
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator