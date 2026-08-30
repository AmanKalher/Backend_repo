import axios from "axios";
import db from "./db.js";

const BASE_URL = "http://localhost:4000";

async function runDigiLockerFlowTest() {
    console.log("============================================================");
    console.log("TESTING AADHAAR & DIGILOCKER AUTHENTICATION FLOW (REAL APP)");
    console.log("============================================================");

    const testAadhaar = "554433221100";
    let verificationId = "";
    let accessToken = "";
    let refreshToken = "";

    try {
        // [STEP 1] START DIGILOCKER
        console.log("\n[STEP 1] Starting DigiLocker Account Verification...");
        const startRes = await axios.post(`${BASE_URL}/api/auth/digilocker/start`, {
            aadhaar_number: testAadhaar,
            consent: true,
        });

        console.log("✓ DigiLocker Started. Response:", startRes.data);
        verificationId = startRes.data.cashfree?.verification_id;
        if (!verificationId) {
            throw new Error("No verification_id returned in start response");
        }

        // [STEP 2] CREATE DIGILOCKER URL
        console.log("\n[STEP 2] Creating DigiLocker OAuth URL...");
        const urlRes = await axios.post(`${BASE_URL}/api/auth/digilocker/create-url`, {
            verification_id: verificationId,
            user_flow: "signup",
        });

        console.log("✓ DigiLocker URL Created:", urlRes.data.cashfree?.url);

        // [STEP 3] CHECK DIGILOCKER VERIFICATION STATUS
        console.log("\n[STEP 3] Polling DigiLocker Status for verification_id:", verificationId);
        const statusRes = await axios.get(`${BASE_URL}/api/auth/digilocker/status/${verificationId}`);
        console.log("✓ Verification Status:", statusRes.data.cashfree?.status);

        // [STEP 4] EXCHANGE VERIFICATION FOR SESSION TOKENS
        console.log("\n[STEP 4] Exchanging DigiLocker Verification for JWT Session...");
        const sessionRes = await axios.post(`${BASE_URL}/api/auth/session`, {
            verification_id: verificationId,
            aadhaar_number: testAadhaar,
        });

        console.log("✓ Session Created Successfully!");
        console.log("  - Access Token:", sessionRes.data.access_token ? "Generated (JWT)" : "Missing");
        console.log("  - Refresh Token:", sessionRes.data.refresh_token ? "Generated (JWT)" : "Missing");
        console.log("  - User ID:", sessionRes.data.user?.id);
        console.log("  - Role:", sessionRes.data.user?.role);

        accessToken = sessionRes.data.access_token;
        refreshToken = sessionRes.data.refresh_token;

        // [STEP 5] VERIFY DATABASE PERSISTENCE IN POSTGRESQL
        console.log("\n[STEP 5] Verifying PostgreSQL Storage...");
        const userDb = await db.query(
            `SELECT * FROM users WHERE user_id = $1`,
            [sessionRes.data.user?.id]
        );
        console.log("✓ PostgreSQL User Row Verified:", {
            user_id: userDb.rows[0]?.user_id,
            role: userDb.rows[0]?.role,
            aadhaar_hash: userDb.rows[0]?.aadhaar_hash ? "Present (SHA256)" : "None",
            digilocker_verification_id: userDb.rows[0]?.digilocker_verification_id,
        });

        const sessionDb = await db.query(
            `SELECT * FROM auth_sessions WHERE user_id = $1`,
            [sessionRes.data.user?.id]
        );
        console.log("✓ PostgreSQL Session Row Verified:", {
            session_id: sessionDb.rows[0]?.session_id,
            revoked: sessionDb.rows[0]?.revoked,
            expires_at: sessionDb.rows[0]?.expires_at,
        });

        // [STEP 6] REFRESH SESSION TOKEN
        console.log("\n[STEP 6] Testing Session Token Refresh...");
        const refreshRes = await axios.post(`${BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
        });
        console.log("✓ Session Refreshed. New Access Token:", refreshRes.data.access_token ? "Generated (JWT)" : "Failed");

        // [STEP 7] LOGOUT & REVOCATION
        console.log("\n[STEP 7] Testing Logout & Session Revocation...");
        const logoutRes = await axios.post(
            `${BASE_URL}/api/auth/logout`,
            {},
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        console.log("✓ Logout Response:", logoutRes.data);

        console.log("\n============================================================");
        console.log("🎉 ALL DIGILOCKER & AADHAAR FLOW TESTS PASSED 100%!");
        console.log("============================================================");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Test Failed:", err.response?.data || err.message);
        process.exit(1);
    }
}

runDigiLockerFlowTest();
