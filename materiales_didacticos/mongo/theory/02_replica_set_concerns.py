#!/usr/bin/env python3
"""
02_replica_set_concerns.py

Alta Disponibilidad, Consistencia Eventual y Ajuste Fino en MongoDB con Python (PyMongo):
- Replica Sets: Nodos Primario y Secundarios con elecciones automáticas de líder.
- Consistencia Eventual (Eventual Consistency): Replicación asíncrona entre réplicas.
- Modulación mediante:
    * WriteConcern: w=1, w='majority', j=True, wtimeout=5000
    * ReadConcern: level='local', level='available', level='majority', level='linearizable'
    * ReadPreference: PRIMARY, SECONDARY_PREFERRED, NEAREST

Ejecución:
    python3 02_replica_set_concerns.py
"""

import os
import sys
from datetime import datetime

try:
    from pymongo import MongoClient
    from pymongo.write_concern import WriteConcern
    from pymongo.read_concern import ReadConcern
    from pymongo.read_preferences import ReadPreference
    from pymongo.errors import PyMongoError
except ImportError:
    print("Error: Requiere pymongo. Instálalo con: pip install pymongo")
    sys.exit(1)


def demostracion_concerns_python():
    print("================================================================================")
    print("🐍 [PYTHON] ALTA DISPONIBILIDAD Y CONSISTENCIA MODULABLE CON PYMONGO")
    print("================================================================================")

    print("\n--- MATRIZ DE DECISIÓN ARQUITECTÓNICA ---")
    print("1. PERFIL 'FAST & AVAILABLE' (Eventual Consistency / Redes Sociales / Logs):")
    print("   * Write Concern: w=1 (Retorna inmediatamente cuando el Primario escribe en memoria)")
    print("   * Read Concern: level='local' (Lecturas instantáneas)")
    print("   * Read Preference: SECONDARY_PREFERRED (Descarga de tráfico hacia nodos réplica)")
    print("   * Consecuencia: Altísimo rendimiento, pero riesgo de leer datos desactualizados (stale data).")

    print("\n2. PERFIL 'STRICT & CONSISTENT' (Consistencia Fuerte / Finanzas / E-commerce):")
    print("   * Write Concern: w='majority', j=True, wtimeout=5000 (Espera a la mayoría y a disco físico)")
    print("   * Read Concern: level='majority' (Solo lee datos confirmados por la mayoría)")
    print("   * Read Preference: PRIMARY (Evita desfases de replicación leyendo solo del líder)")
    print("   * Consecuencia: Cero pérdida de datos, pero mayor tiempo de respuesta (latencia de red).")

    # Configuración de los dos perfiles en Python:
    wc_rapido = WriteConcern(w=1)
    rc_rapido = ReadConcern(level="local")

    wc_seguro = WriteConcern(w="majority", j=True, wtimeout=5000)
    rc_seguro = ReadConcern(level="majority")

    print("\n--- OBJETOS CONFIGURED EN PYMONGO ---")
    print(f"✅ WriteConcern Rápido: {wc_rapido.document}")
    print(f"✅ ReadConcern Rápido:   {rc_rapido.level}")
    print(f"✅ WriteConcern Seguro: {wc_seguro.document}")
    print(f"✅ ReadConcern Seguro:   {rc_seguro.level}")

    uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/?replicaSet=rs0")

    client = None
    try:
        # Instanciamos el cliente PyMongo con el perfil consistente
        client = MongoClient(
            uri,
            serverSelectionTimeoutMS=2000,
            read_preference=ReadPreference.PRIMARY
        )

        db = client["banco_seguro"]
        # Aplicamos write_concern y read_concern a nivel de colección
        cuentas = db.get_collection(
            "cuentas",
            write_concern=wc_seguro,
            read_concern=rc_seguro
        )

        print("\nIntentando ejecutar inserción transaccional segura...")
        doc = {
            "titular": "Beatriz Soler",
            "saldo": 24500.00,
            "moneda": "EUR",
            "fecha": datetime.utcnow()
        }
        res = cuentas.insert_one(doc)
        print(f"Documento persistido con quórum mayoritario. ID: {res.inserted_id}")

    except PyMongoError as err:
        print("\nℹ️  Nota pedagógica (Simulación en entorno local sin Atlas):")
        print(f"   [PyMongo Catch] {type(err).__name__}: {err}")
        print("   -> En producción con MongoDB Atlas, el Replica Set gestiona el quórum automáticamente.")

    finally:
        if client:
            client.close()
            print("\nConexión PyMongo finalizada.")


if __name__ == "__main__":
    demostracion_concerns_python()

