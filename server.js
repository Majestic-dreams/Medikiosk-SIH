require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/mongodb");
const {
    initializeDatasetService
} = require("./services/datasetService");

const {
    initializeDoctorService
} = require("./services/doctorService");
const appointmentRoutes =
    require("./routes/appointmentRoutes");
const retellWebhookRoutes = require("./routes/retellWebhookRoutes");
const documentRoutes =
  require("./routes/documentRoutes");
const patientRoutes =
    require("./routes/patientRoutes");
// ============================================================
// APP INITIALIZATION
// ============================================================

const app = express();

const PORT = process.env.PORT || 3000;

// ============================================================
// ROUTES
// ============================================================

const routingRoutes = require("./routes/routingRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const doctorRoutes = require("./routes/doctorRoutes");

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json());
app.use(
    "/api/patients",
    patientRoutes
);
app.use(
    "/api/appointments",
    appointmentRoutes
);
app.use("/api/retell", retellWebhookRoutes);
// ============================================================
// BASIC TEST ROUTE
// ============================================================

app.get("/test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server test route works"
    });
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "MedConnect Backend",
        status: "healthy"
    });
});

// ============================================================
// ROUTING API
// ============================================================

app.use(
    "/api/routing",
    routingRoutes
);

// ============================================================
// CONSULTATION API
// ============================================================

app.use(
    "/api/consultations",
    consultationRoutes
);

app.use(
  "/api/documents",
  documentRoutes
);

// ============================================================
// DOCTOR API
// ============================================================

app.use(
    "/api/doctors",
    doctorRoutes
);
// ============================================================
// RETELL AI WEB CALL
// ============================================================

app.get("/api/retell/config", (req, res) => {
    const agentId = process.env.RETELL_AGENT_ID;

    res.json({
        success: true,
        isConfigured: Boolean(
            process.env.RETELL_API_KEY &&
            process.env.RETELL_API_KEY !== "MY_RETELL_API_KEY"
        ),
        agentId: agentId || ""
    });
});

app.post("/api/retell/create-web-call", async (req, res) => {
    try {
        const apiKey = process.env.RETELL_API_KEY;
        const agentId = process.env.RETELL_AGENT_ID;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: "RETELL_API_KEY_NOT_CONFIGURED"
            });
        }

        if (!agentId) {
            return res.status(500).json({
                success: false,
                error: "RETELL_AGENT_ID_NOT_CONFIGURED"
            });
        }

        const {
            patientName,
            language
        } = req.body || {};

        const response = await fetch(
            "https://api.retellai.com/v2/create-web-call",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    agent_id: agentId,

                    metadata: {
                        patient_name: patientName || null,
                        language: language || "en",
                        app: "MedConnect"
                    },

                    retell_llm_dynamic_variables: {
                        patient_name: patientName || "",
                        preferred_language: language || "en"
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: "Retell API returned an error.",
                details: data
            });
        }

        return res.status(200).json({
            success: true,
            ...data
        });

    } catch (error) {
        console.error(
            "Create Retell web call error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "RETELL_CREATE_WEB_CALL_ERROR",
            message: error.message
        });
    }
});
// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found",
        path: req.originalUrl
    });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
    console.error("Unhandled server error:");
    console.error(err);

    res.status(500).json({
        success: false,
        error: "Internal server error",
        message: err.message
    });
});

// ============================================================
// START SERVER
// ============================================================

async function startServer() {
    try {

        console.log("=================================");
        console.log("STARTING MEDCONNECT BACKEND");
        console.log("=================================");

        // Connect MongoDB first
        await connectDB();
        console.log("MongoDB connected successfully.");
        // Load routing and doctor data exclusively from MongoDB
        await initializeDatasetService();
        await initializeDoctorService();

        // Start Express server
        app.listen(PORT, () => {

            console.log("");
            console.log("=================================");
            console.log("MEDCONNECT BACKEND RUNNING");
            console.log("=================================");

            console.log(`Server: http://localhost:${PORT}`);

            console.log("");
            console.log("Available APIs:");
            console.log(`GET  http://localhost:${PORT}/test`);
            console.log(`GET  http://localhost:${PORT}/api/health`);
            console.log(`POST http://localhost:${PORT}/api/routing/route`);
            console.log(`POST http://localhost:${PORT}/api/consultations`);
            console.log(`GET  http://localhost:${PORT}/api/consultations/:consultationId`);
            console.log(`POST http://localhost:${PORT}/api/consultations/:consultationId/clarification`);
            console.log(`GET  http://localhost:${PORT}/api/doctors`);
            console.log(`GET  http://localhost:${PORT}/api/appointments/available/:doctorId`);
            console.log(`POST http://localhost:${PORT}/api/appointments/book`);

            console.log("");
            console.log("Backend ready.");
            console.log("=================================");
        });

    } catch (error) {

        console.error("");
        console.error("=================================");
        console.error("SERVER STARTUP FAILED");
        console.error("=================================");

        console.error(error);

        process.exit(1);
    }
}

// ============================================================
// RUN SERVER
// ============================================================

startServer();

// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;
