# 🚀 Masterclass Express + MongoDB: De la Memoria a la Nube, DevOps y Seguridad
> **Curso integral y práctico sobre persistencia de datos, desarrollo backend con Node.js/Express, MongoDB Atlas vs PostgreSQL, despliegues profesionales (Docker, Kubernetes, Render), redes avanzadas (Balanceadores L4/L7, DNS) y ciberseguridad práctica (DevSecOps, Hardening con Helmet, TLS con Wireshark y OWASP).**

---

## 🌟 El Espíritu y Filosofía de este Repositorio

Muchas formaciones web comienzan enseñando listas de tareas (*To-Do Lists*) que guardan datos en variables volátiles en la memoria RAM del servidor (`let items = [...]`). Aunque esto permite entender rutas y peticiones básicas, genera una falsa ilusión de software: **en cuanto el servidor se reinicia o se despliega en la nube, todos los datos desaparecen**.

El objetivo de este repositorio es transformar esa práctica académica básica en una **solución de ingeniería de software real, resiliente y segura**. Centramos todo el aprendizaje en nuestro código estrella: [**`awcodeAtlas.js`**](./awcodeAtlas.js) (MongoDB Atlas) y su contraparte relacional [**`awcodePostgres.js`**](./awcodePostgres.js) (PostgreSQL), donde conectamos una aplicación completa de Express y EJS con bases de datos en la nube.

Para que el aprendizaje sea visual, intuitivo y riguroso, el curso se apoya en una **colección de 30 infografías de alta resolución** repartidas entre [`inforgrafia_despliegue_atlas/`](./inforgrafia_despliegue_atlas/) y [`seguridad_despliegues/`](./seguridad_despliegues/), expandiéndose en **seis módulos formativos exhaustivos**:

```
                                                      MAPA DE LA FORMACIÓN
                                                                │
   ┌───────────────────┬───────────────────┬────────────────────┼───────────────────┬───────────────────┬───────────────────┐
   ▼                   ▼                   ▼                    ▼                   ▼                   ▼                   ▼
[ MÓDULO 1 ]        [ MÓDULO 2 ]        [ MÓDULO 3 ]         [ MÓDULO 4 ]        [ MÓDULO 5 ]        [ MÓDULO 6 ]
Persistencia vs RAM awcodeAtlas.js      Despliegues Cloud    Balanceadores, DNS  Postgres vs Mongo   Despliegue Seguro
MongoDB vs SQL      CRUD y Mongoose     Docker, K8s, CI/CD   Namespaces & Redes  awcodePostgres.js   DevSecOps & OWASP
```

### 🧭 Enlaces Directos a los Módulos:
* 📘 **[Módulo 1: Fundamentos de Persistencia y Comparativa NoSQL vs SQL](./01-fundamentos-persistencia-mongo-vs-sql.md)**
* 📗 **[Módulo 2: Curso Práctico - Código awcodeAtlas.js y CRUD Completo](./02-curso-practica-awcodeAtlas-crud-completo.md)**
* 📙 **[Módulo 3: Curso Maestro de Despliegues Cloud, Contenedores y DevOps](./03-curso-maestro-despliegues-cloud-devops.md)**
* 📕 **[Módulo 4: Balanceadores de Carga, DNS, Redes y Seguridad en Despliegues](./04-balanceadores-dns-redes-y-seguridad.md)**
* 📓 **[Módulo 5: Despliegue con PostgreSQL vs MongoDB Atlas (awcodePostgres.js)](./05-despliegue-postgresql-vs-mongodb.md)**
* 🛡️ **[Módulo 6: Despliegue Seguro, DevSecOps y Hardening Web](./06-despliegue-seguro-devsecops-owasp.md)**

---

## 📚 Estructura Detallada de los Módulos

### 📘 [Módulo 1: Fundamentos de Persistencia y Criterio de Selección de Bases de Datos](./01-fundamentos-persistencia-mongo-vs-sql.md)
*Basado en la serie infográfica «Persistir vs No Persistir» (Páginas 1 a 4).*

