# Módulo 7: PostgreSQL: Arquitectura, Esquemas, Passwords e Inicialización
> **Guía maestra didáctica: anatomía del motor relacional (Instancia ➔ Base de datos ➔ Esquema ➔ Tabla), el debate y polisemia del término «Schema» (SQL vs Mongoose vs Avro), gestión de contraseñas de roles en pgAdmin y psql, el misterio de `search_path` y `public`, y automatización con Python sin exponer credenciales.**  
> *Basado en la colección de 6 infografías de [`postgres_schemas_passwords_init/`](./postgres_schemas_passwords_init/).*

---

📍 **Navegación:** [⬅️ Anterior: Módulo 6 (Despliegue Seguro, DevSecOps y Hardening)](./06-despliegue-seguro-devsecops-owasp.md) | [🏠 Volver al README Principal](../README.md)

---

![PostgreSQL: dónde vive cada cosa](postgres_schemas_passwords_init/PostgreSQL_%20d%C3%B3nde%20vive%20cada%20cosa-1.png)

---

## 1. ¿Dónde Vive Cada Cosa en PostgreSQL? La Metáfora del Edificio Residencial

Cuando venimos de bases de datos documentales como MongoDB o de entornos ligeros como SQLite, la organización interna de PostgreSQL puede resultar intimidante. PostgreSQL no es solo un gestor de ficheros con tablas; es un **sistema de gestión de bases de datos relacionales completo (RDBMS)** con una arquitectura jerárquica estricta.

Para entenderla sin memorizar conceptos abstractos, utilizaremos la **metáfora del edificio residencial**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. SERVIDOR / INSTANCIA (El Edificio Completo)                         │
│    PostgreSQL corriendo en un host (ej. localhost:5432 o AWS RDS).    │
│    Gestiona memoria global, procesos en segundo plano y conexiones.     │
│                                                                        │
│    ┌───────────────────────────────────┬───────────────────────────┐   │
│    │ 2. BASE DE DATOS: "todolistDB"    │ 2. BASE: "postgres"       │   │
│    │    (Apartamento 1: aislado)       │    (Apartamento 2: mant.) │   │
│    │                                   │                           │   │
│    │  ┌─────────────────────────────┐  │  ┌─────────────────────┐  │   │
│    │  │ 3. ESQUEMA: "public"        │  │  │ 3. ESQUEMA: "public"│  │   │
│    │  │    (Armario / Habitación)   │  │  │                     │  │   │
│    │  │                             │  │  │                     │  │   │
│    │  │  ┌───────────────────────┐  │  │  │                     │  │   │
│    │  │  │ 4. TABLAS:            │  │  │  │                     │  │   │
│    │  │  │    - lists            │  │  │  │                     │  │   │
│    │  │  │    - items            │  │  │  │                     │  │   │
│    │  │  │    (Cajones / Fichas) │  │  │  │                     │  │   │
│    │  │  └───────────────────────┘  │  │  └─────────────────────┘  │   │
│    │  └─────────────────────────────┘  │                           │   │
│    └───────────────────────────────────┴───────────────────────────┘   │
│                                                                        │
│ 5. ROLES / USUARIOS (El Conserje y los Inquilinos con sus Llaves)       │
│    Viven a nivel de TODO el edificio; pueden tener permisos para       │
│    entrar a unos apartamentos sí y a otros no.                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Los 5 Elementos Desglosados

1. **El Servidor / Instancia (El Edificio):**
   * Es el proceso de PostgreSQL en ejecución en tu sistema operativo (o contenedor Docker).
   * Escucha por defecto en el puerto `5432`.
   * En él residen la memoria compartida (*shared buffers*), los procesos de escritura en disco (*WAL writer*, *checkpointer*) y el catálogo global de usuarios y bases de datos.

2. **La Base de Datos (El Apartamento):**
   * Es una frontera de aislamiento total. Por defecto, en PostgreSQL **una consulta SQL dentro de `todolistDB` no puede hacer un JOIN directo con una tabla de otra base de datos** en la misma instancia sin extensiones especiales como `dblink` o `postgres_fdw`.
   * Cada aplicación o microservicio suele residir en su propia base de datos.

3. **El Esquema (El Armario o Habitación):**
   * Un espacio de nombres (*namespace*) dentro de la base de datos.
   * Por defecto, cada base de datos nueva viene con un armario preinstalado llamado **`public`**.
   * Puedes tener múltiples armarios (`public`, `ventas`, `tareas`, `auditoria`).

4. **Las Tablas (Los Cajones con Fichas):**
   * Las estructuras bidimensionales de filas y columnas donde residen los datos (`lists`, `items`).
   * Siempre pertenecen a un esquema (`public.items` o `tareas.items`).

