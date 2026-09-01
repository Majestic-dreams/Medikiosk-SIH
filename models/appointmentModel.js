function createAppointment(data) {
    return {
        appointment_id: data.appointment_id,

        patient_id:
            data.patient_id || null,

        consultation_id:
            data.consultation_id || null,

        doctor_id:
            data.doctor_id || null,

        appointment_date:
            data.appointment_date || null,

        start_time:
            data.start_time || null,

        end_time:
            data.end_time || null,

        mode:
            data.mode || null,

        status:
            data.status || "pending",

        created_at:
            data.created_at || new Date().toISOString()
    };
}

module.exports = {
    createAppointment
};