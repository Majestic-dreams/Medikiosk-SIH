const fs = require("fs");
const path = require("path");

const inputPath = path.join(
    __dirname,
    "data",
    "symptoms.json"
);

const outputPath = path.join(
    __dirname,
    "data",
    "symptoms_clean.json"
);

try {
    console.log("Reading symptom dataset...");

    let content = fs.readFileSync(
        inputPath,
        "utf8"
    );

    // Replace JavaScript/Python-style NaN
    // with valid JSON null.
    content = content.replace(
        /:\s*NaN\b/g,
        ": null"
    );

    // Replace NaN if it appears inside an array.
    content = content.replace(
        /\bNaN\b/g,
        "null"
    );

    const parsedData = JSON.parse(content);

    fs.writeFileSync(
        outputPath,
        JSON.stringify(parsedData, null, 2),
        "utf8"
    );

    console.log("=================================");
    console.log("Dataset cleaned successfully.");
    console.log("Output:");
    console.log(outputPath);
    console.log("=================================");

} catch (error) {
    console.error("DATA CLEANING ERROR:");
    console.error(error.message);
}