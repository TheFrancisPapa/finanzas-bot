"""
handlers/edicion_visual.py — Edición Visual Interactiva de movimientos.

Reemplaza el uso de /editar y /borrar con un flujo 100% basado en botones:
  1. El usuario ve sus últimos movimientos como botones.
  2. Toca uno → elige Editar Monto o Borrar.
  3. Si edita, escribe el nuevo monto y listo.
"""

import logging
from datetime import datetime

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ContextTypes, ConversationHandler,
    CallbackQueryHandler, MessageHandler, CommandHandler, filters,
)

from utils.textos import EMOJIS_CATEGORIA
from handlers.comunes import teclado_volver, teclado_navegacion
from handlers.movimientos import _aprender_regla
from db import db

logger = logging.getLogger('Manguito')

# Estados de la conversación
ESPERANDO_NUEVO_MONTO = 0


# ── PASO 1: Mostrar lista de movimientos ──────────────────

async def mostrar_movimientos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Muestra los movimientos como botones inline con paginación de a 5.
    Se activa desde callback_data="menu_editar" o "nav_editar_<offset>".
    """
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    data = query.data
    
    offset = 0
    if data.startswith("nav_editar_"):
        offset = int(data.replace("nav_editar_", ""))
        
    limite = 5
    
    movimientos = await db.get_movimientos_paginados(user_id, limite, offset)
    total_movimientos = await db.contar_movimientos_total(user_id)

    if not movimientos and offset == 0:
        await query.edit_message_text(
            "🤷‍♂️ No tenés movimientos para editar.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    keyboard = []
    for mov_id, desc, monto, tipo, cat, fecha in movimientos:
        emoji_tipo = "🟢" if tipo == "ingreso" else "🔴"
        emoji_cat = EMOJIS_CATEGORIA.get(cat, "📌")
        # Truncar descripción si es muy larga
        desc_corta = desc[:18] + "…" if len(desc) > 18 else desc
        boton_texto = f"{emoji_tipo}{emoji_cat} {desc_corta} — ${monto:,.0f}"
        keyboard.append(
            [InlineKeyboardButton(boton_texto, callback_data=f"ed_mov_{mov_id}")]
        )

    # ── Fila de Navegación ──
    nav_buttons = []
    if offset > 0:
        nav_buttons.append(InlineKeyboardButton("⬅️ Anterior", callback_data=f"nav_editar_{max(0, offset - limite)}"))
    if offset + limite < total_movimientos:
        nav_buttons.append(InlineKeyboardButton("Siguiente ➡️", callback_data=f"nav_editar_{offset + limite}"))
        
    if nav_buttons:
        keyboard.append(nav_buttons)

    keyboard.append(
        [InlineKeyboardButton("◀️ Volver", callback_data="ed_cancelar")]
    )

    await query.edit_message_text(
        f"✏️ *EDITAR MOVIMIENTOS*\n"
        f"─" * 22 + f"\n\n"
        f"_Mostrando {min(offset + 1, total_movimientos)} a {min(offset + limite, total_movimientos)} de {total_movimientos}_\n\n"
        f"Tocá el movimiento que querés modificar:",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ConversationHandler.END  # Volvemos a END; el siguiente paso lo captura otro callback


# ── PASO 2: Elegir acción (Editar / Borrar) ──────────────

async def elegir_accion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    El usuario tocó un movimiento específico. Mostramos opciones.
    callback_data = "ed_mov_<ID>"
    """
    query = update.callback_query
    await query.answer()

    mov_id = int(query.data.replace("ed_mov_", ""))
    user_id = query.from_user.id

    # Guardar el ID del movimiento seleccionado
    context.user_data['edicion_mov_id'] = mov_id

    # Buscar detalle del movimiento para mostrarlo
    movimientos = await db.get_ultimos_movimientos_con_id(user_id, 50)
    detalle = None
    for m in movimientos:
        if m[0] == mov_id:
            detalle = m
            break

    if not detalle:
        await query.edit_message_text(
            "❌ No encontré ese movimiento. Puede que ya se haya borrado.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    _id, desc, monto, tipo, cat, fecha = detalle
    emoji_tipo = "🟢 Ingreso" if tipo == "ingreso" else "🔴 Gasto"
    emoji_cat = EMOJIS_CATEGORIA.get(cat, "📌")

    try:
        fecha_str = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S').strftime('%d/%m/%Y %H:%M')
    except Exception:
        fecha_str = fecha or "--"

    msg = (
        f"📋 *Movimiento seleccionado:*\n\n"
        f"{emoji_cat} *{desc}*\n"
        f"💲 Monto: *${monto:,.0f}*\n"
        f"📁 Categoría: _{cat}_\n"
        f"📅 Fecha: _{fecha_str}_\n"
        f"🏷️ Tipo: _{emoji_tipo}_\n\n"
        f"¿Qué querés hacer?"
    )

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✏️ Editar Monto", callback_data=f"ed_monto_{mov_id}"),
            InlineKeyboardButton("🗑️ Borrar", callback_data=f"ed_borrar_{mov_id}"),
        ],
        [InlineKeyboardButton("🏷️ Cambiar Categoría", callback_data=f"ed_cat_{mov_id}")],
        [InlineKeyboardButton("◀️ Volver a la lista", callback_data="menu_editar")],
    ])

    await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=keyboard)
    return ConversationHandler.END


