// jshint esversion:8

const mongoose = require("mongoose");

const MONGODB_ATLAS_URI =
    "mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/sample_mflix?retryWrites=true&w=majority";

mongoose.connect(MONGODB_ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define schema and model for movies
const movieSchema = new mongoose.Schema({}, { strict: false }); // Flexible schema
const Movie = mongoose.model("Movie", movieSchema);

const executeQueries = async () => {
    try {
        console.log("Connected to MongoDB Atlas");

        // Queries de Find
        console.log("\n1. Películas lanzadas después del 2000:");
        console.log(await Movie.find({ year: { $gt: 2000 } }).limit(5));

        console.log("\n2. Películas con más de 2 géneros:");
        console.log(await Movie.find({ genres: { $size: { $gt: 2 } } }).limit(5));

        console.log("\n3. Películas con 'Train' en el título:");
        console.log(await Movie.find({ title: /Train/i }).limit(5));

        console.log("\n4. Películas entre 90 y 120 minutos:");
        console.log(await Movie.find({ runtime: { $gte: 90, $lte: 120 } }).limit(5));

        console.log("\n5. Películas con más de 10 comentarios:");
        console.log(await Movie.find({ num_mflix_comments: { $gt: 10 } }).limit(5));

        // Queries de Agregación
        console.log("\n6. Películas agrupadas por década:");
        console.log(
            await Movie.aggregate([
                {
                    $project: {
                        decade: { $concat: [{ $substr: ["$year", 0, 3] }, "0s"] },
                    },
                },
                { $group: { _id: "$decade", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ])
        );

        console.log("\n7. Géneros más frecuentes:");
        console.log(
            await Movie.aggregate([
                { $unwind: "$genres" },
                { $group: { _id: "$genres", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ])
        );

        // Manipulación de Arrays
        console.log("\n8. Añadiendo 'Classic' a películas antes de 1950...");
        await Movie.updateMany(
            { year: { $lt: 1950 } },
            { $addToSet: { genres: "Classic" } }
        );
        console.log("Actualización realizada.");

        console.log("\n9. Eliminando 'Comedy' de los géneros...");
        await Movie.updateMany({ genres: "Comedy" }, { $pull: { genres: "Comedy" } });
        console.log("Actualización realizada.");

        // Inserción
        console.log("\n10. Insertando una nueva película...");
        await Movie.create({
            title: "New Experimental Movie",
            year: 2024,
            genres: ["Experimental", "Drama"],
            runtime: 120,
            cast: ["John Doe"],
            released: new Date("2024-01-01"),
            directors: ["Jane Smith"],
        });
        console.log("Película insertada.");

        // Eliminación
        console.log("\n11. Eliminando películas sin géneros definidos...");
        await Movie.deleteMany({ genres: { $exists: false } });
        console.log("Eliminación realizada.");

        console.log("\n12. Eliminando películas lanzadas antes de 1900...");
        await Movie.deleteMany({ year: { $lt: 1900 } });
        console.log("Eliminación realizada.");

        console.log("\n13. Películas con más de 3 directores:");
        console.log(await Movie.find({ "directors.3": { $exists: true } }).limit(5));

        console.log("\n14. Películas con comentario por minuto más alto:");
        console.log(
            await Movie.aggregate([
                {
                    $project: {
                        title: 1,
                        runtime: 1,
                        num_mflix_comments: 1,
                        commentDensity: {
                            $cond: {
                                if: { $gt: ["$runtime", 0] },
                                then: { $divide: ["$num_mflix_comments", "$runtime"] },
                                else: 0,
                            },
                        },
                    },
                },
                { $sort: { commentDensity: -1 } },
            ]).limit(5)
        );
    } catch (err) {
        console.error("Error ejecutando las queries:", err);
    } finally {
        mongoose.connection.close(() => {
            console.log("Conexión cerrada.");
        });
    }
};

// Ejecuta todas las queries
executeQueries();
