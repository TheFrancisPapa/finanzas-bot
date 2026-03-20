import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
# Importamos el router que ya configuraste
from api.rutas import router

app = FastAPI(
    title="Manguito API",
    description="Backend para la gestión de finanzas personales",
    version="1.0.0"
)

# ==========================================
# 1. CONFIGURACIÓN DE CORS
# ==========================================
# Esto permite que el frontend (React) pueda hacer peticiones a la API
# sin problemas de seguridad "Cross-Origin"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción podés limitarlo a tu dominio de Render
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. INCLUSIÓN DE RUTAS DE API
# ==========================================
# Todas las rutas de 'rutas.py' ahora empezarán con /api
app.include_router(router, prefix="/api")

# ==========================================
# 3. SERVIDOR DE FRONTEND (MODO PRODUCCIÓN)
# ==========================================
# Buscamos la carpeta donde React guarda el sitio compilado
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_dist):
    # Montamos la carpeta assets para que carguen el JS y el CSS
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    # Este es el "Catch-all": cualquier ruta que no sea de la API
    # va a devolver el index.html de React. Esto permite que el 
    # ruteo interno de la web funcione perfecto.
    @app.get("/{catchall:path}")
    async def serve_spa(catchall: str):
        # Si alguien pide algo que empieza con /api y no existe, le damos error
        if catchall.startswith("api/"):
            return {"detail": "Endpoint de API no encontrado"}
        
        # Si el usuario pide un archivo real que existe en la raíz (ej: favicon)
        file_path = os.path.join(frontend_dist, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Para todo lo demás, devolvemos el sitio de React
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    # Si todavía no compilaste el frontend, avisamos por consola
    print("⚠️ ADVERTENCIA: No se encontró la carpeta 'frontend/dist'.")
    print("Recordá correr 'npm run build' dentro de la carpeta frontend.")

# Endpoint de salud simple para que Render sepa que estamos vivos
@app.get("/health")
async def health_check():
    return {"status": "online", "server": "Manguito v1.0"}