"""
utils/textos.py — Constantes de texto, emojis y mensajes del bot.

Centraliza todos los strings hardcodeados que antes vivían en telegram_bot.py.
Así logramos un Single Source of Truth para el copy del bot.
"""

# --- MENSAJES CON PERSONALIDAD ---

MENSAJES_GASTO = [
    "✅ *Anotado, crack!*",
    "✍️ *Registrado al toque*",
    "📝 *Listo, lo guardé*",
    "✅ *Guardado, pa*",
    "💸 *Anotadito*",
]

MENSAJES_INGRESO = [
    "💰 *Lindo ingreso, eh!*",
    "🤑 *Se vino la plata!*",
    "✅ *Anotado el ingreso*",
    "💵 *Guardado, king*",
    "🙌 *Entró plata, vamos!*",
]

# --- EMOJIS POR CATEGORÍA ---

EMOJIS_CATEGORIA = {
    'Comida': '🍔', 'Transporte': '🚌', 'Supermercado': '🛒', 'Ocio': '🎮',
    'Servicios': '📡', 'Salud': '🏥', 'Educación': '🎓', 'Ropa': '👕',
    'Suscripciones': '🔄', 'Varios': '📦'
}

# --- MESES EN ESPAÑOL ---

MESES_ES = {
    1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
    5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
    9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
}

# --- MONETIZACIÓN ---

PRECIO_PRO = "$6.999/mes"

# --- RACHAS (mensajes de celebración) ---

RACHAS_MSG = {
    7: "🔥 *¡7 días de racha!* Vas como tren",
    14: "💪 *¡2 semanas seguidas!* Sos un crack",
    30: "🏆 *🗓️ 1 MES DE RACHA* ¡Sos imparable!",
    50: "👑 *50 DÍAS SEGUIDOS* Legend",
    100: "🚀 *100 DÍAS* ¡Sos el GOAT de las finanzas!",
}

# --- RECORDATORIO NOCTURNO ---

FRASES_RECORDATORIO_CON_GASTOS = [
    "🌙 *Resumen del día:*",
    "📊 *Cómo te fue hoy:*",
    "🧐 *Antes de dormir, tu día:*",
]

FRASES_RECORDATORIO_SIN_GASTOS = [
    "🌙 ¿No gastaste nada hoy? ¡Bien ahí, crack!",
    "💰 ¿Te acordás si gastaste algo hoy? Anotá así no se te pierde.",
    "🔔 Un peso no anotado es un peso invisible. ¿Compraste algo hoy?",
    "🧐 ¿Compraste algo hoy? Dale, anotálo antes de dormir.",
]

# --- MEDALLAS ---

MEDALLAS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"]

# --- ICONOS DE SUSCRIPCIONES ---

def icono_suscripcion(nombre: str) -> str:
    """Devuelve un emoji representativo según el nombre de la suscripción."""
    n_lower = nombre.lower()
    iconos = {
        "netflix": "🎬", "spotify": "🎧", "youtube": "📺",
        "disney": "🏰", "prime": "📦", "amazon": "📦",
        "hbo": "📽️", "max": "📽️",
        "internet": "🌐", "wifi": "🌐", "fibertel": "🌐", "telecentro": "🌐",
        "luz": "💡", "edenor": "💡", "edesur": "💡",
        "gas": "🔥", "metrogas": "🔥",
        "agua": "💧", "aysa": "💧",
        "gym": "🏋️", "gimnasio": "🏋️", "crossfit": "🏋️",
        "alquiler": "🏠", "expensas": "🏠",
        "celular": "📱", "movistar": "📱", "personal": "📱", "claro": "📱",
        "seguro": "🛡️", "patente": "🚗",
        "icloud": "☁️", "apple": "☁️",
    }
    for keyword, icono in iconos.items():
        if keyword in n_lower:
            return icono
    return "📌"


def generar_barra_presupuesto(estado_pres) -> str:
    """
    Genera la barra visual de presupuesto para mostrar después de un gasto.
    estado_pres: tupla (categoria, maximo, gastado) o None si no hay presupuesto.
    Retorna string vacío si no hay presupuesto.
    """
    if not estado_pres:
        return ""

    cat, _porcentaje, gastado, maximo = estado_pres
    if maximo <= 0:
        return ""

    porcentaje = (gastado / maximo) * 100
    bloques = min(int(porcentaje // 10), 10)
    barra = "█" * bloques + "░" * (10 - bloques)

    if porcentaje >= 100:
        emoji = "🔴"
        alerta = " ⚠️ *¡Límite superado!*"
    elif porcentaje >= 80:
        emoji = "🟠"
        alerta = " _Cuidado, estás cerca del límite_"
    elif porcentaje >= 60:
        emoji = "🟡"
        alerta = ""
    else:
        emoji = "🟢"
        alerta = ""

    return f"\n{emoji} `[{barra}]` {porcentaje:.0f}% de {cat}{alerta}"


def generar_barra_meta(actual: float, objetivo: float) -> str:
    """
    Genera una barra visual de progreso para una meta de ahorro.
    A diferencia de presupuestos, acá 100% es BUENO (meta cumplida).
    Retorna: "[████████░░] 80% — $80,000 / $100,000"
    """
    if objetivo <= 0:
        return "`[██████████]` 100% ✅"

    porcentaje = min((actual / objetivo) * 100, 100)
    bloques = min(int(porcentaje // 10), 10)
    barra = "█" * bloques + "░" * (10 - bloques)

    if porcentaje >= 100:
        emoji = "🎉"
    elif porcentaje >= 75:
        emoji = "🟢"
    elif porcentaje >= 50:
        emoji = "🟡"
    elif porcentaje >= 25:
        emoji = "🟠"
    else:
        emoji = "🔴"

    return f"{emoji} `[{barra}]` {porcentaje:.0f}% — ${actual:,.0f} / ${objetivo:,.0f}"
