"""
handlers/cuotas.py — Compras en cuotas.

Registra una compra grande, la divide en cuotas y automáticamente carga
la primera cuota al mes actual. Después, un job mensual carga el resto.
"""

import logging
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import ContextTypes, ConversationHandler, CallbackQueryHandler, MessageHandler, CommandHandler, filters

from db import db
from handlers.comunes import teclado_volver, teclado_navegacion

logger = logging.getLogger('Manguito')

# Estados de la conversación
ESPERANDO_DESCRIPCION = 0
ESPERANDO_CATEGORIA = 1
ESPERANDO_MONTO = 2
ESPERANDO_CANTIDAD = 3

# Categorías disponibles estáticas para selección rápida
# Estas se reemplazarán dinámicamente usando db.categorias.get_categorias(user_id)

async def iniciar_cuotas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Inicia el registro de una compra en cuotas."""
    query = update.callback_query
    await query.answer()

    await query.edit_message_text(
        "💳 *COMPRA EN CUOTAS*\n"
        "─" * 22 + "\n\n"
        "Vamos a registrar una compra financiada.\n\n"
        "📝 Ingresá una breve *descripción* de qué compraste:\n"
        "_(Ej: Heladera, Zapatillas, Pasajes a Miami)_\n\n"
        "_Mandá /cancelar en cualquier momento para salir._",
        parse_mode='Markdown'
    )
    return ESPERANDO_DESCRIPCION

async def recibir_descripcion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Recibe la descripción y pide la categoría."""
    descripcion = update.message.text.strip()
    if len(descripcion) < 2:
        await update.message.reply_text("❌ Es muy corta. Ingresá una descripción clara:")
        return ESPERANDO_DESCRIPCION

    context.user_data['cuotas_desc'] = descripcion

    user_id = update.effective_user.id
    categorias_bd = await db.categorias.get_categorias(user_id)
    categorias = [c[0] for c in categorias_bd]

    # Generar teclado de categorías
    keyboard = []
    row = []
    for cat in categorias:
        row.append(InlineKeyboardButton(cat, callback_data=f"cat_{cat}"))
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)

    await update.message.reply_text(
        "📁 Ahora elegí la *categoría* de la compra:",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    return ESPERANDO_CATEGORIA

async def recibir_categoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Recibe la categoría del menú inline y pide el monto exacto por cuota."""
    query = update.callback_query
    await query.answer()

    categoria = query.data.replace('cat_', '')
    context.user_data['cuotas_cat'] = categoria

    des = context.user_data.get('cuotas_desc', 'La compra')
    await query.edit_message_text(
        f"✅ Categoría: *{categoria}*\n\n"
        f"💲 ¿Cuál es el monto *EXACTO de cada cuota* de '{des}'?\n"
        "_(Si sabés el total de la compra dividilo por las cuotas, ej: 15000)_",
        parse_mode='Markdown'
    )
    return ESPERANDO_MONTO

async def recibir_monto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Recibe el monto por cuota y pide la cantidad total de cuotas."""
    texto = update.message.text.strip().replace("$", "").replace(",", ".")
    try:
        monto = float(texto)
        if monto <= 0:
            raise ValueError()
    except ValueError:
        await update.message.reply_text("❌ Eso no parece un monto válido. Solo números (ej: 15000):")
        return ESPERANDO_MONTO

    context.user_data['cuotas_monto'] = monto

    await update.message.reply_text(
        "🔢 Perfecto. ¿En *cuántas cuotas* en total hiciste la compra?\n"
        "_(Ej: 3, 6, 12, 18)_",
        parse_mode='Markdown'
    )
    return ESPERANDO_CANTIDAD

async def finalizar_cuotas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Recibe la cantidad, guarda la configuración, e impacta la Cuota 1."""
    texto = update.message.text.strip()
    try:
        cuotas_totales = int(texto)
        if cuotas_totales < 2:
            await update.message.reply_text("❌ Si es en cuotas, debe ser 2 o más. ¿Cuántas son?")
            return ESPERANDO_CANTIDAD
    except ValueError:
        await update.message.reply_text("❌ Por favor ingresá un número entero (ej: 6):")
        return ESPERANDO_CANTIDAD

    user_id = update.effective_user.id
    desc = context.user_data['cuotas_desc']
    cat = context.user_data['cuotas_cat']
    monto = context.user_data['cuotas_monto']

    # 1. Guardar en Base de Datos para el motor automático (Job_queue)
    await db.agregar_compra_cuotas(
        user_id, 
        descripcion=desc, 
        categoria=cat, 
        monto_cuota=monto, 
        cuotas_totales=cuotas_totales, 
        cuotas_pagadas=1
    )

    # 2. Registrar instantáneamente la CUOTA 1 en los movimientos de hoy
    desc_cuota = f"{desc} (Cuota 1/{cuotas_totales})"
    await db.agregar_movimiento(user_id, tipo="egreso", monto=monto, categoria=cat, descripcion=desc_cuota)

    # Cleanup
    context.user_data.pop('cuotas_desc', None)
    context.user_data.pop('cuotas_cat', None)
    context.user_data.pop('cuotas_monto', None)

    msg = (
        f"✅ *¡COMPRA REGISTRADA!*\n\n"
        f"🛍️ *{desc}* en *{cuotas_totales} cuotas*\n"
        f"💰 Cuota mensual: *${monto:,.0f}*\n\n"
        "📝 _Ya anoté la Cuota 1 en tus gastos de hoy. El resto de las cuotas "
        "se van a debitar automáticamente el día 1 de cada mes._"
    )

    await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=teclado_navegacion())
    return ConversationHandler.END

async def cancelar_cuotas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela si se usa /cancelar."""
    context.user_data.pop('cuotas_desc', None)
    context.user_data.pop('cuotas_cat', None)
    context.user_data.pop('cuotas_monto', None)
    
    await update.message.reply_text("❌ Carga de cuotas cancelada.", reply_markup=teclado_navegacion())
    return ConversationHandler.END


conv_cuotas_handler = ConversationHandler(
    entry_points=[CallbackQueryHandler(iniciar_cuotas, pattern="^menu_cuotas$")],
    states={
        ESPERANDO_DESCRIPCION: [MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_descripcion)],
        ESPERANDO_CATEGORIA: [CallbackQueryHandler(recibir_categoria, pattern="^cat_")],
        ESPERANDO_MONTO: [MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_monto)],
        ESPERANDO_CANTIDAD: [MessageHandler(filters.TEXT & ~filters.COMMAND, finalizar_cuotas)],
    },
    fallbacks=[CommandHandler("cancelar", cancelar_cuotas)],
    per_message=False
)
