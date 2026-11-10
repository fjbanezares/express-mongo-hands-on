/**
 * 04_asynchronous_mongo.js
 * 
 * ¿Cómo funciona la asincronía en Node.js?
 * 
 * En Node.js:
 * 1. JavaScript es monohilo en ejecución de código (Single Thread).
 * 2. El motor V8 se apoya en 'libuv', una librería C/C++ multiplataforma que gestiona
 *    el Event Loop y las operaciones I/O del sistema operativo (epoll en Linux, kqueue en macOS, IOCP en Windows).
 * 3. Al hacer:
 *        const resultado = await coleccion.find(...);
 *    V8 suspende la función 'async' actual, empaqueta el callback en una Microtask
 *    y cede el Event Loop. El socket de red de MongoDB lee los bytes en segundo plano.
 * 4. Cuando los bytes del BSON llegan por el socket TCP (puerto 27017), el kernel del SO
 *    notifica a libuv, libuv coloca la respuesta en la cola de microtareas y V8 reanuda
 *    la función exactamente donde se quedó.
 * 5. Concurrencia masiva: Con Promise.all() podemos lanzar 5 consultas a MongoDB en paralelo
 *    en un solo hilo, tardando el tiempo de la más lenta en vez de la suma de todas.
 * 
 * Ejecución:
 *   node materiales_didacticos/mongo/theory/04_asynchronous_mongo.js
 */

console.log("================================================================================");
console.log("🟢 [NODE.JS] EL EVENT LOOP Y LA ASINCRONÍA NATIVA DE LIBUV");
console.log("================================================================================");

// Simulador pedagógico de peticiones asíncronas no bloqueantes a MongoDB
function simularConsultaMongoNode(idConsulta, delayMs) {
  return new Promise((resolve) => {
    console.log(`  [Node Loop] ⏳ Enviando query #${idConsulta} por socket TCP a MongoDB...`);
    setTimeout(() => {
      console.log(`  [Node Loop] ✅ BSON recibido de MongoDB para query #${idConsulta} (${delayMs}ms)`);
      resolve({ id: idConsulta, coleccion: "tareas", status: "OK", delayMs });
    }, delayMs);
  });
}

async function demostrarConcurrenciaNode() {
  console.log("\n1. Demostración Secuencial (await uno tras otro - Lento):");
  const tInicioSec = Date.now();
  await simularConsultaMongoNode("Sec-A", 300);
  await simularConsultaMongoNode("Sec-B", 300);
  console.log(`   -> Tiempo total secuencial: ${Date.now() - tInicioSec} ms (suma de tiempos)\n`);

  console.log("2. Demostración Concurrente (Promise.all - Rápido):");
  console.log("   -> El Event Loop dispara todas las consultas simultáneamente sin bloquear el hilo principal.");
  const tInicioConc = Date.now();
  const resultados = await Promise.all([
    simularConsultaMongoNode("Conc-1", 400),
    simularConsultaMongoNode("Conc-2", 200),
    simularConsultaMongoNode("Conc-3", 350)
  ]);
  console.log(`   -> Tiempo total concurrente: ${Date.now() - tInicioConc} ms (tiempo del más lento)`);
  console.log("   -> Resultados recibidos:", resultados.map(r => r.id));
}

demostrarConcurrenciaNode().then(() => {
  console.log("\nDemostración Node.js finalizada.");
});

