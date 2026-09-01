const patientSummarySchema = {
    patient: {
        name: null,
        age: null,
        gender: null,
        phone: null
    },

    symptoms: {
        chief_complaint: null,
        duration: null,
        severity: null,
        associated_symptoms: [],
        onset: null,
        aggravating_factors: null,
        relieving_factors: null
    },

    history: {
        relevant_history: null,
        medications: null,
        allergies: null
    },

    clarification_answers: {},

    routing: {
        status: null,
        ayush_system: null,
        department: null,
        alternative_department: null,
        confidence: null
    }
};

module.exports = patientSummarySchema;