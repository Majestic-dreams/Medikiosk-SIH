function createDoctor(data) {
    return {
        doctor_id: data.doctor_id,

        doctor_name:
            data.doctor_name || null,

        ayush_system:
            data.ayush_system || null,

        department:
            data.department || null,

        location:
            data.location || null,

        state:
            data.state || null,

        clinic_name:
            data.clinic_name || null,

        available_days:
            normalizeAvailableDays(data.available_days),

        start_time:
            data.start_time || null,

        end_time:
            data.end_time || null,

        slot_duration_minutes:
            data.slot_duration_minutes
                ? Number(data.slot_duration_minutes)
                : null,

        timezone:
            data.timezone || "Asia/Kolkata",

        appointment_mode:
            data.appointment_mode || null,

        booking_status:
            data.booking_status || "available"
    };
}


// ============================================================
// NORMALIZE AVAILABLE DAYS
// ============================================================

function normalizeAvailableDays(value) {

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {

        return value
            .split(",")
            .map(day => day.trim())
            .filter(Boolean);
    }

    return [];
}


module.exports = {
    createDoctor
};