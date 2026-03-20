import asyncio
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import db

async def test_resumen():
    await db.init_db()
    # Find a user to test with
    usuarios = await db.get_todos_usuarios_registrados()
    if not usuarios:
        print("No users found.")
        return

    user_id = usuarios[0][0]
    print(f"Testing with user_id: {user_id}")

    print("Fetching get_resumen_mensual...")
    ingresos, gastos = await db.get_resumen_mensual(user_id)
    print(f"Ingresos: {ingresos}, Gastos: {gastos}")

    print("Fetching get_gastos_hoy...")
    total_hoy_result = await db.get_gastos_hoy(user_id)
    print(f"Total hoy: {total_hoy_result}")

    print("Fetching get_racha...")
    racha = await db.get_racha(user_id)
    print(f"Racha: {racha}")

    print("Fetching get_datos_analisis...")
    datos_analisis = await db.get_datos_analisis(user_id)
    print(f"Datos analisis: {datos_analisis}")

    print("Fetching get_comparativo_mensual...")
    comp = await db.get_comparativo_mensual(user_id)
    print(f"Comparativo: {comp}")

    print("Fetching get_gastos_por_dia...")
    gastos_dia = await db.get_gastos_por_dia(user_id)
    print(f"Gastos por dia: {gastos_dia}")

    print("Calculando variacion...")
    total_actual = comp[0] if comp else 0
    total_anterior = comp[1] if comp and len(comp) > 1 else 0
    if total_anterior and total_anterior > 0:
        variacion = round(((total_actual - total_anterior) / total_anterior * 100), 1)
    else:
        variacion = 0
    print(f"Variacion: {variacion}")

if __name__ == "__main__":
    asyncio.run(test_resumen())
