const express = require("express");

const {
    routePatient
} = require("../services/routingService");

const {
    createConsultation
} = require("../models/consultation");

const {
    saveConsultation
} = require("../services/consultationService");

const {
    generateConsultationId
} = require("../utils/consultationId");

const {
    getDB
} = require("../config/mongodb");

const {
    findDoctorsForRouting,
    getAvailableDoctors
} = require("../services/doctorService");

const router = express.Router();


// ============================================================
// HELPER: NORMALIZE PATIENT INPUT
// ============================================================

function normalizePatientInput(body) {

    const patient = body.patient || {};
    const symptoms = body.symptoms || {};
    const history = body.history || {};

    return {
        preferred_ayush_system:
            body.preferred_ayush_system &&
            body.preferred_ayush_system !== "No preference"
                ? body.preferred_ayush_system
                : null,

        patient: {
            patient_id:
                patient.patient_id ||
                body.patient_id ||
                null,

            name:
                patient.name || null,

            age:
                patient.age
                    ? Number(patient.age)
                    : null,

            gender:
                patient.gender || null,

            phone:
                patient.phone || null
        },


        symptoms: {

            chief_complaint:
                symptoms.chief_complaint ||
                body.chief_complaint ||
                null,

            duration:
                symptoms.duration || null,

            severity:
                symptoms.severity || null,

            associated_symptoms:
                Array.isArray(
                    symptoms.associated_symptoms
                )
                    ? symptoms.associated_symptoms
                    : [],

            onset:
                symptoms.onset || null,

            aggravating_factors:
                symptoms.aggravating_factors ||
                null,

            relieving_factors:
                symptoms.relieving_factors ||
                null
        },


        history: {

            relevant_history:
                history.relevant_history ||
                null,

            medications:
                history.medications ||
                null,

            allergies:
                history.allergies ||
                null
        },


        clarification_answers:
            body.clarification_answers || {}
    };
}


// ============================================================
// VALIDATE PATIENT INPUT
// ============================================================

function validatePatientInput(data) {

    const errors = [];


    // --------------------------------------------------------
    // Patient validation
    // --------------------------------------------------------

    if (!data.patient.name) {

        errors.push(
            "Patient name is required."
        );
    }


    if (
        data.patient.age === null ||
        Number.isNaN(data.patient.age)
    ) {

        errors.push(
            "Patient age is required."
        );
    }


    if (!data.patient.gender) {

        errors.push(
            "Patient gender is required."
        );
    }


    // --------------------------------------------------------
    // Symptom validation
    // --------------------------------------------------------

    if (
        !data.symptoms.chief_complaint
    ) {

        errors.push(
            "Chief complaint is required."
        );
    }


    return errors;
}


// ============================================================
// POST /api/consultations
// ============================================================
//
// Creates a consultation,
// performs symptom routing,
// finds matching doctors,
// filters available doctors,
// and saves the complete consultation to MongoDB.
//
// ============================================================

