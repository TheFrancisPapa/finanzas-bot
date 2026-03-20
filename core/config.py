import os
import logging
from dotenv import load_dotenv

# Cargar .env UNA sola vez al importar este módulo
load_dotenv()

logger = logging.getLogger('Manguito-Config')

class _Config:
    """Singleton de configuración para el entorno web de Manguito."""

    def __init__(self):
        # --- IA y Configuración Original (Restauradas) ---
        self.GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        self.TELEGRAM_TOKEN: str = os.getenv("TELEGRAM_TOKEN", "")
        self.LIMITE_IA_DIARIO: int = int(os.getenv("LIMITE_IA_DIARIO", 20))
        self.MODEL_NAME: str = os.getenv("MODEL_NAME", "gemini-2.0-flash")

        # --- Servidor ---
        self.PORT: int = int(os.getenv("PORT", 8000))
        self.PUBLIC_URL: str = os.getenv("PUBLIC_URL", "https://manguito.onrender.com")

        # --- Autenticación & Seguridad ---
        self.JWT_SECRET: str = os.getenv("JWT_SECRET", "secreto_por_defecto_para_desarrollo")
        self.ALGORITHM: str = "HS256"

        # --- Google OAuth ---
        self.GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
        self.GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

        # --- Mercado Pago ---
        self.MP_ACCESS_TOKEN: str = os.getenv("MP_ACCESS_TOKEN", "")
        self.MP_WEBHOOK_SECRET: str = os.getenv("MP_WEBHOOK_SECRET", "")

        # --- Base de Datos ---
        self.DATABASE_URL: str = os.getenv("DATABASE_URL", "")
        self.DB_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "gastos.db")
        
        logger.info("Configuración de entorno restaurada y cargada.")

# Global instance
config = _Config()
