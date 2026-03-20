"""
handlers/cuenta.py — Opciones de perfil y borrado (Botón de Pánico).

Permite al usuario borrar absolutamente todo su rastro de la BD por privacidad.
"""

import logging
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import ContextTypes

from db import db
from handlers.comunes import teclado_volver

logger = logging.getLogger('Manguito')


async def menu_perfil(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra opciones de cuenta/perfil."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    
    msg = (
        "⚙️ *MI PERFIL Y CONFIGURACIÓN*\n"
        "──────────────────────\n\n"
        f"Tu número de usuario (ID) es: `{user_id}`\n\n"
        "Desde acá podés gestionar los datos de tu cuenta.\n"
        "Si necesitas borrar todo tu historial por privacidad, podés hacerlo con el Botón de Pánico."
    )

    keyboard = [
        [InlineKeyboardButton("🏷️ Mis Categorías", callback_data="menu_categorias")],
        [InlineKeyboardButton("🏆 Mis Logros", callback_data="menu_logros"),
         InlineKeyboardButton("👥 Modo Convivencia", callback_data="menu_convivencia")],
        [InlineKeyboardButton("💲 Precios / PRO", callback_data="cmd_precios"),
         InlineKeyboardButton("💡 Sugerencias", callback_data="cmd_sugerencia_info")],
        [InlineKeyboardButton("☕ Donar", callback_data="cmd_donar"),
         InlineKeyboardButton("ℹ️ Guía Total", callback_data="cmd_ayuda_gral")],
        [InlineKeyboardButton("🗑️ Borrar mi cuenta (Peligro)", callback_data="perfil_borrar")],
        [InlineKeyboardButton("◀️ Menú Principal", callback_data="cmd_menu")]
    ]

    await query.edit_message_text(
        msg,
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def confirmar_borrado(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra el cartel de doble confirmación del botón de pánico."""
    query = update.callback_query
    await query.answer(text="⚠️ Cuidado, esta acción es irreversible.", show_alert=True)

    msg = (
        "⚠️ *ADVERTENCIA: DOBLE CONFIRMACIÓN*\n\n"
        "¿Estás 100% seguro? Esto va a borrar todo tu historial, presupuesto, "
        "inversiones, medallas, suscripciones y metas **para siempre**.\n\n"
        "No se puede deshacer."
    )

    keyboard = [
        [InlineKeyboardButton("❌ Cancelar (Me equivoqué)", callback_data="menu_perfil")],
        [InlineKeyboardButton("⚠️ SÍ, BORRAR TODO", callback_data="perfil_ejecutar_borrado")]
    ]

    await query.edit_message_text(
        msg,
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def ejecutar_borrado(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Ejecuta la purga de la base de datos y elimina la cuenta."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id

    # 1. Llamar a la transacción de borrado total
    exito = await db.eliminar_cuenta_completa(user_id)

    # 2. Limpiar RAM del bot
    context.user_data.clear()

    if exito:
        msg = (
            "✅ *CUENTA ELIMINADA*\n\n"
            "Todos tus datos, reglas, histórico, inversiones, medallas y suscripciones "
            "fueron borrados de la base de datos de manera definitiva.\n\n"
            "Gracias por haber usado Manguito. Si alguna vez querés volver a arrancar de cero, "
            "mandá /start."
        )
        logger.info(f"Usuario {user_id} eliminó su cuenta usando el Botón de Pánico.")
    else:
        msg = (
            "❌ Hubo un error procesando el borrado de tu cuenta.\n"
            "Por favor, intentá de nuevo más tarde o contactá al administrador."
        )

    await query.edit_message_text(msg, parse_mode='Markdown')
