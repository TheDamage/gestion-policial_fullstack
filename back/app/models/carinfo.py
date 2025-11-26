import uuid
from datetime import datetime
from app.extensions import db


class ConsultaVehicular(db.Model):
    __tablename__ = 'consultas_vehiculares'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    tipo_consulta = db.Column(db.String(20), nullable=False)  # 'dominio' o 'chasis'
    valor_consultado = db.Column(db.String(100), nullable=False)
    resultado = db.Column(db.JSON)
    motivo = db.Column(db.String(255))
    ubicacion = db.Column(db.String(255))
    gps_lat = db.Column(db.Float)
    gps_lon = db.Column(db.Float)
    ip_address = db.Column(db.String(45))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    user = db.relationship('User', backref='consultas_vehiculares')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'tipo_consulta': self.tipo_consulta,
            'valor_consultado': self.valor_consultado,
            'resultado': self.resultado,
            'motivo': self.motivo,
            'ubicacion': self.ubicacion,
            'gps_lat': self.gps_lat,
            'gps_lon': self.gps_lon,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<ConsultaVehicular {self.tipo_consulta} - {self.valor_consultado}>'


class ActaCarInfo(db.Model):
    __tablename__ = 'actas_carinfo'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consulta_id = db.Column(db.String(36), db.ForeignKey('consultas_vehiculares.id'))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    tipo_acta = db.Column(db.String(50), nullable=False)
    numero_acta = db.Column(db.String(100))
    datos_vehiculo = db.Column(db.JSON)
    datos_conductor = db.Column(db.JSON)
    observaciones = db.Column(db.Text)
    foto_path = db.Column(db.String(255))
    ubicacion = db.Column(db.String(255))
    gps_lat = db.Column(db.Float)
    gps_lon = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    consulta = db.relationship('ConsultaVehicular', backref='actas')
    user = db.relationship('User', backref='actas_carinfo')
    
    def to_dict(self):
        return {
            'id': self.id,
            'consulta_id': self.consulta_id,
            'user_id': self.user_id,
            'tipo_acta': self.tipo_acta,
            'numero_acta': self.numero_acta,
            'datos_vehiculo': self.datos_vehiculo,
            'datos_conductor': self.datos_conductor,
            'observaciones': self.observaciones,
            'foto_path': self.foto_path,
            'ubicacion': self.ubicacion,
            'gps_lat': self.gps_lat,
            'gps_lon': self.gps_lon,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<ActaCarInfo {self.tipo_acta} - {self.numero_acta}>'