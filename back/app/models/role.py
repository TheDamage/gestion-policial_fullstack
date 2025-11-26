import uuid
from datetime import datetime
from app.extensions import db


# Tabla intermedia para la relación many-to-many entre roles y permisos
role_permissions = db.Table('role_permissions',
    db.Column('role_id', db.String(36), db.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    db.Column('permission_id', db.String(36), db.ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True)
)


class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación many-to-many con Permission
    permissions = db.relationship('Permission', secondary=role_permissions, backref='roles')
    
    def to_dict(self, include_permissions=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat()
        }
        
        if include_permissions:
            data['permissions'] = [p.to_dict() for p in self.permissions]
        
        return data
    
    def __repr__(self):
        return f'<Role {self.name}>'


class Permission(db.Model):
    __tablename__ = 'permissions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Permission {self.name}>'