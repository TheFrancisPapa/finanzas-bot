"""
telegram_bot.py — Punto de entrada del bot de Telegram.

Responsabilidad única: inicializar la aplicación, registrar handlers
y lanzar el polling. Toda la lógica de negocio vive en handlers/.
"""

import logging
import threading
import os
import unicodedata
from logging.handlers import RotatingFileHandler
from datetime import time
from http.server import HTTPServer, BaseHTTPRequestHandler

from telegram.ext import (
    ApplicationBuilder, MessageHandler,
    CommandHandler, CallbackQueryHandler, filters
)
from telegram.request import HTTPXRequest

from core.config import config
from db import db
from servicios import LIMITE_IA_DIARIO


# --- Handlers ---
from handlers.comandos import (
    menu_ayuda, cmd_ayuda, start, donar, privacidad,
    recibir_sugerencia, leer_feedback, backup_manual,
    cmd_premium, admin_activar_pro, cmd_mi_id, admin_ver_usuarios,
    admin_enviar_actualizacion, cmd_web,
)
from handlers.consultas import (
    resumen, exportar_datos, ver_historial,
    buscar_movimiento, editar_movimiento, ver_dolar,
    analizar_sentimiento
)
from handlers.movimientos import (
    analizar_gastos, analizar_foto, analizar_audio,
    manejar_mensaje, borrar_ultimo, conv_auditoria_handler
)
from handlers.configuracion import (
    fijar_presupuesto, ver_presupuestos,
    fijar_gasto_recurrente, ver_mis_fijos, borrar_fijo,
    borrar_presupuesto, cambiar_moneda, toggle_notificaciones
)
from handlers.comunes import teclado_principal, teclado_volver
from handlers.registro_guiado import conv_registro_handler
from handlers.consultoria import conv_consultoria_handler
from handlers.edicion_visual import conv_edicion_handler
from handlers.vaquita import conv_vaquita_handler
from handlers.metas_ahorro import conv_metas_handler
from handlers.servicios_variables import conv_variables_handler
from handlers.reglas_flash import conv_flash_handler
from handlers.cuenta import menu_perfil, confirmar_borrado, ejecutar_borrado
from core.errores import error_handler
from handlers.callbacks import callback_handler
from handlers.convivencia import conv_convivencia_handler, callback_convivencia
from handlers.oraculo import callback_oraculo
from handlers.jobs import (
    check_suscripciones_diarias, resumen_semanal_auto,
    recordatorio_nocturno, enviar_backup_db, enviar_tips_trial,
    check_servicios_variables,
    cierre_mensual,
)

# --- LOGGING ---
os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        RotatingFileHandler(
            'logs/manguito.log',
            maxBytes=5 * 1024 * 1024,  # 5 MB
            backupCount=2,
            encoding='utf-8'
        ),
        logging.StreamHandler()
    ],
    force=True  # Fuerza la reconfiguración si main.py o algo ya inicializó el logging
)
logger = logging.getLogger('Manguito')

_health_server_started = False

