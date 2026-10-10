# Módulo 5: Despliegue con PostgreSQL vs MongoDB Atlas: Guía Práctica y Comparativa
> **Deconstrucción del despliegue relacional con `awcodePostgres.js`, inicialización DDL automática y análisis exhaustivo de ventajas e inconvenientes frente a MongoDB en entornos Cloud.**

---

📍 **Navegación:** [⬅️ Anterior: Módulo 4 (Balanceadores, DNS & Seguridad)](./04-balanceadores-dns-redes-y-seguridad.md) | [🏠 Volver al README Principal](./README.md) | [Siguiente: Módulo 6 (Despliegue Seguro & DevSecOps) ➡️](./06-despliegue-seguro-devsecops-owasp.md)

---

## 1. Introducción: El Desafío de la Persistencia Relacional

En los módulos anteriores construimos y desplegamos nuestra aplicación To-Do apoyándonos en **MongoDB Atlas** y el ODM **Mongoose** a través de [`awcodeAtlas.js`](./awcodeAtlas.js). En ese modelo, una lista personalizada es un documento BSON único que alberga en su interior un array de subdocumentos embebidos.

Para comprender a fondo la arquitectura de datos moderna, este repositorio incorpora la versión hermana basada en **PostgreSQL**: [`awcodePostgres.js`](./awcodePostgres.js).

```
┌────────────────────────────────────────┬────────────────────────────────────────┐
│      MODELO MONGODB (awcodeAtlas.js)   │     MODELO POSTGRESQL (awcodePostgres.js)│
├────────────────────────────────────────┼────────────────────────────────────────┤
│ • Documental NoSQL (BSON)              │ • Tablas Relacionales SQL (Filas/Cols) │
│ • 1 Documento = Lista + Tareas dentro  │ • 2 Tablas: lists (1) ── N items       │
│ • Subdocumentos con ObjectId(_id)      │ • Clave Primaria (id) + Clave Foránea  │
│ • Operador atómico $pull en arrays     │ • Sentencias DELETE con WHERE id = $1  │
│ • Mongoose compila modelos en runtime  │ • Cliente nativo 'pg' con Pool TCP     │
│ • Esquema dinámico e implícito         │ • Esquema rígido y explícito (DDL)     │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

El logro técnico y docente de esta implementación es que **las vistas frontend ([`views/list.ejs`](./views/list.ejs), [`views/about.ejs`](./views/about.ejs)) y los estilos CSS son exactamente los mismos**: el alumno puede alternar entre un backend NoSQL y uno SQL sin modificar una sola etiqueta HTML.

---

## 2. Anatomía de `awcodePostgres.js`: Cómo Funciona el Código

Analicemos los componentes clave de la implementación en PostgreSQL:

### A. El Pool de Conexiones (`pg.Pool`) y Soporte SSL en la Nube
En lugar de abrir y cerrar una conexión TCP en cada petición HTTP (lo que destruiría el rendimiento del servidor), utilizamos un **Pool de conexiones**:

```javascript
const { Pool } = require("pg");

const POSTGRES_URI = "postgres://postgres:Pepito123@localhost:5432/todolistDB";

