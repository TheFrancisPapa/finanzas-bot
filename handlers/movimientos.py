"""
handlers/movimientos.py — Procesamiento de gastos/ingresos.

Funciones: manejar_mensaje, analizar_foto, analizar_audio,
analizar_gastos, borrar_ultimo
"""

import os
import re
import asyncio
import tempfile
import json
import random
import logging
from PIL import Image
import io
from datetime import datetime

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, constants
from telegram.ext import ContextTypes, ConversationHandler, CommandHandler, CallbackQueryHandler, MessageHandler, filters

from db import db
from servicios.conversor import convertir_a_pesos
from servicios.gamificacion import chequear_logros
from servicios import (
    get_cotizacion_dolar, rate_limiter, msg_rate_limit,
    client, MODEL_NAME,
)
from utils.textos import (
    MENSAJES_GASTO, MENSAJES_INGRESO, EMOJIS_CATEGORIA,
    RACHAS_MSG, generar_barra_presupuesto,
)
from utils.prompts import (
    prompt_analisis_gastos, prompt_analisis_foto,
    prompt_analisis_audio, prompt_mensaje_texto, prompt_analisis_resumen
)
from servicios.reportes import generar_grafico_premium
from handlers.comunes import teclado_principal, teclado_volver, teclado_navegacion, msg_necesita_pro

logger = logging.getLogger('Manguito')


# ══════════════════════════════════════════════════════════
#  HELPERS COMPARTIDOS (DRY)
# ══════════════════════════════════════════════════════════

async def _convertir_multimoneda(data: dict):
    """
    Convierte monto a ARS si viene en otra moneda.
    Modifica `data` in-place. Retorna (monto_original, moneda_original, fue_convertido, uso_fallback).
    """
    moneda_org = data.get('moneda', 'ARS').upper()
    monto_org = data['monto']
    fue_convertido = False
    uso_fallback = False

    if moneda_org != 'ARS':
        resultado_conv = await convertir_a_pesos(monto_org, moneda_org)
        if resultado_conv and resultado_conv[0]:
            monto_ars, uso_fallback = resultado_conv
            data['monto'] = monto_ars
            data['descripcion'] += f" ({monto_org:g} {moneda_org})"
            fue_convertido = True
        else:
            data['descripcion'] += f" ({moneda_org} {monto_org:g} - Sin conv.)"

    # Capitalizar siempre
    data['descripcion'] = data['descripcion'].title()
    data['categoria'] = data['categoria'].title()

    return monto_org, moneda_org, fue_convertido, uso_fallback


async def _teclado_post_movimiento(user_id: int, mov_id: int, tipo: str = 'egreso'):
    """Genera el teclado inline estándar post-registro (deshacer, convivencia)."""
    kb = []
    if tipo == 'egreso':
        pareja = await db.get_pareja(user_id)
        if pareja:
            kb.append([
                InlineKeyboardButton("👤 Dejar Privado", callback_data=f"conv_privado_{mov_id}"),
                InlineKeyboardButton("👥 Hacer Compartido", callback_data=f"conv_compartir_{mov_id}")
            ])
    kb.append([
        InlineKeyboardButton("↩️ Deshacer", callback_data=f"undo_{mov_id}"),
        InlineKeyboardButton("◀️ Menú", callback_data="cmd_menu")
    ])
    return InlineKeyboardMarkup(kb)


async def analizar_gastos_callback(query, context):
    user_id = query.from_user.id
    datos_grafico, datos_detalle = await db.get_datos_analisis(user_id)
    
    if not datos_grafico:
        await query.edit_message_text("💤 No hay gastos este mes.", reply_markup=teclado_volver())
        return
    
    # Gráfico
    await context.bot.send_chat_action(chat_id=query.message.chat_id, action=constants.ChatAction.UPLOAD_PHOTO)
    buf = await asyncio.to_thread(generar_grafico_premium, datos_grafico)
    if buf:
        await context.bot.send_photo(chat_id=query.message.chat_id, photo=buf, caption="🌟 *Tu dashboard financiero*", parse_mode='Markdown')
    
    # Análisis IA
    try:
        await context.bot.send_chat_action(chat_id=query.message.chat_id, action=constants.ChatAction.TYPING)
        prompt = prompt_analisis_gastos(datos_detalle)
        response = await asyncio.to_thread(
            client.models.generate_content, model=MODEL_NAME, contents=prompt
        )
        await rate_limiter.registrar_uso(user_id)
        await context.bot.send_message(chat_id=query.message.chat_id, text=response.text, parse_mode='Markdown', reply_markup=teclado_volver())
    except Exception as e:
        logger.error(f"Error análisis IA: {e}")
        await context.bot.send_message(chat_id=query.message.chat_id, text="La IA no responde, pero ahí tenés el gráfico.", reply_markup=teclado_volver())

