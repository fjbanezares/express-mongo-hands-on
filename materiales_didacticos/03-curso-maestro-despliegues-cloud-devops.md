# Módulo 3: Curso Maestro de Despliegues, Cloud y DevOps
> **De tu portátil al mundo: Guía integral para publicar, contenerizar y operar aplicaciones Node.js + Express + MongoDB en entornos profesionales.**  
> *Basado en la serie infográfica «Del código al despliegue real» (Páginas 1 a 6).*

---

📍 **Navegación:** [⬅️ Anterior: Módulo 2 (Curso Práctico awcodeAtlas.js)](./02-curso-practica-awcodeAtlas-crud-completo.md) | [🏠 Volver al README Principal](./README.md) | [Siguiente: Módulo 4 (Balanceadores, DNS & Seguridad) ➡️](./04-balanceadores-dns-redes-y-seguridad.md)

---

![Del código al despliegue real](inforgrafia_despliegue_atlas/deploys1.png)

---

## 1. ¿Qué Significa Realmente «Desplegar»?

Desplegar (*deployment*) no es simplemente subir un archivo o pulsar un botón. Es el proceso de ingeniería mediante el cual una aplicación que funciona en el entorno controlado de tu ordenador personal se vuelve **accesible, estable, segura y repetible** para cualquier usuario conectado a Internet.

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│        ENTORNO LOCAL (DEV)      │           │      PRODUCCIÓN REAL (CLOUD)    │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ • Solo tú tienes acceso         │           │ • Accesible vía dominio público │
│ • localhost:3000                │           │ • Certificado HTTPS / TLS       │
│ • Si cierras la tapa, se apaga  │   ───▶    │ • Alta disponibilidad 24/7/365  │
│ • Un fallo afecta solo a ti     │           │ • Aislamiento y resiliencia     │
│ • Configuración en memoria/.env │           │ • Secrets cifrados y gestores   │
│ • Sin métricas ni alertas       │           │ • Observabilidad, logs y salud  │
└─────────────────────────────────┘           └─────────────────────────────────┘
```

### Las 7 Piezas Clave de un Despliegue Moderno
1. **Aplicación:** El código fuente empaquetado (Node.js + Express + EJS).
2. **Servidor / Runtime:** La máquina física, virtual o contenedor donde corre el proceso de Node.
3. **Red e Infraestructura:** Dominios (DNS), balanceadores de carga, cortafuegos (*firewalls*) y certificados TLS/HTTPS.
4. **Base de Datos Gestionada:** MongoDB Atlas con réplicas activas, fuera del servidor de la aplicación.
5. **Configuración y Secretos:** Inyección segura de variables de entorno (`PORT`, `MONGODB_ATLAS_URI`).
6. **Seguridad:** Principio de mínimo privilegio, control de accesos y rotación de claves.
7. **Observabilidad:** Registro de trazas de ejecución (*logs*), supervisión de métricas de CPU/memoria y alertas automáticas de caídas.

---

### La Pirámide de los Tres Entornos
Para garantizar que nada falle de cara al usuario final, los equipos profesionales estructuran su ciclo de entrega en tres niveles claramente aislados:

```
        ▲
       / \
      /   \       PRODUCCIÓN (PROD)       ──▶ Tráfico de usuarios reales. Máxima seguridad,
     / PROD\                                  backups continuos, métricas y alta disponibilidad.
    /───────\
   / STAGING \    PREPRODUCCIÓN (STAGING) ──▶ Réplica exacta de producción. Ensayos generales,
  /───────────\                               pruebas de carga e integración con base de datos.
 / DESARROLLO  \  DESARROLLO (DEV)        ──▶ El portátil del desarrollador. Pruebas rápidas,
