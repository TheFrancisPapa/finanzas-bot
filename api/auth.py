import jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Importamos la configuración global (claves secretas)
from core.config import config

# Definimos el esquema de seguridad (Bearer Token)
security = HTTPBearer()

# ==========================================
# LÓGICA DE AUTENTICACIÓN Y JWT
# ==========================================

def crear_token_jwt(usuario_id: int):
    """
    Genera un token JWT (JSON Web Token) válido por 7 días.
    Esta es la 'llave' que usará el frontend de React para hablar con el backend.
    """
    # Configuramos cuándo vence la sesión
    expiracion = datetime.utcnow() + timedelta(days=7)
    
    # Armamos el 'paquete' de datos del token (payload)
    payload = {
        "sub": str(usuario_id),  # Sujeto (a quién pertenece el token)
        "exp": expiracion        # Fecha de vencimiento
    }
    
    # Firmamos el token con nuestra clave secreta usando PyJWT
    token_codificado = jwt.encode(
        payload, 
        config.JWT_SECRET, 
        algorithm=config.ALGORITHM
    )
    
    return token_codificado

def get_usuario_actual(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependencia de FastAPI para proteger endpoints.
    Verifica que el usuario traiga un Token válido en el header.
    Si todo está bien, devuelve el ID del usuario para que la ruta lo use.
    """
    token = credentials.credentials
    
    try:
        # Intentamos decodificar el token con nuestra clave secreta
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.ALGORITHM])
        usuario_id_str: str = payload.get("sub")
        
        if usuario_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Token inválido: No se encontró el ID de usuario."
            )
            
        return int(usuario_id_str)
        
    except jwt.ExpiredSignatureError:
        # El token venció (pasaron los 7 días)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Tu sesión expiró. Por favor, iniciá sesión de nuevo."
        )
        
    except jwt.PyJWTError:
        # El token está corrupto o alguien intentó inventar uno
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Credenciales de autenticación inválidas."
        )