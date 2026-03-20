"""
handlers/comandos.py — Comandos básicos y administrativos.

Funciones: /start, /ayuda, /donar, /privacidad, /sugerencia,
/premium, /activar_pro, /id, /usuarios, /backup
"""

import os
import random
import asyncio
import logging
from datetime import datetime, timedelta

from telegram import Update
from telegram.ext import ContextTypes

from db import db
from core.config import config
from utils.textos import PRECIO_PRO
from utils.decoradores import admin_only
from handlers.comunes import teclado_principal, teclado_volver, msg_necesita_pro, LINK_DONACION, teclado_navegacion

logger = logging.getLogger('Manguito')


async def menu_ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    nombre = update.effective_user.first_name or "Crack"
    user_id = update.effective_user.id
    username = update.effective_user.username
    
    # Auto-registrar usuario
    await db.registrar_usuario(user_id, nombre, username)
    
    # Anclar la app bar persistente
    await update.message.reply_text("🥭", reply_markup=teclado_navegacion())
    
    # Verificar si es usuario nuevo o existente
    ingresos, gastos = await db.get_resumen_mensual(user_id)
    
    if ingresos > 0 or gastos > 0:
        # ── USUARIO EXISTENTE: Dashboard con gráfico ──
        saldo = ingresos - gastos
        emoji_saldo = "📈" if saldo >= 0 else "📉"
        racha = await db.get_racha(user_id)
        racha_txt = f"🔥 Racha: *{racha} día{'s' if racha != 1 else ''}*\n" if racha > 0 else ""
        
        # Intentar enviar gráfico de dona
        try:
            datos_grafico = await db.get_datos_analisis(user_id)
            if datos_grafico and len(datos_grafico) >= 2:
                from servicios.reportes import generar_grafico_premium
                chart = await asyncio.to_thread(generar_grafico_premium, datos_grafico)
                if chart:
                    await update.message.reply_photo(photo=chart)
        except Exception as e:
            logger.debug(f"No se pudo generar gráfico en start: {e}")
        
        mensaje = (
            f"👋 *¡Bienvenido de nuevo, {nombre}!*\n"
            f"{'─' * 22}\n\n"
            f"{racha_txt}"
            f"🟢 Ingresos: *${ingresos:,.0f}*\n"
            f"🔴 Gastos: *${gastos:,.0f}*\n"
            f"{emoji_saldo} Balance: *${saldo:,.0f}*\n\n"
            "¿Qué querés hacer? 👇"
        )
        await update.message.reply_text(mensaje, parse_mode='Markdown', reply_markup=teclado_principal())
    else:
        # ── USUARIO NUEVO: Onboarding ──
        mensaje = (
            f"👋 *¡Hola {nombre}! Soy Manguito* 🥭\n\n"
            "Tu asistente financiero personal con IA.\n"
            "Olvidate de las planillas aburridas.\n\n"
            "✍️ *Podés decirme cosas como:*\n"
            "• _Gasté 5000 en un café_\n"
            "• _Cobré 200000 de sueldo_\n\n"
            "🎙️ O mandame un *audio* mientras caminás.\n"
            "📸 O la *foto de un ticket* de compra.\n\n"
            "¡Tocá el botón para arrancar! 👇"
        )
        from telegram import InlineKeyboardMarkup, InlineKeyboardButton
        teclado_intro = InlineKeyboardMarkup([
            [InlineKeyboardButton("🚀 Entrar a Manguito", callback_data="cmd_menu")]
        ])
        await update.message.reply_text(mensaje, parse_mode='Markdown', reply_markup=teclado_intro)

