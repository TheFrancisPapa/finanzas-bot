"""
handlers/callbacks.py — Handler de botones inline.

Maneja todos los callback_data de los InlineKeyboardButton.
"""

import asyncio
import calendar
import logging
from datetime import datetime

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

from db import db
from servicios import (
    rate_limiter, client, MODEL_NAME,
)
from utils.textos import EMOJIS_CATEGORIA, icono_suscripcion, MEDALLAS
from utils.prompts import prompt_tips_ahorro
from servicios.reportes import generar_excel_bytes, nombre_mes_es
from handlers.comunes import teclado_principal, teclado_herramientas, teclado_volver, teclado_navegacion, LINK_DONACION

# Imports diferidos para evitar circular imports
# ver_dolar y analizar_gastos_callback se importan dentro de callback_handler

logger = logging.getLogger('Manguito')


async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa los clicks en botones inline."""
    query = update.callback_query
    await query.answer()  # Responder al click (quitar el relojito)
    
    data = query.data
    
    try:
        if data == "cmd_menu":
            user_id = query.from_user.id
            ingresos, gastos = await db.get_resumen_mensual(user_id)
            saldo = ingresos - gastos
            emoji_saldo = "📈" if saldo >= 0 else "📉"
            
            msg = (
                "🥭 *MANGUITO*\n"
                f"{'─' * 22}\n\n"
                f"🟢 Ingresos: *${ingresos:,.0f}*\n"
                f"🔴 Gastos: *${gastos:,.0f}*\n"
                f"{emoji_saldo} Balance: *${saldo:,.0f}*\n\n"
                "✨ _¿Qué querés hacer?_ 👇"
            )
            
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_principal())
        elif data == "actualizar_menu":
            msg = "✅ *¡Menú actualizado!*\n\n¡Gracias por seguir usando Manguito! Acá tenés las opciones:"
            # Opcional: Podríamos re-enviar la "app bar" con teclado persistente
            try:
                # Enviamos un mensaje con el teclado persistente en caso de que lo hayan perdido
                await context.bot.send_message(
                    chat_id=query.message.chat_id,
                    text="🔄 Actualizando botones inferiores...",
                    reply_markup=teclado_navegacion()
                )
            except Exception as e:
                logger.debug(f"Error reenviando teclado_navegacion: {e}")
                pass
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_principal())
            
        elif data == "cmd_herramientas":
            msg = "🛠️ *HERRAMIENTAS*\n" + "─" * 22 + "\nSeleccioná una categoría:"
            from handlers.comunes import teclado_herramientas
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_herramientas())

        elif data == "cmd_registrar":
            kb = InlineKeyboardMarkup([
                [InlineKeyboardButton("🔴 Gasto", callback_data="reg_tipo_egreso"),
                 InlineKeyboardButton("🟢 Ingreso", callback_data="reg_tipo_ingreso")],
                [InlineKeyboardButton("◀️ Volver", callback_data="cmd_menu")]
            ])
            await query.edit_message_text(
                "➕ *REGISTRAR TRANSACCIÓN*\n" + "─" * 22 + "\n\n"
                "¿Qué querés anotar?",
                parse_mode='Markdown',
                reply_markup=kb
            )

        elif data == "reg_tipo_egreso":
            await query.edit_message_text(
                "🔴 *GASTO*\n\n"
                "Escribí qué gastaste y el monto.\n"
                "Ej: _Comida 5000_ o _Nafta 15000_\n\n"
                "También podés mandar un 🎙️ audio o 📸 foto del ticket.",
                parse_mode='Markdown'
            )

        elif data == "reg_tipo_ingreso":
            await query.edit_message_text(
                "🟢 *INGRESO*\n\n"
                "Escribí qué cobraste y el monto.\n"
                "Ej: _Sueldo 350000_ o _Freelance 80000_",
                parse_mode='Markdown'
            )

        elif data == "menu_finanzas":
            from handlers.comunes import teclado_mis_finanzas
            await query.edit_message_text("💳 *MIS FINANZAS*\n────────────────────\nElegí qué querés gestionar:", parse_mode='Markdown', reply_markup=teclado_mis_finanzas())

        elif data == "menu_categorias":
            user_id = query.from_user.id
            categorias = await db.categorias.get_categorias(user_id)
            
            msg = "🏷️ *MIS CATEGORÍAS*\n" + "─" * 22 + "\n\n"
            for nombre, emoji in categorias:
                msg += f"{emoji} {nombre}\n"
            msg += f"\n_Total: {len(categorias)} categorías_"
            
            keyboard = [
                [InlineKeyboardButton("➕ Agregar", callback_data="cat_agregar"),
                 InlineKeyboardButton("🗑️ Borrar", callback_data="cat_borrar_menu")],
                [InlineKeyboardButton("◀️ Volver", callback_data="menu_perfil")]
            ]
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))

        elif data == "cat_agregar":
            await query.edit_message_text(
                "➕ *AGREGAR CATEGORÍA*\n" + "─" * 22 + "\n\n"
                "Escribí el emoji y el nombre de la categoría.\n"
                "Ej: `🏠 Hogar` o `🐶 Mascotas`\n\n"
                "_Si no ponés emoji, se usa 📌 por defecto._",
                parse_mode='Markdown'
            )
            context.user_data['esperando_categoria'] = True

        elif data == "cat_borrar_menu":
            user_id = query.from_user.id
            categorias = await db.categorias.get_categorias(user_id)
            
            keyboard = []
            for nombre, emoji in categorias:
                keyboard.append([InlineKeyboardButton(
                    f"❌ {emoji} {nombre}", callback_data=f"cat_del_{nombre}"
                )])
            keyboard.append([InlineKeyboardButton("◀️ Volver", callback_data="menu_categorias")])
            
            await query.edit_message_text(
                "🗑️ *BORRAR CATEGORÍA*\n" + "─" * 22 + "\n\n"
                "Tocá la que querés borrar:",
                parse_mode='Markdown',
                reply_markup=InlineKeyboardMarkup(keyboard)
            )

        elif data.startswith("cat_del_"):
            nombre_cat = data.replace("cat_del_", "")
            user_id = query.from_user.id
            borrado = await db.categorias.borrar_categoria(user_id, nombre_cat)
            if borrado:
                await query.answer(f"✅ Categoría '{nombre_cat}' eliminada", show_alert=True)
            else:
                await query.answer(f"❌ No se pudo borrar '{nombre_cat}'", show_alert=True)
            # Regresar al menú de categorías
            categorias = await db.categorias.get_categorias(user_id)
            msg = "🏷️ *MIS CATEGORÍAS*\n" + "─" * 22 + "\n\n"
            for nombre, emoji in categorias:
                msg += f"{emoji} {nombre}\n"
            msg += f"\n_Total: {len(categorias)} categorías_"
            keyboard = [
                [InlineKeyboardButton("➕ Agregar", callback_data="cat_agregar"),
                 InlineKeyboardButton("🗑️ Borrar", callback_data="cat_borrar_menu")],
                [InlineKeyboardButton("◀️ Volver", callback_data="menu_perfil")]
            ]
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))

        elif data == "menu_reportes":
            from handlers.comunes import teclado_reportes
            await query.edit_message_text("📈 *REPORTES Y ANÁLISIS*\n────────────────────\nElegí una herramienta:", parse_mode='Markdown', reply_markup=teclado_reportes())

        elif data == "menu_extras":
            from handlers.comunes import teclado_extras
            await query.edit_message_text("🌟 *EXTRAS Y MERCADOS*\n────────────────────\nSeleccioná una opción:", parse_mode='Markdown', reply_markup=teclado_extras())
        
        elif data == "cmd_resumen":
            try:
                user_id = query.from_user.id
                ingresos, gastos = await db.get_resumen_mensual(user_id)
                saldo = ingresos - gastos
                ultimos = await db.get_ultimos_movimientos(user_id)
                racha = await db.get_racha(user_id)
                
                emoji_saldo = "\U0001F60E" if saldo >= 0 else "\U0001F630"
                try:
                    mes_nombre = nombre_mes_es()
                except Exception:
                    mes_nombre = "Mes Actual"
                

                dias_mes = calendar.monthrange(datetime.now().year, datetime.now().month)[1]
                dia_actual = datetime.now().day
                pct_mes = int((dia_actual / dias_mes) * 100)
                
                try:
                    proyeccion = (gastos / dia_actual) * dias_mes
                except Exception:
                    proyeccion = 0

                if ingresos > 0:
                    pct_gastado = min(int((gastos / ingresos) * 10), 10)
                    barra = "█" * pct_gastado + "░" * (10 - pct_gastado) 
                else:
                    barra = "░" * 10
                
                msg = f"\U0001F4CA *RESUMEN - {mes_nombre.upper()}*\n"
                msg += f"\U0001F4C5 Día {dia_actual}/{dias_mes} ({pct_mes}% del mes)\n"
                msg += "────────────────────\n\n"
                
                msg += f"\U0001F4B0 *BALANCE*\n"
                msg += f"\U0001F7E2 Ingresos:  ${ingresos:,.0f}\n"
                msg += f"\U0001F534 Gastos:    ${gastos:,.0f}\n"
                msg += f"\U0001F4C9 *Saldo:    ${saldo:,.0f}* {emoji_saldo}\n\n"
                
                msg += f"\U0001F50B *ESTADO DEL MES*\n"
                msg += f"[{barra}] {int((gastos/ingresos)*100) if ingresos else 0}%\n\n"
                

                hoy = datetime.now()
                dias_mes = calendar.monthrange(hoy.year, hoy.month)[1]
                
                dias_restantes = dias_mes - hoy.day
                if dias_restantes > 0:
                    msg += f"⏳ Faltan *{dias_restantes} días* para renovar mes.\n\n"
                
                if gastos > 0:
                    msg += f"\U0001F52E *Proyección:* ~${proyeccion:,.0f}\n"
                
                if racha > 0:
                    msg += f"\U0001F525 Racha: *{racha} día{'s' if racha != 1 else ''}*\n"
                
                msg += "\n\U0001F4CB *Últimos movimientos:*\n"
                if ultimos:
                    for desc, monto, tipo, fecha in ultimos:
                        icon = "\U0001F7E2" if tipo == 'ingreso' else "\U0001F534"
                        try:
                            d_str = desc[:20] + "..." if len(desc) > 20 else desc
                            msg += f"{icon} ${monto:,.0f} | {d_str}\n"
                        except Exception:
                            pass
                else:
                    msg += "_No hay movimientos recientes._"
                    
                kb = InlineKeyboardMarkup([
                    [InlineKeyboardButton("📱 Compartir como imagen", callback_data="cmd_compartir_img")],
                    [InlineKeyboardButton("◀️ Volver", callback_data="cmd_menu")]
                ])
                await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=kb)
            except Exception as e:
                logger.error(f"Error en resumen: {e}")
                await query.edit_message_text(f"❌ Error en resumen: {str(e)}", reply_markup=teclado_volver())
        
        elif data == "cmd_compartir_img":
            user_id = query.from_user.id
            await query.edit_message_text("⏳ _Generando tu card..._", parse_mode='Markdown')
            try:
                from servicios.reportes import generar_resumen_imagen
                img_buf = await generar_resumen_imagen(user_id)
                if img_buf:
                    await context.bot.send_photo(
                        chat_id=query.message.chat_id,
                        photo=img_buf,
                        caption="🥭 *Tu resumen Manguito* — Listo para compartir en redes 📲",
                        parse_mode='Markdown'
                    )
                else:
                    await context.bot.send_message(
                        chat_id=query.message.chat_id,
                        text="📊 No hay datos suficientes para generar la imagen."
                    )
            except Exception as e:
                logger.error(f"Error generando imagen compartir: {e}")
                await context.bot.send_message(
                    chat_id=query.message.chat_id,
                    text="❌ Error al generar la imagen. Probá de nuevo."
                )

        elif data == "cmd_metas":
            user_id = query.from_user.id
            filas = await db.get_presupuestos_estado(user_id)
            
            if not filas:
                await query.edit_message_text("🤷‍♂️ No tenés presupuestos.\nUsá /presupuesto Comida 50000", reply_markup=teclado_volver())
                return
            
            msg = "🎯 *SEMAFORO DE METAS*\n\n"
            for cat, maximo, gastado in filas:
                porcentaje = (gastado / maximo) * 100 if maximo > 0 else 100
                bloques = min(int(porcentaje // 10), 10)
                barra = "█" * bloques + "░" * (10 - bloques)
                emoji = "🟢" if porcentaje < 60 else "🟡" if porcentaje < 80 else "🟠" if porcentaje < 100 else "🔴"
                
                msg += f"{emoji} *{cat}*\n"
                msg += f"`[{barra}]` {porcentaje:.0f}%\n"
                msg += f"${gastado:,.0f} de ${maximo:,.0f}\n\n"
            
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_volver())
        
        elif data == "cmd_dolar":
            # Truco: responder con un mensaje NUEVO (no editar) para que quede visible
            from handlers.consultas import ver_dolar
            await query.message.reply_text("⏳ *Consultando cotización...*", parse_mode='Markdown')
            await ver_dolar(update, context)

        elif data == "cmd_sugerencia_info":
            msg = "💡 *buzón de sugerencias*\n\n"
            msg += "Para enviar una idea o mejora, escribí:\n"
            msg += "`/sugerencia [Tu Mensaje]`\n\n"
            msg += "Ejemplo:\n"
            msg += "`1/sugerencia Que el bot haga café`"
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_volver())
            
        elif data == "cmd_auditoria":
            await update.callback_query.answer()
            await update.callback_query.message.reply_text(
                "🔍 Función de auditoría próximamente disponible.",
                parse_mode='Markdown'
            )
            
        elif data == "cmd_analisis":
            from handlers.movimientos import analizar_gastos_callback
            await query.edit_message_text("🧠 _Analizando tus finanzas..._", parse_mode='Markdown')
            await analizar_gastos_callback(query, context)
        
        elif data == "cmd_historial":
            user_id = query.from_user.id
            categorias = await db.get_categorias_usuario(user_id)
            
            if not categorias:
                await query.edit_message_text("🤷‍♂️ No tenés gastos este mes.", reply_markup=teclado_volver())
                return
            
            keyboard = []
            fila = []
            for cat in categorias:
                emoji = EMOJIS_CATEGORIA.get(cat, '📌')
                fila.append(InlineKeyboardButton(f"{emoji} {cat}", callback_data=f"hist_{cat}"))
                if len(fila) == 2:
                    keyboard.append(fila)
                    fila = []
            if fila:
                keyboard.append(fila)
            keyboard.append([InlineKeyboardButton("◀️ Volver", callback_data="cmd_menu")])
            
            await query.edit_message_text("🔍 *Elegí una categoría:*", parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        
        elif data.startswith("hist_"):
            categoria = data.replace("hist_", "")
            user_id = query.from_user.id
            movimientos = await db.get_historial_categoria(user_id, categoria)
            emoji_cat = EMOJIS_CATEGORIA.get(categoria, '📌')
            
            total = sum(m[1] for m in movimientos)
            msg = f"{emoji_cat} *{categoria}*\n"
            msg += f"💰 Total: *${total:,.0f}*\n"
            msg += "─" * 18 + "\n"
            
            for fecha, monto, desc in movimientos:
                try:
                    fecha_str = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S').strftime('%d/%m')
                except:
                    fecha_str = "--"
                msg += f"🔸 `{fecha_str}` {desc}: ${monto:,.0f}\n"
            
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_volver())
        
        elif data == "cmd_mis_fijos":
            try:
                user_id = query.from_user.id
                fijos = await db.get_suscripciones_usuario(user_id)
                
                if not fijos:
                    await query.edit_message_text("💳 No tenés suscripciones activas.\nUsá: `/fijo Netflix 5000 10`", parse_mode='Markdown', reply_markup=teclado_volver())
                    return
                
                msg = "💳 *TUS SUSCRIPCIONES Y FIJOS*\n"
                msg += "────────────────────\n\n"
                for fid, nombre, monto, dia, cat, frecuencia in fijos:
                    nombre = nombre or "Servicio"
                    cat = cat or "General"
                    monto = monto or 0
                    
                    icono = icono_suscripcion(nombre)

                    msg += f"👉 {icono} *{nombre}*\n"
                    msg += f"   └ 💲 *${monto:,.0f}* | 📅 Día {dia}\n"
                    msg += f"   └ 🗑️ `/borrar_fijo {fid}`\n\n"
                
                msg += "💡 _Tip: Para agregar uno nuevo usá `/fijo Netflix 5000 10`_"
                await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_volver())
            except Exception as e:
                logger.error(f"Error en mis_fijos: {e}")
                await query.edit_message_text(f"❌ Error al cargar suscripciones: {e}", reply_markup=teclado_volver())
        

        elif data == "cmd_exportar":
            await query.edit_message_text("📤 _Generando archivo Excel..._", parse_mode='Markdown')
            user_id = query.from_user.id
            
            # Usar la nueva función generadora de Excel
            ex_buffer = await generar_excel_bytes(user_id)
            
            if not ex_buffer:
                await query.edit_message_text("📂 No hay datos para exportar.", reply_markup=teclado_volver())
                return
            
            await context.bot.send_chat_action(chat_id=query.message.chat_id, action="upload_document")
            
            await context.bot.send_document(
                chat_id=query.message.chat_id, 
                document=ex_buffer, 
                filename=f"Manguito_{datetime.now().strftime('%Y-%m-%d')}.xlsx", 
                caption="📊 *Acá tenés tu Excel Premium con todos los movimientos y gráficos.*",
                parse_mode='Markdown'
            )
            
            # Restaurar menú
            await query.message.reply_text("¿Algo más?", reply_markup=teclado_principal())
        
        elif data == "cmd_borrar":
            user_id = query.from_user.id
            borrado = await db.borrar_ultimo(user_id)
            if borrado:
                await query.edit_message_text(f"🗑️ Eliminado: {borrado[1]} (${borrado[2]:,.0f})", reply_markup=teclado_volver())
            else:
                await query.edit_message_text("Nada para borrar.", reply_markup=teclado_volver())
        
        elif data.startswith("undo_"):
            mov_id = int(data.replace("undo_", ""))
            user_id = query.from_user.id
            resultado = await db.borrar_por_id(user_id, mov_id)
            if resultado:
                desc, monto = resultado
                await query.edit_message_text(f"↩️ *Deshecho:* _{desc}_ (${monto:,.0f})", parse_mode='Markdown', reply_markup=teclado_volver())
            else:
                await query.edit_message_text("Ya fue borrado o no existe.", reply_markup=teclado_volver())
                
        elif data.startswith("conv_privado_"):
            mov_id = int(data.replace("conv_privado_", ""))
            # El gasto ya es privado por defecto en la BD. Solo editamos el mensaje para quitar los botones de convivencia.
            kb = [
                [InlineKeyboardButton("↩️ Deshacer", callback_data=f"undo_{mov_id}"),
                 InlineKeyboardButton("◀️ Menú", callback_data="cmd_menu")]
            ]
            
            # Recuperar texto original del mensaje
            texto_original = query.message.text
            # Quitar posibles rastros de "Compartido" si alguien le dio doble click
            texto_limpio = texto_original.replace("👥 *Gasto Compartido*\n", "")
            
            await query.edit_message_text(texto_limpio + "\n\n👤 _Marcado como Privado_", parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(kb))
            
        elif data.startswith("conv_compartir_"):
            mov_id = int(data.replace("conv_compartir_", ""))
            user_id = query.from_user.id
            
            # Actualizamos la BD
            await db.hacer_compartido(user_id, mov_id)
            
            # Editamos el mensaje
            kb = [
                [InlineKeyboardButton("↩️ Deshacer", callback_data=f"undo_{mov_id}"),
                 InlineKeyboardButton("◀️ Menú", callback_data="cmd_menu")]
            ]
            texto_original = query.message.text
            await query.edit_message_text("👥 *Gasto Compartido*\n" + texto_original, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(kb))
        
        elif data == "cmd_comparativo":
            user_id = query.from_user.id
            total_actual, total_anterior, cats_actual, cats_anterior, mes_ant = await db.get_comparativo_mensual(user_id)
            
            if total_anterior == 0 and total_actual == 0:
                await query.edit_message_text("No hay datos suficientes para comparar.", reply_markup=teclado_volver())
                return
            
            # Variación total
            if total_anterior > 0:
                variacion = ((total_actual - total_anterior) / total_anterior) * 100
                emoji_var = "📉" if variacion < 0 else "📈" if variacion > 0 else "➡️"
                texto_var = f"{variacion:+.0f}%"
                
                if variacion < 0:
                    humano = "¡Excelente! 🎉 Venís gastando menos que el mes pasado."
                elif variacion > 0:
                    humano = "Ojo 👀, estás gastando más que el mes pasado."
                else:
                    humano = "Viene igual. ⚖️"
            else:
                emoji_var = "🆕"
                texto_var = "Sin datos previos"
                humano = "Acumulá datos para comparar. 🌱"
            
            msg = f"📊 *COMPARATIVO MENSUAL*\n"
            msg += "─" * 22 + "\n"
            msg += f"⏪ Mes anterior: *${total_anterior:,.0f}*\n"
            msg += f"📅 Este mes: *${total_actual:,.0f}*\n"
            msg += f"{emoji_var} Variación: *{texto_var}*\n"
            msg += f"💬 _{humano}_\n"
            msg += "─" * 22 + "\n\n"
            
            msg += "🏷️ *Por categoría:*\n"
            for cat, monto_actual in cats_actual:
                emoji_cat = EMOJIS_CATEGORIA.get(cat, '📌')
                monto_ant = cats_anterior.get(cat, 0)
                if monto_ant > 0:
                    var_cat = ((monto_actual - monto_ant) / monto_ant) * 100
                    flecha = "⬇️" if var_cat < 0 else "⬆️"
                    msg += f"{emoji_cat} {cat}: *${monto_actual:,.0f}* {flecha} {var_cat:+.0f}%\n"
                else:
                    msg += f"{emoji_cat} {cat}: *${monto_actual:,.0f}* 🆕\n"
            
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_volver())
        
        elif data == "cmd_top":
            user_id = query.from_user.id
            top = await db.get_top_gastos(user_id, 5)
            
            if not top:
                await query.edit_message_text("💤 No hay gastos este mes.", reply_markup=teclado_volver())
                return
            
            msg = "🏆 *TOP GASTOS DEL MES*\n"
            msg += "────────────────────\n\n"
            medallas = MEDALLAS
            _, gastos_totales = await db.get_resumen_mensual(user_id)
            
            for i, (mid, desc, monto, cat, fecha) in enumerate(top):
                emoji_cat = EMOJIS_CATEGORIA.get(cat, '📌')
                try:
                    fecha_str = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S').strftime('%d/%m')
                except:
                    fecha_str = "--"
                    
                pct = (monto / gastos_totales * 100) if gastos_totales > 0 else 0
                msg += f"{medallas[i]} *${monto:,.0f}* `({pct:.1f}%)`\n"
                msg += f"   └ {emoji_cat} {desc} _({fecha_str})_\n\n"
            
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_volver())
        
        elif data == "cmd_ayuda_gral":
            msg = "ℹ️ *GUÍA RÁPIDA*\n\n"
            msg += "📝 *Registrar Movimientos:*\n"
            msg += "• Texto: `Cena 15000`\n"
            msg += "• Ingreso: `Sueldo 900000`\n"
            msg += "• 🎙️ Audio: 'Gasté 5000 en taxi'\n"
            msg += "• 📸 Foto: Mandá foto del ticket\n\n"
            
            msg += "⚙️ *Comandos Útiles:*\n"
            msg += "• /presupuesto `Categoría Monto` (Ej: `/presupuesto Comida 100000`)\n"
            msg += "• /fijo `Nombre Monto Día` (Ej: `/fijo Netflix 8000 10`)\n"
            msg += "• /editar `ID Monto` (Para corregir errores)\n"
            msg += "• /borrar `ID` (Para eliminar gasto)\n\n"
            
            msg += "💡 _Tip: Usá el botón 'Análisis IA' para recibir consejos sobre tus finanzas._"
            
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_volver())
        
        elif data == "cmd_donar":
            msg = "❤️ *¿Te gusta este bot?*\n\n"
            msg += "Este bot es 100% gratuito y siempre lo será.\n"
            msg += "Si te sirve y querés dar una mano para "
            msg += "mantenerlo funcionando, podés invitarme "
            msg += "un cafecito:\n\n"
            msg += f"☕ {LINK_DONACION}\n\n"
            msg += "No es obligatorio, pero se agradece mucho.\n"
            msg += "Gracias por usar Manguito! 🙏"
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=teclado_volver())
        
        elif data == "cmd_precios":
            # Menú de categorías de suscripciones
            keyboard = [
                [InlineKeyboardButton("🎬 Streaming", callback_data="precios_streaming"),
                 InlineKeyboardButton("🎧 Música", callback_data="precios_musica")],
                [InlineKeyboardButton("🎮 Gaming", callback_data="precios_gaming"),
                 InlineKeyboardButton("🤖 IA", callback_data="precios_ia")],
                [InlineKeyboardButton("💡 Tips de Ahorro", callback_data="precios_tips")],
                [InlineKeyboardButton("◀️ Volver", callback_data="cmd_menu")]
            ]
            msg = "💲 *PRECIOS DE SUSCRIPCIONES*\n"
            msg += "─" * 22 + "\n\n"
            msg += "Precios finales con impuestos\n"
            msg += "incluidos (datos de Impuestito)\n\n"
            msg += "👇 *Elegí una categoría:*"
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        
        elif data == "precios_streaming":
            keyboard = [
                [InlineKeyboardButton("🎬 Netflix", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-netflix-con-impuestos-en-argentina")],
                [InlineKeyboardButton("✨ Disney+", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-disney-plus-con-impuestos-en-argentina")],
                [InlineKeyboardButton("🐉 HBO MAX", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-hbo-max-con-impuestos-en-argentina")],
                [InlineKeyboardButton("⛰️ Paramount+", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-paramount-plus-con-impuestos-en-argentina")],
                [InlineKeyboardButton("🚀 Prime Video", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-amazon-prime-video-con-impuestos-en-argentina")],
                [InlineKeyboardButton("🌸 Crunchyroll", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-crunchyroll-con-impuestos-en-argentina")],
                [InlineKeyboardButton("▶️ YouTube Premium", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-youtube-premium-con-impuestos-en-argentina")],
                [InlineKeyboardButton("◀️ Volver", callback_data="cmd_precios")]
            ]
            await query.edit_message_text("🎬 *STREAMING* \u2014 Tocá para ver precios:", parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        
        elif data == "precios_musica":
            keyboard = [
                [InlineKeyboardButton("🟢 Spotify", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-spotify-con-impuestos-en-argentina")],
                [InlineKeyboardButton("🍎 Apple Music", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-apple-music-con-impuestos-en-argentina")],
                [InlineKeyboardButton("▶️ YouTube Music", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-youtube-music-con-impuestos-en-argentina")],
                [InlineKeyboardButton("🎵 Tidal", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-tidal-con-impuestos-en-argentina")],
                [InlineKeyboardButton("🎧 Deezer", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-deezer-con-impuestos-en-argentina")],
                [InlineKeyboardButton("◀️ Volver", callback_data="cmd_precios")]
            ]
            await query.edit_message_text("🎧 *MÚSICA* \u2014 Tocá para ver precios:", parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        
        elif data == "precios_gaming":
            keyboard = [
                [InlineKeyboardButton("🟢 Xbox Game Pass", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-xbox-game-pass-con-impuestos-en-argentina")],
                [InlineKeyboardButton("🎮 PlayStation Plus", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-playstation-plus-con-impuestos-en-argentina")],
                [InlineKeyboardButton("🔥 EA Play", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-ea-play-con-impuestos-en-argentina")],
                [InlineKeyboardButton("🟣 Twitch", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-twitch-con-impuestos-en-argentina")],
                [InlineKeyboardButton("◀️ Volver", callback_data="cmd_precios")]
            ]
            await query.edit_message_text("🎮 *GAMING* \u2014 Tocá para ver precios:", parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        
        elif data == "precios_ia":
            keyboard = [
                [InlineKeyboardButton("🤖 ChatGPT Plus", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-chatgpt-con-impuestos-en-argentina")],
                [InlineKeyboardButton("✨ Claude Pro", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-claude-con-impuestos-en-argentina")],
                [InlineKeyboardButton("💙 GitHub Copilot", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-github-copilot-con-impuestos-en-argentina")],
                [InlineKeyboardButton("🌟 Midjourney", url="https://impuestito.org/suscripciones/cual-es-el-precio-de-midjourney-con-impuestos-en-argentina")],
                [InlineKeyboardButton("◀️ Volver", callback_data="cmd_precios")]
            ]
            await query.edit_message_text("🤖 *INTELIGENCIA ARTIFICIAL* \u2014 Tocá para ver precios:", parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        
        elif data == "precios_tips":
            user_id = query.from_user.id
            fijos = await db.get_suscripciones_usuario(user_id)
            
            if not fijos:
                msg = "💡 *TIPS DE AHORRO*\n\n"
                msg += "No tenés suscripciones cargadas.\n"
                msg += "Cargá tus gastos fijos con:\n"
                msg += "`/fijo Netflix 5000 10`\n\n"
                msg += "Y después volvé acá para tips personalizados."
                await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("◀️ Volver", callback_data="cmd_precios")]]))
                return
            
            # Armar lista de suscripciones para la IA
            lista_fijos = "\n".join([f"- {f[1]}: ${f[2]:,.0f}/mes (se cobra el día {f[3]})" for f in fijos])
            total_fijos = sum(f[2] for f in fijos)
            
            try:
                prompt = prompt_tips_ahorro(lista_fijos, total_fijos)
                response = await asyncio.to_thread(
                    client.models.generate_content, model=MODEL_NAME, contents=prompt
                )
                await rate_limiter.registrar_uso(user_id)
                
                msg = f"💡 *TIPS DE AHORRO*\n"
                msg += "─" * 22 + "\n"
                msg += f"💰 Gastás *${total_fijos:,.0f}/mes* en suscripciones\n\n"
                msg += response.text
                
                await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("◀️ Volver", callback_data="cmd_precios")]]))
            except Exception as e:
                logger.error(f"Error tips ahorro: {e}")
                await query.edit_message_text("La IA no responde ahora. Probá más tarde.", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("◀️ Volver", callback_data="cmd_precios")]]))
        
        elif data == "destruir_consultoria":
            # Autodestrucción del chat de consultoría por privacidad
            chat_id = query.message.chat_id
            
            # 1. Borrar el mensaje de la IA (el que tiene el botón)
            try:
                await query.message.delete()
            except Exception as e:
                logger.warning(f"No se pudo borrar mensaje IA de consultoría: {e}")
            
            # 2. Intentar borrar el mensaje original del usuario
            msg_user_id = context.user_data.get('consultoria_msg_user')
            if msg_user_id:
                try:
                    await context.bot.delete_message(chat_id=chat_id, message_id=msg_user_id)
                except Exception as e:
                    logger.debug(f"No se pudo borrar mensaje usuario consultoría: {e}")
            
            # Limpiar datos temporales
            context.user_data.pop('consultoria_msg_ia', None)
            context.user_data.pop('consultoria_msg_user', None)
            
            # Confirmar al usuario
            await context.bot.send_message(
                chat_id=chat_id,
                text="🔒 Chat de consultoría eliminado por privacidad.",
                reply_markup=teclado_navegacion(),
            )
    
    except Exception as e:
        logger.error(f"Error en botón {data}: {e}")
        try:
            await query.edit_message_text(f"❌ Ocurrió un error. Probá con el comando directo.", reply_markup=teclado_volver())
        except Exception:
            logger.debug(f"No se pudo editar mensaje de error para botón {data}")

