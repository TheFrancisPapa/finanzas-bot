"""
handlers/consultoria.py — Modo Consultoría IA.

ConversationHandler que permite al usuario hacer consultas financieras
personalizadas. La IA recibe el historial real del usuario como contexto
y responde como asesor. Al final, ofrece un botón de autodestrucción
para privacidad.
"""

import asyncio
import logging

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ContextTypes, ConversationHandler,
    MessageHandler, CommandHandler, filters,
)

from db import db
from servicios import rate_limiter, client, MODEL_NAME, msg_rate_limit
from utils.prompts import prompt_consultoria
from utils.decoradores import con_typing
from handlers.comunes import teclado_navegacion

logger = logging.getLogger('Manguito')

# Estado de la conversación
ESPERANDO_CONSULTA = 0


async def iniciar_consultoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Entrada: el usuario tocó '🧠 Consultoría IA'. Le pedimos su consulta."""
    await update.message.reply_text(
        "🧠 *Modo Consultoría IA*\n\n"
        "Soy todo oídos. Contame tu situación o qué te preocupa "
        "de tus finanzas y te doy mi opinión profesional basada "
        "en tus datos reales.\n\n"
        "_Escribí tu consulta o mandá /cancelar para salir._",
        parse_mode='Markdown',
    )
    return ESPERANDO_CONSULTA


@con_typing
async def procesar_consultoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesamiento: recibe la consulta, busca contexto en la BD y llama a la IA."""
    user_id = update.effective_user.id
    consulta = update.message.text

    # --- Rate limiter ---
    if not await rate_limiter.puede_usar_ia(user_id):
        await update.message.reply_text(
            msg_rate_limit(),
            reply_markup=teclado_navegacion(),
        )
        return ConversationHandler.END

    # --- Obtener contexto financiero del usuario ---
    try:
        ingresos, gastos = await db.get_resumen_mensual(user_id)
        saldo = ingresos - gastos
        top_gastos = await db.get_top_gastos(user_id, 5)
    except Exception as e:
        logger.error(f"Error obteniendo datos para consultoría: {e}")
        ingresos, gastos, saldo = 0, 0, 0
        top_gastos = []

    # --- Formatear historial para el prompt ---
    historial = f"Ingresos del mes: ${ingresos:,.0f}\n"
    historial += f"Gastos del mes: ${gastos:,.0f}\n"
    historial += f"Saldo actual: ${saldo:,.0f}\n"

    if top_gastos:
        historial += "\nTop gastos del mes:\n"
        for _id, desc, monto, cat, _fecha in top_gastos:
            historial += f"  - {desc}: ${monto:,.0f} ({cat})\n"
    else:
        historial += "\n(Sin gastos registrados este mes)\n"

    # --- Llamar a la IA ---
    try:
        prompt = prompt_consultoria(historial, consulta)
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=prompt,
        )
        await rate_limiter.registrar_uso(user_id)
        respuesta_ia = response.text

    except Exception as e:
        logger.error(f"Error en Gemini (consultoría): {e}")
        await update.message.reply_text(
            "😔 La IA no responde ahora. Probá de nuevo en unos minutos.",
            reply_markup=teclado_navegacion(),
        )
        return ConversationHandler.END

    # --- Enviar respuesta con botón de autodestrucción ---
    boton_destruir = InlineKeyboardMarkup([
        [InlineKeyboardButton("💥 Destruir chat", callback_data="destruir_consultoria")]
    ])

    msg_ia = await update.message.reply_text(
        f"🧠 *Consultoría Manguito*\n"
        f"{'─' * 22}\n\n"
        f"{respuesta_ia}\n\n"
        f"_Tocá el botón de abajo para borrar este mensaje por privacidad._",
        parse_mode='Markdown',
        reply_markup=boton_destruir,
    )

    # Guardar IDs de mensajes para poder borrar ambos después
    context.user_data['consultoria_msg_ia'] = msg_ia.message_id
    context.user_data['consultoria_msg_user'] = update.message.message_id

    return ConversationHandler.END


async def cancelar_consultoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela la conversación de consultoría."""
    await update.message.reply_text(
        "❌ Consultoría cancelada.",
        reply_markup=teclado_navegacion(),
    )
    return ConversationHandler.END


# ── Definición del ConversationHandler ──────────────────────────
conv_consultoria_handler = ConversationHandler(
    entry_points=[
        MessageHandler(filters.Regex("^🧠 Consultoría IA$"), iniciar_consultoria),
    ],
    states={
        ESPERANDO_CONSULTA: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_consultoria),
        ],
    },
    fallbacks=[
        CommandHandler("cancelar", cancelar_consultoria),
        MessageHandler(filters.Regex("^❌ Cancelar$"), cancelar_consultoria),
    ],
)
