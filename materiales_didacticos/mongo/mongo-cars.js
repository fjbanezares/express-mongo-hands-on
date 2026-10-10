// jshint esversion:8

// Importamos mongoose para interactuar con MongoDB
const mongoose = require("mongoose");

// Conexión a MongoDB Atlas
const MONGODB_ATLAS_URI =
    "mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/carDatabase?retryWrites=true&w=majority";

mongoose.connect(MONGODB_ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// **Definición del esquema "Car"**
const carSchema = new mongoose.Schema({
    brand: { type: String, required: true }, // Marca del coche (ejemplo: "Toyota")
    model: { type: String, required: true }, // Modelo del coche (ejemplo: "Corolla")
    year: { type: Number, required: true }, // Año de fabricación
    features: [String], // Array de características (ejemplo: ["ABS", "GPS", "Bluetooth"])
    price: { type: Number, required: true }, // Precio en USD
});

// **Modelo basado en el esquema**
const Car = mongoose.model("Car", carSchema);

// Función principal para realizar las operaciones
const main = async () => {
    try {
        console.log("Conectado a MongoDB Atlas");

        // Limpia la colección antes de comenzar
        await Car.deleteMany({});

        // Inserta 40 coches con características variadas
        const cars = Array.from({ length: 40 }, (_, i) => ({
            brand: i % 2 === 0 ? "Toyota" : "Honda", // Alterna entre Toyota y Honda
            model: `Modelo${i + 1}`,
            year: 2000 + (i % 20), // Años entre 2000 y 2020
            features: [
                "GPS",
                ...(i % 3 === 0 ? ["Bluetooth"] : []), // Algunos con Bluetooth
                ...(i % 5 === 0 ? ["Sunroof"] : []), // Algunos con Sunroof
            ],
            price: 15000 + i * 500, // Precios desde 15000 en incrementos de 500
        }));
        await Car.insertMany(cars);
        console.log("40 coches insertados");

        // **QUERIES INSTRUCTIVAS**

        // **Find Queries**

        // 1. Encuentra todos los coches fabricados después de 2010
        console.log(
            "\n1. Coches fabricados después de 2010:",
            await Car.find({ year: { $gt: 2010 } }).limit(5)
        );

        // 2. Encuentra coches con el precio entre 16,000 y 20,000 USD
        console.log(
            "\n2. Coches con precio entre 16,000 y 20,000 USD:",
            await Car.find({ price: { $gte: 16000, $lte: 20000 } }).limit(5)
        );

        // 3. Encuentra coches de la marca "Honda"
        console.log(
            "\n3. Coches de la marca 'Honda':",
            await Car.find({ brand: "Honda" }).limit(5)
        );

        // 4. Encuentra coches que tengan Bluetooth como característica
        console.log(
            "\n4. Coches con Bluetooth:",
            await Car.find({ features: "Bluetooth" }).limit(5)
        );

        // 5. Encuentra coches con más de 2 características
        console.log(
            "\n5. Coches con más de 2 características:",
            await Car.find({ features: { $size: { $gt: 2 } } }).limit(5)
        );

        // **Update Queries**

        // 6. Actualiza el precio de todos los Toyotas aumentando 1000 USD
        console.log(
            "\n6. Actualizando precio de todos los Toyotas:",
            await Car.updateMany({ brand: "Toyota" }, { $inc: { price: 1000 } })
        );

        // 7. Añade una característica nueva ("Heated Seats") a todos los coches de Honda
        console.log(
            "\n7. Añadiendo 'Heated Seats' a los Hondas:",
            await Car.updateMany(
                { brand: "Honda" },
                { $addToSet: { features: "Heated Seats" } }
            )
        );

        // 8. Marca un coche específico por modelo como edición limitada
        console.log(
            "\n8. Añadiendo 'Limited Edition' al Modelo15:",
            await Car.updateOne(
                { model: "Modelo15" },
                { $push: { features: "Limited Edition" } }
            )
        );

        // **Insert Queries**

        // 9. Inserta un coche completamente nuevo
        console.log(
            "\n9. Insertando un nuevo coche:",
            await Car.create({
                brand: "Ford",
                model: "Fiesta",
                year: 2022,
                features: ["GPS", "Bluetooth", "Sunroof"],
                price: 18000,
            })
        );

        // **Delete Queries**

        // 10. Elimina todos los coches más antiguos que el año 2005
        console.log(
            "\n10. Eliminando coches fabricados antes de 2005:",
            await Car.deleteMany({ year: { $lt: 2005 } })
        );

        // **Aggregation Queries**

        // 11. Agrupa los coches por marca y cuenta cuántos hay de cada una
        console.log(
            "\n11. Número de coches por marca:",
            await Car.aggregate([
                { $group: { _id: "$brand", total: { $sum: 1 } } },
            ])
        );

        // 12. Encuentra el precio promedio de los coches por marca
        console.log(
            "\n12. Precio promedio por marca:",
            await Car.aggregate([
                { $group: { _id: "$brand", avgPrice: { $avg: "$price" } } },
            ])
        );

        // **Advanced Find Queries**

        // 13. Encuentra coches cuyo modelo termine en '5'
        console.log(
            "\n13. Coches cuyo modelo termina en '5':",
            await Car.find({ model: /5$/ }).limit(5)
        );

        // 14. Encuentra coches con un Sunroof y fabricados después de 2015
        console.log(
            "\n14. Coches con Sunroof y fabricados después de 2015:",
            await Car.find({
                features: "Sunroof",
                year: { $gt: 2015 },
            }).limit(5)
        );

        // 15. Encuentra el coche más caro
        console.log(
            "\n15. Coche más caro:",
            await Car.find().sort({ price: -1 }).limit(1)
        );

        console.log("\nOperaciones completadas.");
    } catch (err) {
        console.error("Error ejecutando queries:", err);
    } finally {
        // Cerrando la conexión correctamente
        await mongoose.connection.close();
        console.log("Conexión cerrada.");
    }
};

// Ejecuta la función principal
main();
