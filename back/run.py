import os
from app import create_app
from app.extensions import db

app = create_app()

@app.shell_context_processor
def make_shell_context():
    """Hace disponibles modelos en Flask shell"""
    from app.models import (
        User, Role, AuditLog, Personal, Dependencia, 
        Organigrama, ConsultaVehicular, ActaCarInfo
    )
    return {
        'db': db,
        'User': User,
        'Role': Role,
        'AuditLog': AuditLog,
        'Personal': Personal,
        'Dependencia': Dependencia,
        'Organigrama': Organigrama,
        'ConsultaVehicular': ConsultaVehicular,
        'ActaCarInfo': ActaCarInfo
    }

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5002)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )