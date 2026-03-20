"""
utils/decoradores.py — Decoradores de seguridad y UX para handlers.

Contiene:
- @admin_only: restringe un handler al ADMIN_ID.
- @requiere_pro: verifica que el usuario tenga plan PRO activo.
- @con_typing: envía ChatAction.TYPING antes de ejecutar el handler.
"""

import functools
import logging

from telegram import Update, constants
from telegram.ext import ContextTypes

from core.config import config

logger = logging.getLogger('Manguito')


def admin_only(func):
    """
    Decorador que restringe un handler al ADMIN_ID.
    Si el usuario no es admin, responde con un mensaje de error y corta.
    """
    @functools.wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args, **kwargs):
        user_id = update.effective_user.id
        if user_id != config.ADMIN_ID:
            await update.message.reply_text("❌ No tenés permiso para esto.")
            logger.warning(f"⛔ Acceso denegado a {func.__name__} por user {user_id}")
            return
        return await func(update, context, *args, **kwargs)
    return wrapper


def requiere_pro(feature_name: str):
    """
    Decorador que verifica plan PRO antes de ejecutar el handler.

    Uso:
        @requiere_pro("Análisis con IA")
        async def analizar_gastos(update, context):
            ...
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args, **kwargs):
            from db import db
            from handlers.comunes import msg_necesita_pro

            user_id = update.effective_user.id
            if not await db.es_pro(user_id):
                msg_obj = update.message or (
                    update.callback_query.message if update.callback_query else None
                )
                if msg_obj:
                    await msg_obj.reply_text(
                        msg_necesita_pro(feature_name), parse_mode='Markdown'
                    )
                return
            return await func(update, context, *args, **kwargs)
        return wrapper
    return decorator


def con_typing(func):
    """
    Decorador que envía ChatAction.TYPING antes de ejecutar el handler.
    Muestra el indicador "escribiendo..." al usuario.
    """
    @functools.wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args, **kwargs):
        if update.effective_chat:
            await context.bot.send_chat_action(
                chat_id=update.effective_chat.id,
                action=constants.ChatAction.TYPING,
            )
        return await func(update, context, *args, **kwargs)
    return wrapper