async def cmd_ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra la lista completa de comandos."""
    mensaje = (
        "🥭 *MANGUITO — GUÍA DE USO*\n"
        "────────────────────\n\n"
        "💡 *1. Anotar Gastos Rápidos*\n"
        "Podés mandarme mensajes como si fueras un amigo:\n"
        "• ✍️ _Gasté 1500 en café_\n"
        "• 💳 _zapatillas 60000 en 3 cuotas_\n"
        "• 🎙️ *(Audio)* _Grabá una nota de voz_\n"
        "• 📸 *(Foto)* _Mandame foto de un ticket_\n\n"
        "🛠️ *2. Comandos Principales*\n"
        "• `/resumen` → 📊 Balance del mes y presupuestos\n"
        "• `/dolar` → 💵 Cotización del Blue y MEP\n"
        "• `/historial [Categoría]` → 📝 Tus últimos gastos\n"
        "• `/metas` → 🎯 Ver presupuestos activos\n"
        "• `/exportar` → 📤 Bajar todo a Excel con gráficos\n\n"
        "⚙️ *3. Ajustes y Fijos*\n"
        "• `/fijo Netflix 5000 10` → 🔄 Suscripción cada día 10\n"
        "• `/presupuesto Comida 50000` → 🚨 Tope mensual\n\n"
        "👇 _Si te perdés, usá los botones del menú abajo 👇_"
    )
    await update.message.reply_text(mensaje, parse_mode='Markdown')

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_name = update.effective_user.first_name
    user_id = update.effective_user.id
    
    # Activar trial PRO para usuarios nuevos
    trial_activado = await db.activar_trial(user_id)
    
    msg = f"¡Buenas! 👋 Soy Manguito, tu nuevo asistente financiero con IA. Nada de planillas aburridas ni menús complicados.\n\n"
    msg += f"Conmigo podés llevar tus números al día como si chatearas con un amigo. Mirá todo lo que hago:\n\n"
    msg += f"🎙️ *Anoto todo al vuelo*: Mandame un audio (\"Gasté 5 lucas en el chino\") o una foto del ticket, y yo hago la matemática.\n"
    msg += f"🐮 *Divido las cuentas*: ¿Salieron a comer? Te calculo cuánto pone cada uno y te armo el texto para cobrarles.\n"
    msg += f"📈 *Cuido tu plata*: Llevo tu portafolio de CEDEARs y Criptos en tiempo real.\n"
    msg += f"🧠 *Te asesoro*: Pedime un consejo sobre tus números cuando quieras en el menú de Herramientas.\n\n"
    
    if trial_activado:
        msg += "🎁 *¡REGALO DE BIENVENIDA!*\n"
        msg += "Tenés *30 días gratis de Plan PRO* ⭐️\n"
        msg += "(Incluye límite ampliado de IA, Excel y audios largos)\n\n"
        
    tips = [
        "💡 *Tip:* Pedime '/dolar' para ver la cotización al instante.",
        "💡 *Tip:* Podés registrar gastos con notas de voz largas.",
        "💡 *Tip:* Mandá foto del ticket y yo extraigo el total.",
        "💡 *Tip:* Usá '/presupuesto' para no pasarte del límite mensual."
    ]
    tip_random = random.choice(tips)

    msg += f"Para arrancar, simplemente escribime tu primer gasto o ingreso, o usá los botones de acá abajo. 👇\n\n{tip_random}"

    await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=teclado_principal())

async def donar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = "❤️ *¿Te gusta este bot?*\n\n"
    msg += "Este bot es 100% gratuito y siempre lo será.\n"
    msg += "Si te sirve y querés dar una mano para\n"
    msg += "mantenerlo funcionando, podés invitarme\n"
    msg += "un cafecito:\n\n"
    msg += f"☕ {LINK_DONACION}\n\n"
    msg += "_No es obligatorio, pero se agradece mucho._\n"
    msg += "¡Gracias por usar Manguito! 🙏"
    await update.message.reply_text(msg, parse_mode='Markdown')

async def privacidad(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = "🛡️ *POLÍTICA DE PRIVACIDAD Y SEGURIDAD* 🛡️\n"
    msg += "─────────────────────────\n\n"
    msg += "Tu confianza es lo más importante para nosotros. Acá te dejamos en claro cómo cuidamos tu data:\n\n"
    msg += "🔐 *100% Privado:* Nadie más tiene acceso a tus números ni informes.\n"
    msg += "📦 *Celdas Aisladas:* Cada usuario corre sobre una partición de base de datos separada.\n"
    msg += "🤖 *Análisis Limpio:* La IA procesa y olvida. No entrenamos ningún modelo con tus textos.\n"
    msg += "📤 *Dueño de tu Data:* Podés exportar un Excel o vaciar la cuenta con 1 clic en el menú.\n\n"
    msg += "_Nosotros no vendemos datos, vendemos tranquilidad._ 🧘‍♂️"
    await update.message.reply_text(msg, parse_mode='Markdown')

async def recibir_sugerencia(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    nombre = update.effective_user.first_name
    
    if not context.args:
        await update.message.reply_text("💡 Uso: `/sugerencia [Tu mensaje]`\nEj: `/sugerencia Agreguen pagos en cuotas`", parse_mode='Markdown')
        return
    
    mensaje = " ".join(context.args)
    await db.agregar_feedback(user_id, mensaje)
    
    msg = f"🌟 *¡Gracias por tu aporte, {nombre}!*\n\n"
    msg += "He guardado tu sugerencia de forma segura.\nTus comentarios nos ayudan muchísimo a hacer que Manguito sea mejor y más brillante cada día. 🚀"
    
    await update.message.reply_text(msg, parse_mode='Markdown')

async def leer_feedback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    feedbacks = await db.get_feedback()
    if not feedbacks:
        await update.message.reply_text("📭 No hay sugerencias nuevas.")
        return
    
    msg = "📥 *Buzón de Sugerencias*\n\n"
    for uid, fecha, texto in feedbacks:
        try:
            fecha_corta = fecha[5:10] # MM-DD
        except Exception:
            fecha_corta = "--"
            
        msg += f"👤 User {uid} ({fecha_corta}):\n"
        msg += f"💬 _{texto}_\n"
        msg += "─" * 20 + "\n"
    
    await update.message.reply_text(msg, parse_mode='Markdown')

@admin_only
async def backup_manual(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /backup para forzar envío de la DB."""
    try:
        await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="upload_document")
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M')
        filename = f"backup_manual_{timestamp}.db"
        await db.backup_db(filename)
        
        with open(filename, 'rb') as f:
            await update.message.reply_document(
                document=f,
                filename=filename,
                caption="💾 *Backup Manual generado*",
                parse_mode='Markdown'
            )
        os.remove(filename)
    except Exception as e:
        await update.message.reply_text(f"\u274c Error generando backup: {e}")

