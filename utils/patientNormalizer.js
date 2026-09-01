function normalizePatientInput(body) {

    const patient =
        body.patient || {};

    const symptoms =
        body.symptoms || {};

    const history =
        body.history || {};

    const clarificationAnswers =
        body.clarification_answers || {};


    return {

        patient: {

            name:
                patient.name || null,

            age:
                patient.age || null,

            gender:
                patient.gender || null,

            phone:
                patient.phone || null
        },


        symptoms: {

            chief_complaint:
                symptoms.chief_complaint ||
                body.chief_complaint ||
                null,

            duration:
                symptoms.duration || null,

            severity:
                symptoms.severity || null,

            associated_symptoms:
                Array.isArray(
                    symptoms.associated_symptoms
                )
                    ? symptoms.associated_symptoms
                    : [],

            onset:
                symptoms.onset || null,

            aggravating_factors:
                symptoms.aggravating_factors ||
                null,

            relieving_factors:
                symptoms.relieving_factors ||
                null
        },


        history: {

            relevant_history:
                history.relevant_history ||
                null,

            medications:
                history.medications ||
                null,

            allergies:
                history.allergies ||
                null
        },


        clarification_answers:
            clarificationAnswers
    };
}


module.exports = {
    normalizePatientInput
};