# Módulo 6: Despliegue Seguro, DevSecOps y Hardening Web
> **Guía maestra de ciberseguridad práctica: de las inyecciones SQL/NoSQL al cifrado TLS con Wireshark, blindaje de Express con Helmet, contenedores no-root y políticas de red en Kubernetes.**  
> *Basado en la colección de 9 láminas infográficas de la carpeta [`seguridad_despliegues/`](./seguridad_despliegues/).*

---

📍 **Navegación:** [⬅️ Anterior: Módulo 5 (PostgreSQL vs MongoDB)](./05-despliegue-postgresql-vs-mongodb.md) | [🏠 Volver al README Principal](./README.md)

---

![Tu aplicación sale a Internet: qué hay que proteger y por qué](seguridad_despliegues/1.%20De%20localhost%20a%20Internet%20con%20seguridad.png)

---

## 1. Tu Aplicación Sale a Internet: De la Tranquilidad de Localhost a la Jungla Pública

Cuando programas en tu portátil, tu servidor Node.js escucha plácidamente en `localhost:3000`. Es tu taller privado: estás en un entorno aislado donde nadie más tiene acceso físico ni de red.

Sin embargo, **desplegar es abrir la persiana de un negocio en plena calle**. En cuanto publicas tu URL pública en Internet (en Render, AWS o tu propio dominio):
* Empiezan a llegar visitantes legítimos...
* ...pero también **escáneres y bots automáticos** que rastrean millones de IPs en busca de puertos abiertos, formularios sin proteger y contraseñas expuestas.

### El Flujo de la Aplicación y sus Puntos de Contacto
```
[ Navegador ] ──(Petición HTTP/S)──▶ [ Node.js + Express ] ──(Consulta)──▶ [ Base de Datos ]
  El cliente                          Recibe, procesa y                     MongoDB Atlas o
  (o un atacante)                     orquesta la lógica                    PostgreSQL
```

### Los 5 Grandes Peligros que Debes Conocer

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. INYECCIÓN (SQL / NoSQL)        ──▶ El atacante altera el significado de la consulta │
│ 2. SECRETOS EXPUESTOS             ──▶ Credenciales robadas en repositorios de GitHub   │
│ 3. DENEGACIÓN DE SERVICIO (DoS)   ──▶ Avalancha de peticiones que satura el servidor   │
│ 4. DEPENDENCIAS VULNERABLES       ──▶ Paquetes en node_modules con agujeros conocidos  │
│ 5. TRÁFICO SIN CIFRAR             ──▶ Datos que viajan en texto plano legibles en red  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Mensaje pedagógico central:**  
> *La seguridad no es un adorno que se pega al final del proyecto: protege los datos de tus usuarios, el acceso a tu infraestructura y la disponibilidad continua de tu servicio.*

---

![Cuando un dato se convierte en una orden: así funciona una inyección](seguridad_despliegues/2.%20Cuando%20un%20dato%20se%20convierte%20en%20orden.png)

---

## 2. Cuando un Dato se Convierte en una Orden: Inyecciones SQL y NoSQL

Una consulta a una base de datos es una instrucción: *«busca tal tarea»*, *«añade este registro»* o *«borra este elemento»*.  
El error de seguridad más antiguo y destructivo de la historia web es **confundir los datos que envía el usuario con las órdenes del sistema**.

---

### A. Inyección SQL en PostgreSQL: La Ficha Tramposa

Imaginemos un restaurante donde el camarero anota pedidos en fichas. Si el camarero pega directamente lo que dice el cliente en la orden de cocina sin filtrar, un cliente malicioso puede engañarlo:

#### ❌ Código Vulnerable (Concatenación Directa):
```javascript
// El servidor recibe del formulario el ID del elemento a borrar:
const itemId = req.body.checkbox;

// PELIGRO EXTREMO: Concatenar texto en la sentencia SQL
const query = "DELETE FROM items WHERE id = " + itemId;
await pool.query(query);
```

