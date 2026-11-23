# 🎨 «De un clic a producción» — Guía Didáctica de las 16 Láminas Infográficas

> **Recorrido visual e integral desde un `POST /tasks` hasta el escalado en producción.**  
> *«De un clic a producción» son 16 láminas de cómic independientes con la práctica de la lista de tareas como hilo conductor, donde estudiantes, operarios y robots representan cada pieza real del sistema.*

---

## 🧭 Mapa de Bloques y Navegación Rápida

| Bloque | Láminas | Eje Temático |
| :--- | :---: | :--- |
| **[Bloque I](#bloque-i--0104--http-ejs-y-mongodb)** | **01 – 04** | **HTTP, EJS y MongoDB:** Del `POST /tasks` al HTML, plantillas y parciales, diagnóstico de versiones antiguas y replicación/transacciones. |
| **[Bloque II](#bloque-ii--0510--git-linux-render-y-kubernetes)** | **05 – 10** | **Git, Linux, Render y Kubernetes:** Ramas y terminal, build en Render, `.env` y `PORT`, pods/nodos, balanceo HTTPS y tres entornos compartiendo Atlas. |
| **[Bloque III](#bloque-iii--1113--jenkins-cicd-y-controlm)** | **11 – 13** | **Jenkins, CI/CD y Control‑M:** Agente Linux y pipelines CI, despliegue automático validado en Render y orquestación batch por eventos en Control‑M. |
| **[Bloque IV](#bloque-iv--1416--colab-kaggle-y-escalado)** | **14 – 16** | **Colab, Kaggle y Escalado:** Anatomía de un notebook hasta el bytecode de CPython, estado del kernel y localización de cuellos de botella antes de añadir pods. |

> [!NOTE]
> **Notas docentes para el uso en clase:**
> 1. **Lámina 04 revisada:** Esta guía utiliza la versión revisada de la lámina 04 (`4. Replicar tiene un coste-7.png`), que muestra el **cargo** y el **abono** dentro de una caja rotulada **«Transacción»**.
> 2. **Lámina 08 (Sidecar y plantillas):** El pod con *sidecar* ilustra que un pod puede contener varios contenedores compartiendo red; si los cinco pods fueran réplicas del mismo `Deployment`, todos partirían de la misma plantilla.
> 3. **Modelo de referencia:** Los cortes arquitectónicos de **Kubernetes** (láminas 08–10) sirven como **modelos de referencia** para razonar sobre cómo funcionan por debajo servicios gestionados como **Render** y **Colab**.

---

## Bloque I · 01–04 · HTTP, EJS y MongoDB

Del `POST /tasks` al HTML que recibe el navegador: vemos cómo Express y EJS ensamblan la respuesta con datos de MongoDB Atlas, cómo distinguir entre una pestaña antigua, una caché y una réplica rezagada, y qué coste real implica replicar datos.

---

### 📌 Lámina 01 · La tarea cruza la red

![01. La tarea cruza la red](infografia_reflexiones_practica/1.%20La%20tarea%20cruza%20la%20red-5.png)

* **Qué ocurre paso a paso:**
  1. **Inés envía la tarea:** Al pulsar *Guardar*, el navegador lanza una petición `POST /tasks` con el formulario en el cuerpo (`title="Probar la app"`).
  2. **Bruno, el cartero HTTP:** Transporta la petición hasta el servidor **Express**.
  3. **Validación y persistencia:** Express valida el formulario, ejecuta `insertOne` en **MongoDB Atlas** y, tras recibir la confirmación, responde con una redirección **`303 Location: /tasks`**.
  4. **Patrón `POST → Redirect → GET`:** El navegador sigue la redirección haciendo un nuevo `GET /tasks` para mostrar la lista actualizada (evitando reenviar el formulario si el usuario pulsa F5).
* **Detalle clave para clase:** En el segundo portátil *(sin recargar)* la pestaña sigue mostrando el HTML antiguo aunque MongoDB ya haya guardado la tarea.

---

### 📌 Lámina 02 · EJS abre su taller

![02. EJS abre su taller](infografia_reflexiones_practica/2.%20EJS%20abre%20su%20taller-15.png)

* **Cómo trabaja el renderizado en servidor (SSR):**
  1. Express ejecuta `res.render('tasks', { tasks })` y localiza la plantilla en `views/tasks.ejs`.
  2. Atlas entrega el array de objetos con las tareas (`[{ title: 'Probar la app' }]`).
  3. **La costurera EJS** ejecuta los bucles en el servidor e incluye parciales reutilizables (como `partials/header`).
  4. **Sintaxis esencial:** `<% ... %>` ejecuta código JavaScript de control (bucles, condicionales); `<%= ... %>` imprime el valor **escapando HTML** para prevenir inyecciones XSS.
  5. Al navegador **no le llega la plantilla `.ejs`**, sino **HTML puro** (`<li>Probar la app</li>`) con el que construye el DOM; el CSS llega en otra petición desde `public/`.

---

### 📌 Lámina 03 · Tres formas de ver el pasado

![03. Tres formas de ver el pasado](infografia_reflexiones_practica/3.%20Tres%20formas%20de%20ver%20el%20pasado-8.png)

Cuando cambias un dato y sigues viendo la versión anterior (`v1`), el origen puede estar en **tres capas distintas**:

| Sospechoso | Qué está pasando | Cómo diagnosticarlo |
| :--- | :--- | :--- |
| **1. Pestaña antigua** | El navegador sigue pintando el HTML que ya tenía en memoria; no ha pedido datos nuevos. | Abrir DevTools → pestaña **Red**: no aparece ningún nuevo `GET`. |
| **2. Caché local en instancia** | El `POST` llegó a la **instancia A** (que escribió en Atlas), pero el `GET` llegó a la **instancia B**, que sirve una copia vieja de su caché local sin consultar Atlas. | Revisar qué identificador de instancia atendió cada petición. |
| **3. Réplica rezagada** | El cambio se escribió en el **Primario** de MongoDB, pero el `GET` leyó de una **Secundaria** que todavía no había aplicado la replicación asíncrona. | Comprobar el origen de la lectura (*read preference* / *read concern*). |

---

### 📌 Lámina 04 · Replicar tiene un coste *(versión revisada)*

![04. Replicar tiene un coste (revisada)](infografia_reflexiones_practica/4.%20Replicar%20tiene%20un%20coste-7.png)

* **Replicación asíncrona y quórum:** MongoDB escribe en el **Primario** y copia de forma asíncrona a los **Secundarios** (alguno puede ir con retraso). Configurar **`w: majority`** exige esperar confirmación de la mayoría calculada por MongoDB: más seguridad a cambio de mayor latencia.
* **Tres perfiles de operación en una misma aplicación:**
  1. **OLTP (operación rápida):** Completar una tarea por su ID; busca baja latencia en tiempo real.
  2. **Transferencia (caja «Transacción»):** El **Cargo (`-`)** y el **Abono (`+`)** van juntos dentro de la misma **Transacción** (atomicidad: o se confirman ambos o ninguno) y usan un identificador único (**idempotencia**) para no duplicar el cargo si se reintenta la petición.
  3. **OLAP (analítica):** Contar tareas completadas por mes; consulta agregada orientada a métricas donde puede tolerarse un ligero desfase.

---

## Bloque II · 05–10 · Git, Linux, Render y Kubernetes

Experimentar en una rama y volver a `main`, seguir el *build* desde el repositorio, localizar dónde viven `.env` y `PORT`, y recorrer el tráfico HTTPS desde el navegador hasta el puerto interno de Express en cada pod.

---

### 📌 Lámina 05 · Git y Linux en el taller

![05. Git y Linux en el taller](infografia_reflexiones_practica/5.%20Git%20y%20Linux%20en%20el%20taller-16.png)

* **Ramas sin miedo:** Creamos una rama `experimento` (`git switch -c experimento`), avanzamos con los commits `C` y `D`, y al volver con `git switch main` seguimos viendo `B` sin perder nada de lo hecho en `experimento`.
* **Comandos base de Linux en terminal:** `pwd` (dónde estoy), `ls -a` (ver también archivos ocultos como `.git` o `.env`) y `cd views` (moverse entre carpetas).
* **Local vs. Remoto:** `git push` envía tus commits a GitHub; `git pull` trae los cambios del remoto. **La rama configurada en Render decide qué versión se despliega.**

---

### 📌 Lámina 06 · De GitHub a producción con Render

![06. De GitHub a producción con Render](infografia_reflexiones_practica/6.%20De%20GitHub%20a%20produccio%CC%81n%20con%20Render-17.png)

El viaje en 4 etapas desde que conectas tu repositorio en Render:
1. **Conexión:** Se selecciona el repositorio de GitHub y la rama `main` (Render registra el **commit SHA** exacto).
2. **Build:** Ejecuta `npm ci` leyendo `package.json` y `package-lock.json` para instalar dependencias reproducibles.
3. **Start:** Ejecuta `npm start` (lanzando el servidor Node.js).
4. **Health Check y URL pública:** Comprueba `GET /health` (`200 OK`) antes de exponer el servicio en la URL HTTPS pública (`https://mi-app.onrender.com`), mientras los datos persisten fuera del proceso en **Atlas**.

---

### 📌 Lámina 07 · Dónde vive el `.env`

![07. Dónde vive el .env](infografia_reflexiones_practica/7.%20Do%CC%81nde%20vive%20el%20.env-1.png)

* **En local:** El archivo `.env` vive en tu equipo pero está **ignorado por `.gitignore`**. En Git solo subimos `.env.example` (los nombres de variables, nunca contraseñas reales). Node lo carga con `require('dotenv').config()` o con `node --env-file .env index.js`.
* **En Render (PaaS):** Las credenciales (`MONGODB_URI`) se definen en el panel **Environment** y Render las inyecta directamente en `process.env` del proceso. *(Rama opcional: también existen «Secret Files» montados en `/etc/secrets/.env`, que la app debe leer explícitamente).*
* **Red y puertos:** El tráfico público entra por el puerto **443 (HTTPS)** y Render lo redirige al puerto interno de Express (`process.env.PORT`, por defecto `10000`), escuchando en `0.0.0.0`.

---

### 📌 Lámina 08 · Kubernetes por dentro: pods y nodos

![08. Kubernetes por dentro: pods y nodos](infografia_reflexiones_practica/8.%20Kubernetes%20por%20dentro_%20pods%20y%20nodos-6.png)

* **Jerarquía fundamental:**
  * **Nodo (*worker*):** Máquina física o virtual donde corren las cargas.
  * **Pod:** Unidad mínima de despliegue con **red/IP compartida** (`10.42.0.17`).
  * **Contenedor:** Proceso aislado que corre dentro del pod.
* **Flujo de orquestación:** El `Deployment` declara el estado deseado (`replicas: 5`) → el **Plano de control** (`API Server`, `Scheduler`, `Controller Manager`, `etcd`) asigna cada pod a un nodo → en el nodo, `kubelet` invoca a `containerd` para arrancar los contenedores.

> [!IMPORTANT]
> **Aclaración docente sobre la lámina 08:**
> * El **Pod A** incluye un segundo contenedor **Sidecar** (puerto `9100` junto a la app Node.js en el `3000`) para ilustrar que **un mismo pod puede albergar varios contenedores** compartiendo IP pero usando puertos diferentes.
> * Si los cinco pods fueran réplicas de un mismo `Deployment`, **todos partirían de la misma plantilla** (o todos llevarían sidecar o ninguno).
> * Recuerda que este corte de Kubernetes se usa como **modelo de referencia** para comprender cómo operan internamente plataformas gestionadas como Render o Colab.

---

### 📌 Lámina 09 · Un balanceador, muchos Express

![09. Un balanceador, muchos Express](infografia_reflexiones_practica/9.%20Un%20balanceador%2C%20muchos%20Express-12.png)

* **Recorrido completo del tráfico:**
  `Navegadores` → `Balanceador de entrada HTTPS` → `Service (app)` → `Pods de Express (:10000)` en Nodo A y Nodo B → **la misma MongoDB Atlas de producción**.
* El `Service` selecciona solo los **pods listos** y reparte las peticiones dirigiendo `targetPort: 10000` al puerto de Express en cada pod (el sidecar no recibe tráfico del `Service`).
* **Advertencia de escalado:** Añadir más instancias de Express también multiplica las conexiones abiertas hacia la base de datos; escalar exige **medir Atlas y limitar conexiones**.

---

### 📌 Lámina 10 · Tres entornos, un mismo código

![10. Tres entornos, un mismo código](infografia_reflexiones_practica/10.%20Tres%20entornos%2C%20un%20mismo%20co%CC%81digo-2.png)

* **Un código, tres servicios independientes:**
  * **Desarrollo:** 1 réplica (1 pod) → colección `tasks_dev`.
  * **Preproducción (*staging*):** 2 réplicas (2 pods) → colección `tasks_staging`.
  * **Producción:** 3 réplicas (3 pods) → colección `tasks_prod`.
* Cada servicio usa el **mismo repositorio**, pero recibe distintas variables de entorno (`MONGODB_URI` y `TASKS_COLLECTION`) y permisos propios.
* **Matiz docente:** Aquí se muestra un **ejemplo docente** con un clúster Atlas compartido (base `todo` con colecciones separadas); en producción real de empresa se separan bases de datos o clústeres completos para maximizar el aislamiento.

---

## Bloque III · 11–13 · Jenkins, CI/CD y Control‑M

Automatización de pruebas, despliegue continuo validado y orquestación industrial de trabajos por lotes (*batch*).

---

### 📌 Lámina 11 · Qué mira Jenkins

![11. Qué mira Jenkins](infografia_reflexiones_practica/11.%20Que%CC%81%20mira%20Jenkins-9.png)

1. Un **Pull Request (PR)** o commit en GitHub dispara un **Webhook** hacia el controlador de **Jenkins**.
2. Jenkins lee el **`Jenkinsfile`** del repositorio y asigna un **Agente Linux**.
3. El agente ejecuta `checkout scm`, creando su directorio **`WORKSPACE`** con el código.
4. En el *workspace* corre los comandos del pipeline: `npm ci`, `npm run lint` y `npm test` (contra un Atlas de pruebas o *fixture*).
5. Finalmente emite el veredicto (semáforo **rojo** o **verde**) y publica el estado (`CI: passed`) y el informe en el PR o commit de GitHub.

---

### 📌 Lámina 12 · Del verde al tráfico real

![12. Del verde al tráfico real](infografia_reflexiones_practica/12.%20Del%20verde%20al%20tra%CC%81fico%20real-11.png)

Secuencia de **CD** en 5 pasos ordenados:
1. El PR con todos los *checks* en verde se fusiona (*merge*) en `main`.
2. CI vuelve a validar el commit desplegable en `main`.
3. Render, configurado con **«After CI Checks Pass»**, inicia el build para ese **SHA** concreto.
4. La nueva versión arranca con sus variables propias y solo recibe el tráfico (`vN → vN+1`) cuando pasa el **`/health`**.
5. El operador revisa **logs y métricas**; si algo falla, ejecuta **Rollback** para volver de inmediato a la versión estable anterior.
* **Diferencia clave:** *Continuous Delivery* = siempre listo para publicar; *Continuous Deployment* = publicación automática en producción.

---

### 📌 Lámina 13 · Control‑M coordina el flujo de trabajos

![13. Control-M coordina el flujo de trabajos](infografia_reflexiones_practica/13.%20Control-M%20coordina%20el%20flujo%20de%20trabajos-14.png)

Control‑M ilustra otro patrón muy habitual en empresas: **orquestación de trabajos *batch* por horario y dependencias**.
1. A las `02:00`, Control‑M lanza `A · cargar.sh` en un agente Linux.
2. El flujo depende del **código de salida** del script:
   * Si devuelve **`exit 0`**, dispara el evento `CARGA_OK`, que **desbloquea** la ejecución de `B · generar_informe.sh`.
   * Si devuelve **`exit 1`**, lanza una **alerta** y `B` queda en espera (el script debe propagar el error).
3. El inspector consulta `stdout` y `stderr` para diagnosticar el fallo y relanza `A` gracias a que está diseñado con **procesamiento idempotente** (puede reejecutarse sin duplicar ni corromper datos).

---

## Bloque IV · 14–16 · Colab, Kaggle y escalado

Cómo funcionan por dentro los notebooks de ciencia de datos en la nube y cómo diagnosticar cuellos de botella antes de gastar dinero añadiendo pods.

---

### 📌 Lámina 14 · Colab bajo la lupa

![14. Colab bajo la lupa](infografia_reflexiones_practica/14.%20Colab%20bajo%20la%20lupa-13.png)

Corte arquitectónico en capas, de arriba hacia abajo:
1. **Navegador:** Abre el archivo `.ipynb` con celdas de código.
2. **Colab:** Interfaz compatible con Jupyter que comunica tus celdas con un kernel.
3. **Kernel IPython:** Recibe el código y lo envía al intérprete.
4. **CPython → Bytecode → PVM:** El intérprete compila el código Python a **bytecode** y la **PVM** (*Python Virtual Machine*) lo ejecuta dentro de CPython.
5. **Sistema Linux y VM de sesión:** Todo corre dentro de una **máquina virtual temporal con Ubuntu** y recursos asignados (CPU/RAM/disco). Podemos comprobarlo desde una celda con `!cat /etc/os-release` o `import sys; print(sys.executable)`.

---

### 📌 Lámina 15 · Kaggle, Jupyter y las celdas

![15. Kaggle, Jupyter y las celdas](infografia_reflexiones_practica/15.%20Kaggle%2C%20Jupyter%20y%20las%20celdas-10.png)

* **Cómo se ejecuta un notebook:** Imagen Docker (CPU/GPU) → Entorno Python con librerías → **Kernel** (mantiene en memoria las variables y librerías entre celdas).
* **La trampa clásica del kernel:** El archivo `.ipynb` guarda las celdas y puede guardar las salidas antiguas pintadas en pantalla, pero **el estado real vive en el kernel**. Si reinicias el kernel, la variable `df` desaparece y ejecutar `df.head()` antes de `df = cargar_datos()` lanzará `NameError: name 'df' is not defined`.
* **Colab vs. Kaggle:** Colab destaca por su VM de sesión integrada con Google Drive; Kaggle destaca por sus *Datasets*, competiciones e imágenes Python públicas preconfiguradas.

---

### 📌 Lámina 16 · El laboratorio del millón

![16. El laboratorio del millón](infografia_reflexiones_practica/16.%20El%20laboratorio%20del%20millo%CC%81n-4.png)

La prueba final de fuego: pasar de 200 tareas en desarrollo a un escenario de producción con millones de documentos y peticiones `GET` sin límite.
* **Diagnóstico en los logs:** Al detectar consultas lentas (`~300 ms`), el plan de consulta optimizado aplica:
  1. **Paginación:** `.limit(50).skip(0)` para no traer toda la colección de golpe.
  2. **Índice compuesto:** `db.tareas.createIndex({ usuario: 1, fecha: 1 })`.
* **Regla de oro del escalado:** *«Más pods no arreglan una consulta lenta»*. Antes de añadir pods hay que **medir CPU, latencia y conexiones** para localizar qué capa limita realmente el sistema; escalar una consulta sin índice solo multiplica el problema sobre la base de datos.
* **Ejercicio final extremo a extremo:**
  1. Hacer `POST` desde el móvil.
  2. Hacer `GET` desde el portátil.
  3. Cruzar los logs de **Express** y **MongoDB Atlas**.
  4. Localizar qué instancia concreta atendió cada petición.
