"""
db/ — Paquete de acceso a datos (Patrón Repository).

Uso:
    from db import db
    await db.init_db()
    await db.movimientos.agregar(user_id, ...)
    await db.usuarios.registrar(user_id, ...)
    await db.suscripciones.agregar(user_id, ...)
"""

__all__ = ["db"]