"""
servicios/conversor.py — Conversión de monedas extranjeras a ARS.

Soporta conversión cruzada:
Si es USD -> Multiplica directo por el Dólar Tarjeta.
Si es otra (EUR, BRL, CLP) -> Usa yfinance para pasarlo a USD y luego a Dólar Tarjeta.
"""

import asyncio
import logging
from datetime import datetime
import yfinance as yf

from servicios import get_cotizacion_dolar

logger = logging.getLogger('Manguito-Conversor')

# Caché temporal para no abusar de yfinance
_cache_tasas = {}
_CACHE_TTL = 300  # 5 minutos


async def obtener_tasa_usd(moneda: str) -> float:
    """
    Obtiene cuántos USD vale 1 unidad de la moneda dada.
    Usa yfinance con el ticker '{moneda}USD=X'.
    Ej: 'BRL' -> busca 'BRLUSD=X'.
    """
    moneda = moneda.upper()
    if moneda == "USD":
        return 1.0
        
    ahora = datetime.now()
    if moneda in _cache_tasas:
        tasa, ts = _cache_tasas[moneda]
        if (ahora - ts).total_seconds() < _CACHE_TTL:
            return tasa
            
    ticker = f"{moneda}USD=X"
    
    def _fetch():
        try:
            info = yf.Ticker(ticker)
            precio = info.fast_info.last_price
            if precio is None:
                # Fallback a history
                hist = info.history(period="1d")
                if not hist.empty:
                    precio = float(hist['Close'].iloc[-1])
            return precio
        except Exception:
            return None
            
    try:
        tasa = await asyncio.to_thread(_fetch)
        if tasa and tasa > 0:
            _cache_tasas[moneda] = (tasa, ahora)
            return tasa
    except Exception as e:
        logger.error(f"Error obteniendo tasa yfinance para {ticker}: {e}")
        
    return None


async def convertir_a_pesos(monto: float, moneda: str) -> tuple[float, bool]:
    """
    Retorna (monto_en_ars, uso_fallback_blue).
    uso_fallback_blue = True si se usó el dólar Blue en lugar del Tarjeta.
    """
    moneda = moneda.upper().strip()
    if moneda == "ARS":
        return float(monto), False
        
    uso_fallback = False
    # 1. Obtener Dólar Tarjeta
    _, venta_tarjeta, _ = await get_cotizacion_dolar("tarjeta")
    
    if not venta_tarjeta or venta_tarjeta <= 0:
        logger.warning("Fallo en Dólar Tarjeta, fallback a Dólar Blue.")
        uso_fallback = True
        _, venta_blue, _ = await get_cotizacion_dolar("blue")
        if venta_blue and venta_blue > 0:
            venta_tarjeta = venta_blue
        else:
            return None, False
            
    # 2. Si es USD, directo
    if moneda in ("USD", "U$S", "US$"):
        return float(monto * venta_tarjeta), uso_fallback
        
    # 3. Conversión cruzada
    tasa_usd = await obtener_tasa_usd(moneda)
    if not tasa_usd:
        return None, False
        
    monto_en_usd = monto * tasa_usd
    monto_en_ars = monto_en_usd * venta_tarjeta
    
    return float(monto_en_ars), uso_fallback
