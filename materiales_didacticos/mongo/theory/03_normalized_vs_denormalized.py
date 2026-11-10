#!/usr/bin/env python3
"""
03_normalized_vs_denormalized.py

Implementación en Python (PyMongo) de la diapositiva:
"Query in normalized and denormalized case" (Mongo DB.pdf, pág 63)

Comparativa práctica:
1. Normalización: aggregate con $lookup y $project (emula un INNER/LEFT JOIN)
2. Desnormalización: find con proyección de claves anidadas {"author.name": 1}
3. Embebido en To-Do List: Documentos con listas anidadas de tareas

Ejecución:
    python3 03_normalized_vs_denormalized.py
"""

import json

print("================================================================================")
print("🐍 [PYTHON] QUERY IN NORMALIZED AND DENORMALIZED CASE (Mongo DB.pdf - Slide 63)")
print("================================================================================")

# Datos de autores y posts
autores = [
    {"_id": "auth_01", "name": "Alice Walker", "email": "alice@email.com"},
    {"_id": "auth_02", "name": "Gabriel García Márquez", "email": "gabo@email.com"}
]

posts_normalizados = [
    {"_id": "post_101", "title": "Introducción a NoSQL", "author_id": "auth_01"},
    {"_id": "post_102", "title": "Cien Años de Soledad", "author_id": "auth_02"}
]

posts_desnormalizados = [
    {
        "_id": "post_201",
        "title": "Introducción a NoSQL",
        "author": {"name": "Alice Walker", "email": "alice@email.com"}
    }
]

# 1. Pipeline de agregación en Python (Sintaxis exacta de PyMongo)
pipeline_lookup = [
    {
        "$lookup": {
            "from": "authors",
            "localField": "author_id",
            "foreignField": "_id",
            "as": "author_details"
        }
    },
    {
        "$project": {
            "title": 1,
            "author_name": "$author_details.name"
        }
    }
]

print("\n--- CASO 1: PIPELINE NORMALIZADO CON PYMONGO ($lookup) ---")
print("Pipeline BSON que se enviaría a db.posts.aggregate(pipeline_lookup):")
print(json.dumps(pipeline_lookup, indent=2))

# Simulación lógica en Python del $lookup
resultado_lookup = []
for p in posts_normalizados:
    autor_match = next((a for a in autores if a["_id"] == p["author_id"]), None)
    resultado_lookup.append({
        "title": p["title"],
        "author_name": autor_match["name"] if autor_match else None
    })

print("Resultado simulado:", resultado_lookup)


# 2. Consulta desnormalizada en Python (Sintaxis find con proyección)
print("\n--- CASO 2: CONSULTA DESNORMALIZADA / EMBEBIDA CON PYMONGO ---")
print("Llamada en PyMongo: db.posts.find({}, {'title': 1, 'author.name': 1})")

resultado_directo = [
    {"title": p["title"], "author_name": p["author"]["name"]}
    for p in posts_desnormalizados
]
print("Resultado directo:", resultado_directo)


# 3. Composición To-Do List (Slide 69)
print("\n--- CASO 3: ESQUEMA TO-DO LIST EMBEBIDO (Slide 69) ---")
todo_list = {
    "_id": "list_999",
    "name": "Tareas Urgentes",
    "items": [
        {"_id": "item_1", "name": "Instalar pymongo"},
        {"_id": "item_2", "name": "Aprender try/except y await"}
    ]
}
print(json.dumps(todo_list, indent=2, ensure_ascii=False))
print("\n💡 Conclusión:")
print("- En Python como en Node.js, embeber objetos simplifica la lectura al máximo.")
print("- Normalizar requiere agregaciones complejas ($lookup), pero evita duplicar datos en múltiples sitios.")

