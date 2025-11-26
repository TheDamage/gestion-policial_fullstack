import uuid
from datetime import datetime
from app.extensions import db


class Protocolo(db.Model):
    __tablename__ = 'protocolos'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = db.Column(db.String(200), nullable=False, index=True)
    descripcion = db.Column(db.Text)
    responsable = db.Column(db.String(100))
    area = db.Column(db.String(100), index=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    fecha_validez = db.Column(db.DateTime)
    clasificacion = db.Column(db.String(50))  # Público, Interno, Confidencial, Restringido
    autor = db.Column(db.String(100))
    aprobado_por = db.Column(db.String(100))
    documento_path = db.Column(db.String(255))
    tipo = db.Column(db.String(20), nullable=False, default='resumido')  # resumido o completo
    activo = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'responsable': self.responsable,
            'area': self.area,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_validez': self.fecha_validez.isoformat() if self.fecha_validez else None,
            'clasificacion': self.clasificacion,
            'autor': self.autor,
            'aprobado_por': self.aprobado_por,
            'documento_path': self.documento_path,
            'tipo': self.tipo,
            'activo': self.activo,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Protocolo {self.nombre}>'


class Capacitacion(db.Model):
    __tablename__ = 'capacitaciones'
    
    # Campos existentes
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = db.Column(db.String(200), nullable=False, index=True)
    detalle = db.Column(db.Text)
    fecha = db.Column(db.DateTime, nullable=False)
    area = db.Column(db.String(100), index=True)
    modalidad = db.Column(db.String(50))  # Presencial, Virtual, Híbrida
    es_obligatorio = db.Column(db.Boolean, default=False)
    fecha_caducidad = db.Column(db.DateTime)
    activo = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # NUEVOS CAMPOS NECESARIOS
    descripcion_completa = db.Column(db.Text)
    hora_inicio = db.Column(db.Time)
    hora_fin = db.Column(db.Time)
    nivel_jerarquico = db.Column(db.String(100))  # Oficial Superior, Subalterno, etc.
    tipo_formacion = db.Column(db.String(50), default='curso_regular')  # ciberseguridad, academia_mensual, etc.
    instructor = db.Column(db.String(255))
    ubicacion = db.Column(db.String(255))
    capacidad_maxima = db.Column(db.Integer)
    costo = db.Column(db.Numeric(10, 2))
    horas_academicas = db.Column(db.Numeric(4, 1))
    creditos = db.Column(db.Numeric(4, 1))
    certificacion = db.Column(db.Boolean, default=False)
    objetivos = db.Column(db.Text)
    metodologia = db.Column(db.Text)
    evaluacion = db.Column(db.Text)
    requisitos_previos = db.Column(db.Text)
    material_requerido = db.Column(db.Text)
    observaciones = db.Column(db.Text)
    puestos_objetivo = db.Column(db.Text)  # JSON string con puestos específicos
    
    # Relación con participantes
    participantes = db.relationship('ParticipanteCapacitacion', backref='capacitacion', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_participantes=False):
        data = {
            'id': self.id,
            'nombre': self.nombre,
            'detalle': self.detalle,
            'descripcion_completa': self.descripcion_completa,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'hora_inicio': self.hora_inicio.strftime('%H:%M') if self.hora_inicio else None,
            'hora_fin': self.hora_fin.strftime('%H:%M') if self.hora_fin else None,
            'area': self.area,
            'modalidad': self.modalidad,
            'es_obligatorio': self.es_obligatorio,
            'fecha_caducidad': self.fecha_caducidad.isoformat() if self.fecha_caducidad else None,
            'nivel_jerarquico': self.nivel_jerarquico,
            'tipo_formacion': self.tipo_formacion,
            'instructor': self.instructor,
            'ubicacion': self.ubicacion,
            'capacidad_maxima': self.capacidad_maxima,
            'costo': float(self.costo) if self.costo else None,
            'horas_academicas': float(self.horas_academicas) if self.horas_academicas else None,
            'creditos': float(self.creditos) if self.creditos else None,
            'certificacion': self.certificacion,
            'objetivos': self.objetivos,
            'metodologia': self.metodologia,
            'evaluacion': self.evaluacion,
            'requisitos_previos': self.requisitos_previos,
            'material_requerido': self.material_requerido,
            'observaciones': self.observaciones,
            'puestos_objetivo': self.puestos_objetivo,
            'activo': self.activo,
            'total_participantes': self.participantes.count(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_participantes:
            data['participantes'] = [p.to_dict() for p in self.participantes]
            # Agregar estadísticas de participantes
            data['participantes_asistieron'] = self.participantes.filter_by(asistio=True).count()
            data['participantes_aprobados'] = self.participantes.filter_by(aprobado=True).count()
        
        return data
    
    def __repr__(self):
        return f'<Capacitacion {self.nombre}>'

class ParticipanteCapacitacion(db.Model):
    __tablename__ = 'participantes_capacitacion'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    capacitacion_id = db.Column(db.String(36), db.ForeignKey('capacitaciones.id'), nullable=False)
    personal_id = db.Column(db.String(36), db.ForeignKey('personal.id'), nullable=False)
    fecha_inscripcion = db.Column(db.DateTime, default=datetime.utcnow)
    asistio = db.Column(db.Boolean, default=False)
    aprobado = db.Column(db.Boolean, default=False)
    firma_path = db.Column(db.String(255))
    observaciones = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relación con Personal
    personal = db.relationship('Personal', backref='capacitaciones_realizadas')
    
    def to_dict(self):
        return {
            'id': self.id,
            'capacitacion_id': self.capacitacion_id,
            'personal_id': self.personal_id,
            'personal': self.personal.to_dict() if self.personal else None,
            'fecha_inscripcion': self.fecha_inscripcion.isoformat() if self.fecha_inscripcion else None,
            'asistio': self.asistio,
            'aprobado': self.aprobado,
            'firma_path': self.firma_path,
            'observaciones': self.observaciones,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<ParticipanteCapacitacion {self.personal_id} - {self.capacitacion_id}>'