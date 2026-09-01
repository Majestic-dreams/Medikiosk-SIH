const {
    getAllDoctors,
    getDoctorById,
    getDoctorsByAyushSystem,
    getDoctorsByDepartment,
    findDoctorsForRouting,
    getAvailableDoctors
} = require("./services/doctorService");


// ============================================================
// TEST 1 — LOAD ALL DOCTORS
// ============================================================

console.log("\n=================================");
console.log("TEST 1: LOAD ALL DOCTORS");
console.log("=================================\n");

const doctors = getAllDoctors();

console.log("Total doctors:", doctors.length);

console.log("First doctor:");
console.log(doctors[0]);


// ============================================================
// TEST 2 — FIND DOCTOR BY ID
// ============================================================

console.log("\n=================================");
console.log("TEST 2: FIND DOCTOR BY ID");
console.log("=================================\n");

const doctor = getDoctorById(
    "AYUSH-0001"
);

console.log(doctor);


// ============================================================
// TEST 3 — FIND AYURVEDA DOCTORS
// ============================================================

console.log("\n=================================");
console.log("TEST 3: AYURVEDA DOCTORS");
console.log("=================================\n");

const ayurvedaDoctors =
    getDoctorsByAyushSystem(
        "Ayurveda"
    );

console.log(
    "Ayurveda doctors:",
    ayurvedaDoctors.length
);

console.log(ayurvedaDoctors);


// ============================================================
// TEST 4 — FIND DOCTORS BY DEPARTMENT
// ============================================================

console.log("\n=================================");
console.log("TEST 4: DEPARTMENT SEARCH");
console.log("=================================\n");

const kayachikitsaDoctors =
    getDoctorsByDepartment(
        "Kayachikitsa"
    );

console.log(
    "Kayachikitsa doctors:",
    kayachikitsaDoctors.length
);

console.log(kayachikitsaDoctors);


// ============================================================
// TEST 5 — FIND DOCTORS FROM ROUTING RESULT
// ============================================================

console.log("\n=================================");
console.log("TEST 5: ROUTING → DOCTOR MATCH");
console.log("=================================\n");

const routing = {
    ayush_system: "Ayurveda",
    department: "Kayachikitsa"
};

const matchedDoctors =
    findDoctorsForRouting(
        routing
    );

console.log(
    "Doctors matching routing:",
    matchedDoctors.length
);

console.log(matchedDoctors);


// ============================================================
// TEST 6 — FILTER AVAILABLE DOCTORS
// ============================================================

console.log("\n=================================");
console.log("TEST 6: AVAILABLE DOCTORS");
console.log("=================================\n");

// Test using a known Monday at 11:30 AM
const testDate = new Date(
    "2026-08-31T11:30:00+05:30"
);

const availableDoctors =
    getAvailableDoctors(
        matchedDoctors,
        testDate
    );

console.log(
    "Test date:",
    testDate.toString()
);

console.log(
    "Available doctors:",
    availableDoctors.length
);

console.log(availableDoctors);


// ============================================================
// TEST COMPLETE
// ============================================================

console.log("\n=================================");
console.log("DOCTOR SERVICE TEST COMPLETE");
console.log("=================================\n");