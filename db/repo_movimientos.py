import psycopg2
from psycopg2.extras import RealDictCursor
from db.manager import obtener_conexion

def registrar_movimiento_web(usuario_id: int, tipo: str, monto: float, categoria: str, descripcion: str = "", currency: str = "ARS"):
    monto_absoluto = abs(monto)
    monto_final = monto_absoluto if tipo == 'ingreso' else -monto_absoluto

    with obtener_conexion() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute('''
                INSERT INTO gastos (usuario_id, monto, categoria, descripcion, fecha, currency)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, %s) RETURNING id
            ''', (usuario_id, monto_final, categoria, descripcion, currency))
            nuevo_id = cursor.fetchone()['id']
        conn.commit()
        return nuevo_id

def obtener_movimientos_web(usuario_id: int):
    with obtener_conexion() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM gastos WHERE usuario_id = %s ORDER BY fecha DESC", (usuario_id,))
            filas = cursor.fetchall()
            
            movimientos = []
            for m in filas:
                tipo = "ingreso" if m["monto"] > 0 else "gasto"
                movimientos.append({
                    "id": m["id"],
                    "type": tipo,
                    "amount": abs(m["monto"]),
                    "category": m["categoria"],
                    "description": m["descripcion"] or "",
                    # psycopg2 devuelve un objeto datetime, lo pasamos a string ISO para React
                    "date": m["fecha"].isoformat() if m["fecha"] else None,
                    "currency": m.get("currency", "ARS")
                })
            return movimientos

def borrar_movimiento_web(usuario_id: int, movimiento_id: int):
    with obtener_conexion() as conn:
        with conn.cursor() as cursor:
            cursor.execute('''
                DELETE FROM gastos 
                WHERE id = %s AND usuario_id = %s
            ''', (movimiento_id, usuario_id))
            modificados = cursor.rowcount
        conn.commit()
        return modificados > 0