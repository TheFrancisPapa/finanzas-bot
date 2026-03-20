"""
api/servidor.py — Servidor FastAPI para la web app.

Sirve la API REST y los archivos estáticos del frontend.
Se ejecuta en un hilo separado para no bloquear el bot de Telegram.
"""

import logging
import threading
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

    # CORS Restrictivo para producción
    origenes_permitidos = [config.PUBLIC_URL.rstrip('/')] if config.PUBLIC_URL else ["http://localhost:8081", "http://127.0.0.1:8081"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origenes_permitidos,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
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

    # Servir archivos estáticos del frontend
    if os.path.isdir(STATIC_DIR):
        app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets") if os.path.isdir(os.path.join(STATIC_DIR, "assets")) else None
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

        @app.get("/")
        async def index():
            return FileResponse(os.path.join(STATIC_DIR, "index.html"))

        @app.get("/manifest.json")
        async def manifest():
            return FileResponse(os.path.join(STATIC_DIR, "manifest.json"))

        @app.get("/sw.js")
        async def service_worker():
            return FileResponse(
                os.path.join(STATIC_DIR, "sw.js"),
                media_type="application/javascript",
            )

        # SPA fallback — cualquier ruta que no sea /api/* devuelve index.html
        @app.get("/{path:path}")
        async def spa_fallback(path: str):
            # Si es un archivo estático que existe, servirlo
            file_path = os.path.join(STATIC_DIR, path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
            # Sino, devolver index.html para que React maneje la ruta
            return FileResponse(os.path.join(STATIC_DIR, "index.html"))
    else:
        @app.get("/")
        async def index():
            return {"status": "Manguito API v1.0 — Frontend no encontrado. Corrí 'cd frontend && npm run build'."}

    return app


def iniciar_web(port: int = 8081):
    """Inicia el servidor web en un hilo separado (daemon)."""
    app = crear_app()

    def _run():
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    logger.info(f"🌐 Manguito Web iniciado en http://localhost:{port}")
    return app
