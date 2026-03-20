"""
servicios/noticias.py — Módulo para extraer noticias relevantes y analizar sentimiento.
"""
import logging
import json
import asyncio
import yfinance as yf

from servicios import client, MODEL_NAME
from utils.prompts import prompt_analisis_sentimiento

logger = logging.getLogger('Manguito-Noticias')

async def analizar_noticias_financieras(ticker: str) -> str:
    """
    Busca las últimas noticias de un ticker vía yfinance y las envía a Gemini 
    para extraer el sentimiento del mercado.
    Retorna el string de respuesta formateado o un mensaje de error.
    """
    
    try:
        def fetch_news():
            # Intentar primero con yfinance
            try:
                t = yf.Ticker(ticker.upper())
                n = t.news
                if n and len(n) > 0:
                    return n
            except Exception as e:
                logger.warning(f"yfinance falló para {ticker}: {e}. Intentando API directa.")
            
            # Fallback: API secreta de búsqueda de Yahoo que casi no tiene rate limit
            import urllib.request
            import urllib.parse
            url = f"https://query2.finance.yahoo.com/v1/finance/search?q={urllib.parse.quote(ticker.upper())}&quotesCount=0&newsCount=15"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                return data.get('news', [])
        
        # yfinance hace la llamada a la web sincrónicamente, es mejor correrla en un thread
        news = await asyncio.to_thread(fetch_news)
    except Exception as e:
        logger.error(f"Error buscando noticias para {ticker}: {e}")
        return f"❌ Hubo un error al buscar las noticias de {ticker}. Error interno: {e}\nRevisá que el ticker exista o intentá más tarde."

    if not news or len(news) == 0:
        return f"🤷‍♂️ No encontré noticias recientes para *{ticker.upper()}* en Yahoo Finance."

    # Armar un resumen de los textos a analizar
    textos_noticias = []
    for idx, n in enumerate(news[:15]): # Tomamos como mucho 15
        titulo = n.get("title", "")
        # Extraer publisher
        publisher = n.get("publisher", "Medio desconocido")
        # En la noticia a veces viene summary, otras no, usamos lo que haya
        # Extraemos content.title si es que viene de la nueva API, sino usamos el principal
        contenido = n.get("content", {})
        if isinstance(contenido, dict):
            t = contenido.get("title", titulo)
            s = contenido.get("summary", "")
        else:
            t = titulo
            s = ""
        
        texto_limpio = f"TÍTULO: {t}"
        if s:
            texto_limpio += f"\nRESUMEN: {s}"
            
        textos_noticias.append(f"Noticia {idx+1} ({publisher}):\n{texto_limpio}")

    bloque_noticias = "\n\n".join(textos_noticias)
    prompt = prompt_analisis_sentimiento(ticker.upper(), bloque_noticias)

    try:
        response = await asyncio.to_thread(
            client.models.generate_content, model=MODEL_NAME, contents=prompt
        )
        return response.text
    except Exception as e:
        logger.error(f"Error enviando noticias de {ticker} a Gemini: {e}")
        return "🧠 La IA no pudo procesar las noticias en este momento. Probá de nuevo más tarde."
