"""
handlers/jobs.py — Jobs automáticos (tareas programadas).

Funciones: check_suscripciones_diarias, resumen_semanal_auto,
recordatorio_nocturno, enviar_backup, enviar_tips_trial,
check_servicios_variables
"""

import os
import random
import logging
from datetime import datetime

from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

from db import db
from core.config import config
from utils.textos import (
    EMOJIS_CATEGORIA, MEDALLAS,
    FRASES_RECORDATORIO_CON_GASTOS, FRASES_RECORDATORIO_SIN_GASTOS,
    generar_barra_presupuesto,
)

logger = logging.getLogger('Manguito')


async def check_suscripciones_diarias(context: ContextTypes.DEFAULT_TYPE):
    hoy = datetime.now()
    dia_mes = hoy.day
    dia_semana = hoy.weekday()  # 0=lunes

    # ── Mensuales (como antes) ──
    cobros = await db.get_suscripciones_del_dia(dia_mes)

    # ── Diarias ──
    cobros += await db.suscripciones.get_diarias()

    # ── Semanales (dia_cobro = día de la semana 0-6) ──
    cobros += await db.suscripciones.get_semanales(dia_semana)

    # ── Anuales (solo si coincide el día del mes) ──
    cobros += await db.suscripciones.get_anuales(hoy.month, dia_mes)

    for uid, nombre, monto, cat in cobros:
        # ANTI-DUPLICADO: Si ya se cobró hoy, no cobrar de nuevo
        if await db.ya_cobrado_hoy(uid, nombre):
            continue
        
        # 1. Agregamos el gasto a la BD
        await db.agregar_movimiento(uid, 'egreso', monto, cat, f"Cobro Automático: {nombre}")
        
        # 2. Intentamos avisar al usuario
        try:
            msg = f"🔔 *Pago Automático Realizado*\nSe registraron ${monto} de *{nombre}*."
            
            # 3. Mostrar estado de presupuesto
            estado_pres = await db.get_presupuesto_estado(uid, cat)
            msg += generar_barra_presupuesto(estado_pres)
            
            await context.bot.send_message(chat_id=uid, text=msg, parse_mode='Markdown')
        except Exception as e:
            logger.debug(f"No se pudo avisar cobro automático a {uid}: {e}")

# --- JOB AUTOMÁTICO: RESUMEN SEMANAL (DOMINGOS) ---
async def resumen_semanal_auto(context: ContextTypes.DEFAULT_TYPE):
    """Se ejecuta cada domingo y manda un mini-reporte a cada usuario."""
    # Solo ejecutar los domingos (weekday 6 = domingo)
    if datetime.now().weekday() != 6:
        return
    
    usuarios = await db.get_todos_usuarios()
    
    for uid in usuarios:
        ingresos, gastos, cant, top_cats = await db.get_resumen_semanal(uid)
        
        if cant == 0:
            continue  # No molestar si no tuvo actividad
        
        saldo = ingresos - gastos
        emoji_saldo = "😎" if saldo >= 0 else "😰"
        racha = await db.get_racha(uid)
        
        msg = f"📊 *RESUMEN SEMANAL*\n"
        msg += f"📅 Últimos 7 días\n"
        msg += "─" * 20 + "\n"
        msg += f"🟢 Ingresos: *${ingresos:,.0f}*\n"
        msg += f"🔴 Gastos: *${gastos:,.0f}*\n"
        msg += f"{emoji_saldo} Balance: *${saldo:,.0f}*\n"
        msg += f"📝 Movimientos: {cant}\n"
        
        if racha > 1:
            msg += f"🔥 Racha: *{racha} días seguidos registrando!*\n"
        
        if top_cats:
            msg += "\n🏆 *Top gastos:*\n"
            for i, (cat, monto) in enumerate(top_cats):
                emoji_cat = EMOJIS_CATEGORIA.get(cat, '📌')
                msg += f"{MEDALLAS[i]} {emoji_cat} {cat}: ${monto:,.0f}\n"
        
        msg += "\n_¡Buen domingo! A seguirle metiendo esta semana._ 💪"
        
        try:
            await context.bot.send_message(chat_id=uid, text=msg, parse_mode='Markdown')
        except Exception as e:
            logger.debug(f"No se pudo enviar resumen semanal a {uid}: {e}")

