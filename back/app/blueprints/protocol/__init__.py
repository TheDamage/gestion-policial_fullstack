from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from datetime import datetime

from app.extensions import db
from app.models import Protocolo, AuditLog
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.validators import validate_file_upload
from app.utils.permissions import require_permission

protocolo_bp = Blueprint('protocolo', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}


@protocolo_bp.route('/', methods=['GET'])
@jwt_required()
def get_protocolos():
    """Obtener lista de protocolos con filtros y paginación"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        tipo = request.args.get('tipo')  # resumido o completo
        area = request.args.get('area')
        clasificacion = request.args.get('clasificacion')
        search = request.args.get('search')
        
        query = Protocolo.query.filter_by(activo=True)
        
        if tipo:
            query = query.filter_by(tipo=tipo)
        
        if area:
            query = query.filter_by(area=area)
        
        if clasificacion:
            query = query.filter_by(clasificacion=clasificacion)
        
        if search:
            query = query.filter(
                db.or_(
                    Protocolo.nombre.ilike(f'%{search}%'),
                    Protocolo.descripcion.ilike(f'%{search}%')
                )
            )
        
        total = query.count()
        protocolos = query.order_by(Protocolo.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
        
        return paginated_response(
            data=[p.to_dict() for p in protocolos],
            page=page,
            limit=limit,
            total=total
        )
    
    except Exception as e:
        return error_response('FETCH_ERROR', str(e), 500)


@protocolo_bp.route('/<protocolo_id>', methods=['GET'])
@jwt_required()
def get_protocolo(protocolo_id):
    """Obtener un protocolo específico"""
    try:
        protocolo = Protocolo.query.get(protocolo_id)
        
        if not protocolo or not protocolo.activo:
            return error_response('NOT_FOUND', 'Protocolo no encontrado', 404)
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='CONSULTA_PROTOCOLO',
            modulo='PROTOCOLOS',
            detalles={'protocolo_id': protocolo_id, 'nombre': protocolo.nombre}
        )
        
        return success_response(protocolo.to_dict())
    
    except Exception as e:
        return error_response('FETCH_ERROR', str(e), 500)


@protocolo_bp.route('/', methods=['POST'])
@jwt_required()
@require_permission('protocolos.crear')
def create_protocolo():
    """Crear un nuevo protocolo"""
    try:
        data = request.form.to_dict()
        file = request.files.get('documento')
        
        # Validar datos requeridos
        if not data.get('nombre'):
            return error_response('VALIDATION_ERROR', 'El nombre es requerido', 400)
        
        # Manejar archivo si existe
        documento_path = None
        if file:
            validation_error = validate_file_upload(file, ALLOWED_EXTENSIONS, max_size=10*1024*1024)
            if validation_error:
                return error_response('FILE_ERROR', validation_error, 400)
            
            filename = secure_filename(file.filename)
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{filename}"
            filepath = os.path.join('uploads', 'protocolos', filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            file.save(filepath)
            documento_path = filepath
        
        # Crear protocolo
        protocolo = Protocolo(
            nombre=data.get('nombre'),
            descripcion=data.get('descripcion'),
            responsable=data.get('responsable'),
            area=data.get('area'),
            fecha_validez=datetime.fromisoformat(data.get('fecha_validez')) if data.get('fecha_validez') else None,
            clasificacion=data.get('clasificacion'),
            autor=data.get('autor'),
            aprobado_por=data.get('aprobado_por'),
            documento_path=documento_path,
            tipo=data.get('tipo', 'resumido')
        )
        
        db.session.add(protocolo)
        db.session.commit()
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='CREAR_PROTOCOLO',
            modulo='PROTOCOLOS',
            detalles={'protocolo_id': protocolo.id, 'nombre': protocolo.nombre}
        )
        
        return success_response(protocolo.to_dict(), 'Protocolo creado exitosamente', 201)
    
    except Exception as e:
        db.session.rollback()
        return error_response('CREATE_ERROR', str(e), 500)


@protocolo_bp.route('/<protocolo_id>', methods=['PUT'])
@jwt_required()
@require_permission('protocolos.editar')
def update_protocolo(protocolo_id):
    """Actualizar un protocolo"""
    try:
        protocolo = Protocolo.query.get(protocolo_id)
        
        if not protocolo or not protocolo.activo:
            return error_response('NOT_FOUND', 'Protocolo no encontrado', 404)
        
        data = request.form.to_dict()
        file = request.files.get('documento')
        
        # Actualizar campos
        if data.get('nombre'):
            protocolo.nombre = data.get('nombre')
        if 'descripcion' in data:
            protocolo.descripcion = data.get('descripcion')
        if 'responsable' in data:
            protocolo.responsable = data.get('responsable')
        if 'area' in data:
            protocolo.area = data.get('area')
        if data.get('fecha_validez'):
            protocolo.fecha_validez = datetime.fromisoformat(data.get('fecha_validez'))
        if 'clasificacion' in data:
            protocolo.clasificacion = data.get('clasificacion')
        if 'autor' in data:
            protocolo.autor = data.get('autor')
        if 'aprobado_por' in data:
            protocolo.aprobado_por = data.get('aprobado_por')
        if 'tipo' in data:
            protocolo.tipo = data.get('tipo')
        
        # Manejar nuevo archivo
        if file:
            validation_error = validate_file_upload(file, ALLOWED_EXTENSIONS, max_size=10*1024*1024)
            if validation_error:
                return error_response('FILE_ERROR', validation_error, 400)
            
            # Eliminar archivo anterior si existe
            if protocolo.documento_path and os.path.exists(protocolo.documento_path):
                os.remove(protocolo.documento_path)
            
            filename = secure_filename(file.filename)
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{filename}"
            filepath = os.path.join('uploads', 'protocolos', filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            file.save(filepath)
            protocolo.documento_path = filepath
        
        db.session.commit()
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='ACTUALIZAR_PROTOCOLO',
            modulo='PROTOCOLOS',
            detalles={'protocolo_id': protocolo_id, 'nombre': protocolo.nombre}
        )
        
        return success_response(protocolo.to_dict(), 'Protocolo actualizado exitosamente')
    
    except Exception as e:
        db.session.rollback()
        return error_response('UPDATE_ERROR', str(e), 500)


@protocolo_bp.route('/<protocolo_id>', methods=['DELETE'])
@jwt_required()
@require_permission('protocolos.eliminar')
def delete_protocolo(protocolo_id):
    """Eliminar (desactivar) un protocolo"""
    try:
        protocolo = Protocolo.query.get(protocolo_id)
        
        if not protocolo or not protocolo.activo:
            return error_response('NOT_FOUND', 'Protocolo no encontrado', 404)
        
        protocolo.activo = False
        db.session.commit()
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='ELIMINAR_PROTOCOLO',
            modulo='PROTOCOLOS',
            detalles={'protocolo_id': protocolo_id, 'nombre': protocolo.nombre}
        )
        
        return success_response(message='Protocolo eliminado exitosamente')
    
    except Exception as e:
        db.session.rollback()
        return error_response('DELETE_ERROR', str(e), 500)


@protocolo_bp.route('/<protocolo_id>/download', methods=['GET'])
@jwt_required()
def download_protocolo(protocolo_id):
    """Descargar documento de protocolo"""
    try:
        protocolo = Protocolo.query.get(protocolo_id)
        
        if not protocolo or not protocolo.activo:
            return error_response('NOT_FOUND', 'Protocolo no encontrado', 404)
        
        if not protocolo.documento_path or not os.path.exists(protocolo.documento_path):
            return error_response('FILE_ERROR', 'Documento no disponible', 404)
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='DESCARGAR_PROTOCOLO',
            modulo='PROTOCOLOS',
            detalles={'protocolo_id': protocolo_id, 'nombre': protocolo.nombre}
        )
        
        return send_file(protocolo.documento_path, as_attachment=True)
    
    except Exception as e:
        return error_response('DOWNLOAD_ERROR', str(e), 500)