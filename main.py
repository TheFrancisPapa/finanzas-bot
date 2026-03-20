import uvicorn
import asyncio
import logging
import os
from db import db
from api.servidor import app
from core.config import config

# Configuración de logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('Manguito-Main')

async def main():
    """Arranque principal para Web App Exclusiva."""
    logger.info("🥭 Iniciando Manguito en modo WEB EXCLUSIVO...")
    
    # 1. Inicializar Base de Datos
    await db.init_db()
    
    # 2. Iniciar Servidor FastAPI
    # Render inyecta el puerto en la variable de entorno PORT. 
    # Si forzamos el 8081, Render dará Timeout.
    port = int(os.getenv("PORT", 8000))
    
    config_uvicorn = uvicorn.Config(app, host="0.0.0.0", port=port, log_level="info")
    server = uvicorn.Server(config_uvicorn)
    
    await server.serve()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Servidor detenido por el usuario.")
