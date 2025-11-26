from flask import request
from app.blueprints.whoiswho import whoiswho_bp
from app.utils.responses import success_response, paginated_response
from flask_jwt_extended import jwt_required


@whoiswho_bp.route('/personal', methods=['GET'])
@jwt_required()
def get_personal():
    """Lista todo el personal con filtros"""
    # Datos de ejemplo
    personal = [
        {
            'id': '1',
            'legajo': '10001',
            'nombre': 'Juan',
            'apellido': 'Pérez',
            'rango': 'Comisario',
            'cargo': 'Jefe de Investigaciones',
            'area': 'Investigaciones',
            'dependencia': 'Dirección de Investigaciones',
            'telefono_directo': '011-4555-5679',
            'email_institucional': 'jperez@test.com',
            'activo': True
        },
        {
            'id': '2',
            'legajo': '10002',
            'nombre': 'María',
            'apellido': 'González',
            'rango': 'Inspector',
            'cargo': 'Inspector de Operaciones',
            'area': 'Operaciones',
            'dependencia': 'Comisaría 1',
            'telefono_directo': '011-4555-1235',
            'email_institucional': 'mgonzalez@test.com',
            'activo': True
        },
        {
            'id': '3',
            'legajo': '10003',
            'nombre': 'Carlos',
            'apellido': 'Rodríguez',
            'rango': 'Oficial',
            'cargo': 'Oficial de Patrullaje',
            'area': 'Patrullaje',
            'dependencia': 'Comisaría 1',
            'telefono_directo': '011-4555-1236',
            'email_institucional': 'crodriguez@test.com',
            'activo': True
        },
        {
            'id': '4',
            'legajo': '10004',
            'nombre': 'Ana',
            'apellido': 'Martínez',
            'rango': 'Subcomisario',
            'cargo': 'Coordinadora de Seguridad',
            'area': 'Seguridad',
            'dependencia': 'Superintendencia',
            'telefono_directo': '011-4555-9013',
            'email_institucional': 'amartinez@test.com',
            'activo': True
        }
    ]
    
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    return paginated_response(
        data=personal,
        page=page,
        limit=limit,
        total=len(personal)
    )


@whoiswho_bp.route('/personal/<personal_id>', methods=['GET'])
@jwt_required()
def get_personal_detail(personal_id):
    """Detalles de un miembro del personal"""
    personal = {
        'id': personal_id,
        'legajo': '10001',
        'nombre': 'Juan',
        'apellido': 'Pérez',
        'nombre_completo': 'Juan Pérez',
        'rango': 'Comisario',
        'cargo': 'Jefe de Investigaciones',
        'area': 'Investigaciones',
        'dependencia': 'Dirección de Investigaciones',
        'telefono_directo': '011-4555-5679',
        'email_institucional': 'jperez@test.com',
        'superior': {
            'id': '99',
            'nombre_completo': 'Roberto Sánchez',
            'cargo': 'Superintendente',
            'rango': 'Superintendente'
        },
        'subordinados': [
            {
                'id': '2',
                'nombre_completo': 'María González',
                'cargo': 'Inspector',
                'rango': 'Inspector'
            }
        ]
    }
    
    return success_response({'personal': personal})


@whoiswho_bp.route('/organigrama', methods=['GET'])
@jwt_required()
def get_organigrama():
    """Estructura jerárquica completa"""
    return success_response({'tree': []})


@whoiswho_bp.route('/dependencias', methods=['GET'])
@jwt_required()
def get_dependencias():
    """Lista de todas las dependencias"""
    dependencias = [
        {
            'id': '1',
            'nombre': 'Comisaría 1',
            'tipo': 'Comisaría',
            'direccion': 'Av. Corrientes 1234, CABA',
            'telefono': '011-4555-1234',
            'email': 'comisaria1@test.com',
            'gps_lat': -34.6037,
            'gps_lon': -58.3816
        },
        {
            'id': '2',
            'nombre': 'Dirección de Investigaciones',
            'tipo': 'Dirección',
            'direccion': 'Av. Belgrano 789, CABA',
            'telefono': '011-4555-5678',
            'email': 'investigaciones@test.com',
            'gps_lat': -34.6131,
            'gps_lon': -58.3772
        }
    ]
    
    return success_response({'dependencias': dependencias})


@whoiswho_bp.route('/dependencias/<dependencia_id>', methods=['GET'])
@jwt_required()
def get_dependencia_detail(dependencia_id):
    """Detalles de dependencia con personal asignado"""
    return success_response({
        'dependencia': 'Comisaría 1',
        'tipo': 'Comisaría',
        'direccion': 'Av. Corrientes 1234, CABA',
        'telefono': '011-4555-1234',
        'email': 'comisaria1@test.com',
        'gps_lat': -34.6037,
        'gps_lon': -58.3816,
        'personal': []
    })


@whoiswho_bp.route('/favoritos', methods=['POST'])
@jwt_required()
def toggle_favorito():
    """Marca/desmarca un contacto como favorito"""
    return success_response({'success': True, 'favorito': True})