/───────────────\                             cambios continuos, recarga en vivo con nodemon.
```

---

![Despliegue práctico paso a paso](inforgrafia_despliegue_atlas/deploys2.png)

---

## 2. Despliegue Práctico Paso a Paso: PaaS Ligeras y Docker

### A. Checklist Pre-Despliegue
Antes de intentar publicar la aplicación en cualquier proveedor cloud, debemos verificar minuciosamente estos seis puntos en local:

- [ ] **Funcionamiento local probado:** La app arranca limpiamente con `npm start` y responde sin errores.
- [ ] **Dependencias completas en `package.json`:** Todas las librerías necesarias (`express`, `mongoose`, `ejs`, `lodash`, etc.) están registradas en `"dependencies"` (no solo existiendo localmente en la carpeta `node_modules`).
- [ ] **Script de inicio definido:** En `package.json` existe un comando de arranque estándar:
  ```json
  "scripts": {
    "start": "node awcodeAtlas.js"
  }
  ```
- [ ] **Puerto dinámico configurado:** El código no fija rígidamente el puerto 3000, sino que escucha la variable asignada por la nube:
  ```javascript
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));
  ```
- [ ] **Higiene de secretos en Git:** El fichero `.env` está añadido al `.gitignore` y no se ha subido ninguna credencial al repositorio de GitHub.
- [ ] **Clúster Atlas accesible:** La lista de acceso de red (*Network Access*) en Atlas permite conexiones de la plataforma cloud (o `0.0.0.0/0` con autenticación fuerte de usuario/contraseña).

---

### B. Despliegue en Render (PaaS Recomendada para Docencia)

**Render** ofrece un equilibrio excepcional entre sencillez didáctica y capacidades de producción real:

```
[ Desarrollador ] ──git push──▶ [ GitHub Repo ] ──webhook──▶ [ Render Web Service ]
                                                                      │
                                                ┌─────────────────────┴─────────────────────┐
                                                ▼                                           ▼
                                        npm install & build                         Inyecta Secrets
                                                │                                  (MONGODB_ATLAS_URI)
                                                ▼                                           │
                                        node awcodeAtlas.js ◀───────────────────────────────┘
                                                │
                                                ▼
                                   https://mi-todolist.onrender.com (HTTPS Activo)
```

#### Paso a Paso en Render:
1. Sube tu código a un repositorio de GitHub (público o privado).
2. Regístrate en [Render.com](https://render.com) y selecciona **New +** ➔ **Web Service**.
3. Conecta el repositorio de GitHub correspondiente.
4. Configura los parámetros de ejecución:
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node awcodeAtlas.js` (o `npm start`)
5. En la sección **Environment Variables**, añade:
   * `MONGODB_ATLAS_URI`: tu cadena de conexión completa de MongoDB Atlas con usuario y contraseña válidos.
6. Pulsa **Create Web Service**. Render clonará el repositorio, instalará las dependencias, provisionará un certificado SSL/TLS gratuito y expondrá una URL pública segura del tipo `https://tu-app.onrender.com`.

---

### C. Contenerización con Docker: El Estándar de la Industria

Empaquetar la aplicación en una imagen de Docker garantiza el principio fundamental de la ingeniería de software moderna: **«Si funciona en mi máquina, funciona de forma idéntica en cualquier servidor del planeta»**.

Creamos un archivo llamado `Dockerfile` en la raíz del proyecto:

```dockerfile
# 1. Imagen base ligera oficial de Node.js en Alpine Linux
FROM node:20-alpine

# 2. Directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos solo los manifiestos de dependencias para aprovechar la caché de capas
COPY package*.json ./

# 4. Instalamos únicamente dependencias de producción
RUN npm ci --omit=dev

# 5. Copiamos el resto del código fuente
COPY . .

# 6. Definimos variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# 7. Exponemos el puerto al exterior del contenedor
EXPOSE 3000

# 8. Comando de ejecución del proceso principal
CMD ["node", "awcodeAtlas.js"]
```

#### Comandos para construir y ejecutar localmente el contenedor:
```bash
# Construir la imagen localmente con la etiqueta 'todolist-app:1.0.0'
docker build -t todolist-app:1.0.0 .

# Ejecutar el contenedor mapeando el puerto 3000 e inyectando la URI de Atlas
docker run -d -p 3000:3000 \
  -e MONGODB_ATLAS_URI="mongodb+srv://user:pass@cluster0.../todolistDB?retryWrites=true&w=majority" \
  --name todolist-running todolist-app:1.0.0
```

---

![Kubernetes: cuando el despliegue crece](inforgrafia_despliegue_atlas/deploys3.png)

---

## 3. Kubernetes (K8s): Orquestación Cuando el Despliegue Crece

Cuando una aplicación pasa de tener cientos de visitas a millones de peticiones concurrentes, una única máquina o un contenedor aislado resulta insuficiente. Aquí entra en juego **Kubernetes (K8s)** como orquestador distribuido de contenedores.

