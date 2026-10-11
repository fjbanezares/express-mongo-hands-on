# 📚 Materiales Didácticos: Arquitectura, Despliegues y Bases de Datos
> **Hub central de módulos formativos teóricos y prácticos: de MongoDB y PostgreSQL a DevOps, Docker, Kubernetes, DevSecOps y Arquitectura de Sistemas.**

---

📍 **Navegación:** [🏠 Volver a la Raíz del Proyecto](../README.md)

---

## 🗺️ Mapa Completo de los 7 Módulos

```
   ┌───────────────────┬───────────────────┬───────────────────┬───────────────────┬───────────────────┬───────────────────┬───────────────────┐
   ▼                   ▼                   ▼                   ▼                   ▼                   ▼                   ▼                   ▼
[ MÓDULO 1 ]        [ MÓDULO 2 ]        [ MÓDULO 3 ]        [ MÓDULO 4 ]        [ MÓDULO 5 ]        [ MÓDULO 6 ]        [ MÓDULO 7 ]
Persistencia vs RAM awcodeAtlas.js      Despliegues Cloud   Balanceadores, DNS  Postgres vs Mongo   Despliegue Seguro   PostgreSQL Arquitectura
MongoDB vs SQL      CRUD y Mongoose     Docker, K8s, CI/CD  Namespaces & Redes  awcodePostgres.js   DevSecOps & OWASP   Esquemas, Pass & Python
```

### 🧭 Índice de Módulos Formativos

1. 📘 **[Módulo 1: Fundamentos de Persistencia y Comparativa NoSQL vs SQL](./01-fundamentos-persistencia-mongo-vs-sql.md)**  
   *Por qué importa persistir, RAM vs disco, MongoDB vs PostgreSQL, y criterio de selección de tecnologías.*

2. 📗 **[Módulo 2: Curso Práctico - Código awcodeAtlas.js y CRUD Completo](./02-curso-practica-awcodeAtlas-crud-completo.md)**  
   *Anatomía de Express, EJS, subdocumentos embebidos en Mongoose, patrón PRG y conexión segura a MongoDB Atlas.*

3. 📙 **[Módulo 3: Curso Maestro de Despliegues Cloud, Contenedores y DevOps](./03-curso-maestro-despliegues-cloud-devops.md)**  
   *Render, Dockerfiles en Alpine Linux, orquestación con Kubernetes, Hyperscalers (AWS/GCP/Azure) y pipelines de CI/CD.*

4. 📕 **[Módulo 4: Balanceadores de Carga, DNS, Redes y Seguridad en Despliegues](./04-balanceadores-dns-redes-y-seguridad.md)**  
   *Balanceo L4 vs L7, estrategias Zero-Downtime (Rolling, Blue-Green, Canary), Ingress/Routes, resolución DNS y namespaces.*

5. 📓 **[Módulo 5: Despliegue con PostgreSQL vs MongoDB Atlas (awcodePostgres.js)](./05-despliegue-postgresql-vs-mongodb.md)**  
   *Backend relacional, `CREATE TABLE IF NOT EXISTS`, pools de conexión SSL, relaciones 1:N con `CASCADE` y matriz comparativa.*

6. 🛡️ **[Módulo 6: Despliegue Seguro, DevSecOps y Hardening Web](./06-despliegue-seguro-devsecops-owasp.md)**  
   *Inyecciones SQL/NoSQL en código real, TLS con Wireshark, hardening con Helmet, contenedores no-root y seguridad en K8s.*

7. 🐘 **[Módulo 7: PostgreSQL: Arquitectura, Esquemas, Passwords e Inicialización](./07-postgresql-arquitectura-esquemas-passwords.md)**  
   *La metáfora del edificio residencial (Instancia ➔ Base de datos ➔ Esquema ➔ Tablas), el gran embrollo de por qué se llama `SCHEMA` en lugar de `NAMESPACE` (ANSI SQL-92 vs Mongoose/Avro y el código C de `pg_namespace`), cambio de llaves en pgAdmin y `psql`, el misterio de `search_path` y `public`, y automatización con Python sin exponer claves.*

---

## 🖼️ Carpetas de Infografías Originales

* 📂 **[`inforgrafia_despliegue_atlas/`](./inforgrafia_despliegue_atlas/):** 21 infografías de persistencia, CRUD, Docker, K8s, hyperscalers, balanceadores y DNS.
* 📂 **[`seguridad_despliegues/`](./seguridad_despliegues/):** 9 infografías de ciberseguridad, OWASP, TLS, hardening y DevSecOps.
* 📂 **[`postgres_schemas_passwords_init/`](./postgres_schemas_passwords_init/):** 6 infografías de arquitectura PostgreSQL, esquemas, `search_path`, roles y automatización Python.