* **Por qué importa persistir:** De una app efímera en memoria a una base de datos duradera.
* **El flujo de datos del cliente a la nube:** Cliente ➔ HTML/CSS/JS ➔ Express ➔ EJS ➔ Mongoose ➔ MongoDB ➔ Atlas.
* **La tríada dorada:** Qué aporta MongoDB (documentos), qué aporta Mongoose (orden y modelos) y qué aporta Atlas (infraestructura cloud).
* **Comparativa honesta MongoDB vs PostgreSQL:** Tablas vs Documentos, Joins vs Embebidos, Transacciones vs Velocidad de prototipado.
* **Veredicto tecnológico:** Cuándo usar MongoDB, cuándo PostgreSQL, MySQL, Redis o SQLite. *"Tecnología con criterio > tecnología por moda"*.

👉 **[Hacer clic aquí para abrir el Módulo 1](./01-fundamentos-persistencia-mongo-vs-sql.md)**

---

### 📗 [Módulo 2: Curso Práctico - La Práctica Estrella `awcodeAtlas.js` y el CRUD Completo](./02-curso-practica-awcodeAtlas-crud-completo.md)
*Basado en la serie infográfica «De este código a una app persistente» y «Radiografía del CRUD» (Páginas 1 a 6).*

* **Deconstrucción del código línea por línea:** Importaciones, middlewares (`body-parser`, `express.static`) y motor EJS.
* **Modelado de datos en Mongoose:** 
  * Colección independiente `Item` para la lista por defecto `"Today"`.
  * Colección `List` con arrays de **subdocumentos embebidos** para listas personalizadas (`/:customListName`).
* **Radiografía completa de las 4 operaciones CRUD:**
  * `GET /`: Lectura y auto-siembra (*auto-seed*) de datos iniciales.
  * `GET /:customListName`: Parámetros de ruta, normalización con `_.capitalize()` y creación perezosa de listas.
  * `POST /`: Creación de tareas con `item.save()` o `push()` en listas anidadas.
  * `POST /delete`: Borrado de documentos de primer nivel vs borrado atómico de subdocumentos con el operador `$pull`.
* **El patrón Post-Redirect-Get (PRG):** Evitando reenvíos accidentales y manteniendo limpio el historial del navegador.
* **Traducción de Mongoose al Driver nativo de MongoDB.**
* **Seguridad y buenas prácticas:** Desterrando contraseñas hardcodeadas hacia variables de entorno.

👉 **[Hacer clic aquí para abrir el Módulo 2](./02-curso-practica-awcodeAtlas-crud-completo.md)**

---

### 📙 [Módulo 3: Curso Maestro de Despliegues, Cloud y DevOps](./03-curso-maestro-despliegues-cloud-devops.md)
*Basado en la serie infográfica «Del código al despliegue real» (Páginas 1 a 6).*

* **¿Qué significa desplegar?** Los tres entornos esenciales: Desarrollo, Preproducción (Staging) y Producción.
* **Checklist pre-despliegue:** Dependencias, scripts de inicio, puerto dinámico `process.env.PORT` y `.gitignore`.
* **Despliegue práctico en Render:** Creación de Web Service, inyección de `MONGODB_ATLAS_URI` y dominios con SSL automático.
* **Empaquetado profesional con Docker:** Creación de un `Dockerfile` optimizado en Alpine Linux con separación de dependencias.
* **Orquestación con Kubernetes (K8s):**
  * Desacoplamiento de estado: Cómputo efímero en Pods de K8s y persistencia en MongoDB Atlas.
  * Conceptos clave: Pod, Deployment, Service, Ingress, Secret y ConfigMap.
  * Manifiesto YAML completo comentado para la aplicación To-Do.
* **Rutas en los Hyperscalers (AWS, GCP y Azure):** Comparativa entre Máquinas Virtuales (EC2/Compute Engine), Plataformas Gestionadas Serverless (AWS App Runner, GCP Cloud Run, Azure App Service) y Kubernetes gestionado (EKS, GKE, AKS).
* **Opciones alternativas:** Oracle Cloud (OCI Free Tier), Alibaba Cloud para Asia, On-Premise y Docker local.
* **CI/CD y Automatización Profesional:** Pipeline de 9 pasos con **GitHub Actions**, estrategias de despliegue (Rolling Updates, Blue-Green, Canary) y el Mapa de Madurez del Ingeniero Cloud.

👉 **[Hacer clic aquí para abrir el Módulo 3](./03-curso-maestro-despliegues-cloud-devops.md)**

---