# ── PASO 3a: Borrar movimiento ────────────────────────────

async def borrar_movimiento(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Borra el movimiento seleccionado.
    callback_data = "ed_borrar_<ID>"
    """
    query = update.callback_query
    await query.answer()

    mov_id = int(query.data.replace("ed_borrar_", ""))
    user_id = query.from_user.id

    resultado = await db.borrar_por_id(user_id, mov_id)

    if resultado:
        desc, monto = resultado
        await query.edit_message_text(
            f"🗑️ *Eliminado:* _{desc}_ (${monto:,.0f})\n\n"
            f"El movimiento fue borrado permanentemente.",
            parse_mode='Markdown',
            reply_markup=teclado_volver(),
        )
    else:
        await query.edit_message_text(
            "❌ No se pudo borrar. Ya fue eliminado o no existe.",
            reply_markup=teclado_volver(),
        )

    # Limpiar datos temporales
    context.user_data.pop('edicion_mov_id', None)
    return ConversationHandler.END


# ── PASO 3b: Pedir nuevo monto ────────────────────────────

async def pedir_nuevo_monto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    El usuario eligió editar. Pedimos el nuevo monto.
    callback_data = "ed_monto_<ID>"
    """
    query = update.callback_query
    await query.answer()

    mov_id = int(query.data.replace("ed_monto_", ""))
    context.user_data['edicion_mov_id'] = mov_id

    await query.edit_message_text(
        "✏️ Escribí el *nuevo monto* (solo números, ej: 3500):\n\n"
        "_Mandá /cancelar para salir._",
        parse_mode='Markdown',
    )
    return ESPERANDO_NUEVO_MONTO


# ── PASO 4: Recibir y aplicar nuevo monto ─────────────────

async def recibir_nuevo_monto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Recibe el texto con el nuevo monto y actualiza en la BD."""
    texto = update.message.text

    # Parsear monto
    try:
        nuevo_monto = float(texto.replace(",", ".").replace("$", "").strip())
        if nuevo_monto <= 0:
            raise ValueError()
    except ValueError:
        await update.message.reply_text(
            "❌ Eso no parece un monto válido. Escribí solo números (ej: 3500)."
        )
        return ESPERANDO_NUEVO_MONTO

    mov_id = context.user_data.get('edicion_mov_id')
    if not mov_id:
        await update.message.reply_text(
            "❌ Perdí el contexto. Volvé a empezar desde ✏️ Editar.",
            reply_markup=teclado_navegacion(),
        )
        return ConversationHandler.END

    user_id = update.effective_user.id
    resultado = await db.editar_movimiento(user_id, mov_id, nuevo_monto)

    if resultado:
        desc, monto_viejo = resultado
        await update.message.reply_text(
            f"✅ *¡Actualizado!*\n\n"
            f"📝 _{desc}_\n"
            f"💰 ${monto_viejo:,.0f} → *${nuevo_monto:,.0f}*",
            parse_mode='Markdown',
            reply_markup=teclado_navegacion(),
        )
    else:
        await update.message.reply_text(
            "❌ No se pudo editar. El movimiento no existe o ya fue borrado.",
            reply_markup=teclado_navegacion(),
        )

    context.user_data.pop('edicion_mov_id', None)
    return ConversationHandler.END


# ── PASO 5: Cambiar y Aplicar Categoría ───────────────────

async def pedir_nueva_categoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    mov_id = int(query.data.replace("ed_cat_", ""))
    user_id = query.from_user.id
    context.user_data['edicion_mov_id'] = mov_id

    # Obtener categorías dinámicas de la DB
    categorias_bd = await db.categorias.get_categorias(user_id)
    categorias = [c[0] for c in categorias_bd]
    
    # Armar teclado inline usando las categorías
    keyboard = []
    row = []
    for cat in categorias:
        row.append(InlineKeyboardButton(cat, callback_data=f"ap_cat_{cat}"))
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    
    keyboard.append([InlineKeyboardButton("❌ Cancelar", callback_data="ed_cancelar")])

    await query.edit_message_text(
        "🏷️ Seleccioná la *nueva categoría* para este movimiento:",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    return ConversationHandler.END


async def aplicar_nueva_categoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    nueva_categoria = query.data.replace("ap_cat_", "")
    mov_id = context.user_data.get('edicion_mov_id')

    if not mov_id:
        await query.edit_message_text(
            "❌ Perdí el contexto. Volvé a empezar desde ✏️ Editar.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    user_id = query.from_user.id
    resultado = await db.editar_categoria(user_id, mov_id, nueva_categoria)

    if resultado:
        desc, categoria_vieja = resultado
        
        # Retroalimentación para el Modo Flash
        await _aprender_regla(user_id, desc, nueva_categoria)

        await query.edit_message_text(
            f"✅ *¡Categoría Actualizada e IA Entrenada!*\n\n"
            f"📝 _{desc}_\n"
            f"📁 {categoria_vieja} → *{nueva_categoria}*",
            parse_mode='Markdown',
            reply_markup=teclado_volver(),
        )
    else:
        await query.edit_message_text(
            "❌ No se pudo editar. El movimiento no existe o ya fue borrado.",
            reply_markup=teclado_volver(),
        )

    context.user_data.pop('edicion_mov_id', None)
    return ConversationHandler.END


# ── Cancelar ──────────────────────────────────────────────

async def cancelar_edicion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela el flujo de edición desde un comando."""
    context.user_data.pop('edicion_mov_id', None)
    await update.message.reply_text(
        "❌ Edición cancelada.",
        reply_markup=teclado_navegacion(),
    )
    return ConversationHandler.END


async def cancelar_edicion_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela desde el botón Volver."""
    query = update.callback_query
    await query.answer()
    context.user_data.pop('edicion_mov_id', None)
    await query.edit_message_text(
        "❌ Edición cancelada.",
        reply_markup=teclado_volver(),
    )
    return ConversationHandler.END


# ── Definición del ConversationHandler ────────────────────

conv_edicion_handler = ConversationHandler(
    entry_points=[
        # Entrada desde botón inline del menú o paginación
        CallbackQueryHandler(mostrar_movimientos, pattern=r"^(menu_editar|nav_editar_\d+)$"),
        # Seleccionar un movimiento
        CallbackQueryHandler(elegir_accion, pattern=r"^ed_mov_\d+$"),
        # Editar monto (pasa a estado ESPERANDO_NUEVO_MONTO)
        CallbackQueryHandler(pedir_nuevo_monto, pattern=r"^ed_monto_\d+$"),
        # Pedir y aplicar nueva categoría
        CallbackQueryHandler(pedir_nueva_categoria, pattern=r"^ed_cat_\d+$"),
        CallbackQueryHandler(aplicar_nueva_categoria, pattern=r"^ap_cat_"),
        # Borrar directo
        CallbackQueryHandler(borrar_movimiento, pattern=r"^ed_borrar_\d+$"),
    ],
    states={
        ESPERANDO_NUEVO_MONTO: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_nuevo_monto),
        ],
    },
    fallbacks=[
        CommandHandler("cancelar", cancelar_edicion),
        CallbackQueryHandler(cancelar_edicion_callback, pattern="^ed_cancelar$"),
    ],
    per_message=False,
)
