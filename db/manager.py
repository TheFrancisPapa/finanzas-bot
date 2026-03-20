import psycopg2
from psycopg2.extras import RealDictCursor
from core.config import config

def obtener_conexion():
    """Crea una conexión a la base de datos PostgreSQL de Render."""
    if not config.DATABASE_URL:
        raise ValueError("Falta la variable DATABASE_URL en Render.")
    
    # Render a veces usa 'postgres://', psycopg2 prefiere 'postgresql://'
    db_url = config.DATABASE_URL.replace("postgres://", "postgresql://")
    return psycopg2.connect(db_url)

def inicializar_bd():
    """Crea las tablas en PostgreSQL si no existen."""
    print("🥭 Manguito: Verificando tablas en PostgreSQL...")
    with obtener_conexion() as conn:
        with conn.cursor() as cursor:
            # 1. Tabla de Usuarios
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS usuarios (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    password_hash VARCHAR(255),
                    auth_provider VARCHAR(50) DEFAULT 'manual',
                    picture TEXT,
                    telegram_id BIGINT UNIQUE,
                    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 2. Tabla de Movimientos (Gastos e Ingresos)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS gastos (
                    id SERIAL PRIMARY KEY,
                    usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
                    monto REAL NOT NULL,
                    categoria VARCHAR(100) NOT NULL,
                    descripcion TEXT,
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    currency VARCHAR(10) DEFAULT 'ARS'
                )
            ''')

            # 3. Tabla de Presupuestos y Metas
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS metas_presupuestos (
                    id SERIAL PRIMARY KEY,
                    usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
                    tipo VARCHAR(50) CHECK(tipo IN ('presupuesto', 'meta')),
                    nombre VARCHAR(255) NOT NULL,
                    monto_objetivo REAL NOT NULL,
                    monto_actual REAL DEFAULT 0,
                    currency VARCHAR(10) DEFAULT 'ARS',
                    icon VARCHAR(10) DEFAULT '🎯'
                )
            ''')
        conn.commit()
    print("✅ Tablas de PostgreSQL listas y operativas.")