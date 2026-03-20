"""
db/repo_movimientos.py — Repositorio de movimientos financieros.

CRUD de la tabla `movimientos`, presupuestos, cotizaciones,
y queries de análisis/reportes.
"""

import logging
from datetime import datetime, timedelta
from db.conexion import conexion

logger = logging.getLogger('Manguito-DB')


class RepoMovimientos:
    """Operaciones sobre movimientos, presupuestos y cotizaciones."""

    def __init__(self):
        pass

    # ── CRUD ──────────────────────────────────────────────

    async def agregar(self, user_id, tipo, monto, categoria, descripcion, moneda="ARS"):
        fecha = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        categoria = categoria.capitalize()
        async with conexion.get_conn() as conn:
            mov_id = await conn.fetchval(
                'INSERT INTO movimientos (usuario_id, fecha, tipo, monto, categoria, descripcion, moneda) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                user_id, fecha, tipo, monto, categoria, descripcion, moneda
            )
            return mov_id

    async def borrar_por_id(self, user_id, mov_id):
        """Borra un movimiento por ID (solo si pertenece al usuario)."""
        async with conexion.get_conn() as conn:
            mov = await conn.fetchrow(
                "SELECT descripcion, monto FROM movimientos WHERE id = $1 AND usuario_id = $2",
                mov_id, user_id
            )
            if mov:
                await conn.execute("DELETE FROM movimientos WHERE id = $1", mov_id)
                return (mov['descripcion'], mov['monto'])
            return None

    async def borrar_ultimo(self, user_id):
        async with conexion.get_conn() as conn:
            ultimo = await conn.fetchrow(
                "SELECT id, descripcion, monto FROM movimientos WHERE usuario_id = $1 ORDER BY id DESC LIMIT 1",
                user_id
            )
            if ultimo:
                await conn.execute("DELETE FROM movimientos WHERE id = $1", ultimo['id'])
                return (ultimo['id'], ultimo['descripcion'], ultimo['monto'])
            return None

    async def editar(self, user_id, mov_id, nuevo_monto):
        async with conexion.get_conn() as conn:
            viejo = await conn.fetchrow(
                "SELECT descripcion, monto FROM movimientos WHERE id = $1 AND usuario_id = $2",
                mov_id, user_id
            )
            if viejo:
                await conn.execute(
                    "UPDATE movimientos SET monto = $1 WHERE id = $2 AND usuario_id = $3",
                    nuevo_monto, mov_id, user_id
                )
                return (viejo['descripcion'], viejo['monto'])
            return None

    async def buscar(self, user_id, texto, limite=10):
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT id, fecha, tipo, monto, categoria, descripcion FROM movimientos WHERE usuario_id = $1 AND LOWER(descripcion) LIKE $2 ORDER BY fecha DESC LIMIT $3",
                user_id, f"%{texto.lower()}%", limite
            )
            return [(r['id'], r['fecha'], r['tipo'], r['monto'], r['categoria'], r['descripcion']) for r in rows]
            
    async def editar_categoria(self, user_id, mov_id, nueva_categoria):
        async with conexion.get_conn() as conn:
            viejo = await conn.fetchrow(
                "SELECT descripcion, categoria FROM movimientos WHERE id = $1 AND usuario_id = $2",
                mov_id, user_id
            )
            if viejo:
                await conn.execute(
                    "UPDATE movimientos SET categoria = $1 WHERE id = $2 AND usuario_id = $3",
                    nueva_categoria, mov_id, user_id
                )
                return (viejo['descripcion'], viejo['categoria'])
            return None
            
    async def hacer_compartido(self, user_id, mov_id):
        async with conexion.get_conn() as conn:
            await conn.execute("UPDATE movimientos SET es_compartido = True WHERE id = $1 AND usuario_id = $2", mov_id, user_id)

    # ── CONSULTAS ─────────────────────────────────────────

    async def get_gastos_hoy(self, user_id):
        """Total gastado hoy por el usuario."""
        hoy = datetime.now().strftime('%Y-%m-%d')
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as cant FROM movimientos WHERE usuario_id = $1 AND tipo = 'egreso' AND fecha LIKE $2",
                user_id, f"{hoy}%"
            )
            return (row['total'], row['cant']) if row else (0, 0)

    async def get_resumen_mensual(self, user_id):
        mes_actual = datetime.now().strftime('%Y-%m')
        async with conexion.get_conn() as conn:
            ing_row = await conn.fetchrow(
                "SELECT SUM(monto) as total FROM movimientos WHERE tipo='ingreso' AND usuario_id = $1 AND SUBSTR(fecha, 1, 7) = $2",
                user_id, mes_actual
            )
            ingresos = ing_row['total'] if ing_row and ing_row['total'] else 0

            gast_row = await conn.fetchrow(
                "SELECT SUM(monto) as total FROM movimientos WHERE tipo='egreso' AND usuario_id = $1 AND SUBSTR(fecha, 1, 7) = $2",
                user_id, mes_actual
            )
            gastos = gast_row['total'] if gast_row and gast_row['total'] else 0

            return ingresos, gastos

    async def get_ultimos_movimientos(self, user_id, limite=5):
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT descripcion, monto, tipo, fecha FROM movimientos WHERE usuario_id = $1 ORDER BY id DESC LIMIT $2",
                user_id, limite
            )
            return [(r['descripcion'], r['monto'], r['tipo'], r['fecha']) for r in rows]

    async def get_ultimos_movimientos_con_id(self, user_id, limite=10):
        """Igual que get_ultimos_movimientos pero incluyendo el ID del registro."""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT id, descripcion, monto, tipo, categoria, fecha, moneda FROM movimientos WHERE usuario_id = $1 ORDER BY id DESC LIMIT $2",
                user_id, limite
            )
            return [(r['id'], r['descripcion'], r['monto'], r['tipo'], r['categoria'], r['fecha'], r['moneda']) for r in rows]
            
    async def get_movimientos_paginados(self, user_id, limite=5, offset=0, tipo=None):
        """Obtiene movimientos paginados para la edición visual."""
        async with conexion.get_conn() as conn:
            if tipo:
                rows = await conn.fetch(
                    "SELECT id, descripcion, monto, tipo, categoria, fecha, moneda FROM movimientos WHERE usuario_id = $1 AND tipo = $2 ORDER BY id DESC LIMIT $3 OFFSET $4",
                    user_id, tipo, limite, offset
                )
            else:
                rows = await conn.fetch(
                    "SELECT id, descripcion, monto, tipo, categoria, fecha, moneda FROM movimientos WHERE usuario_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3",
                    user_id, limite, offset
                )
            return [(r['id'], r['descripcion'], r['monto'], r['tipo'], r['categoria'], r['fecha'], r['moneda']) for r in rows]

    async def contar_movimientos_total(self, user_id, tipo=None):
        """Cuenta el total de movimientos de un usuario (para saber si hay más páginas)."""
        async with conexion.get_conn() as conn:
            if tipo:
                val = await conn.fetchval(
                    "SELECT COUNT(*) FROM movimientos WHERE usuario_id = $1 AND tipo = $2",
                    user_id, tipo
                )
            else:
                val = await conn.fetchval(
                    "SELECT COUNT(*) FROM movimientos WHERE usuario_id = $1",
                    user_id
                )
            return val

    async def get_datos_analisis(self, user_id, tipo='egreso'):
        mes_actual = datetime.now().strftime('%Y-%m')
        async with conexion.get_conn() as conn:
            rows_grafico = await conn.fetch(
                "SELECT categoria, SUM(monto) as total FROM movimientos WHERE usuario_id = $1 AND tipo=$2 AND SUBSTR(fecha, 1, 7) = $3 GROUP BY categoria ORDER BY SUM(monto) DESC LIMIT 8",
                user_id, tipo, mes_actual
            )
            grafico = [(r['categoria'], r['total']) for r in rows_grafico]

            rows_detalle = await conn.fetch(
                "SELECT fecha, monto, categoria, descripcion FROM movimientos WHERE usuario_id = $1 AND tipo=$2 AND SUBSTR(fecha, 1, 7) = $3",
                user_id, tipo, mes_actual
            )
            detalle = [(r['fecha'], r['monto'], r['categoria'], r['descripcion']) for r in rows_detalle]
            return grafico, detalle

    async def get_all_user_data(self, user_id):
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT * FROM movimientos WHERE usuario_id = $1", user_id
            )
            # return as tuples para compatibilidad
            return [tuple(r.values()) for r in rows]

    async def get_historial_categoria(self, user_id, categoria, limite=10):
        mes_actual = datetime.now().strftime('%Y-%m')
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT fecha, monto, descripcion FROM movimientos WHERE usuario_id = $1 AND categoria = $2 AND tipo = 'egreso' AND SUBSTR(fecha, 1, 7) = $3 ORDER BY id DESC LIMIT $4",
                user_id, categoria, mes_actual, limite
            )
            return [(r['fecha'], r['monto'], r['descripcion']) for r in rows]

    async def get_categorias_usuario(self, user_id, tipo='egreso'):
        mes_actual = datetime.now().strftime('%Y-%m')
        async with conexion.get_conn() as conn:
            # Categorías usadas este mes
            rows = await conn.fetch(
                "SELECT DISTINCT categoria FROM movimientos WHERE usuario_id = $1 AND tipo = $2 AND SUBSTR(fecha, 1, 7) = $3 ORDER BY categoria",
                user_id, tipo, mes_actual
            )
            usadas = [r['categoria'] for r in rows]

            # Categorías personalizadas guardadas
            await conn.execute(
                "CREATE TABLE IF NOT EXISTS categorias_custom (id SERIAL PRIMARY KEY, usuario_id BIGINT, nombre TEXT, tipo TEXT, UNIQUE(usuario_id, nombre, tipo))"
            )

            rows_custom = await conn.fetch(
                "SELECT nombre FROM categorias_custom WHERE usuario_id = $1 AND tipo = $2 ORDER BY nombre",
                user_id, tipo
            )
            custom = [r['nombre'] for r in rows_custom]

            # Unir sin duplicados
            todas = list(dict.fromkeys(usadas + custom))
            return todas

    async def add_categoria_custom(self, user_id, nombre, tipo='egreso'):
        async with conexion.get_conn() as conn:
            await conn.execute(
                "CREATE TABLE IF NOT EXISTS categorias_custom (id SERIAL PRIMARY KEY, usuario_id BIGINT, nombre TEXT, tipo TEXT, UNIQUE(usuario_id, nombre, tipo))",
            )
            await conn.execute(
                "INSERT INTO categorias_custom (usuario_id, nombre, tipo) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                user_id, nombre.strip().capitalize(), tipo
            )

    async def delete_categoria_custom(self, user_id, nombre, tipo='egreso'):
        async with conexion.get_conn() as conn:
            await conn.execute(
                "DELETE FROM categorias_custom WHERE usuario_id = $1 AND nombre = $2 AND tipo = $3",
                user_id, nombre, tipo
            )

    async def get_comparativo_mensual(self, user_id):
        mes_actual = datetime.now().strftime('%Y-%m')
        hoy = datetime.now()
        if hoy.month == 1:
            mes_anterior = f"{hoy.year - 1}-12"
        else:
            mes_anterior = f"{hoy.year}-{hoy.month - 1:02d}"

        async with conexion.get_conn() as conn:
            val_actual = await conn.fetchval(
                "SELECT COALESCE(SUM(monto), 0) FROM movimientos WHERE tipo='egreso' AND usuario_id = $1 AND SUBSTR(fecha, 1, 7) = $2",
                user_id, mes_actual
            )
            total_actual = val_actual

            val_anterior = await conn.fetchval(
                "SELECT COALESCE(SUM(monto), 0) FROM movimientos WHERE tipo='egreso' AND usuario_id = $1 AND SUBSTR(fecha, 1, 7) = $2",
                user_id, mes_anterior
            )
            total_anterior = val_anterior

            rows_cats_actual = await conn.fetch(
                "SELECT categoria, SUM(monto) as total FROM movimientos WHERE tipo='egreso' AND usuario_id = $1 AND SUBSTR(fecha, 1, 7) = $2 GROUP BY categoria ORDER BY SUM(monto) DESC",
                user_id, mes_actual
            )
            cats_actual = [(r['categoria'], r['total']) for r in rows_cats_actual]

            rows_cats_anterior = await conn.fetch(
                "SELECT categoria, SUM(monto) as total FROM movimientos WHERE tipo='egreso' AND usuario_id = $1 AND SUBSTR(fecha, 1, 7) = $2 GROUP BY categoria ORDER BY SUM(monto) DESC",
                user_id, mes_anterior
            )
            cats_anterior = {r['categoria']: r['total'] for r in rows_cats_anterior}

            return total_actual, total_anterior, cats_actual, cats_anterior, mes_anterior

    async def get_top_gastos(self, user_id, limite=5):
        mes_actual = datetime.now().strftime('%Y-%m')
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT id, descripcion, monto, categoria, fecha FROM movimientos WHERE usuario_id = $1 AND tipo = 'egreso' AND SUBSTR(fecha, 1, 7) = $2 ORDER BY monto DESC LIMIT $3",
                user_id, mes_actual, limite
            )
            return [(r['id'], r['descripcion'], r['monto'], r['categoria'], r['fecha']) for r in rows]

    async def get_racha(self, user_id):
        """Cuenta días consecutivos en los que el usuario registró algo."""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT DISTINCT SUBSTR(fecha, 1, 10) as dia FROM movimientos WHERE usuario_id = $1 ORDER BY dia DESC LIMIT 120",
                user_id
            )
            dias = [r['dia'] for r in rows]

        if not dias:
            return 0

        hoy = datetime.now().strftime('%Y-%m-%d')
        if dias[0] != hoy:
            return 0

        racha = 1
        for i in range(1, len(dias)):
            esperado = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            if dias[i] == esperado:
                racha += 1
            else:
                break
        return racha

    async def get_resumen_semanal(self, user_id):
        """Devuelve ingresos y gastos de los últimos 7 días (optimizado: 2 queries en vez de 4)."""
        hace_7_dias = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        async with conexion.get_conn() as conn:
            # Query combinada: ingresos, gastos y conteo en una sola consulta
            row = await conn.fetchrow(
                """SELECT
                    COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END), 0) as ingresos,
                    COALESCE(SUM(CASE WHEN tipo='egreso' THEN monto ELSE 0 END), 0) as gastos,
                    COUNT(*) as cant
                FROM movimientos WHERE usuario_id = $1 AND fecha >= $2""",
                user_id, hace_7_dias
            )
            ingresos, gastos, cant_movimientos = row['ingresos'], row['gastos'], row['cant']

            rows_top = await conn.fetch(
                "SELECT categoria, SUM(monto) as total FROM movimientos WHERE tipo='egreso' AND usuario_id = $1 AND fecha >= $2 GROUP BY categoria ORDER BY SUM(monto) DESC LIMIT 3",
                user_id, hace_7_dias
            )
            top_cats = [(r['categoria'], r['total']) for r in rows_top]

            return ingresos, gastos, cant_movimientos, top_cats

    async def get_gastos_por_dia(self, user_id):
        """Devuelve gasto total por día del mes actual: [(dia, total), ...]"""
        mes_actual = datetime.now().strftime('%Y-%m')
        async with conexion.get_conn() as conn:
            # PostgreSQL syntax CAST(SUBSTR(...) AS INTEGER)
            # Use CAST(SUBSTRING(fecha FROM 9 FOR 2) AS INTEGER) for better compatibility
            rows = await conn.fetch(
                """SELECT CAST(SUBSTRING(fecha FROM 9 FOR 2) AS INTEGER) as dia, SUM(monto) as total 
                   FROM movimientos WHERE usuario_id = $1 AND tipo = 'egreso' 
                   AND SUBSTRING(fecha FROM 1 FOR 7) = $2 GROUP BY dia ORDER BY dia""",
                user_id, mes_actual
            )
            return [(r['dia'], r['total']) for r in rows]

    async def get_movimientos_semana(self, user_id):
        """Movimientos de los últimos 7 días con detalle."""
        hace_7 = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT fecha, tipo, monto, categoria, descripcion FROM movimientos "
                "WHERE usuario_id = $1 AND fecha >= $2 ORDER BY fecha DESC",
                user_id, hace_7
            )
            return [(r['fecha'], r['tipo'], r['monto'], r['categoria'], r['descripcion']) for r in rows]

    # ── PRESUPUESTOS ──────────────────────────────────────

    async def set_presupuesto(self, user_id, categoria, monto):
        async with conexion.get_conn() as conn:
            await conn.execute(
                "INSERT INTO presupuestos (usuario_id, categoria, monto_maximo) VALUES ($1, $2, $3) ON CONFLICT (usuario_id, categoria) DO UPDATE SET monto_maximo = EXCLUDED.monto_maximo",
                user_id, categoria, monto
            )

    async def borrar_presupuesto(self, user_id, categoria):
        async with conexion.get_conn() as conn:
            res = await conn.execute(
                "DELETE FROM presupuestos WHERE usuario_id = $1 AND categoria = $2",
                user_id, categoria
            )
            _, count = res.split()
            if int(count) == 0:
                raise ValueError(f"No existe presupuesto para {categoria}")

    async def get_presupuestos_estado(self, user_id):
        mes_actual = datetime.now().strftime('%Y-%m')
        async with conexion.get_conn() as conn:
            rows = await conn.fetch("""
                SELECT p.categoria, p.monto_maximo, COALESCE(SUM(m.monto), 0) as gastado
                FROM presupuestos p
                LEFT JOIN movimientos m ON p.usuario_id = m.usuario_id
                     AND p.categoria = m.categoria
                     AND m.tipo = 'egreso'
                     AND SUBSTR(m.fecha, 1, 7) = $1
                WHERE p.usuario_id = $2
                GROUP BY p.categoria, p.monto_maximo
            """, mes_actual, user_id)
            return [(r['categoria'], r['monto_maximo'], r['gastado']) for r in rows]

    async def get_presupuesto_estado(self, user_id, categoria):
        categoria = categoria.capitalize()
        mes_actual = datetime.now().strftime('%Y-%m')
        async with conexion.get_conn() as conn:
            pres = await conn.fetchrow(
                "SELECT monto_maximo FROM presupuestos WHERE usuario_id = $1 AND categoria = $2",
                user_id, categoria
            )
            if not pres:
                return None

            maximo = pres['monto_maximo']

            gastado = await conn.fetchval(
                "SELECT COALESCE(SUM(monto), 0) FROM movimientos WHERE usuario_id = $1 AND categoria = $2 AND tipo = 'egreso' AND SUBSTR(fecha, 1, 7) = $3",
                user_id, categoria, mes_actual
            )

            porcentaje = (gastado / maximo) * 100 if maximo > 0 else 0
            return (categoria, porcentaje, gastado, maximo)

    # ── COTIZACIONES ──────────────────────────────────────

    async def registrar_cotizacion(self, tipo, valor):
        hoy = datetime.now().strftime('%Y-%m-%d')
        async with conexion.get_conn() as conn:
            await conn.execute(
                "INSERT INTO cotizaciones_diarias (fecha, tipo, venta) VALUES ($1, $2, $3) ON CONFLICT (fecha, tipo) DO UPDATE SET venta = EXCLUDED.venta",
                hoy, tipo, valor
            )

    async def get_variacion_dolar(self, tipo, valor_actual):
        """Calcula % de variación respecto al último cierre registrado."""
        hoy = datetime.now().strftime('%Y-%m-%d')
        async with conexion.get_conn() as conn:
            resultado = await conn.fetchval(
                "SELECT venta FROM cotizaciones_diarias WHERE tipo = $1 AND fecha < $2 ORDER BY fecha DESC LIMIT 1",
                tipo, hoy
            )

            if resultado and resultado > 0:
                anterior = resultado
                diff = valor_actual - anterior
                pct = (diff / anterior) * 100

                if abs(pct) < 0.1:
                    return ""
                emoji = "⬆️" if diff > 0 else "⬇️"
                return f" {emoji} {abs(pct):.1f}%"
            return ""

    # ── ANTI-DUPLICADO SUSCRIPCIONES ──────────────────────

    async def ya_cobrado_hoy(self, user_id, nombre_suscripcion):
        """Verifica si una suscripción ya fue cobrada hoy."""
        hoy = datetime.now().strftime('%Y-%m-%d')
        async with conexion.get_conn() as conn:
            cant = await conn.fetchval(
                "SELECT COUNT(*) FROM movimientos WHERE usuario_id = $1 AND descripcion LIKE $2 AND fecha LIKE $3",
                user_id, f"Cobro Automático: {nombre_suscripcion}", f"{hoy}%"
            )
            return cant > 0
            
    # ── MODO CONVIVENCIA ─────────────────────────────────

    async def get_balance_compartido(self, user_id_1, user_id_2, mes_actual):
        """Devuelve (total_1, total_2, diferencia) gastado por completo."""
        async with conexion.get_conn() as conn:
            # Gasto compartido del usuario 1
            total_1 = await conn.fetchval(
                "SELECT COALESCE(SUM(monto), 0) FROM movimientos WHERE tipo='egreso' AND usuario_id = $1 AND es_compartido = True AND SUBSTR(fecha, 1, 7) = $2",
                user_id_1, mes_actual
            )
            
            # Gasto compartido del usuario 2
            total_2 = await conn.fetchval(
                "SELECT COALESCE(SUM(monto), 0) FROM movimientos WHERE tipo='egreso' AND usuario_id = $1 AND es_compartido = True AND SUBSTR(fecha, 1, 7) = $2",
                user_id_2, mes_actual
            )
            
            # Quien tiene más aportes se le debe dinero
            mitad = (total_1 + total_2) / 2
            
            return (total_1, total_2, mitad)

# --- Alineación Pivot Web ---

async def registrar_movimiento_web(usuario_id: int, tipo: str, monto: float, categoria: str, descripcion: str = "", currency: str = "ARS"):
    """Registra un movimiento desde la web."""
    from db import db
    # Mapeamos 'gasto' -> 'egreso' para compatibilidad con la BD existente
    tipo_bd = 'egreso' if tipo == 'gasto' else 'ingreso'
    return await db.movimientos.agregar(usuario_id, tipo_bd, monto, categoria, descripcion, currency)

async def obtener_movimientos_web(usuario_id: int):
    """Obtiene movimientos en el formato exacto que espera el React de Manguito."""
    from db import db
    rows = await db.movimientos.get_ultimos_movimientos_con_id(usuario_id, limite=50)
    movimientos = []
    for r in rows:
        # r = (id, descripcion, monto, tipo, categoria, fecha, moneda)
        movimientos.append({
            "id": r[0],
            "type": "gasto" if r[2] > 0 and r[3] == 'egreso' else "ingreso",
            "amount": float(r[2]),
            "category": r[4],
            "description": r[1],
            "date": r[5],
            "currency": r[6]
        })
    return movimientos