async def recordatorio_nocturno(context: ContextTypes.DEFAULT_TYPE):
    """A las 21hs manda resumen del día y pregunta si falta algo."""
    usuarios = await db.get_todos_usuarios()
    
    for uid in usuarios:
        try:
            # Respetar preferencia de notificaciones
            notif_activas = await db.usuarios.get_notificaciones_activas(uid)
            if not notif_activas:
                continue

            total_hoy, cant_hoy = await db.get_gastos_hoy(uid)
            if cant_hoy > 0:
                frase = random.choice(FRASES_RECORDATORIO_CON_GASTOS)
                msg = f"{frase}\n"
                msg += f"🔴 Gastaste *${total_hoy:,.0f}* en {cant_hoy} movimiento{'s' if cant_hoy > 1 else ''}\n"
                msg += "\n_¿Falta algo? Anotálo antes de dormir._"
            else:
                msg = random.choice(FRASES_RECORDATORIO_SIN_GASTOS)
            
            await context.bot.send_message(chat_id=uid, text=msg, parse_mode='Markdown')
        except Exception as e:
            logger.debug(f"No se pudo enviar recordatorio nocturno a {uid}: {e}")

async def enviar_backup_db(context: ContextTypes.DEFAULT_TYPE):
    """Envía el archivo de la base de datos por mensaje privado al administrador."""
    admin_id = config.ADMIN_ID
    db_path = config.DB_PATH
    
    if not admin_id or admin_id == 0:
        logger.warning("Backup automático saltado: ADMIN_ID no configurado")
        return

    try:
        if os.path.exists(db_path):
            with open(db_path, 'rb') as f:
                await context.bot.send_document(
                    chat_id=admin_id,
                    document=f,
                    caption="💾 Backup automático de la base de datos."
                )
            logger.info("Backup automático enviado al administrador.")
        else:
            logger.error(f"Backup falló: No existe el archivo {db_path}")
            
    except FileNotFoundError:
        logger.error(f"Backup falló: No se encontró el archivo de base de datos en {db_path}")
    except Exception as e:
        logger.error(f"Error enviando backup automático: {e}")

async def enviar_tips_trial(context: ContextTypes.DEFAULT_TYPE):
    """Env\u00eda un tip diario a usuarios en trial para mostrar funciones PRO."""
    usuarios_trial = await db.get_usuarios_en_trial()
    
    for user_id in usuarios_trial:
        try:
            tip = await db.get_siguiente_tip(user_id)
            if tip:
                plan, dias, _ = await db.info_plan(user_id)
                footer = f"\n\n_\u23f3 Te quedan {dias} d\u00edas de prueba gratis_"
                await context.bot.send_message(
                    chat_id=user_id,
                    text=tip + footer,
                    parse_mode='Markdown'
                )
        except Exception as e:
            logger.error(f"Error enviando tip a {user_id}: {e}")


async def check_servicios_variables(context: ContextTypes.DEFAULT_TYPE):
    """
    Job diario: busca servicios variables que vencen hoy y manda
    un recordatorio al usuario con botón para anotar el pago.
    """
    hoy = datetime.now().day
    servicios = await db.get_variables_del_dia(hoy)

    for uid, srv_id, nombre, categoria in servicios:
        try:
            emoji_cat = EMOJIS_CATEGORIA.get(categoria, '📌')
            msg = (
                f"📅 *¡Che! Hoy vence tu pago de {nombre}*\n\n"
                f"{emoji_cat} Categoría: _{categoria}_\n\n"
                f"¿Cuánto te vino este mes?"
            )

            keyboard = InlineKeyboardMarkup([
                [InlineKeyboardButton(
                    "📝 Anotar Pago",
                    callback_data=f"pagar_var_{srv_id}",
                )]
            ])

            await context.bot.send_message(
                chat_id=uid,
                text=msg,
                parse_mode='Markdown',
                reply_markup=keyboard,
            )
        except Exception as e:
            logger.error(f"Error enviando recordatorio variable a {uid}: {e}")

