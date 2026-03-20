"""
db/repo_suscripciones.py — Repositorio de suscripciones/gastos fijos.

Maneja la tabla `suscripciones`.
"""

import logging
from db.conexion import conexion

logger = logging.getLogger('Manguito-DB')


class RepoSuscripciones:
    """Operaciones CRUD sobre suscripciones recurrentes."""

    def __init__(self):
        pass

    async def agregar(self, user_id, nombre, monto, dia_cobro, categoria="Suscripciones", frecuencia="mensual"):
        async with conexion.get_conn() as conn:
            await conn.execute(
                "INSERT INTO suscripciones (usuario_id, nombre, monto, dia_cobro, categoria, frecuencia) VALUES ($1, $2, $3, $4, $5, $6)",
                user_id, nombre, monto, dia_cobro, categoria, frecuencia
            )

    async def get_del_usuario(self, user_id):
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT id, nombre, monto, dia_cobro, categoria, frecuencia FROM suscripciones WHERE usuario_id = $1",
                user_id
            )
            return [(r['id'], r['nombre'], r['monto'], r['dia_cobro'], r['categoria'], r['frecuencia']) for r in rows]

    async def borrar(self, user_id, suscripcion_id):
        async with conexion.get_conn() as conn:
            await conn.execute(
                "DELETE FROM suscripciones WHERE id = $1 AND usuario_id = $2",
                suscripcion_id, user_id
            )

    async def get_del_dia(self, dia_hoy):
        """Obtiene suscripciones mensuales que cobran hoy."""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT usuario_id, nombre, monto, categoria FROM suscripciones WHERE dia_cobro = $1 AND (frecuencia = 'mensual' OR frecuencia IS NULL)",
                dia_hoy
            )
            return [(r['usuario_id'], r['nombre'], r['monto'], r['categoria']) for r in rows]

    async def get_diarias(self):
        """Obtiene suscripciones con frecuencia diaria."""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT usuario_id, nombre, monto, categoria FROM suscripciones WHERE frecuencia = 'diario'"
            )
            return [(r['usuario_id'], r['nombre'], r['monto'], r['categoria']) for r in rows]

    async def get_semanales(self, dia_semana):
        """Obtiene suscripciones semanales que cobran en este día de la semana (0=lunes)."""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT usuario_id, nombre, monto, categoria FROM suscripciones WHERE frecuencia = 'semanal' AND dia_cobro = $1",
                dia_semana
            )
            return [(r['usuario_id'], r['nombre'], r['monto'], r['categoria']) for r in rows]

    async def get_anuales(self, mes, dia):
        """Obtiene suscripciones anuales que cobran en este mes/día."""
        # Para anuales en la app actual: dia_cobro guarda el día de registro, por lo que usamos este valor. Esta función actualmente usaba = $1 con el día.
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT usuario_id, nombre, monto, categoria FROM suscripciones WHERE frecuencia = 'anual' AND dia_cobro = $1",
                dia
            )
            return [(r['usuario_id'], r['nombre'], r['monto'], r['categoria']) for r in rows]
