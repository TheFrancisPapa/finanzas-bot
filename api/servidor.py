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

    # --- NUEVO: Servir el Frontend de React ---
    # La carpeta 'dist' se genera con 'npm run build' en el build.sh
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

    if os.path.exists(frontend_dist):
        # Montar archivos estáticos (JS, CSS, imágenes de Vite)
        assets_path = os.path.join(frontend_dist, "assets")
        if os.path.isdir(assets_path):
            app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

        # SPA Fallback: cualquier ruta que no sea /api/* sirve el index.html
        @app.get("/{catchall:path}")
        async def serve_react_app(catchall: str):
            # Si la ruta existe como archivo real (ej: manifest.json, favicon.ico), lo servimos
            file_path = os.path.join(frontend_dist, catchall.strip("/"))
            if os.path.isfile(file_path):
                return FileResponse(file_path)
            
            # Si no empieza con api/, devolvemos index.html para que React maneje la ruta
            if not catchall.startswith("api/"):
                return FileResponse(os.path.join(frontend_dist, "index.html"))
            
            return {"detail": "API endpoint no encontrado"}
    else:
        logger.warning(f"⚠️ Frontend dist no encontrado en: {frontend_dist}. Solo funcionará la API.")
        
        @app.get("/")
        async def root_fallback():
            return {"status": "Manguito API activa — Frontend no encontrado (dist)"}

    return app


def crear_app_standalone():
    """Retorna la app configurada (alias para main.py)."""
    return crear_app()
