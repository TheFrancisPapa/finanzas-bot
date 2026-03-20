"""
handlers/inversiones.py — Portafolio de Inversiones.

Incluye:
- Vista principal con cotizaciones en tiempo real.
- ConversationHandler para agregar activos (tipo → ticker → cantidad).
- Borrado de activos.

Todo en un ConversationHandler unificado.
"""

import asyncio
import logging

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, constants
from telegram.ext import (
    ContextTypes, ConversationHandler,
    CallbackQueryHandler, MessageHandler, CommandHandler, filters,
)

from db import db
from servicios.inversiones_api import obtener_precio, EMOJIS_TIPO
from servicios import get_cotizacion_dolar, rate_limiter, client, MODEL_NAME, msg_rate_limit
from handlers.comunes import teclado_volver, teclado_navegacion
from utils.prompts import prompt_radar_mercado

logger = logging.getLogger('Manguito')

# Estados
PEDIR_TIPO, PEDIR_TICKER, PEDIR_CANTIDAD = range(3)

# Tipos válidos de activo
TIPOS_ACTIVO = ['Cripto', 'CEDEAR', 'Acción', 'ETF', 'Bono', 'Moneda']


# ══════════════════════════════════════════════════════════
#  VISTA PRINCIPAL — PORTAFOLIO
# ══════════════════════════════════════════════════════════