#### 💥 Cómo Ataca el Intruso:
Si el usuario envía un número normal (`5`), la sentencia es:
`DELETE FROM items WHERE id = 5` (borra la tarea 5).  
Pero si el atacante manipula la petición HTTP (con Postman o cURL) y envía:
```sql
5 OR 1=1
```
La consulta ejecutada en PostgreSQL se convierte en:
```sql
DELETE FROM items WHERE id = 5 OR 1=1;
```
Como `1=1` siempre es verdadero, **¡PostgreSQL borrará todas las tareas de la base de datos de un solo golpe!**  
O peor aún, enviando `5; DROP TABLE items; --`, el atacante puede destruir la tabla entera.

#### ✔️ La Defensa: Consultas Parametrizadas
```javascript
// La orden va por un lado; el dato del usuario viaja en un cofre cerrado
await pool.query("DELETE FROM items WHERE id = $1", [itemId]);
```
PostgreSQL compila primero la estructura fija de la consulta (`DELETE FROM items WHERE id = $1`). Cuando recibe el contenido de `$1`, **lo trata estrictamente como un valor literal**, nunca como sintaxis SQL ejecutable.

---

### B. Inyección NoSQL en MongoDB: El Objeto Tramposo

En MongoDB no usamos strings SQL, sino objetos JSON/BSON. ¿Significa eso que somos invulnerables? **En absoluto.**

#### ❌ Código Vulnerable en MongoDB:
```javascript
// Buscamos tareas o validamos un acceso:
app.post("/buscar", async (req, res) => {
    // Si req.body.nombre se pasa directamente a la consulta:
    const tarea = await Item.find({ name: req.body.nombre });
    res.json(tarea);
});
```

#### 💥 Cómo Ataca el Intruso (NoSQL Injection):
Si el atacante no envía un texto plano, sino una carga JSON con operadores de MongoDB:
```json
{
  "nombre": { "$gt": "" }
}
```
La consulta se convierte en: `Item.find({ name: { "$gt": "" } })`.  
Como cualquier texto es alfabéticamente «mayor que vacío» (`$gt: ""`), MongoDB devolverá **todos los documentos de la colección**, evadiendo cualquier filtro de privacidad o autenticación.

#### ✔️ Las Defensas en MongoDB:
1. **Tipado Estricto con Mongoose:** Definir esquemas formales (`name: { type: String }`) descarta objetos anidados inesperados.
2. **Sanitización con `express-mongo-sanitize`:**
   ```javascript
   const mongoSanitize = require("express-mongo-sanitize");
   app.use(mongoSanitize()); // Elimina cualquier clave que comience con '$' o '.'
   ```

---

![Las contraseñas son las llaves: dónde guardarlas y cuántas puertas deben abrir](seguridad_despliegues/3.%20Las%20contrasen%CC%83as%20son%20las%20llaves.png)

---

## 3. Las Contraseñas son las Llaves: Del Antipatrón a la Bóveda Cloud

Las credenciales (cadenas de conexión de Atlas, usuarios de PostgreSQL, tokens de API) son las llaves maestras que abren tus datos. La seguridad consiste en saber **dónde guardarlas** y **cuántas puertas permites que abran**.

```
                   LA ESCALERA DE MADUREZ DE LOS SECRETOS
                   
   [ Nivel 3: Gestor de Secretos ] ──▶ AWS Secrets Manager, Vault, Azure Key Vault.
                  ▲                    Auditoría, rotación automática de claves.
                  │
   [ Nivel 2: Nube / PaaS        ] ──▶ Variables de entorno inyectadas en Render / Railway.
                  ▲                    No existen en archivos de disco en el servidor.
                  │
   [ Nivel 1: Entorno Local      ] ──▶ Archivo .env fuera del repositorio (.gitignore).
                  ▲
                  │
   [ Nivel 0: En el Código ❌    ] ──▶ Password hardcodeada en el archivo JavaScript.
                                       GitHub público = Llave pegada en el escaparate.
```

