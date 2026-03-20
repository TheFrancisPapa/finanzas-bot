"""
db/repo_reglas.py — Repositorio de reglas de categorización automática.

Permite al bot "aprender" patrones: si el usuario registra
"panadería" como "Comida", la próxima vez se asigna automáticamente
sin llamar a Gemini (Modo Flash ⚡).
"""

import logging
from db.conexion import conexion

logger = logging.getLogger('Manguito-DB')


class RepoReglas:
    """Operaciones sobre reglas de categorización automática."""

    def __init__(self):
        pass

    async def agregar(self, user_id, patron, categoria):
        """
        Agrega una nueva regla. Si ya existe el patrón para ese usuario,
        actualiza la categoría (UPSERT).
        """
        async with conexion.get_conn() as conn:
            await conn.execute(
                """INSERT INTO reglas_categorias (usuario_id, patron, categoria)
                   VALUES ($1, $2, $3)
                   ON CONFLICT (usuario_id, patron) DO UPDATE SET categoria = EXCLUDED.categoria""",
                user_id, patron.lower(), categoria
            )

    async def buscar_patron(self, user_id, texto):
        """
        Busca si alguna regla del usuario coincide con el texto.
        Busca patrones que estén contenidos EN el texto del usuario.
        Retorna la categoría si hay match, None si no.
        Prioriza el patrón más largo (más específico).
        """
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT patron, categoria FROM reglas_categorias WHERE usuario_id = $1 ORDER BY LENGTH(patron) DESC",
                user_id
            )

        texto_lower = texto.lower()
        for r in rows:
            patron, categoria = r['patron'], r['categoria']
            if patron in texto_lower:
                return categoria
        return None

    async def get_reglas(self, user_id):
        """Retorna todas las reglas del usuario: [(id, patron, categoria), ...]"""
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT id, patron, categoria FROM reglas_categorias WHERE usuario_id = $1 ORDER BY categoria, patron",
                user_id
            )
            return [(r['id'], r['patron'], r['categoria']) for r in rows]

    async def borrar(self, user_id, regla_id):
        """Borra una regla. Retorna True si existía."""
        async with conexion.get_conn() as conn:
            row = await conn.fetchrow(
                "SELECT patron FROM reglas_categorias WHERE id = $1 AND usuario_id = $2",
                regla_id, user_id
            )
            if row:
                await conn.execute(
                    "DELETE FROM reglas_categorias WHERE id = $1 AND usuario_id = $2",
                    regla_id, user_id
                )
                return row['patron']
            return None

    async def borrar_todas(self, user_id):
        """Borra TODAS las reglas del usuario. Retorna cantidad borrada."""
        async with conexion.get_conn() as conn:
            res = await conn.execute(
                "DELETE FROM reglas_categorias WHERE usuario_id = $1",
                user_id
            )
            _, count = res.split()
            return int(count)
