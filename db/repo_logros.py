"""
db/repo_logros.py — Repositorio para la gamificación.

Operaciones para la tabla `logros_usuario`.
"""

import logging
import asyncpg
from db.conexion import conexion

logger = logging.getLogger('Manguito-DB')


class RepoLogros:
    """Operaciones de obtención y registro de logros."""

    def __init__(self):
        pass

    async def tiene_logro(self, user_id: int, logro_id: str) -> bool:
        """Verifica si el usuario ya desbloqueó un logro específico."""
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT 1 FROM logros_usuario WHERE usuario_id = $1 AND logro_id = $2",
                user_id, logro_id
            )
            return bool(row)

    async def otorgar_logro(self, user_id: int, logro_id: str) -> bool:
        """
        Otorga un logro al usuario.
        Retorna True si fue insertado, False si ya lo tenía.
        """
        async with conexion.get_conn() as conn:
            try:
                await conn.execute(
                    "INSERT INTO logros_usuario (usuario_id, logro_id) VALUES ($1, $2)",
                    user_id, logro_id
                )
                return True
            except asyncpg.exceptions.UniqueViolationError:
                # El UNIQUE(usuario_id, logro_id) evita duplicados
                return False

    async def get_logros(self, user_id: int) -> list:
        """Retorna todos los IDs de los logros desbloqueados por el usuario, ordenados por fecha."""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT logro_id, fecha FROM logros_usuario WHERE usuario_id = $1 ORDER BY fecha DESC",
                user_id
            )
            return [(r['logro_id'], r['fecha']) for r in rows]
