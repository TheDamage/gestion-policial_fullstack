import os


def validate_file_upload(file, allowed_extensions, max_size=None):
    """
    Validar archivo subido
    
    Args:
        file: Archivo de la request
        allowed_extensions: Set de extensiones permitidas
        max_size: Tamaño máximo en bytes (opcional)
    
    Returns:
        None si es válido, mensaje de error si no
    """
    if not file:
        return "No se proporcionó ningún archivo"
    
    if file.filename == '':
        return "El archivo no tiene nombre"
    
    # Validar extensión
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if ext not in allowed_extensions:
        return f"Extensión no permitida. Permitidas: {', '.join(allowed_extensions)}"
    
    # Validar tamaño si se especificó
    if max_size:
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        
        if size > max_size:
            max_mb = max_size / (1024 * 1024)
            return f"El archivo excede el tamaño máximo de {max_mb:.1f}MB"
    
    return None