### Arquitectura de la To-Do App en Kubernetes

```
                      [ Clientes en Internet ]
                                 │
                                 ▼
                     [ Ingress Controller ]
                    (Terminación SSL + Enrutamiento)
                                 │
                                 ▼
                         [ Service (K8s) ]
                     (Balanceador Interno de Tráfico)
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
     [ Pod 1 (Node) ]     [ Pod 2 (Node) ]     [ Pod 3 (Node) ]
     (Contenedor App)     (Contenedor App)     (Contenedor App)
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │  Conexiones TCP seguras (TLS)
                                 ▼
                  [ Clúster Externo: MongoDB Atlas ]
                  (Persistencia desacoplada del cómputo)
```

> [!IMPORTANT]
> **Desacoplamiento Estado vs Cómputo:**  
> La aplicación Express en los Pods es **completamente sin estado (*stateless*)**. Los Pods pueden crearse, escalarse o destruirse en milisegundos. Toda la persistencia, transaccionalidad y durabilidad reside en **MongoDB Atlas**, que opera como un servicio gestionado independiente fuera del clúster de Kubernetes.

### Manifiesto de Despliegue Completo: `deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todolist-deployment
  labels:
    app: todolist
spec:
  replicas: 3 # Mantiene siempre 3 copias activas de la app
  selector:
    matchLabels:
      app: todolist
  template:
    metadata:
      labels:
        app: todolist
    spec:
      containers:
      - name: todolist-container
        image: ghcr.io/mi-usuario/todolist-app:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: todolist-config
              key: PORT
        - name: MONGODB_ATLAS_URI
          valueFrom:
            secretKeyRef:
              name: todolist-secrets
              key: MONGODB_ATLAS_URI
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "100m"
            memory: "128Mi"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 15
```

---

![Hyperscalers: AWS, GCP y Azure](inforgrafia_despliegue_atlas/deploys4.png)

---

## 4. Los Tres Caminos en los Grandes Hyperscalers (AWS, GCP, Azure)

Al desplegar en proveedores de nube pública masivos (*Hyperscalers*), la pregunta esencial del arquitecto no es «¿cuál nube elijo?», sino **«¿qué nivel de abstracción necesita mi proyecto?»**:

```
                       NIVELES DE ABSTRACCIÓN CLOUD
                       
  [ 1. Máquina Virtual (IaaS) ]  ──▶ Máximo control del SO. Más mantenimiento y parches.
               ▲
               │
  [ 2. Plataforma Gestionada  ]  ──▶ Te centras en el código o contenedor. Auto-escalado.
       (PaaS / CaaS Serverless)       (¡RECOMENDADO PARA ESTA APP!)
               │
               ▼
  [ 3. Kubernetes Gestionado  ]  ──▶ Máxima portabilidad y escala masiva. Curva compleja.
