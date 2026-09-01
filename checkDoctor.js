require("dotenv").config();

const { getDoctorById } = require("./services/doctorService");

const doctor = getDoctorById("AYUSH-0003");

console.log("\n=================================");
console.log("DOCTOR DATA");
console.log("=================================\n");

console.log(JSON.stringify(doctor, null, 2));

if (doctor) {
    console.log("\nAvailable days:", doctor.available_days);
    console.log("Start time:", doctor.start_time);
    console.log("End time:", doctor.end_time);
    console.log("Slot duration:", doctor.slot_duration_minutes);
}