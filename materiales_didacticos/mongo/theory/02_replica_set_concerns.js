/**
 * 02_replica_set_concerns.js
 * 
 * Alta Disponibilidad, Consistencia Eventual y Ajuste Fino en MongoDB:
 * - Replica Sets: 1 Primario (Escrituras) + N Secundarios (Lecturas / Copias) + Elecciones automáticas.
 * - Teorema CAP: MongoDB opera por defecto como un sistema AP con Consistencia Eventual (asíncrona).
 * - Modulación de Consistencia:
 *    * writeConcern: w=0, w=1, w="majority", j=true, wtimeout
 *    * readConcern: "local", "available", "majority", "linearizable"
 * 
 * Ejecución:
 *   node 02_replica_set_concerns.js
 */

const { MongoClient, ReadConcern, WriteConcern } = require("mongodb");

console.log("================================================================================");
console.log("🌐 [NODE.JS] ALTA DISPONIBILIDAD Y CONSISTENCIA MODULABLE EN REPLICA SETS");
console.log("================================================================================");

// 1. Cadena de conexión parametrizada con opciones de Replica Set y Concerns
// En producción con Atlas, la URL incluye el replica set: mongodb+srv://...
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/?replicaSet=rs0";

async function explicarYEjecutarConcerns() {
  console.log("\n--- TEORÍA APLICADA: EL DILEMA VELOCIDAD VS CONSISTENCIA ---");
  console.log("1. Si priorizas DISPONIBILIDAD (Lecturas/Escrituras ultra-rápidas):");
  console.log("   -> writeConcern: { w: 1 } (responde en cuanto el Primario escribe en memoria)");
  console.log("   -> readConcern: 'local' (lee del nodo más cercano, pero puede haber retraso de réplica)");
  console.log("   -> Riesgo: Si el primario cae antes de replicar, los datos se pierden en un 'rollback'.");

  console.log("\n2. Si priorizas CONSISTENCIA ESTRICTA (Cero pérdida de datos / Transacciones bancarias):");
  console.log("   -> writeConcern: { w: 'majority', j: true } (espera a que la mayoría de nodos confirmen en disco)");
  console.log("   -> readConcern: 'majority' o 'linearizable' (garantiza que lo leído está consolidado)");
  console.log("   -> Coste: Mayor latencia por el round-trip de confirmación entre servidores.");

  // Demostración de configuración de cliente con MongoClient
  const clientRapido = new MongoClient(uri, {
    writeConcern: { w: 1 },
    readConcern: { level: "local" },
    readPreference: "secondaryPreferred", // Descarga lecturas a nodos secundarios
    serverSelectionTimeoutMS: 2000
  });

  const clientSeguro = new MongoClient(uri, {
    writeConcern: { w: "majority", j: true, wtimeout: 5000 },
    readConcern: { level: "majority" },
    readPreference: "primary", // Lecturas solo del primario para evitar inconsistencias
    serverSelectionTimeoutMS: 2000
  });

  console.log("\n--- CONFIGURACIONES PREPARADAS EN NODE.JS ---");
  console.log("✅ Cliente Rápido (AP):", {
    w: 1,
    readConcern: "local",
    readPreference: "secondaryPreferred"
  });
  console.log("✅ Cliente Seguro (Consistencia Fuerte):", {
    w: "majority",
    journaling: true,
    readConcern: "majority",
    readPreference: "primary"
  });

  try {
    console.log("\nIntentando verificar conexión con cliente seguro...");
    await clientSeguro.connect();
    const db = clientSeguro.db("banco");
    
    // Inserción con Write Concern estricto
    const cuentas = db.collection("cuentas", {
      writeConcern: { w: "majority", j: true }
    });

    const doc = await cuentas.insertOne({
      titular: "Ana Pérez",
      saldo: 15000.50,
      timestamp: new Date()
    });
    console.log("Transacción bancaria confirmada por la mayoría del Replica Set. ID:", doc.insertedId);

  } catch (error) {
    console.log("\nℹ️  Nota pedagógica (Simulación en entorno local):");
    console.log(`   [Info] ${error.name}: ${error.message}`);
    console.log("   -> En entornos sin clúster Atlas activo, la configuración está validada por la API del driver.");
  } finally {
    await clientRapido.close().catch(() => {});
    await clientSeguro.close().catch(() => {});
    console.log("\nRecursos cerrados ordenadamente.");
  }
}

explicarYEjecutarConcerns();