async def vista_portafolio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Muestra el portafolio con cotizaciones en tiempo real.
    Se activa desde callback_data="menu_inversiones".
    """
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    activos = await db.get_inversiones(user_id)

    botones_acciones = [
        [
            InlineKeyboardButton("➕ Agregar Activo", callback_data="inv_agregar"),
            InlineKeyboardButton("🗑️ Vender/Borrar", callback_data="inv_borrar_menu"),
        ],
        [InlineKeyboardButton("📡 Radar de Mercado", callback_data="inv_radar_mercado")],
        [InlineKeyboardButton("🔄 Actualizar Precios", callback_data="menu_inversiones")],
        [InlineKeyboardButton("◀️ Menú Principal", callback_data="cmd_menu")],
    ]

    if not activos:
        msg = (
            "💼 *MI PORTAFOLIO*\n"
            "─" * 22 + "\n\n"
            "No tenés activos cargados.\n\n"
            "Podés cargar: Criptos, CEDEARs, Acciones,\n"
            "Bonos y Monedas (USD).\n\n"
            "Tocá *➕ Agregar Activo* para empezar."
        )
        await query.edit_message_text(
            msg,
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup(botones_acciones),
        )
        return ConversationHandler.END

    # Mostrar typing mientras busca cotizaciones
    await context.bot.send_chat_action(
        chat_id=query.message.chat_id,
        action=constants.ChatAction.TYPING,
    )

    # Buscar cotizaciones en paralelo
    tareas = []
    for inv_id, tipo, ticker, cantidad in activos:
        tareas.append(obtener_precio(tipo, ticker))

    precios = await asyncio.gather(*tareas)

    # Obtener dólar blue para conversión
    _, dolar_blue, _ = await get_cotizacion_dolar("blue")
    dolar_blue = dolar_blue or 0

    msg = "💼 *MI PORTAFOLIO*\n" + "─" * 22 + "\n\n"
    total_ars = 0
    errores = []

    for i, (inv_id, tipo, ticker, cantidad) in enumerate(activos):
        info = precios[i]
        emoji = EMOJIS_TIPO.get(tipo, '📌')

        if info.get("error"):
            errores.append(f"⚠️ {ticker}: {info['error']}")
            msg += f"{emoji} *{ticker}* ({tipo}): {cantidad:g} — _sin cotización_\n"
            continue

        precio = info["precio"]
        moneda = info["moneda"]
        nombre = info["nombre"]
        valor_total = precio * cantidad

        if moneda == "USD":
            valor_ars = valor_total * dolar_blue if dolar_blue > 0 else 0
            total_ars += valor_ars
            msg += (
                f"{emoji} *{ticker}* ({tipo})\n"
                f"   {cantidad:g} × U$S {precio:,.2f} = *U$S {valor_total:,.2f}*"
            )
            if valor_ars > 0:
                msg += f" _(~${valor_ars:,.0f})_"
            msg += "\n"
        else:
            total_ars += valor_total
            msg += (
                f"{emoji} *{ticker}* ({tipo})\n"
                f"   {cantidad:g} × ${precio:,.0f} = *${valor_total:,.0f}*\n"
            )

    msg += "─" * 22 + "\n"
    msg += f"💰 *Total estimado: ${total_ars:,.0f} ARS*"
    if dolar_blue > 0 and total_ars > 0:
        total_usd = total_ars / dolar_blue
        msg += f"\n💵 _(~U$S {total_usd:,.2f} Blue)_"

    if errores:
        msg += "\n\n" + "\n".join(errores[:3])

    try:
        await query.edit_message_text(
            msg,
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup(botones_acciones),
        )
    except Exception as e:
        if "Message is not modified" in str(e):
            await query.answer("📊 Los precios no cambiaron todavía (se actualizan cada 5 min).", show_alert=True)
        else:
            raise
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  AGREGAR ACTIVO
# ══════════════════════════════════════════════════════════

async def iniciar_agregar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra los tipos de activo como botones."""
    query = update.callback_query
    await query.answer()

    # Limitar activos
    user_id = query.from_user.id
    activos = await db.get_inversiones(user_id)
    if len(activos) >= 20:
        await query.edit_message_text(
            "⚠️ Ya tenés 20 activos. Borrá alguno para agregar otro.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    keyboard = []
    for tipo in TIPOS_ACTIVO:
        emoji = EMOJIS_TIPO.get(tipo, '📌')
        keyboard.append(
            [InlineKeyboardButton(f"{emoji} {tipo}", callback_data=f"inv_tipo_{tipo}")]
        )
    keyboard.append(
        [InlineKeyboardButton("◀️ Cancelar", callback_data="menu_inversiones")]
    )

    await query.edit_message_text(
        "➕ *AGREGAR ACTIVO*\n\n"
        "¿Qué tipo de activo querés cargar?",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return PEDIR_TIPO


async def recibir_tipo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Guarda el tipo y pide el ticker."""
    query = update.callback_query
    await query.answer()

    tipo = query.data.replace("inv_tipo_", "")
    context.user_data['inv_tipo'] = tipo

    ejemplos = {
        'Cripto': "`BTC`, `ETH`, `SOL`, `ADA`",
        'CEDEAR': "`AAPL`, `MSFT`, `TSLA`, `MELI`",
        'Acción': "`GGAL`, `YPF`, `PAMP`, `BBAR`",
        'ETF': "`SPY`, `QQQ`, `VOO`, `VTI` (precio en USD)",
        'Bono': "`AL30`, `GD30`, `AL35`, `GD35`",
        'Moneda': "`USD` (Dólar Blue)",
    }

    emoji = EMOJIS_TIPO.get(tipo, '📌')
    await query.edit_message_text(
        f"{emoji} Tipo: *{tipo}*\n\n"
        f"¿Cuál es el ticker/símbolo?\n\n"
        f"Ejemplos: {ejemplos.get(tipo, '')}\n\n"
        f"_Mandá /cancelar para salir._",
        parse_mode='Markdown',
    )
    return PEDIR_TICKER


async def recibir_ticker(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Guarda el ticker y pide la cantidad."""
    ticker = update.message.text.strip().upper()

    if len(ticker) > 10 or len(ticker) < 1:
        await update.message.reply_text(
            "❌ El ticker debe tener entre 1 y 10 caracteres."
        )
        return PEDIR_TICKER

    # Validar que no tenga caracteres raros
    if not ticker.replace(".", "").replace("-", "").isalnum():
        await update.message.reply_text(
            "❌ El ticker solo puede tener letras y números."
        )
        return PEDIR_TICKER

    context.user_data['inv_ticker'] = ticker
    tipo = context.user_data.get('inv_tipo', '?')
    emoji = EMOJIS_TIPO.get(tipo, '📌')

    await update.message.reply_text(
        f"{emoji} *{tipo}* — Ticker: *{ticker}*\n\n"
        f"¿Cuántas unidades tenés?\n\n"
        f"Ejemplo: `0.5` (para cripto), `10` (para CEDEARs), `500` (para USD)\n\n"
        f"_Mandá /cancelar para salir._",
        parse_mode='Markdown',
    )
    return PEDIR_CANTIDAD


async def recibir_cantidad(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Guarda la cantidad y registra el activo."""
    texto = update.message.text.strip()

    try:
        cantidad = float(texto.replace(",", "."))
        if cantidad <= 0:
            raise ValueError()
    except ValueError:
        await update.message.reply_text(
            "❌ Cantidad inválida. Escribí un número (ej: 10, 0.5, 500)."
        )
        return PEDIR_CANTIDAD

    tipo = context.user_data.get('inv_tipo', 'Varios')
    ticker = context.user_data.get('inv_ticker', '???')
    user_id = update.effective_user.id

    try:
        await db.agregar_inversion(user_id, tipo, ticker, cantidad)
        
        # ═══ LOGROS ═══
        from servicios.gamificacion import chequear_logros
        await chequear_logros(user_id, "nueva_inversion", update, context)
        
    except Exception as e:
        logger.error(f"Error agregando inversión: {e}")
        await update.message.reply_text(
            "❌ Error al agregar el activo. Probá de nuevo.",
            reply_markup=teclado_navegacion(),
        )
        _limpiar_contexto(context)
        return ConversationHandler.END

    emoji = EMOJIS_TIPO.get(tipo, '📌')

    # Intentar obtener el precio actual
    info = await obtener_precio(tipo, ticker)
    precio_msg = ""
    if info and not info.get("error"):
        precio = info["precio"]
        moneda = info["moneda"]
        valor = precio * cantidad
        if moneda == "USD":
            precio_msg = f"\n💰 Valor actual: *U$S {valor:,.2f}*"
        else:
            precio_msg = f"\n💰 Valor actual: *${valor:,.0f}*"

    await update.message.reply_text(
        f"✅ *¡Activo agregado al portafolio!*\n\n"
        f"{emoji} *{ticker}* ({tipo})\n"
        f"📊 Cantidad: *{cantidad:g}*{precio_msg}\n\n"
        f"Tocá *📈 Inversiones* en el menú para ver tu portafolio.",
        parse_mode='Markdown',
        reply_markup=teclado_navegacion(),
    )

    _limpiar_contexto(context)
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  BORRAR ACTIVO
# ══════════════════════════════════════════════════════════

async def menu_borrar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra los activos como botones para borrar."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    activos = await db.get_inversiones(user_id)

    if not activos:
        await query.edit_message_text(
            "🤷‍♂️ No tenés activos para borrar.",
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    keyboard = []
    for inv_id, tipo, ticker, cantidad in activos:
        emoji = EMOJIS_TIPO.get(tipo, '📌')
        keyboard.append(
            [InlineKeyboardButton(
                f"🗑️ {emoji} {ticker} ({cantidad:g})",
                callback_data=f"inv_del_{inv_id}",
            )]
        )
    keyboard.append(
        [InlineKeyboardButton("◀️ Volver", callback_data="menu_inversiones")]
    )

    await query.edit_message_text(
        "🗑️ *VENDER / BORRAR ACTIVO*\n\n"
        "¿Cuál activo querés quitar del portafolio?",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ConversationHandler.END


async def confirmar_borrar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Borra el activo seleccionado."""
    query = update.callback_query
    await query.answer()

    inv_id = int(query.data.replace("inv_del_", ""))
    user_id = query.from_user.id

    resultado = await db.borrar_inversion(user_id, inv_id)

    if resultado:
        tipo, ticker = resultado
        emoji = EMOJIS_TIPO.get(tipo, '📌')
        await query.edit_message_text(
            f"🗑️ Activo {emoji} *{ticker}* eliminado del portafolio.",
            parse_mode='Markdown',
            reply_markup=teclado_volver(),
        )
    else:
        await query.edit_message_text(
            "❌ Ese activo ya no existe.",
            reply_markup=teclado_volver(),
        )
    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  UTILIDADES Y CANCELAR
# ══════════════════════════════════════════════════════════

def _limpiar_contexto(context):
    for key in ('inv_tipo', 'inv_ticker'):
        context.user_data.pop(key, None)


async def cancelar_inversion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela cualquier flujo."""
    _limpiar_contexto(context)
    await update.message.reply_text(
        "❌ Operación cancelada.",
        reply_markup=teclado_navegacion(),
    )
    return ConversationHandler.END


# ════════════════════════════════════════════════════════
#  RADAR DE MERCADO — Recomendaciones IA
# ════════════════════════════════════════════════════════

async def radar_mercado(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Genera recomendaciones de inversión con IA basadas en el contexto macro."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id

    # Check PRO
    if not await db.es_pro(user_id):
        from handlers.comunes import msg_necesita_pro
        await query.edit_message_text(
            await msg_necesita_pro("Radar de Mercado", user_id),
            parse_mode='Markdown',
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    # Rate limit
    if not await rate_limiter.puede_usar_ia(user_id):
        await query.edit_message_text(
            msg_rate_limit(),
            parse_mode='Markdown',
            reply_markup=teclado_volver(),
        )
        return ConversationHandler.END

    # Mensaje de espera
    await query.edit_message_text(
        "📡 _Escaneando los mercados globales..._",
        parse_mode='Markdown',
    )

    try:
        # Armar resumen del portafolio actual
        activos = await db.get_inversiones(user_id)
        if activos:
            lineas = []
            for inv_id, tipo, ticker, cantidad in activos:
                emoji = EMOJIS_TIPO.get(tipo, '📌')
                lineas.append(f"{emoji} {ticker} ({tipo}) — {cantidad:g} unidades")
            portafolio_str = "\n".join(lineas)
        else:
            portafolio_str = "(Portafolio vacío — no tiene activos cargados)"

        # Llamar a Gemini
        prompt = prompt_radar_mercado(portafolio_str)
        response = await asyncio.to_thread(
            client.models.generate_content, model=MODEL_NAME, contents=prompt
        )
        await rate_limiter.registrar_uso(user_id)

        respuesta_ia = response.text

        # Disclaimer legal
        disclaimer = (
            "\n\n" + "─" * 22 + "\n"
            "⚠️ _Esta información es sólo orientativa y NO constituye "
            "asesoramiento financiero profesional. "
            "Manguito no se responsabiliza por decisiones de inversión. "
            "Consultá siempre con un profesional matriculado._"
        )

        separador = "─" * 22
        msg = (
            f"📡 *RADAR DE MERCADO*\n{separador}\n\n"
            f"{respuesta_ia}"
            f"{disclaimer}"
        )

        keyboard = [
            [InlineKeyboardButton("🔄 Nuevo Análisis", callback_data="inv_radar_mercado")],
            [InlineKeyboardButton("◀️ Volver al Portafolio", callback_data="menu_inversiones")],
        ]

        await query.edit_message_text(
            msg,
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup(keyboard),
        )

    except Exception as e:
        logger.error(f"Error en Radar de Mercado para {user_id}: {e}")
        await query.edit_message_text(
            "📡 _Error al escanear los mercados. Intentá de nuevo._",
            parse_mode='Markdown',
            reply_markup=teclado_volver(),
        )

    return ConversationHandler.END


# ══════════════════════════════════════════════════════════
#  CONVERSATION HANDLER
# ══════════════════════════════════════════════════════════

conv_inversiones_handler = ConversationHandler(
    entry_points=[
        # Vista principal portafolio
        CallbackQueryHandler(vista_portafolio, pattern="^menu_inversiones$"),
        # Agregar activo
        CallbackQueryHandler(iniciar_agregar, pattern="^inv_agregar$"),
        # Borrar — menú
        CallbackQueryHandler(menu_borrar, pattern="^inv_borrar_menu$"),
        # Borrar — confirmar
        CallbackQueryHandler(confirmar_borrar, pattern=r"^inv_del_\d+$"),
        # Radar de Mercado — IA
        CallbackQueryHandler(radar_mercado, pattern="^inv_radar_mercado$"),
    ],
    states={
        PEDIR_TIPO: [
            CallbackQueryHandler(recibir_tipo, pattern=r"^inv_tipo_"),
        ],
        PEDIR_TICKER: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_ticker),
        ],
        PEDIR_CANTIDAD: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_cantidad),
        ],
    },
    fallbacks=[
        CommandHandler("cancelar", cancelar_inversion),
        CallbackQueryHandler(vista_portafolio, pattern="^menu_inversiones$"),
    ],
    per_message=False,
)
