// jshint esversion:8
const mongoose = require("mongoose");
const readline = require("readline");

// Connection URL and Database Name
const MONGODB_ATLAS_URI = "mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/comparisonDB?retryWrites=true&w=majority";

// 1. DEFINING A SCHEMA
const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "A movie must have a title!"] // Validation: Required field
    },
    year: {
        type: Number,
        required: true,
        min: [1888, "Movies didn't exist before 1888!"] // Validation: Min value
    },
    director: String, // Optional field
    isBlockbuster: {
        type: Boolean,
        default: false // Default value
    }
});

// Create the Model
const Movie = mongoose.model("MovieMongoose", movieSchema);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
};

const clearCollection = async () => {
    console.log("\n--- CLEARING COLLECTION ---");
    await Movie.deleteMany({});
    console.log("Collection cleaned.");
};

const runDemo = async () => {
    console.log("\n--- DEMONSTRATION: MONGOOSE ADVANTAGES ---");

    // 1. Automatic Type Casting
    console.log("1. Attempting to insert 'Inception' with year as a String...");
    const movie1 = await Movie.create({
        title: "Inception",
        year: "2010", // String, but Schema says Number
        director: "Christopher Nolan"
    });
    console.log("   SUCCESS: Mongoose automatically cast '2010' string to Number:", movie1.year);


    // 2. Validation Error (Missing Required Field)
    console.log("\n2. Attempting to insert a movie WITHOUT a title...");
    try {
        await Movie.create({
            year: 2014,
            director: "Christopher Nolan"
        });
    } catch (err) {
        console.log("   BLOCKED: Mongoose stopped the insertion!");
        console.log("   Error Message:", err.message);
    }


    // 3. Validation Error (Value out of range)
    console.log("\n3. Attempting to insert a movie with year 1800 (Too old)...");
    try {
        await Movie.create({
            title: "Old Movie",
            year: 1800 // Less than min: 1888
        });
    } catch (err) {
        console.log("   BLOCKED: Mongoose stopped the insertion!");
        console.log("   Error Message:", err.message);
    }


    // 4. Ignoring Extra Fields (Strict Schema)
    console.log("\n4. Attempting to insert 'Avatar' with an unknown field 'randomField'...");
    const movie4 = await Movie.create({
        title: "Avatar",
        year: 2009,
        randomField: "This will be ignored"
    });
    console.log("   SUCCESS: Movie inserted, but check the output:");
    console.log("   Saved Document:", movie4);
    console.log("   OBSERVATION: 'randomField' was STRIPPED out because it's not in the Schema.");


    console.log("\n--- FINAL COLLECTION STATE ---");
    const allMovies = await Movie.find({});
    console.log(JSON.stringify(allMovies, null, 2));

    console.log("\nCONCLUSION: Mongoose keeps your data clean, consistent, and validated.");
};

const main = async () => {
    try {
        console.log("Connecting to MongoDB Atlas with Mongoose...");
        await mongoose.connect(MONGODB_ATLAS_URI, { useNewUrlParser: true, useUnifiedTopology: true });

        let exit = false;
        while (!exit) {
            console.log("\n--- MENU ---");
            console.log("1. Clear Collection");
            console.log("2. Run Demo (Insert Data)");
            console.log("3. Clear & Run Demo");
            console.log("4. Exit");

            const answer = await askQuestion("Choose an option (1-4): ");

            switch (answer.trim()) {
                case "1":
                    await clearCollection();
                    break;
                case "2":
                    await runDemo();
                    break;
                case "3":
                    await clearCollection();
                    await runDemo();
                    break;
                case "4":
                    exit = true;
                    break;
                default:
                    console.log("Invalid option, please try again.");
            }
        }

    } catch (err) {
        console.error("Unexpected Error:", err);
    } finally {
        await mongoose.connection.close();
        rl.close();
        console.log("\nConnection closed.");
    }
};

main();
