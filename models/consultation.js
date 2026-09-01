function createConsultation(patientInput) {
    return {
        consultation_id: null,

        status: "IN_PROGRESS",

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString(),

        patient: patientInput.patient,

        symptoms: patientInput.symptoms,

        history: patientInput.history,

        clarification_answers:
            patientInput.clarification_answers || {},

        routing: {
            status: null,
            ayush_system: null,
            department: null,
            alternative_department: null,
            confidence: null,
            matched_case: null,
            matched_symptom: null
        },

        doctors: {
            matched: [],
            available: []
        },

        appointment: {
            status: "NOT_BOOKED",
            doctor_id: null,
            appointment_id: null,
            date: null,
            time: null
        }
    };
}

module.exports = {
    createConsultation
};