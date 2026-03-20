"""
handlers/comunes.py — Funciones compartidas entre handlers.

Teclados, mensajes PRO, y utilidades que se usan en más de un handler.
"""

import logging

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton

from utils.textos import PRECIO_PRO
from core.config import config

logger = logging.getLogger('Manguito')

LINK_DONACION = config.LINK_DONACION


def teclado_principal():
    """Genera el teclado inline estilo app de finanzas."""
    keyboard = [
        [InlineKeyboardButton("➕ Registrar Transacción", callback_data="cmd_registrar")],
        [InlineKeyboardButton("📊 Dashboard", callback_data="cmd_resumen"),
         InlineKeyboardButton("📝 Historial", callback_data="cmd_historial")],
        [InlineKeyboardButton("🔮 El Oráculo", callback_data="cmd_oraculo"),
         InlineKeyboardButton("⚡ Flash", callback_data="menu_flash")],
        [InlineKeyboardButton("🛠️ Herramientas", callback_data="cmd_herramientas"),
         InlineKeyboardButton("⚙️ Mi Cuenta", callback_data="menu_perfil")]
    ]
    return InlineKeyboardMarkup(keyboard)

def teclado_herramientas():
    """Genera el teclado inline para las herramientas."""
    keyboard = [
        [InlineKeyboardButton("🧠 Análisis IA", callback_data="cmd_analisis"),
         InlineKeyboardButton("✏️ Editar / Borrar", callback_data="menu_editar")],
        [InlineKeyboardButton("💳 Mis Finanzas", callback_data="menu_finanzas")],
        [InlineKeyboardButton("📈 Reportes", callback_data="menu_reportes")],
        [InlineKeyboardButton("🌟 Extras", callback_data="menu_extras")],
        [InlineKeyboardButton("◀️ Menú Principal", callback_data="cmd_menu")]
    ]
    return InlineKeyboardMarkup(keyboard)

def teclado_mis_finanzas():
    keyboard = [
        [InlineKeyboardButton("🎯 Presupuestos", callback_data="cmd_metas"),
         InlineKeyboardButton("🐷 Metas de Ahorro", callback_data="cmd_metas_ahorro")],
        [InlineKeyboardButton("💳 Cuotas", callback_data="menu_cuotas"),
         InlineKeyboardButton("🔄 Suscripciones", callback_data="cmd_mis_fijos")],
        [InlineKeyboardButton("🔔 Mis Avisos", callback_data="menu_variables")],
        [InlineKeyboardButton("◀️ Volver a Herramientas", callback_data="cmd_herramientas")]
    ]
    return InlineKeyboardMarkup(keyboard)

def teclado_reportes():
    keyboard = [
        [InlineKeyboardButton("🏆 Top Gastos", callback_data="cmd_top"),
         InlineKeyboardButton("📈 Comparativo", callback_data="cmd_comparativo")],
        [InlineKeyboardButton("🏦 Auditar", callback_data="cmd_auditoria"),
         InlineKeyboardButton("📤 Exportar", callback_data="cmd_exportar")],
        [InlineKeyboardButton("◀️ Volver a Herramientas", callback_data="cmd_herramientas")]
    ]
    return InlineKeyboardMarkup(keyboard)

def teclado_extras():
    keyboard = [
        [InlineKeyboardButton("📈 Inversiones", callback_data="menu_inversiones"),
         InlineKeyboardButton("💵 Dólar", callback_data="cmd_dolar")],
        [InlineKeyboardButton("🐄 Cuentas (Vaquita)", callback_data="menu_vaquita")],
        [InlineKeyboardButton("◀️ Volver a Herramientas", callback_data="cmd_herramientas")]
    ]
    return InlineKeyboardMarkup(keyboard)

def teclado_volver():
    """Botón simple para volver al menú."""
    return InlineKeyboardMarkup([[InlineKeyboardButton("◀️ Menú Principal", callback_data="cmd_menu")]])


def teclado_navegacion():
    """Teclado persistente inferior — accesos rápidos más usados."""
    keyboard = [
        [KeyboardButton("➕ Anotar Gasto"), KeyboardButton("💵 Dólar Hoy")],
        [KeyboardButton("🌐 WEB"), KeyboardButton("📋 Menú")]
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, is_persistent=True)


async def msg_necesita_pro(feature_name, user_id=None):
    """Genera mensaje cuando un usuario free intenta usar una feature PRO."""
    import mercadopago
    from core.config import config as cfg

    mp_link = LINK_DONACION
    if user_id:
        try:
            sdk = mercadopago.SDK(cfg.MP_ACCESS_TOKEN)
            preference_data = {
                "items": [{
                    "title": "Manguito PRO — 1 mes",
                    "quantity": 1,
                    "unit_price": 6999.0,
                    "currency_id": "ARS",
                }],
                "back_urls": {
                    "success": f"{cfg.PUBLIC_URL}/",
                    "pending": f"{cfg.PUBLIC_URL}/",
                    "failure": f"{cfg.PUBLIC_URL}/",
                },
                "auto_return": "approved",
                "external_reference": str(user_id),
                "notification_url": f"{cfg.PUBLIC_URL}/api/pago/webhook",
            }
            result = sdk.preference().create(preference_data)
            if result.get("status") == 201:
                mp_link = result["response"]["init_point"]
        except Exception as e:
            logger.error(f"Error MP telegram: {e}")

    msg = f"\u2b50 *{feature_name}* es una función *PRO*\n\n"
    msg += f"\U0001F513 Desbloqueala por solo *{PRECIO_PRO}*\n\n"
    msg += "\U0001F381 El plan PRO incluye:\n"
    msg += "\u2022 \U0001F9E0 Análisis con Inteligencia Artificial\n"
    msg += "\u2022 \U0001F4CA Exportar Excel con gráficos\n"
    msg += "\u2022 \U0001F4F8 Fotos de tickets automáticas\n"
    msg += "\u2022 \U0001F3A4 Notas de voz para gastos\n"
    msg += "\u2022 \U0001F4B5 Cotización del dólar en vivo\n"
    msg += "\u2022 \U0001F50D Buscar movimientos por texto\n"
    msg += "\u2022 \U0001F4C8 Comparativo mes a mes\n"
    msg += "\u2022 \U0001F6A8 Alertas de presupuesto\n\n"
    msg += f"💳 *Activá PRO pagando con MercadoPago acá:*\n{mp_link}\n\n"
    msg += f"_(La activación es inmediata y automática)_"
    return msg
