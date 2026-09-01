const express = require("express");
const { connectDB } = require("../config/mongodb");

const router = express.Router();

/*
  ==========================================================
  POST /api/retell/webhook
  Receives analyzed Retell call data and stores it in MongoDB
  ==========================================================
*/

router.post("/webhook", async (req, res) => {
    try {

        const payload = req.body || {};

        const event = payload.event || null;
        const call = payload.call || {};

        const callId =
            call.call_id ||
            payload.call_id ||
            null;

        console.log("\n======================================");
        console.log("RETELL WEBHOOK RECEIVED");
        console.log("======================================");

        console.log("Event:", event);
        console.log("Call ID:", callId);

        // --------------------------------------------------
        // We only store analyzed calls here
        // --------------------------------------------------

        if (event !== "call_analyzed") {

            console.log(
                "Webhook acknowledged, but event is not call_analyzed."
            );

            return res.status(200).json({
                success: true,
                received: true,
                stored: false,
                event,
                call_id: callId
            });
        }

        // --------------------------------------------------
        // A call_id is required
        // --------------------------------------------------

        if (!callId) {

            return res.status(400).json({
                success: false,
                error: "MISSING_CALL_ID"
            });
        }

        // --------------------------------------------------
        // Extract Retell post-call analysis
        // --------------------------------------------------

        const analysis =
            call.call_analysis?.custom_analysis_data ||
            {};

        console.log("\nStructured Retell Analysis:");

        console.dir(
            analysis,
            { depth: null }
        );

        // --------------------------------------------------
        // Connect to MongoDB
        // --------------------------------------------------

        const db = await connectDB();

        const collection =
            db.collection("retell_calls");

        // --------------------------------------------------
        // Build safe MongoDB document
        // --------------------------------------------------

        const retellRecord = {

            call_id: callId,

            event: event,

            agent_id:
                call.agent_id ||
                null,

            call_status:
                call.call_status ||
                null,

            patient: {

                name:
                    analysis.patient_name ||
                    null,

                age:
                    analysis.age ||
                    analysis.patient_age ||
                    null,

                gender:
                    analysis.gender ||
                    null

            },

            clinical: {

                chief_complaint:
                    analysis.chief_complaint ||
                    null,

                existing_conditions:
                    analysis.existing_conditions ||
                    null

            },

            appointment: {

                date:
                    analysis.appointment_date ||
                    analysis.confirmed_date ||
                    null,

                time:
                    analysis.appointment_time ||
                    analysis.confirmed_time ||
                    null,

                doctor:
                    analysis.confirmed_doctor ||
                    null,

                department:
                    analysis.department ||
                    analysis.confirmed_department ||
                    null,

                status:
                    analysis.booking_status ||
                    null,

                reference:
                    analysis.appointment_reference ||
                    null

            },

            /*
              Keep the complete Retell analysis too.

              This prevents us from losing fields if we add
              more post-call analysis variables later.
            */
            raw_analysis:
                analysis,

            updated_at:
                new Date()
        };

        // --------------------------------------------------
        // Upsert using call_id
        //
        // If Retell retries the webhook, we UPDATE the same
        // call instead of creating duplicate records.
        // --------------------------------------------------

        const result =
            await collection.updateOne(

                {
                    call_id: callId
                },

                {
                    $set: retellRecord,

                    $setOnInsert: {
                        created_at:
                            new Date()
                    }
                },

                {
                    upsert: true
                }

            );

        console.log("\nMongoDB Retell record saved.");

        console.log(
            "Matched:",
            result.matchedCount
        );

        console.log(
            "Modified:",
            result.modifiedCount
        );

        console.log(
            "Inserted:",
            result.upsertedCount
        );

        console.log("======================================\n");

        return res.status(200).json({

            success: true,

            received: true,

            stored: true,

            event,

            call_id: callId

        });

    } catch (error) {

        console.error(
            "Retell webhook MongoDB error:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "RETELL_WEBHOOK_DATABASE_ERROR",

            message:
                error.message

        });
    }
});


/*
  ==========================================================
  GET /api/retell/result/:callId

  Allows the frontend to retrieve the structured result
  belonging to one Retell call.
  ==========================================================
*/

router.get("/result/:callId", async (req, res) => {

    try {

        const callId =
            req.params.callId;

        const db =
            await connectDB();

        const collection =
            db.collection("retell_calls");

        const record =
            await collection.findOne({

                call_id:
                    callId

            });

        if (!record) {

            return res.status(404).json({

                success: false,

                error:
                    "RETELL_CALL_NOT_FOUND"

            });
        }

        return res.status(200).json({

            success: true,

            data:
                record

        });

    } catch (error) {

        console.error(
            "Retell result lookup error:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "RETELL_RESULT_LOOKUP_ERROR",

            message:
                error.message

        });
    }

});


module.exports = router;