async def procesar_cuotas_mensuales(context: ContextTypes.DEFAULT_TYPE):
    """
    Job mensual que corre todos los días, pero solo procesa las cuotas
    si es el día 1 del mes. Impacta las cuotas pendientes automáticamente.
    """
    if datetime.now().day != 1:
        return

    logger.info("Iniciando procesamiento de compras en cuotas (Día 1 del mes)...")
    compras_activas = await db.get_compras_activas_cuotas()

    for compra in compras_activas:
        c_id, u_id, desc, cat, monto, totales, pagadas = compra

        try:
            # 1. Anotar el gasto del mes actual
            nueva_cuota = pagadas + 1
            desc_cuota = f"{desc} (Cuota {nueva_cuota}/{totales})"
            await db.agregar_movimiento(u_id, tipo="egreso", monto=monto, categoria=cat, descripcion=desc_cuota)

            # 2. Actualizar el contador en la DB
            await db.sumar_cuota(c_id)

            # 3. Avisarle al usuario
            msg = (
                f"💳 *¡Ya debité tu cuota del mes!*\n\n"
                f"🛍️ _{desc}_\n"
                f"🏷️ Cuota {nueva_cuota} de {totales}\n"
                f"💰 Importe: *${monto:,.0f}*"
            )
            await context.bot.send_message(chat_id=u_id, text=msg, parse_mode='Markdown')

        except Exception as e:
            logger.error(f"Error procesando cuota {c_id} para usuario {u_id}: {e}")


async def cierre_mensual(context: ContextTypes.DEFAULT_TYPE):
    """Se ejecuta el día 1 a las 10:00 ART. Envía el resumen del mes anterior a cada usuario."""
    hoy = datetime.now()
    if hoy.day != 1:
        return

    logger.info("Ejecutando Cierre Mensual automático...")
    usuarios = await db.get_todos_usuarios()

    for user_id in usuarios:
        try:
            ingresos, gastos = await db.get_resumen_mensual(user_id)
            if ingresos == 0 and gastos == 0:
                continue

            saldo = ingresos - gastos
            emoji_saldo = "✅" if saldo >= 0 else "⚠️"

            msg = (
                "📅 *CIERRE DEL MES — Tu Resumen*\n"
                "──────────────────────\n\n"
                f"🟢 Ingresos: *${ingresos:,.0f}*\n"
                f"🔴 Gastos: *${gastos:,.0f}*\n"
                f"{emoji_saldo} Saldo: *${saldo:,.0f}*\n\n"
            )

            # Top categorías
            top = await db.get_top_gastos(user_id, 3)
            if top:
                msg += "🏆 *Tus categorías más fuertes:*\n"
                for i, (_, desc, monto, cat, _) in enumerate(top):
                    medalla = MEDALLAS[i] if i < len(MEDALLAS) else "•"
                    emoji_cat = EMOJIS_CATEGORIA.get(cat, '📌')
                    msg += f"{medalla} {emoji_cat} {cat}: ${monto:,.0f}\n"
                msg += "\n"

            if saldo >= 0:
                msg += "💪 _¡Cerraste el mes en positivo! Excelente._"
            else:
                msg += "📊 _Mes complicado. Revisá tus presupuestos y ajustá para el próximo._"

            await context.bot.send_message(chat_id=user_id, text=msg, parse_mode='Markdown')
        except Exception as e:
            logger.debug(f"Error en cierre mensual para {user_id}: {e}")
