"""
db/repo_inversiones.py — Repositorio de inversiones/portafolio.

CRUD de la tabla `inversiones`: activos del usuario
(Criptos, CEDEARs, Acciones, Bonos, Monedas).
"""

import logging
from db.conexion import conexion

logger = logging.getLogger('Manguito-DB')


class RepoInversiones:
    """Operaciones CRUD sobre el portafolio de inversiones."""

    def __init__(self):
        pass

    async def agregar(self, user_id, tipo, ticker, cantidad):
        """
        Agrega un activo al portafolio.
        Si ya existe (mismo tipo+ticker), SUMA la cantidad (UPSERT).
        Retorna el ID.
        """
        async with conexion.get_conn() as conn:
            inv_id = await conn.fetchval(
                """INSERT INTO inversiones (usuario_id, tipo, ticker, cantidad)
                   VALUES ($1, $2, $3, $4)
                   ON CONFLICT (usuario_id, tipo, ticker)
                   DO UPDATE SET cantidad = inversiones.cantidad + EXCLUDED.cantidad
                   RETURNING id""",
                user_id, tipo, ticker.upper(), cantidad
            )
            return inv_id

    async def get_del_usuario(self, user_id):
        """Retorna los activos del usuario: [(id, tipo, ticker, cantidad), ...]"""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT id, tipo, ticker, cantidad FROM inversiones WHERE usuario_id = $1 ORDER BY tipo, ticker",
                user_id
            )
            return [(r['id'], r['tipo'], r['ticker'], r['cantidad']) for r in rows]

    async def get_por_id(self, user_id, inversion_id):
        """Retorna un activo: (id, tipo, ticker, cantidad) o None."""
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT id, tipo, ticker, cantidad FROM inversiones WHERE id = $1 AND usuario_id = $2",
                inversion_id, user_id
            )
            if row:
                return (row['id'], row['tipo'], row['ticker'], row['cantidad'])
            return None

    async def actualizar_cantidad(self, user_id, inversion_id, nueva_cantidad):
        """Actualiza la cantidad de un activo. Si es 0 o menos, lo borra."""
        async with conexion.get_conn() as conn:
            if nueva_cantidad <= 0:
                await conn.execute(
                    "DELETE FROM inversiones WHERE id = $1 AND usuario_id = $2",
                    inversion_id, user_id
                )
            else:
                await conn.execute(
                    "UPDATE inversiones SET cantidad = $1 WHERE id = $2 AND usuario_id = $3",
                    nueva_cantidad, inversion_id, user_id
                )

    async def borrar(self, user_id, inversion_id):
        """Borra un activo. Retorna (tipo, ticker) si existía, None si no."""
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT tipo, ticker FROM inversiones WHERE id = $1 AND usuario_id = $2",
                inversion_id, user_id
            )
            if row:
                await conn.execute(
                    "DELETE FROM inversiones WHERE id = $1 AND usuario_id = $2",
                    inversion_id, user_id
                )
                return (row['tipo'], row['ticker'])
            return None
