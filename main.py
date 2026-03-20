import os
import uvicorn
from api.servidor import app
from db.manager import inicializar_bd

# ==========================================
# PUNTO DE ENTRADA PRINCIPAL
# ==========================================
# Este archivo es el que Render ejecutará mediante el comando 'python main.py'

if __name__ == "__main__":
    # 1. Inicialización de la Base de Datos
    # Esto asegura que las tablas (usuarios, gastos, etc.) existan antes 
    # de recibir cualquier petición del frontend.
    print("🥭 Manguito: Verificando base de datos...")
    try:
        inicializar_bd()
        print("✅ Base de datos lista.")
    except Exception as e:
        print(f"❌ Error al inicializar la base de datos: {e}")

    # 2. Configuración del Puerto
    # Render asigna un puerto dinámico a través de la variable de entorno 'PORT'.
    # Si estamos corriendo el código localmente, por defecto usaremos el 8000.
    port = int(os.getenv("PORT", 8000))

    # 3. Lanzamiento del Servidor Uvicorn
    # - host '0.0.0.0' es necesario para que el servidor sea accesible externamente.
    # - app es la instancia de FastAPI que definimos en servidor.py
    print(f"🚀 Manguito Web API arrancando en el puerto {port}...")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port,
        # 'log_level' ayuda a ver errores de conexión en la consola de Render
        log_level="info"
    )