5. **Los Roles / Usuarios (Las Personas y sus Llaves):**
   * En PostgreSQL, los usuarios y grupos se unifican bajo el concepto de **Rol**.
   * **Dato vital:** Los roles son **globales a toda la instancia** (a todo el edificio), no pertenecen a una base de datos concreta. Un rol `postgres` o `app_user` existe en todo el servidor, pero mediante permisos (`GRANT`) se le autoriza o deniega el acceso a un apartamento específico (`CONNECT ON DATABASE`) o a un armario específico (`USAGE ON SCHEMA`).

---

### ⚠️ El Gran Mito Aclarado: ¿Si no creo la base `todolistDB`, las tablas se crean en `public`?

> [!CAUTION]
> **Respuesta tajante: ¡NO!**  
> Si tu aplicación (`awcodePostgres.js`) intenta conectarse a una base de datos inexistente llamada `todolistDB`, PostgreSQL **rechaza de inmediato la conexión a nivel de red con un error fatal**:
> ```bash
> error: database "todolistDB" does not exist
> ```
> PostgreSQL jamás redirige silenciosamente una conexión huérfana al esquema `public` de otra base de datos.  
> `public` no es una base de datos de respaldo; `public` es un **esquema interno** que solo existe *dentro* de una base de datos ya creada. ¡No puedes meter un armario en un apartamento que no existe!

---

## 2. El Gran Embrollo del Término «Schema»: ¿Por qué se llama Esquema y no Namespace o Carpeta?

Uno de los mayores choques culturales para los desarrolladores modernos ocurre al saltar entre el ecosistema NoSQL/JavaScript y el estándar SQL relacional.

En **Mongoose**, **MongoDB**, **Apache Avro**, **Protobuf**, **JSON Schema** o **Zod**, cuando escuchas la palabra *Schema* piensas inmediatamente en esto:
```javascript
// En Mongoose o Avro: el "Schema" es el CONTRATO o FORMA de los datos
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
```
Aquí, el *Schema* define qué campos existen, qué tipos de datos tienen y qué reglas de validación aplican.

Sin embargo, cuando llegas a PostgreSQL y ves:
```sql
CREATE SCHEMA tareas;
```
¡No estás definiendo ningún campo, ningún tipo ni ninguna columna! Estás creando una **carpeta lógica vacía**.  
Y para definir las columnas tienes que hacer un `CREATE TABLE`.

Entonces surge la pregunta lógica: **¿Por qué en SQL lo llamaron `SCHEMA` en lugar de `NAMESPACE`, `FOLDER`, `MODULE` o `CONJUNTO`?**

---

### A. La Razón Histórica: ANSI/SPARC (1975) y el Estándar ANSI SQL-92

Para entenderlo, debemos viajar a los años 70 y 80, antes de que existieran la web, Java, JSON o C++ moderno.

1. **La Arquitectura de 3 Esquemas de ANSI/SPARC (1975):**  
   Los teóricos de bases de datos definieron que un sistema de base de datos tiene tres niveles de abstracción:
   * **Esquema Interno:** Cómo se colocan los bloques de bytes en el disco magnético.
   * **Esquema Conceptual:** El modelo lógico formal de toda la organización (entidades y relaciones).
   * **Esquema Externo:** La visión o subconjunto de datos que un usuario o departamento particular tiene derecho a ver.

2. **La Estandarización de SQL en 1992 (ANSI SQL-92):**  
   Cuando el comité internacional estandarizó SQL-92 (ISO/IEC 9075:1992), necesitaban una forma de dividir una base de datos en compartimentos administrativos para que distintos usuarios pudieran tener sus propias tablas sin interferir entre sí.  
   Adoptaron la jerarquía:
   $$\text{Catalog (Base de Datos)} \longrightarrow \text{Schema (Espacio de Nombres)} \longrightarrow \text{Table (Tabla)} \longrightarrow \text{Columns/Rows}$$
   En esa época, el término formal para referirse a la "porción del modelo de datos propiedad de un usuario" era **Schema**. Por ejemplo, el comando SQL original era:
   ```sql
   CREATE SCHEMA AUTHORIZATION usuario_ventas;
   ```

3. **¿Por qué no usaron la palabra `NAMESPACE`?**  
   En 1992, la palabra `namespace` **no era de uso general en la industria del software**.  
   * C++ no introdujo los `namespaces` en el estándar hasta la especificación ISO C++ de **1998**.
   * Java apareció en **1995** usando la palabra `package`.
   * C# y .NET nacieron en el año **2000**.  
   En 1992, la palabra técnica consagrada en la literatura académica de bases de datos era **Schema**.

---

### B. La Prueba Irrefutable: ¡Los propios creadores de PostgreSQL lo llaman `namespace` por dentro!

Si descargas el código fuente en lenguaje C del motor PostgreSQL (desarrollado originalmente en la Universidad de California, Berkeley), descubres una sorpresa reveladora:

