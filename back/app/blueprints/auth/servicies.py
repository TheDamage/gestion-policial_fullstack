from app.models.user import User
from app.extensions import db


class AuthService:
    """Servicios de autenticación"""
    
    @staticmethod
    def create_user(legajo, nombre, apellido, email, password, **kwargs):
        """Crea un nuevo usuario"""
        user = User(
            legajo=legajo,
            nombre=nombre,
            apellido=apellido,
            email=email,
            **kwargs
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return user
    
    @staticmethod
    def get_user_by_legajo(legajo):
        """Obtiene usuario por legajo"""
        return User.query.filter_by(legajo=legajo).first()
    
    @staticmethod
    def get_user_by_email(email):
        """Obtiene usuario por email"""
        return User.query.filter_by(email=email).first()