```

### Mapa Comparativo de Servicios por Proveedor

| Concepto / Componente | Amazon Web Services (AWS) | Google Cloud Platform (GCP) | Microsoft Azure |
| :--- | :--- | :--- | :--- |
| **Máquina Virtual (IaaS)** | **EC2** (*Elastic Compute Cloud*) | **Compute Engine** | **Azure Virtual Machines** |
| **Plataforma Sencilla / PaaS**| **App Runner** / Elastic Beanstalk | **Cloud Run** / App Engine | **Azure App Service** |
| **Contenedores Ligeros** | **ECS con Fargate** (Serverless) | **Cloud Run** | **Azure Container Apps** |
| **Kubernetes Gestionado** | **EKS** (*Elastic Kube Service*) | **GKE** (*Google Kube Engine*) | **AKS** (*Azure Kube Service*) |
| **Gestión de DNS** | **Route 53** | **Cloud DNS** | **Azure DNS** |
| **Secretos y Credenciales** | **AWS Secrets Manager** | **Secret Manager** | **Azure Key Vault** |
| **Balanceador de Carga** | **Application Load Balancer (ALB)**| **Cloud Load Balancing** | **Application Gateway** |
| **Logs y Monitorización** | **Amazon CloudWatch** | **Cloud Logging & Monitoring**| **Azure Monitor** |

> [!TIP]
> **Veredicto para nuestra To-Do App:**  
> En GCP, **Cloud Run** es una de las soluciones más elegantes del mercado: toma la imagen Docker de tu aplicación, la levanta bajo demanda con certificado HTTPS automático y escala a cero cuando no hay tráfico, reduciendo el coste a prácticamente cero.  
> En AWS, **AWS App Runner** o **ECS con Fargate** ofrecen una experiencia análoga sin necesidad de administrar clústeres complejos de Kubernetes.

---

![Más allá de los hyperscalers](inforgrafia_despliegue_atlas/deploys5.png)

---

## 5. Más Allá de los Hyperscalers: OCI, Alibaba, On-Premise y Docker Local

No toda la infraestructura mundial se reduce a los tres grandes proveedores. Existen escenarios donde otras alternativas resultan mucho más rentables, especializadas o convenientes:

### A. Oracle Cloud Infrastructure (OCI)
* **Atractivo:** Nivel gratuito perpetuo (*Always Free Tier*) extraordinariamente generoso (hasta 4 OCPUs de arquitectura ARM Ampere y 24 GB de RAM gratuitos), excelente rendimiento por coste y profunda integración con bases de datos corporativas.
* **Servicios equivalentes:** Compute VMs, **OKE** (*Oracle Kubernetes Engine*), OCI Load Balancers y Vault.

### B. Alibaba Cloud
* **Atractivo:** La nube de referencia indiscutible para el mercado asiático (China, sudeste asiático). Si una aplicación tiene como objetivo usuarios en esa región, Alibaba Cloud ofrece tiempos de respuesta inalcanzables para centros de datos occidentales.
* **Servicios equivalentes:** ECS (*Elastic Compute Service*), **ACK** (*Alibaba Cloud Kubernetes*), SLB (*Server Load Balancer*).

### C. Despliegue On-Premise / Servidor Local / Raspberry Pi
Desplegar en servidores propios del centro de estudios o empresa otorga soberanía total de datos y coste de alojamiento cero, pero transfiere toda la responsabilidad operativa al equipo:
* Requiere configurar **IP pública estática** o **DDNS** (Dynamic DNS).
* Apertura de puertos en el router / cortafuegos (*Port Forwarding* de los puertos 80 y 443).
* Servidor web inverso con **Nginx, Traefik o Caddy** para recibir el tráfico y redirigirlo internamente al puerto 3000 de Node.js.
* Automatización de certificados SSL/TLS gratuitos mediante **Let's Encrypt / Certbot**.

### Matriz de Adecuación según el Contexto

| Escenario | Render / Railway / Fly | VM (OCI / AWS) | Kubernetes (EKS/GKE/OKE)| On-Premise / Local |
| :--- | :---: | :---: | :---: | :---: |
| **Demo de clase / Evaluación** | 🟢 **Excelente** | 🟡 Aceptable | 🔴 Sobreingeniería | 🟢 Bueno |
| **Prototipo MVP / Startup** | 🟢 **Excelente** | 🟢 Bueno | 🔴 Innecesario al inicio | 🔴 Inestable |
| **App en producción pequeña** | 🟢 **Muy bueno** | 🟢 Bueno | 🟡 Costoso | 🟡 Riesgoso |
| **Empresa consolidada / Gran escala**| 🔴 Insuficiente | 🟡 Complejo | 🟢 **Estándar industrial** | 🟢 Corporativo |
| **Entorno altamente sensible** | 🔴 Restringido | 🟢 Bueno | 🟢 Muy seguro | 🟢 **Control total** |

---

![CI/CD y automatización profesional](inforgrafia_despliegue_atlas/deploys6.png)

---

## 6. CI/CD y Automatización Profesional: Del Commit a Producción

El despliegue manual (conectarse por SSH a un servidor o subir archivos a mano) es lento, propenso a errores humanos y peligroso. La ingeniería de software moderna se apoya en **CI/CD**:

* **CI (Integración Continua):** Práctica en la que cada cambio de código en Git dispara automáticamente pruebas automáticas (*tests*), análisis estático (*linter*) y validación de sintaxis para garantizar que nada se rompa.
* **CD (Entrega y Despliegue Continuo):** Tras superar la fase de CI, el código se empaqueta automáticamente en una imagen Docker inmutable y se despliega en preproducción o producción sin intervención manual.

### El Flujo Profesional de 9 Pasos

```
[ 1. Commit/Push ] ──▶ [ 2. CI Tests & Lint ] ──▶ [ 3. Build Docker ] ──▶ [ 4. Push a Registry ]
   (git push main)        (npm test / eslint)        (docker build)          (GHCR / DockerHub)
                                                                                     │
                                                                                     ▼
