"""
db/conexion.py — Conexión a PostgreSQL y creación de tablas.

Responsabilidad única: manejar el ciclo de vida de la conexión
y la inicialización del esquema usando asyncpg.
"""

import logging
import asyncpg
from contextlib import asynccontextmanager

from core.config import config

logger = logging.getLogger('Manguito-DB')


class Conexion:
    """Gestiona el pool de conexiones async a PostgreSQL."""

    def __init__(self):
        self.database_url = config.DATABASE_URL
        if not self.database_url:
            raise ValueError("DATABASE_URL no está configurada")
        self._pools = {}
        logger.info("Usando PostgreSQL (asyncpg) con multi-loop pool support")

    async def init_pool(self):
        """Inicializa el pool de conexiones para el event loop actual."""
        import asyncio
        loop = asyncio.get_running_loop()
        if loop not in self._pools:
            self._pools[loop] = await asyncpg.create_pool(
                self.database_url,
                min_size=1,
                max_size=10,
                command_timeout=60,
            )
        return self._pools[loop]

    async def close_pool(self):
        """Cierra el pool del event loop actual."""
        import asyncio
        try:
            loop = asyncio.get_running_loop()
            if loop in self._pools:
                await self._pools[loop].close()
                del self._pools[loop]
        except RuntimeError:
            pass

    @asynccontextmanager
    async def get_conn(self):
        """Context manager para obtener una conexión del pool de este loop."""
        import asyncio
        loop = asyncio.get_running_loop()
        pool = self._pools.get(loop)
        if not pool:
            pool = await self.init_pool()
        async with pool.acquire() as conn:
            yield conn

    async def execute(self, query: str, *args):
        """Helper para ejecutar queries sin retorno esperado."""
        async with self.get_conn() as conn:
            return await conn.execute(query, *args)

    async def fetch(self, query: str, *args):
        """Helper para hacer fetch de múltiples filas."""
        async with self.get_conn() as conn:
            return await conn.fetch(query, *args)

    async def fetchrow(self, query: str, *args):
        """Helper para hacer fetch de una sola fila."""
        async with self.get_conn() as conn:
            return await conn.fetchrow(query, *args)

    async def fetchval(self, query: str, *args):
        """Helper para obtener un valor escalar."""
        async with self.get_conn() as conn:
            return await conn.fetchval(query, *args)

    async def init_db(self):
        """Crea las tablas si no existen. Debe llamarse una vez al iniciar."""
        await self.init_pool()
        async with self.get_conn() as conn:
            await conn.execute('''CREATE TABLE IF NOT EXISTS movimientos
                             (id SERIAL PRIMARY KEY, usuario_id BIGINT, fecha TEXT,
                              tipo TEXT, monto REAL, categoria TEXT, descripcion TEXT,
                              es_compartido BOOLEAN DEFAULT FALSE)''')

            await conn.execute('''CREATE TABLE IF NOT EXISTS presupuestos
                             (usuario_id BIGINT, categoria TEXT, monto_maximo REAL,
                              PRIMARY KEY (usuario_id, categoria))''')

            await conn.execute('''CREATE TABLE IF NOT EXISTS suscripciones
                             (id SERIAL PRIMARY KEY, usuario_id BIGINT, nombre TEXT,
                              monto REAL, dia_cobro INTEGER, categoria TEXT,
                              frecuencia TEXT DEFAULT 'mensual')''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS feedback (
                    id SERIAL PRIMARY KEY,
                    usuario_id BIGINT,
                    fecha TEXT,
                    mensaje TEXT
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS cotizaciones_diarias (
                    fecha TEXT,
                    tipo TEXT,
                    venta REAL,
                    PRIMARY KEY (fecha, tipo)
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS usuarios_pro (
                    usuario_id BIGINT PRIMARY KEY,
                    plan TEXT DEFAULT 'free',
                    fecha_inicio TEXT,
                    fecha_vencimiento TEXT,
                    tip_index INTEGER DEFAULT 0
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS usuarios (
                    usuario_id BIGINT PRIMARY KEY,
                    nombre TEXT,
                    username TEXT,
                    ultima_actividad TEXT,
                    pareja_id BIGINT DEFAULT NULL,
                    apodo TEXT DEFAULT NULL,
                    moneda_principal TEXT DEFAULT 'ARS',
                    notificaciones_activas INTEGER DEFAULT 1
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS usos_ia_diarios (
                    usuario_id BIGINT,
                    fecha TEXT,
                    cantidad INTEGER,
                    PRIMARY KEY (usuario_id, fecha)
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS metas_ahorro (
                    id SERIAL PRIMARY KEY,
                    usuario_id BIGINT,
                    nombre TEXT,
                    objetivo REAL,
                    actual REAL DEFAULT 0
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS servicios_variables (
                    id SERIAL PRIMARY KEY,
                    usuario_id BIGINT,
                    nombre TEXT,
                    dia_vencimiento INTEGER,
                    categoria TEXT
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS reglas_categorias (
                    id SERIAL PRIMARY KEY,
                    usuario_id BIGINT,
                    patron TEXT,
                    categoria TEXT,
                    UNIQUE(usuario_id, patron)
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS inversiones (
                    id SERIAL PRIMARY KEY,
                    usuario_id BIGINT,
                    tipo TEXT,
                    ticker TEXT,
                    cantidad REAL,
                    UNIQUE(usuario_id, tipo, ticker)
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS logros_usuario (
                    id SERIAL PRIMARY KEY,
                    usuario_id BIGINT,
                    logro_id TEXT,
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(usuario_id, logro_id)
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS compras_cuotas (
                    id SERIAL PRIMARY KEY,
                    usuario_id BIGINT,
                    descripcion TEXT,
                    categoria TEXT,
                    monto_cuota REAL,
                    cuotas_totales INTEGER,
                    cuotas_pagadas INTEGER
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS categorias_usuario (
                    id SERIAL PRIMARY KEY,
                    usuario_id BIGINT,
                    nombre TEXT,
                    emoji TEXT DEFAULT '📌',
                    orden INTEGER DEFAULT 0,
                    UNIQUE(usuario_id, nombre)
                )
            ''')

            # Tabla usuarios web
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS web_users (
                    id SERIAL PRIMARY KEY,
                    usuario_id BIGINT NOT NULL UNIQUE,
                    email TEXT UNIQUE,
                    password_hash TEXT,
                    google_id TEXT UNIQUE,
                    nombre TEXT,
                    edad INTEGER,
                    objetivo TEXT,
                    telegram_user_id BIGINT UNIQUE,
                    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # ÍNDICES
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_mov_usuario ON movimientos(usuario_id)")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_mov_usuario_tipo_fecha ON movimientos(usuario_id, tipo, fecha)")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_mov_usuario_cat ON movimientos(usuario_id, categoria)")

        logger.info("Base de datos inicializada correctamente.")

    def backup_db(self, path_destino):
        """No aplica con Postgres (usar pg_dump local o de plataforma)."""
        logger.warning("backup_db no se usa con PostgreSQL en Render.")
        return False


# Singleton de conexión
conexion = Conexion()
