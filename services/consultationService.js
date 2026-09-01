const { getDB } = require("../config/mongodb");

// ==========================================
// SAVE CONSULTATION
// ==========================================

async function saveConsultation(consultation) {
    if (!consultation) {
        throw new Error("Consultation data is required.");
    }

    const db = getDB();

    const collection = db.collection("consultations");

    await collection.insertOne(consultation);

    return consultation;
}

// ==========================================
// FIND CONSULTATION BY ID
// ==========================================

async function getConsultationById(consultationId) {
    if (!consultationId) {
        throw new Error("consultationId is required.");
    }

    const db = getDB();

    const collection = db.collection("consultations");

    const consultation =
        await collection.findOne({
            consultation_id: consultationId
        });

    return consultation;
}

module.exports = {
    saveConsultation,
    getConsultationById
};