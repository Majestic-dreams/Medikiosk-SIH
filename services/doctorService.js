
const { createDoctor } = require("../models/doctorModel");
const { getDB } = require("../config/mongodb");
// ============================================================
// LOAD DOCTORS DATASET
// ============================================================

// ============================================================
// DOCTORS LOADED FROM MONGODB DURING SERVER STARTUP
// ============================================================

let doctorsCache = [];

// ============================================================
// INITIALIZE DOCTORS FROM MONGODB
// ============================================================

async function initializeDoctorService() {
    const db = getDB();

    const doctorRecords = await db
        .collection("doctor_records")
        .find(
            {},
            {
                projection: {
                    _id: 0
                }
            }
        )
        .toArray();

    if (doctorRecords.length === 0) {
        throw new Error(
            "No doctors found in MongoDB collection: doctor_records"
        );
    }

    doctorsCache = doctorRecords.map(createDoctor);

    console.log(
        `Doctor records loaded from MongoDB: ${doctorsCache.length}`
    );

    return doctorsCache;
}

// ============================================================
// GET CACHED DOCTORS
// ============================================================

function loadDoctors() {
    if (doctorsCache.length === 0) {
        throw new Error(
            "Doctor service has not been initialized from MongoDB."
        );
    }

    return doctorsCache;
}

// ============================================================
// GET ALL DOCTORS
// ============================================================

function getAllDoctors() {

    return loadDoctors();

}

// ============================================================
// FIND DOCTOR BY ID
// ============================================================

function getDoctorById(doctorId) {

    const doctors = loadDoctors();

    return doctors.find(
        doctor =>
            doctor.doctor_id === doctorId
    ) || null;

}

// ============================================================
// FIND DOCTORS BY AYUSH SYSTEM
// ============================================================

function getDoctorsByAyushSystem(
    ayushSystem
) {

    const doctors = loadDoctors();

    if (!ayushSystem) {
        return [];
    }

    const normalizedSystem =
        ayushSystem
            .toLowerCase()
            .trim();

    return doctors.filter(
        doctor =>
            doctor.ayush_system &&
            doctor.ayush_system
                .toLowerCase()
                .trim() === normalizedSystem
    );

}

// ============================================================
// FIND DOCTORS BY DEPARTMENT
// ============================================================

function getDoctorsByDepartment(
    department
) {

    const doctors = loadDoctors();

    if (!department) {
        return [];
    }

    const normalizedDepartment =
        department
            .toLowerCase()
            .trim();

    return doctors.filter(
        doctor =>
            doctor.department &&
            doctor.department
                .toLowerCase()
                .trim() === normalizedDepartment
    );

}

// ============================================================
// FIND DOCTORS BY LOCATION
// ============================================================

function getDoctorsByLocation(
    location
) {

    const doctors = loadDoctors();

    if (!location) {
        return [];
    }

    const normalizedLocation =
        location
            .toLowerCase()
            .trim();

    return doctors.filter(
        doctor =>
            doctor.location &&
            doctor.location
                .toLowerCase()
                .trim() === normalizedLocation
    );

}

// ============================================================
// FIND DOCTORS USING ROUTING RESULT
// ============================================================

function findDoctorsForRouting(
    routing
) {

    const doctors = loadDoctors();

    if (!routing) {
        return [];
    }

    const ayushSystem =
        routing.ayush_system
            ?.toLowerCase()
            .trim();

    const department =
        routing.department
            ?.toLowerCase()
            .trim();

    let matches = doctors;

    // --------------------------------------------------------
    // 1. Filter by AYUSH system
    // --------------------------------------------------------

    if (ayushSystem) {

        matches = matches.filter(
            doctor =>
                doctor.ayush_system &&
                doctor.ayush_system
                    .toLowerCase()
                    .trim() === ayushSystem
        );

    }

    // --------------------------------------------------------
    // 2. Filter by department
    // --------------------------------------------------------

    if (department) {

        const departmentMatches =
            matches.filter(
                doctor =>
                    doctor.department &&
                    doctor.department
                        .toLowerCase()
                        .trim() === department
            );

        // Only replace the result if
        // department actually produced matches.

        if (departmentMatches.length > 0) {

            matches =
                departmentMatches;

        }

    }

    return matches;

}

