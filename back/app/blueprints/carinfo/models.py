import uuid
from datetime import datetime
from app.extensions import db


class ConsultaVehicular(db.Model):
    __tablename__ = 'consultas_vehiculares'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    patente = db.Column(db.String(10), nullable=False, index=True)
    imagen_path = db.Column(db.String(255))
    ocr_confidence = db.Column(db.Float)
    resultado = db.Column(db.JSON)  # Datos del vehículo consultado
    estado_vehiculo = db.Column(db.String(20))  # normal, inhibido, retenido, robado
    accion_tomada = db.Column(db.String(100))
    acta_generada = db.Column(db.Boolean, default=False)
    gps_lat = db.Column(db.Float)
    gps_lon = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relaciones
    user = db.relationship('User', backref=db.backref('consultas_vehiculares', lazy='dynamic'))
    acta = db.relationship('ActaCarInfo', backref='consulta', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self, include_acta=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'patente': self.patente,
            'imagen_path': self.imagen_path,
            'ocr_confidence': self.ocr_confidence,
            'resultado': self.resultado,
            'estado_vehiculo': self.estado_vehiculo,
            'accion_tomada': self.accion_tomada,
            'acta_generada': self.acta_generada,
            'gps_lat': self.gps_lat,
            'gps_lon': self.gps_lon,
            'timestamp': self.timestamp.isoformat()
        }
        
        if include_acta and self.acta:
            data['acta'] = self.acta.to_dict()
        
        return data
    
    def __repr__(self):
        return f'<ConsultaVehicular {self.patente} - {self.estado_vehiculo}>'


class ActaCarInfo(db.Model):
    __tablename__ = 'actas_carinfo'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consulta_id = db.Column(db.String(36), db.ForeignKey('consultas_vehiculares.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    tipo_acta = db.Column(db.String(50), nullable=False)
    contenido = db.Column(db.Text, nullable=False)
    firma_digital = db.Column(db.String(255))
    hash_documento = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relación con User
    user = db.relationship('User', backref=db.backref('actas_carinfo', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'consulta_id': self.consulta_id,
            'user_id': self.user_id,
            'tipo_acta': self.tipo_acta,
            'contenido': self.contenido,
            'firma_digital': self.firma_digital,
            'hash_documento': self.hash_documento,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<ActaCarInfo {self.id} - {self.tipo_acta}>'