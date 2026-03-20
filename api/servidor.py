import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api.rutas import router

app = FastAPI(title="Manguito App API")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas del Backend
app.include_router(router, prefix="/api")

# --- Servir el Frontend de React ---
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_dist):
    # Montamos la carpeta assets
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    # Catch-all inteligente para la SPA
    @app.get("/{catchall:path}")
    async def serve_spa(catchall: str):
        if catchall.startswith("api/"):
            return {"detail": "Endpoint de API no encontrado"}
        
        # Si pide un archivo estático específico (favicon.svg, manifest.json, etc)
        file_path = os.path.join(frontend_dist, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Si es navegación de React, devolvemos index.html
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    print("ADVERTENCIA: Carpeta frontend/dist no encontrada. Verifica el script de build.")
