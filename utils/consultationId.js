const crypto = require("crypto");

function generateConsultationId() {

    const timestamp =
        Date.now().toString(36);

    const random =
        crypto.randomBytes(4)
            .toString("hex");

    return `MC-${timestamp}-${random}`;
}

module.exports = {
    generateConsultationId
};