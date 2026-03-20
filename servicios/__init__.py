"""
servicios.py — Servicios externos (Gemini, DolarAPI).

Usa core/config para toda la configuración.
"""

import asyncio
import logging
from datetime import datetime

import httpx
from google import genai

from core.config import config
from db import db

logger = logging.getLogger('Manguito-Servicios')

# --- CONFIGURACIÓN DE GEMINI (SDK: google-genai) ---
MODEL_NAME = config.MODEL_NAME

# Cliente centralizado de Gemini
client = genai.Client(api_key=config.GEMINI_API_KEY) if config.GEMINI_API_KEY else None

# --- RATE LIMITER (PROTECTOR DE CUOTA, RESPALDADO EN SQLITE) ---
LIMITE_IA_DIARIO = config.LIMITE_IA_DIARIO


class RateLimiter:
    """Limita las llamadas a la API de Gemini por usuario por día.
    Solo cuenta mensajes de texto natural y fotos (los que usan IA).
    Botones, comandos de BD, etc. son GRATIS y no se limitan.
    Respaldo en SQLite para persistencia.
    """

    def __init__(self, limite_diario=LIMITE_IA_DIARIO):
        self.limite = limite_diario

    async def puede_usar_ia(self, user_id):
        """Retorna True si el usuario puede hacer otra llamada a la IA."""
        usos_hoy = await db.obtener_usos_ia(user_id)
        return usos_hoy < self.limite

    async def registrar_uso(self, user_id):
        """Registra una llamada a la IA en la DB."""
        await db.registrar_uso_ia(user_id)

    async def usos_restantes(self, user_id):
        """Cuántos mensajes IA le quedan hoy."""
        usos_hoy = await db.obtener_usos_ia(user_id)
        return max(0, self.limite - usos_hoy)


rate_limiter = RateLimiter()


def msg_rate_limit():
    """Mensaje estándar cuando se agota el límite de IA."""
    return (
        f"⏳ Llegaste a tu límite diario de mensajes con IA ({LIMITE_IA_DIARIO}/día).\n"
        f"Los botones de Resumen, Metas, Top, etc. siguen funcionando.\n"
        f"Mañana se resetea. ¡Gracias por usar el bot! 🙏"
    )


# --- Caching de DolarAPI ---
_cache_dolar = {}
_cache_todas = None
_CACHE_TTL = config.DOLAR_CACHE_TTL

# --- DOLAR API (con reintentos) ---
MAX_RETRIES = config.DOLAR_MAX_RETRIES
RETRY_DELAY = config.DOLAR_RETRY_DELAY
_HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Manguito/8.0'}


async def get_cotizacion_dolar(casa="blue"):
    """
    Obtiene la cotización del dólar de DolarApi.com.
    Usa una caché en memoria de 5 minutos y no bloquea el event loop.
    Retorna: (compra, venta, fecha) o (None, None, None) si falla.
    """
    ahora = datetime.now()

    # Check cache
    if casa in _cache_dolar:
        data, timestamp = _cache_dolar[casa]
        if (ahora - timestamp).total_seconds() < _CACHE_TTL:
            return data.get('compra'), data.get('venta'), data.get('fechaActualizacion')

    url = f"https://dolarapi.com/v1/dolares/{casa}"

    for intento in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=5) as http:
                response = await http.get(url, headers=_HEADERS)

                if response.status_code == 200:
                    data = response.json()
                    _cache_dolar[casa] = (data, ahora)
                    return data.get('compra'), data.get('venta'), data.get('fechaActualizacion')
                else:
                    logger.warning(
                        f"API Dolar intento {intento}/{MAX_RETRIES}: HTTP {response.status_code}"
                    )

        except httpx.TimeoutException:
            logger.warning(f"API Dolar intento {intento}/{MAX_RETRIES}: Timeout")
        except httpx.RequestError as e:
            logger.warning(f"API Dolar intento {intento}/{MAX_RETRIES}: {e}")

        if intento < MAX_RETRIES:
            await asyncio.sleep(RETRY_DELAY)

    logger.error(f"API Dolar: Falló después de {MAX_RETRIES} intentos para '{casa}'")
    return None, None, None


async def get_todas_cotizaciones():
    """
    Obtiene TODAS las cotizaciones del dólar en una sola request.
    Usa caché en memoria de 5 minutos.
    """
    global _cache_todas
    ahora = datetime.now()

    # Check cache
    if _cache_todas is not None:
        data, timestamp = _cache_todas
        if (ahora - timestamp).total_seconds() < _CACHE_TTL:
            return data

    url = "https://dolarapi.com/v1/dolares"

    for intento in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=6) as http:
                response = await http.get(url, headers=_HEADERS)

                if response.status_code == 200:
                    raw_data = response.json()
                    resultado = {}
                    for item in raw_data:
                        casa = item.get('casa')
                        if casa:
                            resultado[casa] = item
                    _cache_todas = (resultado, ahora)
                    return resultado
                else:
                    logger.warning(
                        f"API Dolar (todas) intento {intento}/{MAX_RETRIES}: HTTP {response.status_code}"
                    )

        except httpx.TimeoutException:
            logger.warning(f"API Dolar (todas) intento {intento}/{MAX_RETRIES}: Timeout")
        except httpx.RequestError as e:
            logger.warning(f"API Dolar (todas) intento {intento}/{MAX_RETRIES}: {e}")

        if intento < MAX_RETRIES:
            await asyncio.sleep(RETRY_DELAY)

    logger.error(f"API Dolar (todas): Falló después de {MAX_RETRIES} intentos")
    return None