router.post("/", async (req, res) => {

    try {

        console.log(
            "\n================================="
        );

        console.log(
            "NEW CONSULTATION REQUEST"
        );

        console.log(
            "=================================\n"
        );


        // ====================================================
        // STEP 1 — NORMALIZE INPUT
        // ====================================================

        const normalizedInput =
            normalizePatientInput(
                req.body
            );


        console.log(
            "Normalized patient input:"
        );

        console.log(
            normalizedInput
        );


        // ====================================================
        // STEP 2 — VALIDATE INPUT
        // ====================================================

        const validationErrors =
            validatePatientInput(
                normalizedInput
            );


        if (
            validationErrors.length > 0
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Invalid consultation data.",

                validation_errors:
                    validationErrors

            });
        }


        // ====================================================
        // STEP 3 — CREATE CONSULTATION OBJECT
        // ====================================================

        const consultation =
            createConsultation(
                normalizedInput
            );
            consultation.patient_ayush_preference =
        normalizedInput.preferred_ayush_system;

        consultation.consultation_id =
            generateConsultationId();


        console.log(
            "\nConsultation created:"
        );

        console.log(
            consultation.consultation_id
        );


        // ====================================================
        // STEP 4 — PERFORM SYMPTOM ROUTING
        // ====================================================

        const routingResult =
            routePatient(
                normalizedInput
            );


        console.log(
            "\nRouting result:"
        );

        console.log(
            routingResult
        );


        // ====================================================
        // STEP 4A — FIND DOCTORS FROM ROUTING RESULT
        // ====================================================

        let matchedDoctors = [];
        let availableDoctors = [];


        if (
            routingResult.routing_status === "ROUTED" &&
            routingResult.routing
        ) {


            // ------------------------------------------------
            // FIRST: PRIMARY DEPARTMENT
            // ------------------------------------------------

            const doctorRoutingCriteria = {
                ...routingResult.routing,

                ayush_system:
                    normalizedInput.preferred_ayush_system ||
                    routingResult.routing.ayush_system
            };

            matchedDoctors =
                findDoctorsForRouting(
                    doctorRoutingCriteria
                );


            // ------------------------------------------------
            // SECOND: ALTERNATIVE DEPARTMENT
            // ------------------------------------------------

            if (
                matchedDoctors.length === 0 &&
                routingResult.routing.alternative_department
            ) {

                console.log(
                    "\nNo doctors found in primary department."
                );

                console.log(
                    "Trying alternative department:",
                    routingResult.routing.alternative_department
                );


                matchedDoctors =
                    findDoctorsForRouting({

                        ayush_system:
                            normalizedInput.preferred_ayush_system ||
                            routingResult.routing.ayush_system,

                        department:
                            routingResult.routing.alternative_department
                    });
            }


            // ------------------------------------------------
            // THIRD: FILTER AVAILABLE DOCTORS
            // ------------------------------------------------

            availableDoctors =
                getAvailableDoctors(
                    matchedDoctors
                );


            console.log(
                "\nDoctor matching:"
            );

            console.log(
                "Matched doctors:",
                matchedDoctors.length
            );

            console.log(
                "Available doctors:",
                availableDoctors.length
            );
        }


        // ====================================================
        // STEP 5 — ATTACH ROUTING RESULT
        // ====================================================

        consultation.routing =
            routingResult;


        // ====================================================
        // STEP 5A — ATTACH DOCTOR OPTIONS
        // ====================================================

        consultation.doctors = {

            matched:
                matchedDoctors,

            available:
                availableDoctors
        };


        // ====================================================
        // STEP 6 — SET CONSULTATION STATUS
        // ====================================================

        if (
            routingResult.routing_status ===
            "ESCALATION"
        ) {

            consultation.status =
                "HUMAN_REVIEW";

        }

        else if (
            routingResult.routing_status ===
            "CLARIFICATION_REQUIRED"
        ) {

            consultation.status =
                "CLARIFICATION_REQUIRED";

        }

        else if (
            routingResult.routing_status ===
            "INSUFFICIENT_MATCH"
        ) {

            consultation.status =
                "HUMAN_REVIEW";

        }

        else {

            consultation.status =
                "ROUTED";
        }


        // ====================================================
        // STEP 7 — SAVE COMPLETE CONSULTATION
        // ====================================================

        const savedConsultation =
            await saveConsultation(
                consultation
            );


        console.log(
            "\nMongoDB:"
        );

        console.log(
            "Consultation saved successfully."
        );

        console.log(
            savedConsultation.consultation_id
        );


        // ====================================================
        // STEP 8 — RETURN RESPONSE
        // ====================================================

        return res.status(201).json({

            success: true,

            message:
                "Consultation created and saved successfully.",

            consultation:
                savedConsultation

        });


    }

    catch (error) {

        console.error(
            "\nConsultation creation failed:"
        );

        console.error(
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Failed to create consultation.",

            message:
                error.message

        });
    }

});


// ============================================================
// GET /api/consultations/:consultationId
// ============================================================

router.get(
    "/:consultationId",
    async (req, res) => {

        try {

            const {
                consultationId
            } = req.params;


            if (!consultationId) {

                return res.status(400).json({

                    success: false,

                    error:
                        "consultationId is required."

                });
            }


            const db =
                getDB();


            const consultation =
                await db
                    .collection("consultations")
                    .findOne({

                        consultation_id:
                            consultationId

                    });


            if (!consultation) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Consultation not found.",

                    consultation_id:
                        consultationId

                });
            }


            const {
                _id,
                ...consultationData
            } = consultation;


            return res.status(200).json({

                success: true,

                consultation:
                    consultationData

            });

        }


        catch (error) {

            console.error(
                "GET consultation error:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "Failed to retrieve consultation.",

                message:
                    error.message

            });
        }

    }
);


