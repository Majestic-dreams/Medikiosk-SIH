function validatePatientInput(patientInput) {

    const errors = [];


    if (!patientInput) {

        errors.push(
            "Request body is required."
        );

        return errors;
    }


    if (
        !patientInput.symptoms ||
        !patientInput.symptoms.chief_complaint
    ) {

        errors.push(
            "chief_complaint is required."
        );
    }


    return errors;
}


module.exports = {
    validatePatientInput
};