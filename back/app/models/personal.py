import uuid
from datetime import datetime
from app.extensions import db


class Personal(db.Model):
    __tablename__ = 'personal'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    legajo = db.Column(db.String(50), unique=True, nullable=False, index=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    rango = db.Column(db.String(50), index=True)
    cargo = db.Column(db.String(100))
    area = db.Column(db.String(100), index=True)
    dependencia = db.Column(db.String(100))
    telefono_directo = db.Column(db.String(20))
    email_institucional = db.Column(db.String(120))
    foto_path = db.Column(db.String(255))
    ubicacion_id = db.Column(db.String(36), db.ForeignKey('dependencias.id'))
    superior_directo_id = db.Column(db.String(36), db.ForeignKey('personal.id'))
    activo = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    ubicacion = db.relationship('Dependencia', backref='personal_asignado', foreign_keys=[ubicacion_id])
    superior = db.relationship('Personal', remote_side=[id], backref='subordinados')
    
    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'legajo': self.legajo,
            'nombre': self.nombre,
            'apellido': self.apellido,
            'nombre_completo': f'{self.nombre} {self.apellido}',
            'rango': self.rango,
            'cargo': self.cargo,
            'area': self.area,
            'dependencia': self.dependencia,
            'telefono_directo': self.telefono_directo,
            'email_institucional': self.email_institucional,
            'foto_path': self.foto_path,
            'activo': self.activo
        }
        
        if include_relations:
            data['ubicacion'] = self.ubicacion.to_dict() if self.ubicacion else None
            data['superior'] = self.superior.to_dict() if self.superior else None
            data['subordinados'] = [s.to_dict() for s in self.subordinados]
        
        return data
    
    def __repr__(self):
        return f'<Personal {self.legajo} - {self.nombre} {self.apellido}>'


class Dependencia(db.Model):
    __tablename__ = 'dependencias'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = db.Column(db.String(150), nullable=False, index=True)
    tipo = db.Column(db.String(50), index=True)  # Comisaría, Dirección, Superintendencia, etc
    direccion = db.Column(db.String(255))
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(120))
    gps_lat = db.Column(db.Float)
    gps_lon = db.Column(db.Float)
    horario = db.Column(db.String(100))
    descripcion = db.Column(db.Text)
    
    def to_dict(self, include_personal=False):
        data = {
            'id': self.id,
            'nombre': self.nombre,
            'tipo': self.tipo,
            'direccion': self.direccion,
            'telefono': self.telefono,
            'email': self.email,
            'gps_lat': self.gps_lat,
            'gps_lon': self.gps_lon,
            'horario': self.horario,
            'descripcion': self.descripcion
        }
        
        if include_personal:
            data['personal'] = [p.to_dict() for p in self.personal_asignado]
        
        return data
    
    def __repr__(self):
        return f'<Dependencia {self.nombre}>'


class Organigrama(db.Model):
    __tablename__ = 'organigrama'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    personal_id = db.Column(db.String(36), db.ForeignKey('personal.id'), nullable=False)
    parent_id = db.Column(db.String(36), db.ForeignKey('organigrama.id'))
    nivel = db.Column(db.Integer, nullable=False, default=0)
    orden = db.Column(db.Integer, nullable=False, default=0)
    
    # Relaciones
    personal = db.relationship('Personal', backref='organigrama_node')
    parent = db.relationship('Organigrama', remote_side=[id], backref='children')
    
    def to_dict(self, include_children=False):
        data = {
            'id': self.id,
            'personal_id': self.personal_id,
            'parent_id': self.parent_id,
            'nivel': self.nivel,
            'orden': self.orden,
            'personal': self.personal.to_dict() if self.personal else None
        }
        
        if include_children:
            data['children'] = [c.to_dict(include_children=True) for c in self.children]
        
        return data
    
    def __repr__(self):
        return f'<Organigrama {self.personal_id} - Nivel {self.nivel}>'