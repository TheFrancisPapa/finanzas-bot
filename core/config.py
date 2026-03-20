import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # --- Telegram & Admin ---
    TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN', '')
    PORT_TELEGRAM = int(os.getenv('PORT_TELEGRAM', 8080))
    ADMIN_ID = int(os.getenv('ADMIN_ID', 0))

    # --- IA y Configuración Original ---
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    MODEL_NAME = os.getenv('MODEL_NAME', 'gemini-1.5-flash')
    LIMITE_IA_DIARIO = int(os.getenv('LIMITE_IA_DIARIO', 20))

    # --- Dolar API ---
    DOLAR_CACHE_TTL = int(os.getenv('DOLAR_CACHE_TTL', 3600))
    DOLAR_MAX_RETRIES = int(os.getenv('DOLAR_MAX_RETRIES', 3))
    DOLAR_RETRY_DELAY = int(os.getenv('DOLAR_RETRY_DELAY', 1))

    # --- Servidor Web ---
    PORT = int(os.getenv('PORT', 8000))
    PUBLIC_URL = os.getenv('PUBLIC_URL', 'https://manguito.onrender.com')

    # --- Autenticación ---
    JWT_SECRET = os.getenv('JWT_SECRET', 'secreto_por_defecto_para_desarrollo')
    ALGORITHM = "HS256"
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')

    # --- Pagos ---
    MP_ACCESS_TOKEN = os.getenv('MP_ACCESS_TOKEN', '')
    MP_WEBHOOK_SECRET = os.getenv('MP_WEBHOOK_SECRET', '')

    # --- Base de Datos ---
    DATABASE_URL = os.getenv('DATABASE_URL')
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'gastos.db')

    # --- Otros ---
    LINK_DONACION = os.getenv('LINK_DONACION', 'https://cafecito.app/urielrosales')

# Instancia global para mantener compatibilidad con todos los imports
config = Config()
