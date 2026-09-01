const {
    getSymptomDataset,
    getCaseRecords,
    getCanonicalSymptomRecords
} = require("./services/datasetService");

try {
    const allRecords = getSymptomDataset();
    const caseRecords = getCaseRecords();
    const canonicalRecords = getCanonicalSymptomRecords();

    console.log("=================================");
    console.log("     MEDCONNECT DATA TEST");
    console.log("=================================");

    console.log("Total records:", allRecords.length);
    console.log("Case records:", caseRecords.length);
    console.log(
        "Canonical symptom records:",
        canonicalRecords.length
    );

    console.log("\nFirst case record:");
    console.log(caseRecords[0]);

    console.log("\nFirst canonical symptom record:");
    console.log(canonicalRecords[0]);

    console.log("\nData layer working successfully.");
} catch (error) {
    console.error("DATA ERROR:");
    console.error(error.message);
}