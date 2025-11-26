from marshmallow import Schema, fields, validates, ValidationError


class LoginSchema(Schema):
    legajo = fields.Str(required=True)
    password = fields.Str(required=True)
    device_info = fields.Dict(missing=dict)


class ChangePasswordSchema(Schema):
    old_password = fields.Str(required=True)
    new_password = fields.Str(required=True)
    
    @validates('new_password')
    def validate_new_password(self, value):
        if len(value) < 8:
            raise ValidationError('La contraseña debe tener al menos 8 caracteres')
        
        if not any(c.isupper() for c in value):
            raise ValidationError('La contraseña debe contener al menos una mayúscula')
        
        if not any(c.isdigit() for c in value):
            raise ValidationError('La contraseña debe contener al menos un número')