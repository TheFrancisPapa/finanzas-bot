"""
handlers/metas_ahorro.py — Sistema de Metas de Ahorro interactivo.

Incluye:
- Vista principal con barras de progreso.
- ConversationHandler para crear nueva meta (nombre + objetivo).
- ConversationHandler para aportar a una meta existente.
- Borrado de metas con confirmación.

Todo unificado en un solo ConversationHandler con múltiples entry_points.
"""

import logging

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ContextTypes, ConversationHandler,
    CallbackQueryHandler, MessageHandler, CommandHandler, filters,
)

from db import db
from utils.textos import generar_barra_meta
from handlers.comunes import teclado_volver, teclado_navegacion

logger = logging.getLogger('Manguito')

# Estados de la conversación
PEDIR_NOMBRE_META, PEDIR_OBJETIVO_META, PEDIR_MONTO_APORTE = range(3)


# ══════════════════════════════════════════════════════════
#  VISTA PRINCIPAL
# ══════════════════════════════════════════════════════════

async def vista_metas_ahorro(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Muestra todas las metas del usuario con barras de progreso.
    Se activa desde callback_data="cmd_metas_ahorro".
    """
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    metas = await db.get_metas_ahorro(user_id)

    # Botones de acciones siempre visibles
    botones_acciones = [
        [
            InlineKeyboardButton("➕ Nueva Meta", callback_data="meta_nueva"),
            InlineKeyboardButton("💰 Aportar", callback_data="meta_aportar_menu"),
        ],
        [
            InlineKeyboardButton("🗑️ Borrar Meta", callback_data="meta_borrar_menu"),
        ],
        [InlineKeyboardButton("◀️ Menú Principal", callback_data="cmd_menu")],
    ]

    if not metas:
        msg = (
            "🎯 *METAS DE AHORRO*\n"
            "─" * 22 + "\n\n"
            "No tenés metas de ahorro todavía.\n\n"
            "Tocá *➕ Nueva Meta* para crear tu primera meta\n"
            "y empezar a ahorrar. 💪"
        )
        await query.edit_message_text(
            msg,
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup(botones_acciones),
        )
        return ConversationHandler.END

    # Armar mensaje con barras de progreso
    msg = "🎯 *METAS DE AHORRO*\n" + "─" * 22 + "\n\n"

    for meta_id, nombre, objetivo, actual in metas:
        barra = generar_barra_meta(actual, objetivo)
        completada = " ✅" if actual >= objetivo else ""
        msg += f"📌 *{nombre}*{completada}\n"
        msg += f"{barra}\n\n"

    await query.edit_message_text(
        msg,
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(botones_acciones),
    )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  CREAR NUEVA META
# ══════════════════════════════════════════════════════════

async def iniciar_nueva_meta(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Pide el nombre de la nueva meta."""
    query = update.callback_query
    await query.answer()

    # Limitar cantidad de metas
    user_id = query.from_user.id
    metas = await db.get_metas_ahorro(user_id)
    if len(metas) >= 10:
        await query.edit_message_text(
            "⚠️ Ya tenés 10 metas activas. Borrá alguna para crear una nueva.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    await query.edit_message_text(
        "➕ *NUEVA META DE AHORRO*\n\n"
        "¿Cómo se llama tu meta?\n\n"
        "Ejemplo: `Viaje a Brasil`, `PlayStation 5`, `Fondo de emergencia`\n\n"
        "_Mandá /cancelar para salir._",
        parse_mode='Markdown',
    )
    return PEDIR_NOMBRE_META


async def recibir_nombre_meta(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Guarda el nombre y pide el monto objetivo."""
    nombre = update.message.text.strip()

    if len(nombre) > 50:
        await update.message.reply_text(
            "❌ El nombre es muy largo. Usá máximo 50 caracteres."
        )
        return PEDIR_NOMBRE_META

    if len(nombre) < 2:
        await update.message.reply_text(
            "❌ El nombre es muy corto. Dale, poné algo descriptivo."
        )
        return PEDIR_NOMBRE_META

    context.user_data['meta_nombre'] = nombre.title()

    await update.message.reply_text(
        f"🏷️ Meta: *{nombre.title()}*\n\n"
        f"¿Cuánta plata necesitás juntar?\n\n"
        f"Ejemplo: `500000`",
        parse_mode='Markdown',
    )
    return PEDIR_OBJETIVO_META


async def recibir_objetivo_meta(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Guarda el objetivo y crea la meta en la BD."""
    texto = update.message.text.strip()

    try:
        objetivo = float(texto.replace(".", "").replace(",", ".").replace("$", ""))
        if objetivo <= 0:
            raise ValueError()
    except ValueError:
        await update.message.reply_text(
            "❌ Monto inválido. Escribí solo números (ej: 500000)."
        )
        return PEDIR_OBJETIVO_META

    nombre = context.user_data.get('meta_nombre', 'Meta')
    user_id = update.effective_user.id

    try:
        meta_id = await db.crear_meta(user_id, nombre, objetivo)
    except Exception as e:
        logger.error(f"Error creando meta: {e}")
        await update.message.reply_text(
            "❌ Error al crear la meta. Probá de nuevo.",
            reply_markup=teclado_navegacion(),
        )
        context.user_data.pop('meta_nombre', None)
        return ConversationHandler.END

    barra = generar_barra_meta(0, objetivo)

    await update.message.reply_text(
        f"✅ *¡Meta creada!*\n\n"
        f"📌 *{nombre}*\n"
        f"🎯 Objetivo: *${objetivo:,.0f}*\n"
        f"{barra}\n\n"
        f"Usá *💰 Aportar* desde el menú de metas para sumar plata.",
        parse_mode='Markdown',
        reply_markup=teclado_navegacion(),
    )

    context.user_data.pop('meta_nombre', None)
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  APORTAR A UNA META
# ══════════════════════════════════════════════════════════

async def menu_aportar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra las metas como botones para elegir a cuál aportar."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    metas = await db.get_metas_ahorro(user_id)

    if not metas:
        await query.edit_message_text(
            "🤷‍♂️ No tenés metas. Creá una con *➕ Nueva Meta*.",
            parse_mode='Markdown',
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    keyboard = []
    for meta_id, nombre, objetivo, actual in metas:
        porcentaje = min(int((actual / objetivo) * 100), 100) if objetivo > 0 else 100
        texto_btn = f"📌 {nombre} ({porcentaje}%)"
        keyboard.append(
            [InlineKeyboardButton(texto_btn, callback_data=f"meta_aport_{meta_id}")]
        )
    keyboard.append(
        [InlineKeyboardButton("◀️ Volver", callback_data="cmd_metas_ahorro")]
    )

    await query.edit_message_text(
        "💰 *APORTAR A UNA META*\n\n"
        "¿A cuál meta querés sumarle plata?",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ConversationHandler.END


async def seleccionar_meta_aporte(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """El usuario eligió una meta. Pedimos el monto a aportar."""
    query = update.callback_query
    await query.answer()

    meta_id = int(query.data.replace("meta_aport_", ""))
    context.user_data['meta_aporte_id'] = meta_id

    user_id = query.from_user.id
    meta = await db.get_meta_por_id(user_id, meta_id)

    if not meta:
        await query.edit_message_text(
            "❌ Esa meta ya no existe.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    _id, nombre, objetivo, actual = meta
    restante = max(objetivo - actual, 0)

    await query.edit_message_text(
        f"💰 Aportando a: *{nombre}*\n\n"
        f"Progreso actual: ${actual:,.0f} / ${objetivo:,.0f}\n"
        f"Falta: *${restante:,.0f}*\n\n"
        f"¿Cuánto querés aportar?\n"
        f"Ejemplo: `50000`\n\n"
        f"_Mandá /cancelar para salir._",
        parse_mode='Markdown',
    )
    return PEDIR_MONTO_APORTE


async def recibir_monto_aporte(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Recibe el monto y lo suma a la meta."""
    texto = update.message.text.strip()

    try:
        monto = float(texto.replace(".", "").replace(",", ".").replace("$", ""))
        if monto <= 0:
            raise ValueError()
    except ValueError:
        await update.message.reply_text(
            "❌ Monto inválido. Escribí solo números (ej: 50000)."
        )
        return PEDIR_MONTO_APORTE

    meta_id = context.user_data.get('meta_aporte_id')
    if not meta_id:
        await update.message.reply_text(
            "❌ Perdí el contexto. Volvé al menú de metas.",
            reply_markup=teclado_navegacion(),
        )
        return ConversationHandler.END

    user_id = update.effective_user.id
    resultado = await db.aportar_meta(user_id, meta_id, monto)

    if not resultado:
        await update.message.reply_text(
            "❌ Esa meta ya no existe.",
            reply_markup=teclado_navegacion(),
        )
        context.user_data.pop('meta_aporte_id', None)
        return ConversationHandler.END

    nombre, nuevo_actual, objetivo = resultado
    barra = generar_barra_meta(nuevo_actual, objetivo)

    # Mensaje de celebración si completó la meta
    if nuevo_actual >= objetivo:
        celebracion = "\n\n🎉🎉🎉 *¡META CUMPLIDA!* ¡Sos un crack! 🎉🎉🎉"
    else:
        restante = objetivo - nuevo_actual
        celebracion = f"\n\n💪 Te faltan *${restante:,.0f}* — ¡Seguí así!"

    await update.message.reply_text(
        f"✅ *¡Aporte registrado!*\n\n"
        f"📌 *{nombre}*\n"
        f"💰 Aportaste: +${monto:,.0f}\n"
        f"{barra}{celebracion}",
        parse_mode='Markdown',
        reply_markup=teclado_navegacion(),
    )

    context.user_data.pop('meta_aporte_id', None)
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  BORRAR META
# ══════════════════════════════════════════════════════════

async def menu_borrar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra las metas como botones para elegir cuál borrar."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    metas = await db.get_metas_ahorro(user_id)

    if not metas:
        await query.edit_message_text(
            "🤷‍♂️ No tenés metas para borrar.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    keyboard = []
    for meta_id, nombre, objetivo, actual in metas:
        keyboard.append(
            [InlineKeyboardButton(f"🗑️ {nombre}", callback_data=f"meta_del_{meta_id}")]
        )
    keyboard.append(
        [InlineKeyboardButton("◀️ Volver", callback_data="cmd_metas_ahorro")]
    )

    await query.edit_message_text(
        "🗑️ *BORRAR META*\n\n"
        "¿Cuál meta querés eliminar?\n"
        "_Esta acción no se puede deshacer._",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ConversationHandler.END


async def confirmar_borrar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Borra la meta seleccionada."""
    query = update.callback_query
    await query.answer()

    meta_id = int(query.data.replace("meta_del_", ""))
    user_id = query.from_user.id

    nombre = await db.borrar_meta(user_id, meta_id)

    if nombre:
        await query.edit_message_text(
            f"🗑️ Meta *{nombre}* eliminada.",
            parse_mode='Markdown',
            reply_markup=teclado_volver(),
        )
    else:
        await query.edit_message_text(
            "❌ No se pudo borrar. Ya no existe.",
            reply_markup=teclado_volver(),
        )

    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  CANCELAR
# ══════════════════════════════════════════════════════════

async def cancelar_meta(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela cualquier flujo de metas desde /cancelar."""
    context.user_data.pop('meta_nombre', None)
    context.user_data.pop('meta_aporte_id', None)
    await update.message.reply_text(
        "❌ Operación cancelada.",
        reply_markup=teclado_navegacion(),
    )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  CONVERSATION HANDLER
# ══════════════════════════════════════════════════════════

conv_metas_handler = ConversationHandler(
    entry_points=[
        # Vista principal
        CallbackQueryHandler(vista_metas_ahorro, pattern="^cmd_metas_ahorro$"),
        # Crear meta
        CallbackQueryHandler(iniciar_nueva_meta, pattern="^meta_nueva$"),
        # Aportar — menú de selección
        CallbackQueryHandler(menu_aportar, pattern="^meta_aportar_menu$"),
        # Aportar — meta seleccionada (pasa a estado PEDIR_MONTO_APORTE)
        CallbackQueryHandler(seleccionar_meta_aporte, pattern=r"^meta_aport_\d+$"),
        # Borrar — menú de selección
        CallbackQueryHandler(menu_borrar, pattern="^meta_borrar_menu$"),
        # Borrar — confirmación directa
        CallbackQueryHandler(confirmar_borrar, pattern=r"^meta_del_\d+$"),
    ],
    states={
        PEDIR_NOMBRE_META: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_nombre_meta),
        ],
        PEDIR_OBJETIVO_META: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_objetivo_meta),
        ],
        PEDIR_MONTO_APORTE: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_monto_aporte),
        ],
    },
    fallbacks=[
        CommandHandler("cancelar", cancelar_meta),
    ],
    per_message=False,
)