// ============================================================
// GET AVAILABLE DOCTORS
// ============================================================
//
// Checks whether doctors are:
//
// 1. Accepting bookings
// 2. Working on the requested day
// 3. Currently within their consultation hours
//
// date defaults to the current date/time.
//
// ============================================================

function getAvailableDoctors(
    doctors,
    date = new Date()
) {

    // --------------------------------------------------------
    // Validate doctors input
    // --------------------------------------------------------

    if (!Array.isArray(doctors)) {

        return [];

    }

    // --------------------------------------------------------
    // Day names
    // --------------------------------------------------------

    const dayNames = [

        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ];

    // --------------------------------------------------------
    // Determine requested day
    // --------------------------------------------------------

    const currentDay =
        dayNames[date.getDay()];

    // --------------------------------------------------------
    // Determine requested time
    // --------------------------------------------------------

    const currentHours =
        String(
            date.getHours()
        ).padStart(2, "0");

    const currentMinutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");

    const currentTime =
        `${currentHours}:${currentMinutes}`;

    // --------------------------------------------------------
    // Filter doctors
    // --------------------------------------------------------

    return doctors.filter(
        doctor => {

            // =================================================
            // 1. CHECK BOOKING STATUS
            // =================================================

            if (
                doctor.booking_status &&
                doctor.booking_status
                    .toLowerCase() !== "available"
            ) {

                return false;

            }

            // =================================================
            // 2. CHECK AVAILABLE DAY
            // =================================================

            let availableDays =
                doctor.available_days || [];

            // Support comma-separated string
            // as well as array format.

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
                !availableDays.includes(
                    currentDay
                )
            ) {

                return false;

            }

            // =================================================
            // 3. CHECK CONSULTATION TIME
            // =================================================

            if (
                doctor.start_time &&
                doctor.end_time
            ) {

                if (
                    currentTime <
                        doctor.start_time ||
                    currentTime >=
                        doctor.end_time
                ) {

                    return false;

                }

            }

            // =================================================
            // DOCTOR IS AVAILABLE
            // =================================================

            return true;

        }
    );

}

// ============================================================
// SEARCH DOCTORS
// ============================================================

function searchDoctors({
    ayush_system,
    department,
    location
} = {}) {

    let doctors = loadDoctors();

    // --------------------------------------------------------
    // FILTER BY AYUSH SYSTEM
    // --------------------------------------------------------

    if (ayush_system) {
        const normalizedAyush =
            ayush_system
                .toLowerCase()
                .trim();

        doctors = doctors.filter(
            doctor =>
                doctor.ayush_system &&
                doctor.ayush_system
                    .toLowerCase()
                    .trim() === normalizedAyush
        );
    }

    // --------------------------------------------------------
    // FILTER BY DEPARTMENT
    // --------------------------------------------------------

    if (department) {
        const normalizedDepartment =
            department
                .toLowerCase()
                .trim();

        doctors = doctors.filter(
            doctor =>
                doctor.department &&
                doctor.department
                    .toLowerCase()
                    .trim() === normalizedDepartment
        );
    }

    // --------------------------------------------------------
    // FILTER BY LOCATION
    // --------------------------------------------------------

    if (location) {
        const normalizedLocation =
            location
                .toLowerCase()
                .trim();

        doctors = doctors.filter(
            doctor =>
                doctor.location &&
                doctor.location
                    .toLowerCase()
                    .trim() === normalizedLocation
        );
    }

    return doctors;
}

// ============================================================
// EXPORT SERVICES
// ============================================================

module.exports = {
    initializeDoctorService,

    loadDoctors,

    getAllDoctors,

    getDoctorById,

    getDoctorsByAyushSystem,

    getDoctorsByDepartment,

    getDoctorsByLocation,

    findDoctorsForRouting,

    getAvailableDoctors,

    searchDoctors
};