> [!NOTE]
> **En las entrañas de PostgreSQL, la palabra oficial interna es `NAMESPACE`:**
> 1. La tabla fundamental del catálogo del sistema donde PostgreSQL almacena la lista de esquemas se llama literalmente **`pg_namespace`** (ubicada en `pg_catalog.pg_namespace`, la cual puedes consultar con `SELECT nspname FROM pg_catalog.pg_namespace;`).
> 2. En la tabla de catálogo `pg_class` (donde se registran todas las tablas, vistas e índices), la columna que indica a qué esquema pertenece una tabla se llama **`relnamespace`** (Namespace OID).
> 3. En el código fuente en C de PostgreSQL, las funciones que crean o destruyen esquemas se llaman `NamespaceCreate()`, `GetSearchPath()`, etc.

**¿Por qué entonces en la consola tenemos que escribir `CREATE SCHEMA` en lugar de `CREATE NAMESPACE`?**  
Únicamente para cumplir al pie de la letra con el estándar internacional ANSI SQL. Para el motor PostgreSQL, un esquema es sin la más mínima duda un **espacio de nombres (namespace)**.

---

### C. La Comparativa Multitecnológica: ¿Qué significa "Schema" en cada sistema?

Para no volver a confundirte nunca, consulta este mapa conceptual:

| Tecnología / Sistema | ¿Qué significa realmente su "Schema"? | Analogía Cotidiana |
| :--- | :--- | :--- |
| **PostgreSQL** | Un **espacio de nombres (namespace)** dentro de una base de datos para agrupar tablas y funciones (`schema.tabla`). | Un **armario** o carpeta dentro de un apartamento. |
| **SQL Server** | Similar a PostgreSQL: un espacio de nombres de seguridad y organización (`dbo.clientes`, `ventas.facturas`). | Una carpeta organizativa. |
| **MySQL / MariaDB** | En MySQL, `SCHEMA` es un **sinónimo literal de `DATABASE`**. `CREATE SCHEMA tienda;` hace exactamente lo mismo que `CREATE DATABASE tienda;`. (MySQL no tiene el nivel intermedio de esquemas). | El apartamento entero. |
| **Oracle Database** | Un `SCHEMA` es prácticamente idéntico a un `USER`. Cada vez que creas un usuario en Oracle, se crea automáticamente un esquema con su nombre que contendrá sus tablas. | El inventario personal del inquilino. |
| **Mongoose (Node.js)** | El **contrato estructural** que define los campos, tipos y validaciones de un documento BSON. | El **plano arquitectónico** de una casa. |
| **Apache Avro / Protobuf** | La **especificación de serialización binaria** (nombres de campos y tipos de datos en JSON o `.proto`). | La ficha técnica de un cable de datos. |
| **JSON Schema / XSD** | Un estándar de validación formal para verificar si un payload JSON o XML cumple una forma requerida. | Un control de aduanas que inspecciona el equipaje. |

---

### D. La Regla Mnemotécnica Definitiva

```
┌────────────────────────────────────────────────────────────────────────┐
│                   LA POLISEMIA DE LA PALABRA ESQUEMA                  │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. ESQUEMA DE CONTENEDOR          │ 2. ESQUEMA ESTRUCTURAL             │
│    (SQL: PostgreSQL, Oracle, MSSQL)│    (Mongoose, Avro, Protobuf, DDL) │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Responde a: ¿DÓNDE se guarda?   │ • Responde a: ¿QUÉ FORMA tiene?    │
│ • Es un espacio de nombres / caja │ • Es un tipo de datos / estructura │
│ • Ejemplo: esquema "public"       │ • Ejemplo: { name: String, ... }   │
│ • Sintaxis: CREATE SCHEMA foo;    │ • Sintaxis: CREATE TABLE (...)     │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

![Cambiar la llave del rol PostgreSQL](postgres_schemas_passwords_init/Cambiar%20la%20llave%20del%20rol%20PostgreSQL-6.png)

---

## 3. Cambiar la Contraseña en PostgreSQL: Cambiar la Llave del Rol

En PostgreSQL no existen "contraseñas de base de datos". **La contraseña le pertenece siempre al Rol (al usuario)**.

Como los roles son globales a toda la instancia de PostgreSQL, si cambias la contraseña del rol `postgres`, **habrás cambiado la llave para acceder a todas las bases de datos de ese servidor** (`todolistDB`, `postgres`, `template1`, etc.) a las que dicho rol tenga permiso.

---

### A. Método 1: Desde la Interfaz Gráfica pgAdmin

1. Abre pgAdmin y conecta con tu servidor.
2. En el árbol izquierdo, despliega: `Servers` ➔ `Tu Servidor` ➔ **`Login/Group Roles`**.
3. Localiza el rol que deseas modificar (por ejemplo, `postgres` o tu rol de aplicación).
4. Haz **clic derecho** sobre él y selecciona **`Properties...`**.
5. Ve a la pestaña **`Definition`**.
6. En el campo **`Password`**, escribe la nueva contraseña segura.
7. Haz clic en el botón azul **`Save`**.

---

### B. Método 2: Desde la Terminal con `psql` (Modo Interactivo Seguro)

Si tienes acceso a la consola de comandos, la forma más segura de cambiar la contraseña es el meta-comando interactivo de `psql`:

```bash
psql -U usuario_autorizado -h localhost -d postgres
```
Una vez dentro del prompt de PostgreSQL:
```sql
postgres=# \password postgres
Enter new password: **********
Enter it again: **********
Password for user "postgres" changed.
```
> [!TIP]
> **¿Por qué `\password` es el método preferido?**  
> Porque la contraseña se introduce con enmascaramiento y **nunca queda grabada en el historial de comandos de tu shell** (`.bash_history` o `.zsh_history`), ni en los logs de auditoría de sentencias SQL del servidor.

---

### C. Método 3: Mediante Sentencia SQL Directa

Puedes cambiar la contraseña ejecutando una sentencia SQL estándar:

```sql
ALTER ROLE postgres WITH PASSWORD 'MiClaveUltraSegura2026!';
```
*(Nota: `ALTER USER` es un sinónimo idéntico de `ALTER ROLE` en PostgreSQL).*

> [!WARNING]
> **Riesgo de fuga en registros:**  
> Si ejecutas `ALTER ROLE ... WITH PASSWORD 'texto_plano'` en scripts compartidos o consolas abiertas, esa contraseña quedará visible en texto claro en los archivos de log si el servidor tiene activado el parámetro `log_statement = 'all'`.

---

### D. Las 3 Contraseñas que Jamás Debes Confundir

Es muy común que los desarrolladores principiantes confundan tres conceptos de seguridad independientes:

```
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│ 🔑 CONTRASEÑA DEL ROL           │ 💻 ACCESO A pgAdmin             │ 🛡️ CONTRASEÑA MAESTRA pgAdmin   │
│ (ej. "postgres" o "app_user")   │ (Email y Password web)          │ (Master Password)               │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ Es la llave criptográfica que   │ Son las credenciales para entrar│ Es la contraseña local que      │
│ autentica la conexión contra el │ a la interfaz de usuario de     │ cifra y protege el almacén de   │
│ motor PostgreSQL en el puerto   │ pgAdmin si se ejecuta como      │ credenciales guardadas dentro   │
│ 5432.                           │ servicio web multiusuario.      │ del propio cliente pgAdmin.     │
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

