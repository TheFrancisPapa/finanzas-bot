"""
handlers/errores.py — Crash Handler Global.

Captura excepciones no manejadas, informa al usuario y manda el error técnico al admin.
"""

import logging
import traceback
import html

from telegram import Update
from telegram.ext import ContextTypes

from core.config import config

logger = logging.getLogger('Manguito')


async def manejador_de_errores(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Maneja todas las excepciones bot-wide que no fueron capturadas en bloque try...except."""
    
    # 1. Registrar el error en el log
    logger.error("Excepción global no manejada:", exc_info=context.error)

    # 2. Avisar al usuario amistosamente (si el error ocurrió por una acción del usuario)
    if isinstance(update, Update) and update.effective_message:
        texto_amigable = "⚠️ Che, los servidores andan medio lentos o hubo un error inesperado al procesar tu solicitud. Probá de nuevo en un ratito."
        try:
            await update.effective_message.reply_text(texto_amigable)
        except Exception as e:
            logger.error(f"Fallo al enviar mensaje de error al usuario: {e}")

    # 3. Mandar traceback técnico al administrador
    admin_id = config.ADMIN_ID
    if admin_id and admin_id != 0:
        # Extraer traza del error. (Compatible con Python 3.9 y 3.10+)
        tb_list = traceback.format_exception(None, context.error, context.error.__traceback__)
        tb_string = "".join(tb_list)
        
        # Limitar longitud porque Telegram corta mensajes gigantes (~4000 caracteres limit)
        if len(tb_string) > 3500:
            tb_string = tb_string[-3500:]

        mensaje_admin = (
            f"🔴 <b>CRASH HANDLER: ERROR EN MANGUITO</b>\n\n"
            f"<pre>{html.escape(tb_string)}</pre>"
        )

        try:
            await context.bot.send_message(
                chat_id=admin_id,
                text=mensaje_admin,
                parse_mode='HTML'
            )
        except Exception as e:
            logger.error(f"Fallo al notificar el técnico al admin ({admin_id}): {e}")
