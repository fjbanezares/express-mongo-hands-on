// jshint esversion:8
const { MongoClient } = require("mongodb");
const readline = require("readline");

// Connection URL and Database Name
const MONGODB_ATLAS_URI = "mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/?retryWrites=true&w=majority";
const DATABASE_NAME = "comparisonDB";
const COLLECTION_NAME = "movies_native";

const client = new MongoClient(MONGODB_ATLAS_URI, { useUnifiedTopology: true });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
};

const clearCollection = async (collection) => {
    console.log("\n--- CLEARING COLLECTION ---");
    await collection.deleteMany({});
    console.log("Collection cleaned.");
};

const runDemo = async (collection) => {
    console.log("\n--- DEMONSTRATION: LACK OF SCHEMA ---");

    // 1. Inserting a movie with correct data
    await collection.insertOne({
        title: "Inception",
        year: 2010,
        director: "Christopher Nolan"
    });
    console.log("1. Inserted 'Inception' (Correct format).");

    // 2. Inserting a movie with INCONSISTENT data
    await collection.insertOne({
        title: "Interstellar",
        year: "2014", // String!
        director: "Christopher Nolan"
    });
    console.log("2. Inserted 'Interstellar' with year as a STRING (Inconsistent type accepted).");

    // 3. Inserting a movie with MISSING fields
    await collection.insertOne({
        director: "Unknown Director"
    });
    console.log("3. Inserted a movie with MISSING title and year (Incomplete data accepted).");

    // 4. Inserting a movie with EXTRA fields
    await collection.insertOne({
        title: "The Dark Knight",
        year: 2008,
        rating: "10/10", // Extra field
        randomField: "This shouldn't be here"
    });
    console.log("4. Inserted 'The Dark Knight' with EXTRA fields (No schema enforcement).");

    // FETCHING DATA
    console.log("\n--- RESULTING COLLECTION ---");
    const movies = await collection.find({}).toArray();
    console.log(JSON.stringify(movies, null, 2));

    console.log("\nOBSERVATION: The native driver allows any structure. This gives flexibility but can lead to messy data if not managed carefully.");
};

const main = async () => {
    try {
        console.log("Connecting to MongoDB Atlas with Native Driver...");
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);

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
                    await clearCollection(collection);
                    break;
                case "2":
                    await runDemo(collection);
                    break;
                case "3":
                    await clearCollection(collection);
                    await runDemo(collection);
                    break;
                case "4":
                    exit = true;
                    break;
                default:
                    console.log("Invalid option, please try again.");
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
        rl.close();
        console.log("\nConnection closed.");
    }
};

main();
