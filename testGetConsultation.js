const http = require("http");

const consultationId = "MC-mtfiovf5-04d433c8";

const options = {
    hostname: "localhost",
    port: 3000,
    path: `/api/consultations/${consultationId}`,
    method: "GET"
};

console.log("\n=================================");
console.log("TEST: GET CONSULTATION");
console.log("=================================\n");

console.log("Consultation ID:", consultationId);

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
                "GET CONSULTATION TEST COMPLETE"
            );

            console.log(
                "=================================\n"
            );

        }

        catch (error) {

            console.log("\nRaw response:");

            console.log(responseData);

        }

    });

});

req.on("error", (error) => {

    console.error("\nRequest failed:");

    console.error(error.message);

});

req.end();