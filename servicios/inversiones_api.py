"""
servicios/inversiones_api.py — Cotizaciones en tiempo real para el portafolio.

Usa yfinance para obtener precios de:
- Criptos: BTC → BTC-USD
- CEDEARs: AAPL → AAPL.BA (en pesos argentinos)
- Acciones ARG: GGAL → GGAL.BA
- Bonos: AL30 → AL30.BA
- Moneda (USD): usa DolarAPI (dólar Blue)
"""

import asyncio
import logging
from datetime import datetime

import yfinance as yf

from servicios import get_cotizacion_dolar

logger = logging.getLogger('Manguito-Inversiones')

# Caché en memoria para no abusar de yfinance
_cache_precios = {}
_CACHE_TTL = 300  # 5 minutos


# Emojis por tipo de activo
EMOJIS_TIPO = {
    'Cripto': '🪙',
    'CEDEAR': '🍎',
    'Acción': '📊',
    'Bono': '📜',
    'Moneda': '💵',
    'ETF': '🌐',
}


async def obtener_precio(tipo: str, ticker: str) -> dict:
    """
    Obtiene el precio actual de un activo.

    Retorna dict:
    {
        "precio": float,       # precio unitario
        "moneda": "ARS"|"USD", # moneda del precio
        "nombre": str,         # nombre corto del activo
        "error": str|None,     # mensaje de error si falla
    }
    """
    ticker = ticker.upper().strip()
    cache_key = f"{tipo}:{ticker}"

    # Check caché
    ahora = datetime.now()
    if cache_key in _cache_precios:
        data, ts = _cache_precios[cache_key]
        if (ahora - ts).total_seconds() < _CACHE_TTL:
            return data

    resultado = None

    try:
        if tipo == 'Moneda':
            resultado = await _precio_moneda(ticker)
        elif tipo == 'Cripto':
            resultado = await _precio_yfinance(f"{ticker}-USD", ticker, moneda="USD")
        elif tipo == 'ETF':
            resultado = await _precio_yfinance(ticker, ticker, moneda="USD")
        elif tipo in ('CEDEAR', 'Acción', 'Bono'):
            resultado = await _precio_yfinance(f"{ticker}.BA", ticker, moneda="ARS")
        else:
            resultado = {"precio": 0, "moneda": "ARS", "nombre": ticker, "error": "Tipo desconocido"}
    except Exception as e:
        logger.error(f"Error obteniendo precio de {tipo}:{ticker}: {e}")
        resultado = {"precio": 0, "moneda": "ARS", "nombre": ticker, "error": str(e)}

    if resultado and not resultado.get("error"):
        _cache_precios[cache_key] = (resultado, ahora)

    return resultado


async def _precio_yfinance(yf_ticker: str, display_name: str, moneda: str) -> dict:
    """Busca precio en yfinance corriendo en un thread aparte."""
    def _fetch():
        info = yf.Ticker(yf_ticker)
        # fast_info es más rápido que info para sólo el precio
        try:
            precio = info.fast_info.last_price
        except Exception:
            precio = None

        # Fallback: intentar con history
        if not precio:
            hist = info.history(period="1d")
            if not hist.empty:
                precio = float(hist['Close'].iloc[-1])

        nombre = display_name
        try:
            short_name = info.info.get('shortName')
            if short_name:
                nombre = short_name[:25]
        except Exception:
            pass

        return precio, nombre

    try:
        precio, nombre = await asyncio.to_thread(_fetch)

        if precio is None or precio <= 0:
            return {
                "precio": 0,
                "moneda": moneda,
                "nombre": display_name,
                "error": f"No se encontró cotización para {yf_ticker}",
            }

        return {
            "precio": round(precio, 2),
            "moneda": moneda,
            "nombre": nombre,
            "error": None,
        }

    except Exception as e:
        return {
            "precio": 0,
            "moneda": moneda,
            "nombre": display_name,
            "error": f"Error yfinance: {e}",
        }


async def _precio_moneda(ticker: str) -> dict:
    """Precio de monedas usando DolarAPI."""
    if ticker in ('USD', 'DOLAR', 'BLUE'):
        _, venta_blue, _ = await get_cotizacion_dolar("blue")
        if venta_blue:
            return {
                "precio": venta_blue,
                "moneda": "ARS",
                "nombre": "Dólar Blue",
                "error": None,
            }
        return {
            "precio": 0,
            "moneda": "ARS",
            "nombre": "Dólar Blue",
            "error": "No se pudo obtener cotización del dólar",
        }

    # Otras monedas no soportadas por ahora
    return {
        "precio": 0,
        "moneda": "ARS",
        "nombre": ticker,
        "error": f"Moneda '{ticker}' no soportada. Usá USD.",
    }
