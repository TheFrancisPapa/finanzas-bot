"""
db/repo_usuarios.py — Repositorio de usuarios y sistema PRO.

Maneja las tablas: `usuarios`, `usuarios_pro`, `usos_ia_diarios`, `feedback`.
"""

import logging
from datetime import datetime, timedelta
import time
from db.conexion import conexion

logger = logging.getLogger('Manguito-DB')


class RepoUsuarios:
    """Operaciones sobre usuarios, planes PRO, rate limiting y feedback."""

    def __init__(self):
        pass

    # ── REGISTRO ──────────────────────────────────────────

    async def registrar(self, user_id, nombre, username=None):
        async with conexion.get_conn() as conn:
            ahora = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            await conn.execute(
                "INSERT INTO usuarios (usuario_id, nombre, username, ultima_actividad) VALUES ($1, $2, $3, $4) ON CONFLICT (usuario_id) DO UPDATE SET nombre = EXCLUDED.nombre, username = EXCLUDED.username, ultima_actividad = EXCLUDED.ultima_actividad",
                user_id, nombre, username, ahora
            )

    async def get_todos(self):
        """Devuelve todos los user_id únicos con movimientos."""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch("SELECT DISTINCT usuario_id FROM movimientos")
            return [r['usuario_id'] for r in rows]

    async def buscar_por_nombre(self, texto):
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                """SELECT u.usuario_id, u.nombre, u.username, u.ultima_actividad,
                          COALESCE(p.plan, 'free') as plan
                   FROM usuarios u
                   LEFT JOIN usuarios_pro p ON u.usuario_id = p.usuario_id
                   WHERE LOWER(u.nombre) LIKE $1 OR LOWER(u.username) LIKE $2
                   ORDER BY u.ultima_actividad DESC""",
                f"%{texto.lower()}%", f"%{texto.lower()}%"
            )
            return [tuple(r.values()) for r in rows]

    async def get_todos_registrados(self):
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                """SELECT u.usuario_id, u.nombre, u.username, u.ultima_actividad,
                          COALESCE(p.plan, 'free') as plan
                   FROM usuarios u
                   LEFT JOIN usuarios_pro p ON u.usuario_id = p.usuario_id
                   ORDER BY u.ultima_actividad DESC"""
            )
            return [tuple(r.values()) for r in rows]

    async def get_apodo(self, user_id):
        async with conexion.get_conn() as conn:
            apodo = await conn.fetchval("SELECT apodo FROM usuarios WHERE usuario_id = $1", user_id)
            return apodo

    async def set_apodo(self, user_id, apodo):
        async with conexion.get_conn() as conn:
            await conn.execute(
                "INSERT INTO usuarios (usuario_id, apodo) VALUES ($1, $2) ON CONFLICT (usuario_id) DO UPDATE SET apodo = EXCLUDED.apodo",
                user_id, apodo
            )

    async def get_moneda(self, user_id):
        async with conexion.get_conn() as conn:
            moneda = await conn.fetchval("SELECT moneda_principal FROM usuarios WHERE usuario_id = $1", user_id)
            return moneda if moneda else "ARS"

    async def set_moneda(self, user_id, moneda):
        async with conexion.get_conn() as conn:
            await conn.execute(
                "INSERT INTO usuarios (usuario_id, moneda_principal) VALUES ($1, $2) ON CONFLICT (usuario_id) DO UPDATE SET moneda_principal = EXCLUDED.moneda_principal",
                user_id, moneda
            )

    # ── MODO CONVIVENCIA ─────────────────────────────────

    async def vincular_pareja(self, user_id, pareja_id):
        async with conexion.get_conn() as conn:
            # Validar que el usuario destino exista
            existe = await conn.fetchval("SELECT 1 FROM usuarios WHERE usuario_id = $1", pareja_id)
            if not existe:
                raise ValueError("El usuario destino no existe en Manguito. Pedile que inicie el bot primero.")
            async with conn.transaction():
                await conn.execute("UPDATE usuarios SET pareja_id = $1 WHERE usuario_id = $2", pareja_id, user_id)
                await conn.execute("UPDATE usuarios SET pareja_id = $1 WHERE usuario_id = $2", user_id, pareja_id)

    async def desvincular_pareja(self, user_id):
        async with conexion.get_conn() as conn:
            async with conn.transaction():
                # Buscar a la pareja y desvincular al otro
                pareja_id = await conn.fetchval("SELECT pareja_id FROM usuarios WHERE usuario_id = $1", user_id)
                if pareja_id:
                    await conn.execute("UPDATE usuarios SET pareja_id = NULL WHERE usuario_id = $1", pareja_id)
                # Desvincularse a si mismo
                await conn.execute("UPDATE usuarios SET pareja_id = NULL WHERE usuario_id = $1", user_id)

    async def get_pareja(self, user_id):
        async with conexion.get_conn() as conn:
            row1 = await conn.fetchrow("SELECT pareja_id, nombre, username FROM usuarios WHERE usuario_id = $1", user_id)
            if not row1 or not row1['pareja_id']:
                return None
                
            pareja_id = row1['pareja_id']
            row2 = await conn.fetchrow("SELECT nombre, username FROM usuarios WHERE usuario_id = $1", pareja_id)
            if not row2:
                return None
                
            return (pareja_id, row2['nombre'], row2['username'])

    # ── SISTEMA PRO ───────────────────────────────────────

    async def activar_trial(self, user_id):
        async with conexion.get_conn() as conn:
            existente = await conn.fetchval(
                "SELECT plan FROM usuarios_pro WHERE usuario_id = $1", user_id
            )
            if existente:
                return False

            ahora = datetime.now()
            vencimiento = ahora + timedelta(days=30)
            await conn.execute(
                "INSERT INTO usuarios_pro (usuario_id, plan, fecha_inicio, fecha_vencimiento, tip_index) VALUES ($1, 'trial', $2, $3, 0)",
                user_id, ahora.strftime('%Y-%m-%d %H:%M:%S'), vencimiento.strftime('%Y-%m-%d %H:%M:%S')
            )
            return True

    async def es_pro(self, user_id):
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT plan, fecha_vencimiento FROM usuarios_pro WHERE usuario_id = $1",
                user_id
            )

            if not row:
                return False

            plan, fecha_venc = row['plan'], row['fecha_vencimiento']

            if plan == 'pro':
                if fecha_venc:
                    try:
                        venc = datetime.strptime(fecha_venc, '%Y-%m-%d %H:%M:%S')
                        if datetime.now() > venc:
                            await conn.execute(
                                "UPDATE usuarios_pro SET plan = 'free' WHERE usuario_id = $1",
                                user_id
                            )
                            return False
                    except ValueError:
                        pass
                return True

            elif plan == 'trial':
                try:
                    venc = datetime.strptime(fecha_venc, '%Y-%m-%d %H:%M:%S')
                    if datetime.now() > venc:
                        await conn.execute(
                            "UPDATE usuarios_pro SET plan = 'free' WHERE usuario_id = $1",
                            user_id
                        )
                        return False
                    return True
                except ValueError:
                    return False

            return False

    async def info_plan(self, user_id):
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT plan, fecha_inicio, fecha_vencimiento FROM usuarios_pro WHERE usuario_id = $1",
                user_id
            )

            if not row:
                return ('free', 0, None)

            plan, fecha_inicio, fecha_venc = row['plan'], row['fecha_inicio'], row['fecha_vencimiento']

            if fecha_venc:
                try:
                    venc = datetime.strptime(fecha_venc, '%Y-%m-%d %H:%M:%S')
                    dias_restantes = max(0, (venc - datetime.now()).days)
                    return (plan, dias_restantes, fecha_venc)
                except ValueError:
                    return (plan, 0, fecha_venc)

            return (plan, 0, None)

    async def activar_pro(self, user_id, meses=1):
        async with conexion.get_conn() as conn:
            ahora = datetime.now()
            vencimiento = ahora + timedelta(days=30 * meses)
            await conn.execute(
                "INSERT INTO usuarios_pro (usuario_id, plan, fecha_inicio, fecha_vencimiento, tip_index) VALUES ($1, 'pro', $2, $3, 0) ON CONFLICT (usuario_id) DO UPDATE SET plan = EXCLUDED.plan, fecha_inicio = EXCLUDED.fecha_inicio, fecha_vencimiento = EXCLUDED.fecha_vencimiento",
                user_id, ahora.strftime('%Y-%m-%d %H:%M:%S'), vencimiento.strftime('%Y-%m-%d %H:%M:%S')
            )

    async def get_siguiente_tip(self, user_id):
        tips = [
            "💡 *¿Sabías que...*\nPodés preguntarme _\"¿cuánto está el dólar?\"_ y te doy el Blue, Oficial y MEP al instante con variación diaria 💵",
            "💡 *¿Sabías que...*\nPodés mandarme una *foto del ticket* y yo extraigo el monto y la categoría automáticamente 📸",
            "💡 *¿Sabías que...*\nCon el *Análisis IA* te doy consejos personalizados sobre cómo mejorar tus finanzas 🧠",
            "💡 *¿Sabías que...*\nPodés *exportar un Excel profesional* con gráficos de torta y evolución temporal 📊",
            "💡 *¿Sabías que...*\nPodés fijar *presupuestos por categoría* y te aviso cuando estás por pasarte 🚨",
            "💡 *¿Sabías que...*\nPodés mandarme un *audio* diciendo tu gasto y yo lo registro solo 🎤",
            "💡 *¿Sabías que...*\nEl botón *Comparativo* te muestra si gastás más o menos que el mes pasado por categoría 📈",
            "💡 *¿Sabías que...*\nCon `/buscar pizza` podés ver cuánto gastaste en pizza en total 🔍",
        ]

        async with conexion.get_conn() as conn:
            idx_row = await conn.fetchval(
                "SELECT tip_index FROM usuarios_pro WHERE usuario_id = $1", user_id
            )

            if idx_row is None:
                return None

            idx = idx_row % len(tips)
            await conn.execute(
                "UPDATE usuarios_pro SET tip_index = $1 WHERE usuario_id = $2",
                idx + 1, user_id
            )

            return tips[idx]

    async def get_en_trial(self):
        async with conexion.get_conn() as conn:
            ahora = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            rows = await conn.fetch(
                "SELECT usuario_id FROM usuarios_pro WHERE plan = 'trial' AND fecha_vencimiento > $1",
                ahora
            )
            return [r['usuario_id'] for r in rows]

    # ── RATE LIMITER IA ───────────────────────────────────

    async def registrar_uso_ia(self, user_id):
        hoy = datetime.now().strftime('%Y-%m-%d')
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT cantidad FROM usos_ia_diarios WHERE usuario_id = $1 AND fecha = $2",
                user_id, hoy
            )

            if row:
                await conn.execute(
                    "UPDATE usos_ia_diarios SET cantidad = cantidad + 1 WHERE usuario_id = $1 AND fecha = $2",
                    user_id, hoy
                )
            else:
                await conn.execute(
                    "INSERT INTO usos_ia_diarios (usuario_id, fecha, cantidad) VALUES ($1, $2, 1)",
                    user_id, hoy
                )

    async def obtener_usos_ia(self, user_id):
        hoy = datetime.now().strftime('%Y-%m-%d')
        async with conexion.get_conn() as conn:
            cant = await conn.fetchval(
                "SELECT cantidad FROM usos_ia_diarios WHERE usuario_id = $1 AND fecha = $2",
                user_id, hoy
            )
            return cant if cant else 0

    # ── FEEDBACK ──────────────────────────────────────────

    async def agregar_feedback(self, user_id, mensaje):
        fecha = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        async with conexion.get_conn() as conn:
            await conn.execute(
                "INSERT INTO feedback (usuario_id, fecha, mensaje) VALUES ($1, $2, $3)",
                user_id, fecha, mensaje
            )

    async def get_feedback(self):
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT usuario_id, fecha, mensaje FROM feedback ORDER BY id DESC LIMIT 10"
            )
            return [(r['usuario_id'], r['fecha'], r['mensaje']) for r in rows]

    async def get_notificaciones_activas(self, user_id):
        async with conexion.get_conn() as conn:
            val = await conn.fetchval(
                "SELECT notificaciones_activas FROM usuarios WHERE usuario_id = $1", user_id
            )
            return val if val is not None else 1  # Por defecto activas

    async def set_notificaciones_activas(self, user_id, activas: bool):
        async with conexion.get_conn() as conn:
            await conn.execute(
                "UPDATE usuarios SET notificaciones_activas = $1 WHERE usuario_id = $2",
                1 if activas else 0, user_id
            )

    async def crear_usuario_web(self, email: str, password_hash: str, nombre: str, edad: int | None = None, objetivo: str | None = None) -> int:
        nuevo_id = int(time.time() * 1000) % 2_000_000_000
        async with conexion.get_conn() as conn:
            async with conn.transaction():
                await conn.execute(
                    "INSERT INTO usuarios (usuario_id, nombre, username, ultima_actividad) VALUES ($1, $2, NULL, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING",
                    nuevo_id, nombre
                )
                await conn.execute(
                    "INSERT INTO web_users (usuario_id, email, password_hash, nombre, edad, objetivo) VALUES ($1, $2, $3, $4, $5, $6)",
                    nuevo_id, email.lower().strip(), password_hash, nombre, edad, objetivo
                )
                await conn.execute(
                    "INSERT INTO usuarios_pro (usuario_id, plan) VALUES ($1, 'free') ON CONFLICT DO NOTHING",
                    nuevo_id
                )
        return nuevo_id

    async def crear_o_actualizar_usuario_google(self, google_id: str, email: str, nombre: str) -> int:
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT usuario_id FROM web_users WHERE google_id = $1 OR email = $2",
                google_id, email.lower().strip()
            )
            if row:
                await conn.execute("UPDATE web_users SET google_id = $1 WHERE usuario_id = $2", google_id, row['usuario_id'])
                return row['usuario_id']

            nuevo_id = int(time.time() * 1000) % 2_000_000_000
            async with conn.transaction():
                await conn.execute(
                    "INSERT INTO usuarios (usuario_id, nombre, username, ultima_actividad) VALUES ($1, $2, NULL, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING",
                    nuevo_id, nombre
                )
                await conn.execute(
                    "INSERT INTO web_users (usuario_id, email, google_id, nombre) VALUES ($1, $2, $3, $4)",
                    nuevo_id, email.lower().strip(), google_id, nombre
                )
                await conn.execute(
                    "INSERT INTO usuarios_pro (usuario_id, plan) VALUES ($1, 'free') ON CONFLICT DO NOTHING",
                    nuevo_id
                )
            return nuevo_id

    async def get_web_user_por_email(self, email: str):
        """Retorna (usuario_id, password_hash) o None."""
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT usuario_id, password_hash FROM web_users WHERE email = $1",
                email.lower().strip()
            )
            return (row['usuario_id'], row['password_hash']) if row else None

    async def email_disponible(self, email: str) -> bool:
        async with conexion.get_conn() as conn:
            row = await conn.fetchval(
                "SELECT id FROM web_users WHERE email = $1", email.lower().strip()
            )
            return row is None

    async def vincular_telegram(self, usuario_id: int, telegram_user_id: int) -> bool:
        async with conexion.get_conn() as conn:
            try:
                await conn.execute(
                    "UPDATE web_users SET telegram_user_id = $1 WHERE usuario_id = $2",
                    telegram_user_id, usuario_id
                )
                return True
            except Exception:
                return False

    async def needs_onboarding(self, usuario_id: int) -> bool:
        """Retorna True si el usuario web aún no completó el onboarding."""
        async with conexion.get_conn() as conn:
            edad = await conn.fetchval(
                "SELECT edad FROM web_users WHERE usuario_id = $1", usuario_id
            )
            return edad is None

    async def completar_onboarding(self, usuario_id: int, edad: int, objetivo: str):
        async with conexion.get_conn() as conn:
            await conn.execute(
                "UPDATE web_users SET edad = $1, objetivo = $2 WHERE usuario_id = $3",
                edad, objetivo, usuario_id
            )

    async def eliminar_cuenta(self, usuario_id: int):
        """Elimina todos los datos asociados a un usuario (incluyendo Google y Telegram) de forma permanente."""
        async with conexion.get_conn() as conn:
            async with conn.transaction():
                # 1. Desvincular de pareja si la tuviera
                pareja_id = await conn.fetchval("SELECT pareja_id FROM usuarios WHERE usuario_id = $1", usuario_id)
                if pareja_id:
                    await conn.execute("UPDATE usuarios SET pareja_id = NULL WHERE usuario_id = $1", pareja_id)
                
                # 2. Eliminar de tablas dependientes
                await conn.execute("DELETE FROM web_users WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM usuarios_pro WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM movimientos WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM presupuestos WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM suscripciones WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM usos_ia_diarios WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM metas_ahorro WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM feedback WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM servicios_variables WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM reglas_categorias WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM inversiones WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM logros_usuario WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM compras_cuotas WHERE usuario_id = $1", usuario_id)
                await conn.execute("DELETE FROM categorias_usuario WHERE usuario_id = $1", usuario_id)
                
                # 3. Finalmente eliminar de la tabla principal de usuarios
                await conn.execute("DELETE FROM usuarios WHERE usuario_id = $1", usuario_id)

    # ── NUEVOS AJUSTES WEB ────────────────────────────────
    
    async def get_perfil_web_completo(self, usuario_id: int):
        """Retorna todos los datos del perfil combinando usuarios y web_users."""
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow("""
                SELECT u.nombre, u.apodo, u.moneda_principal, u.notificaciones_activas,
                       w.email, w.edad, w.objetivo, w.hide_balances, w.theme, w.profile_pic,
                       p.plan
                FROM usuarios u
                LEFT JOIN web_users w ON u.usuario_id = w.usuario_id
                LEFT JOIN usuarios_pro p ON u.usuario_id = p.usuario_id
                WHERE u.usuario_id = $1
            """, usuario_id)
            return dict(row) if row else None

    async def actualizar_ajustes(self, usuario_id: int, hide_balances: bool, theme: str, profile_pic: str | None = None):
        async with conexion.get_conn() as conn:
            await conn.execute("""
                UPDATE web_users 
                SET hide_balances = $1, theme = $2, profile_pic = $3 
                WHERE usuario_id = $4
            """, hide_balances, theme, profile_pic, usuario_id)

# --- Alineación Técnica (Funciones Standalone) ---

async def obtener_usuario_por_email(email: str):
    """Busca un usuario por su email en la tabla usuarios."""
    async with conexion.get_conn() as conn:
        row = await conn.fetchrow("SELECT * FROM usuarios WHERE email = $1", email.lower().strip())
        return dict(row) if row else None

async def crear_usuario_web(nombre: str, email: str, auth_provider: str, picture: str | None = None, password_hash: str | None = None):
    """Crea un nuevo usuario desde la web."""
    # Generamos un ID compatible con el sistema existente si no viene uno
    nuevo_id = int(time.time() * 1000) % 2_000_000_000
    async with conexion.get_conn() as conn:
        await conn.execute('''
            INSERT INTO usuarios (usuario_id, nombre, email, auth_provider, picture, password_hash, ultima_actividad)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ''', nuevo_id, nombre, email.lower().strip(), auth_provider, picture, password_hash)
        return nuevo_id
