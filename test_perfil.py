import asyncio
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import db

async def test_perfil():
    await db.init_db()
    
    # Find a user to test with
    usuarios = await db.get_todos_usuarios_registrados()
    if not usuarios:
        print("No users found.")
        return

    user_id = usuarios[0][0]
    print(f"Testing perfil with user_id: {user_id}")

    print("Fetching info_plan...")
    info = await db.info_plan(user_id)
    print(f"Info plan: {info}")

    print("Fetching get_racha...")
    racha = await db.get_racha(user_id)
    print(f"Racha: {racha}")

    print("Fetching get_logros...")
    try:
        logros = await db.get_logros(user_id)
        print(f"Logros: {logros}")
    except Exception as e:
        print(f"Exception en get_logros: {e}")

if __name__ == "__main__":
    asyncio.run(test_perfil())