async def cmd_premium(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra el estado del plan y link de pago."""
    user_id = update.effective_user.id
    plan, dias, fecha_venc = await db.info_plan(user_id)
    
    if plan == 'pro':
        msg = "\u2b50 *PLAN PRO ACTIVO* \u2b50\n\n"
        msg += f"\U0001F4C5 Vence en: *{dias} d\u00edas*\n"
        msg += "\U0001F513 Ten\u00e9s acceso a TODAS las funciones\n\n"
        msg += "\u00a1Gracias por apoyar el proyecto! \U0001F64F"
    
    elif plan == 'trial':
        msg = "\U0001F381 *TRIAL PRO ACTIVO*\n\n"
        msg += f"\u23f3 Te quedan *{dias} d\u00edas* de prueba gratis\n\n"
        msg += "\U0001F513 *Funciones PRO incluidas:*\n"
        msg += "\u2022 \U0001F9E0 An\u00e1lisis IA personalizado\n"
        msg += "\u2022 \U0001F4CA Excel con gr\u00e1ficos profesionales\n"
        msg += "\u2022 \U0001F4F8 Fotos de tickets\n"
        msg += "\u2022 \U0001F3A4 Notas de voz\n"
        msg += "\u2022 \U0001F50D B\u00fasqueda de movimientos\n"
        msg += "\u2022 Y mucho m\u00e1s...\n\n"
        msg += f"\U0001F525 *\u00bfQuer\u00e9s seguir despu\u00e9s del trial?*\n"
        msg += f"Plan PRO: *{PRECIO_PRO}*\n"
        msg += f"\u2615 {LINK_DONACION}"
    
    else: # free
        msg = "\U0001F512 *PLAN GRATUITO*\n\n"
        msg += "Ten\u00e9s acceso b\u00e1sico:\n"
        msg += "\u2022 \u2705 Registrar gastos e ingresos (30/mes)\n"
        msg += "\u2022 \u2705 Ver resumen mensual\n"
        msg += "\u2022 \u2705 Racha de registro\n\n"
        msg += "\u274c An\u00e1lisis IA\n"
        msg += "\u274c Exportar Excel\n"
        msg += "\u274c Fotos de tickets\n"
        msg += "\u274c Notas de voz\n\n"
        msg += f"\u2b50 *Activ\u00e1 PRO por {PRECIO_PRO}:*\n"
        msg += f"\u2615 {LINK_DONACION}\n\n"
        msg += "\U0001F4F2 *Pasos para activar:*\n"
        msg += "1\u20e3 Don\u00e1 en el link de arriba\n"
        msg += "2\u20e3 Mand\u00e1 el comprobante/screenshot ac\u00e1 al bot\n"
        msg += "3\u20e3 Te lo activo en minutos \U0001F680"
    
    await update.message.reply_text(msg, parse_mode='Markdown')

@admin_only
async def admin_activar_pro(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Admin activa PRO para un usuario por 1 mes. Uso: /activar_pro USER_ID"""
    
    if not context.args or len(context.args) < 1:
        await update.message.reply_text("Uso: `/activar_pro USER_ID`\nActiva PRO por *1 mes* (30 d\u00edas)", parse_mode='Markdown')
        return
    
    try:
        target_user = int(context.args[0])
        await db.activar_pro(target_user, meses=1) # Siempre 1 mes
        
        vencimiento = (datetime.now() + timedelta(days=30)).strftime('%d/%m/%Y')
        await update.message.reply_text(
            f"\u2705 *PRO activado por 1 MES*\n"
            f"Usuario: `{target_user}`\n"
            f"Vence: *{vencimiento}*",
            parse_mode='Markdown'
        )
        # Notificar al usuario
        try:
            await context.bot.send_message(
                chat_id=target_user,
                text=f"\U0001F389 *\u00a1Tu Plan PRO fue activado!* \u2b50\n\n"
                     f"\U0001F4C5 Duraci\u00f3n: *1 mes* (hasta el {vencimiento})\n\n"
                     f"\U0001F513 Ten\u00e9s acceso completo a:\n"
                     f"\u2022 \U0001F9E0 An\u00e1lisis IA\n"
                     f"\u2022 \U0001F4CA Excel con gr\u00e1ficos\n"
                     f"\u2022 \U0001F4F8 Fotos de tickets\n"
                     f"\u2022 \U0001F3A4 Notas de voz\n"
                     f"\u2022 Y mucho m\u00e1s...\n\n"
                     f"\u00a1Disfrutalo! \U0001F680",
                parse_mode='Markdown'
            )
        except Exception:
            pass # Si no se puede notificar, no importa
    except ValueError:
        await update.message.reply_text("\u274c ID de usuario inv\u00e1lido.")

async def cmd_mi_id(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra al usuario su ID de Telegram."""
    user = update.effective_user
    plan, dias, _ = await db.info_plan(user.id)
    
    plan_emoji = {"pro": "\u2b50 PRO", "trial": "\U0001F381 Trial PRO", "free": "\U0001F512 Gratuito"}
    plan_txt = plan_emoji.get(plan, "\U0001F512 Gratuito")
    
    msg = "\U0001F4CB *Tu informaci\u00f3n*\n\n"
    msg += f"\U0001F194 Tu ID: `{user.id}`\n"
    msg += f"\U0001F464 Nombre: *{user.first_name}*\n"
    if user.username:
        msg += f"\U0001F465 Usuario: @{user.username}\n"
    msg += f"\U0001F4E6 Plan: *{plan_txt}*\n"
    if plan in ('trial', 'pro') and dias > 0:
        msg += f"\u23f3 Vence en: *{dias} d\u00edas*"
    
    await update.message.reply_text(msg, parse_mode='Markdown')

# --- COMANDO /usuarios (ADMIN) ---
@admin_only
async def admin_ver_usuarios(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Admin: lista o busca usuarios registrados."""
    
    if context.args:
        # Buscar por nombre
        texto = " ".join(context.args)
        usuarios = await db.buscar_usuarios_por_nombre(texto)
        titulo = f"\U0001F50D *Usuarios que coinciden con \"{texto}\"*"
    else:
        # Listar todos
        usuarios = await db.get_todos_usuarios_registrados()
        titulo = "\U0001F465 *TODOS LOS USUARIOS*"
    
    if not usuarios:
        await update.message.reply_text("\U0001F645 No se encontraron usuarios.", parse_mode='Markdown')
        return
    
    plan_emoji = {"pro": "\u2b50", "trial": "\U0001F381", "free": "\U0001F512"}
    
    msg = f"{titulo}\n"
    msg += f"_{len(usuarios)} resultado(s)_\n"
    msg += "\u2500" * 22 + "\n\n"
    
    for uid, nombre, username, ultima, plan in usuarios:
        emoji = plan_emoji.get(plan, "\U0001F512")
        user_tag = f" (@{username})" if username else ""
        try:
            ultima_str = datetime.strptime(ultima, '%Y-%m-%d %H:%M:%S').strftime('%d/%m %H:%M')
        except Exception:
            ultima_str = "--"
        
        msg += f"{emoji} *{nombre}*{user_tag}\n"
        msg += f"    ID: `{uid}`\n"
        msg += f"    Plan: {plan} | \u00daltimo: {ultima_str}\n\n"
    
    msg += "\u2500" * 22 + "\n"
    msg += "_Para activar PRO:_ `/activar_pro ID`"
    
    await update.message.reply_text(msg, parse_mode='Markdown')

# --- COMANDO /actualizacion (ADMIN) ---
@admin_only
async def admin_enviar_actualizacion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Admin: envía un mensaje de actualización a todos los usuarios con un botón para refrescar el menú."""
    
    if not context.args:
        await update.message.reply_text("Uso: `/actualizacion [Mensaje de la actualización]`", parse_mode='Markdown')
        return
        
    mensaje_actualizacion = " ".join(context.args)
    usuarios = await db.get_todos_usuarios_registrados()
    
    if not usuarios:
        await update.message.reply_text("❌ No hay usuarios registrados a los que enviar el mensaje.")
        return
        
    # Teclado con botón interactivo
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup
    keyboard = [[InlineKeyboardButton("¡Actualizar menú ahora! 🔄", callback_data="actualizar_menu")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Texto a enviar
    texto = "🚀 *¡NUEVA ACTUALIZACIÓN DE MANGUITO!*\n"
    texto += "─" * 22 + "\n\n"
    texto += f"{mensaje_actualizacion}\n\n"
    texto += "¿Todo listo para probar lo nuevo? Tocá el botón de abajo para actualizar tu menú. 👇"
    
    # Progreso
    status_msg = await update.message.reply_text(f"⏳ Enviando actualización a {len(usuarios)} usuarios...\nEsto puede tardar un momento.")
    
    enviados = 0
    fallidos = 0
    
    for uid, _, _, _, _ in usuarios:
        try:
            await context.bot.send_message(
                chat_id=uid,
                text=texto,
                parse_mode='Markdown',
                reply_markup=reply_markup
            )
            enviados += 1
        except Exception as e:
            # Ignorar usuarios que bloquearon el bot o no existen
            logger.debug(f"Fallo al enviar actualización a {uid}: {e}")
            fallidos += 1
            
        # Pequeña pausa para evitar rate limits fuertes (opcional)
        await asyncio.sleep(0.05)
            
    # Resumen final
    await status_msg.edit_text(
        f"✅ *Actualización completada*\n\n"
        f"📤 Enviados exitosamente: {enviados}\n"
        f"❌ Fallidos (Bot bloqueado/borrado): {fallidos}",
        parse_mode='Markdown'
    )


async def cmd_web(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Genera un link con token para acceder al dashboard web."""
    user_id = update.effective_user.id
    nombre = update.effective_user.first_name or "Crack"

    from api.auth import generar_token
    token = generar_token(user_id)

    # Ahora que el bot está en producción en Render, usamos directamente la URL final.
    # Si quisieras volver a Ngrok/Localhost, podrías usar la lógica anterior de config.PUBLIC_URL
    from core.config import config
    url = config.PUBLIC_URL or "https://manguito.onrender.com"

    msg = (
        f"🌐 *MANGUITO WEB*\n"
        f"─────────────────\n\n"
        f"¡Hola {nombre}! Tu dashboard está activo.\n\n"
        f"🔑 *Tu Código de Acceso:* \n`{token}`\n\n"
        f"*(Tocá el código para copiarlo)*\n\n"
        f"Entrá a la web con el botón de abajo y pegalo para iniciar sesión de forma segura."
    )

    from telegram import InlineKeyboardButton, InlineKeyboardMarkup
    teclado = InlineKeyboardMarkup([
        [InlineKeyboardButton("🚀 Abrir Dashboard", url=f"{url}?token={token}")],
    ])

    await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=teclado)