---

### E. Efecto Inmediato en Aplicaciones y Sesiones Abiertas

* **Sesiones ya conectadas:** Si tu aplicación Node.js (`node awcodePostgres.js`) ya tenía un pool de conexiones abierto cuando cambiaste la contraseña, esas conexiones activas **no se cortan inmediatamente**. Continuarán funcionando hasta que el pool intente crear una nueva conexión o se reinicie el proceso.
* **Actualización obligatoria:** En cuanto cambies la contraseña, debes actualizar de inmediato la variable de entorno en tu aplicación (`DB_PASSWORD` o el archivo `.env`) para evitar que el siguiente despliegue o reinicio sufra un error de autenticación (`password authentication failed for user "postgres"`).

---

![Crear la base no crea tus tablas](postgres_schemas_passwords_init/Crear%20la%20base%20no%20crea%20tus%20tablas-3.png)

---

## 4. Crear la Base No Crea tus Tablas: Primero el Contenedor, Después el Equipamiento

En MongoDB, si tu código hace un `Item.create({ name: 'Comprar pan' })` apuntando a una base de datos que no existe, MongoDB crea automáticamente la base de datos y la colección al vuelo (*lazy creation*).

**En PostgreSQL esto NO ocurre jamás.** PostgreSQL sigue una disciplina estricta de dos fases:
1. **Fase 1: Construcción del Contenedor:** Creas la base de datos (`todolistDB`). En ese instante, la base de datos es un edificio vacío.
2. **Fase 2: Equipamiento Interior:** Creas las tablas y tipos mediante sentencias DDL (`CREATE TABLE`), ya sea mediante una función de inicialización en tu código (`initializeDB()`) o herramientas de migración (Knex, Prisma, Flyway).

---

### A. Crear la Base de Datos en pgAdmin vs SQL

#### Opción 1: En pgAdmin (Interfaz)
1. Despliega `Servers` ➔ Tu Servidor ➔ Clic derecho en **`Databases`** ➔ **`Create`** ➔ **`Database...`**.
2. En la pestaña **`General`**, escribe en el campo `Database`: `todolistDB`.
3. Selecciona el `Owner` (rol propietario).
4. Clic en **`Save`**.  
*(Nota: En la interfaz gráfica de pgAdmin no añadas comillas alrededor del nombre).*

#### Opción 2: Mediante SQL
Para crear una base de datos mediante SQL, debes estar conectado a una base de datos ya existente (típicamente la base administrativa por defecto `postgres`):

```sql
CREATE DATABASE "todolistDB";
```

