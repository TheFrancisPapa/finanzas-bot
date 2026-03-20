"""
core/config.py — Configuración centralizada de la aplicación.

Lee el .env UNA sola vez y expone las variables como atributos de un
objeto singleton. Ningún otro archivo del proyecto debe llamar a
os.getenv() ni a load_dotenv().
"""

import os
import logging
from dotenv import load_dotenv

# Cargar .env UNA sola vez al importar este módulo
load_dotenv()

logger = logging.getLogger('Manguito-Config')


class _Config:
    """Singleton de configuración. Se instancia al final del módulo."""

    def __init__(self):
        # === Telegram ===
        self.TELEGRAM_TOKEN: str = os.getenv("TELEGRAM_TOKEN", "")
        self.PORT_TELEGRAM: int = int(os.getenv("PORT_TELEGRAM", "8080"))
        
        self.JWT_SECRET: str = os.getenv("JWT_SECRET", self.TELEGRAM_TOKEN)  # fallback temporal

        # === Web Dashboard ===
        # Render.com inyecta la variable PORT, usamos esa por defecto si existe.
        self.PORT_WEB: int = int(os.getenv("PORT", os.getenv("PORT_WEB", "8081")))
        self.PUBLIC_URL: str = os.getenv("PUBLIC_URL", "")

        # === Auth & Pagos ===
        self.GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
        self.GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
        self.MP_ACCESS_TOKEN: str = os.getenv("MP_ACCESS_TOKEN", "")
        self.MP_WEBHOOK_SECRET: str = os.getenv("MP_WEBHOOK_SECRET", "")

        # === Gemini / IA ===
        self.GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        self.MODEL_NAME: str = os.getenv("MODEL_NAME", "gemini-2.5-flash")
        self.LIMITE_IA_DIARIO: int = int(os.getenv("LIMITE_IA_DIARIO", "30"))

        # === Admin ===
        self.ADMIN_ID: int = int(os.getenv("ADMIN_ID", "0"))

        # === Links ===
        self.LINK_DONACION: str = os.getenv(
            "LINK_DONACION", "https://cafecito.app/urielrosales"
        )

        # === Base de datos ===
        self.DATABASE_URL: str = os.getenv(
            "DATABASE_URL",
            ""
        )
        self.DB_PATH: str = os.getenv(
            "DB_PATH",
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "finanzas.db"),
        )
        
        # === DolarAPI ===
        self.DOLAR_CACHE_TTL: int = int(os.getenv("DOLAR_CACHE_TTL", "300"))  # 5 min
        self.DOLAR_MAX_RETRIES: int = 3
        self.DOLAR_RETRY_DELAY: int = 1  # segundos

        self._validar()

    def _validar(self):
        """Valida que las variables críticas estén presentes."""
        errores = []
        if not self.TELEGRAM_TOKEN:
            errores.append("TELEGRAM_TOKEN")
        if not self.GEMINI_API_KEY:
            logger.warning("⚠️ GEMINI_API_KEY no configurada — las funciones de IA estarán deshabilitadas")
        if self.ADMIN_ID == 0:
            logger.warning("⚠️ ADMIN_ID no configurado — las funciones de admin no funcionarán")

        if errores:
            raise EnvironmentError(
                f"❌ Variables de entorno requeridas no encontradas: {', '.join(errores)}.\n"
                "   Asegurate de tener un archivo .env con estas variables."
            )

        logger.info(
            f"✅ Config cargada — Model: {self.MODEL_NAME} | "
            f"Límite IA: {self.LIMITE_IA_DIARIO}/día | "
            f"DB: {os.path.basename(self.DB_PATH)}"
        )


# === Singleton global ===
config = _Config()