// ============================================================
// POST /api/consultations/:consultationId/clarification
// ============================================================
//
// Receives clarification answers,
// re-runs routing,
// finds doctors,
// filters availability,
// updates MongoDB,
// and returns the updated consultation.
//
// ============================================================

router.post(
    "/:consultationId/clarification",
    async (req, res) => {

        try {

            console.log(
                "\n================================="
            );

            console.log(
                "CLARIFICATION RESPONSE"
            );

            console.log(
                "=================================\n"
            );


            // =================================================
            // STEP 1 — GET CONSULTATION ID
            // =================================================

            const {
                consultationId
            } = req.params;


            if (!consultationId) {

                return res.status(400).json({

                    success: false,

                    error:
                        "consultationId is required."

                });
            }


            // =================================================
            // STEP 2 — GET CLARIFICATION ANSWERS
            // =================================================

            const clarificationAnswers =
                req.body.clarification_answers;


            if (
                !clarificationAnswers ||
                typeof clarificationAnswers !== "object" ||
                Array.isArray(clarificationAnswers)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "clarification_answers must be an object."

                });
            }


            console.log(
                "Clarification answers:"
            );

            console.log(
                clarificationAnswers
            );


            // =================================================
            // STEP 3 — GET DATABASE
            // =================================================

            const db =
                getDB();


            // =================================================
            // STEP 4 — FIND EXISTING CONSULTATION
            // =================================================

            const consultation =
                await db
                    .collection("consultations")
                    .findOne({

                        consultation_id:
                            consultationId

                    });


            if (!consultation) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Consultation not found.",

                    consultation_id:
                        consultationId

                });
            }


            // =================================================
            // STEP 5 — UPDATE CLARIFICATION ANSWERS
            // =================================================

            const existingAnswers =
                consultation.clarification_answers || {};


            const updatedAnswers = {

                ...existingAnswers,

                ...clarificationAnswers

            };


            // =================================================
            // STEP 6 — RECONSTRUCT ROUTING INPUT
            // =================================================

            const routingInput = {

                patient:
                    consultation.patient || {},

                symptoms:
                    consultation.symptoms || {},

                history:
                    consultation.history || {},

                clarification_answers:
                    updatedAnswers

            };


            console.log(
                "\nRouting input after clarification:"
            );

            console.log(
                routingInput
            );


            // =================================================
            // STEP 7 — RUN ROUTING AGAIN
            // =================================================

            const routingResult =
                routePatient(
                    routingInput
                );


            console.log(
                "\nUpdated routing result:"
            );

            console.log(
                routingResult
            );


            // =================================================
            // STEP 7A — FIND DOCTORS AGAIN
            // =================================================

            let matchedDoctors = [];
            let availableDoctors = [];


            if (
                routingResult.routing_status === "ROUTED" &&
                routingResult.routing
            ) {


                // ------------------------------------------------
                // PRIMARY DEPARTMENT
                // ------------------------------------------------

                matchedDoctors =
                    findDoctorsForRouting(
                        routingResult.routing
                    );


                // ------------------------------------------------
                // ALTERNATIVE DEPARTMENT
                // ------------------------------------------------

                if (
                    matchedDoctors.length === 0 &&
                    routingResult.routing.alternative_department
                ) {

                    console.log(
                        "\nNo doctors found in primary department."
                    );

                    console.log(
                        "Trying alternative department:",
                        routingResult.routing.alternative_department
                    );


                    matchedDoctors =
                        findDoctorsForRouting({

                            ayush_system:
                                routingResult.routing.ayush_system,

                            department:
                                routingResult.routing.alternative_department

                        });
                }


                // ------------------------------------------------
                // FILTER AVAILABLE DOCTORS
                // ------------------------------------------------

                availableDoctors =
                    getAvailableDoctors(
                        matchedDoctors
                    );


                console.log(
                    "\nDoctor matching after clarification:"
                );

                console.log(
                    "Matched doctors:",
                    matchedDoctors.length
                );

                console.log(
                    "Available doctors:",
                    availableDoctors.length
                );
            }


            // =================================================
            // STEP 8 — DETERMINE NEW STATUS
            // =================================================

            let newStatus;


            if (
                routingResult.routing_status ===
                "ESCALATION"
            ) {

                newStatus =
                    "HUMAN_REVIEW";

            }

            else if (
                routingResult.routing_status ===
                "CLARIFICATION_REQUIRED"
            ) {

                newStatus =
                    "CLARIFICATION_REQUIRED";

            }

            else if (
                routingResult.routing_status ===
                "INSUFFICIENT_MATCH"
            ) {

                newStatus =
                    "HUMAN_REVIEW";

            }

            else {

                newStatus =
                    "ROUTED";

            }


            // =================================================
            // STEP 9 — UPDATE MONGODB
            // =================================================

            await db
                .collection("consultations")
                .updateOne(

                    {
                        consultation_id:
                            consultationId
                    },

                    {
                        $set: {

                            clarification_answers:
                                updatedAnswers,

                            routing:
                                routingResult,

                            doctors: {

                                matched:
                                    matchedDoctors,

                                available:
                                    availableDoctors

                            },

                            status:
                                newStatus,

                            updated_at:
                                new Date()

                        }
                    }

                );


            // =================================================
            // STEP 10 — GET UPDATED CONSULTATION
            // =================================================

            const updatedConsultation =
                await db
                    .collection("consultations")
                    .findOne({

                        consultation_id:
                            consultationId

                    });


            // =================================================
            // STEP 11 — REMOVE MONGODB INTERNAL ID
            // =================================================

            const {
                _id,
                ...consultationData
            } = updatedConsultation;


            // =================================================
            // STEP 12 — RETURN RESPONSE
            // =================================================

            return res.status(200).json({

                success: true,

                message:
                    "Clarification answers saved, routing updated, and doctors matched successfully.",

                consultation:
                    consultationData

            });

        }


        catch (error) {

            console.error(
                "\nClarification processing failed:"
            );

            console.error(
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "Failed to process clarification answers.",

                message:
                    error.message

            });

        }

    }
);

