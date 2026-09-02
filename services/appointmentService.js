// ============================================================
// APPOINTMENT SERVICE
// ============================================================
//
// Responsible for:
//
// 1. Generating appointment slots for a doctor
// 2. Checking doctor's working days
// 3. Checking doctor's consultation hours
// 4. Checking MongoDB for booked appointments
// 5. Returning only available slots
//
// ============================================================

const {
    getDB
} = require("../config/mongodb");


// ============================================================
// GET DAY NAME
// ============================================================

function getDayName(date) {

    const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    return dayNames[date.getDay()];
}


// ============================================================
// CONVERT HH:MM TO MINUTES
// ============================================================

function timeToMinutes(time) {

    const [hours, minutes] =
        time.split(":").map(Number);

    return (
        hours * 60 +
        minutes
    );
}


// ============================================================
// CONVERT MINUTES TO HH:MM
// ============================================================

function minutesToTime(totalMinutes) {

    const hours =
        Math.floor(totalMinutes / 60);

    const minutes =
        totalMinutes % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0")
    );
}


// ============================================================
// GENERATE DOCTOR SLOTS
// ============================================================

function generateDoctorSlots(
    doctor,
    date
) {

    if (!doctor || !date) {
        return [];
    }


    // ========================================================
    // CHECK AVAILABLE DAYS
    // ========================================================

    const selectedDay =
        getDayName(date);

    let availableDays =
        doctor.available_days || [];


    if (
        typeof availableDays === "string"
    ) {

        availableDays =
            availableDays
                .split(",")
                .map(
                    day => day.trim()
                );

    }


    if (
        availableDays.length > 0 &&
        !availableDays.includes(selectedDay)
    ) {

        return [];

    }


    // ========================================================
    // CHECK CONSULTATION HOURS
    // ========================================================

    if (
        !doctor.start_time ||
        !doctor.end_time
    ) {

        return [];

    }


    const startMinutes =
        timeToMinutes(
            doctor.start_time
        );

    const endMinutes =
        timeToMinutes(
            doctor.end_time
        );


    // ========================================================
    // SLOT DURATION
    // ========================================================

    const slotDuration =
        Number(
            doctor.slot_duration_minutes
        ) || 30;


    // ========================================================
    // GENERATE SLOTS
    // ========================================================

    const slots = [];


    for (
        let current = startMinutes;

        current + slotDuration <= endMinutes;

        current += slotDuration
    ) {

        const startTime =
            minutesToTime(
                current
            );

        const endTime =
            minutesToTime(
                current +
                slotDuration
            );


        slots.push({

            start_time:
                startTime,

            end_time:
                endTime,

            duration_minutes:
                slotDuration,

            status:
                "available"

        });

    }


    return slots;

}


// ============================================================
// GET BOOKED APPOINTMENTS
// ============================================================
//
// Finds appointments already booked for a particular
// doctor and date.
//
// ============================================================

async function getBookedAppointments(
    doctorId,
    date
) {

    if (
        !doctorId ||
        !date
    ) {

        return [];

    }


    const db =
        getDB();


    const appointments =
        await db
            .collection("appointments")
            .find({

                doctor_id:
                    doctorId,

                appointment_date:
                    date,

                status: {
                    $in: [
                        "pending",
                        "confirmed",
                        "booked"
                    ]
                }

            })
            .toArray();


    return appointments;

}


// ============================================================
// GET AVAILABLE SLOTS
// ============================================================
//
// Generates all doctor slots and removes slots that are
// already booked in MongoDB.
//
// ============================================================

async function getAvailableSlots(
    doctor,
    date
) {

    if (
        !doctor ||
        !date
    ) {

        return [];

    }


    // ========================================================
    // STEP 1 — GENERATE ALL POSSIBLE SLOTS
    // ========================================================

    const slots =
        generateDoctorSlots(
            doctor,
            date
        );


    if (
        slots.length === 0
    ) {

        return [];

    }


    // ========================================================
    // STEP 2 — FORMAT DATE
    // ========================================================

    const dateString =
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;


    // ========================================================
    // STEP 3 — GET BOOKED APPOINTMENTS
    // ========================================================

    const bookedAppointments =
        await getBookedAppointments(
            doctor.doctor_id,
            dateString
        );


    // ========================================================
    // STEP 4 — REMOVE BOOKED SLOTS
    // ========================================================

    return slots.filter(
        slot => {

            const slotStart =
                timeToMinutes(
                    slot.start_time
                );

            const slotEnd =
                timeToMinutes(
                    slot.end_time
                );


            // ------------------------------------------------
            // Check whether this generated slot overlaps
            // with any existing appointment.
            // ------------------------------------------------

            const isBooked =
                bookedAppointments.some(
                    appointment => {

                        if (
                            !appointment.start_time ||
                            !appointment.end_time
                        ) {

                            return false;

                        }


                        const bookedStart =
                            timeToMinutes(
                                appointment.start_time
                            );

                        const bookedEnd =
                            timeToMinutes(
                                appointment.end_time
                            );


                        return (
                            slotStart < bookedEnd &&
                            slotEnd > bookedStart
                        );

                    }
                );


            return !isBooked;

        }
    );

}

