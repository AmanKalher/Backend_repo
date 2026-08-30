import WebSocket from "ws";
import http from "http";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "http://localhost:4000/api";
const WS_BASE_URL = "ws://localhost:4000";

const pool = new pg.Pool({
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "aman26",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "medtech_db"
});

function postJson(url, data) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const postData = JSON.stringify(data);
        const req = http.request({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData)
            }
        }, (res) => {
            let body = "";
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on("error", reject);
        req.write(postData);
        req.end();
    });
}

async function runComprehensiveVerification() {
    console.log("=== STARTING FULL END-TO-END SHARING SYSTEM VERIFICATION ===\n");

    // 1. STEP 1: CREATE SHARING SESSION
    console.log("1. Testing POST /api/sharing/create...");
    const createRes = await postJson(`${BASE_URL}/sharing/create`, {
        doctor_name: "Dr. Rahul Sharma",
        doctor_hospital: "Apollo Clinic",
        doctor_specialization: "Cardiology"
    });

    if (createRes.status !== 200 || !createRes.data.success) {
        throw new Error("Failed to create sharing session: " + JSON.stringify(createRes));
    }

    const { room_id, doctor_token, patient_token, qr_data, expires_at } = createRes.data;
    console.log("   ✓ Room created:", room_id);
    console.log("   ✓ QR Data:", qr_data);
    console.log("   ✓ Doctor capability token:", doctor_token.substring(0, 10) + "...");
    console.log("   ✓ Patient token:", patient_token.substring(0, 10) + "...");
    console.log("   ✓ Expires at:", expires_at);

    // 2. STEP 2: VERIFY DB PERSISTENCE IN SHARING_SESSIONS
    console.log("\n2. Checking PostgreSQL database persistence for sharing session...");
    const dbSessionRes = await pool.query(`SELECT * FROM sharing_sessions WHERE room_id = $1`, [room_id]);
    if (dbSessionRes.rows.length === 0) {
        throw new Error("Sharing session not found in PostgreSQL database!");
    }
    console.log("   ✓ Confirmed session persisted in PostgreSQL table 'sharing_sessions'");
    console.log("   ✓ Doctor token hash stored securely:", dbSessionRes.rows[0].doctor_token_hash.substring(0, 16) + "...");

    // 3. STEP 3: DOCTOR WEBSOCKET CONNECTION
    console.log("\n3. Testing Doctor WebSocket connection...");
    const doctorWs = new WebSocket(`${WS_BASE_URL}/api/sharing/ws/${room_id}?role=doctor&token=${doctor_token}`);
    
    let doctorReceivedPatientJoined = false;
    let doctorReceivedPatientData = false;
    let doctorReceivedDiagnosisSaved = false;

    doctorWs.on("message", (msg) => {
        const parsed = JSON.parse(msg.toString());
        console.log("   [Doctor WS Received]:", parsed.type);
        if (parsed.type === "PATIENT_JOINED") doctorReceivedPatientJoined = true;
        if (parsed.type === "PATIENT_DATA") doctorReceivedPatientData = true;
        if (parsed.type === "DIAGNOSIS_SAVED") doctorReceivedDiagnosisSaved = true;
    });

    await new Promise((resolve) => doctorWs.on("open", resolve));
    console.log("   ✓ Doctor WebSocket connected & listening for room events");

    // 4. STEP 4: UNAUTHORIZED WEBSOCKET REJECTION
    console.log("\n4. Testing Unauthorized WebSocket connection rejection...");
    const fakeWs = new WebSocket(`${WS_BASE_URL}/api/sharing/ws/${room_id}?role=doctor&token=fake_invalid_token`);
    const closePromise = new Promise((resolve) => fakeWs.on("close", (code) => resolve(code)));
    const closeCode = await closePromise;
    console.log("   ✓ Fake WebSocket properly rejected with close code:", closeCode);

    // 5. STEP 5: PATIENT JOINS AND SENDS REAL MEDICAL RECORDS
    console.log("\n5. Testing Patient joining session via POST /api/sharing/join...");
    const patientData = {
        id: "PT-9088",
        fullName: "Ayushman Patient",
        age: 36,
        gender: "Male",
        bloodGroup: "B+",
        allergies: ["Penicillin", "Sulfa drugs"],
        chronicConditions: ["Hypertension", "Type 2 Diabetes"],
        currentMedications: [
            { name: "Metformin", dosage: "500mg", frequency: "Twice daily" },
            { name: "Amlodipine", dosage: "5mg", frequency: "Once daily" }
        ],
        pastMedicalHistory: ["Appendectomy (2018)"],
        vitals: { bp: "128/82", hr: "78", spo2: "98%", temp: "98.4°F" }
    };

    const joinRes = await postJson(`${BASE_URL}/sharing/join`, {
        room_id,
        patient_token,
        patient_data: patientData
    });

    if (joinRes.status !== 200 || !joinRes.data.success) {
        throw new Error("Patient join failed: " + JSON.stringify(joinRes));
    }
    console.log("   ✓ Patient joined room:", joinRes.data.room_id);
    console.log("   ✓ Doctor info returned to patient:", joinRes.data.doctor_name, "-", joinRes.data.doctor_hospital);

    // Wait for Doctor WS event
    await new Promise((r) => setTimeout(r, 400));
    if (!doctorReceivedPatientJoined || !doctorReceivedPatientData) {
        throw new Error("Doctor WebSocket did not receive PATIENT_JOINED or PATIENT_DATA!");
    }
    console.log("   ✓ Doctor WebSocket verified real-time receipt of PATIENT_JOINED and PATIENT_DATA");

    // 6. STEP 6: PATIENT WEBSOCKET CONNECTION
    console.log("\n6. Testing Patient WebSocket connection...");
    const patientWs = new WebSocket(`${WS_BASE_URL}/api/sharing/ws/${room_id}?role=patient&token=${patient_token}`);
    let patientReceivedDiagnosisSaved = false;

    patientWs.on("message", (msg) => {
        const parsed = JSON.parse(msg.toString());
        console.log("   [Patient WS Received]:", parsed.type);
        if (parsed.type === "DIAGNOSIS_SAVED") patientReceivedDiagnosisSaved = true;
    });

    await new Promise((resolve) => patientWs.on("open", resolve));
    console.log("   ✓ Patient WebSocket connected & listening for diagnosis events");

    // 7. STEP 7: DOCTOR SAVES DIAGNOSIS & PRESCRIPTION
    console.log("\n7. Testing Doctor saving diagnosis via POST /api/sharing/diagnosis...");
    const diagPayload = {
        room_id,
        doctor_token,
        diagnosis: "Essential Hypertension with Type 2 Diabetes Mellitus",
        symptoms: ["Mild headache", "Occasional fatigue"],
        medicines: [
            {
                name: "Telmisartan",
                dosage: "40mg",
                frequency: "1-0-0",
                duration: "30 Days",
                route: "Oral",
                instructions: "After breakfast"
            },
            {
                name: "Metformin SR",
                dosage: "500mg",
                frequency: "1-0-1",
                duration: "30 Days",
                route: "Oral",
                instructions: "With meals"
            }
        ],
        clinical_notes: "Advised low sodium diet, 30 min daily brisk walking. Check HbA1c in 3 months.",
        follow_up: "4 Weeks"
    };

    const diagRes = await postJson(`${BASE_URL}/sharing/diagnosis`, diagPayload);
    if (diagRes.status !== 200 || !diagRes.data.success) {
        throw new Error("Failed to save diagnosis: " + JSON.stringify(diagRes));
    }
    console.log("   ✓ Diagnosis saved:", diagRes.data.diagnosis.diagnosis);

    // Wait for WS propagation
    await new Promise((r) => setTimeout(r, 400));

    if (!doctorReceivedDiagnosisSaved || !patientReceivedDiagnosisSaved) {
        throw new Error("DIAGNOSIS_SAVED was not delivered to both Doctor and Patient WebSockets!");
    }
    console.log("   ✓ Confirmed DIAGNOSIS_SAVED delivered to both Doctor and Patient WebSockets");

    // 8. STEP 8: VERIFY DIAGNOSIS IN POSTGRESQL TABLE DIAGNOSIS_REPORTS
    console.log("\n8. Checking PostgreSQL database persistence for diagnosis report...");
    const dbDiagRes = await pool.query(`SELECT * FROM diagnosis_reports WHERE room_id = $1`, [room_id]);
    if (dbDiagRes.rows.length === 0) {
        throw new Error("Diagnosis report not persisted in PostgreSQL table 'diagnosis_reports'!");
    }
    console.log("   ✓ Confirmed diagnosis persisted in table 'diagnosis_reports'");
    console.log("   ✓ Persisted Diagnosis:", dbDiagRes.rows[0].diagnosis);
    console.log("   ✓ Persisted Medicines JSON:", dbDiagRes.rows[0].medicines);

    // Clean up
    doctorWs.close();
    patientWs.close();
    await pool.end();

    console.log("\n=== ALL 8 END-TO-END VERIFICATION CHECKS PASSED 100% ===");
    process.exit(0);
}

runComprehensiveVerification().catch((err) => {
    console.error("\n❌ VERIFICATION TEST FAILED:", err);
    process.exit(1);
});
