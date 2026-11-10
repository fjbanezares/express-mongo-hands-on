/**
 * 03_normalized_vs_denormalized.js
 * 
 * Implementación en Node.js de la diapositiva:
 * "Query in normalized and denormalized case" (Mongo DB.pdf, pág 63)
 * 
 * Comparativa entre:
 * 1. Modelo Normalizado (Referencias con $lookup aggregation - estilo SQL JOIN)
 * 2. Modelo Desnormalizado / Embebido (Documentos autocontenidos - lectura directa O(1))
 * 3. Composición To-Do List (items embebidos dentro de listSchema)
 * 
 * Ejecución:
 *   node 03_normalized_vs_denormalized.js
 */

console.log("================================================================================");
console.log("📑 [NODE.JS] QUERY IN NORMALIZED AND DENORMALIZED CASE (Mongo DB.pdf - Slide 63)");
console.log("================================================================================");

// 1. ESTRUCTURAS DE DATOS EN MEMORIA PARA COMPRENDER LA TEORÍA

// A) MODELO NORMALIZADO (Colecciones separadas)
const coleccionAutores = [
  { _id: "auth_01", name: "Alice Walker", email: "alice@email.com" },
  { _id: "auth_02", name: "Gabriel García Márquez", email: "gabo@email.com" }
];

const coleccionPostsNormalizados = [
  { _id: "post_101", title: "Introducción a NoSQL", content: "Texto...", author_id: "auth_01" },
  { _id: "post_102", title: "Cien Años de Soledad", content: "Texto...", author_id: "auth_02" }
];

// B) MODELO DESNORMALIZADO / EMBEBIDO (Documento autocontenido)
const coleccionPostsDesnormalizados = [
  {
    _id: "post_201",
    title: "Introducción a NoSQL",
    content: "Texto...",
    author: {
      name: "Alice Walker",
      email: "alice@email.com"
    }
  }
];

// C) MODELO TO-DO LIST (Arrays de Subdocumentos embebidos - Slide 69)
const listaTodoList = {
  _id: "list_501",
  name: "Hoy",
  items: [
    { _id: "item_01", name: "Comprar leche" },
    { _id: "item_02", name: "Estudiar MongoDB con Node y Python" }
  ]
};

console.log("\n--- CASO 1: QUERY EN MODELO NORMALIZADO ($lookup / JOIN) ---");
console.log(`
Código MongoDB Query ($lookup):
db.posts.aggregate([
  {
    $lookup: {
      from: "authors",
      localField: "author_id",
      foreignField: "_id",
      as: "author_details"
    }
  },
  {
    $project: {
      title: 1,
      author_name: "$author_details.name"
    }
  }
]);
`);

// Simulación de la ejecución de $lookup en Node.js
const resultadoLookup = coleccionPostsNormalizados.map(post => {
  const autor = coleccionAutores.find(a => a._id === post.author_id);
  return {
    title: post.title,
    author_name: autor ? autor.name : "Desconocido"
  };
});
console.log("Resultado de la consulta simulada:", resultadoLookup);
console.log("-> Trade-off: Consistencia garantizada, pero requiere unir colecciones ($lookup) en memoria.");

console.log("\n--- CASO 2: QUERY EN MODELO DESNORMALIZADO (Lectura directa O(1)) ---");
console.log(`
Código MongoDB Query:
db.posts.find({}, { title: 1, "author.name": 1 });
`);

// Simulación de lectura directa
const resultadoDirecto = coleccionPostsDesnormalizados.map(post => ({
  title: post.title,
  author_name: post.author.name
}));
console.log("Resultado de la consulta directa:", resultadoDirecto);
console.log("-> Trade-off: Lectura instantánea a máxima velocidad, pero si Alice cambia su email, hay que actualizar N posts.");

console.log("\n--- CASO 3: TO-DO LIST CON ARRAYS EMBEBIDOS (Slide 69) ---");
console.log("Estructura de awcodeAtlas.js:");
console.log(JSON.stringify(listaTodoList, null, 2));
console.log("-> Al buscar la lista 'Hoy', las tareas vienen en el mismo paquete BSON sin joins.");

