"""
handlers/configuracion.py — Configuración del usuario.

Funciones: /presupuesto, /fijo, /misfijos, /borrar_fijo
"""

import logging

from telegram import Update
from telegram.ext import ContextTypes

from db import db

logger = logging.getLogger('Manguito')


async def fijar_presupuesto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if len(context.args) < 2:
        await update.message.reply_text("❌ Uso: `/presupuesto Comida 50000`", parse_mode='Markdown')
        return

    cat = context.args[0].capitalize()
    try:
        monto = float(context.args[1])
        await db.set_presupuesto(user_id, cat, monto)
        await update.message.reply_text(f"✅ Presupuesto para *{cat}* fijado en *${monto:,.2f}*", parse_mode='Markdown')
    except ValueError:
        await update.message.reply_text("❌ El monto debe ser un número.")

async def ver_presupuestos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    filas = await db.get_presupuestos_estado(user_id)

    if not filas:
        await update.message.reply_text("🤷‍♂️ No tenés presupuestos. Usá `/presupuesto`.")
        return

    mensaje = "📊 *TUS METAS DEL MES*\n\n"
    for cat, maximo, gastado in filas:
        porcentaje = (gastado / maximo) * 100 if maximo > 0 else 100
        barra_progreso = "▓" * int(porcentaje // 10) + "░" * (10 - int(porcentaje // 10))
        emoji = "😎" if porcentaje < 80 else "😬" if porcentaje < 100 else "🔥"

        mensaje += f"{emoji} *{cat}*\n"
        mensaje += f"[{barra_progreso}] {porcentaje:.1f}%\n"
        mensaje += f"💲 ${gastado:,.0f} / ${maximo:,.0f}\n\n"

    await update.message.reply_text(mensaje, parse_mode='Markdown')

async def fijar_gasto_recurrente(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    # Uso: /fijo Netflix 5000 10
    if len(context.args) < 3:
        await update.message.reply_text("❌ Uso: `/fijo [Nombre] [Monto] [Día]`\nEj: `/fijo Netflix 5000 10` (Se cobra el día 10)", parse_mode='Markdown')
        return
    
    nombre = context.args[0]
    try:
        monto = float(context.args[1])
        dia = int(context.args[2])
        if not 1 <= dia <= 31:
            raise ValueError
        
        categoria = context.args[3].capitalize() if len(context.args) > 3 else "Suscripciones"
        await db.agregar_suscripcion(user_id, nombre, monto, dia, categoria)
        await update.message.reply_text(f"🔄 ¡Listo! El día *{dia}* de cada mes agendaré *{nombre}* (${monto}) en _{categoria}_.", parse_mode='Markdown')
        
    except ValueError:
        await update.message.reply_text("❌ El monto debe ser numérico y el día entre 1 y 31.")

async def ver_mis_fijos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    fijos = await db.get_suscripciones_usuario(user_id)
    
    if not fijos:
        await update.message.reply_text("No tenés gastos fijos programados.")
        return
        
    mensaje = "🔄 *TUS SUSCRIPCIONES ACTIVAS*\n\n"
    for fid, nombre, monto, dia, cat, frecuencia in fijos:
        desc_frecuencia = f"cada {frecuencia}" if frecuencia != "mensual" else "x mes"
        mensaje += f"🆔 *{fid}* | {nombre}: ${monto} (Día {dia} {desc_frecuencia})\n"
        
    mensaje += "\nPara borrar una usá: `/borrar_fijo [ID]`"
    await update.message.reply_text(mensaje, parse_mode='Markdown')

async def borrar_fijo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if not context.args:
        await update.message.reply_text("❌ Decime el ID. Miralo en /mis_fijos")
        return
    try:
        fid = int(context.args[0])
        await db.borrar_suscripcion(user_id, fid)
        await update.message.reply_text("🗑️ Suscripción eliminada.")
    except ValueError:
        await update.message.reply_text("❌ ID inválido. Fijate con /mis_fijos")
    except Exception as e:
        logger.error(f"Error borrando fijo {context.args}: {e}")
        await update.message.reply_text("❌ Error al borrar. Asegurate de poner un ID válido.")


async def borrar_presupuesto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Borra un presupuesto existente. Uso: /borrar_presupuesto Comida"""
    user_id = update.effective_user.id
    if not context.args:
        await update.message.reply_text("❌ Uso: `/borrar_presupuesto Comida`", parse_mode='Markdown')
        return
    
    cat = context.args[0].capitalize()
    try:
        await db.borrar_presupuesto(user_id, cat)
        await update.message.reply_text(f"🗑️ Presupuesto de *{cat}* eliminado.", parse_mode='Markdown')
    except Exception as e:
        logger.error(f"Error borrando presupuesto: {e}")
        await update.message.reply_text("❌ No se pudo borrar. ¿Existe ese presupuesto?")

async def cambiar_moneda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cambia la moneda principal del usuario. Uso: /moneda USD"""
    user_id = update.effective_user.id
    if not context.args:
        actual = await db.usuarios.get_moneda(user_id)
        await update.message.reply_text(f"💰 Tu moneda actual es: *{actual}*\n\nPara cambiarla usá: `/moneda [ARS/USD/EUR/etc]`", parse_mode='Markdown')
        return
    
    nueva_moneda = context.args[0].upper()[:5]
    await db.usuarios.set_moneda(user_id, nueva_moneda)
    await update.message.reply_text(f"✅ Moneda actualizada a: *{nueva_moneda}*", parse_mode='Markdown')

async def toggle_notificaciones(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Activa o desactiva el recordatorio nocturno."""
    user_id = update.effective_user.id
    activas = await db.usuarios.get_notificaciones_activas(user_id)
    nuevo_estado = not activas
    await db.usuarios.set_notificaciones_activas(user_id, nuevo_estado)
    
    if nuevo_estado:
        msg = "🔔 *Notificaciones activadas*\nVas a recibir el resumen nocturno cada día."
    else:
        msg = "🔕 *Notificaciones desactivadas*\nNo vas a recibir más el recordatorio nocturno.\nPodés reactivarlas con /notificaciones."
    
    await update.message.reply_text(msg, parse_mode='Markdown')