> [!IMPORTANT]
> **Regla de oro de PostgreSQL:**  
> La instrucción `CREATE DATABASE` **no puede ejecutarse dentro de un bloque de transacción** (`BEGIN ... COMMIT`). Si intentas ejecutarla dentro de una transacción en un cliente SQL o driver, recibirás el error:  
> `ERROR: CREATE DATABASE cannot run inside a transaction block`.  
> Debe ejecutarse en modo **autocommit** directo.

---

### B. El Peligro del Case Sensitivity y las Comillas Dobles en SQL

El estándar ANSI SQL y PostgreSQL tienen un comportamiento peculiar con las mayúsculas y minúsculas:

```sql
-- Caso 1: Sin comillas (PostgreSQL lo convierte todo a MINÚSCULAS)
CREATE DATABASE todolistDB;
--> Crea una base de datos llamada: "todolistdb" (todo en minúsculas)

-- Caso 2: Con comillas dobles (PostgreSQL respeta EXACTAMENTE las mayúsculas)
CREATE DATABASE "todolistDB";
--> Crea una base de datos llamada: "todolistDB" (con 'D' y 'B' mayúsculas)
```

**¿Por qué esto causa tantos errores a los desarrolladores?**  
Si en tu script SQL creaste la base con comillas `CREATE DATABASE "todolistDB";`, pero en tu cadena de conexión en Node.js o Python configuras:
```javascript
const pool = new Pool({
  database: 'todolistdb' // ❌ Error: no coinciden las mayúsculas
});
```
La conexión fallará con `database "todolistdb" does not exist`.

> [!TIP]
> **Buena práctica en ingeniería de datos:**  
> Para evitar confusiones y problemas entre distintos sistemas operativos y herramientas, es una convención recomendada nombrar bases de datos y tablas **siempre en minúsculas separadas por guion bajo** (*snake_case*):  
> `todolist_db`, `users`, `todo_items`.

---

### C. Comprobar Tu Conexión Actual

Para verificar en qué base de datos te encuentras y con qué identidad estás conectado, ejecuta en cualquier momento:

```sql
SELECT current_database(), current_user;
```

Resultado típico en consola:
```
 current_database | current_user 
------------------+--------------
 todolistDB       | postgres
(1 row)
```

---

![¿Por qué siempre aparece public?](postgres_schemas_passwords_init/%C2%BFPor%20qu%C3%A9%20siempre%20aparece%20public_-2.png)

---

## 5. ¿Por Qué Siempre Aparece `public`? La Mecánica de `search_path`

Cuando abres una base de datos recién creada en pgAdmin y despliegas la rama `Schemas`, descubres que ya existe un esquema llamado **`public`**.  
Y si en tu código de Node.js ejecutas:
```sql
CREATE TABLE items (id SERIAL PRIMARY KEY, name TEXT);
```
La tabla aparece automáticamente dentro de `public.items`.

**¿Por qué ocurre esto?** La respuesta reside en una variable interna de sesión llamada **`search_path`** (ruta de búsqueda).

---

### A. ¿Qué es `search_path` y Cómo Funciona?

El `search_path` de PostgreSQL funciona exactamente igual que la variable de entorno `PATH` de tu sistema operativo (Bash o Zsh).  
Cuando en tu terminal escribes `node`, el sistema operativo busca el ejecutable `node` secuencialmente en las carpetas listadas en `$PATH` (`/usr/local/bin`, `/usr/bin`, etc.) hasta que lo encuentra.

En PostgreSQL, cuando ejecutas una consulta sin especificar el esquema:
```sql
SELECT * FROM items;
```
El motor consulta su lista `search_path` de izquierda a derecha para saber en qué esquema buscar la tabla `items`.

Por defecto, el valor de `search_path` en PostgreSQL es:
```sql
"$user", public
```

```
                              CÓMO RESUELVE POSTGRESQL UN OBJETO
                                               │
                                 ¿En qué esquema está 'items'?
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
             1. Esquema "$user"                              2. Esquema "public"
   (Busca un esquema con el mismo nombre            (Si no existe el esquema personal,
    que el usuario actual; ej. 'postgres')           busca en el armario común 'public')
                       │                                               │
                       ▼                                               ▼
                  ¿Existe?                                        ¿Existe?
             [ No ] ───▶ pasa al siguiente                    [ Sí ] ───▶ Encuentra 'public.items'
```

---

### B. Comandos Clave para Inspeccionar y Modificar el Esquema

1. **Ver la ruta de búsqueda actual:**
   ```sql
   SHOW search_path;
   -- Resultado típico: "$user", public
   ```

2. **Ver el esquema activo actual (donde se crearán los objetos por defecto):**
   ```sql
   SELECT current_schema();
   -- Resultado típico: public
   ```

3. **Cambiar la ruta de búsqueda para la sesión actual:**
   ```sql
   SET search_path TO tareas, public;
   ```
   *(A partir de ese comando, cualquier `CREATE TABLE` o `SELECT` buscará primero en `tareas` y después en `public`).*

---

### C. Evolución de la Seguridad en el Esquema `public` (PostgreSQL 15+)

