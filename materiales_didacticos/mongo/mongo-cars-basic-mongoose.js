// jshint esversion:8

// Importar Mongoose
const mongoose = require("mongoose");

// Conexión a MongoDB Atlas
const MONGODB_ATLAS_URI =
    "mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/carDatabase?retryWrites=true&w=majority";

mongoose.connect(MONGODB_ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Definir un esquema para "Cars"
const carSchema = new mongoose.Schema({
    brand: String, // Marca del coche
    model: String, // Modelo del coche
    year: Number, // Año de fabricación
    features: [String], // Array de características
    price: Number, // Precio en USD
});

// Crear el modelo "Car"
const Car = mongoose.model("Car", carSchema);

const main = async () => {
    try {
        console.log("Conectado a MongoDB Atlas");

        // Limpiar colección
        await Car.deleteMany();

        // Insertar coches
        await Car.insertMany([
            { brand: "Toyota", model: "Corolla", year: 2015, features: ["GPS"], price: 15000 },
            { brand: "Honda", model: "Civic", year: 2020, features: ["Bluetooth"], price: 20000 },
            { brand: "Ford", model: "Focus", year: 2018, features: ["GPS", "Sunroof"], price: 18000 },
        ]);
        console.log("Coches insertados.");

        // **Find Queries**
        console.log("\n1. Coches fabricados después de 2016:");
        console.log(await Car.find({ year: { $gt: 2016 } }));

        console.log("\n2. Coches con precio menor a 20,000 USD:");
        console.log(await Car.find({ price: { $lt: 20000 } }));

        console.log("\n3. Coches con 'GPS' como característica:");
        console.log(await Car.find({ features: "GPS" }));

        // **Update Query**
        console.log("\n4. Actualizando precio del Corolla:");
        await Car.updateOne({ model: "Corolla" }, { $set: { price: 16000 } });
        console.log(await Car.find({ model: "Corolla" }));

        // **Delete Query**
        console.log("\n5. Eliminando coches más antiguos que 2017:");
        await Car.deleteMany({ year: { $lt: 2017 } });
        console.log(await Car.find());

        console.log("\nOperaciones completadas.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
        console.log("Conexión cerrada.");
    }
};

main();