### 📕 [Módulo 4: Balanceadores de Carga, DNS, Redes y Seguridad en Despliegues](./04-balanceadores-dns-redes-y-seguridad.md)
*Basado en la serie infográfica «Balanceadores de carga, DNS y despliegues» (Páginas 1 a 5).*

* **El balanceador de carga como pieza invisible:** Alta disponibilidad, escalado horizontal, tolerancia a fallos y por qué MongoDB Atlas no se balancea desde este componente.
* **Tipos de balanceo:** Capa 4 (L4 / Transporte TCP/UDP) vs Capa 7 (L7 / Aplicación HTTP/HTTPS, rutas, cookies y cabeceras).
* **Estrategias de release gestionadas por el balanceador:** Rolling Updates paso a paso, Blue/Green (switch instantáneo) y Canary (despliegue progresivo por porcentajes).
* **Kubernetes y OpenShift en la capa de red:** Ingress Controllers (NGINX), Services (balanceo interno), OpenShift Routes con HAProxy, y aislamiento por **Namespaces** con **RBAC** y **Network Policies**.
* **El catálogo en la nube:** Comparativa de AWS (ALB/NLB/Route 53), Google Cloud (Cloud Load Balancing/Cloud Armor), Azure (Application Gateway) y cómo plataformas como Render abstraen esta complejidad.
* **El recorrido End-to-End:** Desde que el usuario escribe la URL, resolución de registros DNS (A, CNAME, TTL), paso por el WAF y llegada a los Pods sanos.

👉 **[Hacer clic aquí para abrir el Módulo 4](./04-balanceadores-dns-redes-y-seguridad.md)**

---

### 📓 [Módulo 5: Despliegue con PostgreSQL vs MongoDB Atlas (awcodePostgres.js)](./05-despliegue-postgresql-vs-mongodb.md)
*Práctica y análisis comparativo del backend relacional vs NoSQL en entornos de producción.*

* **El código `awcodePostgres.js`:** Misma lógica de negocio, mismas vistas EJS ([`views/list.ejs`](./views/list.ejs)) y cero cambios en HTML/CSS gracias al alias `SELECT id AS _id`.
* **Inicialización DDL automática:** `CREATE TABLE IF NOT EXISTS` ejecutado al arrancar el servidor antes de `app.listen`, garantizando idempotencia en despliegues cloud (Render, Supabase, Neon).
* **Pool de conexiones y SSL:** Gestión con `pg.Pool` y configuración segura de certificados TLS para entornos de producción.
* **Integridad Referencial y Cascade:** Relación 1 a N entre `lists` e `items` con `ON DELETE CASCADE` frente a arrays embebidos de MongoDB.
* **Matriz Comparativa Exhaustiva:** Ventajas e inconvenientes de desplegar con PostgreSQL vs MongoDB Atlas (límites de conexiones, backups, migraciones de esquema, consistencia ACID y escalabilidad).

👉 **[Hacer clic aquí para abrir el Módulo 5](./05-despliegue-postgresql-vs-mongodb.md)**

---

### 🛡️ [Módulo 6: Despliegue Seguro, DevSecOps y Hardening Web](./06-despliegue-seguro-devsecops-owasp.md)
*Basado en la colección de 9 láminas infográficas de la carpeta [`seguridad_despliegues/`](./seguridad_despliegues/).*

* **Inyecciones en código real:** Demostración práctica de **SQL Injection** en PostgreSQL (concatenación vs parámetros preparados `$1`) y **NoSQL Injection** en MongoDB (operador `$gt: ""` vs `mongo-sanitize`).
* **Interceptación de tráfico con Wireshark y Kali Linux:** Por qué el HTTP en texto plano permite a un atacante en la red interceptar contraseñas mediante ARP Spoofing y cómo TLS 1.3 lo neutraliza.
* **Blindaje del servidor Express:** Cabeceras HTTP con `helmet` (CSP, HSTS, anti-clickjacking), limitación de peticiones con `express-rate-limit` (error 429) y políticas de CORS.
* **Dockerfiles seguros y no-root:** Ejecución obligatoria con `USER node`, exclusiones con `.dockerignore` y escaneo de vulnerabilidades con **Trivy**.
* **Kubernetes seguro:** `securityContext` (`readOnlyRootFilesystem`, `drop ALL capabilities`), **Network Policies** Pod-a-Pod y RBAC.
* **DevSecOps en CI/CD:** Controles automáticos de secretos (Gitleaks, TruffleHog), análisis SCA (`npm audit`, Snyk) y firmas de imágenes con **Cosign**.
* **Checklist interactivo de 8 puntos** y escalera de madurez de seguridad.