Históricamente, en PostgreSQL el esquema `public` tenía permisos de creación (`CREATE`) concedidos al pseudo-rol especial `PUBLIC` (que representa a todos los usuarios de la base de datos).  
Esto significaba que cualquier usuario conectado, incluso uno con permisos muy reducidos, podía crear tablas en `public`.

> [!CAUTION]
> **Cambio de seguridad crítico en PostgreSQL 15:**  
> Por motivos de seguridad y para prevenir ataques de tipo *Trojan Horse* (donde un usuario sin privilegios crea una función o tabla maliciosa en `public` que luego es ejecutada accidentalmente por un administrador), **PostgreSQL 15 retiró el permiso `CREATE` en el esquema `public` para todos los usuarios no administradores**.  
> Por tanto, en versiones modernas de PostgreSQL se recomienda crear esquemas dedicados para cada aplicación y conceder permisos explícitos.

---

![Tu propio esquema: un armario con nombre](postgres_schemas_passwords_init/Tu%20propio%20esquema_%20un%20armario%20con%20nombre-5.png)

---

## 6. Tu Propio Esquema: Un Armario con Nombre

Aunque el esquema `public` es perfectamente funcional para aplicaciones sencillas, a medida que un proyecto crece o cuando varias aplicaciones comparten una misma base de datos, utilizar esquemas personalizados ofrece enormes ventajas.

---

### A. Las 3 Grandes Razones para Crear Esquemas Propios

1. **Evitar colisiones de nombres (Espacios de Nombres Limpios):**  
   Si tienes un módulo de tareas y un módulo de usuarios, ambos podrían necesitar una tabla llamada `configuracion` o `historial`.  
   En lugar de inventar nombres artificiales (`tareas_configuracion` vs `usuarios_configuracion`), creas esquemas independientes:
   * `tareas.configuracion`
   * `usuarios.configuracion`

2. **Agrupación modular y arquitectura limpia:**  
   Puedes organizar tu base de datos por dominios de negocio dentro de la misma conexión:
   * Esquema `tareas`: para las listas y elementos de la To-Do List.
   * Esquema `ventas`: para pedidos, facturas y pagos.
   * Esquema `auditoria`: para logs de seguridad y cambios de registros.

3. **Separación granular de permisos de seguridad:**  
   Puedes crear usuarios de base de datos con acceso restringido a un único armario:
   * El usuario del microservicio de tareas solo tiene acceso al esquema `tareas`.
   * El auditor solo tiene permisos de lectura (`SELECT`) en el esquema `auditoria`.

---

### B. Práctica: Crear un Esquema y una Tabla

Conectado a `todolistDB` con un usuario con permisos de administrador:

```sql
-- 1. Crear el nuevo esquema (el armario)
CREATE SCHEMA tareas;

-- 2. Crear una tabla indicando el prefijo del esquema
CREATE TABLE tareas.items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Si ahora consultas la tabla sin cambiar tu `search_path`, debes usar siempre el nombre cualificado:
```sql
SELECT * FROM tareas.items;
```

---

### C. Mover una Tabla Existente a Otro Esquema sin Perder Datos

Imagina que tu aplicación `awcodePostgres.js` ya creó las tablas `items` y `lists` dentro del esquema `public`, pero ahora quieres reorganizarlas y moverlas a tu esquema `tareas`.

**No necesitas exportar datos, ni hacer respaldos ni duplicar tablas.** PostgreSQL permite reubicar una tabla entre esquemas de forma instantánea mediante DDL:

```sql
ALTER TABLE public.items SET SCHEMA tareas;
ALTER TABLE public.lists SET SCHEMA tareas;
```

> [!TIP]
> **¿Qué hace internamente este comando?**  
> No copia ni mueve un solo byte de datos en el disco duro. Simplemente actualiza el puntero de catálogo en la tabla del sistema `pg_class`, cambiando el valor de la columna `relnamespace` para que apunte al OID del esquema `tareas`. Es una operación atómica e instantánea.

---

### D. Gestión de Permisos en Esquemas: La Doble Llave

Para que un rol no administrador (`app_user`) pueda operar sobre tablas en un esquema personalizado, necesita **dos llaves distintas**:

1. **Permiso `USAGE` sobre el Esquema (La Llave de la Puerta):**  
   Permite al usuario entrar en el esquema y resolver los nombres de los objetos. Si un usuario tiene permiso `SELECT` sobre una tabla pero no tiene `USAGE` sobre el esquema que la contiene, PostgreSQL le denegará el acceso.
2. **Permisos sobre las Tablas (La Llave del Cajón):**  
   Permisos específicos de manipulación de datos (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).

```sql
-- Paso 1: Permitir al usuario entrar al armario 'tareas'
GRANT USAGE ON SCHEMA tareas TO app_user;

-- Paso 2: Permitirle crear nuevas tablas dentro del armario (opcional)
GRANT CREATE ON SCHEMA tareas TO app_user;

