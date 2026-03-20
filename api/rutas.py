"""
api/rutas.py — Todas las rutas de la API REST.

Cada endpoint reutiliza la capa db/ existente.
"""

import logging
from datetime import datetime
from typing import Optional
import html
import asyncio
import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, Header, Request
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel

from db import db
from api.auth import verificar_token
from servicios import get_cotizacion_dolar, get_todas_cotizaciones, client, rate_limiter, MODEL_NAME

logger = logging.getLogger('Manguito-API')

router = APIRouter(prefix="/api")


# ── DEPENDENCIA DE AUTH ───────────────────────────────────

async def get_user_id(
    authorization: str = Header(None),
    token: str = Query(None, alias="token")
):
    """Extrae el user_id del token. Acepta Authorization: Bearer o query param."""
    raw = None
    if authorization and authorization.startswith("Bearer "):
        raw = authorization.split(" ", 1)[1].strip()
    elif token:
        raw = token.strip()

    if not raw:
        raise HTTPException(status_code=401, detail="Token requerido")

    user_id = verificar_token(raw)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")

    return user_id


# ── MODELOS ───────────────────────────────────────────────

class MovimientoIn(BaseModel):
    tipo: str  # "ingreso" o "egreso"
    monto: float
    categoria: str
    descripcion: str


class MovimientoEdit(BaseModel):
    nuevo_monto: float


class PresupuestoIn(BaseModel):
    categoria: str
    monto: float


class MetaIn(BaseModel):
    nombre: str
    objetivo: float


class AporteIn(BaseModel):
    monto: float

class CategoriaIn(BaseModel):
    nombre: str
    tipo: str = "egreso"

class ApodoIn(BaseModel):
    apodo: str

class MonedaIn(BaseModel):
    moneda: str

class ChatIn(BaseModel):
    mensaje: str

class RegisterIn(BaseModel):
    email: str
    password: str
    nombre: str
    edad: int = None
    objetivo: str = None

class LoginIn(BaseModel):
    email: str
    password: str

class OnboardingIn(BaseModel):
    edad: int
    objetivo: str

class VincularTelegramIn(BaseModel):
    codigo: str

# ── PERFIL ────────────────────────────────────────────────

LIMITE_IA_FREE = 5
LIMITE_IA_PRO = 20

@router.get("/perfil")
async def perfil(user_id: int = Depends(get_user_id)):
    """Datos del perfil del usuario."""
    info = await db.info_plan(user_id)
    racha = await db.get_racha(user_id)
    logros = await db.get_logros(user_id)
    apodo = await db.usuarios.get_apodo(user_id)
    moneda = await db.usuarios.get_moneda(user_id)
    pro = await db.usuarios.es_pro(user_id)

    return {
        "id": user_id,
        "apodo": apodo,
        "moneda": moneda,
        "plan": info[0],
        "dias_restantes": info[1],
        "es_pro": pro,
        "racha": racha,
        "logros": [{"logro_id": l[0], "fecha": l[1]} for l in logros] if logros else [],
        "notificaciones_activas": await db.usuarios.get_notificaciones_activas(user_id),
    }

@router.post("/perfil/apodo")
async def actualizar_apodo(data: ApodoIn, user_id: int = Depends(get_user_id)):
    await db.usuarios.set_apodo(user_id, data.apodo)
    return {"status": "ok", "apodo": data.apodo}

@router.post("/perfil/moneda")
async def actualizar_moneda(data: MonedaIn, user_id: int = Depends(get_user_id)):
    await db.usuarios.set_moneda(user_id, data.moneda)
    return {"status": "ok", "moneda": data.moneda}

@router.post("/perfil/notificaciones")
async def toggle_notificaciones_web(body: dict, user_id: int = Depends(get_user_id)):
    activas = body.get("activas", True)
    await db.usuarios.set_notificaciones_activas(user_id, activas)
    return {"status": "ok", "notificaciones_activas": activas}

@router.delete("/perfil/cuenta")
async def eliminar_cuenta(user_id: int = Depends(get_user_id)):
    await db.usuarios.eliminar_cuenta(user_id)
    return {"status": "ok", "message": "Cuenta eliminada correctamente"}


# ── RATE LIMITING ─────────────────────────────────────────

login_attempts = defaultdict(list)

