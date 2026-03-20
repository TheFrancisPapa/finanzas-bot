"""
handlers/consultas.py — Handlers de consulta (solo lectura).

Funciones: /resumen, /dolar, /historial, /metas, /misfijos, /exportar,
/buscar, /editar
"""

import logging
from datetime import datetime

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

from db import db
from servicios import get_todas_cotizaciones, rate_limiter, msg_rate_limit
from utils.textos import EMOJIS_CATEGORIA
from servicios.reportes import generar_excel_bytes, nombre_mes_es
from servicios.noticias import analizar_noticias_financieras
from handlers.comunes import teclado_principal, teclado_volver, msg_necesita_pro

logger = logging.getLogger('Manguito')


async def resumen(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    ingresos, gastos = await db.get_resumen_mensual(user_id)
    saldo = ingresos - gastos
    ultimos = await db.get_ultimos_movimientos(user_id)

    mensaje = f"📊 *RESUMEN - {nombre_mes_es()}*\n"
    mensaje += "─" * 22 + "\n"
    mensaje += f"🟢 Ingresos: *${ingresos:,.0f}*\n"
    mensaje += f"🔴 Gastos:   *${gastos:,.0f}*\n"
    mensaje += "─" * 22 + "\n"
    emoji_s = "✅" if saldo >= 0 else "⚠️"
    mensaje += f"{emoji_s} *Saldo: ${saldo:,.0f}*\n\n"
    mensaje += "📝 *Últimos movimientos:*\n"

    for desc, monto, tipo, fecha in ultimos:
        icono = "🔴" if tipo == "egreso" else "🟢"
        try:
            fecha_obj = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            try:
                fecha_obj = datetime.strptime(fecha, '%d-%m-%Y %H:%M')
            except ValueError:
                fecha_obj = datetime.now()

        fecha_str = fecha_obj.strftime('%d/%m')
        mensaje += f"{icono} `{fecha_str}` {desc}: ${monto:,.0f}\n"

    await update.message.reply_text(mensaje, parse_mode='Markdown', reply_markup=teclado_principal())

async def exportar_datos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # Check PRO
    if not await db.es_pro(user_id):
        await update.message.reply_text(await msg_necesita_pro("Exportar Excel", user_id), parse_mode='Markdown')
        return
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="upload_document")
    
    ex_buffer = await generar_excel_bytes(user_id)
    
    if not ex_buffer:
        await update.message.reply_text("📂 No hay datos para exportar.", parse_mode='Markdown')
        return

    await update.message.reply_document(
        document=ex_buffer,
        filename=f"Manguito_{datetime.now().strftime('%Y-%m-%d')}.xlsx",
        caption="📊 *Acá tenés tu Excel Premium con todos los movimientos y gráficos.*",
        parse_mode='Markdown'
    )