async def analizar_gastos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # Check PRO
    if not await db.es_pro(user_id):
        await update.message.reply_text(await msg_necesita_pro("An\u00e1lisis con IA", user_id), parse_mode='Markdown')
        return
    
    datos_grafico, datos_detalle = await db.get_datos_analisis(user_id)

    if not datos_grafico:
        await update.message.reply_text("\U0001F4A4 Todav\u00eda no gastaste nada este mes.")
        return

    # Gráfico (reutilizando función)
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action=constants.ChatAction.UPLOAD_PHOTO)
    buf = await asyncio.to_thread(generar_grafico_premium, datos_grafico)
    if buf:
        await update.message.reply_photo(photo=buf, caption="🌟 *Tu dashboard financiero*", parse_mode='Markdown')

    # Análisis IA
    try:
        await context.bot.send_chat_action(chat_id=update.effective_chat.id, action=constants.ChatAction.TYPING)
        prompt = prompt_analisis_gastos(datos_detalle)
        response = await asyncio.to_thread(
            client.models.generate_content, model=MODEL_NAME, contents=prompt
        )
        await rate_limiter.registrar_uso(user_id)
        await update.message.reply_text(response.text, parse_mode='Markdown')
    except Exception as e:
        logger.error(f"Error análisis IA (comando): {e}")
        await update.message.reply_text("La IA no responde, pero ahí tenés el gráfico.")

async def analizar_foto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # Check PRO
    if not await db.es_pro(user_id):
        await update.message.reply_text(await msg_necesita_pro("An\u00e1lisis de fotos", user_id), parse_mode='Markdown')
        return
    
    comentario = update.message.caption or "Sin detalle"
    
    # Rate limit check
    if not await rate_limiter.puede_usar_ia(user_id):
        await update.message.reply_text(msg_rate_limit())
        return
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action=constants.ChatAction.TYPING)

    try:
        foto_file = await update.message.photo[-1].get_file()
        foto_bytes = await foto_file.download_as_bytearray()
        imagen = Image.open(io.BytesIO(foto_bytes))

        prompt = prompt_analisis_foto(comentario)
        
        response = await asyncio.to_thread(
            client.models.generate_content, model=MODEL_NAME, contents=[prompt, imagen]
        )
        await rate_limiter.registrar_uso(user_id)  # Contar DESPUÉS de éxito
        texto = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(texto)

        if data['monto'] == 0:
            await update.message.reply_text("🧐 No veo el precio. ¿Podés escribirlo en el comentario de la foto?")
            return

        # Conversión Multimoneda -> ARS si es necesario
        monto_org, moneda_org, fue_convertido, uso_fallback = await _convertir_multimoneda(data)
        
        mov_id = await db.agregar_movimiento(user_id, 'egreso', data['monto'], data['categoria'], data['descripcion'])
        emoji_cat = EMOJIS_CATEGORIA.get(data['categoria'], '📌')
        msg = f"✅ *Foto procesada*\n"
        msg += f"🔴 *${data['monto']:,.0f}*\n"
        if fue_convertido:
            msg += f"_(Convertido de {monto_org:g} {moneda_org} a Dólar Tarjeta)_\n"
            if uso_fallback:
                msg += "⚠️ _Se usó cotización Dólar Blue como referencia (Tarjeta no disponible)._\n"
        msg += f"{emoji_cat} {data['categoria']} | _{data['descripcion']}_"
        
        # Mostrar estado de presupuesto si existe
        estado_pres = await db.get_presupuesto_estado(user_id, data['categoria'])
        msg += generar_barra_presupuesto(estado_pres)
        
        restantes = await rate_limiter.usos_restantes(user_id)
        if restantes <= 5:
            msg += f"\n\n_({restantes} mensajes IA restantes hoy)_"
        
        reply_markup = await _teclado_post_movimiento(user_id, mov_id, 'egreso')
        await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=reply_markup)
        
        # ═══ LOGROS ═══
        await chequear_logros(user_id, "nuevo_gasto", update, context)
        if fue_convertido:
            await chequear_logros(user_id, "multimoneda", update, context)

    except json.JSONDecodeError:
        logger.error(f"Error parseando JSON de foto para {user_id}")
        await update.message.reply_text("🤔 No pude leer el ticket. Probá con una foto más nítida o escribí el gasto directo.")
        
    except Exception as e:
        logger.error(f"Error procesando foto de {user_id}: {e}")
        await update.message.reply_text("😕 No pude procesar esa imagen. Probá mandando otra foto o escribiendo el gasto.")