def _rate_limit_auth(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    login_attempts[ip] = [t for t in login_attempts[ip] if now - t < 60]
    if len(login_attempts[ip]) >= 10:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Esperá un minuto.")
    login_attempts[ip].append(now)

# ── AUTH WEB ──────────────────────────────────────────────

@router.post("/auth/register")
async def register(body: RegisterIn, request: Request):
    _rate_limit_auth(request)
    if len(body.password) < 6:
        raise HTTPException(400, "La contraseña debe tener al menos 6 caracteres")
    if "@" not in body.email:
        raise HTTPException(400, "Email inválido")
    if not body.nombre or len(body.nombre.strip()) < 2:
        raise HTTPException(400, "Nombre muy corto")
    if not await db.email_disponible(body.email):
        raise HTTPException(409, "El email ya está registrado")
    from api.auth import hashear_password, generar_token
    password_hash = hashear_password(body.password)
    nombre_seguro = html.escape(body.nombre.strip())
    usuario_id = await db.crear_usuario_web(body.email, password_hash, nombre_seguro)
    token = generar_token(usuario_id)
    return {"token": token, "nombre": nombre_seguro, "onboarding_pendiente": True}


@router.post("/auth/login")
async def login_web(body: LoginIn, request: Request):
    _rate_limit_auth(request)
    from api.auth import verificar_password, generar_token
    row = await db.get_web_user_por_email(body.email)
    if not row:
        raise HTTPException(401, "Email o contraseña incorrectos")
    usuario_id, password_hash = row[0], row[1]
    if not password_hash:
        raise HTTPException(401, "Esta cuenta usa Google. Iniciá sesión con Google.")
    if not verificar_password(body.password, password_hash):
        raise HTTPException(401, "Email o contraseña incorrectos")
    token = generar_token(usuario_id)
    needs_ob = await db.needs_onboarding(usuario_id)
    return {"token": token, "onboarding_pendiente": needs_ob}


@router.get("/auth/google")
async def google_login():
    from core.config import config as cfg
    try:
        base_url = cfg.PUBLIC_URL.rstrip('/')
        redirect_uri = f"{base_url}/api/auth/google/callback"
        # URL encode spaces in scope
        scope = "openid%20email%20profile"
        url = (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={cfg.GOOGLE_CLIENT_ID}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&scope={scope}"
        )
        return RedirectResponse(url)
    except Exception as e:
        logger.error(f"Error en google_login: {e}")
        raise HTTPException(500, "Error configurando login de Google")


@router.get("/auth/google/callback")
async def google_callback(code: str):
    import httpx
    from core.config import config as cfg
    from api.auth import generar_token
    base_url = cfg.PUBLIC_URL.rstrip('/')
    redirect_uri = f"{base_url}/api/auth/google/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={"code": code, "client_id": cfg.GOOGLE_CLIENT_ID,
                  "client_secret": cfg.GOOGLE_CLIENT_SECRET,
                  "redirect_uri": redirect_uri, "grant_type": "authorization_code"}
        )
        token_data = token_resp.json()
        if "error" in token_data:
            error_desc = token_data.get("error_description", "Error desconocido")
            raise HTTPException(400, f"Error autenticando con Google: {token_data['error']} - {error_desc}")
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        userinfo = userinfo_resp.json()
    google_id = userinfo.get("sub")
    email = userinfo.get("email")
    nombre = userinfo.get("name", email.split("@")[0])
    if not google_id or not email:
        raise HTTPException(400, "No se pudo obtener info de Google")
    usuario_id = await db.crear_o_actualizar_usuario_google(google_id, email, nombre)
    token = generar_token(usuario_id)
    needs_ob = await db.needs_onboarding(usuario_id)
    ob_param = "1" if needs_ob else "0"
    base_url = cfg.PUBLIC_URL.rstrip('/')
    return RedirectResponse(f"{base_url}/?token={token}&onboarding={ob_param}")


@router.post("/auth/onboarding")
async def completar_onboarding(body: OnboardingIn, user_id: int = Depends(get_user_id)):
    if body.edad < 13 or body.edad > 100:
        raise HTTPException(400, "Edad inválida")
    await db.completar_onboarding(user_id, body.edad, body.objetivo)
    return {"ok": True}


@router.post("/auth/vincular-telegram")
async def vincular_telegram(body: VincularTelegramIn, user_id: int = Depends(get_user_id)):
    from api.auth import verificar_token
    telegram_user_id = verificar_token(body.codigo)
    if telegram_user_id is None:
        raise HTTPException(400, "Código inválido o expirado. Generá uno nuevo con /web en Telegram.")
    ok = await db.vincular_telegram(user_id, telegram_user_id)
    if not ok:
        raise HTTPException(500, "Error al vincular")
    return {"ok": True}


