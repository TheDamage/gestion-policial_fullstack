import uuid
from datetime import datetime
from app.extensions import db


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    accion = db.Column(db.String(100), nullable=False, index=True)
    modulo = db.Column(db.String(50), nullable=False, index=True)
    detalles = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    gps_lat = db.Column(db.Float)
    gps_lon = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relación con User
    user = db.relationship('User', backref=db.backref('audit_logs', lazy='dynamic'))
    
    @staticmethod
    def log(user_id, accion, modulo, detalles=None, ip_address=None, 
            user_agent=None, gps_lat=None, gps_lon=None):
        """Crea un log de auditoría"""
        log = AuditLog(
            user_id=user_id,
            accion=accion,
            modulo=modulo,
            detalles=detalles or {},
            ip_address=ip_address,
            user_agent=user_agent,
            gps_lat=gps_lat,
            gps_lon=gps_lon
        )
        db.session.add(log)
        db.session.commit()
        return log
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'accion': self.accion,
            'modulo': self.modulo,
            'detalles': self.detalles,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'gps_lat': self.gps_lat,
            'gps_lon': self.gps_lon,
            'timestamp': self.timestamp.isoformat()
        }
    
    def __repr__(self):
        return f'<AuditLog {self.accion} - {self.modulo} - {self.timestamp}>'