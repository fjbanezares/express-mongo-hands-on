# 🔒 Manual de Seguridad y Buenas Prácticas: Gestión de Secretos en MongoDB Atlas y Render

> **De la mala práctica del *Hardcoding* al despliegue profesional mediante Variables de Entorno en PaaS.**  
> *Aprende por qué nunca debes subir contraseñas a GitHub, cómo aislar credenciales en local dentro de una carpeta oculta, las diferencias arquitectónicas entre IaaS y PaaS, y cómo configurar Render para proteger tu base de datos.*

---

## 🧭 Índice del Manual

1. [El Gran Peligro: ¿Por qué es una pésima práctica "quemar" contraseñas en el código?](#1-el-gran-peligro-por-qué-es-una-pésima-práctica-quemar-contraseñas-en-el-código)
   - 1.1. Las consecuencias catastróficas reales (Robo, Facturas Millonarias, Ransomware y Sabotaje)
2. [Solución en Local: El Fichero Oculto de Credenciales](#2-solución-en-local-el-fichero-oculto-de-credenciales)
   - 2.1. Creación de la carpeta `credentials/` y el archivo `.env`
   - 2.2. La regla de oro: La importancia vital de `.gitignore`
   - 2.3. Cómo sustituir la URL *hardcodeada* en `awcodeAtlas.js` por código JavaScript seguro
3. [El Despliegue en la Nube: Render, Variables de Entorno y PaaS vs IaaS](#3-el-despliegue-en-la-nube-render-variables-de-entorno-y-paas-vs-iaas)
   - 3.1. ¿Por qué en Render no existe un archivo `.env` físico?
   - 3.2. Comparativa Arquitectónica: IaaS vs PaaS
   - 3.3. Cómo inyecta Render las variables (del puerto `PORT` a `atlas_url`)
4. [Guía Paso a Paso para Alumnos (A Prueba de Fallos)](#4-guía-paso-a-paso-para-alumnos-a-prueba-de-fallos)
5. [Verificación mediante Logs: La Ventana al Interior del Software](#5-verificación-mediante-logs-la-ventana-al-interior-del-software)
   - 5.1. ¿Cómo demuestra el alumno que ha aplicado el cambio?
   - 5.2. La importancia de los Logs en el desarrollo profesional
   - 5.3. La regla sagrada: Sanitización y enmascaramiento de secretos

---

## 1. El Gran Peligro: ¿Por qué es una pésima práctica "quemar" contraseñas en el código?

Si abres el archivo original [`awcodeAtlas.js`](./awcodeAtlas.js), te encontrarás con una línea como esta:

```javascript
// ❌ PÉSIMA PRÁCTICA: Credencial quemada (Hardcoded) en texto plano
const MONGODB_ATLAS_URI = "mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/?retryWrites=true&w=majority";
```

A esto se le llama **credencial quemada o *hardcoded***: incrustar usuarios, contraseñas, claves privadas de API o tokens de acceso directamente en el código fuente.

En el desarrollo de software profesional, esto está considerado un **fallo crítico de seguridad de nivel 1 (OWASP Top 10: Security Misconfiguration / Identification and Authentication Failures)**.

```mermaid
flowchart LR
    Dev["Desarrollador escribe contraseña<br>en awcodeAtlas.js"]
    Git["git push origin main<br>a Repositorio GitHub"]
    Bots["Bots y Escáneres Web<br>(Tardan < 5 segundos en detectarlo)"]
    Hacker["Ciberdelincuente con acceso total<br>a tu clúster de Atlas"]

    Dev -->|"Push con contraseña"| Git
    Git -->|"Detección automática"| Bots
    Bots -->|"Alerta / Ataque"| Hacker
    Hacker -->|"Conexión con 0.0.0.0/0"| Cluster["MongoDB Atlas en Peligro"]
```

---

### 1.1. Las consecuencias catastróficas reales

¿Qué ocurre si dejas esa línea en tu código y subes el proyecto a GitHub?

#### 1. Rastreadores automatizados en tiempo real (*Scrapers & Scanners*)
Existen miles de bots automatizados analizando los eventos públicos de GitHub las 24 horas del día. En cuestión de **milisegundos** tras ejecutar `git push`, un bot extrae tu usuario, tu contraseña y tu dominio de Atlas (`cluster0.xxxx.mongodb.net`). Como en la práctica anterior abrimos el cortafuegos a **`0.0.0.0/0`**, el atacante tiene las puertas completamente abiertas desde cualquier lugar del mundo.

#### 2. Facturas de miles de euros en la nube (*Resource Hijacking*)
Aunque tu clúster inicial sea un nivel gratuito (M0), un atacante puede saturar las peticiones, asociar servicios de pago o utilizar tu cuenta para minería de criptomonedas (*Cryptojacking*). En empresas reales, filtraciones de credenciales de AWS o Google Cloud en repositorios han generado **facturas imprevistas de decenas de miles de euros en pocas horas**.

#### 3. Robo y exfiltración de datos (Violación del RGPD / LOPD)
Si la base de datos almacena usuarios, emails, teléfonos o contraseñas, el atacante descarga una copia completa (`mongodump`). En la Unión Europea, esto constituye una brecha de seguridad grave bajo el **RGPD (Reglamento General de Protección de Datos)**, que conlleva **sanciones legales millonarias** y la obligación de notificar públicamente a todos los usuarios afectados.

#### 4. Secuestro de Datos (*Ransomware*)
Un script malicioso puede vaciar todas tus colecciones de MongoDB, crear una nueva colección llamada `LEEME_PAGA_RESCATE` y dejar una nota exigiendo un pago en Bitcoin a cambio de una supuesta clave para recuperar tus datos (que casi nunca devuelven).

#### 5. Sabotaje, *Defacement* y "Cosas Feas"
Cualquier persona que se conecte a tu base de datos puede alterar las tareas de la To-Do List, inyectar insultos, publicar contenido pornográfico o ilegal, o sabotear la entrega de la práctica ante el profesor y tus compañeros.

> [!CAUTION]
> **Tu reputación profesional:** En una entrevista de trabajo o en una prueba técnica para una empresa, dejar una contraseña hardcodeada en tu GitHub público supone el **descarte automático e inmediato** de tu candidatura.

---

## 2. Solución en Local: El Fichero Oculto de Credenciales

Para trabajar en tu ordenador sin exponer secretos, la industria sigue el principio de los **Doce Factores (*The Twelve-Factor App*)**: **la configuración debe estar estrictamente separada del código**.

---

### 2.1. Creación de la carpeta `credentials/` y el archivo `.env`

Vamos a encapsular los secretos en una carpeta dedicada llamada `credentials/`:

1. En la raíz de tu proyecto, crea una carpeta llamada **`credentials`**.
2. Dentro de esa carpeta, crea un archivo llamado **`.env`** (fíjate bien: comienza con un punto, lo que indica que es un archivo oculto del sistema).
3. Dentro de `credentials/.env`, escribe la variable con tu URL de MongoDB Atlas:

```env
# credentials/.env (¡ESTE ARCHIVO NUNCA SE SUBE A GITHUB!)
atlas_url=mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/todolistDB?retryWrites=true&w=majority
PORT=3000
```

> [!TIP]
> En el repositorio hemos dejado una plantilla pública llamada [`credentials/.env.example`](./credentials/.env.example). Contiene las variables pero sin contraseñas reales, para que cualquier desarrollador nuevo sepa qué variables debe rellenar al clonar el proyecto.

---

### 2.2. La regla de oro: La importancia vital de `.gitignore`

Git es un sistema de control de versiones **inmutable**. Esto significa que:
* Si añades un archivo con contraseñas y haces `git commit`, ese secreto queda grabado en el historial del commit.
* **Aunque en el siguiente commit borres el archivo o quites la contraseña, el secreto SIGUE EXISTIENDO en el historial de Git**.
* Cualquier persona puede hacer `git checkout` a un commit anterior o usar `git log -p` y ver tu contraseña antigua con total claridad.

Por eso, el archivo **[`.gitignore`](./.gitignore)** es el guardián más importante del repositorio. Le indica a Git qué carpetas y archivos **debe ignorar por completo y no registrar jamás**.

Abre el archivo [`.gitignore`](./.gitignore) y asegúrate de que incluye las siguientes líneas:

```gitignore
# Proteger archivos de entorno y carpeta de credenciales
.env
.env.*
credentials/.env
credentials/*.env
!credentials/.env.example
```

> [!IMPORTANT]
> **Verificación infalible con Git:**  
> Ejecuta en tu terminal:  
> ```bash
> git status
> ```  
> Si ves `credentials/.env` en color rojo o en la lista de archivos rastreados, **¡ALERTA!** No hagas commit. Significa que tu `.gitignore` no lo está tapando correctamente.

---

### 2.3. Cómo sustituir la URL *hardcodeada* en `awcodeAtlas.js` por código JavaScript seguro

Para que Node.js lea el archivo `credentials/.env`, instalamos la librería estándar del sector: **`dotenv`**.

```bash
npm install dotenv
```

Ahora, abrimos [`awcodeAtlas.js`](./awcodeAtlas.js) y reemplazamos la línea vulnerable por la lectura dinámica de variables de entorno:

```javascript
// ==============================================================================
// 1. CARGA SEGURA DE CONFIGURACIÓN (dotenv)
// ==============================================================================
// Intenta cargar las credenciales locales desde credentials/.env si existe.
// Si estamos en la nube (Render), dotenv no sobreescribe las variables del sistema.
require("dotenv").config({ path: "credentials/.env" });

// ==============================================================================
// 2. CONEXIÓN A MONGODB ATLAS MEDIANTE VARIABLE DE ENTORNO
// ==============================================================================
// Buscamos la variable 'atlas_url' inyectada por el entorno (Render o credentials/.env)
const MONGODB_ATLAS_URI = process.env.atlas_url || process.env.ATLAS_URL;

// Validación defensiva: Si no hay variable configurada, advertir con claridad
if (!MONGODB_ATLAS_URI) {
  console.error("❌ [FATAL ERROR] La variable de entorno 'atlas_url' no está definida.");
  console.error("   -> En local: Asegúrate de crear el archivo 'credentials/.env'.");
  console.error("   -> En Render: Configura la variable en la pestaña 'Environment'.");
  process.exit(1); // Detiene el servidor para no operar en un estado corrupto
}

// Conexión con Mongoose
mongoose.connect(MONGODB_ATLAS_URI, { useNewUrlParser: true, useUnifiedTopology: true });
```

---

## 3. El Despliegue en la Nube: Render, Variables de Entorno y PaaS vs IaaS

Aquí es donde muchos alumnos se confunden:  
*«Profe, si en local uso un archivo `credentials/.env`, ¿cómo subo ese archivo a Render si `.gitignore` me prohíbe subirlo a GitHub?»*

La respuesta reside en la arquitectura de la nube moderna y en la diferencia entre **IaaS** y **PaaS**.

```mermaid
flowchart TD
    subgraph IAAS["IaaS (Infraestructura como Servicio - ej: AWS EC2, GCP Compute Engine)"]
        VM["Máquina Virtual completa (Linux Ubuntu)<br>• Acceso SSH total<br>• Sistema de archivos persistente en disco<br>• Subes el .env manualmente por SCP/SFTP"]
    end

    subgraph PAAS["PaaS (Plataforma como Servicio - ej: Render, Heroku, Cloud Run)"]
        GitRepo["Clona tu repo de GitHub<br>(¡Sin archivos .env por seguridad!)"]
        Container["Contenedor Efímero de Docker<br>• Sin acceso SSH directo<br>• El disco se destruye y recrea en cada deploy"]
        EnvInject["Panel de Control Render (Environment Tab)<br>🔑 atlas_url = mongodb+srv://..."]

        GitRepo --> Container
        EnvInject -->|"Inyecta directamente en process.env"| Container
    end
```

---

### 3.1. ¿Por qué en Render no existe un archivo `.env` físico?

Render es una plataforma **PaaS (Platform as a Service)**. En Render:
1. Tú no alquilas una máquina virtual con un disco duro tradicional donde entrar por SSH y crear archivos de texto.
2. Render ejecuta tu aplicación dentro de **contenedores aislados y efímeros** (*containers*).
3. Cada vez que haces un nuevo despliegue (*deploy*), Render crea un contenedor limpio desde cero, descarga tu código de GitHub, ejecuta `npm install` y arranca la aplicación.
4. Dado que tu archivo `credentials/.env` **no está en GitHub** (gracias a `.gitignore`), el contenedor de Render arranca sin ese archivo.

---

### 3.2. Comparativa Arquitectónica: IaaS vs PaaS

| Dimensión | IaaS (AWS EC2, Google Compute Engine) | PaaS (Render, Heroku, Fly.io) |
| :--- | :--- | :--- |
| **Significado** | *Infrastructure as a Service* | *Platform as a Service* |
| **Qué gestionas tú** | El sistema operativo, parches de seguridad, cortafuegos del servidor, discos, Node.js, Nginx. | **Solo tu código**. La plataforma gestiona el servidor, la red, el escalado y el SSL. |
| **Nivel de acceso** | Acceso raíz por SSH (`ssh ubuntu@ip`). | Sin acceso al sistema operativo anfitrión. |
| **Sistema de ficheros** | Persistente en disco virtual (EBS). Puedes editar archivos `.env` a mano con `nano`. | **Efímero**. Cualquier archivo creado en tiempo de ejecución desaparece al reiniciar. |
| **Inyección de Secretos** | Manual por terminal o mediante bóvedas (*AWS Secrets Manager*). | **Variables de Entorno gestionadas desde el panel web de la plataforma**. |

---

### 3.3. Cómo inyecta Render las variables (del puerto `PORT` a `atlas_url`)

Render ya utiliza variables de entorno de forma nativa para que tu aplicación funcione:
* **La variable `PORT`:** Render asigna dinámicamente un puerto aleatorio en su infraestructura interna y te lo pasa mediante la variable de entorno del sistema `process.env.PORT`. Por eso en tu servidor Express escribías:
  ```javascript
  const port = process.env.PORT || 3000;
  ```
* **Nuestra variable personalizada `atlas_url`:** De la misma manera exacta, Render nos permite ir a su interfaz web y definir pares **Clave-Valor**. Render inyectará `atlas_url` directamente en el diccionario global `process.env` del proceso de Node.js al arrancar.

---

## 4. Guía Paso a Paso para Alumnos (A Prueba de Fallos)

Sigue estos 8 pasos en orden riguroso:

```mermaid
sequenceDiagram
    autonumber
    actor Alumno
    participant Local as Tu Portátil (VS Code)
    participant Git as GitHub (Repo Remoto)
    participant Render as Servidor Cloud Render
    participant Atlas as Clúster MongoDB Atlas

    Alumno->>Local: Crea credentials/.env con atlas_url
    Alumno->>Local: Modifica awcodeAtlas.js con process.env.atlas_url
    Alumno->>Local: Prueba 'node awcodeAtlas.js' (Verifica arranque)
    Alumno->>Git: git push (¡credentials/.env queda fuera!)
    Alumno->>Render: Configura Environment Variable 'atlas_url' en el panel
    Render->>Git: Detecta commit y descarga el código limpio
    Render->>Render: Inyecta atlas_url en memoria del contenedor
    Render->>Atlas: Conexión cifrada TLS exitosa
    Alumno->>Render: Abre URL pública y revisa los Logs
```

---

### Paso 1: Instalar `dotenv` en tu ordenador
Abre la terminal en la carpeta de tu proyecto y ejecuta:
```bash
npm install dotenv
```

---

### Paso 2: Crear la carpeta `credentials` y el archivo secreto
En la raíz del proyecto:
1. Crea la carpeta `credentials`.
2. Dentro, crea el archivo `.env` (sin ninguna extensión detrás, solo `.env`).
3. Añade tu cadena de conexión real de MongoDB Atlas:
   ```env
   atlas_url=mongodb+srv://tu_usuario:tu_password@cluster0.n87gd.mongodb.net/todolistDB?retryWrites=true&w=majority
   ```

---

### Paso 3: Verificar que `.gitignore` protege tu secreto
Abre `.gitignore` y confirma que contiene:
```gitignore
credentials/.env
```
Ejecuta en tu terminal:
```bash
git status
```
**Regla de oro:** El archivo `credentials/.env` **NO DEBE APARECER** en la lista. Si aparece, no continúes hasta arreglar el `.gitignore`.

---

### Paso 4: Actualizar [`awcodeAtlas.js`](./awcodeAtlas.js)
Busca la zona donde te conectas a Mongoose y sustitúyela por este bloque limpio:

```javascript
// Cargar dotenv para desarrollo local
require("dotenv").config({ path: "credentials/.env" });

// Obtener la URL desde las variables de entorno
const MONGODB_ATLAS_URI = process.env.atlas_url || process.env.ATLAS_URL;

// Mensaje de log pedagógico para la corrección
console.log("------------------------------------------------------------");
console.log("🔍 [AUDITORÍA DE SEGURIDAD]");
if (MONGODB_ATLAS_URI) {
  // Enmascaramos la URL para no mostrar la contraseña en pantalla
  const maskedURI = MONGODB_ATLAS_URI.replace(/:([^:@]+)@/, ":****@");
  console.log("✅ Variable de entorno 'atlas_url' detectada correctamente.");
  console.log("📡 Conectando a Atlas:", maskedURI);
} else {
  console.error("❌ ERROR: La variable 'atlas_url' no está definida.");
}
console.log("------------------------------------------------------------");

mongoose.connect(MONGODB_ATLAS_URI, { useNewUrlParser: true, useUnifiedTopology: true });
```

---

### Paso 5: Probar en local
Arranca el servidor en tu ordenador:
```bash
node awcodeAtlas.js
```
Deberás ver en la terminal:
```text
🔍 [AUDITORÍA DE SEGURIDAD]
✅ Variable de entorno 'atlas_url' detectada correctamente.
📡 Conectando a Atlas: mongodb+srv://tu_usuario:****@cluster0...
Server started on port 3000
```
Entra en `http://localhost:3000` y añade una tarea para confirmar que lee y escribe. Detén el servidor con `Ctrl + C`.

---

### Paso 6: Subir los cambios a GitHub
Guarda y sube el código a tu repositorio:
```bash
git add .
git commit -m "feat(security): refactorizar conexion a Atlas usando variables de entorno"
git push origin main
```
*Abre tu repositorio en la web de GitHub y navega al archivo `awcodeAtlas.js`: comprueba que ya NO aparece tu contraseña por ninguna parte.*

---

### Paso 7: Configurar la variable de entorno en Render
1. Entra en tu panel de control de [dashboard.render.com](https://dashboard.render.com).
2. Haz clic sobre tu **Web Service** de la práctica.
3. En el menú lateral izquierdo, haz clic en **Environment**.
4. Pulsa en el botón **Add Environment Variable** (o *Add Secret*):
   * **Key:** `atlas_url`
   * **Value:** *(Pega tu cadena completa de MongoDB Atlas)*:  
     `mongodb+srv://tu_usuario:tu_password@cluster0.n87gd.mongodb.net/todolistDB?retryWrites=true&w=majority`
5. Haz clic en el botón azul **Save Changes**.

---

### Paso 8: Comprobación del redespliegue automático
Al pulsar *Save Changes*, Render detecta el cambio de configuración y automáticamente lanza un nuevo despliegue (*Deploy*).  
Espera a que el estado cambie a **Live** (en verde). Abre la URL de tu aplicación en Render (`https://tu-app.onrender.com`) y comprueba que tus listas y tareas siguen estando ahí y funcionando perfectamente.

---

## 5. Verificación mediante Logs: La Ventana al Interior del Software

### 5.1. ¿Cómo demuestra el alumno que ha aplicado el cambio?

El profesor no puede entrar a ver el archivo secreto en el ordenador de cada alumno, pero sí puede comprobar **los Logs de ejecución en tiempo real de Render**:

1. En el panel de tu Web Service en Render, ve a la pestaña **Logs**.
2. Al reiniciar la aplicación, verás reflejado el mensaje de auditoría que programamos en el Paso 4:

```text
==> Starting service with 'node awcodeAtlas.js'
------------------------------------------------------------
🔍 [AUDITORÍA DE SEGURIDAD]
✅ Variable de entorno 'atlas_url' detectada correctamente.
📡 Conectando a Atlas: mongodb+srv://fjbanezares:****@cluster0.n87gd.mongodb.net/todolistDB?retryWrites=true&w=majority
------------------------------------------------------------
Server started on port 10000
Database connected successfully!
```

> [!IMPORTANT]
> **Evidencia para la entrega de la práctica:**  
> Toma una captura de pantalla donde se vea con total claridad:
> 1. La URL de tu servicio en Render.
> 2. La ventana de **Logs** mostrando el mensaje `✅ Variable de entorno 'atlas_url' detectada correctamente.`
> 3. La URL enmascarada con asteriscos `****`.

---

### 5.2. La importancia de los Logs en el desarrollo profesional

En tu ordenador local tienes un depurador interactivo, puedes poner puntos de parada (*breakpoints*) y ver la consola en directo. Pero **en producción (en la nube), los logs son tus únicos ojos**:

1. **Diagnóstico post-mortem:** Cuando tu aplicación se cae a las 3:00 AM un domingo, los logs te dicen la línea exacta del fallo (`Error: connect ETIMEDOUT`, `MongoServerError: bad auth`, etc.).
2. **Trazabilidad y Auditoría:** Permiten registrar qué peticiones entraron, cuánto tardaron las consultas y si hubo intentos de acceso no autorizados.
3. **Métricas de Rendimiento:** Analizando los logs se detectan cuellos de botella en bases de datos o peticiones lentas antes de que afecten a miles de clientes.

---

### 5.3. La regla sagrada: Sanitización y enmascaramiento de secretos

Tan peligroso como dejar la contraseña en el código es **imprimir la contraseña en los logs** mediante un `console.log(process.env.atlas_url)`.

Muchos servicios de monitorización (Datadog, Grafana Cloud, CloudWatch, Papertrail) almacenan los logs de texto en servidores compartidos accesibles por equipos enteros de soporte o analistas. Si imprimes la URL con la contraseña en los logs, el secreto vuelve a quedar expuesto.

Por eso, en el Paso 4 aplicamos una expresión regular de enmascaramiento:

```javascript
// Expresión regular que reemplaza cualquier texto entre ':' y '@' por '****'
const maskedURI = MONGODB_ATLAS_URI.replace(/:([^:@]+)@/, ":****@");
console.log("📡 Conectando a Atlas:", maskedURI);
```

Así el log demuestra que la variable existe y es válida, pero **la contraseña real jamás queda grabada en ningún registro**.