// Detección automática de SSL para proveedores Cloud (Render, Neon, Supabase, RDS)
const isProductionOrCloud = process.env.NODE_ENV === "production" || 
    (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost")) ||
    (!POSTGRES_URI.includes("localhost"));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || POSTGRES_URI,
    ssl: isProductionOrCloud ? { rejectUnauthorized: false } : false
});
```

> [!TIP]
> **El detalle de `ssl: { rejectUnauthorized: false }` en la nube:**  
> Proveedores como Render PostgreSQL, Neon o Supabase exigen conexiones cifradas TLS/SSL pero utilizan certificados autofirmados o gestionados internamente por la plataforma. Si no se habilita esta opción en el Pool, la librería `pg` rechazará la conexión con un error `SELF_SIGNED_CERT_IN_CHAIN`.

---

### B. Inicialización DDL Automática: `CREATE TABLE IF NOT EXISTS`
En MongoDB, las colecciones se crean de forma invisible en cuanto insertamos el primer documento. En PostgreSQL, **las tablas deben existir antes de poder ejecutar cualquier consulta**:

```javascript
async function initializeDB() {
    const createTablesQuery = `
        -- 1. Tabla de Listas maestras (Today, Trabajo, etc.)
        CREATE TABLE IF NOT EXISTS lists (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        );

        -- 2. Tabla de Tareas vinculadas a una lista
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE
        );
    `;

    await pool.query(createTablesQuery);
    console.log("✅ Tablas de PostgreSQL comprobadas/creadas correctamente.");
}
```

#### ¿Por qué esto se ejecuta al arrancar el servidor?
1. **Idempotencia:** La cláusula `IF NOT EXISTS` garantiza que si la base de datos ya contiene las tablas creadas de un despliegue anterior, la sentencia finaliza limpiamente sin provocar errores ni alterar los datos existentes.
2. **Despliegue sin intervención manual:** En plataformas como Render o Railway, no necesitas abrir una consola SQL interactiva (*psql*) para crear las tablas a mano; el propio proceso de inicio de Node.js prepara la base de datos antes de llamar a `app.listen`.
3. **Integridad Referencial con `ON DELETE CASCADE`:** Si en el futuro se elimina una lista completa de la tabla `lists`, PostgreSQL borrará automáticamente todas las tareas asociadas en la tabla `items`, impidiendo que queden registros huérfanos.

---

### C. El Truco Maestro de Compatibilidad con EJS: `id AS _id`
En [`views/list.ejs`](./views/list.ejs), el formulario de borrado contiene este código:

```html
<input type="checkbox" name="checkbox" value="<%=item._id%>" onChange="this.form.submit()">
```

Mongoose genera automáticamente identificadores bajo la propiedad `_id`. En PostgreSQL, el identificador estándar se llama `id`.  
Para no tocar la plantilla HTML, resolvemos la discrepancia directamente en la consulta SQL mediante un alias:

```javascript
const itemsResult = await pool.query(
    "SELECT id AS _id, name FROM items WHERE list_id = $1 ORDER BY id ASC",
    [listId]
);
```

Al renombrar `id AS _id`, el objeto JavaScript resultante `{ _id: 1, name: "Comprar pan" }` encaja de forma transparente en la vista.

---

### D. CRUD Completo con Consultas Parametrizadas
Frente a Mongoose, donde usamos métodos de alto nivel (`Item.find()`, `List.findOneAndUpdate()`), en PostgreSQL ejecutamos consultas SQL nativas parametrizadas para garantizar máxima velocidad y protección:

```javascript
// CREATE (Insertar nueva tarea con clave foránea):
await pool.query(
    "INSERT INTO items (name, list_id) VALUES ($1, $2)",
    [itemName, listId]
);

// READ (Leer tareas filtradas por lista):
const items = await pool.query(
    "SELECT id AS _id, name FROM items WHERE list_id = $1 ORDER BY id ASC",
    [listId]
);

// DELETE (Eliminar por clave primaria):
await pool.query(
    "DELETE FROM items WHERE id = $1",
    [checkedItemId]
);
```

> [!CAUTION]
> **Seguridad contra SQL Injection:**  
> Jamás concatenes variables directamente en el string SQL (`"DELETE FROM items WHERE id = " + checkedItemId`).  
> Utilizar siempre los marcadores de posición `$1, $2` delega en el motor de PostgreSQL el escape y saneamiento de los valores, neutralizando cualquier intento de inyección de código.

---

## 3. Despliegue Práctico en la Nube: Render con PostgreSQL

Desplegar `awcodePostgres.js` en una plataforma moderna como Render requiere seguir estos pasos:

```
  [ 1. Crear Postgres Gestionado ]       ──▶ Render provisiona un clúster PostgreSQL
                 │                            con versión 15/16 y base de datos activa.
                 ▼
  [ 2. Obtener Internal / External URL ] ──▶ postgresql://user:password@dpg-xxxx/todolist_db
                 │
                 ▼
  [ 3. Crear Web Service en Render ]     ──▶ Conectado al repositorio GitHub.
                 │                            Build Command: npm install
                 │                            Start Command: npm run start:postgres
                 ▼
  [ 4. Configurar Environment Variables] ──▶ Añadir DATABASE_URL = <URL de PostgreSQL>
                 │
                 ▼
  [ 5. Auto-Migración y Arranque ]       ──▶ Node ejecuta initializeDB() ➔ crea tablas
                                              ➔ abre el puerto ➔ ¡App lista con HTTPS!
