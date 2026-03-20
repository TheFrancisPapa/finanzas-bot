from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import datetime

# --- NOTA PARA EL FUTURO ---
# Una vez que tengas listos los repositorios de base de datos, 
# aquí importarás las funciones reales, por ejemplo:
# from db.repo_movimientos import registrar_movimiento_web, obtener_movimientos_web

router = APIRouter()

# ==========================================
# 1. MODELOS DE DATOS (Esquemas Pydantic)
# ==========================================

class MovimientoIn(BaseModel):
    """Modelo para recibir datos del frontend al crear un gasto/ingreso"""
    type: str           # 'gasto' o 'ingreso'
    amount: float
    category: str
    description: Optional[str] = ""
    currency: str = "ARS"

class GoogleAuthRequest(BaseModel):
    """Modelo para recibir el login de Google"""
    email: str
    name: str
    picture: Optional[str] = None

# ==========================================
# 2. ENDPOINTS DE AUTENTICACIÓN
# ==========================================

@router.post("/auth/google")
async def google_auth(request: GoogleAuthRequest):
    """
    Este endpoint procesa el login de Google.
    Verifica si el usuario existe en tu base SQLite y genera el acceso.
    """
    print(f"🥭 Manguito Auth: Intento de login para {request.email}")
    
    # Aquí iría la lógica para buscar/crear el usuario en la DB:
    # user = obtener_usuario_por_email(request.email)
    # is_new = False
    # if not user: 
    #     crear_usuario_web(request.email, request.name, ...)
    #     is_new = True
    
    return {
        "status": "success",
        "token": "ejemplo_jwt_provisorio_123", # En producción aquí va un JWT real
        "user": {
            "name": request.name,
            "email": request.email,
            "picture": request.picture,
            "isNewUser": False 
        }
    }

# ==========================================
# 3. ENDPOINTS DE MOVIMIENTOS (GASTOS/INGRESOS)
# ==========================================

@router.get("/movimientos")
async def get_movimientos():
    """
    Devuelve el historial de movimientos del usuario.
    """
    # Mock de datos iniciales para que puedas probar la interfaz
    mock_data = [
        {
            "id": 1,
            "type": "gasto",
            "amount": 4500.0,
            "category": "Comida",
            "description": "Cena de prueba",
            "currency": "ARS",
            "icon": "🍕",
            "date": datetime.datetime.now().isoformat()
        },
        {
            "id": 2,
            "type": "ingreso",
            "amount": 85000.0,
            "category": "Sueldo",
            "description": "Depósito quincena",
            "currency": "ARS",
            "icon": "💼",
            "date": datetime.datetime.now().isoformat()
        }
    ]
    
    return {
        "status": "success",
        "data": mock_data
    }

@router.post("/movimientos")
async def create_movimiento(mov: MovimientoIn):
    """
    Recibe un nuevo movimiento y lo guarda en la base de datos.
    """
    print(f"✅ Guardando en DB: {mov.type} de ${mov.amount} en {mov.category}")
    
    # Aquí ejecutarías el INSERT en tu base SQLite:
    # registrar_movimiento_web(usuario_id, mov.type, mov.amount, ...)
    
    return {
        "status": "success", 
        "message": "Movimiento guardado correctamente en la nube"
    }