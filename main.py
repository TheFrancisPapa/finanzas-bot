import asyncio
import logging

from db import db
from telegram_bot import iniciar_telegram
from api.servidor import iniciar_web
from core.config import config

logger = logging.getLogger('Manguito-Main')


async def setup():
    """Inicializa la base de datos antes de arrancar el bot."""
    logger.info("Inicializando base de datos...")
    await db.init_db()
    logger.info("Base de datos lista.")


def main():
    logger.info("Iniciando Manguito - Bot de Telegram + Web...")
    asyncio.run(setup())

    # Iniciar servidor web (FastAPI) en hilo separado
    port_web = int(getattr(config, 'PORT_WEB', 8081))
    iniciar_web(port=port_web)

    # Iniciar bot de Telegram (bloquea)
    iniciar_telegram()


if __name__ == "__main__":
    main()
