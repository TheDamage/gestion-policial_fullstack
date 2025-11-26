from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from datetime import datetime

from app.extensions import db
from app.models import Capacitacion, ParticipanteCapacitacion, Personal, AuditLog
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.validators import validate_file_upload
from app.utils.permissions import require_permission

capacitacion_bp = Blueprint('capacitacion', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}


@capacitacion_bp.route('', methods=['GET'])
@jwt_required()
def get_capacitaciones():
    """Obtener lista de capacitaciones con filtros y paginación"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        area = request.args.get('area')
        modalidad = request.args.get('modalidad')
        es_obligatorio = request.args.get('es_obligatorio')
        search = request.args.get('search')
        
        query = Capacitacion.query.filter_by(activo=True)
        
        if area:
            query = query.filter_by(area=area)
        
        if modalidad:
            query = query.filter_by(modalidad=modalidad)
        
        if es_obligatorio is not None:
            query = query.filter_by(es_obligatorio=es_obligatorio == 'true')
        
        if search:
            query = query.filter(
                db.or_(
                    Capacitacion.nombre.ilike(f'%{search}%'),
                    Capacitacion.detalle.ilike(f'%{search}%')
                )
            )
        
        total = query.count()
        capacitaciones = query.order_by(Capacitacion.fecha.desc()).offset((page - 1) * limit).limit(limit).all()
        
        return paginated_response(
            data=[c.to_dict() for c in capacitaciones],
            page=page,
            limit=limit,
            total=total
        )
    
    except Exception as e:
        return error_response('FETCH_ERROR', str(e), 500)


@capacitacion_bp.route('/<capacitacion_id>', methods=['GET'])
@jwt_required()
def get_capacitacion(capacitacion_id):
    """Obtener una capacitación específica con participantes"""
    try:
        capacitacion = Capacitacion.query.get(capacitacion_id)
        
        if not capacitacion or not capacitacion.activo:
            return error_response('NOT_FOUND', 'Capacitación no encontrada', 404)
        
        return success_response(capacitacion.to_dict(include_participantes=True))
    
    except Exception as e:
        return error_response('FETCH_ERROR', str(e), 500)


@capacitacion_bp.route('', methods=['POST'])
@jwt_required()
@require_permission('capacitaciones.crear')
def create_capacitacion():
    """Crear una nueva capacitación"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data.get('nombre') or not data.get('fecha'):
            return error_response('VALIDATION_ERROR', 'Nombre y fecha son requeridos', 400)
        
        # Parsear horas si existen
        hora_inicio = None
        hora_fin = None
        if data.get('hora_inicio'):
            hora_inicio = datetime.strptime(data.get('hora_inicio'), '%H:%M').time()
        if data.get('hora_fin'):
            hora_fin = datetime.strptime(data.get('hora_fin'), '%H:%M').time()
        
        capacitacion = Capacitacion(
            nombre=data.get('nombre'),
            detalle=data.get('detalle'),
            descripcion_completa=data.get('descripcion_completa'),
            fecha=datetime.fromisoformat(data.get('fecha')),
            hora_inicio=hora_inicio,
            hora_fin=hora_fin,
            area=data.get('area'),
            modalidad=data.get('modalidad'),
            es_obligatorio=data.get('es_obligatorio', False),
            fecha_caducidad=datetime.fromisoformat(data.get('fecha_caducidad')) if data.get('fecha_caducidad') else None,
            nivel_jerarquico=data.get('nivel_jerarquico'),
            tipo_formacion=data.get('tipo_formacion', 'curso_regular'),
            instructor=data.get('instructor'),
            ubicacion=data.get('ubicacion'),
            capacidad_maxima=data.get('capacidad_maxima'),
            costo=data.get('costo'),
            horas_academicas=data.get('horas_academicas'),
            creditos=data.get('creditos'),
            certificacion=data.get('certificacion', False),
            objetivos=data.get('objetivos'),
            metodologia=data.get('metodologia'),
            evaluacion=data.get('evaluacion'),
            requisitos_previos=data.get('requisitos_previos'),
            material_requerido=data.get('material_requerido'),
            observaciones=data.get('observaciones'),
            puestos_objetivo=data.get('puestos_objetivo')
        )
        
        db.session.add(capacitacion)
        db.session.commit()
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='CREAR_CAPACITACION',
            modulo='CAPACITACIONES',
            detalles={'capacitacion_id': capacitacion.id, 'nombre': capacitacion.nombre}
        )
        
        return success_response(capacitacion.to_dict(), 'Capacitación creada exitosamente', 201)
    
    except Exception as e:
        db.session.rollback()
        return error_response('CREATE_ERROR', str(e), 500)

