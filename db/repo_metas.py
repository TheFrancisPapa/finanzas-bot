import psycopg2
from psycopg2.extras import RealDictCursor
from db.manager import obtener_conexion

def crear_meta_o_presupuesto(usuario_id: int, tipo: str, nombre: str, monto_objetivo: float, currency: str = 'ARS', icon: str = '🎯'):
    """Crea una nueva meta de ahorro o un límite de presupuesto."""
    with obtener_conexion() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute('''
                INSERT INTO metas_presupuestos (usuario_id, tipo, nombre, monto_objetivo, currency, icon)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
            ''', (usuario_id, tipo, nombre, monto_objetivo, currency, icon))
            nuevo_id = cursor.fetchone()['id']
        conn.commit()
        return nuevo_id

def obtener_metas_presupuestos(usuario_id: int, tipo: str = None):
    """Obtiene la lista de metas o presupuestos de un usuario."""
    with obtener_conexion() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            if tipo:
                cursor.execute("SELECT * FROM metas_presupuestos WHERE usuario_id = %s AND tipo = %s", (usuario_id, tipo))
            else:
                cursor.execute("SELECT * FROM metas_presupuestos WHERE usuario_id = %s", (usuario_id,))
            return cursor.fetchall()

def actualizar_progreso_meta(meta_id: int, usuario_id: int, monto_a_sumar: float):
    """Suma (o resta) dinero al progreso actual de una meta."""
    with obtener_conexion() as conn:
        with conn.cursor() as cursor:
            cursor.execute('''
                UPDATE metas_presupuestos 
                SET monto_actual = monto_actual + %s
                WHERE id = %s AND usuario_id = %s
            ''', (monto_a_sumar, meta_id, usuario_id))
            modificados = cursor.rowcount
        conn.commit()
        return modificados > 0