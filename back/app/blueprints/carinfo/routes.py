from flask import request
from app.blueprints.carinfo import carinfo_bp
from app.extensions import db
from app.utils.responses import success_response, error_response
from flask_jwt_extended import jwt_required


@carinfo_bp.route('/ocr', methods=['POST'])
@jwt_required()
def process_ocr():
    """Procesa imagen y extrae patente con OCR"""
    # TODO: Implementar OCR real
    return success_response({
        'patente': 'ABC123',
        'confidence': 0.85
    })


@carinfo_bp.route('/consultar', methods=['POST'])
@jwt_required()
def consultar_patente():
    """Consulta información de vehículo por patente"""
    data = request.json
    
    if not data or 'patente' not in data:
        return error_response('MISSING_PATENTE', 'Patente requerida', 400)
    
    # Datos simulados
    return success_response({
        'consulta_id': 'test-consulta-id',
        'patente': data['patente'],
        'vehiculo': {
            'patente': data['patente'],
            'marca': 'FORD',
            'modelo': 'FOCUS',
            'anio': 2020,
            'color': 'GRIS',
            'tipo': 'SEDAN'
        },
        'titular': {
            'dni': '12345678',
            'nombre': 'JUAN',
            'apellido': 'PEREZ',
            'domicilio': 'AV. CORRIENTES 1234, CABA'
        },
        'estado_vehiculo': 'normal',
        'opciones': ['generar_acta', 'registrar_intervencion', 'dejar_circular']
    })


@carinfo_bp.route('/historial', methods=['GET'])
@jwt_required()
def get_historial():
    """Obtiene historial de consultas del usuario"""
    return success_response([])


@carinfo_bp.route('/acta', methods=['POST'])
@jwt_required()
def generar_acta():
    """Genera un acta"""
    data = request.json
    
    return success_response({
        'acta_id': 'test-acta-id',
        'firma_digital': 'test-firma',
        'hash': 'test-hash'
    }, message='Acta generada exitosamente')