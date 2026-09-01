const express = require("express");

const {
    searchDoctors
} = require("../services/doctorService");

const router = express.Router();


// ============================================================
// GET DOCTORS
// ============================================================
//
// Example:
//
// GET /api/doctors
//
// GET /api/doctors?ayush_system=Ayurveda
//
// GET /api/doctors?department=Kayachikitsa
//
// GET /api/doctors?ayush_system=Ayurveda&department=Kayachikitsa
//
// ============================================================

router.get("/", async (req, res) => {

    try {

        console.log("\n=================================");
        console.log("DOCTOR SEARCH REQUEST");
        console.log("=================================\n");

        const {
            ayush_system,
            department,
            location
        } = req.query;


        console.log("Search filters:");
        console.log({
            ayush_system,
            department,
            location
        });


        // ====================================================
        // SEARCH DOCTORS
        // ====================================================

        const doctors = await searchDoctors({
            ayush_system,
            department,
            location
        });


        console.log("\nDoctors found:", doctors.length);


        // ====================================================
        // RETURN RESPONSE
        // ====================================================

        return res.status(200).json({

            success: true,

            count: doctors.length,

            filters: {
                ayush_system: ayush_system || null,
                department: department || null,
                location: location || null
            },

            doctors

        });


    } catch (error) {

        console.error(
            "\nDoctor search failed:"
        );

        console.error(error);


        return res.status(500).json({

            success: false,

            error:
                "Failed to search doctors.",

            message:
                error.message

        });

    }

});
router.get("/:doctorId/available-slots", async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;

        const response = await fetch(
            `http://localhost:${process.env.PORT || 3000}/api/appointments/available/${encodeURIComponent(
                doctorId
            )}?date=${encodeURIComponent(date || "")}`
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: data.error || "Unable to fetch available slots"
            });
        }

        return res.status(200).json({
            success: true,

            doctor: data.doctor || null,

            date: data.date || date || null,

            available_slots: Array.isArray(data.slots)
                ? data.slots
                : []
        });

    } catch (error) {
        console.error(
            "Retell doctor availability alias error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "AVAILABLE_SLOTS_ERROR",
            message: error.message
        });
    }
});

module.exports = router;