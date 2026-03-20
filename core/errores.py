"""
core/errores.py — Manejador global de errores de Telegram.

Se conecta con app.add_error_handler() para:
1. Notificar al usuario con un mensaje amigable.
2. Enviar el traceback completo al ADMIN por Telegram.
3. Loguear el error en consola.
"""

import logging
import traceback
import html

from telegram import Update
from telegram.ext import ContextTypes

from core.config import config

logger = logging.getLogger('Manguito-Errores')


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Manejador global de errores no controlados.

    - Loguea el error con traceback completo.
    - Avisa al usuario de forma amigable.
    - Manda el traceback al ADMIN_ID por Telegram.
    """
    # 1. Loguear en consola
    logger.error("Excepción no controlada:", exc_info=context.error)

    # 2. Notificar al usuario (si hay un update válido)
    if isinstance(update, Update) and update.effective_chat:
        try:
            await context.bot.send_message(
                chat_id=update.effective_chat.id,
                text=(
                    "😕 *Ups, algo salió mal.*\n\n"
                    "El error ya fue reportado y lo voy a revisar.\n"
                    "Probá de nuevo en unos segundos o usá los botones del menú."
                ),
                parse_mode='Markdown',
            )
        except Exception:
            # Si ni siquiera podemos avisar al usuario, solo loguear
            logger.error("No se pudo notificar al usuario del error.")

    # 3. Notificar al ADMIN con detalles técnicos
    if config.ADMIN_ID:
        try:
            # Construir traceback legible
            tb_list = traceback.format_exception(
                type(context.error), context.error, context.error.__traceback__
            )
            tb_string = "".join(tb_list)

            # Info del contexto
            info_parts = [f"<b>🚨 ERROR EN MANGUITO</b>\n"]

            if isinstance(update, Update):
                if update.effective_user:
                    info_parts.append(
                        f"<b>👤 Usuario:</b> {html.escape(update.effective_user.first_name or 'N/A')} "
                        f"(ID: <code>{update.effective_user.id}</code>)"
                    )
                if update.effective_chat:
                    info_parts.append(
                        f"<b>💬 Chat:</b> <code>{update.effective_chat.id}</code>"
                    )
                if update.message and update.message.text:
                    texto_truncado = update.message.text[:200]
                    info_parts.append(
                        f"<b>📝 Mensaje:</b> <code>{html.escape(texto_truncado)}</code>"
                    )

            info_parts.append(f"\n<b>🔧 Error:</b>\n<pre>{html.escape(tb_string[-3000:])}</pre>")

            mensaje_admin = "\n".join(info_parts)

            # Telegram tiene límite de 4096 chars por mensaje
            if len(mensaje_admin) > 4000:
                mensaje_admin = mensaje_admin[:4000] + "\n\n<i>... (traceback truncado)</i>"

            await context.bot.send_message(
                chat_id=config.ADMIN_ID,
                text=mensaje_admin,
                parse_mode='HTML',
            )
        except Exception as admin_err:
            logger.error(f"No se pudo notificar al admin: {admin_err}")
