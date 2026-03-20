"""
handlers/servicios_variables.py — Gestión de servicios con monto variable.

Incluye:
- Vista principal: listar recordatorios activos.
- ConversationHandler para crear un nuevo aviso (nombre → categoría → día).
- ConversationHandler para anotar pago desde el recordatorio automático.
- Borrado de servicios.

Todo unificado en un solo ConversationHandler con múltiples entry_points.
"""

import logging

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ContextTypes, ConversationHandler,
    CallbackQueryHandler, MessageHandler, CommandHandler, filters,
)

from db import db
from utils.textos import EMOJIS_CATEGORIA
from handlers.comunes import teclado_volver, teclado_navegacion

logger = logging.getLogger('Manguito')

# Estados de la conversación
PEDIR_NOMBRE, PEDIR_CATEGORIA, PEDIR_DIA, PEDIR_MONTO_PAGO = range(4)

# Categorías disponibles para servicios variables
CATEGORIAS_VARIABLES = [
    "Servicios", "Salud", "Educación", "Transporte",
    "Suscripciones", "Varios",
]


# ══════════════════════════════════════════════════════════
#  VISTA PRINCIPAL — LISTAR RECORDATORIOS
# ══════════════════════════════════════════════════════════

async def vista_recordatorios(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Muestra la lista de servicios variables del usuario.
    Se activa desde callback_data="menu_variables".
    """
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    servicios = await db.get_variables_usuario(user_id)

    botones_acciones = [
        [
            InlineKeyboardButton("➕ Nuevo Aviso", callback_data="var_nuevo"),
            InlineKeyboardButton("🗑️ Borrar", callback_data="var_borrar_menu"),
        ],
        [InlineKeyboardButton("◀️ Menú Principal", callback_data="cmd_menu")],
    ]

    if not servicios:
        msg = (
            "🔔 *RECORDATORIOS VARIABLES*\n"
            "─" * 22 + "\n\n"
            "No tenés recordatorios configurados.\n\n"
            "Estos sirven para servicios que vencen un día fijo pero\n"
            "cambian de precio cada mes (luz, gas, tarjeta, etc.).\n\n"
            "Tocá *➕ Nuevo Aviso* para crear uno."
        )
        await query.edit_message_text(
            msg,
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup(botones_acciones),
        )
        return ConversationHandler.END

    msg = "🔔 *RECORDATORIOS VARIABLES*\n" + "─" * 22 + "\n\n"

    for srv_id, nombre, dia, categoria in servicios:
        emoji_cat = EMOJIS_CATEGORIA.get(categoria, '📌')
        msg += f"{emoji_cat} *{nombre}*\n"
        msg += f"   📅 Vence el día _{dia}_ de cada mes\n"
        msg += f"   📁 Categoría: _{categoria}_\n\n"

    await query.edit_message_text(
        msg,
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(botones_acciones),
    )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  CREAR NUEVO RECORDATORIO
# ══════════════════════════════════════════════════════════

async def iniciar_nuevo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Pide el nombre del servicio."""
    query = update.callback_query
    await query.answer()

    # Limitar cantidad
    user_id = query.from_user.id
    servicios = await db.get_variables_usuario(user_id)
    if len(servicios) >= 15:
        await query.edit_message_text(
            "⚠️ Ya tenés 15 recordatorios activos. Borrá alguno primero.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    await query.edit_message_text(
        "➕ *NUEVO RECORDATORIO*\n\n"
        "¿Cómo se llama el servicio?\n\n"
        "Ejemplo: `Edenor`, `Tarjeta Visa`, `Metrogas`\n\n"
        "_Mandá /cancelar para salir._",
        parse_mode='Markdown',
    )
    return PEDIR_NOMBRE


async def recibir_nombre(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Guarda el nombre y muestra las categorías como botones."""
    nombre = update.message.text.strip()

    if len(nombre) > 40:
        await update.message.reply_text(
            "❌ Nombre muy largo. Máximo 40 caracteres."
        )
        return PEDIR_NOMBRE

    if len(nombre) < 2:
        await update.message.reply_text(
            "❌ Nombre muy corto."
        )
        return PEDIR_NOMBRE

    context.user_data['var_nombre'] = nombre.title()

    # Mostrar categorías como botones inline
    keyboard = []
    row = []
    for i, cat in enumerate(CATEGORIAS_VARIABLES):
        emoji = EMOJIS_CATEGORIA.get(cat, '📌')
        row.append(InlineKeyboardButton(f"{emoji} {cat}", callback_data=f"var_cat_{cat}"))
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)

    await update.message.reply_text(
        f"📌 Servicio: *{nombre.title()}*\n\n"
        f"¿En qué categoría lo ponemos?",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return PEDIR_CATEGORIA


async def recibir_categoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Guarda la categoría elegida y pide el día de vencimiento."""
    query = update.callback_query
    await query.answer()

    categoria = query.data.replace("var_cat_", "")
    context.user_data['var_categoria'] = categoria

    await query.edit_message_text(
        f"📁 Categoría: *{categoria}*\n\n"
        f"¿Qué día del mes vence?\n\n"
        f"Escribí el número (ej: `10`, `15`, `28`)\n\n"
        f"_Mandá /cancelar para salir._",
        parse_mode='Markdown',
    )
    return PEDIR_DIA


async def recibir_dia(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Guarda el día y crea el recordatorio en la BD."""
    texto = update.message.text.strip()

    try:
        dia = int(texto)
        if dia < 1 or dia > 28:
            await update.message.reply_text(
                "❌ El día debe ser entre 1 y 28.\n"
                "(Usamos 28 como máximo para que funcione en todos los meses)"
            )
            return PEDIR_DIA
    except ValueError:
        await update.message.reply_text(
            "❌ Escribí solo el número del día (ej: 10)."
        )
        return PEDIR_DIA

    nombre = context.user_data.get('var_nombre', 'Servicio')
    categoria = context.user_data.get('var_categoria', 'Varios')
    user_id = update.effective_user.id

    try:
        await db.agregar_variable(user_id, nombre, dia, categoria)
    except Exception as e:
        logger.error(f"Error creando servicio variable: {e}")
        await update.message.reply_text(
            "❌ Error al crear el recordatorio. Probá de nuevo.",
            reply_markup=teclado_navegacion(),
        )
        _limpiar_contexto_var(context)
        return ConversationHandler.END

    emoji_cat = EMOJIS_CATEGORIA.get(categoria, '📌')
    await update.message.reply_text(
        f"✅ *¡Recordatorio creado!*\n\n"
        f"{emoji_cat} *{nombre}*\n"
        f"📅 Vence el día *{dia}* de cada mes\n"
        f"📁 Categoría: _{categoria}_\n\n"
        f"El día {dia} de cada mes te voy a avisar para que anotes cuánto te vino. 🔔",
        parse_mode='Markdown',
        reply_markup=teclado_navegacion(),
    )

    _limpiar_contexto_var(context)
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  ANOTAR PAGO (desde el botón del recordatorio automático)
# ══════════════════════════════════════════════════════════

async def iniciar_pago(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    El usuario tocó el botón '📝 Anotar Pago' del recordatorio automático.
    callback_data = "pagar_var_<ID>"
    """
    query = update.callback_query
    await query.answer()

    srv_id = int(query.data.replace("pagar_var_", ""))
    user_id = query.from_user.id

    servicio = await db.get_variable_por_id(user_id, srv_id)
    if not servicio:
        await query.edit_message_text(
            "❌ Ese servicio ya no existe.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    _id, nombre, dia, categoria = servicio
    context.user_data['var_pago_id'] = srv_id
    context.user_data['var_pago_nombre'] = nombre
    context.user_data['var_pago_cat'] = categoria

    await query.edit_message_text(
        f"📝 *Anotar pago de {nombre}*\n\n"
        f"¿Cuánto te vino este mes?\n\n"
        f"Escribí el monto (ej: `8500`)\n\n"
        f"_Mandá /cancelar para salir._",
        parse_mode='Markdown',
    )
    return PEDIR_MONTO_PAGO


async def recibir_monto_pago(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Recibe el monto del pago y lo registra como gasto."""
    texto = update.message.text.strip()

    try:
        monto = float(texto.replace(".", "").replace(",", ".").replace("$", ""))
        if monto <= 0:
            raise ValueError()
    except ValueError:
        await update.message.reply_text(
            "❌ Monto inválido. Escribí solo números (ej: 8500)."
        )
        return PEDIR_MONTO_PAGO

    nombre = context.user_data.get('var_pago_nombre', 'Servicio')
    categoria = context.user_data.get('var_pago_cat', 'Varios')
    user_id = update.effective_user.id

    try:
        await db.agregar_movimiento(
            user_id,
            'egreso',
            monto,
            categoria,
            f"Pago: {nombre}",
        )
    except Exception as e:
        logger.error(f"Error registrando pago variable: {e}")
        await update.message.reply_text(
            "❌ Error al registrar el pago. Probá de nuevo.",
            reply_markup=teclado_navegacion(),
        )
        _limpiar_contexto_pago(context)
        return ConversationHandler.END

    emoji_cat = EMOJIS_CATEGORIA.get(categoria, '📌')
    await update.message.reply_text(
        f"✅ *¡Pago registrado!*\n\n"
        f"{emoji_cat} *{nombre}*\n"
        f"💸 Monto: *${monto:,.0f}*\n"
        f"📁 Categoría: _{categoria}_\n\n"
        f"Listo, quedó anotado como gasto. 👌",
        parse_mode='Markdown',
        reply_markup=teclado_navegacion(),
    )

    _limpiar_contexto_pago(context)
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  BORRAR RECORDATORIO
# ══════════════════════════════════════════════════════════

async def menu_borrar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra los servicios como botones para elegir cuál borrar."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    servicios = await db.get_variables_usuario(user_id)

    if not servicios:
        await query.edit_message_text(
            "🤷‍♂️ No tenés recordatorios para borrar.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    keyboard = []
    for srv_id, nombre, dia, cat in servicios:
        keyboard.append(
            [InlineKeyboardButton(f"🗑️ {nombre} (día {dia})", callback_data=f"var_del_{srv_id}")]
        )
    keyboard.append(
        [InlineKeyboardButton("◀️ Volver", callback_data="menu_variables")]
    )

    await query.edit_message_text(
        "🗑️ *BORRAR RECORDATORIO*\n\n"
        "¿Cuál querés eliminar?",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ConversationHandler.END


async def confirmar_borrar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Borra el recordatorio seleccionado."""
    query = update.callback_query
    await query.answer()

    srv_id = int(query.data.replace("var_del_", ""))
    user_id = query.from_user.id

    nombre = await db.borrar_variable(user_id, srv_id)

    if nombre:
        await query.edit_message_text(
            f"🗑️ Recordatorio de *{nombre}* eliminado.",
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
#  UTILIDADES
# ══════════════════════════════════════════════════════════

def _limpiar_contexto_var(context):
    """Limpia las keys temporales de creación de variable."""
    for key in ('var_nombre', 'var_categoria'):
        context.user_data.pop(key, None)


def _limpiar_contexto_pago(context):
    """Limpia las keys temporales de pago."""
    for key in ('var_pago_id', 'var_pago_nombre', 'var_pago_cat'):
        context.user_data.pop(key, None)


# ══════════════════════════════════════════════════════════
#  CANCELAR
# ══════════════════════════════════════════════════════════

async def cancelar_variable(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela cualquier flujo de variables desde /cancelar."""
    _limpiar_contexto_var(context)
    _limpiar_contexto_pago(context)
    await update.message.reply_text(
        "❌ Operación cancelada.",
        reply_markup=teclado_navegacion(),
    )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  CONVERSATION HANDLER
# ══════════════════════════════════════════════════════════

conv_variables_handler = ConversationHandler(
    entry_points=[
        # Vista principal
        CallbackQueryHandler(vista_recordatorios, pattern="^menu_variables$"),
        # Crear nuevo
        CallbackQueryHandler(iniciar_nuevo, pattern="^var_nuevo$"),
        # Anotar pago (desde recordatorio automático)
        CallbackQueryHandler(iniciar_pago, pattern=r"^pagar_var_\d+$"),
        # Borrar — menú
        CallbackQueryHandler(menu_borrar, pattern="^var_borrar_menu$"),
        # Borrar — confirmar
        CallbackQueryHandler(confirmar_borrar, pattern=r"^var_del_\d+$"),
    ],
    states={
        PEDIR_NOMBRE: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_nombre),
        ],
        PEDIR_CATEGORIA: [
            CallbackQueryHandler(recibir_categoria, pattern=r"^var_cat_"),
        ],
        PEDIR_DIA: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_dia),
        ],
        PEDIR_MONTO_PAGO: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_monto_pago),
        ],
    },
    fallbacks=[
        CommandHandler("cancelar", cancelar_variable),
    ],
    per_message=False,
)
