//jshint esversion:8

// ==============================================================================
// awcodePostgres.js - Versión PostgreSQL de nuestra To-Do List
// ==============================================================================
// En esta versión sustituimos MongoDB/Mongoose por PostgreSQL (motor relacional SQL).
// Mantenemos EXACTAMENTE las mismas vistas EJS (views/list.ejs) y la misma lógica de negocio,
// demostrando cómo cambia la capa de persistencia entre un modelo NoSQL y uno SQL.
// ==============================================================================

// Importación de módulos NPM necesarios
const express = require("express");       // Framework web para routing y manejo de peticiones HTTP
const bodyParser = require("body-parser"); // Middleware para parsear datos de formularios (req.body)
const { Pool } = require("pg");            // Cliente de PostgreSQL con pool de conexiones gestionadas
const _ = require("lodash");               // Utilidades de manipulación de texto (_.capitalize)

// Inicialización de la aplicación Express
const app = express();

// Configuración del motor de plantillas EJS y middlewares
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ==============================================================================
// 1. Cadena de conexión a PostgreSQL (Hardcodeada según requerimiento)
// ==============================================================================
// NOTA DOCENTE: Aunque en producción SIEMPRE se debe usar process.env.DATABASE_URL,
// aquí dejamos una URL hardcodeada de ejemplo para fines didácticos e ilustrativos.
// Si vas a probar en local, reemplaza con tu usuario, password y base de datos local.
// Si usas un servicio Cloud (Neon, Supabase, Render PostgreSQL), pega tu connection string aquí.
const POSTGRES_URI = "postgres://postgres:Pepito123@localhost:5432/todolistDB";

// Determinamos si se requiere conexión segura SSL (habitual en PostgreSQL en la nube como Render/Neon/Supabase)
const isProductionOrCloud = process.env.NODE_ENV === "production" || 
    (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost")) ||
    (!POSTGRES_URI.includes("localhost"));

// Creación del Pool de conexiones a PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || POSTGRES_URI,
    ssl: isProductionOrCloud ? { rejectUnauthorized: false } : false
});

// Elementos por defecto para sembrar la lista cuando se encuentra vacía
const defaultItems = [
    { name: "Welcome to your todolist!" },
    { name: "Hit the + button to add a new item." },
    { name: "<-- Hit this to delete an item." }
];

// ==============================================================================
// 2. Inicialización de la Base de Datos (DDL - Creación condicional de tablas)
// ==============================================================================
// En el modelo relacional, en lugar de colecciones de documentos JSON, creamos tablas
// estructuradas con clave primaria (PRIMARY KEY) y clave foránea (FOREIGN KEY) 
// que relacionan cada tarea con la lista a la que pertenece (relación 1 a N).
// Usamos "CREATE TABLE IF NOT EXISTS" para que solo se ejecute al desplegar / arrancar
// si las tablas aún no han sido creadas previamente.
async function initializeDB() {
    const createTablesQuery = `
        -- Tabla de listas (ej: 'Today', 'Trabajo', 'Estudio')
        CREATE TABLE IF NOT EXISTS lists (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        );

        -- Tabla de tareas individuales vinculadas a una lista
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE
        );
    `;

    await pool.query(createTablesQuery);
    console.log("✅ Tablas de PostgreSQL comprobadas/creadas correctamente (lists e items).");
}

// ==============================================================================
// 3. Rutas de la Aplicación (CRUD sobre PostgreSQL)
// ==============================================================================

// RUTA 1: GET / (Lista principal "Today")
app.get("/", async (req, res) => {
    try {
        // 1. Buscamos o creamos la lista principal "Today" en la tabla 'lists'
        let listResult = await pool.query("SELECT * FROM lists WHERE name = $1", ["Today"]);
        let listId;

        if (listResult.rows.length === 0) {
            // Si no existe, la creamos
            const insertResult = await pool.query(
                "INSERT INTO lists (name) VALUES ($1) RETURNING id",
                ["Today"]
            );
            listId = insertResult.rows[0].id;
        } else {
            listId = listResult.rows[0].id;
        }

        // 2. Consultamos las tareas asociadas a esta lista
        // IMPORTANTE: Mapeamos 'id AS _id' para que la vista 'list.ejs' (que busca item._id)
        // funcione exactamente igual que con MongoDB sin tener que modificar el archivo HTML/EJS.
        const itemsResult = await pool.query(
            "SELECT id AS _id, name FROM items WHERE list_id = $1 ORDER BY id ASC",
            [listId]
        );

        // 3. Si la lista no tiene tareas, sembramos las tareas por defecto
        if (itemsResult.rows.length === 0) {
            for (const item of defaultItems) {
                await pool.query(
                    "INSERT INTO items (name, list_id) VALUES ($1, $2)",
                    [item.name, listId]
                );
            }
            res.redirect("/");
        } else {
            // Renderizamos la plantilla 'list.ejs' con los datos procedentes de PostgreSQL
            res.render("list", { listTitle: "Today", newListItems: itemsResult.rows });
        }
    } catch (err) {
        console.error("Error al obtener las tareas de Today:", err);
        res.status(500).send("Error al recuperar los elementos de PostgreSQL");
    }
});

