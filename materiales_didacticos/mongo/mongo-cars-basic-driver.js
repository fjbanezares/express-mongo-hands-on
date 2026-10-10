// jshint esversion:8

// Importar el cliente nativo de MongoDB
const { MongoClient } = require("mongodb");

// URL de conexión y base de datos
const MONGODB_ATLAS_URI =
    "mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/?retryWrites=true&w=majority";
const DATABASE_NAME = "carDatabase";
const COLLECTION_NAME = "cars";

const main = async () => {
    const client = new MongoClient(MONGODB_ATLAS_URI, { useUnifiedTopology: true });

    try {
        console.log("Conectando a MongoDB Atlas...");
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const cars = db.collection(COLLECTION_NAME);

        // Limpiar colección
        await cars.deleteMany();
        console.log("Colección limpiada.");

        // Insertar coches
        await cars.insertMany([
            { brand: "Toyota", model: "Corolla", year: 2015, features: ["GPS"], price: 15000 },
            { brand: "Honda", model: "Civic", year: 2020, features: ["Bluetooth"], price: 20000 },
            { brand: "Ford", model: "Focus", year: 2018, features: ["GPS", "Sunroof"], price: 18000 },
        ]);
        console.log("Coches insertados.");

        // **Find Queries**
        console.log("\n1. Coches fabricados después de 2016:");
        console.log(await cars.find({ year: { $gt: 2016 } }).toArray());

        console.log("\n2. Coches con precio menor a 20,000 USD:");
        console.log(await cars.find({ price: { $lt: 20000 } }).toArray());

        console.log("\n3. Coches con 'GPS' como característica:");
        console.log(await cars.find({ features: "GPS" }).toArray());

        // **Update Query**
        console.log("\n4. Actualizando precio del Corolla:");
        await cars.updateOne({ model: "Corolla" }, { $set: { price: 16000 } });
        console.log(await cars.find({ model: "Corolla" }).toArray());

        // **Delete Query**
        console.log("\n5. Eliminando coches más antiguos que 2017:");
        await cars.deleteMany({ year: { $lt: 2017 } });
        console.log(await cars.find().toArray());

        console.log("\nOperaciones completadas.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
        console.log("Conexión cerrada.");
    }
};

main();
