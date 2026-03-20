import os
from dotenv import load_dotenv

# Cargamos las variables del archivo .env si existe
load_dotenv()

class Config:
    """Clase centralizada para manejar la configuración del sistema."""
    
    # --- CONFIGURACIÓN DE BASE DE DATOS ---
    # DATABASE_URL se usará en producción (Render) para PostgreSQL o similares
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    # Ruta local para la base SQLite (Manguito usa esto por defecto en desarrollo)
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'gastos.db')
    
    # --- IA Y SERVICIOS ---
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    MODEL_NAME = os.getenv('MODEL_NAME', 'gemini-2.5-flash-preview-09-2025')
    LIMITE_IA_DIARIO = int(os.getenv('LIMITE_IA_DIARIO', 20))
    
    # --- SEGURIDAD Y AUTENTICACIÓN ---
    # Esta clave es VITAL para firmar los tokens de sesión. Cambiala en producción.
    JWT_SECRET = os.getenv('JWT_SECRET', 'manguito_secreto_para_desarrollo_123')
    ALGORITHM = "HS256"
    
    # --- INTEGRACIONES EXTERNAS ---
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
    
    MP_ACCESS_TOKEN = os.getenv('MP_ACCESS_TOKEN', '')
    MP_WEBHOOK_SECRET = os.getenv('MP_WEBHOOK_SECRET', '')
    
    # --- CACHÉ Y TIEMPOS ---
    DOLAR_CACHE_TTL = int(os.getenv('DOLAR_CACHE_TTL', 3600)) # 1 hora por defecto

# Creamos una instancia única para importar en todo el proyecto
config = Config()