"""
handlers/reglas_flash.py — Gestión visual de reglas de categorización (Modo Flash ⚡).

Permite al usuario ver y borrar las reglas que el bot aprendió
automáticamente de sus registros previos.
"""

import logging

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ContextTypes, ConversationHandler,
    CallbackQueryHandler,
)

from db import db
from utils.textos import EMOJIS_CATEGORIA
from handlers.comunes import teclado_volver

logger = logging.getLogger('Manguito')


# ══════════════════════════════════════════════════════════
#  VISTA PRINCIPAL — LISTAR REGLAS
# ══════════════════════════════════════════════════════════

async def vista_reglas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Muestra las reglas aprendidas del usuario.
    Se activa desde callback_data="menu_flash".
    """
    query = update.callback_query
    await query.answer()

    await query.edit_message_text("⚡ _Cargando motor veloz..._", parse_mode='Markdown')
    import asyncio
    await asyncio.sleep(0.4)

    user_id = query.from_user.id
    reglas = await db.get_reglas(user_id)

    botones = [
        [InlineKeyboardButton("🗑️ Borrar Regla", callback_data="flash_borrar_menu")],
        [InlineKeyboardButton("🧹 Borrar Todas", callback_data="flash_borrar_todo")],
        [InlineKeyboardButton("◀️ Menú Principal", callback_data="cmd_menu")],
    ]

    if not reglas:
        msg = (
            "⚡ *MODO FLASH — Reglas Aprendidas*\n"
            "─" * 22 + "\n\n"
            "No hay reglas todavía.\n\n"
            "El bot aprende automáticamente de tus gastos.\n"
            "Cuando registrás _'Panadería'_ como _Comida_,\n"
            "la próxima vez lo categoriza al toque sin usar IA. ⚡"
        )
        await query.edit_message_text(
            msg,
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup([botones[-1]]),  # Solo volver
        )
        return ConversationHandler.END

    msg = "⚡ *MODO FLASH — Reglas Aprendidas*\n" + "─" * 22 + "\n\n"

    # Agrupar por categoría
    por_cat = {}
    for regla_id, patron, categoria in reglas:
        if categoria not in por_cat:
            por_cat[categoria] = []
        por_cat[categoria].append(patron)

    for cat, patrones in por_cat.items():
        emoji = EMOJIS_CATEGORIA.get(cat, '📌')
        msg += f"{emoji} *{cat}:* "
        msg += ", ".join(f"_{p}_" for p in patrones)
        msg += "\n"

    msg += f"\n📊 Total: *{len(reglas)} reglas*"

    await query.edit_message_text(
        msg,
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(botones),
    )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  BORRAR UNA REGLA
# ══════════════════════════════════════════════════════════

async def menu_borrar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra las reglas como botones para borrar."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    reglas = await db.get_reglas(user_id)

    if not reglas:
        await query.edit_message_text(
            "🤷‍♂️ No hay reglas para borrar.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    keyboard = []
    for regla_id, patron, categoria in reglas:
        emoji = EMOJIS_CATEGORIA.get(categoria, '📌')
        keyboard.append(
            [InlineKeyboardButton(
                f"🗑️ {patron} → {emoji}{categoria}",
                callback_data=f"flash_del_{regla_id}",
            )]
        )
    keyboard.append(
        [InlineKeyboardButton("◀️ Volver", callback_data="menu_flash")]
    )

    await query.edit_message_text(
        "🗑️ *BORRAR REGLA*\n\n"
        "¿Cuál regla querés eliminar?",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ConversationHandler.END


async def confirmar_borrar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Borra la regla seleccionada."""
    query = update.callback_query
    await query.answer()

    regla_id = int(query.data.replace("flash_del_", ""))
    user_id = query.from_user.id

    patron = await db.borrar_regla(user_id, regla_id)

    if patron:
        await query.edit_message_text(
            f"🗑️ Regla *{patron}* eliminada.\n\n"
            f"La próxima vez, el bot usará IA para categorizar eso.",
            parse_mode='Markdown',
            reply_markup=teclado_volver(),
        )
    else:
        await query.edit_message_text(
            "❌ Esa regla ya no existe.",
            reply_markup=teclado_volver(),
        )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  BORRAR TODAS
# ══════════════════════════════════════════════════════════

async def borrar_todas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Borra TODAS las reglas del usuario."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    cantidad = await db.borrar_todas_reglas(user_id)

    await query.edit_message_text(
        f"🧹 Se borraron *{cantidad} reglas*.\n\n"
        f"El bot va a volver a aprender de tus próximos registros.",
        parse_mode='Markdown',
        reply_markup=teclado_volver(),
    )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  CONVERSATION HANDLER
# ══════════════════════════════════════════════════════════

conv_flash_handler = ConversationHandler(
    entry_points=[
        CallbackQueryHandler(vista_reglas, pattern="^menu_flash$"),
        CallbackQueryHandler(menu_borrar, pattern="^flash_borrar_menu$"),
        CallbackQueryHandler(confirmar_borrar, pattern=r"^flash_del_\d+$"),
        CallbackQueryHandler(borrar_todas, pattern="^flash_borrar_todo$"),
    ],
    states={},
    fallbacks=[],
    per_message=False,
)
