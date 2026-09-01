const { getDB } = require("../config/mongodb");

// Routing records loaded from MongoDB during startup
let symptomDataset = [];

// ============================================================
// INITIALIZE ROUTING DATA
// ============================================================

async function initializeDatasetService() {
    const db = getDB();

    symptomDataset = await db
        .collection("routing_records")
        .find(
            {},
            {
                projection: {
                    _id: 0
                }
            }
        )
        .toArray();

    if (symptomDataset.length === 0) {
        throw new Error(
            "No routing records found in MongoDB collection: routing_records"
        );
    }

    console.log(
        `Routing records loaded from MongoDB: ${symptomDataset.length}`
    );

    return symptomDataset;
}

// ============================================================
// GET COMPLETE ROUTING DATASET
// ============================================================

function getSymptomDataset() {
    if (symptomDataset.length === 0) {
        throw new Error(
            "Routing dataset has not been initialized from MongoDB."
        );
    }

    return symptomDataset;
}

// ============================================================
// GET CASE RECORDS
// ============================================================

function getCaseRecords() {
    return getSymptomDataset().filter(
        record =>
            record.case_id &&
            record.canonical_complaint
    );
}

// ============================================================
// GET CANONICAL SYMPTOM RECORDS
// ============================================================

function getCanonicalSymptomRecords() {
    return getSymptomDataset().filter(
        record =>
            record.symptom_id &&
            record.normalized_symptom
    );
}

module.exports = {
    initializeDatasetService,
    getSymptomDataset,
    getCaseRecords,
    getCanonicalSymptomRecords
};