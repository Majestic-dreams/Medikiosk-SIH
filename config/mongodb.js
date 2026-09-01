
const { MongoClient, ServerApiVersion } = require("mongodb");

// ============================================================
// MONGODB CONFIGURATION
// ============================================================

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error("MONGODB_URI is not defined in .env");
}

// ============================================================
// MONGODB CLIENT
// ============================================================

const client = new MongoClient(uri, {
    family: 4,
    tls: true,

    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    },

    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,

    maxPoolSize: 10,
    minPoolSize: 0
});

// ============================================================
// DATABASE VARIABLE
// ============================================================

let db = null;

// ============================================================
// CONNECT TO MONGODB
// ============================================================

async function connectDB() {

    try {

        console.log("=================================");
        console.log("CONNECTING TO MONGODB ATLAS");
        console.log("=================================");

        await client.connect();

        // Verify connection
        await client.db("admin").command({
            ping: 1
        });

        db = client.db(
            process.env.MONGODB_DB_NAME
        );

        console.log("");
        console.log("MongoDB connected successfully.");
        console.log(
            `Database: ${process.env.MONGODB_DB_NAME}`
        );
        console.log("");

        return db;

    } catch (error) {

        console.error("");
        console.error("=================================");
        console.error("MONGODB CONNECTION FAILED");
        console.error("=================================");

        console.error("Error name:", error.name);
        console.error("Error message:", error.message);

        if (error.cause) {
            console.error("");
            console.error("Underlying error:");
            console.error(error.cause);
        }

        throw error;
    }
}

// ============================================================
// GET DATABASE
// ============================================================

function getDB() {

    if (!db) {

        throw new Error(
            "Database is not connected. Call connectDB() first."
        );

    }

    return db;
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
    connectDB,
    getDB
};