@capacitacion_bp.route('/<capacitacion_id>', methods=['PUT'])
@jwt_required()
@require_permission('capacitaciones.editar')
def update_capacitacion(capacitacion_id):
    """Actualizar una capacitación"""
    try:
        capacitacion = Capacitacion.query.get(capacitacion_id)
        
        if not capacitacion or not capacitacion.activo:
            return error_response('NOT_FOUND', 'Capacitación no encontrada', 404)
        
        data = request.get_json()
        
        if data.get('nombre'):
            capacitacion.nombre = data.get('nombre')
        if 'detalle' in data:
            capacitacion.detalle = data.get('detalle')
        if data.get('fecha'):
            capacitacion.fecha = datetime.fromisoformat(data.get('fecha'))
        if 'area' in data:
            capacitacion.area = data.get('area')
        if 'modalidad' in data:
            capacitacion.modalidad = data.get('modalidad')
        if 'es_obligatorio' in data:
            capacitacion.es_obligatorio = data.get('es_obligatorio')
        if data.get('fecha_caducidad'):
            capacitacion.fecha_caducidad = datetime.fromisoformat(data.get('fecha_caducidad'))
        
        db.session.commit()
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='ACTUALIZAR_CAPACITACION',
            modulo='CAPACITACIONES',
            detalles={'capacitacion_id': capacitacion_id, 'nombre': capacitacion.nombre}
        )
        
        return success_response(capacitacion.to_dict(), 'Capacitación actualizada exitosamente')
    
    except Exception as e:
        db.session.rollback()
        return error_response('UPDATE_ERROR', str(e), 500)


@capacitacion_bp.route('/<capacitacion_id>', methods=['DELETE'])
@jwt_required()
@require_permission('capacitaciones.eliminar')
def delete_capacitacion(capacitacion_id):
    """Eliminar (desactivar) una capacitación"""
    try:
        capacitacion = Capacitacion.query.get(capacitacion_id)
        
        if not capacitacion or not capacitacion.activo:
            return error_response('NOT_FOUND', 'Capacitación no encontrada', 404)
        
        capacitacion.activo = False
        db.session.commit()
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='ELIMINAR_CAPACITACION',
            modulo='CAPACITACIONES',
            detalles={'capacitacion_id': capacitacion_id, 'nombre': capacitacion.nombre}
        )
        
        return success_response(message='Capacitación eliminada exitosamente')
    
    except Exception as e:
        db.session.rollback()
        return error_response('DELETE_ERROR', str(e), 500)