// ============================================================
// POST /api/consultations/:consultationId/select-doctor
// Save the patient's selected doctor
// ============================================================

router.post(
    "/:consultationId/select-doctor",
    async (req, res) => {
        try {
            const { consultationId } = req.params;
            const { doctor_id } = req.body;

            if (!consultationId) {
                return res.status(400).json({
                    success: false,
                    error: "consultationId is required."
                });
            }

            if (!doctor_id) {
                return res.status(400).json({
                    success: false,
                    error: "doctor_id is required."
                });
            }

            const db = getDB();

            // Find the existing consultation
            const consultation = await db
                .collection("consultations")
                .findOne({
                    consultation_id: consultationId
                });

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    error: "Consultation not found."
                });
            }

            // Verify that the doctor exists in MongoDB
            const doctor = await db
                .collection("doctor_records")
                .findOne({
                    doctor_id
                });

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    error: "Doctor not found.",
                    doctor_id
                });
            }

            // Only allow a doctor returned for this consultation
            const matchedDoctors =
                consultation.doctors?.matched || [];

            const doctorWasOffered =
                matchedDoctors.some(
                    matchedDoctor =>
                        matchedDoctor.doctor_id === doctor_id
                );

            if (!doctorWasOffered) {
                return res.status(400).json({
                    success: false,
                    error:
                        "The selected doctor was not offered for this consultation."
                });
            }

            const selectedDoctor = {
                doctor_id: doctor.doctor_id,
                doctor_name:
                    doctor.doctor_name || null,
                ayush_system:
                    doctor.ayush_system || null,
                department:
                    doctor.department || null,
                clinic_name:
                    doctor.clinic_name || null,
                location:
                    doctor.location || null,
                appointment_mode:
                    doctor.appointment_mode || null
            };

            await db
                .collection("consultations")
                .updateOne(
                    {
                        consultation_id: consultationId
                    },
                    {
                        $set: {
                            selected_doctor:
                                selectedDoctor,

                            "appointment.doctor_id":
                                doctor.doctor_id,

                            "appointment.status":
                                "NOT_BOOKED",

                            updated_at:
                                new Date().toISOString()
                        }
                    }
                );

            return res.status(200).json({
                success: true,
                message:
                    "Selected doctor saved successfully.",

                selection_status:
                    "DOCTOR_SELECTED",

                consultation_id:
                    consultationId,

                selected_doctor:
                    selectedDoctor
            });
        } catch (error) {
            console.error(
                "Doctor selection error:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Failed to save selected doctor.",
                message: error.message
            });
        }
    }
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;