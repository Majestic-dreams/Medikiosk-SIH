const http = require("http");

const consultationId = "MC-mtfiovf5-04d433c8";

const clarificationData = {
    clarification_answers: {
        pregnancy_possibility: "No",
        vomiting: "No",
        bleeding: "No",
        fever: "No",
        severe_or_localized_pain: "No"
    }
};

const data = JSON.stringify(clarificationData);

const options = {
    hostname: "localhost",
    port: 3000,

    path:
        `/api/consultations/${consultationId}/clarification`,

    method: "POST",

    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
    }
};

console.log("\n=================================");
console.log("TEST: CLARIFICATION");
console.log("=================================\n");

console.log(
    "Consultation ID:",
    consultationId
);

console.log(
    "\nSending clarification answers:"
);

console.dir(
    clarificationData,
    { depth: null }
);

const req = http.request(
    options,
    (res) => {

        let responseData = "";

        console.log(
            "\nHTTP Status:",
            res.statusCode
        );

        res.on(
            "data",
            (chunk) => {
                responseData += chunk;
            }
        );

        res.on(
            "end",
            () => {

                try {

                    const parsedResponse =
                        JSON.parse(
                            responseData
                        );

                    console.log(
                        "\nAPI RESPONSE:\n"
                    );

                    console.dir(
                        parsedResponse,
                        { depth: null }
                    );

                    console.log(
                        "\n================================="
                    );

                    console.log(
                        "CLARIFICATION TEST COMPLETE"
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

            }
        );

    }
);

req.on(
    "error",
    (error) => {

        console.error(
            "\nRequest failed:"
        );

        console.error(
            error.message
        );

    }
);

req.write(data);

req.end();