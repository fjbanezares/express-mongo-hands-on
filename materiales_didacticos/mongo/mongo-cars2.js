// jshint esversion:8

const mongoose = require("mongoose");

const MONGODB_ATLAS_URI =
    "mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/carDatabase?retryWrites=true&w=majority";

mongoose.connect(MONGODB_ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const carSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    features: [String],
    price: { type: Number, required: true },
});

const Car = mongoose.model("Car", carSchema);

const main = async () => {
    try {
        console.log("Conectado a MongoDB Atlas");
        await Car.deleteMany({});

        const cars = Array.from({ length: 40 }, (_, i) => ({
            brand: i % 2 === 0 ? "Toyota" : "Honda",
            model: `Modelo${i + 1}`,
            year: 2000 + (i % 20),
            features: [
                "GPS",
                ...(i % 3 === 0 ? ["Bluetooth"] : []),
                ...(i % 5 === 0 ? ["Sunroof"] : []),
            ],
            price: 15000 + i * 500,
        }));
        await Car.insertMany(cars);
        console.log("40 coches insertados");

        // Consultas
        console.log(
            "\n1. Coches fabricados después de 2010:",
            await Car.find({ year: { $gt: 2010 } }).limit(5)
        );

        console.log(
            "\n2. Coches con precio entre 16,000 y 20,000 USD:",
            await Car.find({ price: { $gte: 16000, $lte: 20000 } }).limit(5)
        );

        console.log(
            "\n3. Coches con más de 2 características:",
            await Car.find({ features: { $size: 3 } }).limit(5)
        );

        console.log(
            "\n4. Actualizando precio de todos los Toyotas:",
            await Car.updateMany({ brand: "Toyota" }, { $inc: { price: 1000 } })
        );

        console.log(
            "\n5. Añadiendo 'Heated Seats' a los Hondas:",
            await Car.updateMany(
                { brand: "Honda" },
                { $addToSet: { features: "Heated Seats" } }
            )
        );

        console.log(
            "\n6. Eliminando coches fabricados antes de 2005:",
            await Car.deleteMany({ year: { $lt: 2005 } })
        );

        console.log("\nOperaciones completadas.");
    } catch (err) {
        console.error("Error ejecutando queries:", err);
    } finally {
        await mongoose.connection.close();
        console.log("Conexión cerrada.");
    }
};

main();
