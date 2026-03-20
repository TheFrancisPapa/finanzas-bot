"""
handlers/vaquita.py — Modo Vaquita (División de gastos sociales).

ConversationHandler que permite dividir un gasto entre varias personas,
registrar solo la parte del usuario en la BD, y generar un texto listo
para copiar y mandar al grupo.
"""

import re
import logging

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ContextTypes, ConversationHandler,
    CallbackQueryHandler, MessageHandler, CommandHandler, filters,
)

from db import db
from handlers.comunes import teclado_navegacion, teclado_volver

logger = logging.getLogger('Manguito')

# Estados de la conversación
ESPERANDO_TOTAL, ESPERANDO_PERSONAS = range(2)


# ── PASO 1: Entrada ──────────────────────────────────────

async def iniciar_vaquita(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Se activa al tocar el botón '💸 Dividir (Vaquita)'. Pide monto y concepto."""
    query = update.callback_query
    await query.answer()

    await query.edit_message_text(
        "🐄 *¡MODO VAQUITA!*\n"
        "─" * 22 + "\n\n"
        "Contame: ¿cuánto gastaste en total y en qué?\n\n"
        "Escribilo así:\n"
        "`25000 Asado en lo de Pepe`\n"
        "`12500 Pizzas`\n"
        "`8000 en Birras`\n\n"
        "_Mandá /cancelar para salir._",
        parse_mode='Markdown',
    )
    return ESPERANDO_TOTAL


# ── PASO 2: Recibir monto + concepto ─────────────────────

async def recibir_total(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Parsea el monto y concepto del mensaje del usuario.
    Acepta formatos: "25000 Asado", "25000 en Asado", "$25.000 Asado"
    """
    texto = update.message.text.strip()

    # Intentar extraer monto y concepto con regex flexible
    # Patrón: número (con posibles puntos, comas, $) + texto opcional
    match = re.match(
        r'^\$?\s*([\d.,]+)\s+(?:en\s+)?(.+)$',
        texto,
        re.IGNORECASE,
    )

    if not match:
        # Probar si solo mandó un número sin concepto
        match_solo_num = re.match(r'^\$?\s*([\d.,]+)\s*$', texto)
        if match_solo_num:
            monto_str = match_solo_num.group(1)
            concepto = "Vaquita"
        else:
            await update.message.reply_text(
                "❌ No entendí. Escribí el monto seguido del concepto.\n\n"
                "Ejemplo: `25000 Asado`",
                parse_mode='Markdown',
            )
            return ESPERANDO_TOTAL
    else:
        monto_str = match.group(1)
        concepto = match.group(2).strip()

    # Parsear monto
    try:
        # Limpiar separadores: "25.000" → "25000", "25,5" → "25.5"
        monto_limpio = monto_str.replace(".", "").replace(",", ".")
        monto = float(monto_limpio)
        if monto <= 0:
            raise ValueError()
    except ValueError:
        await update.message.reply_text(
            "❌ El monto no es válido. Mandá solo números.\n"
            "Ejemplo: `25000 Asado`",
            parse_mode='Markdown',
        )
        return ESPERANDO_TOTAL

    # Guardar en contexto
    context.user_data['vaquita_monto'] = monto
    context.user_data['vaquita_concepto'] = concepto.title()

    await update.message.reply_text(
        f"✅ *${monto:,.0f}* en *{concepto.title()}*\n\n"
        f"¿Entre cuántas personas lo dividimos? (contándote a vos)\n\n"
        f"Ejemplo: `4`",
        parse_mode='Markdown',
    )
    return ESPERANDO_PERSONAS


# ── PASO 3: Recibir cantidad de personas y dividir ───────

async def recibir_personas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Divide el total, registra la parte del usuario y genera el texto para WA."""
    texto = update.message.text.strip()

    # Parsear cantidad de personas
    try:
        personas = int(texto)
        if personas < 2:
            await update.message.reply_text(
                "🤔 Tienen que ser al menos 2 personas para una vaquita.\n"
                "¿Cuántos son?",
            )
            return ESPERANDO_PERSONAS
        if personas > 50:
            await update.message.reply_text(
                "😅 ¿Más de 50 personas? Eso es un evento, no una vaquita.\n"
                "Mandá un número razonable.",
            )
            return ESPERANDO_PERSONAS
    except ValueError:
        await update.message.reply_text(
            "❌ Mandá un número. Ejemplo: `4`",
            parse_mode='Markdown',
        )
        return ESPERANDO_PERSONAS

    monto_total = context.user_data.get('vaquita_monto', 0)
    concepto = context.user_data.get('vaquita_concepto', 'Vaquita')
    cuota = monto_total / personas

    user_id = update.effective_user.id

    # ── 3.1: Registrar la parte del usuario como gasto ──
    try:
        mov_id = await db.agregar_movimiento(
            user_id,
            'egreso',
            cuota,
            'Ocio',
            f"Vaquita: {concepto}",
        )
    except Exception as e:
        logger.error(f"Error registrando vaquita: {e}")
        mov_id = None

    # ── 3.2: Generar texto para copiar ──
    texto_wsp = (
        f"🐄 ¡Che, la vaquita!\n\n"
        f"📝 {concepto}\n"
        f"💰 Total: ${monto_total:,.0f}\n"
        f"👥 Somos {personas} personas\n"
        f"💸 Nos toca ${cuota:,.0f} a cada uno\n\n"
        f"📲 Alias: [TU_ALIAS_ACÁ]\n\n"
        f"¡Gracias! 🙌"
    )

    # ── Mensaje final al usuario ──
    msg_resumen = (
        f"🐄 *¡VAQUITA LISTA!*\n"
        f"{'─' * 22}\n\n"
        f"📝 *{concepto}*\n"
        f"💰 Total: *${monto_total:,.0f}*\n"
        f"👥 Personas: *{personas}*\n"
        f"💸 Cuota: *${cuota:,.0f}* c/u\n\n"
    )

    if mov_id:
        msg_resumen += f"✅ Tu parte (*${cuota:,.0f}*) ya quedó registrada como gasto.\n\n"
    else:
        msg_resumen += "⚠️ No pude registrar tu parte. Anotalo manualmente.\n\n"

    msg_resumen += (
        "👇 *Copiá y pegá este texto para cobrarles:*\n"
        "─" * 22
    )

    await update.message.reply_text(
        msg_resumen,
        parse_mode='Markdown',
        reply_markup=teclado_navegacion(),
    )

    # Enviar el texto para copiar como mensaje aparte (sin formato)
    await update.message.reply_text(texto_wsp)

    # Botón para deshacer
    if mov_id:
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                "↩️ Deshacer registro",
                callback_data=f"undo_{mov_id}",
            )],
        ])
        await update.message.reply_text(
            "¿Te arrepentiste? Podés borrar el gasto:",
            reply_markup=keyboard,
        )

    # Limpiar contexto
    context.user_data.pop('vaquita_monto', None)
    context.user_data.pop('vaquita_concepto', None)

    return ConversationHandler.END


# ── Cancelar ──────────────────────────────────────────────

async def cancelar_vaquita(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela la vaquita desde /cancelar."""
    context.user_data.pop('vaquita_monto', None)
    context.user_data.pop('vaquita_concepto', None)
    await update.message.reply_text(
        "❌ Vaquita cancelada.",
        reply_markup=teclado_navegacion(),
    )
    return ConversationHandler.END


async def cancelar_vaquita_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela desde un botón inline."""
    query = update.callback_query
    await query.answer()
    context.user_data.pop('vaquita_monto', None)
    context.user_data.pop('vaquita_concepto', None)
    await query.edit_message_text(
        "❌ Vaquita cancelada.",
        reply_markup=teclado_volver(),
    )
    return ConversationHandler.END


# ── Definición del ConversationHandler ────────────────────

conv_vaquita_handler = ConversationHandler(
    entry_points=[
        CallbackQueryHandler(iniciar_vaquita, pattern="^menu_vaquita$"),
    ],
    states={
        ESPERANDO_TOTAL: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_total),
        ],
        ESPERANDO_PERSONAS: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_personas),
        ],
    },
    fallbacks=[
        CommandHandler("cancelar", cancelar_vaquita),
        CallbackQueryHandler(cancelar_vaquita_callback, pattern="^vaq_cancelar$"),
    ],
    per_message=False,
)
