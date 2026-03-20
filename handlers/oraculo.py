"""
handlers/oraculo.py — El Oráculo: Proyección Inteligente del Mes.

Utiliza IA para proyectar los gastos del usuario a fin de mes,
evaluar si cumplirá sus metas de ahorro y dar un consejo motivador.
"""

import asyncio
import calendar
from datetime import datetime
import logging

from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import ContextTypes, CallbackQueryHandler

from db import db
from servicios import rate_limiter, client, MODEL_NAME, msg_rate_limit
from utils.prompts import prompt_oraculo
from handlers.comunes import teclado_volver, msg_necesita_pro

logger = logging.getLogger('Manguito')

async def proyeccion_oraculo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback para mostrar la proyección del oráculo."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id

    # Check PRO
    if not await db.es_pro(user_id):
        await query.edit_message_text(await msg_necesita_pro("El Oráculo (Proyecciones)", user_id), parse_mode='Markdown', reply_markup=teclado_volver())
        return
        
    # Rate limit check
    if not await rate_limiter.puede_usar_ia(user_id):
        await query.edit_message_text(msg_rate_limit(), parse_mode='Markdown', reply_markup=teclado_volver())
        return

    # Mensaje de espera
    await query.edit_message_text("🔮 _Consultando las cartas financieras..._", parse_mode='Markdown')

    try:
        # Calcular fechas
        hoy = datetime.now()
        dia_actual = hoy.day
        dias_mes = calendar.monthrange(hoy.year, hoy.month)[1]
        dias_restantes = dias_mes - dia_actual
        if dias_restantes < 0:
            dias_restantes = 0
            
        # Para el promedio, evitamos dividir por 0 si es el día 1 muy temprano
        dias_pasados = max(dia_actual, 1)

        # Datos financieros
        ingresos, egresos = await db.get_resumen_mensual(user_id)
        
        # Obtener metas de ahorro
        metas = await db.get_metas_ahorro(user_id)

        # Si no tiene gastos, no hay proyección que hacer
        if egresos == 0 and ingresos == 0:
            await query.edit_message_text("🔮 *El Oráculo dice:*\n\n_Tu futuro es un lienzo en blanco. Registrá algún gasto o ingreso para que pueda leer tu destino._", parse_mode='Markdown', reply_markup=teclado_volver())
            return

        # Generar proyección con IA
        prompt = prompt_oraculo(ingresos, egresos, dias_restantes, dias_pasados, metas)
        
        response = await asyncio.to_thread(
            client.models.generate_content, model=MODEL_NAME, contents=prompt
        )
        await rate_limiter.registrar_uso(user_id)
        
        # Formatear y mostrar respuesta
        respuesta_ia = response.text
        
        msg = "🔮 *El Oráculo ha hablado*\n"
        msg += "─" * 22 + "\n\n"
        msg += f"{respuesta_ia}"
        
        await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_volver())

    except Exception as e:
        logger.error(f"Error en El Oráculo para {user_id}: {e}")
        await query.edit_message_text("🔮 _Los astros están desalineados. Intentá más tarde._", parse_mode='Markdown', reply_markup=teclado_volver())

callback_oraculo = [
    CallbackQueryHandler(proyeccion_oraculo, pattern="^cmd_oraculo$")
]
