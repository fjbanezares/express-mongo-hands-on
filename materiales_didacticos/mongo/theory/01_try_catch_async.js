/**
 * 01_try_catch_async.js
 * 
 * Comparativa pedagógica del manejo de errores y concurrencia en Node.js:
 * 1. La era antigua: Callbacks anidados (Callback Hell) con error-first.
 * 2. La era intermedia: Promesas encadenadas (.then() / .catch()).
 * 3. El estándar moderno: async / await con bloques try { ... } catch (err) { ... } finally { ... }.
 * 
 * Ejecución:
 *   node 01_try_catch_async.js
 */

const { MongoClient } = require("mongodb");

// URI de prueba (o variable de entorno)
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/test_db";

// ============================================================================
// 1. LA EVOLUCIÓN HISTÓRICA: De Callbacks a Async/Await
// ============================================================================

// A) Estilo antiguo con Callbacks (DEPRECADO en Mongoose 5+/6+ y MongoDB Driver 4+)
// Item.insertMany(items, function(err, result) {
//     if (err) {
//         console.error("Error capturado por callback:", err);
//     } else {
//         console.log("Éxito:", result);
//     }
// });

// B) Estilo con Promesas encadenadas (.then / .catch)
// Item.insertMany(items)
//     .then(result => console.log("Insertado:", result))
//     .catch(err => console.error("Error capturado en promesa:", err));

// C) Estándar Moderno: async / await con try / catch / finally
async function demonstrarTryCatchNode() {
  console.log("=================================================");
  console.log("🟢 [NODE.JS] Demostración de try / catch / finally");
  console.log("=================================================");

  let client;

  try {
    console.log("1. Intentando conectar a la base de datos...");
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
    
    // El 'await' detiene la ejecución local de esta función,
    // liberando el Event Loop para atender otras peticiones
    await client.connect();
    console.log("2. Conexión exitosa a MongoDB.");

    const db = client.db("universidad");
    const coleccion = db.collection("estudiantes");

    // Simulamos una inserción
    const resultado = await coleccion.insertOne({
      nombre: "María García",
      matricula: "2026-ENG-402",
      fecha: new Date()
    });
    console.log("3. Documento insertado con _id:", resultado.insertedId);

  } catch (error) {
    // El bloque catch captura CUALQUIER error lanzado dentro del bloque try
    // (errores de red, timeouts, errores de sintaxis, duplicados de clave única, etc.)
    console.error("❌ [CATCH] Error capturado en Node.js:");
    console.error(`   -> Tipo: ${error.name}`);
    console.error(`   -> Mensaje: ${error.message}`);
    console.log("   -> El servidor NO crashea, la excepción se maneja con gracia.");

  } finally {
    // El bloque finally se ejecuta SIEMPRE: haya habido error o éxito
    // Ideal para liberar sockets, cerrar cursores o cerrar conexiones
    console.log("4. [FINALLY] Ejecución de tareas de limpieza final.");
    if (client) {
      await client.close();
      console.log("   -> Conexión con MongoDB cerrada ordenadamente.");
    }
  }
}

// Ejecutar función
demonstrarTryCatchNode().then(() => {
  console.log("Programa Node.js finalizado.");
});

