import psycopg2
from psycopg2.extras import RealDictCursor
from core.config import config

def obtener_conexion():
    """Crea una conexión a la base de datos PostgreSQL de Render."""
    if not config.DATABASE_URL:
        raise ValueError("Falta la variable DATABASE_URL en Render.")
    
    db_url = config.DATABASE_URL.replace("postgres://", "postgresql://")
    return psycopg2.connect(db_url)

def inicializar_bd():
    """Crea las tablas en PostgreSQL en el orden correcto."""
    print("🥭 Manguito: Verificando tablas en PostgreSQL...")
    with obtener_conexion() as conn:
        with conn.cursor() as cursor:
            # 1. Creamos la tabla principal (usuarios) PRIMERO
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

            # 2. Creamos las tablas dependientes DESPUÉS
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS gastos (
                    id SERIAL PRIMARY KEY,
                    usuario_id INTEGER NOT NULL,
                    monto REAL NOT NULL,
                    categoria VARCHAR(100) NOT NULL,
                    descripcion TEXT,
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    currency VARCHAR(10) DEFAULT 'ARS',
                    CONSTRAINT fk_usuario_gasto FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
                )
            ''')

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS metas_presupuestos (
                    id SERIAL PRIMARY KEY,
                    usuario_id INTEGER NOT NULL,
                    tipo VARCHAR(50) CHECK(tipo IN ('presupuesto', 'meta')),
                    nombre VARCHAR(255) NOT NULL,
                    monto_objetivo REAL NOT NULL,
                    monto_actual REAL DEFAULT 0,
                    currency VARCHAR(10) DEFAULT 'ARS',
                    icon VARCHAR(10) DEFAULT '🎯',
                    CONSTRAINT fk_usuario_meta FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
                )
            ''')
        conn.commit()
    print("✅ Tablas de PostgreSQL listas y operativas.")