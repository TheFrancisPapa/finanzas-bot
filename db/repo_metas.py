"""
db/repo_metas.py — Repositorio de metas de ahorro.

CRUD de la tabla `metas_ahorro`.
"""

import logging
from db.conexion import conexion

logger = logging.getLogger('Manguito-DB')


class RepoMetas:
    """Operaciones CRUD sobre metas de ahorro."""

    def __init__(self):
        pass

    async def crear(self, user_id, nombre, objetivo):
        """Crea una nueva meta de ahorro. Retorna el ID de la meta."""
        async with conexion.get_conn() as conn:
            meta_id = await conn.fetchval(
                "INSERT INTO metas_ahorro (usuario_id, nombre, objetivo) VALUES ($1, $2, $3) RETURNING id",
                user_id, nombre, objetivo
            )
            return meta_id

    async def get_metas(self, user_id):
        """Retorna todas las metas del usuario: [(id, nombre, objetivo, actual), ...]"""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT id, nombre, objetivo, actual FROM metas_ahorro WHERE usuario_id = $1 ORDER BY id",
                user_id
            )
            return [(r['id'], r['nombre'], r['objetivo'], r['actual']) for r in rows]

    async def get_meta_por_id(self, user_id, meta_id):
        """Retorna una meta específica: (id, nombre, objetivo, actual) o None."""
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT id, nombre, objetivo, actual FROM metas_ahorro WHERE id = $1 AND usuario_id = $2",
                meta_id, user_id
            )
            if row:
                return (row['id'], row['nombre'], row['objetivo'], row['actual'])
            return None

    async def aportar(self, user_id, meta_id, monto):
        """
        Suma un monto al ahorro actual de la meta.
        Retorna (nombre, actual_nuevo, objetivo) o None si no existe.
        """
        async with conexion.get_conn() as conn:
            meta = await conn.fetchrow(
                "SELECT nombre, actual, objetivo FROM metas_ahorro WHERE id = $1 AND usuario_id = $2",
                meta_id, user_id
            )
            if not meta:
                return None

            nombre, actual, objetivo = meta['nombre'], meta['actual'], meta['objetivo']
            nuevo_actual = actual + monto

            await conn.execute(
                "UPDATE metas_ahorro SET actual = $1 WHERE id = $2 AND usuario_id = $3",
                nuevo_actual, meta_id, user_id
            )
            return (nombre, nuevo_actual, objetivo)

    async def borrar(self, user_id, meta_id):
        """Borra una meta. Retorna el nombre si existía, None si no."""
        async with conexion.get_conn() as conn:
            meta = await conn.fetchrow(
                "SELECT nombre FROM metas_ahorro WHERE id = $1 AND usuario_id = $2",
                meta_id, user_id
            )
            if meta:
                await conn.execute(
                    "DELETE FROM metas_ahorro WHERE id = $1 AND usuario_id = $2",
                    meta_id, user_id
                )
                return meta['nombre']
            return None