// ============================================================
// BOOK APPOINTMENT
// ============================================================

async function bookAppointment(data) {

    if (!data) {
        throw new Error("Appointment data is required.");
    }
    // ============================================================
    // VERIFY LINKED CONSULTATION
    // ============================================================

    const db = getDB();

    let linkedConsultation = null;

    if (consultation_id) {
        linkedConsultation = await db
            .collection("consultations")
            .findOne({
                consultation_id
            });

        if (!linkedConsultation) {
            throw new Error(
                "The linked consultation was not found."
            );
        }

        const selectedDoctorId =
            linkedConsultation
                .selected_doctor
                ?.doctor_id ||
            linkedConsultation
                .appointment
                ?.doctor_id ||
            null;

        if (
            selectedDoctorId &&
            selectedDoctorId !== doctor_id
        ) {
            throw new Error(
                "The selected doctor does not match the consultation."
            );
        }
    }
    const {
        patient_id,
        consultation_id,
        doctor_id,
        appointment_date,
        start_time,
        mode
    } = data;

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    if (!doctor_id) {
        throw new Error("doctor_id is required.");
    }

    if (!appointment_date) {
        throw new Error("appointment_date is required.");
    }

    if (!start_time) {
        throw new Error("start_time is required.");
    }

    // --------------------------------------------------------
    // GET DOCTOR
    // --------------------------------------------------------

    // We use doctorService here rather than duplicating
    // doctor lookup logic.

    const {
        getDoctorById
    } = require("./doctorService");

    const doctor =
        getDoctorById(doctor_id);

    if (!doctor) {
        throw new Error("Doctor not found.");
    }

    // --------------------------------------------------------
    // CONVERT DATE
    // --------------------------------------------------------

    const [year, month, day] =
        appointment_date
            .split("-")
            .map(Number);

    const selectedDate =
        new Date(
            year,
            month - 1,
            day
        );

    if (
        Number.isNaN(
            selectedDate.getTime()
        )
    ) {
        throw new Error(
            "Invalid appointment date. Use YYYY-MM-DD."
        );
    }

    // --------------------------------------------------------
    // GET CURRENTLY AVAILABLE SLOTS
    // --------------------------------------------------------

    const availableSlots =
        await getAvailableSlots(
            doctor,
            selectedDate
        );

    // --------------------------------------------------------
    // FIND REQUESTED SLOT
    // --------------------------------------------------------

    const requestedSlot =
        availableSlots.find(
            slot =>
                slot.start_time === start_time
        );

    if (!requestedSlot) {

        throw new Error(
            "The requested appointment slot is not available."
        );
    }

    // --------------------------------------------------------
    // CREATE APPOINTMENT
    // --------------------------------------------------------

    const {
        createAppointment
    } = require("../models/appointmentModel");

    const appointmentId =
        `APT-${Date.now()}`;

    const appointment =
        createAppointment({
            appointment_id:
                appointmentId,

            patient_id:
                patient_id || null,

            consultation_id:
                consultation_id || null,

            doctor_id:
                doctor_id,

            appointment_date:
                appointment_date,

            start_time:
                requestedSlot.start_time,

            end_time:
                requestedSlot.end_time,

            mode:
                mode || "online",

            status:
                "confirmed"
        });

    // --------------------------------------------------------
    // SAVE TO MONGODB
    // --------------------------------------------------------

    

    await db
        .collection("appointments")
        .insertOne(appointment);
    // ============================================================
    // UPDATE LINKED CONSULTATION
    // ============================================================

    if (consultation_id) {
        await db
            .collection("consultations")
            .updateOne(
                {
                    consultation_id
                },
                {
                    $set: {
                        status:
                            "APPOINTMENT_BOOKED",

                        appointment: {
                            status:
                                "CONFIRMED",

                            doctor_id:
                                doctor_id,

                            appointment_id:
                                appointment.appointment_id,

                            date:
                                appointment.appointment_date,

                            time:
                                appointment.start_time,

                            end_time:
                                appointment.end_time,

                            mode:
                                appointment.mode
                        },

                        updated_at:
                            new Date().toISOString()
                    }
                }
            );
    }  
    // --------------------------------------------------------
    // RETURN BOOKING
    // --------------------------------------------------------

    return appointment;
}

// ============================================================
// EXPORT SERVICE
// ============================================================

module.exports = {
    getDayName,
    timeToMinutes,
    minutesToTime,
    generateDoctorSlots,
    getBookedAppointments,
    getAvailableSlots,
    bookAppointment
};