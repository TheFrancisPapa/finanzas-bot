"""
db/repo_categorias.py — Repositorio de categorías personalizadas por usuario.

Permite que cada usuario tenga sus propias categorías en vez de usar las hardcodeadas.
Si el usuario no tiene categorías propias, se usan las default.
"""

import asyncpg
from db.conexion import conexion

# Categorías default (se insertan la primera vez)
CATEGORIAS_DEFAULT = [
    ('Comida', '🍔'),
    ('Transporte', '🚌'),
    ('Supermercado', '🛒'),
    ('Ocio', '🎮'),
    ('Servicios', '📡'),
    ('Salud', '🏥'),
    ('Educación', '🎓'),
    ('Ropa', '👕'),
    ('Suscripciones', '🔄'),
    ('Varios', '📦'),
]


class RepoCategorias:
    def __init__(self):
        pass

    async def get_categorias(self, user_id):
        """
        Devuelve las categorías del usuario como lista de (nombre, emoji).
        Si no tiene ninguna, inserta las default primero.
        """
        async with conexion.get_conn() as conn:
            rows = await conn.fetch(
                "SELECT nombre, emoji FROM categorias_usuario WHERE usuario_id = $1 ORDER BY orden, id",
                user_id
            )

            if not rows:
                # Primera vez: insertar defaults
                for i, (nombre, emoji) in enumerate(CATEGORIAS_DEFAULT):
                    await conn.execute(
                        "INSERT INTO categorias_usuario (usuario_id, nombre, emoji, orden) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
                        user_id, nombre, emoji, i
                    )
                return list(CATEGORIAS_DEFAULT)

            return [(row['nombre'], row['emoji']) for row in rows]

    async def agregar_categoria(self, user_id, nombre, emoji='📌'):
        """Agrega una categoría personalizada. Retorna True si se agregó."""
        async with conexion.get_conn() as conn:
            try:
                # Obtener el orden más alto + 1
                nuevo_orden = await conn.fetchval(
                    "SELECT COALESCE(MAX(orden), 0) + 1 FROM categorias_usuario WHERE usuario_id = $1",
                    user_id
                )

                await conn.execute(
                    "INSERT INTO categorias_usuario (usuario_id, nombre, emoji, orden) VALUES ($1, $2, $3, $4)",
                    user_id, nombre.strip(), emoji, nuevo_orden
                )
                return True
            except asyncpg.exceptions.UniqueViolationError:
                return False  # Ya existe

    async def borrar_categoria(self, user_id, nombre):
        """Borra una categoría del usuario. Retorna True si se borró."""
        async with conexion.get_conn() as conn:
            res = await conn.execute(
                "DELETE FROM categorias_usuario WHERE usuario_id = $1 AND nombre = $2",
                user_id, nombre.strip()
            )
            # res format is something like "DELETE 0" or "DELETE 1"
            _, count = res.split()
            return int(count) > 0

    async def get_emojis_dict(self, user_id):
        """Retorna un dict {nombre: emoji} para el usuario."""
        categorias = await self.get_categorias(user_id)
        return {nombre: emoji for nombre, emoji in categorias}