### ⚠️ Regla de Oro sobre Git
> [!CAUTION]
> **Añadir `.env` a `.gitignore` NO borra secretos que ya fueron subidos:**  
> Si alguna vez hiciste `git commit` de un archivo con contraseñas y luego lo añadiste al `.gitignore`, **la contraseña sigue guardada en el historial de Git**.  
> Los bots de escaneo descargan el histórico de commits en milisegundos. Si expones una clave, **debes revocarla y generar una nueva inmediatamente** en el panel de MongoDB Atlas o PostgreSQL.

### El Principio de Mínimo Privilegio (*Least Privilege*)
Tu aplicación web nunca debe conectarse a la base de datos usando un superusuario administrador (`root`, `postgres` o `atlasAdmin`):
* Crea un usuario exclusivo (`todolist_app`).
* Otórgale únicamente permisos para leer y escribir datos (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
* Deniega permisos destructivos de administración (`DROP DATABASE`, `ALTER SYSTEM`). Si tu servidor sufre una brecha, el atacante no podrá destruir la infraestructura.

---

![Tres defensas para tu servidor Express: Helmet, Rate Limiting y CORS](seguridad_despliegues/4.%20Tres%20defensas%20para%20tu%20servidor%20Express.png)

---

## 4. Tres Defensas para tu Servidor Express: El Portero en la Puerta

Por defecto, Express es permisivo y revela información técnica que facilita el trabajo a los atacantes. Con tres middlewares esenciales convertimos nuestro servidor en una fortaleza vigilada:

### 1. `helmet`: Cabeceras de Seguridad HTTP
Instalación: `npm install helmet`
```javascript
const helmet = require("helmet");
app.use(helmet());
app.disable("x-powered-by"); // Oculta la cabecera 'X-Powered-By: Express'
```
Helmet inyecta automáticamente cabeceras defensivas cruciales:
* **HSTS (*Strict-Transport-Security*):** Obliga al navegador a comunicarse siempre mediante HTTPS, impidiendo degradaciones a HTTP plano.
* **X-Content-Type-Options: nosniff:** Impide que el navegador intente adivinar el tipo de archivo e interprete un texto como script ejecutable.
* **X-Frame-Options: DENY / SAMEORIGIN:** Protección contra **Clickjacking**. Evita que un atacante inserte tu web dentro de un `<iframe>` transparente debajo de un botón falso para engañar al usuario y hacer que pulse «Borrar tarea» sin saberlo.

### 2. `express-rate-limit`: Control de Aforo y Prevención DoS
Instalación: `npm install express-rate-limit`
```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
    max: 100, // Máximo 100 peticiones por IP
    message: "Demasiadas peticiones desde esta IP. Inténtalo de nuevo en 15 minutos.",
    standardHeaders: true
});

app.use(limiter);
```
Si un bot intenta probar miles de contraseñas por segundo o saturar tu servidor Express, al superar el límite recibirá automáticamente un error HTTP **`429 Too Many Requests`**.

### 3. CORS (*Cross-Origin Resource Sharing*): Quién Puede Leer tus Respuestas
```javascript
const cors = require("cors");

const corsOptions = {
    origin: "https://mi-dominio-oficial.com",
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```
> [!NOTE]
> **Lo que CORS es y lo que NO es:**  
> CORS es una política que aplica el **navegador del usuario** para evitar que páginas maliciosas lean datos privados de tu API. **CORS no bloquea a bots ni a scripts de terminal (cURL, Python)**: para proteger rutas contra llamadas no autorizadas necesitas **autenticación y tokens (JWT / Sesiones)**.

---

![Docker seguro: empaquetar con buenas prácticas](seguridad_despliegues/5.%20Docker%20seguro_%20empaquetar%20con%20buenas%20pra%CC%81cticas.png)

---

## 5. Docker Seguro: Empaquetar sin Llevarse los Problemas

Un contenedor Docker es una caja de ejecución aislada, pero **no es una caja mágica invulnerable**. Si configuras mal tu imagen, puedes introducir vulnerabilidades graves en tu servidor anfitrión.

### Anatomía de un Dockerfile Blindado
```dockerfile
# 1. Base pequeña y oficial con parches de seguridad al día
FROM node:20-alpine

# 2. Carpeta de trabajo aislada
WORKDIR /app

# 3. Copiamos solo los manifiestos de paquetes
COPY package*.json ./

# 4. Instalamos estrictamente dependencias de producción (sin herramientas de dev)
RUN npm ci --omit=dev

# 5. Copiamos el código fuente de la aplicación
COPY . .

# 6. REGLA SAGRADA: Ejecutar como usuario sin privilegios (no como root)
USER node

# 7. Comando de ejecución
CMD ["node", "awcodeAtlas.js"]
```

### ¿Por qué es tan crítico `USER node`?
Por defecto, los procesos dentro de un contenedor se ejecutan como usuario **`root`**. Dado que los contenedores comparten el mismo kernel del sistema operativo anfitrión, si un atacante encuentra una vulnerabilidad de escape de contenedor (*container breakout*), **obtendría control total como root de la máquina servidora física**. Al usar `USER node`, el proceso queda confinado sin privilegios administrativos.

### Escaneo de Imágenes con Trivy
Antes de subir una imagen a un registro público o desplegarla, la escaneamos en busca de vulnerabilidades conocidas (CVEs):
```bash
trivy image mi-usuario/todolist-app:1.0.0
```
Trivy inspecciona los paquetes del sistema operativo (Alpine/Debian) y las librerías de `npm`, alertando si existe alguna vulnerabilidad crítica pendiente de parchear.

---

![Datos protegidos durante el viaje: cifrado, WAF y base de datos aislada](seguridad_despliegues/6.%20Ruta%20segura%20para%20los%20datos.png)

---

## 6. Ruta Segura para los Datos: Wireshark, Kali Linux y Cifrado TLS

Para entender por qué el cifrado HTTPS no es negociable, debemos ver qué ocurre cuando los datos viajan sin protección.

```
                              EL VIAJE DE LOS DATOS
                              
  [ Navegador ]  ──HTTPS (TLS)──▶  [ Balanceador / WAF ]  ──HTTPS──▶  [ Node.js ]  ──TLS──▶  [ Atlas / Postgres ]
   Usuario final                    Inspecciona y cifra               Express                 Base de datos
```

### El Peligro del Tráfico en Texto Plano: La Demostración de Laboratorio
Imaginemos que nuestra aplicación se ejecuta sobre HTTP plano (puerto 80 sin TLS) y un usuario se conecta desde una red WiFi pública (en una cafetería, aeropuerto o universidad).

1. **El Escenario de Ataque con Kali Linux:**  
   Un atacante en la misma red utiliza una distribución orientada a auditorías como **Kali Linux** y ejecuta un ataque de envenenamiento ARP (*ARP Spoofing*) mediante herramientas como `arpspoof` o `bettercap`.  
   Esto engaña a los dispositivos de la red para que todo el tráfico del usuario pase primero por la máquina del atacante antes de llegar al router (*Man-in-the-Middle*).
2. **La Interceptación con Wireshark:**  
   El atacante abre el analizador de paquetes **Wireshark** y captura el tráfico en la interfaz de red. Al aplicar un filtro tan simple como:
   ```text
   http.request.method == "POST"
   ```
   Wireshark reconstruye la petición HTTP completa. En la pestaña de datos se lee **en texto plano absoluto**:
   ```http
   POST / HTTP/1.1
   Host: mi-app-insegura.com
   Content-Type: application/x-www-form-urlencoded

   newItem=Revisar+cuenta+bancaria&password=Pepito1234&token=secreto_de_sesion
   ```
   Cualquier credencial, tarea privada o cookie de sesión queda expuesta a la vista de cualquiera.

### ¿Qué ocurre cuando activamos TLS / HTTPS?
Cuando la conexión viaja sobre **TLS 1.3**:
* Wireshark solo captura paquetes con la etiqueta `Application Data` que contienen bytes aparentemente aleatorios cifrados matemáticamente.
* El atacante no puede leer el contenido ni alterar los paquetes en tránsito.

### Aislamiento de la Base de Datos: La Puerta Cerrada
Una base de datos en producción **nunca debe aceptar conexiones desde cualquier IP (`0.0.0.0/0`)**:
* En **MongoDB Atlas**, restringe la lista de acceso de red (*Network Access*) exclusivamente a las direcciones IP fijas de tus servidores de backend o utiliza **VPC Peering**.
* En **PostgreSQL**, configura `pg_hba.conf` y el cortafuegos de la nube para que únicamente los Pods de la aplicación puedan conectarse al puerto `5432`.

---

![Aislamiento y límites en Kubernetes y OpenShift](seguridad_despliegues/7.%20Aislamiento%20y%20li%CC%81mites%20en%20Kubernetes%20y%20OpenShift.png)

---

## 7. Aislamiento y Límites en Kubernetes y OpenShift: Que un Fallo no Invada el Edificio

En arquitecturas de contenedores, la seguridad se diseña bajo el principio de **Defensa en Profundidad**: si un atacante logra comprometer un contenedor web, el clúster debe impedir el movimiento lateral hacia los demás servicios.

```
┌──────────────────────────────── CLÚSTER K8S / OPENSHIFT ────────────────────────────────┐
│                                                                                         │
│   [ POD APLICACIÓN WEB ]                 [ POD BASE DE DATOS ]       [ POD DNS K8S ]    │
│   • runAsNonRoot: true                   • Almacenamiento seguro     • Resolución red   │
│   • readOnlyRootFilesystem: true         • Tráfico solo desde app    • Interno          │
│   • capabilities: drop ALL                                                              │
│              │                                     ▲                                    │
│              └──────── NetworkPolicy: PERMITIDO ───┘                                    │
│                                                                                         │
│   [ POD COMPROMETIDO (DEV) ]                                                            │
│   • Intenta escanear la base de datos de PROD ──▶ ⛔ NetworkPolicy: BLOQUEADO           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Configuración de `securityContext` en Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todolist-deployment
spec:
  template:
    spec:
      containers:
      - name: todolist-app
        image: todolist-app:1.0.0
        securityContext:
          runAsNonRoot: true
          runAsUser: 10001
          readOnlyRootFilesystem: true  # Impide que se escriban scripts o troyanos en disco
          allowPrivilegeEscalation: false
          capabilities:
            drop:
              - ALL                    # Retira todos los privilegios especiales de Linux
```

### Network Policies: El Cortafuegos Interno Pod a Pod
Por defecto, en Kubernetes todos los Pods pueden comunicarse entre sí sin restricciones. Con una **NetworkPolicy** aplicamos la política de **denegar todo por defecto** y abrir únicamente los flujos imprescindibles: la aplicación puede consultar el DNS y hablar con su base de datos, pero nada más.

---

![Una cadena de montaje con controles: DevSecOps](seguridad_despliegues/8.%20Cadena%20DevSecOps%20con%20controles%20de%20seguridad.png)

---

## 8. Una Cadena de Montaje con Controles: DevSecOps en CI/CD

El paradigma **DevSecOps** consiste en integrar la seguridad desde el primer momento en el ciclo de vida del software (*Shift-Left Security*), en lugar de auditarla cuando la aplicación ya está en producción.

```
                       PIPELINE CI/CD CON CONTROLES DEVSECOPS
                       
 [ 1. Commit ] ──▶ [ 2. Secretos ] ──▶ [ 3. Dependencias ] ──▶ [ 4. Código ] ──▶ [ 5. Imagen ] ──▶ [ 6. Deploy ]
  git push           Gitleaks             npm audit / Snyk       SAST Linter      Trivy            Solo si todo
                     TruffleHog           Busca CVEs             Malas prácticas  Escaneo Docker    está VERDE
```

### Las 5 Puertas de Control (*Security Gates*):
1. **Detección de Secretos:** **Gitleaks** o **TruffleHog** analizan el diff de cada commit para impedir que se suban claves privadas o contraseñas por descuido.
2. **Auditoría de Dependencias (SCA):** `npm audit` o **Snyk** alertan si alguna librería en `package.json` tiene vulnerabilidades públicas reportadas.
3. **Análisis Estático de Código (SAST):** Linters analizan el código JavaScript buscando patrones peligrosos (consultas sin parametrizar, variables globales).
4. **Escaneo del Contenedor:** **Trivy** o **Docker Scout** analizan las capas del Dockerfile.
5. **Firma Criptográfica de Imágenes:** Con herramientas como **Cosign / Sigstore**, el pipeline firma la imagen construida para asegurar en Kubernetes que el contenedor proviene de una fuente autorizada y no ha sido alterado.

---

![Antes de abrir la puerta: revisión de seguridad paso a paso](seguridad_despliegues/9.%20Revisio%CC%81n%20de%20seguridad%20antes%20de%20abrir.png)

---

## 9. Antes de Abrir la Puerta: Checklist Definitivo y Niveles de Madurez

Antes de pulsar el botón de despliegue a producción, repasa esta lista de verificación paso a paso:

### 📋 La Lista de Control Definitiva
- [ ] **1. Secretos a salvo:** Ninguna clave hardcodeada en el código ni impresa en logs (`console.log(process.env)`).
- [ ] **2. Consultas seguras:** Consultas SQL parametrizadas con `$1` en PostgreSQL y sanitización/validación de tipos en Mongoose.
- [ ] **3. Permisos adecuados:** El usuario de base de datos tiene privilegios mínimos; no es superadministrador.
- [ ] **4. Defensas perimetrales activas:** Cabeceras HTTP blindadas con `helmet`, rate limiting contra abusos y `x-powered-by` desactivado.
- [ ] **5. Contenedor no-root:** Dockerfile ejecutando con `USER node` y sin dependencias de desarrollo (`--omit=dev`).
- [ ] **6. Cifrado integral:** Conexiones web con HTTPS forzado y bases de datos con conexiones TLS activas.
- [ ] **7. Base de datos aislada:** Restringida por lista de IPs permitidas o red privada; prohibido `0.0.0.0/0` en producción.
- [ ] **8. Dependencias auditadas:** `npm audit` ejecutado en el pipeline sin alertas críticas pendientes.

---

### 🏆 La Escalera de Madurez en Ciberseguridad

```
  Nivel 3: Corporativo / Enterprise
  • Bóvedas de secretos (Vault / AWS Secrets Manager)
  • WAF perimetral y protección Anti-DDoS
  • Políticas de red Pod a Pod y firmas criptográficas (Cosign)

  Nivel 2: Profesional / Startup
  • Cabeceras Helmet activas y Rate Limiting
  • Dockerfile no-root con escaneo en CI (Trivy / Snyk)
  • Permisos de base de datos con mínimo privilegio

  Nivel 1: Básico / Formativo
  • Archivo .env fuera de Git (.gitignore)
  • Consultas parametrizadas (sin concatenaciones)
  • Certificado HTTPS activo (Let's Encrypt / Render)
```

> [!NOTE]
> **Conclusión del Curso:**  
> La seguridad no es una meta fija que se alcanza una vez y se olvida: **es un hábito de ingeniería continuo**. Revisar, actualizar dependencias y auditar la arquitectura es lo que convierte a un programador en un auténtico ingeniero de software.

---

📍 **Navegación:** [⬅️ Anterior: Módulo 5 (PostgreSQL vs MongoDB)](./05-despliegue-postgresql-vs-mongodb.md) | [🏠 Volver al README Principal](./README.md)
