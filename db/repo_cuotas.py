"""
db/repo_cuotas.py — Repositorio para compras en cuotas.
"""

from db.conexion import conexion

class RepoCuotas:
    def __init__(self):
        pass

    async def agregar_compra(self, user_id: int, descripcion: str, categoria: str, monto_cuota: float, cuotas_totales: int, cuotas_pagadas: int = 1):
        """Agrega una nueva compra en cuotas y devuelve el ID insertado."""
        async with conexion.get_conn() as conn:
            compra_id = await conn.fetchval(
                '''INSERT INTO compras_cuotas 
                   (usuario_id, descripcion, categoria, monto_cuota, cuotas_totales, cuotas_pagadas) 
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING id''',
                user_id, descripcion, categoria, monto_cuota, cuotas_totales, cuotas_pagadas
            )
            return compra_id

    async def get_compras_activas(self):
        """Devuelve todas las compras en cuotas de todos los usuarios donde pagadas < totales."""
        async with conexion.get_conn() as conn:
            return await conn.fetch(
                '''SELECT id, usuario_id, descripcion, categoria, monto_cuota, cuotas_totales, cuotas_pagadas 
                   FROM compras_cuotas 
                   WHERE cuotas_pagadas < cuotas_totales'''
            )
            
    async def get_compras_usuario(self, user_id: int):
        """Devuelve las compras en cuotas (activas e inactivas) de un usuario."""
        async with conexion.get_conn() as conn:
            return await conn.fetch(
                '''SELECT id, descripcion, categoria, monto_cuota, cuotas_totales, cuotas_pagadas 
                   FROM compras_cuotas 
                   WHERE usuario_id = $1 ORDER BY id DESC''',
                user_id
            )

    async def sumar_cuota(self, compra_id: int):
        """Suma 1 a la cantidad de cuotas pagadas."""
        async with conexion.get_conn() as conn:
            await conn.execute(
                "UPDATE compras_cuotas SET cuotas_pagadas = cuotas_pagadas + 1 WHERE id = $1",
                compra_id
            )
