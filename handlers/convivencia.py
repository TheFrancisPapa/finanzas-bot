"""
handlers/convivencia.py — Modo Convivencia
Permite vincular usuarios para llevar gastos compartidos.
"""

import logging
from datetime import datetime
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import ContextTypes, ConversationHandler, CallbackQueryHandler, MessageHandler, CommandHandler, filters

from db import db
from handlers.comunes import teclado_volver, teclado_navegacion

logger = logging.getLogger('Manguito')

ESPERANDO_ID_PAREJA = 0

async def menu_convivencia(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra el estado de vinculación o el menú para vincular/balance."""
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    pareja = await db.get_pareja(user_id)
    
    if pareja:
        p_id, p_nombre, p_user = pareja
        
        msg = (
            f"🏠 *MODO CONVIVENCIA*\n"
            f"─" * 22 + "\n\n"
            f"Estás vinculado con *{p_nombre}* (`{p_id}`).\n\n"
            f"Cuando anotes un gasto, vas a tener la opción de marcarlo como 'Compartido'. "
            f"Usá el botón de abajo para ver quién le debe a quién este mes."
        )
        keyboard = [
            [InlineKeyboardButton("⚖️ Balance Compartido", callback_data="conv_balance")],
            [InlineKeyboardButton("💔 Desvincular", callback_data="conv_desvincular")],
            [InlineKeyboardButton("◀️ Volver", callback_data="cmd_menu")]
        ]
        await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END
    else:
        msg = (
            f"🏠 *MODO CONVIVENCIA*\n"
            f"─" * 22 + "\n\n"
            f"Dividí gastos con tu pareja o roomie fácilmente.\n"
            f"¿Cómo funciona? Vinculan sus cuentas, eligen qué gastos compartir, "
            f"y yo les calculo quién le debe a quién a fin de mes.\n\n"
            f"Tu ID de usuario para que te agreguen es: `{user_id}`\n\n"
            f"¿Querés vincularte vos a alguien?"
        )
        keyboard = [
            [InlineKeyboardButton("🔗 Vincular Cuenta", callback_data="conv_iniciar_vinculo")],
            [InlineKeyboardButton("◀️ Volver", callback_data="cmd_menu")]
        ]
        await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END

async def iniciar_vinculo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    await query.edit_message_text(
        "🔗 *Vincular Cuenta*\n\n"
        "Ingresá el *ID Numérico* de la otra persona "
        "(Lo puede buscar en Configuración > Mi Perfil):\n\n"
        "_Mandá /cancelar para salir._",
        parse_mode='Markdown'
    )
    return ESPERANDO_ID_PAREJA
    
async def recibir_id_pareja(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    texto = update.message.text.strip()
    
    try:
        pareja_id = int(texto)
        if pareja_id == user_id:
            raise ValueError("No podés vincularte con vos mismo")
            
        # Intentar vincular en DB
        await db.vincular_pareja(user_id, pareja_id)
        
        await update.message.reply_text(
            f"✅ *¡Cuentas vinculadas con éxito!*\n\n"
            f"Ya están en Modo Convivencia. Notificá a la otra persona.",
            parse_mode='Markdown',
            reply_markup=teclado_navegacion()
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Error al vincular: {e}.\nAsegurate de que el ID sea correcto.")
        
    return ConversationHandler.END

async def desvincular(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id
    
    await db.desvincular_pareja(user_id)
    
    await query.edit_message_text(
        "💔 *Desvinculación Completa*\n\nYa no están en Modo Convivencia.",
        parse_mode='Markdown',
        reply_markup=teclado_volver()
    )

async def ver_balance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    pareja = await db.get_pareja(user_id)
    
    if not pareja:
        await query.edit_message_text("No estás vinculado a nadie.", reply_markup=teclado_volver())
        return
        
    p_id, p_nombre, _ = pareja
    mes_actual = datetime.now().strftime('%Y-%m')
    
    mi_total, su_total, mitad_exacta = await db.get_balance_compartido(user_id, p_id, mes_actual)
    
    msg = (
        f"⚖️ *BALANCE COMPARTIDO DEL MES*\n"
        f"─" * 22 + "\n\n"
        f"Vos pusiste: *${mi_total:,.0f}*\n"
        f"{p_nombre} puso: *${su_total:,.0f}*\n\n"
        f"Total gastado entre los dos: *${(mi_total+su_total):,.0f}*\n"
        f"Cada uno debió poner: *${mitad_exacta:,.0f}*\n\n"
    )
    
    if mi_total > su_total:
        deuda = mi_total - mitad_exacta
        msg += f"👉 *{p_nombre} te debe: ${deuda:,.0f}*"
    elif su_total > mi_total:
        deuda = su_total - mitad_exacta
        msg += f"👉 *Vos le debés a {p_nombre}: ${deuda:,.0f}*"
    else:
        msg += "👉 *Están hechos, 0 a 0.* 🤝"

    await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_volver())

async def cancelar_vinculo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Cancelado.", reply_markup=teclado_navegacion())
    return ConversationHandler.END


# Handlers
conv_convivencia_handler = ConversationHandler(
    entry_points=[
        CallbackQueryHandler(menu_convivencia, pattern="^menu_convivencia$"),
        CallbackQueryHandler(iniciar_vinculo, pattern="^conv_iniciar_vinculo$")
    ],
    states={
        ESPERANDO_ID_PAREJA: [MessageHandler(filters.TEXT & ~filters.COMMAND, recibir_id_pareja)]
    },
    fallbacks=[CommandHandler("cancelar", cancelar_vinculo)],
    per_message=False
)

callback_convivencia = [
    CallbackQueryHandler(ver_balance, pattern="^conv_balance$"),
    CallbackQueryHandler(desvincular, pattern="^conv_desvincular$")
]
