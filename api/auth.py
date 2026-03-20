"""
api/auth.py — Sistema de autenticación para la API web.

Genera tokens JWT vinculados al user_id de Telegram.
El usuario obtiene su token desde el bot con un comando /web.
"""

import hashlib
import hmac
import time
import json
import base64
import logging

from core.config import config

logger = logging.getLogger('Manguito-API')

import jwt
from datetime import datetime, timedelta, timezone

# --- Configuración JWT ---
JWT_SECRET = config.JWT_SECRET
ALGORITHM = config.ALGORITHM

def crear_token_jwt(user_id: int) -> str:
    """ Genera un token JWT firmado para un usuario con expiración de 30 días. """
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def verificar_token(token: str) -> int | None:
    """ Verifica un token y retorna el user_id, o None si es inválido o expiró. """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        return int(user_id) if user_id else None
    except jwt.PyJWTError as e:
        logger.warning(f"Token inválido: {e}")
        return None

def generar_token(user_id: int) -> str:
    """Alias para compatibilidad."""
    return crear_token_jwt(user_id)

import bcrypt

def hashear_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verificar_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except Exception:
        return False


# --- Alineación Pivot Web ---
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_usuario_actual(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """
    Dependencia de FastAPI para obtener el usuario_id del token JWT.
    Protege las rutas y asegura que el usuario esté autenticado.
    """
    token = credentials.credentials
    user_id = verificar_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
