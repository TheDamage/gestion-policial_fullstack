# app/models/user.py

import uuid
from datetime import datetime
from app.extensions import db


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    nombre = db.Column(db.String(100))
    apellido = db.Column(db.String(100))
    legajo = db.Column(db.String(50))
    rango = db.Column(db.String(50))
    area = db.Column(db.String(100))
    personal_id = db.Column(db.String(36), db.ForeignKey('personal.id'))
    role_id = db.Column(db.String(36), db.ForeignKey('roles.id'))
    activo = db.Column(db.Boolean, default=True, nullable=False)
    email_verified = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    failed_login_attempts = db.Column(db.Integer, default=0)
    account_locked_until = db.Column(db.DateTime)
    password_changed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    role = db.relationship('Role', backref='users')
    personal = db.relationship('Personal', backref='user', foreign_keys=[personal_id])
    
    def has_permission(self, permission_name):
        """Verificar si el usuario tiene un permiso específico"""
        if not self.role:
            return False
        
        # Si el usuario es admin, tiene todos los permisos
        if self.role.name in ['admin', 'superadmin']:
            return True
        
        return any(p.name == permission_name for p in self.role.permissions)
    
    def has_role(self, role_name):
        """Verificar si el usuario tiene un rol específico"""
        if not self.role:
            return False
        return self.role.name == role_name
    
    def is_admin(self):
        """Verificar si el usuario es administrador"""
        return self.has_role('admin') or self.has_role('superadmin')
    
    def get_permissions_list(self):
        """Obtener lista de nombres de permisos del usuario"""
        if not self.role:
            return []
        
        # Si es admin, retornar indicador de todos los permisos
        if self.role.name in ['admin', 'superadmin']:
            return ['*']  # Asterisco indica todos los permisos
        
        return [p.name for p in self.role.permissions]
    
    def to_dict(self, include_permissions=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'nombre': self.nombre,
            'apellido': self.apellido,
            'legajo': self.legajo,
            'rango': self.rango,
            'area': self.area,
            'personal_id': self.personal_id,
            'activo': self.activo,
            'email_verified': self.email_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat()
        }
        
        if self.role:
            data['role'] = {
                'id': self.role.id,
                'name': self.role.name,
                'description': self.role.description
            }
            
            if include_permissions:
                # Usar el método get_permissions_list
                data['permissions'] = self.get_permissions_list()
        
        return data
    
    def __repr__(self):
        return f'<User {self.username}>'


class RefreshToken(db.Model):
    __tablename__ = 'refresh_tokens'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token = db.Column(db.String(500), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    revoked = db.Column(db.Boolean, default=False)
    
    user = db.relationship('User', backref='refresh_tokens')
    
    def __repr__(self):
        return f'<RefreshToken {self.id}>'


class Sesion(db.Model):
    __tablename__ = 'sesiones'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    token_jti = db.Column(db.String(255))
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='sesiones')
    
    def __repr__(self):
        return f'<Sesion {self.id}>'