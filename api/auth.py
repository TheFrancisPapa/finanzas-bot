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

# Usamos el JWT_SECRET como secreto
_SECRET = config.JWT_SECRET.encode()


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def _b64_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    s += '=' * padding
    return base64.urlsafe_b64decode(s)


def generar_token(user_id: int) -> str:
    """
    Genera un token firmado para un usuario con expiración de 30 días.
    Formato: base64(payload).base64(signature)
    """
    payload = json.dumps({
        'uid': user_id,
        'iat': int(time.time()),
        'exp': int(time.time()) + (30 * 24 * 60 * 60),
    }).encode()

    payload_b64 = _b64_encode(payload)
    signature = hmac.new(_SECRET, payload_b64.encode(), hashlib.sha256).digest()
    sig_b64 = _b64_encode(signature)

    return f"{payload_b64}.{sig_b64}"


def crear_token_jwt(user_id: int) -> str:
    """Alias para compatibilidad con la guía técnica."""
    return generar_token(user_id)


def verificar_token(token: str) -> int | None:
    """
    Verifica un token y retorna el user_id, o None si es inválido o expiró.
    """
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None

        payload_b64, sig_b64 = parts
        expected_sig = hmac.new(_SECRET, payload_b64.encode(), hashlib.sha256).digest()

        if not hmac.compare_digest(expected_sig, _b64_decode(sig_b64)):
            return None

        payload = json.loads(_b64_decode(payload_b64))
        if payload.get('exp') and time.time() > payload['exp']:
            return None  # Token expirado
            
        return payload.get('uid')

    except Exception as e:
        logger.warning(f"Token inválido: {e}")
        return None

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
