import logging
import os
import re
import asyncio
from contextlib import asynccontextmanager

# Driver imports
try:
    import asyncpg
except ImportError:
    asyncpg = None

try:
    import aiosqlite
except ImportError:
    aiosqlite = None

from core.config import config

logger = logging.getLogger('Manguito-DB')

class Conexion:
    """Gestiona conexiones a PostgreSQL (asyncpg) o SQLite (aiosqlite)."""

    def __init__(self):
        self.database_url = config.DATABASE_URL
        self.db_path = config.DB_PATH
        self.is_postgres = bool(self.database_url and self.database_url.startswith(("postgres://", "postgresql://")))
        self._pools = {}  # Para asyncpg (Postgres)
        self._sqlite_conn = None  # Para aiosqlite (SQLite)
        
        if self.is_postgres:
            logger.info("Modo DB: PostgreSQL (asyncpg)")
            if not asyncpg:
                logger.error("asyncpg no está instalado. Instalá 'asyncpg'.")
        else:
            logger.info(f"Modo DB: SQLite (aiosqlite) -> {os.path.basename(self.db_path)}")
            if not aiosqlite:
                logger.error("aiosqlite no está instalado. Instalá 'aiosqlite'.")

    def _translate_query(self, query: str) -> str:
        """Traduce la sintaxis de parámetros $1, $2... a ? para SQLite."""
        if not self.is_postgres:
            return re.sub(r'\$\d+', '?', query)
        return query

    async def init_pool(self):
        """Inicializa el pool (Postgres) o la conexión (SQLite)."""
        if self.is_postgres:
            loop = asyncio.get_running_loop()
            if loop not in self._pools:
                self._pools[loop] = await asyncpg.create_pool(
                    self.database_url,
                    min_size=1,
                    max_size=10
                )
            return self._pools[loop]
        return None

    @asynccontextmanager
    async def get_conn(self):
        """Context manager para obtener una conexión activa."""
        if self.is_postgres:
            pool = self._pools.get(asyncio.get_running_loop())
            if not pool:
                pool = await self.init_pool()
            async with pool.acquire() as conn:
                yield conn
        else:
            # En SQLite usamos una sola conexión por simpleza o abrimos/cerramos
            async with aiosqlite.connect(self.db_path) as conn:
                conn.row_factory = aiosqlite.Row
                yield conn

    async def execute(self, query: str, *args):
        query = self._translate_query(query)
        async with self.get_conn() as conn:
            if self.is_postgres:
                return await conn.execute(query, *args)
            else:
                await conn.execute(query, args)
                await conn.commit()

    async def fetch(self, query: str, *args):
        query = self._translate_query(query)
        async with self.get_conn() as conn:
            if self.is_postgres:
                return await conn.fetch(query, *args)
            else:
                async with conn.execute(query, args) as cursor:
                    return await cursor.fetchall()

    async def fetchrow(self, query: str, *args):
        query = self._translate_query(query)
        async with self.get_conn() as conn:
            if self.is_postgres:
                return await conn.fetchrow(query, *args)
            else:
                async with conn.execute(query, args) as cursor:
                    return await cursor.fetchone()

    async def fetchval(self, query: str, *args):
        query = self._translate_query(query)
        async with self.get_conn() as conn:
            if self.is_postgres:
                return await conn.fetchval(query, *args)
            else:
                async with conn.execute(query, args) as cursor:
                    row = await cursor.fetchone()
                    return row[0] if row else None

    async def init_db(self):
        """Inicializa las tablas necesarias."""
        if self.is_postgres:
            await self.init_pool()
        
        # Las queries de CREATE TABLE suelen ser compatibles o necesitan pequeños ajustes
        # PostgreSQL usa SERIAL, SQLite usa AUTOINCREMENT. Usamos una sintaxis compatible.
        
        # Definición de esquema unificado
        queries = [
            '''CREATE TABLE IF NOT EXISTS movimientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT if not exists, 
                usuario_id BIGINT, fecha TEXT, tipo TEXT, monto REAL, 
                categoria TEXT, descripcion TEXT, es_compartido BOOLEAN DEFAULT FALSE,
                moneda TEXT DEFAULT 'ARS')''' if not self.is_postgres else 
            '''CREATE TABLE IF NOT EXISTS movimientos (
                id SERIAL PRIMARY KEY, usuario_id BIGINT, fecha TEXT, 
                tipo TEXT, monto REAL, categoria TEXT, descripcion TEXT, 
                es_compartido BOOLEAN DEFAULT FALSE, moneda TEXT DEFAULT 'ARS')''',
                
            '''CREATE TABLE IF NOT EXISTS usuarios (
                usuario_id BIGINT PRIMARY KEY, nombre TEXT, username TEXT, 
                ultima_actividad TEXT, pareja_id BIGINT DEFAULT NULL, 
                apodo TEXT DEFAULT NULL, moneda_principal TEXT DEFAULT 'ARS',
                notificaciones_activas INTEGER DEFAULT 1, email TEXT UNIQUE,
                password_hash TEXT, auth_provider TEXT DEFAULT 'manual', picture TEXT)''',
                
            '''CREATE TABLE IF NOT EXISTS web_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT if not exists, 
                usuario_id BIGINT NOT NULL UNIQUE, email TEXT UNIQUE, 
                password_hash TEXT, google_id TEXT UNIQUE, nombre TEXT, 
                creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''' if not self.is_postgres else
            '''CREATE TABLE IF NOT EXISTS web_users (
                id SERIAL PRIMARY KEY, usuario_id BIGINT NOT NULL UNIQUE, 
                email TEXT UNIQUE, password_hash TEXT, google_id TEXT UNIQUE, 
                nombre TEXT, creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'''
        ]
        
        async with self.get_conn() as conn:
            for q in queries:
                if self.is_postgres:
                    await conn.execute(q)
                else:
                    await conn.execute(q)
                    await conn.commit()

        logger.info("Base de datos (Dual-Mode) inicializada.")

# Singleton
conexion = Conexion()
