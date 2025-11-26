from marshmallow import Schema, fields, validates, ValidationError
import re


class ConsultarPatenteSchema(Schema):
    patente = fields.Str(required=True)
    gps_lat = fields.Float(allow_none=True)
    gps_lon = fields.Float(allow_none=True)
    imagen_path = fields.Str(allow_none=True)
    
    @validates('patente')
    def validate_patente(self, value):
        """Valida formato de patente argentina"""
        # Formato viejo: ABC123
        # Formato nuevo: AB123CD
        pattern_old = r'^[A-Z]{3}\d{3}$'
        pattern_new = r'^[A-Z]{2}\d{3}[A-Z]{2}$'
        
        value_clean = value.upper().replace(' ', '').replace('-', '')
        
        if not (re.match(pattern_old, value_clean) or re.match(pattern_new, value_clean)):
            raise ValidationError('Formato de patente inválido. Debe ser ABC123 o AB123CD')


class GenerarActaSchema(Schema):
    consulta_id = fields.Str(required=True)
    tipo_acta = fields.Str(required=True)
    contenido = fields.Str(required=True)
    
    @validates('tipo_acta')
    def validate_tipo_acta(self, value):
        tipos_validos = [
            'infraccion',
            'retencion',
            'secuestro',
            'verificacion',
            'otros'
        ]
        if value not in tipos_validos:
            raise ValidationError(f'Tipo de acta debe ser uno de: {", ".join(tipos_validos)}')