```

---

## 4. Matriz Comparativa: Despliegue de PostgreSQL vs MongoDB Atlas

Comparativa técnica de ambos motores en escenarios de producción real:

| Criterio de Despliegue / Operación | PostgreSQL (`awcodePostgres.js`) | MongoDB Atlas (`awcodeAtlas.js`) |
| :--- | :--- | :--- |
| **Puesta en Marcha Inicial** | Requiere definir tablas previas (`DDL`) o script de inicialización con tipos de datos. | Sin configuración previa de tablas; la primera escritura crea la colección. |
| **Modelo de Red y Conectividad** | Conexión TCP con Pool gestionado (`max: 10/20`). Exige cuidar el límite de conexiones en planes gratuitos. | Conexión HTTP/SRV con pool interno de Mongoose (`maxPoolSize`). Muy tolerante a conexiones distribuidas. |
| **Esquema y Cambios de Versión** | Rígido. Si agregas columnas (ej: `fecha_vencimiento`), requieres sentencias `ALTER TABLE` o migraciones (Knex, Prisma). | Flexible. Puedes empezar a guardar campos nuevos en documentos sin migrar la colección existente. |
| **Relaciones y Consultas Complejas** | Extraordinariamente rápido en `JOINs` entre tablas, filtros analíticos y agregaciones relacionales. | Ideal para jerarquías embebidas; las uniones entre colecciones separadas (`$lookup`) son más pesadas. |
| **Consistencia Transaccional (ACID)** | Nativa e incontestable en cada tabla y clave foránea (`ON DELETE CASCADE`, `UNIQUE`). | Soportada en réplicas, pero históricamente optimizada para consistencia eventual o a nivel de documento. |
| **Escalado en la Nube** | Típicamente escalado vertical (más RAM/CPU). El particionamiento (*sharding*) relacional es complejo. | Escalado horizontal nativo mediante *Replica Sets* y *Sharding* distribuido gestionado con un clic. |
| **Copias de Seguridad (Backups)** | Volcados con `pg_dump`/`pg_restore` y snapshots de volumen en disco. | Puntos de restauración automáticos continuos en la nube (*Point-In-Time Recovery*) en Atlas. |
| **Ecosistema y Herramientas** | Clientes universales: `psql`, DBeaver, pgAdmin, TablePlus. | MongoDB Compass, Atlas Cloud Web Shell, mongosh. |

---

## 5. Ventajas e Inconvenientes Resumidos

### Ventajas de Desplegar con PostgreSQL
1. **Rigor e Integridad Estricta:** La base de datos garantiza que no existan tareas huérfanas sin lista válida gracias a las claves foráneas.
2. **Estándar Universal:** SQL es el lenguaje más extendido de la industria informática; dominarlo aporta un valor profesional incalculable.
3. **Optimización de Almacenamiento:** Los registros relacionales ocupan significativamente menos espacio en disco y memoria que documentos BSON repetitivos con claves redundantes.

### Inconvenientes de Desplegar con PostgreSQL
1. **Mayor Fricción al Iterar:** Cualquier cambio de diseño requiere planificar migraciones DDL (`ALTER TABLE`).
2. **Límite Estricto de Conexiones:** En planes gratuitos de nubes como Render o Supabase, el número de conexiones simultáneas es reducido (20 a 100); requiere pools bien dimensionados o proxies como PgBouncer.

### Ventajas de Desplegar con MongoDB Atlas
1. **Desarrollo Ágil sin Fricción:** El modelo mental de objetos JavaScript encaja a la perfección con Node.js y Express.
2. **Subdocumentos Embebidos:** Leer una lista completa con todas sus tareas se resuelve en una sola lectura de documento sin necesidad de unir tablas.
3. **Infraestructura Gestionada de Élite:** Atlas ofrece monitoreo de métricas, réplicas y alertas sin necesidad de configurar servidores de base de datos.

### Inconvenientes de Desplegar con MongoDB Atlas
1. **Riesgo de Desorden:** Si no se usa Mongoose con disciplina, la falta de esquema estricto puede provocar documentos heterogéneos o datos corruptos.
2. **Complejidad en Relaciones Cruzadas:** No es la opción adecuada si en el futuro la app requiere relacionar usuarios, listas, permisos, etiquetas y categorías con integridad relacional cruzada.

---

## 6. Veredicto Final de Arquitectura

* Si buscas **máxima agilidad, desarrollo fluido con el stack JavaScript y prototipado rápido**, **MongoDB Atlas** es la opción ganadora.
* Si buscas **integridad de datos inquebrantable, reglas de negocio estrictas y preparación para modelos de datos corporativos complejos**, **PostgreSQL** es el estándar de referencia.

---

📍 **Navegación:** [⬅️ Anterior: Módulo 4 (Balanceadores, DNS & Seguridad)](./04-balanceadores-dns-redes-y-seguridad.md) | [🏠 Volver al README Principal](./README.md) | [Siguiente: Módulo 6 (Despliegue Seguro & DevSecOps) ➡️](./06-despliegue-seguro-devsecops-owasp.md)
