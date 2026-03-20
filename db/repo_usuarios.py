import psycopg2
from psycopg2.extras import RealDictCursor
from db.manager import obtener_conexion

def obtener_usuario_por_email(email: str):
    with obtener_conexion() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM usuarios WHERE LOWER(email) = LOWER(%s)", (email,))
            return cursor.fetchone()

def obtener_usuario_por_id(usuario_id: int):
    with obtener_conexion() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM usuarios WHERE id = %s", (usuario_id,))
            return cursor.fetchone()

def crear_usuario_web(nombre: str, email: str, auth_provider: str = 'manual', picture: str = None, password_hash: str = None):
    try:
        with obtener_conexion() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # En Postgres usamos RETURNING id para saber qué número le asignó
                cursor.execute('''
                    INSERT INTO usuarios (nombre, email, auth_provider, picture, password_hash)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id
                ''', (nombre, email, auth_provider, picture, password_hash))
                nuevo_id = cursor.fetchone()['id']
            conn.commit()
            return nuevo_id
    except psycopg2.IntegrityError:
        # El email ya existe
        return None

def actualizar_perfil_web(usuario_id: int, nombre: str, picture: str = None):
    with obtener_conexion() as conn:
        with conn.cursor() as cursor:
            cursor.execute('''
                UPDATE usuarios 
                SET nombre = %s, picture = COALESCE(%s, picture)
                WHERE id = %s
            ''', (nombre, picture, usuario_id))
            modificados = cursor.rowcount
        conn.commit()
        return modificados > 0