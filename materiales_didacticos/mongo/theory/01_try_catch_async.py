#!/usr/bin/env python3
"""
01_try_catch_async.py

Comparativa pedagógica del manejo de excepciones en Python vs JavaScript:
En Python NO existe 'catch', se utiliza la palabra clave 'except'.
Además, Python incluye una cláusula 'else' muy potente que Node.js no tiene de forma nativa.

Estructura completa en Python:
    try:
        # Código susceptible de fallar
    except ErrorEspecifico as e:
        # Se ejecuta si ocurre ese tipo de error específico
    except Exception as e:
        # Se ejecuta ante cualquier otra excepción genérica
    else:
        # Se ejecuta ÚNICAMENTE si el bloque try terminó con ÉXITO (sin errores)
    finally:
        # Se ejecuta SIEMPRE (haya habido error o no), para limpieza de recursos

Ejecución:
    python3 01_try_catch_async.py
"""

import os
import sys
import asyncio
from datetime import datetime

# Intentamos importar pymongo (driver oficial de MongoDB en Python)
try:
    import pymongo
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
except ImportError:
    print("⚠️  Advertencia: 'pymongo' no está instalado. Ejecuta: pip install pymongo")
    sys.exit(1)


# ============================================================================
# 1. ENFOQUE CLÁSICO SÍNCRONO CON pymongo Y try / except / else / finally
# ============================================================================

def demonstrar_try_except_python():
    print("=================================================")
    print("🐍 [PYTHON SÍNCRONO] try / except / else / finally")
    print("=================================================")
    
    uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/test_db")
    client = None

    try:
        print("1. Intentando conectar a la base de datos...")
        # Establecemos un timeout corto (2000 ms) para no bloquearnos si no hay BD local
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=2000)
        
        # El comando 'ping' fuerza la conexión real inmediata
        client.admin.command('ping')
        print("2. Conexión exitosa a MongoDB desde Python.")

        db = client["universidad"]
        coleccion = db["estudiantes"]

        # Insertamos un documento BSON (representado como un diccionario de Python)
        nuevo_estudiante = {
            "nombre": "Carlos Mendoza",
            "matricula": "2026-PY-101",
            "fecha": datetime.utcnow()
        }
        resultado = coleccion.insert_one(nuevo_estudiante)
        print(f"3. Documento insertado con _id: {resultado.inserted_id}")

    except (ConnectionFailure, ServerSelectionTimeoutError) as err_red:
        # Captura específica de errores de red / timeout en MongoDB
        print("❌ [EXCEPT RED] No se pudo contactar con el clúster MongoDB:")
        print(f"   -> Tipo: {type(err_red).__name__}")
        print(f"   -> Detalle: {err_red}")
        print("   -> El script continúa ejecutándose sin colapsar.")

    except Exception as err_general:
        # Captura comodín para cualquier otro error imprevisto
        print(f"❌ [EXCEPT GENERAL] Error inesperado: {err_general}")

    else:
        # ¡Característica exclusiva de Python frente a JavaScript!
        # Este bloque se ejecuta SI Y SOLO SI no hubo ninguna excepción en el bloque try
        print("✅ [ELSE] Todo salió a la perfección. Ninguna excepción fue lanzada.")

    finally:
        # Limpieza obligatoria: se ejecuta SIEMPRE
        print("4. [FINALLY] Bloque de limpieza ejecutado.")
        if client:
            client.close()
            print("   -> Cliente PyMongo desconectado limpiamente.")


# ============================================================================
# 2. ENFOQUE ASÍNCRONO EN PYTHON CON asyncio Y await + try / except
# ============================================================================

async def tarea_asincrona_con_await(id_tarea: int, simular_error: bool = False):
    """
    Simula una operación de red/base de datos con I/O asíncrono no bloqueante.
    En Python moderno se define con 'async def' y se consume con 'await'.
    """
    print(f"   [Async Worker {id_tarea}] Tarea iniciada...")
    await asyncio.sleep(0.5)  # Simula espera de red sin bloquear el Event Loop
    
    if simular_error:
        raise ValueError(f"Fallo simulado en la tarea {id_tarea}")
    
    return f"Resultado de tarea {id_tarea} OK"


async def main_asyncio():
    print("\n=================================================")
    print("⚡ [PYTHON ASYNCIO] async / await + try / except")
    print("=================================================")
    
    # Caso 1: Operación asíncrona exitosa
    try:
        resultado = await tarea_asincrona_con_await(id_tarea=1, simular_error=False)
        print(f"1. Éxito asíncrono con await: {resultado}")
    except ValueError as e:
        print(f"Error capturado: {e}")

    # Caso 2: Operación asíncrona que lanza excepción
    try:
        print("2. Ejecutando tarea asíncrona propensa a fallos...")
        await tarea_asincrona_con_await(id_tarea=2, simular_error=True)
    except ValueError as e:
        print(f"❌ [EXCEPT CON AWAIT] Excepción interceptada con éxito:")
        print(f"   -> {e}")
    finally:
        print("3. [FINALLY ASYNC] Limpieza final de la corrutina.")


if __name__ == "__main__":
    # 1. Ejecutar demostración síncrona
    demonstrar_try_except_python()

    # 2. Ejecutar demostración asíncrona con el bucle de eventos de Python
    asyncio.run(main_asyncio())