-- Paso 3: Darle permisos para leer y escribir en todas las tablas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA tareas TO app_user;

-- Paso 4: Configurar permisos por defecto para tablas que se creen en el futuro
ALTER DEFAULT PRIVILEGES IN SCHEMA tareas 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
```

---

### E. Cuidado con la Confusión: `public` vs `PUBLIC`

En PostgreSQL existe una trampa terminológica sutil:
* **`public` (en minúsculas):** Es el **nombre de un esquema** específico (el armario por defecto).
* **`PUBLIC` (en mayúsculas):** Es una **palabra clave reservada** que representa a un pseudo-rol que engloba a **todos los usuarios del sistema** (presentes y futuros).  
Si ejecutas:
```sql
GRANT SELECT ON tareas.items TO PUBLIC; -- ⚠️ CUIDADO: concede lectura a TODOS los usuarios del servidor
```

---

![Automatizar con Python sin exponer la clave](postgres_schemas_passwords_init/Automatizar%20con%20Python%20sin%20exponer%20la%20clave-4.png)

---

## 7. Automatización con Python (`psycopg2`) sin Exponer Claves

En entornos DevOps e infraestructura como código (IaC), a menudo necesitamos inicializar servidores PostgreSQL automáticamente: cambiar contraseñas temporales, verificar si la base de datos existe y crearla si falta, todo mediante scripts de Python antes de levantar nuestra app Node.js.

Para hacerlo con máxima seguridad, debemos seguir tres reglas de oro:
1. **Nunca guardar contraseñas en el código fuente.**
2. **Gestionar `autocommit` adecuadamente para sentencias DDL.**
3. **Prevenir inyecciones SQL en identificadores mediante el módulo `psycopg2.sql`.**

---

### A. La Regla Crítica de `conn.autocommit = True`

Por defecto, la librería `psycopg2` de Python abre automáticamente una transacción (`BEGIN`) en cuanto creas una conexión.  
Sin embargo, en PostgreSQL la instrucción:
```sql
CREATE DATABASE todolistDB;
```
**no puede ejecutarse dentro de una transacción**. Si intentas ejecutarla con una conexión convencional de `psycopg2`, fallará con:
```
psycopg2.errors.ActiveSqlTransaction: CREATE DATABASE cannot run inside a transaction block
```

Para solucionarlo, debes activar el modo autocommit inmediatamente después de conectar:
```python
conn.autocommit = True
```

---

### B. Inyección SQL en Nombres de Objetos: `sql.Identifier` vs `sql.Literal`

Cuando hacemos consultas convencionales, usamos parámetros posicionales (`%s`):
```python
cursor.execute("SELECT * FROM items WHERE id = %s", (item_id,))
```
Sin embargo, **los parámetros `%s` solo sirven para valores literales**, nunca para nombres de tablas, esquemas, roles o bases de datos (identificadores SQL).  
Si intentas hacer `cursor.execute("CREATE DATABASE %s", (db_name,))`, el driver devolverá un error de sintaxis.

El error de novato más peligroso es usar f-strings de Python:
```python
cursor.execute(f"CREATE DATABASE {db_name}") # ❌ VULNERABLE A INYECCIÓN SQL
```

La forma profesional y segura en `psycopg2` es utilizar el módulo **`psycopg2.sql`**:
* **`sql.Identifier(...)`:** Entrecomilla y escapa nombres de tablas, columnas, esquemas y bases de datos.
* **`sql.Literal(...)`:** Entrecomilla y escapa valores literales (como la contraseña).

---

### C. Script Completo y Didáctico de Inicialización Segura

A continuación se muestra el script completo de inicialización para Python:

```python
#!/usr/bin/env python3
"""
Script de Inicialización y Provisionamiento Seguro de PostgreSQL
Automatiza la comprobación/creación de la base de datos y la rotación de contraseña
sin exponer secretos en el código ni en logs.
"""

import os
import sys
import getpass
import psycopg2
from psycopg2 import sql

