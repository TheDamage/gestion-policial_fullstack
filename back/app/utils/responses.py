import uuid
from datetime import datetime
from flask import jsonify


def success_response(data=None, message=None, status=200):
    """
    Formato estandarizado para respuestas exitosas
    """
    response = {
        'success': True,
        'metadata': {
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': str(uuid.uuid4())
        }
    }
    
    if data is not None:
        response['data'] = data
    
    if message:
        response['message'] = message
    
    return jsonify(response), status


def paginated_response(data, page, limit, total, status=200):
    """
    Formato estandarizado para respuestas paginadas
    """
    total_pages = (total + limit - 1) // limit  # Redondeo hacia arriba
    
    response = {
        'success': True,
        'data': data,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'pages': total_pages
        },
        'metadata': {
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': str(uuid.uuid4())
        }
    }
    
    return jsonify(response), status


def error_response(code, message, status=400, details=None):
    """
    Formato estandarizado para respuestas de error
    """
    response = {
        'success': False,
        'error': {
            'code': code,
            'message': message
        },
        'metadata': {
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': str(uuid.uuid4())
        }
    }
    
    if details:
        response['error']['details'] = details
    
    return jsonify(response), status