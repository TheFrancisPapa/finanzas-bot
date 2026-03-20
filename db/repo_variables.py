"""
db/repo_variables.py — Repositorio de servicios variables (recordatorios).

CRUD de la tabla `servicios_variables`: servicios que vencen un día fijo
pero cuyo monto varía cada mes (ej: luz, gas, tarjeta).
"""

import logging
from db.conexion import conexion

logger = logging.getLogger('Manguito-DB')


class RepoVariables:
    """Operaciones CRUD sobre servicios variables."""

    def __init__(self):
        pass

    async def agregar(self, user_id, nombre, dia_vencimiento, categoria):
        """Crea un nuevo recordatorio de servicio variable. Retorna el ID."""
        async with conexion.get_conn() as conn:
            serv_id = await conn.fetchval(
                "INSERT INTO servicios_variables (usuario_id, nombre, dia_vencimiento, categoria) VALUES ($1, $2, $3, $4) RETURNING id",
                user_id, nombre, dia_vencimiento, categoria
            )
            return serv_id

    async def get_del_usuario(self, user_id):
        """Retorna los servicios variables del usuario: [(id, nombre, dia, categoria), ...]"""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT id, nombre, dia_vencimiento, categoria FROM servicios_variables WHERE usuario_id = $1 ORDER BY dia_vencimiento",
                user_id
            )
            return [(r['id'], r['nombre'], r['dia_vencimiento'], r['categoria']) for r in rows]

    async def get_del_dia(self, dia_hoy):
        """Retorna servicios que vencen hoy: [(usuario_id, id, nombre, categoria), ...]"""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT usuario_id, id, nombre, categoria FROM servicios_variables WHERE dia_vencimiento = $1",
                dia_hoy
            )
            return [(r['usuario_id'], r['id'], r['nombre'], r['categoria']) for r in rows]

    async def get_por_id(self, user_id, servicio_id):
        """Retorna un servicio específico: (id, nombre, dia, categoria) o None."""
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT id, nombre, dia_vencimiento, categoria FROM servicios_variables WHERE id = $1 AND usuario_id = $2",
                servicio_id, user_id
            )
            if row:
                return (row['id'], row['nombre'], row['dia_vencimiento'], row['categoria'])
            return None

    async def borrar(self, user_id, servicio_id):
        """Borra un servicio. Retorna el nombre si existía, None si no."""
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT nombre FROM servicios_variables WHERE id = $1 AND usuario_id = $2",
                servicio_id, user_id
            )
            if row:
                await conn.execute(
                    "DELETE FROM servicios_variables WHERE id = $1 AND usuario_id = $2",
                    servicio_id, user_id
                )
                return row['nombre']
            return None
