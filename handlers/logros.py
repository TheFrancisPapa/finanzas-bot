"""
handlers/logros.py — La "Vitrina de Trofeos" del usuario.

Muestra los logros desbloqueados y los que faltan.
"""

import logging

from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import ContextTypes

from db import db
from utils.textos import LOGROS_DISPONIBLES
from handlers.comunes import teclado_volver

logger = logging.getLogger('Manguito')


async def vista_logros(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Randeriza la vitrina de logros.
    Activado con callback_data="menu_logros".
    """
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    logros_user_tuplas = await db.get_logros(user_id)
    logros_desbloqueados = [l[0] for l in logros_user_tuplas]

    msg = "🏆 *MIS TROFEOS Y LOGROS*\n" + "─" * 22 + "\n\n"

    cantidad = len(logros_desbloqueados)
    total = len(LOGROS_DISPONIBLES)

    if cantidad == 0:
        msg += "Todavía no tenés ningún logro. ¡Empezá a registrar tus finanzas y completá misiones ocultas! 😉\n\n"
    elif cantidad == total:
        msg += "🎯 *¡COMPLETISTA!* Tenés TODOS los logros.\n\n"
    else:
        msg += f"Desbloqueaste *{cantidad} de {total}* logros.\n\n"

    for clave, info in LOGROS_DISPONIBLES.items():
        if clave in logros_desbloqueados:
            icono = info["icono"]
            titulo = info["titulo"]
            desc = info["desc"]
            # Mostrar brillante
            msg += f"{icono} *{titulo}*\n_{desc}_\n\n"
        else:
            # Mostrar opaco o en gris (🔒)
            titulo = info["titulo"]
            msg += f"🔒 *{titulo}*\n_Desbloquealo jugando con el bot..._\n\n"

    await query.edit_message_text(
        msg,
        parse_mode='Markdown',
        reply_markup=teclado_volver(),
    )