# ── PAGO PRO (MercadoPago) ─────────────────────────────────

@router.post("/pago/crear-preferencia")
async def crear_preferencia_mp(request: Request, user_id: int = Depends(get_user_id)):
    """Crea una preferencia de pago en MercadoPago y retorna el link de pago."""
    import mercadopago
    from core.config import config as cfg
    
    body = await request.json()
    plan = body.get("plan", "mensual")
    
    planes = {
        "mensual": {"title": "Manguito PRO — 1 mes", "price": 6999.0, "meses": 1},
        "anual":   {"title": "Manguito PRO — 12 meses (Ahorrá 29%)", "price": 59999.0, "meses": 12},
    }
    plan_data = planes.get(plan, planes["mensual"])
    
    sdk = mercadopago.SDK(cfg.MP_ACCESS_TOKEN)
    preference_data = {
        "items": [{
            "title": plan_data["title"],
            "quantity": 1,
            "unit_price": plan_data["price"],
            "currency_id": "ARS",
        }],
        "back_urls": {
            "success": f"{cfg.PUBLIC_URL}/?pago=ok",
            "failure": f"{cfg.PUBLIC_URL}/?pago=error",
            "pending": f"{cfg.PUBLIC_URL}/?pago=pendiente",
        },
        "auto_return": "approved",
        "external_reference": f"{user_id}:{plan_data['meses']}",
        "notification_url": f"{cfg.PUBLIC_URL}/api/pago/webhook",
    }
    result = sdk.preference().create(preference_data)
    if result["status"] != 201:
        logger.error(f"MP error: status={result['status']} response={result['response']}")
        raise HTTPException(500, f"MP error {result['status']}: {result['response']}")
    return {"url": result["response"]["init_point"]}


@router.post("/pago/webhook")
async def webhook_mp(request: Request):
    """MercadoPago llama a este endpoint cuando hay un pago."""
    import mercadopago
    from core.config import config as cfg
    try:
        data = await request.json()
        if data.get("type") == "payment":
            payment_id = data["data"]["id"]
            sdk = mercadopago.SDK(cfg.MP_ACCESS_TOKEN)
            payment_info = sdk.payment().get(payment_id)
            payment = payment_info["response"]
            if payment["status"] == "approved":
                ext_ref = str(payment["external_reference"])
                if ":" in ext_ref:
                    user_id, meses = int(ext_ref.split(":")[0]), int(ext_ref.split(":")[1])
                else:
                    user_id, meses = int(ext_ref), 1
                await db.usuarios.activar_pro(user_id, meses=meses)
                logger.info(f"✅ PRO activado para user_id={user_id} por {meses} meses via MercadoPago")
    except Exception as e:
        logger.error(f"Error en webhook MP: {e}")
    return JSONResponse(content={"ok": True})


# ── RESUMEN ───────────────────────────────────────────────

