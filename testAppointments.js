// ============================================================
// TEST: APPOINTMENT SLOT GENERATION
// ============================================================
//
// Tests:
// 1. Loading a doctor from doctors.json
// 2. Reading the doctor's availability
// 3. Generating appointment slots
// 4. Verifying slot count and timing
//
// ============================================================

// Load environment variables first.
// This prevents MongoDB configuration errors when any
// imported service loads config/mongodb.js.
require("dotenv").config();


// ============================================================
// IMPORT SERVICES
// ============================================================

const {
    getDoctorById
} = require("./services/doctorService");

const {
    generateDoctorSlots
} = require("./services/appointmentService");


// ============================================================
// TEST CONFIGURATION
// ============================================================

// Doctor we want to test
const DOCTOR_ID = "AYUSH-0003";

// Test date:
// 31 August 2026 is a Monday.
//
// IMPORTANT:
// We create this date using local date components so that
// the test does not accidentally shift to another day because
// of UTC conversion.
const testDate = new Date(
    2026,
    7,       // August = 7 because JavaScript months start at 0
    31,
    11,
    30,
    0
);


// ============================================================
// TEST HEADER
// ============================================================

console.log(
    "\n================================="
);

console.log(
    "TEST: APPOINTMENT SLOT GENERATION"
);

console.log(
    "=================================\n"
);


// ============================================================
// STEP 1 — FIND DOCTOR
// ============================================================

console.log(
    "Searching for doctor:",
    DOCTOR_ID
);

const doctor = getDoctorById(
    DOCTOR_ID
);


// ============================================================
// HANDLE DOCTOR NOT FOUND
// ============================================================

if (!doctor) {

    console.error(
        "\nDoctor not found!"
    );

    console.error(
        "Doctor ID:",
        DOCTOR_ID
    );

    process.exit(1);
}


// ============================================================
// STEP 2 — DISPLAY DOCTOR INFORMATION
// ============================================================

console.log(
    "\nDoctor:"
);

console.log(
    doctor.doctor_name
);

console.log(
    "Doctor ID:",
    doctor.doctor_id
);

console.log(
    "AYUSH system:",
    doctor.ayush_system
);

console.log(
    "Department:",
    doctor.department
);

console.log(
    "Available days:",
    doctor.available_days
);

console.log(
    "Consultation hours:",
    `${doctor.start_time} - ${doctor.end_time}`
);

console.log(
    "Slot duration:",
    `${doctor.slot_duration_minutes} minutes`
);


// ============================================================
// STEP 3 — DISPLAY TEST DATE
// ============================================================

console.log(
    "\nTest date:"
);

console.log(
    testDate
);

console.log(
    "Test day:",
    testDate.toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    )
);


// ============================================================
// STEP 4 — GENERATE SLOTS
// ============================================================

const slots = generateDoctorSlots(
    doctor,
    testDate
);


// ============================================================
// STEP 5 — DISPLAY GENERATED SLOTS
// ============================================================

console.log(
    "\nGenerated slots:"
);

console.log(
    slots
);


// ============================================================
// STEP 6 — DISPLAY SLOT COUNT
// ============================================================

console.log(
    "\nTotal slots:",
    slots.length
);


// ============================================================
// STEP 7 — BASIC VALIDATION
// ============================================================

console.log(
    "\n================================="
);

console.log(
    "VALIDATION"
);

console.log(
    "================================="
);


// Expected slots:
//
// 11:00 - 11:30
// 11:30 - 12:00
// 12:00 - 12:30
// 12:30 - 13:00
// 13:00 - 13:30
// 13:30 - 14:00
//
// Total = 6 slots

const expectedSlotCount = 6;


if (
    slots.length === expectedSlotCount
) {

    console.log(
        "PASS: Correct number of slots generated."
    );

}

else {

    console.error(
        "FAIL: Unexpected number of slots."
    );

    console.error(
        "Expected:",
        expectedSlotCount
    );

    console.error(
        "Received:",
        slots.length
    );
}


// ============================================================
// VALIDATE FIRST SLOT
// ============================================================

if (
    slots.length > 0
) {

    const firstSlot = slots[0];

    if (
        firstSlot.start_time === "11:00" &&
        firstSlot.end_time === "11:30"
    ) {

        console.log(
            "PASS: First slot is 11:00 - 11:30."
        );

    }

    else {

        console.error(
            "FAIL: First slot is incorrect."
        );

        console.error(
            firstSlot
        );
    }
}


// ============================================================
// VALIDATE LAST SLOT
// ============================================================

if (
    slots.length > 0
) {

    const lastSlot =
        slots[slots.length - 1];

    if (
        lastSlot.start_time === "13:30" &&
        lastSlot.end_time === "14:00"
    ) {

        console.log(
            "PASS: Last slot is 13:30 - 14:00."
        );

    }

    else {

        console.error(
            "FAIL: Last slot is incorrect."
        );

        console.error(
            lastSlot
        );
    }
}


// ============================================================
// VALIDATE ALL SLOT STATUS
// ============================================================

const allSlotsAvailable =
    slots.every(
        slot =>
            slot.status === "available"
    );


if (allSlotsAvailable) {

    console.log(
        "PASS: All generated slots are available."
    );

}

else {

    console.error(
        "FAIL: One or more slots are not available."
    );
}


// ============================================================
// FINAL RESULT
// ============================================================

console.log(
    "\n================================="
);

console.log(
    "APPOINTMENT SLOT TEST COMPLETE"
);

console.log(
    "=================================\n"
);