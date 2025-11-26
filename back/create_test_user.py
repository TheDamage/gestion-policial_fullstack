# scripts/verify_permissions.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role, Permission

app = create_app()

with app.app_context():
    print("=" * 60)
    print("VERIFICACIÓN DE PERMISOS")
    print("=" * 60)
    
    # Buscar usuario admin
    admin_user = User.query.filter_by(legajo='ADM001').first()
    
    if not admin_user:
        print("❌ Usuario admin no encontrado")
        sys.exit(1)
    
    print(f"\n📋 Usuario: {admin_user.username} (Legajo: {admin_user.legajo})")
    print(f"📋 Email: {admin_user.email}")
    
    # Verificar rol
    if admin_user.role:
        print(f"📋 Rol: {admin_user.role.name}")
        print(f"📋 Descripción: {admin_user.role.description}")
        
        # Listar permisos
        print(f"\n🔐 Permisos del rol ({len(admin_user.role.permissions)}):")
        for perm in admin_user.role.permissions:
            print(f"   ✓ {perm.name} - {perm.description}")
        
        # Verificar método has_permission
        print(f"\n🧪 Pruebas de has_permission:")
        test_permissions = [
            'carinfo.consultar',
            'whoiswho.consultar',
            'protocolo360.consultar',
            'ciberformar.acceder'
        ]
        
        for perm in test_permissions:
            result = admin_user.has_permission(perm)
            symbol = "✓" if result else "❌"
            print(f"   {symbol} {perm}: {result}")
        
        # Verificar get_permissions_list
        print(f"\n📜 Lista de permisos (get_permissions_list):")
        perms_list = admin_user.get_permissions_list()
        print(f"   {perms_list}")
        
        # Verificar to_dict
        print(f"\n📦 Datos que se envían al frontend (to_dict):")
        user_dict = admin_user.to_dict(include_permissions=True)
        if 'permissions' in user_dict:
            print(f"   Permisos en dict: {user_dict['permissions']}")
        else:
            print("   ❌ No hay permisos en el dict")
            
    else:
        print("❌ El usuario no tiene rol asignado")
    
    print("\n" + "=" * 60)