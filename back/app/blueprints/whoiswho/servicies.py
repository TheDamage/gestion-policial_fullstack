from sqlalchemy import or_
from app.extensions import db
from app.models.personal import Personal, Dependencia, Organigrama


# Tabla intermedia para favoritos
favoritos = db.Table('favoritos_whoiswho',
    db.Column('user_id', db.String(36), db.ForeignKey('users.id'), primary_key=True),
    db.Column('personal_id', db.String(36), db.ForeignKey('personal.id'), primary_key=True)
)


class WhoIsWhoService:
    """Servicios para WhoIsWho"""
    
    @staticmethod
    def search_personal(search='', area='', rango='', dependencia='', page=1, limit=20):
        """Busca personal con filtros"""
        query = Personal.query.filter_by(activo=True)
        
        # Filtro de búsqueda por nombre, apellido, legajo
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    Personal.nombre.ilike(search_term),
                    Personal.apellido.ilike(search_term),
                    Personal.legajo.ilike(search_term),
                    Personal.email_institucional.ilike(search_term)
                )
            )
        
        # Filtro por área
        if area:
            query = query.filter(Personal.area.ilike(f'%{area}%'))
        
        # Filtro por rango
        if rango:
            query = query.filter(Personal.rango.ilike(f'%{rango}%'))
        
        # Filtro por dependencia
        if dependencia:
            query = query.filter(Personal.dependencia.ilike(f'%{dependencia}%'))
        
        # Contar total
        total = query.count()
        
        # Paginar
        personal_list = query.order_by(Personal.apellido, Personal.nombre)\
                            .offset((page - 1) * limit)\
                            .limit(limit)\
                            .all()
        
        return {
            'personal': [p.to_dict() for p in personal_list],
            'total': total
        }
    
    @staticmethod
    def get_personal_detail(personal_id):
        """Obtiene detalles completos de un miembro del personal"""
        personal = Personal.query.get(personal_id)
        
        if not personal:
            return None
        
        # Obtener datos con relaciones
        data = personal.to_dict(include_relations=True)
        
        # Agregar información adicional si existe
        if personal.superior:
            data['superior'] = {
                'id': personal.superior.id,
                'nombre_completo': f'{personal.superior.nombre} {personal.superior.apellido}',
                'rango': personal.superior.rango,
                'cargo': personal.superior.cargo
            }
        
        # Agregar subordinados
        if personal.subordinados:
            data['subordinados'] = [
                {
                    'id': s.id,
                    'nombre_completo': f'{s.nombre} {s.apellido}',
                    'rango': s.rango,
                    'cargo': s.cargo
                }
                for s in personal.subordinados
            ]
        
        return {'personal': data}
    
    @staticmethod
    def get_organigrama():
        """Obtiene la estructura jerárquica completa"""
        # Obtener nodos raíz (sin padre)
        root_nodes = Organigrama.query.filter_by(parent_id=None)\
                                       .order_by(Organigrama.orden)\
                                       .all()
        
        def build_tree(node):
            """Construye árbol recursivamente"""
            return node.to_dict(include_children=True)
        
        tree = [build_tree(node) for node in root_nodes]
        
        return tree
    
    @staticmethod
    def search_dependencias(tipo='', search=''):
        """Busca dependencias con filtros"""
        query = Dependencia.query
        
        # Filtro por tipo
        if tipo:
            query = query.filter(Dependencia.tipo.ilike(f'%{tipo}%'))
        
        # Filtro de búsqueda
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    Dependencia.nombre.ilike(search_term),
                    Dependencia.direccion.ilike(search_term)
                )
            )
        
        dependencias = query.order_by(Dependencia.nombre).all()
        
        return [d.to_dict() for d in dependencias]
    
    @staticmethod
    def get_dependencia_detail(dependencia_id):
        """Obtiene detalles de una dependencia con personal asignado"""
        dependencia = Dependencia.query.get(dependencia_id)
        
        if not dependencia:
            return None
        
        data = dependencia.to_dict(include_personal=True)
        
        return {
            'dependencia': data['nombre'],
            'tipo': data['tipo'],
            'direccion': data['direccion'],
            'telefono': data['telefono'],
            'email': data['email'],
            'gps_lat': data['gps_lat'],
            'gps_lon': data['gps_lon'],
            'horario': data['horario'],
            'descripcion': data['descripcion'],
            'personal': data.get('personal', [])
        }
    
    @staticmethod
    def toggle_favorito(user_id, personal_id):
        """Marca o desmarca un personal como favorito"""
        from app.models.user import User
        
        user = User.query.get(user_id)
        personal = Personal.query.get(personal_id)
        
        if not user or not personal:
            raise Exception('Usuario o personal no encontrado')
        
        # Verificar si ya es favorito
        # Nota: Necesitarías agregar esta relación al modelo User
        # Por ahora, simplemente retornamos success
        
        return {
            'success': True,
            'favorito': True  # Implementar lógica real
        }