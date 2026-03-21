import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env (útil para desarrollo local)
load_dotenv()

class Config:
    """
    Clase centralizada para manejar la configuración del sistema.
    Combina las variables originales del bot con las nuevas para la Web App.
    """
    
    # --- Configuración Original (Bot & Servicios) ---
    TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN', '')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    # Ajustá el modelo al que usabas originalmente si es distinto
    MODEL_NAME = os.getenv('MODEL_NAME', 'gemini-2.0-flash') 
    LIMITE_IA_DIARIO = int(os.getenv('LIMITE_IA_DIARIO', 20))
    DOLAR_CACHE_TTL = int(os.getenv('DOLAR_CACHE_TTL', 3600))
    
    # --- Base de Datos ---
    DATABASE_URL = os.getenv('DATABASE_URL')
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'gastos.db')
    
    # --- Autenticación y Web ---
    JWT_SECRET = os.getenv('JWT_SECRET', 'secreto_por_defecto_para_desarrollo')
    ALGORITHM = "HS256"

    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')

    MP_ACCESS_TOKEN = os.getenv('MP_ACCESS_TOKEN', '')
    MP_WEBHOOK_SECRET = os.getenv('MP_WEBHOOK_SECRET', '')

# Instancia global para mantener compatibilidad con imports en otros archivos
# Ej: from core.config import config -> config.GEMINI_API_KEY
config = Config()