import WebSocket from "ws";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "http://localhost:4000/api";
const WS_BASE_URL = "ws://localhost:4000";

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

async function runMultiRoomIsolationTest() {
    console.log("=== TESTING MULTI-ROOM WEBSOCKET & SESSION ISOLATION ===\n");

    // 1. Create Room A (Dr. Sharma)
    const roomARes = await postJson(`${BASE_URL}/sharing/create`, { doctor_name: "Dr. Sharma", doctor_hospital: "Clinic A" });
    const { room_id: roomAId, doctor_token: docAToken, patient_token: patAToken } = roomARes.data;

    // 2. Create Room B (Dr. Verma)
    const roomBRes = await postJson(`${BASE_URL}/sharing/create`, { doctor_name: "Dr. Verma", doctor_hospital: "Clinic B" });
    const { room_id: roomBId, doctor_token: docBToken, patient_token: patBToken } = roomBRes.data;

    console.log("✓ Created Room A:", roomAId);
    console.log("✓ Created Room B:", roomBId);

    // Connect Doctor A and Doctor B WebSockets
    const docAWs = new WebSocket(`${WS_BASE_URL}/api/sharing/ws/${roomAId}?role=doctor&token=${docAToken}`);
    const docBWs = new WebSocket(`${WS_BASE_URL}/api/sharing/ws/${roomBId}?role=doctor&token=${docBToken}`);

    let roomAMessages = [];
    let roomBMessages = [];

    docAWs.on("message", (msg) => roomAMessages.push(JSON.parse(msg.toString())));
    docBWs.on("message", (msg) => roomBMessages.push(JSON.parse(msg.toString())));

    await Promise.all([
        new Promise((r) => docAWs.on("open", r)),
        new Promise((r) => docBWs.on("open", r))
    ]);

    // Patient A joins Room A ONLY
    console.log("\nPatient A joining Room A...");
    await postJson(`${BASE_URL}/sharing/join`, {
        room_id: roomAId,
        patient_token: patAToken,
        patient_data: { name: "Patient A (Specific to Doctor A)" }
    });

    await new Promise((r) => setTimeout(r, 400));

    // Verify Room A received data and Room B received NOTHING
    const docAReceivedPatientA = roomAMessages.some((m) => m.type === "PATIENT_DATA" && m.data?.name === "Patient A (Specific to Doctor A)");
    const docBReceivedPatientA = roomBMessages.some((m) => m.type === "PATIENT_DATA" && m.data?.name === "Patient A (Specific to Doctor A)");

    if (!docAReceivedPatientA) {
        throw new Error("Doctor A did not receive Patient A data!");
    }
    if (docBReceivedPatientA) {
        throw new Error("SECURITY VIOLATION: Doctor B received Patient A data!");
    }
    console.log("✓ Room A received Patient A data");
    console.log("✓ Room B received 0 messages from Room A (100% Isolated)");

    // Doctor B saves diagnosis in Room B
    console.log("\nDoctor B saving diagnosis in Room B...");
    await postJson(`${BASE_URL}/sharing/diagnosis`, {
        room_id: roomBId,
        doctor_token: docBToken,
        diagnosis: "Room B Specific Diagnosis"
    });

    await new Promise((r) => setTimeout(r, 400));

    const docBReceivedDiag = roomBMessages.some((m) => m.type === "DIAGNOSIS_SAVED" && m.diagnosis?.diagnosis === "Room B Specific Diagnosis");
    const docAReceivedDiag = roomAMessages.some((m) => m.type === "DIAGNOSIS_SAVED" && m.diagnosis?.diagnosis === "Room B Specific Diagnosis");

    if (!docBReceivedDiag) {
        throw new Error("Doctor B did not receive Room B diagnosis!");
    }
    if (docAReceivedDiag) {
        throw new Error("SECURITY VIOLATION: Doctor A received Room B diagnosis!");
    }
    console.log("✓ Doctor B received Room B diagnosis");
    console.log("✓ Doctor A received 0 cross-room diagnosis broadcasts (100% Isolated)");

    docAWs.close();
    docBWs.close();

    console.log("\n=== MULTI-ROOM ISOLATION TEST PASSED 100% ===");
    process.exit(0);
}

runMultiRoomIsolationTest().catch((err) => {
    console.error("\n❌ ISOLATION TEST FAILED:", err);
    process.exit(1);
});
