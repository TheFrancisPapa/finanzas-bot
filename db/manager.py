"""
db/manager.py — Fachada que unifica los repositorios.

Mantiene compatibilidad con la interfaz original `db.metodo()`:
todos los métodos del viejo DBManager siguen funcionando exactamente
igual, pero ahora delegan a los repos especializados.

Uso:
    from db import db
    await db.init_db()
    await db.agregar_movimiento(user_id, ...)   # igual que antes
"""

import logging


from db.conexion import conexion
from db.repo_movimientos import RepoMovimientos
from db.repo_usuarios import RepoUsuarios
from db.repo_suscripciones import RepoSuscripciones
from db.repo_metas import RepoMetas
from db.repo_variables import RepoVariables
from db.repo_reglas import RepoReglas
from db.repo_inversiones import RepoInversiones
from db.repo_logros import RepoLogros
from db.repo_cuotas import RepoCuotas
from db.repo_categorias import RepoCategorias


class DBManager:
    """
    Fachada de acceso a datos.

    Expone sub-repos como atributos Y mantiene los métodos directos
    para retrocompatibilidad con el código existente de handlers.
    """

    def __init__(self):
        self.movimientos = RepoMovimientos()
        self.usuarios = RepoUsuarios()
        self.suscripciones = RepoSuscripciones()
        self.metas = RepoMetas()
        self.variables = RepoVariables()
        self.reglas = RepoReglas()
        self.inversiones = RepoInversiones()
        self.logros = RepoLogros()
        self.cuotas = RepoCuotas()
        self.categorias = RepoCategorias()

    # ── INICIALIZACIÓN ────────────────────────────────────

    async def init_db(self):
        await conexion.init_db()

    def backup_db(self, path_destino):
        return conexion.backup_db(path_destino)

    # ══════════════════════════════════════════════════════
    #  RETROCOMPATIBILIDAD: métodos que delegan a repos
    #  (así no hay que tocar NINGÚN handler de golpe)
    # ══════════════════════════════════════════════════════

    # --- Movimientos ---
    async def agregar_movimiento(self, user_id, tipo, monto, categoria, descripcion):
        return await self.movimientos.agregar(user_id, tipo, monto, categoria, descripcion)

    async def borrar_por_id(self, user_id, mov_id):
        return await self.movimientos.borrar_por_id(user_id, mov_id)

    async def borrar_ultimo(self, user_id):
        return await self.movimientos.borrar_ultimo(user_id)

    async def editar_movimiento(self, user_id, mov_id, nuevo_monto):
        return await self.movimientos.editar(user_id, mov_id, nuevo_monto)

    async def buscar_movimientos(self, user_id, texto, limite=10):
        return await self.movimientos.buscar(user_id, texto, limite)

    async def get_gastos_hoy(self, user_id):
        return await self.movimientos.get_gastos_hoy(user_id)

    async def get_resumen_mensual(self, user_id):
        return await self.movimientos.get_resumen_mensual(user_id)

    async def get_ultimos_movimientos(self, user_id, limite=5):
        return await self.movimientos.get_ultimos_movimientos(user_id, limite)

    async def get_ultimos_movimientos_con_id(self, user_id, limite=10):
        return await self.movimientos.get_ultimos_movimientos_con_id(user_id, limite)

    async def get_datos_analisis(self, user_id, tipo='egreso'):
        return await self.movimientos.get_datos_analisis(user_id, tipo=tipo)

    async def get_all_user_data(self, user_id):
        return await self.movimientos.get_all_user_data(user_id)

    async def get_historial_categoria(self, user_id, categoria, limite=10):
        return await self.movimientos.get_historial_categoria(user_id, categoria, limite)

    async def get_categorias_usuario(self, user_id, tipo='egreso'):
        return await self.movimientos.get_categorias_usuario(user_id, tipo=tipo)

    async def add_categoria_custom(self, user_id, nombre, tipo='egreso'):
        return await self.movimientos.add_categoria_custom(user_id, nombre, tipo)

    async def delete_categoria_custom(self, user_id, nombre, tipo='egreso'):
        return await self.movimientos.delete_categoria_custom(user_id, nombre, tipo)

    async def get_comparativo_mensual(self, user_id):
        return await self.movimientos.get_comparativo_mensual(user_id)

    async def get_top_gastos(self, user_id, limite=5):
        return await self.movimientos.get_top_gastos(user_id, limite)

    async def get_racha(self, user_id):
        return await self.movimientos.get_racha(user_id)

    async def get_resumen_semanal(self, user_id):
        return await self.movimientos.get_resumen_semanal(user_id)

    async def get_gastos_por_dia(self, user_id):
        return await self.movimientos.get_gastos_por_dia(user_id)

    async def get_movimientos_semana(self, user_id):
        return await self.movimientos.get_movimientos_semana(user_id)

    async def get_movimientos_paginados(self, user_id, limite=5, offset=0, tipo=None):
        return await self.movimientos.get_movimientos_paginados(user_id, limite, offset, tipo=tipo)

    async def contar_movimientos_total(self, user_id, tipo=None):
        return await self.movimientos.contar_movimientos_total(user_id, tipo=tipo)

    async def set_presupuesto(self, user_id, categoria, monto):
        return await self.movimientos.set_presupuesto(user_id, categoria, monto)

    async def get_presupuestos_estado(self, user_id):
        return await self.movimientos.get_presupuestos_estado(user_id)

    async def get_presupuesto_estado(self, user_id, categoria):
        return await self.movimientos.get_presupuesto_estado(user_id, categoria)

    async def borrar_presupuesto(self, user_id, categoria):
        return await self.movimientos.borrar_presupuesto(user_id, categoria)

    async def registrar_cotizacion(self, tipo, valor):
        return await self.movimientos.registrar_cotizacion(tipo, valor)

    async def get_variacion_dolar(self, tipo, valor_actual):
        return await self.movimientos.get_variacion_dolar(tipo, valor_actual)

    async def ya_cobrado_hoy(self, user_id, nombre_suscripcion):
        return await self.movimientos.ya_cobrado_hoy(user_id, nombre_suscripcion)

    # --- Usuarios ---
    async def registrar_usuario(self, user_id, nombre, username=None):
        return await self.usuarios.registrar(user_id, nombre, username)

    async def get_todos_usuarios(self):
        return await self.usuarios.get_todos()

    async def buscar_usuarios_por_nombre(self, texto):
        return await self.usuarios.buscar_por_nombre(texto)

    async def get_todos_usuarios_registrados(self):
        return await self.usuarios.get_todos_registrados()

    async def activar_trial(self, user_id):
        return await self.usuarios.activar_trial(user_id)

    async def es_pro(self, user_id):
        return await self.usuarios.es_pro(user_id)

    async def info_plan(self, user_id):
        return await self.usuarios.info_plan(user_id)

    async def activar_pro(self, user_id, meses=1):
        return await self.usuarios.activar_pro(user_id, meses)

    async def get_siguiente_tip(self, user_id):
        return await self.usuarios.get_siguiente_tip(user_id)

    async def get_usuarios_en_trial(self):
        return await self.usuarios.get_en_trial()

    async def registrar_uso_ia(self, user_id):
        return await self.usuarios.registrar_uso_ia(user_id)

    async def obtener_usos_ia(self, user_id):
        return await self.usuarios.obtener_usos_ia(user_id)

    async def get_pareja(self, user_id):
        return await self.usuarios.get_pareja(user_id)
        
    async def vincular_pareja(self, user_id, pareja_id):
        return await self.usuarios.vincular_pareja(user_id, pareja_id)

    async def desvincular_pareja(self, user_id):
        return await self.usuarios.desvincular_pareja(user_id)
        
    async def get_balance_compartido(self, user_id_1, user_id_2, mes_actual):
        return await self.movimientos.get_balance_compartido(user_id_1, user_id_2, mes_actual)
        
    async def hacer_compartido(self, user_id, mov_id):
        return await self.movimientos.hacer_compartido(user_id, mov_id)

    async def agregar_feedback(self, user_id, mensaje):
        return await self.usuarios.agregar_feedback(user_id, mensaje)

    async def get_feedback(self):
        return await self.usuarios.get_feedback()

    async def crear_usuario_web(self, email, password_hash, nombre, edad=None, objetivo=None):
        return await self.usuarios.crear_usuario_web(email, password_hash, nombre, edad, objetivo)

    async def crear_o_actualizar_usuario_google(self, google_id, email, nombre):
        return await self.usuarios.crear_o_actualizar_usuario_google(google_id, email, nombre)

    async def get_web_user_por_email(self, email):
        return await self.usuarios.get_web_user_por_email(email)

    async def email_disponible(self, email):
        return await self.usuarios.email_disponible(email)

    async def vincular_telegram(self, usuario_id, telegram_user_id):
        return await self.usuarios.vincular_telegram(usuario_id, telegram_user_id)

    async def needs_onboarding(self, usuario_id):
        return await self.usuarios.needs_onboarding(usuario_id)

    async def completar_onboarding(self, usuario_id, edad, objetivo):
        return await self.usuarios.completar_onboarding(usuario_id, edad, objetivo)

    # --- Suscripciones ---
    async def agregar_suscripcion(self, user_id, nombre, monto, dia_cobro, categoria="Suscripciones"):
        return await self.suscripciones.agregar(user_id, nombre, monto, dia_cobro, categoria)

    async def get_suscripciones_usuario(self, user_id):
        return await self.suscripciones.get_del_usuario(user_id)

    async def borrar_suscripcion(self, user_id, suscripcion_id):
        return await self.suscripciones.borrar(user_id, suscripcion_id)

    async def get_suscripciones_del_dia(self, dia_hoy):
        return await self.suscripciones.get_del_dia(dia_hoy)

    # --- Metas de Ahorro ---
    async def crear_meta(self, user_id, nombre, objetivo):
        return await self.metas.crear(user_id, nombre, objetivo)

    async def get_metas_ahorro(self, user_id):
        return await self.metas.get_metas(user_id)

    async def get_meta_por_id(self, user_id, meta_id):
        return await self.metas.get_meta_por_id(user_id, meta_id)

    async def aportar_meta(self, user_id, meta_id, monto):
        return await self.metas.aportar(user_id, meta_id, monto)

    async def borrar_meta(self, user_id, meta_id):
        return await self.metas.borrar(user_id, meta_id)

    # --- Servicios Variables ---
    async def agregar_variable(self, user_id, nombre, dia_vencimiento, categoria):
        return await self.variables.agregar(user_id, nombre, dia_vencimiento, categoria)

    async def get_variables_usuario(self, user_id):
        return await self.variables.get_del_usuario(user_id)

    async def get_variables_del_dia(self, dia_hoy):
        return await self.variables.get_del_dia(dia_hoy)

    async def get_variable_por_id(self, user_id, servicio_id):
        return await self.variables.get_por_id(user_id, servicio_id)

    async def borrar_variable(self, user_id, servicio_id):
        return await self.variables.borrar(user_id, servicio_id)

    # --- Reglas de Categorización ---
    async def agregar_regla(self, user_id, patron, categoria):
        return await self.reglas.agregar(user_id, patron, categoria)

    async def buscar_regla(self, user_id, texto):
        return await self.reglas.buscar_patron(user_id, texto)

    async def get_reglas(self, user_id):
        return await self.reglas.get_reglas(user_id)

    async def borrar_regla(self, user_id, regla_id):
        return await self.reglas.borrar(user_id, regla_id)

    async def borrar_todas_reglas(self, user_id):
        return await self.reglas.borrar_todas(user_id)

    # --- Inversiones ---
    async def agregar_inversion(self, user_id, tipo, ticker, cantidad):
        return await self.inversiones.agregar(user_id, tipo, ticker, cantidad)

    async def get_inversiones(self, user_id):
        return await self.inversiones.get_del_usuario(user_id)

    async def get_inversion_por_id(self, user_id, inv_id):
        return await self.inversiones.get_por_id(user_id, inv_id)

    async def actualizar_inversion(self, user_id, inv_id, nueva_cantidad):
        return await self.inversiones.actualizar_cantidad(user_id, inv_id, nueva_cantidad)

    async def borrar_inversion(self, user_id, inv_id):
        return await self.inversiones.borrar(user_id, inv_id)

    # --- Logros ---
    async def tiene_logro(self, user_id, logro_id):
        return await self.logros.tiene_logro(user_id, logro_id)

    async def otorgar_logro(self, user_id, logro_id):
        return await self.logros.otorgar_logro(user_id, logro_id)

    async def get_logros(self, user_id):
        return await self.logros.get_logros(user_id)

    # --- CUOTAS ---
    async def agregar_compra_cuotas(self, user_id, descripcion, categoria, monto_cuota, cuotas_totales, cuotas_pagadas=1):
        return await self.cuotas.agregar_compra(user_id, descripcion, categoria, monto_cuota, cuotas_totales, cuotas_pagadas)

    async def get_compras_activas_cuotas(self):
        return await self.cuotas.get_compras_activas()

    async def get_compras_usuario_cuotas(self, user_id):
        return await self.cuotas.get_compras_usuario(user_id)

    async def sumar_cuota(self, compra_id):
        return await self.cuotas.sumar_cuota(compra_id)

    # --- PRIVACIDAD ---
    async def eliminar_cuenta_completa(self, user_id):
        """Borra todos los rastros del usuario en todas las tablas mediante una transacción."""
        async with conexion.get_conn() as conn:
            try:
                async with conn.transaction():
                    await conn.execute("DELETE FROM usuarios WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM usuarios_pro WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM movimientos WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM presupuestos WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM suscripciones WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM metas_ahorro WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM servicios_variables WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM reglas_categorias WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM inversiones WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM logros_usuario WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM compras_cuotas WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM usos_ia_diarios WHERE usuario_id = $1", user_id)
                    await conn.execute("DELETE FROM feedback WHERE usuario_id = $1", user_id)
                return True
            except Exception as e:
                logging.getLogger('Manguito-DB').error(f"Error borrando cuenta {user_id}: {e}")
                return False

# === Singleton global ===
db = DBManager()
