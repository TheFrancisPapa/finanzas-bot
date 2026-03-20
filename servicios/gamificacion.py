"""
servicios/gamificacion.py — Motor de logros y recompensas.

Verifica si un usuario cumple condiciones para desbloquear logros.
Inyectado en puntos clave de los handlers (ej: después de agregar un gasto).
"""

import logging
from telegram.ext import ContextTypes

from db import db
from utils.textos import LOGROS_DISPONIBLES

logger = logging.getLogger('Manguito-Gamificacion')


async def chequear_logros(user_id: int, contexto_accion: str, update, context: ContextTypes.DEFAULT_TYPE):
    """
    Evalúa si el usuario merece un logro según la acción que acaba de realizar.
    
    contexto_accion: "nuevo_gasto", "nueva_inversion", "nuevo_metas", etc.
    """
    try:
        logros_desbloqueados = []

        # 1. Bautismo de Fuego (Primer Gasto) & Racha de 7 días
        if contexto_accion == "nuevo_gasto":
            if not await db.tiene_logro(user_id, "primer_gasto"):
                gastos = await db.get_ultimos_movimientos(user_id, limite=5)
                if len(gastos) >= 1:
                    logros_desbloqueados.append("primer_gasto")

            # Desbloquear logros por racha
            racha = await db.get_racha(user_id)
            if racha >= 7 and not await db.tiene_logro(user_id, "racha_7"):
                logros_desbloqueados.append("racha_7")
            if racha >= 14 and not await db.tiene_logro(user_id, "racha_14"):
                logros_desbloqueados.append("racha_14")
            if racha >= 30 and not await db.tiene_logro(user_id, "racha_30"):
                logros_desbloqueados.append("racha_30")

        # 2. Multimoneda
        if contexto_accion == "multimoneda":
            if not await db.tiene_logro(user_id, "multimoneda"):
                logros_desbloqueados.append("multimoneda")

        # 3. Inversor
        if contexto_accion == "nueva_inversion":
            if not await db.tiene_logro(user_id, "inversor"):
                logros_desbloqueados.append("inversor")

        # 4. Modo Flash
        if contexto_accion == "modo_flash":
            if not await db.tiene_logro(user_id, "modo_flash"):
                logros_desbloqueados.append("modo_flash")

        # Guardar en BD y notificar
        for logro_id in logros_desbloqueados:
            asignado = await db.otorgar_logro(user_id, logro_id)
            if asignado:
                info = LOGROS_DISPONIBLES[logro_id]
                icono = info["icono"]
                titulo = info["titulo"]
                desc = info["desc"]

                msg = (
                    f"🏆 *¡NUEVO LOGRO DESBLOQUEADO!*\n"
                    f"──────────────────────\n"
                    f"{icono} *{titulo}*\n"
                    f"_{desc}_\n\n"
                    f"¡Felicitaciones! Podes ver tus trofeos en *Resumen > Mis Logros*."
                )

                # Mandar mensaje sorpresa (fire and forget)
                if update.message:
                    await context.bot.send_message(
                        chat_id=update.effective_chat.id,
                        text=msg,
                        parse_mode='Markdown'
                    )
                elif update.callback_query:
                    await context.bot.send_message(
                        chat_id=update.callback_query.message.chat_id,
                        text=msg,
                        parse_mode='Markdown'
                    )

                logger.info(f"Logro {logro_id} desbloqueado por user {user_id}")

    except Exception as e:
        logger.error(f"Error evaluando logros para el usuario {user_id}: {e}")
