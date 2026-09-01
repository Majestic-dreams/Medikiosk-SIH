const http = require("http");

const consultationData = {
    patient: {
        name: "Test Patient",
        age: 25,
        gender: "Female",
        phone: "9876543210"
    },

    symptoms: {
        chief_complaint: "Persistent digestive discomfort",
        duration: "3 days",
        severity: "Moderate",
        associated_symptoms: [
            "Bloating",
            "Indigestion"
        ],
        onset: "Gradual",
        aggravating_factors: "After meals",
        relieving_factors: "Rest"
    },

    history: {
        relevant_history: "No significant history",
        medications: "None",
        allergies: "None"
    },

    clarification_answers: {}
};

const data = JSON.stringify(consultationData);

const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/consultations",
    method: "POST",

    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
    }
};

console.log("\n=================================");
console.log("TEST: CREATE CONSULTATION");
console.log("=================================\n");

const req = http.request(options, (res) => {

    let responseData = "";

    console.log("HTTP Status:", res.statusCode);

    res.on("data", (chunk) => {
        responseData += chunk;
    });

    res.on("end", () => {

        try {

            const parsedResponse =
                JSON.parse(responseData);

            console.log("\nAPI RESPONSE:\n");

            console.dir(
                parsedResponse,
                { depth: null }
            );

            console.log(
                "\n================================="
            );

            console.log(
                "CONSULTATION TEST COMPLETE"
            );

            console.log(
                "=================================\n"
            );

        }

        catch (error) {

            console.log(
                "\nRaw response:"
            );

            console.log(
                responseData
            );

        }

    });

});

req.on("error", (error) => {

    console.error(
        "\nRequest failed:"
    );

    console.error(
        error.message
    );

});

req.write(data);

req.end();