@router.get("/resumen")
async def resumen(user_id: int = Depends(get_user_id)):
    """Resumen financiero del mes actual."""
    try:
        ingresos, gastos = await db.get_resumen_mensual(user_id)
        ingresos = ingresos or 0
        gastos = gastos or 0

        total_hoy_result = await db.get_gastos_hoy(user_id)
        total_hoy = total_hoy_result[0] if total_hoy_result else 0
        cant_hoy = total_hoy_result[1] if total_hoy_result and len(total_hoy_result) > 1 else 0

        racha = await db.get_racha(user_id) or 0

        # Datos para gráfico de categorías (egresos)
        datos_analisis = await db.get_datos_analisis(user_id, tipo='egreso')
        datos_cat = datos_analisis[0] if datos_analisis else []

        # Datos para gráfico de categorías (ingresos)
        datos_analisis_ingresos = await db.get_datos_analisis(user_id, tipo='ingreso')
        datos_cat_ing = datos_analisis_ingresos[0] if datos_analisis_ingresos else []

        # Comparativo
        comp = await db.get_comparativo_mensual(user_id)
        total_actual = comp[0] if comp else 0
        total_anterior = comp[1] if comp and len(comp) > 1 else 0
        mes_ant = comp[4] if comp and len(comp) > 4 else ""

        # Gastos por día para gráfico de línea
        gastos_dia = await db.get_gastos_por_dia(user_id) or []

        # Calcular variación porcentaje segura
        if total_anterior and total_anterior > 0:
            variacion = round(((total_actual - total_anterior) / total_anterior * 100), 1)
        else:
            variacion = 0

        return {
            "ingresos": ingresos,
            "gastos": gastos,
            "balance": ingresos - gastos,
            "gastos_hoy": total_hoy or 0,
            "movimientos_hoy": cant_hoy or 0,
            "racha": racha,
            "categorias": [{"nombre": c[0], "total": c[1]} for c in datos_cat] if datos_cat else [],
            "categorias_ingresos": [{"nombre": c[0], "total": c[1]} for c in datos_cat_ing] if datos_cat_ing else [],
            "gastos_por_dia": [{"dia": g[0], "total": g[1]} for g in gastos_dia] if gastos_dia else [],
            "comparativo": {
                "mes_actual": total_actual or 0,
                "mes_anterior": total_anterior or 0,
                "mes_anterior_nombre": mes_ant,
                "variacion_pct": variacion,
            },
        }
    except Exception as e:
        import traceback
        logger.error(f"Error en /api/resumen: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ── MOVIMIENTOS ───────────────────────────────────────────

@router.get("/movimientos")
async def listar_movimientos(
    limite: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    tipo: Optional[str] = Query(None),
    user_id: int = Depends(get_user_id),
):
    """Lista movimientos paginados, opcionalmente filtrados por tipo (ingreso/egreso)."""
    movs = await db.get_movimientos_paginados(user_id, limite, offset, tipo=tipo)
    total = await db.contar_movimientos_total(user_id, tipo=tipo)

    return {
        "total": total,
        "movimientos": [
            {
                "id": m[0],
                "descripcion": m[1],
                "monto": m[2],
                "tipo": m[3],
                "categoria": m[4],
                "fecha": m[5],
            }
            for m in movs
        ],
    }


@router.post("/movimientos")
async def crear_movimiento(mov: MovimientoIn, user_id: int = Depends(get_user_id)):
    """Crea un nuevo movimiento."""
    if mov.tipo not in ("ingreso", "egreso"):
        raise HTTPException(status_code=400, detail="Tipo debe ser 'ingreso' o 'egreso'")
    if mov.monto <= 0:
        raise HTTPException(status_code=400, detail="Monto debe ser mayor a 0")

    descripcion_segura = html.escape(mov.descripcion) if mov.descripcion else ""
    mov_id = await db.agregar_movimiento(user_id, mov.tipo, mov.monto, mov.categoria, descripcion_segura)
    return {"id": mov_id, "ok": True}


@router.put("/movimientos/{mov_id}")
async def editar_movimiento(mov_id: int, datos: MovimientoEdit, user_id: int = Depends(get_user_id)):
    """Edita el monto de un movimiento."""
    resultado = await db.editar_movimiento(user_id, mov_id, datos.nuevo_monto)
    if resultado is None:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return {"ok": True, "monto_anterior": resultado[1]}


@router.delete("/movimientos/{mov_id}")
async def borrar_movimiento(mov_id: int, user_id: int = Depends(get_user_id)):
    """Borra un movimiento."""
    resultado = await db.borrar_por_id(user_id, mov_id)
    if resultado is None:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return {"ok": True, "descripcion": resultado[0], "monto": resultado[1]}


@router.get("/movimientos/buscar")
async def buscar_movimientos(
    texto: str = Query(..., min_length=1),
    user_id: int = Depends(get_user_id),
):
    """Busca movimientos por texto."""
    movs = await db.buscar_movimientos(user_id, texto)
    return {
        "resultados": [
            {
                "id": m[0],
                "fecha": m[1],
                "tipo": m[2],
                "monto": m[3],
                "categoria": m[4],
                "descripcion": m[5],
            }
            for m in movs
        ]
    }


@router.get("/movimientos/top")
async def top_gastos(user_id: int = Depends(get_user_id)):
    """Top 5 gastos del mes."""
    top = await db.get_top_gastos(user_id)
    return {
        "top": [
            {
                "id": t[0],
                "descripcion": t[1],
                "monto": t[2],
                "categoria": t[3],
                "fecha": t[4],
            }
            for t in top
        ]
    }


# ── PRESUPUESTOS / METAS ─────────────────────────────────

@router.get("/presupuestos")
async def ver_presupuestos(user_id: int = Depends(get_user_id)):
    """Estado de todos los presupuestos."""
    pres = await db.get_presupuestos_estado(user_id)
    return {
        "presupuestos": [
            {
                "categoria": p[0],
                "maximo": p[1],
                "gastado": p[2],
                "porcentaje": round((p[2] / p[1]) * 100, 1) if p[1] > 0 else 0,
            }
            for p in pres
        ]
    }


@router.post("/presupuestos")
async def crear_presupuesto(pres: PresupuestoIn, user_id: int = Depends(get_user_id)):
    """Fija o actualiza un presupuesto."""
    await db.set_presupuesto(user_id, pres.categoria, pres.monto)
    return {"ok": True}


@router.delete("/presupuestos/{categoria}")
async def borrar_presupuesto(categoria: str, user_id: int = Depends(get_user_id)):
    """Borra un presupuesto."""
    try:
        await db.borrar_presupuesto(user_id, categoria)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── METAS DE AHORRO ──────────────────────────────────────

@router.get("/metas")
async def listar_metas(user_id: int = Depends(get_user_id)):
    """Lista metas de ahorro."""
    metas = await db.get_metas_ahorro(user_id)
    return {
        "metas": [
            {
                "id": m[0],
                "nombre": m[2],
                "objetivo": m[3],
                "actual": m[4],
                "porcentaje": round((m[4] / m[3]) * 100, 1) if m[3] > 0 else 0,
            }
            for m in metas
        ] if metas else []
    }


@router.post("/metas")
async def crear_meta(meta: MetaIn, user_id: int = Depends(get_user_id)):
    """Crea una nueva meta de ahorro."""
    nombre_seguro = html.escape(meta.nombre)
    meta_id = await db.crear_meta(user_id, nombre_seguro, meta.objetivo)
    return {"id": meta_id, "ok": True}


@router.post("/metas/{meta_id}/aportar")
async def aportar_meta(meta_id: int, aporte: AporteIn, user_id: int = Depends(get_user_id)):
    """Aporta dinero a una meta."""
    resultado = await db.aportar_meta(user_id, meta_id, aporte.monto)
    return {"ok": True}


# ── SUSCRIPCIONES ─────────────────────────────────────────

@router.get("/suscripciones")
async def listar_suscripciones(user_id: int = Depends(get_user_id)):
    """Lista suscripciones/gastos fijos."""
    subs = await db.get_suscripciones_usuario(user_id)
    return {
        "suscripciones": [
            {
                "id": s[0],
                "nombre": s[2],
                "monto": s[3],
                "dia_cobro": s[4],
                "categoria": s[5],
            }
            for s in subs
        ] if subs else []
    }


# ── INVERSIONES ───────────────────────────────────────────

@router.get("/inversiones")
async def listar_inversiones(user_id: int = Depends(get_user_id)):
    """Lista inversiones del usuario."""
    invs = await db.get_inversiones(user_id)
    return {
        "inversiones": [
            {
                "id": i[0],
                "tipo": i[2],
                "ticker": i[3],
                "cantidad": i[4],
            }
            for i in invs
        ] if invs else []
    }


# ── DÓLAR ─────────────────────────────────────────────────

@router.get("/dolar")
async def cotizacion_dolar():
    """Cotización del dólar (no requiere auth)."""
    todas = await get_todas_cotizaciones()
    if not todas:
        raise HTTPException(status_code=503, detail="No se pudo obtener la cotización")

    resultado = {}
    for casa, data in todas.items():
        resultado[casa] = {
            "compra": data.get("compra"),
            "venta": data.get("venta"),
            "nombre": data.get("nombre", casa),
            "fecha": data.get("fechaActualizacion"),
        }

    return resultado


@router.get("/categorias")
async def listar_categorias(
    user_id: int = Depends(get_user_id),
    tipo: str = Query("egreso")
):
    cats = await db.get_categorias_usuario(user_id, tipo=tipo)
    return {"categorias": cats}


@router.post("/categorias")
async def agregar_categoria(body: CategoriaIn, user_id: int = Depends(get_user_id)):
    if not body.nombre or len(body.nombre.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nombre muy corto")
    nombre_seguro = html.escape(body.nombre.strip())
    await db.add_categoria_custom(user_id, nombre_seguro, body.tipo)
    return {"ok": True}


@router.delete("/categorias/{nombre}")
async def borrar_categoria(nombre: str, tipo: str = Query("egreso"), user_id: int = Depends(get_user_id)):
    await db.delete_categoria_custom(user_id, nombre, tipo)
    return {"ok": True}

# ── IA / CHAT ─────────────────────────────────────────────

@router.get("/ia/limits")
async def get_ia_limits(user_id: int = Depends(get_user_id)):
    """Retorna cuántos usos tiene el usuario y cuál es el límite (dinámico según plan)."""
    usos = await db.obtener_usos_ia(user_id)
    pro = await db.usuarios.es_pro(user_id)
    limite = LIMITE_IA_PRO if pro else LIMITE_IA_FREE
    return {
        "usos": usos,
        "limite": limite,
        "es_pro": pro
    }

@router.post("/ia/chat")
async def chat_ia(chat_data: ChatIn, user_id: int = Depends(get_user_id)):
    """Endpoint para chatear con Manguito IA sobre finanzas."""
    pro = await db.usuarios.es_pro(user_id)
    limite = LIMITE_IA_PRO if pro else LIMITE_IA_FREE
    usos_actuales = await db.obtener_usos_ia(user_id)

    if usos_actuales >= limite:
        raise HTTPException(status_code=429, detail="Límite diario de IA alcanzado.")

    if not client:
        raise HTTPException(status_code=503, detail="El servicio de IA (Gemini) no está configurado.")

    prompt_sistema = (
        "Sos Manguito, un asistente financiero amigable de Argentina experto en finanzas personales, "
        "ahorro e inversiones. Respondé de forma breve (máximo 3-4 oraciones), clara y cordial. "
        "Si te preguntan algo fuera del ámbito financiero, respondé amablemente que solo podés ayudar con finanzas. "
        f"Pregunta del usuario: {chat_data.mensaje}"
    )

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=prompt_sistema,
        )
        
        texto_respuesta = response.text if response.text else "No pude procesar la consulta."
        
        # Registrar el uso en la DB
        await rate_limiter.registrar_uso(user_id)
        
        return {
            "respuesta": texto_respuesta,
            "usos": usos_actuales + 1,
            "limite": limite
        }

    except Exception as e:
        logger.error(f"Error en /api/ia/chat: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor al contactar a la IA.")


@router.get("/exportar/excel")
async def exportar_excel(user_id: int = Depends(get_user_id)):
    """Genera un Excel con los movimientos del usuario (solo PRO)."""
    import io
    pro = await db.usuarios.es_pro(user_id)
    if not pro:
        raise HTTPException(status_code=403, detail="Esta función es exclusiva para usuarios PRO.")

    try:
        import openpyxl
        from fastapi.responses import StreamingResponse
    except ImportError:
        raise HTTPException(status_code=503, detail="Módulo de Excel no disponible.")

    movimientos = await db.get_movimientos(user_id, limit=500)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Movimientos"
    ws.append(["Fecha", "Tipo", "Categoría", "Descripción", "Monto"])

    for m in movimientos:
        ws.append([
            m.get('fecha', ''),
            m.get('tipo', ''),
            m.get('categoria', ''),
            m.get('descripcion', ''),
            m.get('monto', 0)
        ])

    # Auto-adjust column widths
    for col in ws.columns:
        max_length = max(len(str(cell.value or '')) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_length + 4, 30)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=manguito_movimientos.xlsx"}
    )


# ── VERSIÓN & ERROR REPORTING ─────────────────────────────

APP_VERSION = "1.6.0"

@router.get("/version")
async def get_version():
    """Devuelve la versión actual de la app para forzar actualizaciones."""
    return {"version": APP_VERSION}


class ErrorReport(BaseModel):
    mensaje: str
    archivo: Optional[str] = None
    linea: Optional[int] = None
    columna: Optional[int] = None
    stack: Optional[str] = None
    userAgent: Optional[str] = None
    url: Optional[str] = None

@router.post("/errores")
async def reportar_error(error: ErrorReport, request: Request):
    """Recibe reportes de errores del frontend para monitoreo."""
    ip = request.client.host if request.client else "unknown"
    logger.error(
        f"🐛 ERROR CLIENTE [{ip}]: {error.mensaje} "
        f"| Archivo: {error.archivo}:{error.linea}:{error.columna} "
        f"| UA: {error.userAgent} "
        f"| URL: {error.url}"
    )
    if error.stack:
        logger.error(f"   Stack: {error.stack[:500]}")
    return {"ok": True}