@capacitacion_bp.route('/<capacitacion_id>/participantes', methods=['POST'])
@jwt_required()
@require_permission('capacitaciones.gestionar_participantes')
def add_participante(capacitacion_id):
    """Agregar participante a una capacitación"""
    try:
        capacitacion = Capacitacion.query.get(capacitacion_id)
        
        if not capacitacion or not capacitacion.activo:
            return error_response('NOT_FOUND', 'Capacitación no encontrada', 404)
        
        data = request.get_json()
        personal_id = data.get('personal_id')
        
        if not personal_id:
            return error_response('VALIDATION_ERROR', 'personal_id es requerido', 400)
        
        # Verificar que el personal existe
        personal = Personal.query.get(personal_id)
        if not personal or not personal.activo:
            return error_response('NOT_FOUND', 'Personal no encontrado', 404)
        
        # Verificar que no esté ya inscrito
        participante_existente = ParticipanteCapacitacion.query.filter_by(
            capacitacion_id=capacitacion_id,
            personal_id=personal_id
        ).first()
        
        if participante_existente:
            return error_response('DUPLICATE', 'El participante ya está inscrito', 400)
        
        participante = ParticipanteCapacitacion(
            capacitacion_id=capacitacion_id,
            personal_id=personal_id,
            observaciones=data.get('observaciones')
        )
        
        db.session.add(participante)
        db.session.commit()
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='AGREGAR_PARTICIPANTE',
            modulo='CAPACITACIONES',
            detalles={
                'capacitacion_id': capacitacion_id,
                'personal_id': personal_id,
                'personal_nombre': f'{personal.nombre} {personal.apellido}'
            }
        )
        
        return success_response(participante.to_dict(), 'Participante agregado exitosamente', 201)
    
    except Exception as e:
        db.session.rollback()
        return error_response('CREATE_ERROR', str(e), 500)


@capacitacion_bp.route('/<capacitacion_id>/participantes/<participante_id>', methods=['PUT'])
@jwt_required()
@require_permission('capacitaciones.gestionar_participantes')
def update_participante(capacitacion_id, participante_id):
    """Actualizar información de un participante"""
    try:
        participante = ParticipanteCapacitacion.query.filter_by(
            id=participante_id,
            capacitacion_id=capacitacion_id
        ).first()
        
        if not participante:
            return error_response('NOT_FOUND', 'Participante no encontrado', 404)
        
        data = request.form.to_dict()
        file = request.files.get('firma')
        
        if 'asistio' in data:
            participante.asistio = data.get('asistio') == 'true'
        if 'aprobado' in data:
            participante.aprobado = data.get('aprobado') == 'true'
        if 'observaciones' in data:
            participante.observaciones = data.get('observaciones')
        
        # Manejar archivo de firma
        if file:
            validation_error = validate_file_upload(file, ALLOWED_EXTENSIONS, max_size=2*1024*1024)
            if validation_error:
                return error_response('FILE_ERROR', validation_error, 400)
            
            # Eliminar firma anterior si existe
            if participante.firma_path and os.path.exists(participante.firma_path):
                os.remove(participante.firma_path)
            
            filename = secure_filename(file.filename)
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{participante.personal_id}_{filename}"
            filepath = os.path.join('uploads', 'firmas', filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            file.save(filepath)
            participante.firma_path = filepath
        
        db.session.commit()
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='ACTUALIZAR_PARTICIPANTE',
            modulo='CAPACITACIONES',
            detalles={
                'capacitacion_id': capacitacion_id,
                'participante_id': participante_id,
                'personal_id': participante.personal_id
            }
        )
        
        return success_response(participante.to_dict(), 'Participante actualizado exitosamente')
    
    except Exception as e:
        db.session.rollback()
        return error_response('UPDATE_ERROR', str(e), 500)


@capacitacion_bp.route('/<capacitacion_id>/participantes/<participante_id>', methods=['DELETE'])
@jwt_required()
@require_permission('capacitaciones.gestionar_participantes')
def delete_participante(capacitacion_id, participante_id):
    """Eliminar participante de una capacitación"""
    try:
        participante = ParticipanteCapacitacion.query.filter_by(
            id=participante_id,
            capacitacion_id=capacitacion_id
        ).first()
        
        if not participante:
            return error_response('NOT_FOUND', 'Participante no encontrado', 404)
        
        # Eliminar firma si existe
        if participante.firma_path and os.path.exists(participante.firma_path):
            os.remove(participante.firma_path)
        
        db.session.delete(participante)
        db.session.commit()
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='ELIMINAR_PARTICIPANTE',
            modulo='CAPACITACIONES',
            detalles={
                'capacitacion_id': capacitacion_id,
                'participante_id': participante_id,
                'personal_id': participante.personal_id
            }
        )
        
        return success_response(message='Participante eliminado exitosamente')
    
    except Exception as e:
        db.session.rollback()
        return error_response('DELETE_ERROR', str(e), 500)


