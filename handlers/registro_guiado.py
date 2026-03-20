"""
handlers/registro_guiado.py — Flujo guiado para registrar transacciones.

Maneja la conversación de: "➕ Registrar" -> Seleccionar tipo -> Monto -> Descripción
"""

import logging
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import (
    ContextTypes, ConversationHandler, CommandHandler, 
    MessageHandler, filters
)

from db import db
from utils.textos import EMOJIS_CATEGORIA
from handlers.comunes import teclado_navegacion

logger = logging.getLogger('Manguito')

# Estados de la conversación
SELECCIONAR_TIPO, PEDIR_MONTO, PEDIR_CATEGORIA, PEDIR_DESCRIPCION = range(4)


async def iniciar_registro(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Paso 1: Opción seleccionada desde el teclado navegacion. Pregunta el tipo."""
    teclado_tipos = [
        [KeyboardButton("🔴 Gasto"), KeyboardButton("🟢 Ingreso")],
        [KeyboardButton("❌ Cancelar")]
    ]
    reply_markup = ReplyKeyboardMarkup(teclado_tipos, resize_keyboard=True, one_time_keyboard=True)
    
    await update.message.reply_text(
        "¿Qué querés registrar?", 
        reply_markup=reply_markup
    )
    return SELECCIONAR_TIPO


async def procesar_tipo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Paso 2: Guarda el tipo (gasto/ingreso) y pide el monto."""
    texto = update.message.text
    
    if "Cancelar" in texto:
        return await cancelar_registro(update, context)

    if "Gasto" in texto:
        context.user_data['reg_tipo'] = 'egreso'
        emoji = "🔴"
    elif "Ingreso" in texto:
        context.user_data['reg_tipo'] = 'ingreso'
        emoji = "🟢"
    else:
        await update.message.reply_text("Por favor, tocá uno de los botones de abajo.")
        return SELECCIONAR_TIPO

    # Teclado para cancelar simplemente
    cancelar_kb = ReplyKeyboardMarkup([[KeyboardButton("❌ Cancelar")]], resize_keyboard=True)
    
    await update.message.reply_text(
        f"{emoji} Perfecto. Escribí el *monto* (solo números, ej: 1500):",
        parse_mode='Markdown',
        reply_markup=cancelar_kb
    )
    return PEDIR_MONTO


async def procesar_monto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Paso 3: Guarda el monto y pide la categoría."""
    texto = update.message.text
    
    if "Cancelar" in texto:
        return await cancelar_registro(update, context)
    
    try:
        # Convertir a float reemplazando comas por puntos por si acaso
        monto = float(texto.replace(",", "."))
        if monto <= 0:
            raise ValueError()
    except ValueError:
        await update.message.reply_text("Eso no parece un precio válido. Escribí solo números por favor.")
        return PEDIR_MONTO
        
    context.user_data['reg_monto'] = monto
    
    # Teclado de categorías
    user_id = update.effective_user.id
    categorias_bd = await db.categorias.get_categorias(user_id)
    categorias = [c[0] for c in categorias_bd]
    
    # Agrupar de a 2 botones
    teclado_cats = []
    for i in range(0, len(categorias), 2):
        fila = [KeyboardButton(categorias[i])]
        if i+1 < len(categorias):
            fila.append(KeyboardButton(categorias[i+1]))
        teclado_cats.append(fila)
        
    teclado_cats.append([KeyboardButton("❌ Cancelar")])
    reply_markup = ReplyKeyboardMarkup(teclado_cats, resize_keyboard=True, one_time_keyboard=True)
    
    await update.message.reply_text(
        "Seleccioná la *Categoría*:",
        parse_mode='Markdown',
        reply_markup=reply_markup
    )
    return PEDIR_CATEGORIA


async def procesar_categoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Paso 4: Guarda categoría y pide nota de detalle."""
    texto = update.message.text
    
    if "Cancelar" in texto:
        return await cancelar_registro(update, context)
        
    user_id = update.effective_user.id
    categorias_bd = await db.categorias.get_categorias(user_id)
    nombres_cats = [c[0] for c in categorias_bd]
        
    # Asignar la categoría o "Otros" si no la encuentra exactamente igual
    context.user_data['reg_categoria'] = texto if texto in nombres_cats else "Otros"
    
    cancelar_kb = ReplyKeyboardMarkup([[KeyboardButton("❌ Cancelar")]], resize_keyboard=True)
    await update.message.reply_text(
        "Último paso. Escribí una breve *descripción* (ej: Supermercado Coto):",
        parse_mode='Markdown',
        reply_markup=cancelar_kb
    )
    return PEDIR_DESCRIPCION


async def procesar_descripcion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Paso Final: Guarda en DB y avisa al usuario."""
    texto = update.message.text
    
    if "Cancelar" in texto:
        return await cancelar_registro(update, context)
        
    user_id = update.effective_user.id
    tipo = context.user_data.get('reg_tipo')
    monto = context.user_data.get('reg_monto')
    categoria = context.user_data.get('reg_categoria')
    descripcion = texto.title()
    
    # Agregar a la BD
    mov_id = await db.agregar_movimiento(user_id, tipo, monto, categoria, descripcion)
    
    emoji_tipo = "🟢" if tipo == "ingreso" else "🔴"
    emoji_cat = EMOJIS_CATEGORIA.get(categoria, '📌')
    
    mensaje_final = (
        f"✅ *¡Registrado con éxito!*\n\n"
        f"{emoji_tipo} *${monto:,.0f}*\n"
        f"{emoji_cat} {categoria} | _{descripcion}_"
    )
    
    # Limpiamos solo las keys del registro guiado (no tocar otros handlers)
    for k in ('reg_tipo', 'reg_monto', 'reg_categoria'):
        context.user_data.pop(k, None)

    # Volvemos a mandar el teclado principal de navegación
    await update.message.reply_text(
        mensaje_final, 
        parse_mode='Markdown', 
        reply_markup=teclado_navegacion()
    )
    
    return ConversationHandler.END


async def cancelar_registro(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela la conversación en cualquier momento."""
    for key in ('reg_tipo', 'reg_monto', 'reg_categoria', 'reg_descripcion', 'reg_paso'):
        context.user_data.pop(key, None)
    await update.message.reply_text(
        "❌ Registro cancelado.",
        reply_markup=teclado_navegacion()
    )
    return ConversationHandler.END


# Definición completa del Handler de Conversación a importar
conv_registro_handler = ConversationHandler(
    entry_points=[MessageHandler(filters.Regex("^➕ Registrar$"), iniciar_registro)],
    states={
        SELECCIONAR_TIPO: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_tipo)],
        PEDIR_MONTO: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_monto)],
        PEDIR_CATEGORIA: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_categoria)],
        PEDIR_DESCRIPCION: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_descripcion)],
    },
    fallbacks=[CommandHandler("cancelar", cancelar_registro),
               MessageHandler(filters.Regex("^❌ Cancelar$"), cancelar_registro)],
)
