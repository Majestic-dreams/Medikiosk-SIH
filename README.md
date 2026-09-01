# 🏥 Medikiosk-SIH Backend

Backend API for **Medikiosk**, developed as part of our **Smart India Hackathon (SIH) 2026** project.

Medikiosk is designed to reduce the friction between patients and healthcare providers by providing a structured patient-intake and consultation-routing system. The backend handles patient consultation data, symptom-based routing, doctor information, appointment availability, and appointment booking.

> **Important:** Medikiosk is designed to assist with healthcare navigation and routing. It does not provide medical diagnoses or replace professional medical advice.

---

## 🚀 Project Overview

Patients often struggle to determine which healthcare professional or department they should consult for their symptoms.

Medikiosk aims to simplify this process through a structured workflow:

**Patient → Symptom Collection → Clarification → Consultation Routing → Doctor Selection → Appointment Booking**

The backend acts as the central API and data layer connecting the patient-facing system, AI-assisted workflow, doctor information, and MongoDB database.

---

## ✨ Core Features

- Structured patient consultation creation
- Patient information management
- Symptom and health-concern processing
- Follow-up clarification support
- Consultation routing
- AYUSH doctor discovery
- Doctor information management
- Appointment availability checking
- Appointment booking
- Patient consultation summaries
- MongoDB database integration
- REST API architecture
- CORS-enabled frontend integration
- Environment-based configuration

---

## 🧠 System Workflow

```text
Patient
   │
   ▼
Patient Information
   │
   ▼
Health Concern / Symptoms
   │
   ▼
Clarification Questions
   │
   ▼
Consultation Routing
   │
   ▼
Relevant Doctor Search
   │
   ▼
Appointment Availability
   │
   ▼
Appointment Booking
   │
   ▼
Consultation Data Stored in MongoDB
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| MongoDB Node.js Driver | Database communication |
| Mongoose | MongoDB object modelling |
| dotenv | Environment variable management |
| CORS | Frontend-backend communication |
| JavaScript | Backend development |

---

## 📁 Project Structure

```text
backend/
│
├── config/
│   └── mongodb.js
│
├── constants/
│   └── consultationStatus.js
│
├── data/
│   ├── doctors.json
│   ├── symptoms.json
│   └── symptoms_clean.json
│
├── models/
│   ├── appointmentModel.js
│   ├── consultation.js
│   ├── doctorModel.js
│   ├── patientModel.js
│   └── patientSummary.js
│
├── routes/
│   ├── appointmentRoutes.js
│   ├── consultationRoutes.js
│   ├── doctorRoutes.js
│   ├── documentRoutes.js
│   ├── patientRoutes.js
│   ├── retellWebhookRoutes.js
│   └── routingRoutes.js
│
├── services/
│   ├── appointmentService.js
│   ├── consultationService.js
│   ├── datasetService.js
│   ├── doctorService.js
│   └── routingService.js
│
├── utils/
│   ├── consultationId.js
│   ├── dataLoader.js
│   ├── patientNormalizer.js
│   └── patientValidator.js
│
├── server.js
├── package.json
├── package-lock.json
└── .gitignore
```

---

## 🔌 API Endpoints

### Health & Testing

```http
GET /test
GET /api/health
```

Used to verify that the backend server and API are running correctly.

### Consultation Routing

```http
POST /api/routing/route
```

Processes structured patient information and symptoms for consultation routing.

### Consultations

Create a consultation:

```http
POST /api/consultations
```

Retrieve a consultation:

```http
GET /api/consultations/:consultationId
```

Submit additional clarification information:

```http
POST /api/consultations/:consultationId/clarification
```

### Doctors

```http
GET /api/doctors
```

Returns doctor information available through the backend.

### Appointment Availability

```http
GET /api/appointments/available/:doctorId
```

Checks available appointment slots for a selected doctor.

### Appointment Booking

```http
POST /api/appointments/book
```

Books an appointment using the provided patient, doctor, and appointment information.

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Majestic-dreams/Medikiosk-SIH.git
```

Move into the project directory:

```bash
cd Medikiosk-SIH
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

Example:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=medconnect
```

> Never commit your real `.env` file, database password, API keys, or other credentials to GitHub.

The `.env` file is intentionally excluded through `.gitignore`.

### 4. Start the backend

Using the current project configuration:

```bash
node server.js
```

The backend runs by default at:

```text
http://localhost:3000
```

Test the server using:

```text
http://localhost:3000/api/health
```

---

## 🗄️ Database

The project uses **MongoDB** for persistent data storage.

The backend maintains data related to areas such as:

- Patient information
- Consultations
- Doctors
- Appointments
- Patient summaries
- Consultation status

Database credentials are supplied using environment variables and are not stored in the public repository.

---

## 🔐 Security

Sensitive information should never be committed to this repository.

The following are excluded from version control:

```text
.env
node_modules/
```

Developers working on the project should maintain their own local environment configuration.

---

## 🧪 Development & Testing

The repository contains development/testing scripts for verifying individual backend components, including:

```text
testAppointments.js
testClarification.js
testConsultation.js
testData.js
testDoctors.js
testGetConsultation.js
testMongo.js
testRouting.js
```

These scripts assist in testing database connectivity, routing, consultation handling, doctor retrieval, and appointment functionality during development.

---

## 🎯 Project Objective

Medikiosk focuses on reducing friction in the journey between:

```text
"I have these symptoms"
        ↓
"Where should I seek care?"
        ↓
"Which relevant doctor is available?"
        ↓
"How can I book an appointment?"
```

Rather than functioning as a diagnostic system, the platform focuses on **structured healthcare navigation, consultation routing, and appointment coordination**.

---

## 🏆 Smart India Hackathon 2026

This project is being developed for **Smart India Hackathon 2026**.

The system is currently under active development, and features, APIs, datasets, and integrations may evolve as the project progresses.

---

## 👥 Team

**MedNexus**

Developed as part of our SIH 2026 solution.

---

## 📌 Repository

GitHub Repository:

**Majestic-dreams / Medikiosk-SIH**

---

## ⚠️ Disclaimer

Medikiosk is a healthcare navigation and consultation-routing project.

It is **not intended to diagnose diseases, prescribe medication, or replace consultation with a qualified healthcare professional.**

For medical emergencies, users should contact appropriate emergency medical services.

---

## 📄 License

This project is currently developed for academic, prototype, and hackathon purposes.

Copyright © 2026 MedNexus.