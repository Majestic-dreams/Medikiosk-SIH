const fs = require("fs");
const path = require("path");

function loadJSON(filename) {
    const filePath = path.join(
        __dirname,
        "..",
        "data",
        filename
    );

    if (!fs.existsSync(filePath)) {
        throw new Error(`Dataset not found: ${filename}`);
    }

    try {
        const fileContent = fs.readFileSync(
            filePath,
            "utf-8"
        );

        return JSON.parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to read dataset ${filename}: ${error.message}`
        );
    }
}

module.exports = {
    loadJSON
};