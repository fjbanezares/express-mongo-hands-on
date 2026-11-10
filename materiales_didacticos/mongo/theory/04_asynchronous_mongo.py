#!/usr/bin/env python3
"""
04_asynchronous_mongo.py

¿Cómo trata Python la asincronía y las llamadas asíncronas a MongoDB?

1. LA DIFERENCIA HISTÓRICA ENTRE JAVASCRIPT Y PYTHON:
   - JavaScript nació para la web: TODO su modelo I/O es no bloqueante por defecto con libuv.
   - Python nació en 1991 como un lenguaje síncrono y bloqueante. Durante años, la concurrencia
     se lograba mediante hilos (threading) o procesos (multiprocessing).
   - El driver oficial clásico de MongoDB en Python, 'pymongo', ES SÍNCRONO Y BLOQUEANTE:
     si llamas a collection.find_one(), el hilo actual del procesador se detiene hasta que el socket
     de red responde.

2. LA REVOLUCIÓN DE ASYNCIO EN PYTHON MODERNO (Python 3.5+):
   - Python introdujo el módulo 'asyncio' con las palabras reservadas 'async def' y 'await'.
   - Python ahora tiene su propio EVENT LOOP (bucle de eventos) implementado en C sobre el módulo
     'selectors' (que usa kqueue en macOS y epoll en Linux, igual que libuv en Node.js).
   - Las funciones 'async def' son CORRUTINAS (generadores avanzados bajo el capó).
   - Al encontrar 'await', Python suspende la corrutina y cede el control al Event Loop.

3. ¿CÓMO HACEMOS LLAMADAS ASÍNCRONAS A MONGODB EN PYTHON?
   - Vía Oficial Asíncrona: Con la librería 'motor' (Motor es el driver asíncrono oficial
     desarrollado por el equipo de MongoDB sobre asyncio y PyMongo).
     Sintaxis:
         from motor.motor_asyncio import AsyncIOMotorClient
         client = AsyncIOMotorClient("mongodb+srv://...")
         doc = await client.db.collection.find_one({"name": "Alice"})

   - Vía Puente Moderno (Python 3.9+): Con 'asyncio.to_thread' delegando llamadas síncronas
     de PyMongo a un pool de hilos para no bloquear el Event Loop principal.

4. EL EQUIVALENTE A Promise.all():
   - En JavaScript:  await Promise.all([query1, query2, query3])
   - En Python:      await asyncio.gather(query1(), query2(), query3())

Ejecución:
    python3 materiales_didacticos/mongo/theory/04_asynchronous_mongo.py
"""

import asyncio
import time
from datetime import datetime

print("================================================================================")
print("🐍 [PYTHON] ASYNC / AWAIT, EL EVENT LOOP DE ASYNCIO Y MONGODB")
print("================================================================================")

# ============================================================================
# 1. SIMULADOR ASÍNCRONO DEL EVENT LOOP DE PYTHON
# ============================================================================

async def simular_query_mongo_python(id_query: str, delay_segundos: float) -> dict:
    """
    Corrutina asíncrona: Al hacer 'await asyncio.sleep', el hilo principal de Python
    NO se congela: libera el Event Loop para que otras tareas avancen.
    """
    print(f"  [Asyncio Loop] ⏳ Enviando query '{id_query}' por socket TCP a MongoDB...")
    
    # 'await' pausa esta corrutina y devuelve el control al bucle de eventos
    # En un driver real como 'motor', aquí se espera a que el descriptor de socket TCP
    # tenga datos disponibles mediante kqueue/epoll.
    await asyncio.sleep(delay_segundos)
    
    print(f"  [Asyncio Loop] ✅ BSON recibido de MongoDB para '{id_query}' ({int(delay_segundos*1000)}ms)")
    return {"query": id_query, "estado": "OK", "duracion_ms": int(delay_segundos * 1000)}


# ============================================================================
# 2. COMPARATIVA: SECUENCIAL VS CONCURRENTE (asyncio.gather)
# ============================================================================

async def main():
    print("\n--- 1. EJECUCIÓN SECUENCIAL (Uno tras otro con 'await') ---")
    t0 = time.perf_counter()
    res1 = await simular_query_mongo_python("Query-A", 0.3)
    res2 = await simular_query_mongo_python("Query-B", 0.3)
    t_secuencial = (time.perf_counter() - t0) * 1000
    print(f"   -> Tiempo total secuencial: {t_secuencial:.1f} ms (suma obligatoria)\n")

    print("--- 2. EJECUCIÓN CONCURRENTE EN PARALELO (asyncio.gather - El Promise.all de Python) ---")
    print("   -> Dispara todas las consultas a MongoDB en el mismo ciclo del Event Loop:")
    t1 = time.perf_counter()
    
    # asyncio.gather empaqueta las corrutinas y las lanza simultáneamente
    resultados = await asyncio.gather(
        simular_query_mongo_python("Query-1", 0.4),
        simular_query_mongo_python("Query-2", 0.2),
        simular_query_mongo_python("Query-3", 0.35)
    )
    t_concurrente = (time.perf_counter() - t1) * 1000
    print(f"   -> Tiempo total concurrente: {t_concurrente:.1f} ms (el tiempo de la más lenta)")
    print("   -> Datos consolidados:", [r["query"] for r in resultados])

    print("\n--- 3. EJEMPLO REAL DE CÓDIGO CON EL DRIVER OFICIAL 'motor' ---")
    codigo_motor = '''
    # Así se programa una API asíncrona real en Python con FastAPI y MongoDB:
    from motor.motor_asyncio import AsyncIOMotorClient
    import asyncio

    client = AsyncIOMotorClient("mongodb+srv://usuario:pass@cluster.mongodb.net/")
    db = client["todolistDB"]
    coleccion = db["lists"]

    async def obtener_lista(nombre_lista: str):
        # 'await' suspende la función y espera los bytes BSON sin bloquear el servidor
        lista = await coleccion.find_one({"name": nombre_lista})
        return lista

    async def insertar_tarea(nombre_lista: str, nueva_tarea: str):
        resultado = await coleccion.update_one(
            {"name": nombre_lista},
            {"$push": {"items": {"name": nueva_tarea}}}
        )
        return resultado.modified_count
    '''
    print(codigo_motor)

    print("--- 4. ¿QUÉ OCURRE CON EL FAMOSO GIL (GLOBAL INTERPRETER LOCK)? ---")
    print("💡 Muchas personas creen que el GIL impide la concurrencia en Python:")
    print("   - Falso para I/O: El GIL solo aplica a la ejecución de bytecode en CPU.")
    print("   - En operaciones de red como MongoDB, sockets y lectura de archivos,")
    print("     Python cede el control del Event Loop cooperativamente.")
    print("   - Un único proceso de Python con asyncio puede mantener 10.000 sockets")
    print("     abiertos a MongoDB consumiendo un solo hilo del procesador.")


if __name__ == "__main__":
    # asyncio.run() crea el Event Loop, registra las corrutinas y lo ejecuta hasta completarse
    asyncio.run(main())

