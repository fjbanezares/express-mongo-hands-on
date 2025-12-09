// jshint esversion:8
const { MongoClient } = require("mongodb");

// Connection URL and Database Name
// We use the same connection string as in other exercises
const MONGODB_ATLAS_URI = "mongodb+srv://fjbanezares:Pepito123@cluster0.n87gd.mongodb.net/?retryWrites=true&w=majority";
const DATABASE_NAME = "comparisonDB";
const COLLECTION_NAME = "movies_native";

const main = async () => {
    const client = new MongoClient(MONGODB_ATLAS_URI, { useUnifiedTopology: true });

    try {
        console.log("Connecting to MongoDB Atlas with Native Driver...");
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // CLEANUP: Remove existing documents to start fresh
        await collection.deleteMany({});
        console.log("Collection cleaned.");

        console.log("\n--- DEMONSTRATION: LACK OF SCHEMA ---");

        // 1. Inserting a movie with correct data
        // This is what we expect: Title is a string, Year is a number.
        await collection.insertOne({
            title: "Inception",
            year: 2010,
            director: "Christopher Nolan"
        });
        console.log("1. Inserted 'Inception' (Correct format).");

        // 2. Inserting a movie with INCONSISTENT data
        // MongoDB Native Driver does NOT validate data types.
        // Here, 'year' is a String instead of a Number.
        // The driver accepts this happily.
        await collection.insertOne({
            title: "Interstellar",
            year: "2014", // String!
            director: "Christopher Nolan"
        });
        console.log("2. Inserted 'Interstellar' with year as a STRING (Inconsistent type accepted).");

        // 3. Inserting a movie with MISSING fields
        // We forgot the 'title' and 'year'.
        // The driver accepts this too. It's schemaless.
        await collection.insertOne({
            director: "Unknown Director"
        });
        console.log("3. Inserted a movie with MISSING title and year (Incomplete data accepted).");

        // 4. Inserting a movie with EXTRA fields
        // We add a random field 'rating' that we might not want.
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

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
        console.log("\nConnection closed.");
    }
};

main();