👉 **[Hacer clic aquí para abrir el Módulo 6](./06-despliegue-seguro-devsecops-owasp.md)**

---

## ⚡ Guía Rápida de Arranque en Local

Para poner en marcha la práctica estrella [**`awcodeAtlas.js`**](./awcodeAtlas.js) en tu máquina local:

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/fjbanezares/express-mongo-hands-on.git
cd express-mongo-hands-on
npm install
```

### 2. Configurar tus credenciales de MongoDB Atlas
Crea un archivo llamado `.env` en la raíz del proyecto (este archivo nunca debe subirse a Git):
```env
PORT=3000
MONGODB_ATLAS_URI=mongodb+srv://<tu_usuario>:<tu_password>@cluster0.xxxxx.mongodb.net/todolistDB?retryWrites=true&w=majority
```

> [!TIP]
> Recuerda configurar en el panel de MongoDB Atlas:
> 1. En **Database Access**: un usuario y contraseña dedicados para la base de datos (con rol `readWriteAnyDatabase`).
> 2. En **Network Access**: tu dirección IP actual o `0.0.0.0/0` para permitir accesos desde plataformas cloud.

### 3. Iniciar el servidor (Elige tu motor de Base de Datos)

* **Opción A: Versión MongoDB Atlas (NoSQL)**
  ```bash
  node awcodeAtlas.js
  # o con npm:
  npm start
  ```

* **Opción B: Versión PostgreSQL (SQL Relacional)**
  ```bash
  node awcodePostgres.js
  # o con npm:
  npm run start:postgres
  ```

Abre tu navegador en `http://localhost:3000` y prueba:
* Añadir y tachar tareas en la lista `"Today"`.
* Crear listas personalizadas accediendo a rutas como `http://localhost:3000/trabajo` o `http://localhost:3000/viajes`.

---

## 🖼️ Galería de Infografías Incluidas

El repositorio incluye **30 infografías de alta calidad** organizadas en dos carpetas temáticas:

| Bloque Temático | Carpeta / Archivos | Láminas | Tema Central |
| :--- | :--- | :---: | :--- |
| **Bloque 1: Persistencia & Criterio** | [`inforgrafia_despliegue_atlas/`](./inforgrafia_despliegue_atlas/) | 4 | Memoria vs BD, MongoDB+Mongoose+Atlas, Comparativa con Postgres y veredicto de arquitectura. |
| **Bloque 2: Práctica y Código** | [`inforgrafia_despliegue_atlas/`](./inforgrafia_despliegue_atlas/) | 6 | Anatomía de `awcodeAtlas.js`, EJS, CRUD completo, modelos embebidos, PRG y Atlas Cloud. |
| **Bloque 3: Despliegues & DevOps** | [`inforgrafia_despliegue_atlas/`](./inforgrafia_despliegue_atlas/) | 6 | Render, Dockerfile, Kubernetes, Hyperscalers (AWS/GCP/Azure), OCI/Alibaba y Pipelines CI/CD. |
| **Bloque 4: Balanceadores & Redes** | [`inforgrafia_despliegue_atlas/`](./inforgrafia_despliegue_atlas/) | 5 | Balanceadores L4/L7, Estrategias Zero-Downtime, Ingress/Routes, DNS End-to-End y Namespaces. |
| **Bloque 5: Despliegue Seguro & DevSecOps** | [`seguridad_despliegues/`](./seguridad_despliegues/) | 9 | Amenazas OWASP, SQL/NoSQL Injection, Secretos, Helmet, Docker no-root, TLS, K8s Pod Security y CI/CD. |

👉 **[Explorar infografías de Despliegue y Redes](./inforgrafia_despliegue_atlas/)**  
👉 **[Explorar infografías de Despliegue Seguro](./seguridad_despliegues/)**

---

## 🎓 Conclusión Docente

> **«La meta formativa no es memorizar la API de un framework o la sintaxis de un comando; es adquirir visión sistémica y criterio de ingeniería: saber cómo fluye una petición desde el navegador del usuario hasta un clúster distribuido en la nube, y saber blindar cada salto con rigor profesional.»**
