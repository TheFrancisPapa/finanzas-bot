"""
api/servidor.py — Servidor FastAPI para la web app.

Sirve la API REST y los archivos estáticos del frontend.
Se ejecuta de forma directa por uvicorn en main.py.
"""

import logging
import os

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from core.config import config
from api.rutas import router

logger = logging.getLogger('Manguito-API')

# Ruta al directorio del frontend — priorizar build de React (frontend/dist)
_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_REACT_DIR = os.path.join(_BASE, "frontend", "dist")
_LEGACY_DIR = os.path.join(_BASE, "web")
STATIC_DIR = _REACT_DIR if os.path.isdir(_REACT_DIR) else _LEGACY_DIR


def crear_app() -> FastAPI:
    """Crea y configura la app FastAPI."""
    app = FastAPI(
        title="Manguito Web",
        description="Dashboard de finanzas personales",
        version="1.0.0",
        docs_url=None,   # Deshabilitamos docs en producción
        redoc_url=None,
    )

    # CORS Permitidos (Alineación Técnica)
    origenes_permitidos = [
        "http://localhost:5173", 
        "https://manguito.onrender.com"
    ]
    if config.PUBLIC_URL:
        url = config.PUBLIC_URL.rstrip('/')
        if url not in origenes_permitidos:
            origenes_permitidos.append(url)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origenes_permitidos,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from fastapi import Request
    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; img-src 'self' data: https:;"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

    # Registrar rutas de la API
    app.include_router(router)

    # --- Montar el Frontend de React ---
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

    if os.path.exists(frontend_dist):
        # 1. Montamos la carpeta assets (JS, CSS, imágenes procesadas por Vite)
        app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
        
        # 2. Catch-all Inteligente para SPA y Archivos de Raíz
        @app.get("/{catchall:path}")
        async def serve_spa(catchall: str):
            # Evitar interferir con rutas de la API que no existan
            if catchall.startswith("api/"):
                return {"detail": "Endpoint de API no encontrado"}
            
            # Si el usuario pide un archivo específico en la raíz (ej: manifest.json, sw.js, favicon.ico)
            file_path = os.path.join(frontend_dist, catchall)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
                
            # Si no es un archivo, asumimos que es una ruta de React Router y devolvemos index.html
            return FileResponse(os.path.join(frontend_dist, "index.html"))
    else:
        logger.warning(f"⚠️ Frontend dist no encontrado en: {frontend_dist}. Solo funcionará la API.")
        
        @app.get("/")
        async def root_fallback():
            return {"status": "Manguito API activa — Frontend no encontrado (dist)"}

    return app


def crear_app_standalone():
    """Retorna la app configurada (alias para main.py)."""
    return crear_app()
