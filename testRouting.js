const {
    routePatient
} = require("./services/routingService");

function test(name, input) {

    console.log("\n=================================");
    console.log(`TEST: ${name}`);
    console.log("=================================");

    console.log("INPUT:");
    console.dir(input, { depth: null });

    const result = routePatient(input);

    console.log("\nRESULT:");
    console.dir(result, { depth: null });
}


test(
    "Headache",
    {
        chief_complaint: "headache"
    }
);


test(
    "Throat complaint",
    {
        chief_complaint: "throat pain"
    }
);


test(
    "Unknown complaint",
    {
        chief_complaint:
            "something feels unusual"
    }
);