[ 8. Deploy a Prod ] ◀── [ 7. Aprobación ] ◀── [ 6. Pruebas E2E ] ◀── [ 5. Deploy a Staging ]
   (Rolling Update)        (Gate Manual / QA)      (Smoke Tests)          (Ambiente Pruebas)
          │
          ▼
[ 9. Monitorización y Rollback Automático ]
```

### Ejemplo Práctico: Pipeline con GitHub Actions (`.github/workflows/deploy.yml`)

```yaml
name: CI/CD Pipeline - ToDo App

on:
  push:
    branches: [ "main" ]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
    - name: 1. Descargar código fuente
      uses: actions/checkout@v4

    - name: 2. Configurar Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'

    - name: 3. Instalar dependencias limpias
      run: npm ci

    - name: 4. Ejecutar pruebas unitarias
      run: npm test --if-present

    - name: 5. Autenticarse en GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: 6. Construir y publicar imagen Docker
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ghcr.io/${{ github.repository }}/todo-app:${{ github.sha }}

    - name: 7. Disparar Despliegue en Render (Webhook seguro)
      run: |
        curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

---

## 7. Estrategias de Despliegue en Producción

Para desplegar nuevas versiones sin que los usuarios experimenten caídas de servicio (*zero downtime*), se emplean cuatro estrategias principales:

```
A. ROLLING UPDATE (Actualización progresiva)
   [ V1 ] [ V1 ] [ V1 ]  ──▶  [ V2 ] [ V1 ] [ V1 ]  ──▶  [ V2 ] [ V2 ] [ V1 ]  ──▶  [ V2 ] [ V2 ] [ V2 ]
   Se actualizan instancias una a una. Es la estrategia por defecto en Kubernetes y Render.

B. BLUE / GREEN (Azul / Verde)
   [ Entorno Azul (V1 ACTIVO) ]   ──▶   [ Entorno Verde (V2 PREPARADO) ]
   Se valida Verde por completo; luego el balanceador cambia el 100% del tráfico instantáneamente.

C. CANARY (Despliegue Canario)
   El 95% del tráfico sigue yendo a V1; el 5% se envía a V2 para detectar anomalías en métricas.
   Si todo es estable, se migra gradualmente el 100%.

D. ROLLBACK (Reversión Inmediata)
   Si la nueva versión arroja errores HTTP 500 o fallos de conexión a MongoDB, el orquestador
   revierte de forma automática e inmediata al contenedor de la versión anterior que sí funcionaba.
```

---

## 8. El Mapa de Madurez del Ingeniero Cloud

Un buen profesional no salta inmediatamente al sistema más complejo, sino que progresa siguiendo un camino de madurez técnica escalonado:

```
Nivel 1: Local Manual       ➔ node awcodeAtlas.js en tu propio ordenador.
Nivel 2: Contenedor Local   ➔ docker run en local; aislamiento de dependencias.
Nivel 3: PaaS Gestionada    ➔ Render / Railway / Fly.io conectadas a GitHub.
Nivel 4: Cloud Hyperscaler  ➔ AWS App Runner / GCP Cloud Run / Azure Container Apps.
Nivel 5: Alta Escala DevOps ➔ Kubernetes + Helm + CI/CD con GitHub Actions + GitOps (ArgoCD).
```

> [!NOTE]
> **Veredicto Final:**  
> Desplegar no es saber qué comando escribir en un proveedor concreto: es **entender la arquitectura distribuida** y elegir el nivel de abstracción exacto que aporte valor al usuario sin generar costes ni complejidades operativas innecesarias.

---

📍 **Navegación:** [⬅️ Anterior: Módulo 2 (Curso Práctico awcodeAtlas.js)](./02-curso-practica-awcodeAtlas-crud-completo.md) | [🏠 Volver al README Principal](./README.md) | [Siguiente: Módulo 4 (Balanceadores, DNS & Seguridad) ➡️](./04-balanceadores-dns-redes-y-seguridad.md)
