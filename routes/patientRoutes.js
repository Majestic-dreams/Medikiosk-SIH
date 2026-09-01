const express = require("express");
const crypto = require("crypto");

const { getDB } = require("../config/mongodb");
const { createPatient } = require("../models/patientModel");

const router = express.Router();

// ============================================================
// POST /api/patients
// Create or update a patient in MongoDB
// ============================================================

router.post("/", async (req, res) => {
    try {
        const {
            name,
            age,
            gender,
            phone,
            contact
        } = req.body;

        const normalizedName =
            typeof name === "string"
                ? name.trim()
                : "";

        const normalizedGender =
            typeof gender === "string"
                ? gender.trim()
                : "";

        const normalizedPhone =
            typeof (phone || contact) === "string"
                ? (phone || contact).trim()
                : "";

        const normalizedAge = Number(age);

        const validationErrors = [];

        if (!normalizedName) {
            validationErrors.push(
                "Patient name is required."
            );
        }

        if (
            !Number.isFinite(normalizedAge) ||
            normalizedAge < 0 ||
            normalizedAge > 120
        ) {
            validationErrors.push(
                "A valid patient age between 0 and 120 is required."
            );
        }

        if (!normalizedGender) {
            validationErrors.push(
                "Patient gender is required."
            );
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid patient data.",
                validation_errors: validationErrors
            });
        }

        const db = getDB();
        const patientsCollection =
            db.collection("patients");

        // Reuse the same patient when a phone number already exists.
        const existingPatient = normalizedPhone
            ? await patientsCollection.findOne({
                contact: normalizedPhone
            })
            : null;

        if (existingPatient) {
            await patientsCollection.updateOne(
                {
                    patient_id:
                        existingPatient.patient_id
                },
                {
                    $set: {
                        name: normalizedName,
                        age: normalizedAge,
                        gender: normalizedGender,
                        contact: normalizedPhone,
                        updated_at:
                            new Date().toISOString()
                    }
                }
            );

            const updatedPatient =
                await patientsCollection.findOne(
                    {
                        patient_id:
                            existingPatient.patient_id
                    },
                    {
                        projection: {
                            _id: 0
                        }
                    }
                );

            return res.status(200).json({
                success: true,
                message:
                    "Patient information updated successfully.",
                patient: updatedPatient
            });
        }

        const patient = createPatient({
            patient_id:
                `PAT-${crypto.randomUUID()}`,
            name: normalizedName,
            age: normalizedAge,
            gender: normalizedGender,
            contact:
                normalizedPhone || null
        });

        await patientsCollection.insertOne(patient);

        return res.status(201).json({
            success: true,
            message:
                "Patient information saved successfully.",
            patient
        });
    } catch (error) {
        console.error(
            "Patient API error:",
            error
        );

        return res.status(500).json({
            success: false,
            error:
                "Failed to save patient information.",
            message: error.message
        });
    }
});

module.exports = router;