function createPatient(data) {
    return {
        patient_id: data.patient_id,
        name: data.name || null,
        age: data.age || null,
        gender: data.gender || null,
        contact: data.contact || null,

        created_at:
            data.created_at || new Date().toISOString()
    };
}

module.exports = {
    createPatient
};