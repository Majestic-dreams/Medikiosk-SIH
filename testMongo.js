
require("dotenv").config();

const {
    MongoClient,
    ServerApiVersion
} = require("mongodb");

// ============================================================
// CHECK ENVIRONMENT
// ============================================================

const uri = process.env.MONGODB_URI;

if (!uri) {

    console.error(
        "ERROR: MONGODB_URI is missing from .env"
    );

    process.exit(1);
}

// ============================================================
// TEST INFORMATION
// ============================================================

console.log("=================================");
console.log("MONGODB DIRECT CONNECTION TEST");
console.log("=================================");

console.log(
    "Node:",
    process.version
);

console.log(
    "OpenSSL:",
    process.versions.openssl
);

console.log(
    "MongoDB Driver:",
    require("mongodb/package.json").version
);

// ============================================================
// CREATE CLIENT
// ============================================================

const client = new MongoClient(uri, {

    // Force IPv4
    family: 4,

    // Explicitly enable TLS
    tls: true,

    // MongoDB Atlas Server API
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    },

    // Connection timeouts
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000

});

// ============================================================
// TEST CONNECTION
// ============================================================

async function testMongoDB() {

    try {

        console.log("");
        console.log("Connecting to MongoDB Atlas...");
        console.log("");

        // Connect
        await client.connect();

        console.log(
            "MongoClient connected successfully."
        );

        // Ping MongoDB
        const result =
            await client
                .db("admin")
                .command({
                    ping: 1
                });

        console.log("");
        console.log("PING RESULT:");
        console.log(result);

        console.log("");
        console.log("=================================");
        console.log("MONGODB CONNECTION SUCCESSFUL");
        console.log("=================================");

        console.log("");
        console.log(
            "Your Node.js application can communicate with MongoDB Atlas."
        );

    } catch (error) {

        console.error("");
        console.error("=================================");
        console.error("MONGODB CONNECTION FAILED");
        console.error("=================================");

        console.error("");
        console.error(
            "Error name:",
            error.name
        );

        console.error(
            "Error message:",
            error.message
        );

        console.error(
            "Error code:",
            error.code
        );

        if (error.cause) {

            console.error("");
            console.error("UNDERLYING ERROR:");
            console.error(error.cause);

        }

    } finally {

        console.log("");
        console.log("Closing MongoDB connection...");

        await client.close();

        console.log(
            "MongoDB connection closed."
        );
    }
}

// ============================================================
// RUN TEST
// ============================================================

testMongoDB();