def iniciar_telegram():
    global _health_server_started
    # Requiere pip install "python-telegram-bot[job-queue]" para JobQueue
    request = HTTPXRequest(connect_timeout=60, read_timeout=60)
    app = ApplicationBuilder().token(config.TELEGRAM_TOKEN).request(request).build()



    # ===============================
    #  REGISTRO DE COMMAND HANDLERS
    # ===============================
    app.add_handler(CommandHandler("start", menu_ayuda))
    app.add_handler(CommandHandler("ayuda", cmd_ayuda))
    app.add_handler(CommandHandler("help", cmd_ayuda))
    app.add_handler(CommandHandler("resumen", resumen))
    app.add_handler(CommandHandler("presupuesto", fijar_presupuesto))
    app.add_handler(CommandHandler("metas", ver_presupuestos))
    app.add_handler(CommandHandler("analisis", analizar_gastos))
    app.add_handler(CommandHandler("borrar", borrar_ultimo))
    app.add_handler(CommandHandler("exportar", exportar_datos))
    app.add_handler(CommandHandler("historial", ver_historial))
    app.add_handler(CommandHandler("editar", editar_movimiento))
    app.add_handler(CommandHandler("donar", donar))
    app.add_handler(CommandHandler("privacidad", privacidad))
    app.add_handler(CommandHandler("sugerencia", recibir_sugerencia))
    app.add_handler(CommandHandler("admin_leer", leer_feedback))
    app.add_handler(CommandHandler("dolar", ver_dolar)) 
    app.add_handler(CommandHandler("sentimiento", analizar_sentimiento))
    app.add_handler(CommandHandler("backup", backup_manual))
    app.add_handler(CommandHandler("buscar", buscar_movimiento))
    app.add_handler(CommandHandler("premium", cmd_premium))
    app.add_handler(CommandHandler("activar_pro", admin_activar_pro))
    app.add_handler(CommandHandler("id", cmd_mi_id))
    app.add_handler(CommandHandler("usuarios", admin_ver_usuarios))
    app.add_handler(CommandHandler("actualizacion", admin_enviar_actualizacion))
    app.add_handler(CommandHandler("web", cmd_web))
    
    # Comandos de suscripciones (con y sin guión bajo)
    app.add_handler(CommandHandler("fijo", fijar_gasto_recurrente))
    app.add_handler(CommandHandler("mis_fijos", ver_mis_fijos))
    app.add_handler(CommandHandler("misfijos", ver_mis_fijos))
    app.add_handler(CommandHandler("borrar_fijo", borrar_fijo))
    app.add_handler(CommandHandler("borrarfijo", borrar_fijo))
    app.add_handler(CommandHandler("borrar_presupuesto", borrar_presupuesto))
    app.add_handler(CommandHandler("moneda", cambiar_moneda))
    app.add_handler(CommandHandler("notificaciones", toggle_notificaciones))
    
    # ===============================
    #  CALLBACK HANDLERS
    # ===============================
    # ConversationHandlers van ANTES del handler genérico de callbacks
    app.add_handler(conv_edicion_handler)
    app.add_handler(conv_vaquita_handler)
    app.add_handler(conv_metas_handler)
    app.add_handler(conv_variables_handler)
    app.add_handler(conv_flash_handler)
    app.add_handler(conv_convivencia_handler)
    app.add_handler(conv_auditoria_handler)
    
    app.add_handler(CallbackQueryHandler(menu_perfil, pattern="^menu_perfil$"))
    app.add_handler(CallbackQueryHandler(confirmar_borrado, pattern="^perfil_borrar$"))
    app.add_handler(CallbackQueryHandler(ejecutar_borrado, pattern="^perfil_ejecutar_borrado$"))
    
    # Añadir los callbacks sueltos de convivencia (balance, desvincular)
    for handler in callback_convivencia:
        app.add_handler(handler)
        
    for handler in callback_oraculo:
        app.add_handler(handler)
        
    app.add_handler(CallbackQueryHandler(callback_handler))

    # ===============================
    #  JOBS AUTOMÁTICOS
    #  (horas en UTC → Argentina es UTC-3)
    # ===============================
    app.job_queue.run_daily(check_suscripciones_diarias, time=time(hour=12, minute=0))   # 09:00 ART
    app.job_queue.run_daily(resumen_semanal_auto, time=time(hour=13, minute=0))           # 10:00 ART (domingos)
    app.job_queue.run_daily(recordatorio_nocturno, time=time(hour=0, minute=0))            # 21:00 ART
    app.job_queue.run_daily(enviar_backup_db, time=time(hour=6, minute=0))                 # 03:00 ART
    app.job_queue.run_daily(enviar_tips_trial, time=time(hour=15, minute=0))               # 12:00 ART
    app.job_queue.run_daily(check_servicios_variables, time=time(hour=13, minute=30))       # 10:30 ART
    app.job_queue.run_daily(cierre_mensual, time=time(hour=13, minute=0))                    # 10:00 ART (Día 1)
    
    # ===============================
    #  CONVERSATION HANDLERS (GUIADOS)
    # ===============================
    app.add_handler(conv_consultoria_handler)
    app.add_handler(conv_registro_handler)

    # ===============================
    #  MESSAGE HANDLERS / ENRUTADOR
    # ===============================
    app.add_handler(MessageHandler(filters.PHOTO, analizar_foto))
    app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, analizar_audio))
    
    # Este handler procesa texto libre Y los botones del ReplyKeyboardMarkup
    async def enrutador_textos(update, context):
        texto = update.message.text

        # ── Categoría nueva (esperando input del usuario) ──
        if context.user_data.get('esperando_categoria'):
            context.user_data.pop('esperando_categoria', None)
            user_id = update.effective_user.id
            # Parsear "emoji nombre" o solo "nombre"
            partes = texto.strip().split(' ', 1)
            if len(partes) == 2 and len(partes[0]) <= 2:
                # Detectar si el primer carácter es emoji
                first_char = partes[0]
                cat_emoji = first_char
                cat_nombre = partes[1].strip()
            else:
                cat_emoji = '📌'
                cat_nombre = texto.strip()
            
            if len(cat_nombre) < 2 or len(cat_nombre) > 30:
                await update.message.reply_text("❌ El nombre debe tener entre 2 y 30 caracteres.")
                return
            
            ok = await db.categorias.agregar_categoria(user_id, cat_nombre, cat_emoji)
            if ok:
                await update.message.reply_text(
                    f"✅ Categoría *{cat_emoji} {cat_nombre}* creada!\n\n"
                    "Volvé a _Mi Cuenta → Mis Categorías_ para verla.",
                    parse_mode='Markdown',
                    reply_markup=teclado_volver()
                )
            else:
                await update.message.reply_text(f"⚠️ La categoría *{cat_nombre}* ya existe.", parse_mode='Markdown')
            return

        if texto == "➕ Anotar Gasto":
            return await update.message.reply_text(
                "➕ *Anotá tu gasto*\n\nEscribime qué gastaste (ej: _Comida 5000_), \nmandame un audio 🎙️, o la foto del ticket 📸.",
                parse_mode='Markdown'
            )
        elif texto == "💵 Dólar Hoy":
            return await ver_dolar(update, context)
        elif texto in ("🌐 WEB", "📊 Resumen"):
            return await cmd_web(update, context)
        elif texto == "📋 Menú":
            return await update.message.reply_text(
                "🥭 *MENÚ PRINCIPAL*\n¿Qué querés hacer?",
                parse_mode='Markdown',
                reply_markup=teclado_principal()
            )
        else:
            return await manejar_mensaje(update, context)
            
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), enrutador_textos))

    # ===============================
    #  ERRORES GLOBALES (Crash Handler)
    # ===============================
    app.add_error_handler(error_handler)

    # ===============================
    #  HEALTH CHECK SERVER (opcional)
    # ===============================
    # En Render solo se puede exponer un puerto ($PORT), el cual ya usa FastAPI.
    # El health check del bot es redundante en este caso.
    is_render = os.environ.get("RENDER") == "true"
    if not _health_server_started and not is_render:
        class HealthHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"Manguito Bot v9.0 - OK")
            def log_message(self, format, *args):
                pass  # Silenciar logs del health check
        
        port = config.PORT_TELEGRAM
        try:
            health_server = HTTPServer(('0.0.0.0', port), HealthHandler)
            threading.Thread(target=health_server.serve_forever, daemon=True).start()
            logger.info(f"Health check en puerto {port}")
        except Exception as e:
            logger.warning(f"No se pudo iniciar el health check: {e}")
        
        _health_server_started = True
    elif is_render:
        logger.info("Health check de Telegram desactivado (usando FastAPI en $PORT)")

    logger.info(f"Manguito Bot v9.0 Iniciado | Límite IA: {LIMITE_IA_DIARIO} msgs/día por usuario")
    print(f"Manguito Bot v9.0 Iniciado | Limite IA: {LIMITE_IA_DIARIO} msgs/dia por usuario")
    
    import telegram.error
    import time as time_module
    
    intentos = 0
    while True:
        try:
            logger.info("Iniciando polling de Telegram...")
            app.run_polling(drop_pending_updates=True)
            break # Si sale normal (Ctrl+C), rompemos el loop
        except telegram.error.Conflict as e:
            intentos += 1
            logger.warning(f"Telegram Bot Conflict: Otra instancia está corriendo (intento {intentos}). Reintentando en 10s...")
            time_module.sleep(10)
        except telegram.error.NetworkError as e:
            logger.warning(f"Network error en Telegram: {e}. Reintentando en 5s...")
            time_module.sleep(5)
        except Exception as e:
            logger.error(f"Error fatal en polling: {e}")
            time_module.sleep(15)

if __name__ == '__main__':
    iniciar_telegram()

"""
LISTA DE COMANDOS PARA BOTFATHER:
---------------------------------
start - Menú principal y tutorial
ayuda - Muestra los comandos disponibles
resumen - Balance del mes y proyección
analisis - Análisis IA de tus gastos
presupuesto - Fijar presupuesto (Ej: /presupuesto Comida 50000)
metas - Ver el semáforo de metas
historial - Ver gastos por categoría
fijo - Agregar gasto fijo (Ej: /fijo Netflix 5000 10)
misfijos - Ver suscripciones activas
borrar_fijo - Eliminar una suscripción (Ej: /borrar_fijo 3)
borrar - Borrar tu último movimiento
editar - Editar importe (Ej: /editar 15 3500)
sugerencia - Mandar una sugerencia
exportar - Descargar Excel completo
dolar - Cotización del dólar
donar - Invitame un cafecito
privacidad - Política de privacidad
buscar - Buscar movimientos por texto (Ej: /buscar pizza)
premium - Ver tu plan y activar PRO
id - Ver tu ID y tu plan actual
"""

# NOTA: Agregar ADMIN_ID=tu_user_id_de_telegram en el .env para poder usar /activar_pro