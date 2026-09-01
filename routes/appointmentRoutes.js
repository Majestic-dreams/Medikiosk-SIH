const express = require("express");

const {
    getDoctorById
} = require("../services/doctorService");

const {
    getAvailableSlots,
    bookAppointment
} = require("../services/appointmentService");

const router = express.Router();

router.get(
    "/available/:doctorId",
    async (req, res) => {
        try {
            const { doctorId } = req.params;
            const { date } = req.query;

            if (!doctorId) {
                return res.status(400).json({
                    success: false,
                    error: "doctorId is required."
                });
            }

            const doctor =
                getDoctorById(doctorId);

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    error: "Doctor not found.",
                    doctor_id: doctorId
                });
            }

            let selectedDate;

            if (date) {
                const [year, month, day] =
                    date.split("-").map(Number);

                selectedDate =
                    new Date(
                        year,
                        month - 1,
                        day
                    );
            } else {
                const now = new Date();

                selectedDate =
                    new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate()
                    );
            }

            if (
                Number.isNaN(
                    selectedDate.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid date. Use YYYY-MM-DD."
                });
            }

            const slots =
                await getAvailableSlots(
                    doctor,
                    selectedDate
                );

            const responseDate =
                date ||
                `${selectedDate.getFullYear()}-${String(
                    selectedDate.getMonth() + 1
                ).padStart(2, "0")}-${String(
                    selectedDate.getDate()
                ).padStart(2, "0")}`;

            return res.status(200).json({
                success: true,

                doctor: {
                    doctor_id:
                        doctor.doctor_id,

                    doctor_name:
                        doctor.doctor_name,

                    ayush_system:
                        doctor.ayush_system,

                    department:
                        doctor.department,

                    location:
                        doctor.location,

                    clinic_name:
                        doctor.clinic_name
                },

                date: responseDate,

                slots
            });

        } catch (error) {

            console.error(
                "Appointment slot API error:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Failed to generate appointment slots.",
                message:
                    error.message
            });
        }
    }
);
// ============================================================
// BOOK APPOINTMENT
// ============================================================

router.post(
    "/book",
    async (req, res) => {

        try {

            const {
                patient_id,
                consultation_id,
                doctor_id,
                appointment_date,
                start_time,
                mode
            } = req.body;

            // ------------------------------------------------
            // BASIC VALIDATION
            // ------------------------------------------------

            if (!doctor_id) {
                return res.status(400).json({
                    success: false,
                    error: "doctor_id is required."
                });
            }

            if (!appointment_date) {
                return res.status(400).json({
                    success: false,
                    error:
                        "appointment_date is required."
                });
            }

            if (!start_time) {
                return res.status(400).json({
                    success: false,
                    error:
                        "start_time is required."
                });
            }

            // ------------------------------------------------
            // BOOK APPOINTMENT
            // ------------------------------------------------

            const appointment =
                await bookAppointment({
                    patient_id,
                    consultation_id,
                    doctor_id,
                    appointment_date,
                    start_time,
                    mode
                });

            // ------------------------------------------------
            // SUCCESS RESPONSE
            // ------------------------------------------------

            return res.status(201).json({
                success: true,
                message:
                    "Appointment booked successfully.",

                appointment
            });

        } catch (error) {

            console.error(
                "Appointment booking API error:",
                error
            );

            // ----------------------------------------------
            // SLOT NOT AVAILABLE
            // ----------------------------------------------

            if (
                error.message ===
                "The requested appointment slot is not available."
            ) {
                return res.status(409).json({
                    success: false,
                    error: error.message
                });
            }

            // ----------------------------------------------
            // OTHER ERROR
            // ----------------------------------------------

            return res.status(500).json({
                success: false,
                error:
                    "Failed to book appointment.",
                message:
                    error.message
            });
        }
    }
);
module.exports = router;