async def ver_historial(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # Si no puso categoría, mostrar las disponibles
    if not context.args:
        categorias = await db.get_categorias_usuario(user_id)
        if not categorias:
            await update.message.reply_text("🤷‍♂️ No tenés gastos este mes.")
            return
        msg = "📋 *Categorías disponibles:*\n\n"
        for cat in categorias:
            msg += f"• `{cat}`\n"
        msg += "\nUsá: `/historial Comida`"
        await update.message.reply_text(msg, parse_mode='Markdown')
        return
    
    categoria = context.args[0].capitalize()
    movimientos = await db.get_historial_categoria(user_id, categoria)
    
    if not movimientos:
        await update.message.reply_text(f"No tenés gastos en *{categoria}* este mes.", parse_mode='Markdown')
        return
    
    total = sum(m[1] for m in movimientos)
    msg = f"🔍 *HISTORIAL: {categoria}*\n"
    msg += f"💰 Total del mes: ${total:,.0f}\n"
    msg += "-" * 20 + "\n"
    
    for fecha, monto, desc in movimientos:
        try:
            fecha_obj = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S')
            fecha_str = fecha_obj.strftime('%d/%m')
        except Exception:
            fecha_str = "--"
        msg += f"🔸 ({fecha_str}) {desc}: ${monto:,.0f}\n"
    
    await update.message.reply_text(msg, parse_mode='Markdown')

async def buscar_movimiento(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Busca movimientos por texto en la descripci\u00f3n."""
    user_id = update.effective_user.id
    
    if not context.args:
        await update.message.reply_text(
            "\U0001F50D *B\u00fasqueda de movimientos*\n\n"
            "Uso: `/buscar [texto]`\n"
            "Ejemplo: `/buscar pizza`\n"
            "Ejemplo: `/buscar sueldo`",
            parse_mode='Markdown'
        )
        return
    
    texto = " ".join(context.args)
    resultados = await db.buscar_movimientos(user_id, texto)
    
    if not resultados:
        await update.message.reply_text(
            f"\U0001F50D No encontr\u00e9 nada con *\"{texto}\"*.\n"
            "Prob\u00e1 con otra palabra.",
            parse_mode='Markdown'
        )
        return
    
    total_gastos = sum(r[3] for r in resultados if r[2].lower() == 'egreso')
    total_ingresos = sum(r[3] for r in resultados if r[2].lower() == 'ingreso')
    
    msg = f"\U0001F50D *Resultados para \"{texto}\"*\n"
    msg += f"_{len(resultados)} movimiento(s) encontrado(s)_\n"
    msg += "\u2500" * 20 + "\n\n"
    
    for r_id, fecha, tipo, monto, cat, desc in resultados:
        emoji = "\U0001F7E2" if tipo.lower() == 'ingreso' else "\U0001F534"
        emoji_cat = EMOJIS_CATEGORIA.get(cat, '\U0001F4CC')
        try:
            fecha_str = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S').strftime('%d/%m')
        except:
            fecha_str = "--"
        msg += f"{emoji} `{fecha_str}` *${monto:,.0f}*\n"
        msg += f"    {emoji_cat} {cat} | _{desc}_\n\n"
    
    msg += "\u2500" * 20 + "\n"
    if total_gastos > 0:
        msg += f"\U0001F534 Total gastos: *${total_gastos:,.0f}*\n"
    if total_ingresos > 0:
        msg += f"\U0001F7E2 Total ingresos: *${total_ingresos:,.0f}*"
    
    await update.message.reply_text(msg, parse_mode='Markdown')

# --- COMANDO /editar ---
async def editar_movimiento(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    # Uso: /editar 15 3500
    if len(context.args) < 2:
        msg = "✏️ *EDITAR MOVIMIENTO*\n\n"
        msg += "Uso: `/editar ID NUEVO_MONTO`\n\n"
        msg += "Tus movimientos recientes:\n"
        
        top = await db.get_top_gastos(user_id, 7)
        if not top:
            msg += "No hay movimientos este mes.\n"
        else:
            for mid, desc, monto, cat, fecha in top:
                try:
                    fecha_str = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S').strftime('%d/%m')
                except Exception:
                    fecha_str = "--"
                msg += f"ID `{mid}` | {desc}: ${monto:,.0f} ({fecha_str})\n"
        
        msg += "\nEj: `/editar 15 3500`"
        await update.message.reply_text(msg, parse_mode='Markdown')
        return
    
    try:
        mov_id = int(context.args[0])
        nuevo_monto = float(context.args[1])
        
        resultado = await db.editar_movimiento(user_id, mov_id, nuevo_monto)
        if resultado:
            desc_vieja, monto_viejo = resultado
            await update.message.reply_text(
                f"✅ *Editado:* {desc_vieja}\n"
                f"🔴 Antes: ${monto_viejo:,.0f}\n"
                f"🟢 Ahora: ${nuevo_monto:,.0f}",
                parse_mode='Markdown'
            )
        else:
            await update.message.reply_text("❌ No encontré ese movimiento. Fijate el ID con /editar")
    except ValueError:
        await update.message.reply_text("❌ Uso: `/editar ID MONTO` (ambos numéricos)", parse_mode='Markdown')

async def ver_dolar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra cotizaciones del dólar usando el servicio centralizado."""
    chat_id = update.effective_chat.id
    try:
        await context.bot.send_chat_action(chat_id=chat_id, action="typing")
        
        # Usar servicio centralizado con caché
        cotizaciones = await get_todas_cotizaciones()
        
        if not cotizaciones:
            await context.bot.send_message(chat_id=chat_id, text="📶 No pude conectar con DolarApi. Probá en un rato.")
            return
        
        dolar_blue = cotizaciones.get('blue', {})
        dolar_oficial = cotizaciones.get('oficial', {})
        dolar_mep = cotizaciones.get('bolsa', {})
        dolar_tarjeta = cotizaciones.get('tarjeta', {})
        dolar_cripto = cotizaciones.get('cripto', {})

        compra_b = dolar_blue.get('compra', 0)
        venta_b = dolar_blue.get('venta', 0)
        fecha_raw = dolar_blue.get('fechaActualizacion')
        
        compra_o = dolar_oficial.get('compra', 0)
        venta_o = dolar_oficial.get('venta', 0)
        
        venta_m = dolar_mep.get('venta', 0)
        venta_t = dolar_tarjeta.get('venta', 0)
        venta_c = dolar_cripto.get('venta', 0)
        
        # Registrar y calcular variaciones
        var_b = await db.get_variacion_dolar('blue', venta_b)
        await db.registrar_cotizacion('blue', venta_b)
        
        var_o = await db.get_variacion_dolar('oficial', venta_o)
        await db.registrar_cotizacion('oficial', venta_o)
        
        var_m = await db.get_variacion_dolar('mep', venta_m)
        await db.registrar_cotizacion('mep', venta_m)
        
        var_t = await db.get_variacion_dolar('tarjeta', venta_t)
        await db.registrar_cotizacion('tarjeta', venta_t)
        
        var_c = await db.get_variacion_dolar('cripto', venta_c)
        await db.registrar_cotizacion('cripto', venta_c)

        # Formatear fecha del Blue
        fecha_str = "recién"
        if fecha_raw:
            try:
                f_obj = datetime.strptime(fecha_raw, "%Y-%m-%dT%H:%M:%S.%fZ")
                fecha_str = f_obj.strftime("%d/%m %H:%M")
            except:
                pass

        msg = f"💵 *COTIZACIÓN DÓLAR* 🇦🇷\n"
        msg += f"📅 _{fecha_str}_\n"
        msg += "────────────────────\n\n"
        
        msg += f"💙 *BLUE*{var_b}\n"
        msg += f"📥 ${compra_b:,.0f}  |  📤 *${venta_b:,.0f}*\n\n"
        
        msg += f"🏛️ *OFICIAL*{var_o}\n"
        msg += f"📥 ${compra_o:,.0f}  |  📤 ${venta_o:,.0f}\n\n"
        
        msg += f"📈 *FINANCIEROS*\n"
        msg += f"💳 Tarjeta:   *${venta_t:,.0f}*{var_t}\n"
        msg += f"🏢 MEP:       *${venta_m:,.0f}*{var_m}\n"
        msg += f"🪙 Cripto:    *${venta_c:,.0f}*{var_c}\n"
        
        msg += "\n────────────────────\n"
        msg += "🔗 _Fuente: DolarApi.com_"

        await context.bot.send_message(chat_id=chat_id, text=msg, parse_mode='Markdown')
    except Exception as e:
        logger.error(f"Error ver_dolar: {e}")
        await context.bot.send_message(chat_id=chat_id, text="❌ Error al consultar dólar.")

async def analizar_sentimiento(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # Check PRO
    if not await db.es_pro(user_id):
        await update.message.reply_text(await msg_necesita_pro("Sentimiento de Mercado", user_id), parse_mode='Markdown')
        return

    if not context.args:
        await update.message.reply_text(
            "📈 *Análisis de Sentimiento*\n\n"
            "Uso: `/sentimiento [TICKER]`\n"
            "Ejemplo: `/sentimiento AAPL`\n"
            "Ejemplo: `/sentimiento YPF`",
            parse_mode='Markdown'
        )
        return

    ticker = context.args[0].upper()
    
    if not await rate_limiter.puede_usar_ia(user_id):
        await update.message.reply_text(msg_rate_limit())
        return

    msg_buscando = await update.message.reply_text(f"🔍 *Buscando y analizando noticias de {ticker}...*\n_Esto puede demorar unos segundos._", parse_mode='Markdown')
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")

    resultado = await analizar_noticias_financieras(ticker)
    
    await rate_limiter.registrar_uso(user_id)
    
    await msg_buscando.edit_text(resultado, parse_mode='Markdown')
