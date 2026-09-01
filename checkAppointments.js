require("dotenv").config();

const { connectDB, getDB } = require("./config/mongodb");

async function checkAppointments() {
    try {
        await connectDB();

        const db = getDB();

        const appointments = await db
            .collection("appointments")
            .find({
                doctor_id: "AYUSH-0003",
                appointment_date: "2026-08-30"
            })
            .toArray();

        console.log("\n=================================");
        console.log("APPOINTMENTS FOR AYUSH-0003");
        console.log("=================================\n");

        console.log(
            JSON.stringify(appointments, null, 2)
        );

        console.log("\nTotal appointments:", appointments.length);

        process.exit(0);

    } catch (error) {
        console.error("ERROR:", error);
        process.exit(1);
    }
}

checkAppointments();