async def analizar_audio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa notas de voz para registrar gastos/ingresos."""
    user_id = update.effective_user.id
    
    # Check PRO
    if not await db.es_pro(user_id):
        await update.message.reply_text(await msg_necesita_pro("Notas de voz", user_id), parse_mode='Markdown')
        return
    
    # Rate limit check
    if not await rate_limiter.puede_usar_ia(user_id):
        await update.message.reply_text(msg_rate_limit())
        return
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action=constants.ChatAction.TYPING)
    
    try:
        # Descargar el audio
        voice = update.message.voice or update.message.audio
        voice_file = await voice.get_file()
        
        # Guardar temporalmente
        with tempfile.NamedTemporaryFile(suffix='.ogg', delete=False) as tmp:
            audio_bytes = await voice_file.download_as_bytearray()
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        # Subir a Gemini
        audio_file = await asyncio.to_thread(
            client.files.upload, file=tmp_path, config={'mime_type': 'audio/ogg'}
        )
        
        prompt = prompt_analisis_audio()
        
        response = await asyncio.to_thread(
            client.models.generate_content, model=MODEL_NAME, contents=[prompt, audio_file]
        )
        await rate_limiter.registrar_uso(user_id)
        
        # Limpiar archivo temporal
        try:
            os.unlink(tmp_path)
        except Exception:
            logger.debug(f"No se pudo borrar archivo temporal: {tmp_path}")
        
        text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        
        if data.get('es_movimiento'):
            # Conversión Multimoneda -> ARS si es necesario
            monto_org, moneda_org, fue_convertido, uso_fallback = await _convertir_multimoneda(data)
            
            mov_id = await db.agregar_movimiento(user_id, data['tipo'], data['monto'], data['categoria'], data['descripcion'])
            
            emoji = "🟢" if data['tipo'] == 'ingreso' else "🔴"
            emoji_cat = EMOJIS_CATEGORIA.get(data['categoria'], '📌')
            msg = f"🎙️✅ *Audio procesado*\n"
            msg += f"{emoji} *${data['monto']:,.0f}*\n"
            if fue_convertido:
                msg += f"_(Convertido de {monto_org:g} {moneda_org} a Dólar Tarjeta)_\n"
                if uso_fallback:
                    msg += "⚠️ _Se usó cotización Dólar Blue como referencia (Tarjeta no disponible)._\n"
            msg += f"{emoji_cat} {data['categoria']} | _{data['descripcion']}_"
            
            # Si es egreso, mostrar presupuesto
            if data['tipo'] == 'egreso':
                estado_pres = await db.get_presupuesto_estado(user_id, data['categoria'])
                msg += generar_barra_presupuesto(estado_pres)
            
            reply_markup = await _teclado_post_movimiento(user_id, mov_id, data['tipo'])
            await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=reply_markup)
            
            # ═══ LOGROS ═══
            await chequear_logros(user_id, "nuevo_gasto", update, context)
            if fue_convertido:
                await chequear_logros(user_id, "multimoneda", update, context)
        else:
            await update.message.reply_text("🎙️ No entendí eso como un gasto. Probá decir: _'Gasté mil quinientos en el super'_", parse_mode='Markdown')
    
    except json.JSONDecodeError:
        logger.error(f"Error parseando JSON de audio para {user_id}")
        await update.message.reply_text("🎙️ No entendí el audio. Probá hablar más claro o escribilo.")
    except Exception as e:
        logger.error(f"Error procesando audio de {user_id}: {e}")
        await update.message.reply_text("😕 No pude procesar el audio. Probá escribiendo el gasto o mandando otro audio.")

async def borrar_ultimo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    borrado = await db.borrar_ultimo(user_id)
    if borrado:
        await update.message.reply_text(f"🗑️ Eliminado: {borrado[1]} (${borrado[2]})")
    else:
        await update.message.reply_text("Nada para borrar.")

async def manejar_mensaje(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_text = update.message.text
    user_id = update.effective_user.id
    
    # Auto-registrar usuario
    await db.registrar_usuario(user_id, update.effective_user.first_name, update.effective_user.username)

    # NUEVO: Detectar preguntas de dólar SIN usar IA costosa primero (si es obvio)
    texto_lower = user_text.lower()
    if any(k in texto_lower for k in ["precio dolar", "cotizacion", "cuanto esta el blue", "dolar hoy", "dolar mep", "a cuanto el dolar"]):
        await ver_dolar(update, context)
        return

    # ══════════════════════════════════════════════════════
    #  MODO FLASH ⚡ — Categorización automática sin IA
    # ══════════════════════════════════════════════════════
    flash_result = await _intentar_modo_flash(user_id, user_text)

    if flash_result:
        monto, descripcion, categoria = flash_result
        mov_id = await db.agregar_movimiento(user_id, 'egreso', monto, categoria, descripcion)

        emoji_cat = EMOJIS_CATEGORIA.get(categoria, '📌')
        msg = f"⚡ *Anotado al toque*\n"
        msg += f"\U0001F534 *${monto:,.0f}*"

        # Equivalente USD
        if monto >= 1000:
            try:
                _, venta_blue, _ = await get_cotizacion_dolar("blue")
                if venta_blue and venta_blue > 0:
                    equiv_usd = monto / venta_blue
                    msg += f" _(~U$S {equiv_usd:,.1f})_"
            except Exception:
                logger.debug("No se pudo obtener cotización USD para equivalente")

        msg += f"\n{emoji_cat} {categoria} | _{descripcion}_"

        # Presupuesto
        estado_pres = await db.get_presupuesto_estado(user_id, categoria)
        msg += generar_barra_presupuesto(estado_pres)

        # Racha
        racha = await db.get_racha(user_id)
        if racha in RACHAS_MSG:
            msg += f"\n\n{RACHAS_MSG[racha]}"

        kb = [
            [InlineKeyboardButton("\u21a9\ufe0f Deshacer", callback_data=f"undo_{mov_id}"),
             InlineKeyboardButton("\u25c0\ufe0f Menú", callback_data="cmd_menu")]
        ]
        await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(kb))
        
        # ═══ LOGROS ═══
        await chequear_logros(user_id, "nuevo_gasto", update, context)
        await chequear_logros(user_id, "modo_flash", update, context)
        return

    # ══════════════════════════════════════════════════════
    #  FLUJO NORMAL — Llamada a Gemini
    # ══════════════════════════════════════════════════════
    if not await rate_limiter.puede_usar_ia(user_id):
        await update.message.reply_text(msg_rate_limit())
        return

    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action=constants.ChatAction.TYPING)

    prompt = prompt_mensaje_texto(user_text)
    
    try:
        response = await asyncio.to_thread(
            client.models.generate_content, model=MODEL_NAME, contents=prompt
        )
        await rate_limiter.registrar_uso(user_id)  # Contar DESPUÉS de éxito
        text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)

        if data.get('es_movimiento'):
            # Conversión Multimoneda -> ARS si es necesario
            moneda_org = data.get('moneda', 'ARS').upper()
            monto_org = data['monto']
            fue_convertido = False
            
            if moneda_org != 'ARS':
                resultado_conv = await convertir_a_pesos(monto_org, moneda_org)
                if resultado_conv and resultado_conv[0]:
                    monto_ars, uso_fallback = resultado_conv
                    data['monto'] = monto_ars
                    data['descripcion'] += f" ({monto_org:g} {moneda_org})"
                    fue_convertido = True
                else:
                    data['descripcion'] += f" ({moneda_org} {monto_org:g} - Sin conv.)" # Fallback si falla API
            
            # Capitalizar descripción y categoría
            data['descripcion'] = data['descripcion'].title()
            data['categoria'] = data['categoria'].title()
            
            mov_id = await db.agregar_movimiento(user_id, data['tipo'], data['monto'], data['categoria'], data['descripcion'])
            emoji_tipo = "\U0001F7E2" if data['tipo'] == 'ingreso' else "\U0001F534"
            emoji_cat = EMOJIS_CATEGORIA.get(data['categoria'], '\U0001F4CC')
            frase = random.choice(MENSAJES_INGRESO if data['tipo'] == 'ingreso' else MENSAJES_GASTO)
            msg = f"{frase}\n"
            msg += f"{emoji_tipo} *${data['monto']:,.0f}*\n"
            if fue_convertido:
                msg += f"_(Convertido de {monto_org:g} {moneda_org} a Dólar Tarjeta)_\n"
                if uso_fallback:
                    msg += "⚠️ _Se usó cotización Dólar Blue como referencia (Tarjeta no disponible)._"
            
            # Mostrar equivalente en USD Blue (dato informativo)
            if data['tipo'] == 'egreso' and moneda_org == 'ARS' and data['monto'] >= 1000:
                try:
                    _, venta_blue, _ = await get_cotizacion_dolar("blue")
                    if venta_blue and venta_blue > 0:
                        equiv_usd = data['monto'] / venta_blue
                        msg += f" _(~U$S {equiv_usd:,.1f})_"
                except Exception:
                    logger.debug("No se pudo obtener cotización USD para equivalente")
            
            msg += f"\n{emoji_cat} {data['categoria']} | _{data['descripcion']}_"
            
            # Si es egreso, mostrar presupuesto
            if data['tipo'] == 'egreso':
                estado_pres = await db.get_presupuesto_estado(user_id, data['categoria'])
                msg += generar_barra_presupuesto(estado_pres)
            
            # Celebrar racha (7, 14, 30 días)
            racha = await db.get_racha(user_id)
            if racha in RACHAS_MSG:
                msg += f"\n\n{RACHAS_MSG[racha]}"
            
            restantes = await rate_limiter.usos_restantes(user_id)
            if restantes <= 5:
                msg += f"\n\n_({restantes} mensajes IA restantes hoy)_"
            
            pareja = await db.get_pareja(user_id)
            kb = []
            if data['tipo'] == 'egreso' and pareja:
                kb.append([
                    InlineKeyboardButton("👤 Dejar Privado", callback_data=f"conv_privado_{mov_id}"),
                    InlineKeyboardButton("👥 Hacer Compartido", callback_data=f"conv_compartir_{mov_id}")
                ])
                
            kb.append([
                InlineKeyboardButton("↩️ Deshacer", callback_data=f"undo_{mov_id}"),
                InlineKeyboardButton("◀️ Menú", callback_data="cmd_menu")
            ])
            await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(kb))

            # ═══ APRENDIZAJE ═══
            await _aprender_regla(user_id, data['descripcion'], data['categoria'])
            
            # ═══ LOGROS ═══
            await chequear_logros(user_id, "nuevo_gasto", update, context)
            if fue_convertido:
                await chequear_logros(user_id, "multimoneda", update, context)

        else:
            await update.message.reply_text("🤔 No entendí eso como un gasto o ingreso. Probá algo como:\n_'Gasté 500 en café'_\n_'Cobré mi sueldo 500000'_", parse_mode='Markdown')
    
    except json.JSONDecodeError:
        logger.error(f"Error parseando JSON de {user_id}")
        await update.message.reply_text("🤔 No te entendí. Probá con algo así:\n_'Gasté 1500 en nafta'_", parse_mode='Markdown')
    except Exception as e:
        logger.error(f"Error interpretando mensaje de {user_id}: {e}")
        await update.message.reply_text("😕 Algo falló. Probá de nuevo o usá los botones del menú.", reply_markup=teclado_principal())


# ══════════════════════════════════════════════════════════
#  MODO FLASH — Funciones auxiliares
# ══════════════════════════════════════════════════════════

# Regex para extraer monto y descripción de mensajes comunes
_PATRONES_GASTO = [
    # "gasté 5000 en panadería", "pagué 3000 en farmacia"
    re.compile(r'(?:gast[eé]|pagu[eé]|compr[eé]|me\s+cobr\w+)\s+\$?([\d.,]+)\s+(?:en\s+)?(.+)', re.IGNORECASE),
    # "5000 panadería", "5000 en taxi"
    re.compile(r'^\$?([\d.,]+)\s+(?:en\s+)?(.+)', re.IGNORECASE),
    # "panadería 5000", "taxi 3500"
    re.compile(r'^(.+?)\s+\$?([\d.,]+)\s*$', re.IGNORECASE),
]


def _extraer_monto_descripcion(texto: str):
    """
    Intenta extraer monto y descripción de un mensaje con regex simple.
    Retorna (monto: float, descripcion: str) o None si no matchea.
    """
    for i, patron in enumerate(_PATRONES_GASTO):
        match = patron.match(texto.strip())
        if match:
            if i < 2:
                # Grupos: (monto, descripcion)
                monto_str, desc = match.group(1), match.group(2)
            else:
                # Patrón invertido: (descripcion, monto)
                desc, monto_str = match.group(1), match.group(2)

            # Parsear monto
            try:
                monto_limpio = monto_str.replace(".", "").replace(",", ".")
                monto = float(monto_limpio)
                if monto <= 0:
                    continue
            except ValueError:
                continue

            desc = desc.strip().rstrip(".!,;")
            if len(desc) < 2 or len(desc) > 50:
                continue

            return monto, desc.title()

    return None


async def _intentar_modo_flash(user_id: int, texto: str):
    """
    Intenta resolver el gasto sin llamar a Gemini.
    Retorna (monto, descripcion, categoria) o None.
    """
    resultado = _extraer_monto_descripcion(texto)
    if not resultado:
        return None

    monto, descripcion = resultado

    # Buscar si hay una regla aprendida para esta descripción
    categoria = await db.buscar_regla(user_id, descripcion)
    if not categoria:
        return None  # Sin regla → ir a Gemini

    return monto, descripcion, categoria


async def _aprender_regla(user_id: int, descripcion: str, categoria: str):
    """
    Si la descripción es corta y clara (1-3 palabras), la guarda
    como regla para futuros Modo Flash.
    """
    # Limpiar y normalizar
    desc_limpia = descripcion.strip().lower()

    # Solo aprender patrones cortos y claros (1-3 palabras)
    palabras = desc_limpia.split()
    if len(palabras) < 1 or len(palabras) > 3:
        return

    # No aprender descripciones genéricas
    genericas = {'varios', 'otro', 'cosa', 'gasto', 'compra', 'pago', 'algo'}
    if any(p in genericas for p in palabras):
        return

    # No aprender si tiene paréntesis (indica conversión USD u otras notas)
    if '(' in desc_limpia or ')' in desc_limpia:
        return

    try:
        await db.agregar_regla(user_id, desc_limpia, categoria)
        logger.info(f"Flash ⚡ Regla aprendida: '{desc_limpia}' → {categoria} (user {user_id})")
    except Exception as e:
        logger.debug(f"No se pudo guardar regla: {e}")

# ==========================================
# MODO AUDITORIA (Resúmenes y Costos Ocultos)
# ==========================================

ESPERANDO_RESUMEN_AUDITORIA = 100

async def iniciar_auditoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = (
        "🏦 *MODO AUDITORÍA*\n"
        "─" * 22 + "\n\n"
        "Mandame una foto 📸 o un archivo PDF 📄 de tu resumen bancario o de tarjeta.\n\n"
        "Voy a leer todo y extraer únicamente los impuestos, mantenimientos y comisiones ocultas "
        "para anotarlas de una.\n\n"
        "_(Mandá /cancelar para salir)_"
    )
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(msg, parse_mode='Markdown')
    else:
        await update.message.reply_text(msg, parse_mode='Markdown')
    return ESPERANDO_RESUMEN_AUDITORIA

async def analizar_resumen_bancario(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if not await db.es_pro(user_id):
        await update.message.reply_text(await msg_necesita_pro("Auditoría de Resúmenes", user_id), parse_mode='Markdown')
        return ConversationHandler.END

    if not await rate_limiter.puede_usar_ia(user_id):
        await update.message.reply_text(msg_rate_limit())
        return ConversationHandler.END

    bot_msg = await update.message.reply_text("🔍 *Analizando el resumen para buscar costos ocultos...*\n_Esto puede demorar unos segundos._", parse_mode='Markdown')
    await context.bot.send_chat_action(chat_id=user_id, action=constants.ChatAction.TYPING)

    try:

        if update.message.photo:
            archivo = await update.message.photo[-1].get_file()
            mime_type = "image/jpeg"
        elif update.message.document:
            archivo = await update.message.document.get_file()
            mime_type = update.message.document.mime_type or "application/pdf"
        else:
            await bot_msg.edit_text("❌ Formato no soportado. Mandá una foto o PDF.")
            return ConversationHandler.END
            
        byte_array = await archivo.download_as_bytearray()
        documento = {"mime_type": mime_type, "data": byte_array}
        
        prompt = prompt_analisis_resumen()
        
        response = await asyncio.to_thread(
            client.models.generate_content, model=MODEL_NAME, contents=[prompt, documento]
        )
        
        await rate_limiter.registrar_uso(user_id)
        
        texto = response.text.replace("```json", "").replace("```", "").strip()
        if not texto:
            texto = "[]"
            
        gastos = json.loads(texto)
        
        if not gastos or len(gastos) == 0:
            await bot_msg.edit_text("✅ *Resumen analizado*\n\n¡Qué bien! No detecté cargos bancarios ocultos o impuestos.", parse_mode='Markdown')
            return ConversationHandler.END
            
        msg_resultado = "🏦 *El banco te cobró estos costos ocultos este mes:*\n\n"
        total_pesos = 0
        
        for g in gastos:
            monto = float(g.get("monto", 0))
            if monto <= 0:
                continue
                
            desc = g.get("descripcion", "Cargo bancario").title()
            cat = "Servicios" # Banco es servicios gral
            mon = g.get("moneda", "ARS").upper()
            
            # Convertir si no es ARS
            if mon != "ARS":
                resultado_conv = await convertir_a_pesos(monto, mon)
                if resultado_conv and resultado_conv[0]:
                    monto_ars, uso_fallback = resultado_conv
                    monto = monto_ars
                    desc += f" (U$S {g['monto']:g})"
                    if uso_fallback:
                        desc += " [Blue]"
            
            await db.agregar_movimiento(user_id, "egreso", monto, cat, desc)
            total_pesos += monto
            msg_resultado += f"- _{desc}_: *${monto:,.0f}*\n"
            
        msg_resultado += f"\n🔴 *Total sacado: ${total_pesos:,.0f}*"
        
        await bot_msg.edit_text(msg_resultado, parse_mode='Markdown', reply_markup=teclado_navegacion())
        
        await chequear_logros(user_id, "nuevo_gasto", update, context)

    except json.JSONDecodeError:
        logger.error(f"JSON Error en auditoria {user_id}: {texto}")
        await bot_msg.edit_text("❌ No pude encontrar gastos ocultos claros o el formato no se entendió.")
    except Exception as e:
        logger.error(f"Error Auditoria {user_id}: {e}")
        await bot_msg.edit_text(f"❌ Ocurrió un error al procesar el archivo.")

    return ConversationHandler.END

async def cancelar_auditoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Modo Auditoría cancelado.", reply_markup=teclado_navegacion())
    return ConversationHandler.END

conv_auditoria_handler = ConversationHandler(
    entry_points=[
        CallbackQueryHandler(iniciar_auditoria, pattern="^cmd_auditoria$"),
        CommandHandler("auditar", iniciar_auditoria)
    ],
    states={
        ESPERANDO_RESUMEN_AUDITORIA: [MessageHandler(filters.PHOTO | filters.Document.ALL, analizar_resumen_bancario)]
    },
    fallbacks=[CommandHandler("cancelar", cancelar_auditoria)],
    per_message=False
)
