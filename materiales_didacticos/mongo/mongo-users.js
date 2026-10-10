// jshint esversion:8

// Importamos mongoose para interactuar con MongoDB
const mongoose = require("mongoose");

// Conexión a MongoDB Atlas
const MONGODB_ATLAS_URI =
    "mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/myDatabase?retryWrites=true&w=majority";
mongoose.connect(MONGODB_ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Creamos un esquema para representar datos de "Usuarios y Proyectos"
const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Nombre del usuario
    age: { type: Number, required: true }, // Edad del usuario
    email: { type: String, required: true, unique: true }, // Email único
    projects: [
        {
            title: String, // Título del proyecto
            description: String, // Descripción del proyecto
            completed: Boolean, // Si el proyecto está completado
        },
    ],
});

// Creamos un modelo basado en el esquema anterior
const User = mongoose.model("User", userSchema);

// Función principal para realizar las operaciones
const main = async () => {
    try {
        console.log("Conectado a MongoDB Atlas");

        // Limpia la colección antes de comenzar
        await User.deleteMany({});

        // Inserta 20 usuarios con proyectos
        const users = Array.from({ length: 20 }, (_, i) => ({
            name: `Usuario${i + 1}`,
            age: 20 + (i % 10), // Edad entre 20 y 30
            email: `usuario${i + 1}@example.com`,
            projects: [
                {
                    title: `Proyecto${i + 1}`,
                    description: `Descripción del proyecto ${i + 1}`,
                    completed: i % 2 === 0, // Alterna entre completado y no completado
                },
            ],
        }));
        await User.insertMany(users);
        console.log("20 usuarios insertados");

        // **QUERIES INSTRUCTIVAS**

        // 1. Encuentra todos los usuarios mayores de 25 años
        console.log(
            "\n1. Usuarios mayores de 25 años:",
            await User.find({ age: { $gt: 25 } }).limit(5)
        );

        // 2. Encuentra usuarios con al menos un proyecto completado
        console.log(
            "\n2. Usuarios con proyectos completados:",
            await User.find({ "projects.completed": true }).limit(5)
        );

        // 3. Encuentra un usuario por email
        console.log(
            "\n3. Usuario con email usuario10@example.com:",
            await User.findOne({ email: "usuario10@example.com" })
        );

        // 4. Encuentra usuarios con exactamente 1 proyecto
        console.log(
            "\n4. Usuarios con exactamente 1 proyecto:",
            await User.find({ projects: { $size: 1 } }).limit(5)
        );

        // 5. Actualiza la edad de un usuario por su nombre
        console.log(
            "\n5. Actualizando edad de Usuario1:",
            await User.updateOne({ name: "Usuario1" }, { $set: { age: 35 } })
        );

        // 6. Marca todos los proyectos de un usuario como completados
        console.log(
            "\n6. Marcando proyectos de Usuario2 como completados:",
            await User.updateOne(
                { name: "Usuario2" },
                { $set: { "projects.$[].completed": true } }
            )
        );

        // 7. Agrega un nuevo proyecto a un usuario
        console.log(
            "\n7. Agregando un nuevo proyecto a Usuario3:",
            await User.updateOne(
                { name: "Usuario3" },
                {
                    $push: {
                        projects: {
                            title: "Nuevo Proyecto",
                            description: "Descripción del nuevo proyecto",
                            completed: false,
                        },
                    },
                }
            )
        );

        // 8. Elimina todos los usuarios menores de 22 años
        console.log(
            "\n8. Eliminando usuarios menores de 22 años:",
            await User.deleteMany({ age: { $lt: 22 } })
        );

        // 9. Encuentra usuarios con proyectos cuyo título contenga 'Proyecto5'
        console.log(
            "\n9. Usuarios con proyectos que incluyen 'Proyecto5':",
            await User.find({ "projects.title": /Proyecto5/i }).limit(5)
        );

        // 10. Busca usuarios con más de 1 proyecto
        console.log(
            "\n10. Usuarios con más de 1 proyecto:",
            await User.find({ "projects.1": { $exists: true } }).limit(5)
        );

        // **Agregaciones**

        // 11. Cuenta el número de usuarios en cada grupo de edad
        console.log(
            "\n11. Número de usuarios agrupados por edad:",
            await User.aggregate([
                { $group: { _id: "$age", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ])
        );

        // 12. Encuentra los proyectos más recientes de cada usuario
        console.log(
            "\n12. Proyectos más recientes por usuario:",
            await User.aggregate([
                { $unwind: "$projects" },
                { $sort: { "projects.title": -1 } },
                {
                    $group: {
                        _id: "$_id",
                        name: { $first: "$name" },
                        latestProject: { $first: "$projects" },
                    },
                },
            ])
        );

        // **Búsquedas avanzadas**

        // 13. Usuarios con proyectos que no estén completados
        console.log(
            "\n13. Usuarios con proyectos no completados:",
            await User.find({ "projects.completed": false }).limit(5)
        );

        // 14. Usuarios cuyo nombre empieza con 'Usuario1'
        console.log(
            "\n14. Usuarios con nombres que comienzan con 'Usuario1':",
            await User.find({ name: /^Usuario1/ }).limit(5)
        );

        // 15. Usuarios que tengan 'Usuario' en el email
        console.log(
            "\n15. Usuarios que tienen 'Usuario' en el email:",
            await User.find({ email: /Usuario/i }).limit(5)
        );

        console.log("\nOperaciones completadas.");
    } catch (err) {
        console.error("Error ejecutando queries:", err);
    } finally {
        mongoose.connection.close(() => {
            console.log("Conexión cerrada.");
        });
    }
};

// Ejecuta la función principal
main();