def inicializar_postgres():
    print("=" * 65)
    print("🐘 ASISTENTE SEGURO DE PROVISIONAMIENTO DE POSTGRESQL")
    print("=" * 65)

    # 1. Parámetros de conexión a la base administrativa existente
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    admin_user = os.getenv("DB_ADMIN_USER", "postgres")
    maint_db = "postgres"  # Base de datos que siempre existe por defecto

    # Pedir la contraseña actual de forma interactiva enmascarada (sin eco en terminal)
    admin_password = os.getenv("DB_ADMIN_PASSWORD")
    if not admin_password:
        admin_password = getpass.getpass(f"🔑 Introduce la contraseña actual para '{admin_user}': ")

    target_db = os.getenv("TARGET_DB", "todolistDB")
    
    # Preguntar si se desea cambiar la contraseña del rol
    cambiar_clave = input("¿Deseas cambiar la contraseña del rol? (s/N): ").strip().lower() == 's'
    nueva_clave = None
    if cambiar_clave:
        nueva_clave = getpass.getpass("🔒 Introduce la NUEVA contraseña del rol: ")
        confirmacion = getpass.getpass("🔒 Confirma la NUEVA contraseña: ")
        if nueva_clave != confirmacion:
            print("❌ Las contraseñas no coinciden. Operación cancelada.")
            sys.exit(1)

    conn = None
    cursor = None

    try:
        print(f"\n🔌 Conectando a PostgreSQL en {host}:{port}/{maint_db} como '{admin_user}'...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=admin_user,
            password=admin_password,
            dbname=maint_db
        )

        # ⚡ FUNDAMENTAL: Activar autocommit para operaciones DDL fuera de transacciones
        conn.autocommit = True
        cursor = conn.cursor()
        print("✅ Conexión establecida exitosamente.")

        # 2. Cambiar la contraseña del rol si se solicitó
        if cambiar_clave and nueva_clave:
            print(f"🔄 Actualizando contraseña para el rol '{admin_user}'...")
            query_alter_role = sql.SQL("ALTER ROLE {rol} WITH PASSWORD {clave}").format(
                rol=sql.Identifier(admin_user),
                clave=sql.Literal(nueva_clave)
            )
            cursor.execute(query_alter_role)
            print(f"✅ Contraseña del rol '{admin_user}' actualizada correctamente.")

        # 3. Comprobar en el catálogo del sistema si la base de datos objetivo existe
        print(f"🔍 Comprobando en 'pg_database' si existe la base '{target_db}'...")
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (target_db,))
        existe_db = cursor.fetchone() is not None

        # 4. Crear la base de datos si no existe
        if not existe_db:
            print(f"🏗️  La base de datos '{target_db}' no existe. Creándola...")
            query_create_db = sql.SQL("CREATE DATABASE {db_name}").format(
                db_name=sql.Identifier(target_db)
            )
            cursor.execute(query_create_db)
            print(f"🎉 Base de datos '{target_db}' creada con éxito.")
        else:
            print(f"ℹ️  La base de datos '{target_db}' ya existe. No se requieren cambios.")

        print("\n✨ Provisionamiento completado con éxito.")
        print(f"👉 Ahora puedes conectar tu aplicación Node.js a: postgresql://{admin_user}:****@{host}:{port}/{target_db}")

    except psycopg2.Error as err:
        print(f"\n❌ Error durante la ejecución de PostgreSQL: {err}")
        sys.exit(1)
    finally:
        # Cerrar siempre los recursos
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("🔒 Conexión cerrada de forma segura.")

if __name__ == "__main__":
    inicializar_postgres()
```

---

## 8. Resumen y Cuadro de Mando del Ingeniero PostgreSQL

Para consolidar todo lo aprendido en este módulo, aquí tienes la guía de referencia rápida:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        RESUMEN MAESTRO: POSTGRESQL EN PRODUCCIÓN                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. JERARQUÍA       │ Servidor ➔ Base de Datos ➔ Esquema ➔ Tabla ➔ Filas/Columnas.       │
│                    │ Los roles son globales a todo el servidor.                        │
├────────────────────┼───────────────────────────────────────────────────────────────────┤
│ 2. ¿QUÉ ES SCHEMA? │ En SQL es un ESPACIO DE NOMBRES (namespace / armario contenedor). │
│                    │ En Mongoose/Avro es el CONTRATO ESTRUCTURAL (forma de los datos). │
│                    │ Internamente en C, PostgreSQL lo llama "pg_namespace".            │
├────────────────────┼───────────────────────────────────────────────────────────────────┤
│ 3. CONSTRASEÑAS    │ La contraseña es del ROL, no de la base de datos.                 │
│                    │ En psql: \password <rol> (no deja rastro en historial).           │
│                    │ En pgAdmin: Login/Group Roles ➔ Properties ➔ Definition.          │
├────────────────────┼───────────────────────────────────────────────────────────────────┤
│ 4. CREAR BASES     │ CREATE DATABASE no crea tablas. Se ejecuta fuera de transacción.  │
│                    │ "todolistDB" respeta mayúsculas; sin comillas pasa a minúsculas.  │
├────────────────────┼───────────────────────────────────────────────────────────────────┤
│ 5. SEARCH_PATH     │ Lista de resolución de esquemas. Por defecto: "$user", public.    │
│                    │ SHOW search_path; | SELECT current_schema();                      │
├────────────────────┼───────────────────────────────────────────────────────────────────┤
│ 6. AUTOMATIZACIÓN  │ En Python (psycopg2): conn.autocommit = True.                     │
│                    │ Usar psycopg2.sql.Identifier para nombres de bases y tablas.      │
│                    │ Usar getpass o variables de entorno (.env) para claves.           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

📍 **Navegación:** [⬅️ Anterior: Módulo 6 (Despliegue Seguro, DevSecOps y Hardening)](./06-despliegue-seguro-devsecops-owasp.md) | [🏠 Volver al README Principal](../README.md)
