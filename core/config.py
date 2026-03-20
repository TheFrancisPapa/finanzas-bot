import os
import logging
from dotenv import load_dotenv

# Cargar .env UNA sola vez al importar este módulo
load_dotenv()

logger = logging.getLogger('Manguito-Config')

class _Config:
    """Singleton de configuración para el entorno web de Manguito."""

    def __init__(self):
        # --- Servidor ---
        self.PORT: int = int(os.getenv("PORT", 8000))
        self.PUBLIC_URL: str = os.getenv("PUBLIC_URL", "https://manguito.onrender.com")

        # --- Autenticación & Seguridad ---
        # Si no hay JWT_SECRET, usamos una constante débil solo para DEV
        self.JWT_SECRET: str = os.getenv("JWT_SECRET", "manguito_dev_secret_key_123")
        self.ALGORITHM: str = "HS256"

        # --- Google OAuth ---
        self.GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
        self.GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

        # --- Mercado Pago ---
        self.MP_ACCESS_TOKEN: str = os.getenv("MP_ACCESS_TOKEN", "")
        self.MP_WEBHOOK_SECRET: str = os.getenv("MP_WEBHOOK_SECRET", "")

        # --- Base de Datos ---
        # Si DATABASE_URL existe (Render Postgres), se usa prioritized.
        # Caso contrario, se hace fallback a gastos.db local.
        self.DATABASE_URL: str = os.getenv("DATABASE_URL", "")
        self.DB_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "gastos.db")

        # --- IA / Gemini ---
        self.GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        self.MODEL_NAME: str = os.getenv("MODEL_NAME", "gemini-2.0-flash")
        
        logger.info("Configuración de entorno cargada correctamente.")

# Global instance
config = _Config()