// RUTA 2: GET /:customListName (Listas personalizadas dinámicas)
app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    try {
        // Buscamos si la lista personalizada ya existe en la base de datos
        let listResult = await pool.query("SELECT * FROM lists WHERE name = $1", [customListName]);

        if (listResult.rows.length === 0) {
            // Si no existe, creamos la lista en la tabla 'lists' y le insertamos las tareas por defecto
            const insertListResult = await pool.query(
                "INSERT INTO lists (name) VALUES ($1) RETURNING id",
                [customListName]
            );
            const listId = insertListResult.rows[0].id;

            for (const item of defaultItems) {
                await pool.query(
                    "INSERT INTO items (name, list_id) VALUES ($1, $2)",
                    [item.name, listId]
                );
            }
            // Patrón Post-Redirect-Get hacia la nueva lista creada
            res.redirect("/" + customListName);
        } else {
            // Si la lista ya existe, recuperamos sus tareas
            const listId = listResult.rows[0].id;
            const itemsResult = await pool.query(
                "SELECT id AS _id, name FROM items WHERE list_id = $1 ORDER BY id ASC",
                [listId]
            );
            res.render("list", { listTitle: customListName, newListItems: itemsResult.rows });
        }
    } catch (err) {
        console.error("Error al buscar la lista personalizada:", err);
        res.status(500).send("Error al encontrar la lista en PostgreSQL");
    }
});

// RUTA 3: POST / (Crear una nueva tarea en la lista indicada)
app.post("/", async (req, res) => {
    const itemName = req.body.newItem; // Texto de la tarea introducido por el usuario
    const listName = req.body.list;    // Nombre de la lista ('Today' o lista personalizada)

    try {
        // 1. Obtenemos el ID de la lista donde queremos insertar
        let listResult = await pool.query("SELECT id FROM lists WHERE name = $1", [listName]);
        let listId;

        if (listResult.rows.length === 0) {
            const newListResult = await pool.query(
                "INSERT INTO lists (name) VALUES ($1) RETURNING id",
                [listName]
            );
            listId = newListResult.rows[0].id;
        } else {
            listId = listResult.rows[0].id;
        }

        // 2. Insertamos la nueva tarea en la tabla 'items' vinculada al 'listId'
        // Usamos consultas parametrizadas ($1, $2) para prevenir SQL Injection
        await pool.query(
            "INSERT INTO items (name, list_id) VALUES ($1, $2)",
            [itemName, listId]
        );

        // 3. Redirigimos a la ruta correspondiente (Patrón PRG)
        if (listName === "Today") {
            res.redirect("/");
        } else {
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.error("Error al guardar la tarea:", err);
        res.status(500).send("Error al guardar el elemento en PostgreSQL");
    }
});

// RUTA 4: POST /delete (Eliminar tarea por su ID)
app.post("/delete", async (req, res) => {
    const checkedItemId = req.body.checkbox; // ID numérico de la tarea a eliminar
    const listName = req.body.listName;       // Lista a la que pertenece la tarea

    try {
        // En PostgreSQL, el ID es la clave primaria (PRIMARY KEY) en la tabla 'items'.
        // Una simple sentencia DELETE borra la fila de forma atómica y segura.
        await pool.query("DELETE FROM items WHERE id = $1", [checkedItemId]);

        if (listName === "Today") {
            res.redirect("/");
        } else {
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.error("Error al eliminar la tarea:", err);
        res.status(500).send("Error al eliminar el elemento en PostgreSQL");
    }
});

// RUTA 5: GET /about (Página informativa estática)
app.get("/about", (req, res) => {
    res.render("about");
});

// ==============================================================================
// 4. Arranque del Servidor con Inicialización Previa de Tablas
// ==============================================================================
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Aseguramos la existencia de las tablas en PostgreSQL antes de abrir el puerto
        await initializeDB();

        app.listen(PORT, function () {
            console.log(`🚀 Servidor iniciado con PostgreSQL en el puerto ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Error fatal al conectar o inicializar PostgreSQL:", err);
        process.exit(1);
    }
}

// Arrancamos el servidor
startServer();