@capacitacion_bp.route('/personal/<personal_id>', methods=['GET'])
@jwt_required()
def get_capacitaciones_personal(personal_id):
    """Obtener capacitaciones de un personal específico"""
    try:
        personal = Personal.query.get(personal_id)
        
        if not personal or not personal.activo:
            return error_response('NOT_FOUND', 'Personal no encontrado', 404)
        
        participaciones = ParticipanteCapacitacion.query.filter_by(
            personal_id=personal_id
        ).join(Capacitacion).filter(Capacitacion.activo == True).all()
        
        return success_response([p.to_dict() for p in participaciones])
    
    except Exception as e:
        return error_response('FETCH_ERROR', str(e), 500)

@capacitacion_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Obtener estadísticas para el dashboard"""
    try:
        periodo = request.args.get('periodo', 'mes')
        
        # Calcular fechas según período
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        if periodo == 'mes':
            fecha_inicio = now - timedelta(days=30)
        elif periodo == 'trimestre':
            fecha_inicio = now - timedelta(days=90)
        else:  # año
            fecha_inicio = now - timedelta(days=365)
        
        # Estadísticas principales
        total_capacitaciones = Capacitacion.query.filter_by(activo=True).count()
        
        # Capacitaciones por estado
        proximas = Capacitacion.query.filter(
            Capacitacion.activo == True,
            Capacitacion.fecha > now
        ).count()
        
        completadas = Capacitacion.query.filter(
            Capacitacion.activo == True,
            Capacitacion.fecha <= now
        ).count()
        
        caducadas = Capacitacion.query.filter(
            Capacitacion.activo == True,
            Capacitacion.fecha_caducidad < now
        ).count()
        
        # Participantes activos
        participantes_activos = db.session.query(
            ParticipanteCapacitacion.personal_id
        ).distinct().count()
        
        # Tasas de asistencia y aprobación
        total_participaciones = ParticipanteCapacitacion.query.count()
        asistencias = ParticipanteCapacitacion.query.filter_by(asistio=True).count()
        aprobaciones = ParticipanteCapacitacion.query.filter_by(aprobado=True).count()
        
        tasa_asistencia = round((asistencias / total_participaciones) * 100) if total_participaciones > 0 else 0
        tasa_aprobacion = round((aprobaciones / total_participaciones) * 100) if total_participaciones > 0 else 0
        
        # Capacitaciones por tipo
        por_tipo = db.session.query(
            Capacitacion.tipo_formacion,
            db.func.count(Capacitacion.id).label('cantidad')
        ).filter_by(activo=True).group_by(Capacitacion.tipo_formacion).all()
        
        return success_response({
            'total_capacitaciones': total_capacitaciones,
            'participantes_activos': participantes_activos,
            'tasa_asistencia': tasa_asistencia,
            'tasa_aprobacion': tasa_aprobacion,
            'proximas': proximas,
            'completadas': completadas,
            'caducadas': caducadas,
            'por_tipo': [{'tipo_formacion': t[0], 'cantidad': t[1]} for t in por_tipo]
        })
    except Exception as e:
        return error_response('STATS_ERROR', str(e), 500)

@capacitacion_bp.route('/search', methods=['GET'])
@jwt_required()
def search_intelligent():
    """Búsqueda inteligente por conceptos"""
    try:
        query = request.args.get('q', '')
        include_personal = request.args.get('include_personal', 'false') == 'true'
        include_concepts = request.args.get('include_concepts', 'false') == 'true'
        
        results = {
            'capacitaciones': [],
            'personal': [],
            'conceptos': []
        }
        
        if len(query) < 3:
            return success_response(results)
        
        # Buscar capacitaciones
        capacitaciones = Capacitacion.query.filter(
            Capacitacion.activo == True,
            db.or_(
                Capacitacion.nombre.ilike(f'%{query}%'),
                Capacitacion.detalle.ilike(f'%{query}%'),
                Capacitacion.area.ilike(f'%{query}%'),
                Capacitacion.tipo_formacion.ilike(f'%{query}%')
            )
        ).limit(10).all()
        
        results['capacitaciones'] = [c.to_dict() for c in capacitaciones]
        
        # Buscar personal si se solicita
        if include_personal:
            from app.models import Personal
            personal = Personal.query.filter(
                Personal.activo == True,
                db.or_(
                    Personal.nombre.ilike(f'%{query}%'),
                    Personal.apellido.ilike(f'%{query}%'),
                    Personal.legajo.ilike(f'%{query}%'),
                    Personal.area.ilike(f'%{query}%')
                )
            ).limit(5).all()
            
            results['personal'] = [p.to_dict() for p in personal]
        
        # Conceptos relacionados si se solicita
        if include_concepts:
            # Buscar términos similares en base a palabras existentes
            conceptos_query = db.session.query(
                Capacitacion.tipo_formacion.label('term'),
                db.func.count().label('count')
            ).filter(
                Capacitacion.activo == True,
                Capacitacion.tipo_formacion.ilike(f'%{query}%')
            ).group_by(Capacitacion.tipo_formacion).all()
            
            results['conceptos'] = [{'term': c.term, 'count': c.count} for c in conceptos_query]
        
        return success_response(results)
    except Exception as e:
        return error_response('SEARCH_ERROR', str(e), 500)

@capacitacion_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_suggestions():
    """Obtener sugerencias populares para búsqueda"""
    try:
        # Términos más frecuentes
        suggestions = db.session.query(
            Capacitacion.tipo_formacion.label('term'),
            db.func.count().label('count')
        ).filter_by(activo=True).group_by(
            Capacitacion.tipo_formacion
        ).order_by(db.desc('count')).limit(8).all()
        
        return success_response([{'term': s.term, 'count': s.count} for s in suggestions])
    except Exception as e:
        return error_response('SUGGESTIONS_ERROR', str(e), 500)

@capacitacion_bp.route('/<capacitacion_id>/asignacion-masiva', methods=['POST'])
@jwt_required()
@require_permission('capacitaciones.asignar')
def asignacion_masiva(capacitacion_id):
    """Asignación masiva de personal a capacitación"""
    try:
        capacitacion = Capacitacion.query.get(capacitacion_id)
        if not capacitacion or not capacitacion.activo:
            return error_response('NOT_FOUND', 'Capacitación no encontrada', 404)
        
        data = request.get_json()
        personal_ids = data.get('personal_ids', [])
        
        if not personal_ids:
            return error_response('VALIDATION_ERROR', 'Debe seleccionar al menos un personal', 400)
        
        # Verificar que no estén ya inscritos
        ya_inscritos = ParticipanteCapacitacion.query.filter(
            ParticipanteCapacitacion.capacitacion_id == capacitacion_id,
            ParticipanteCapacitacion.personal_id.in_(personal_ids)
        ).all()
        
        ids_ya_inscritos = [p.personal_id for p in ya_inscritos]
        ids_nuevos = [pid for pid in personal_ids if pid not in ids_ya_inscritos]
        
        # Agregar nuevos participantes
        for personal_id in ids_nuevos:
            participante = ParticipanteCapacitacion(
                capacitacion_id=capacitacion_id,
                personal_id=personal_id
            )
            db.session.add(participante)
        
        db.session.commit()
        
        # Registrar auditoría
        user_id = get_jwt_identity()
        AuditLog.log(
            user_id=user_id,
            accion='ASIGNACION_MASIVA',
            modulo='CAPACITACIONES',
            detalles={
                'capacitacion_id': capacitacion_id,
                'personal_agregado': len(ids_nuevos),
                'ya_inscritos': len(ids_ya_inscritos)
            }
        )
        
        return success_response({
            'agregados': len(ids_nuevos),
            'ya_inscritos': len(ids_ya_inscritos),
            'total_intentos': len(personal_ids)
        }, f'Se agregaron {len(ids_nuevos)} participantes exitosamente')
        
    except Exception as e:
        db.session.rollback()
        return error_response('ASIGNACION_ERROR', str(e), 500)

@capacitacion_bp.route('/<capacitacion_id>/participantes/bulk', methods=['POST'])
@jwt_required()
@require_permission('capacitaciones.gestionar_participantes')  
def bulk_add_participantes(capacitacion_id):
    """Agregar múltiples participantes"""
    try:
        capacitacion = Capacitacion.query.get(capacitacion_id)
        if not capacitacion or not capacitacion.activo:
            return error_response('NOT_FOUND', 'Capacitación no encontrada', 404)
        
        data = request.get_json()
        personal_ids = data.get('personal_ids', [])
        
        if not personal_ids:
            return error_response('VALIDATION_ERROR', 'Debe seleccionar al menos un personal', 400)
        
        # Convertir IDs a string si vienen como números
        personal_ids = [str(pid) for pid in personal_ids]
        
        # Verificar que el personal existe
        from app.models import Personal  # Ajustar el import según tu estructura
        personal_existente = Personal.query.filter(Personal.id.in_(personal_ids)).all()
        personal_existente_ids = [p.id for p in personal_existente]
        
        # Verificar personal que no existe
        personal_no_existe = [pid for pid in personal_ids if pid not in personal_existente_ids]
        if personal_no_existe:
            return error_response('VALIDATION_ERROR', 
                f'Personal no encontrado: {", ".join(personal_no_existe)}', 400)
        
        # Verificar que no estén ya inscritos
        ya_inscritos = ParticipanteCapacitacion.query.filter(
            ParticipanteCapacitacion.capacitacion_id == capacitacion_id,
            ParticipanteCapacitacion.personal_id.in_(personal_ids)
        ).all()
        
        ids_ya_inscritos = [p.personal_id for p in ya_inscritos]
        ids_nuevos = [pid for pid in personal_ids if pid not in ids_ya_inscritos]
        
        # Agregar nuevos participantes
        participantes_nuevos = []
        for personal_id in ids_nuevos:
            participante = ParticipanteCapacitacion(
                capacitacion_id=capacitacion_id,
                personal_id=personal_id
            )
            db.session.add(participante)
            participantes_nuevos.append(participante)
        
        # Commit la inserción antes de la auditoría
        db.session.commit()
        
        # Registrar auditoría DESPUÉS del commit
        try:
            user_id = get_jwt_identity()
            AuditLog.log(
                user_id=user_id,
                accion='ASIGNACION_MASIVA',
                modulo='CAPACITACIONES',
                detalles={
                    'capacitacion_id': capacitacion_id,
                    'personal_agregado': len(ids_nuevos),
                    'ya_inscritos': len(ids_ya_inscritos),
                    'personal_ids': ids_nuevos
                }
            )
            db.session.commit()
        except Exception as audit_error:
            # Si falla la auditoría, solo loggear pero no fallar la operación
            print(f"Error en auditoría: {audit_error}")
        
        return success_response({
            'agregados': len(ids_nuevos),
            'ya_inscritos': len(ids_ya_inscritos),
            'total_intentos': len(personal_ids),
            'personal_no_encontrado': personal_no_existe
        }, f'Se agregaron {len(ids_nuevos)} participantes exitosamente')
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en bulk_add_participantes: {str(e)}")
        return error_response('ASIGNACION_ERROR', f'Error en la asignación masiva: {str(e)}', 500)

@capacitacion_bp.route('/<capacitacion_id>/participantes/bulk', methods=['PUT'])
@jwt_required()
@require_permission('capacitaciones.gestionar_participantes')
def bulk_update_participantes(capacitacion_id):
    """Actualización masiva de participantes"""
    try:
        data = request.get_json()
        participante_ids = data.get('participante_ids', [])
        updates = data.get('updates', {})
        
        if not participante_ids or not updates:
            return error_response('VALIDATION_ERROR', 'Datos insuficientes', 400)
        
        # Actualizar participantes
        query = ParticipanteCapacitacion.query.filter(
            ParticipanteCapacitacion.capacitacion_id == capacitacion_id,
            ParticipanteCapacitacion.id.in_(participante_ids)
        )
        
        updated_count = query.update(updates)
        db.session.commit()
        
        return success_response({
            'updated_count': updated_count
        }, f'Se actualizaron {updated_count} participantes')
        
    except Exception as e:
        db.session.rollback()
        return error_response('BULK_UPDATE_ERROR', str(e), 500)

@capacitacion_bp.route('/export', methods=['GET'])
@jwt_required()
@require_permission('capacitaciones.exportar')
def export_capacitaciones():
    """Exportar capacitaciones en diferentes formatos"""
    try:
        formato = request.args.get('formato', 'excel')  # excel, pdf, csv
        
        # Aplicar mismo filtrado que en get_capacitaciones
        query = Capacitacion.query.filter_by(activo=True)
        
        # Aplicar filtros si existen
        area = request.args.get('area')
        modalidad = request.args.get('modalidad')
        # ... más filtros
        
        if area:
            query = query.filter_by(area=area)
        if modalidad:
            query = query.filter_by(modalidad=modalidad)
            
        capacitaciones = query.all()
        
        if formato == 'excel':
            return export_to_excel(capacitaciones)
        elif formato == 'pdf':
            return export_to_pdf(capacitaciones)
        elif formato == 'csv':
            return export_to_csv(capacitaciones)
        else:
            return error_response('FORMAT_ERROR', 'Formato no soportado', 400)
            
    except Exception as e:
        return error_response('EXPORT_ERROR', str(e), 500)

def export_to_excel(capacitaciones):
    """Generar archivo Excel"""
    import pandas as pd
    from io import BytesIO
    
    # Convertir a DataFrame
    data = []
    for c in capacitaciones:
        row = {
            'ID': c.id,
            'Nombre': c.nombre,
            'Fecha': c.fecha,
            'Modalidad': c.modalidad,
            'Área': c.area,
            'Obligatorio': 'Sí' if c.es_obligatorio else 'No',
            'Participantes': len(c.participantes) if c.participantes else 0
        }
        data.append(row)
    
    df = pd.DataFrame(data)
    
    # Crear archivo Excel en memoria
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Capacitaciones', index=False)
    
    output.seek(0)
    
    return send_file(
        output,
        as_attachment=True,
        download_name=f'capacitaciones_{datetime.now().strftime("%Y%m%d")}.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@capacitacion_bp.route('/alertas', methods=['GET'])
@jwt_required()
def get_alertas():
    """Obtener alertas importantes"""
    try:
        alertas = []
        now = datetime.utcnow()
        
        # Capacitaciones próximas a caducar (30 días)
        proximas_caducar = Capacitacion.query.filter(
            Capacitacion.activo == True,
            Capacitacion.fecha_caducidad.between(now, now + timedelta(days=30))
        ).count()
        
        if proximas_caducar > 0:
            alertas.append({
                'titulo': f'{proximas_caducar} capacitaciones próximas a caducar',
                'descripcion': 'Requieren renovación en los próximos 30 días',
                'fecha': now.strftime('%Y-%m-%d'),
                'tipo': 'warning'
            })
        
        # Capacitaciones con baja asistencia
        # ... más lógica de alertas
        
        return success_response(alertas)
    except Exception as e:
        return error_response('ALERTAS_ERROR', str(e), 500)

@capacitacion_bp.route('/tendencias', methods=['GET'])
@jwt_required()
def get_tendencias():
    """Obtener tendencias de participación"""
    try:
        periodo = request.args.get('periodo', 'mes')
        
        # Lógica para calcular tendencias por período
        # ... implementar según necesidades
        
        return success_response([])
    except Exception as e:
        return error_response('TENDENCIAS_ERROR', str(e), 500)