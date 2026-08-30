import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID || "";
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET || "";
const CASHFREE_MODE = (process.env.CASHFREE_MODE || "sandbox").toLowerCase();

const isTestKey = CASHFREE_CLIENT_SECRET.startsWith("cfsk_ma_test_");
const isProduction =
    !isTestKey && (
        process.env.CASHFREE_ENV === "production" ||
        CASHFREE_MODE === "production" ||
        CASHFREE_CLIENT_SECRET.startsWith("cfsk_ma_prod_")
    );

const CASHFREE_BASE_URL =
    process.env.CASHFREE_BASE_URL ||
    (isProduction
        ? "https://api.cashfree.com/verification"
        : "https://sandbox.cashfree.com/verification");

const isConfigured = Boolean(
    CASHFREE_CLIENT_ID &&
    CASHFREE_CLIENT_SECRET &&
    CASHFREE_MODE !== "simulation"
);

// In-memory store for simulation mode
const simulatedVerifications = new Map();

class CashfreeService {
    constructor() {
        this.headers = {
            "Content-Type": "application/json",
            "x-client-id": CASHFREE_CLIENT_ID,
            "x-client-secret": CASHFREE_CLIENT_SECRET,
        };
    }

    // =========================================================
    // 1. VERIFY DIGILOCKER ACCOUNT (START FLOW)
    // =========================================================
    async verifyDigiLockerAccount(aadhaarNumber) {
        const verificationId = `DGNT-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
        const cleanAadhaar = String(aadhaarNumber).replace(/\s/g, "").trim();

        if (!isConfigured) {
            console.log("=========================================");
            console.log("CASHFREE DIGILOCKER START (SIMULATION)");
            console.log("Verification ID:", verificationId);
            console.log("Aadhaar:", cleanAadhaar.replace(/(\d{4})(\d{4})(\d{4})/, "XXXX XXXX $3"));
            console.log("=========================================");

            const simData = {
                verification_id: verificationId,
                status: "INITIATED",
                user_flow: "signup",
                aadhaar_number: cleanAadhaar,
                created_at: new Date().toISOString(),
            };
            simulatedVerifications.set(verificationId, simData);

            return {
                http_status: 200,
                data: {
                    verification_id: verificationId,
                    status: "INITIATED",
                    user_flow: "signup",
                    message: "DigiLocker verification initiated successfully (Simulation)",
                },
            };
        }

        try {
            const url = `${CASHFREE_BASE_URL}/digilocker/verify-account`;
            const payload = {
                verification_id: verificationId,
                aadhaar_number: cleanAadhaar,
            };

            const response = await axios.post(url, payload, {
                headers: this.headers,
                timeout: 30000,
            });

            return {
                http_status: response.status,
                data: response.data,
            };
        } catch (error) {
            console.error("Cashfree verify account error:", error.response?.data || error.message);
            return {
                http_status: error.response?.status || 500,
                data: error.response?.data || { message: error.message },
            };
        }
    }

    // =========================================================
    // 2. CREATE DIGILOCKER URL
    // =========================================================
    async createDigiLockerUrl(verificationId, userFlow = "signin", redirectUrl = null) {
        const localCallback =
            redirectUrl ||
            process.env.DIGILOCKER_REDIRECT_URL ||
            `${process.env.FRONTEND_ORIGIN || "http://localhost:5173"}/auth/digilocker/callback`;

        if (!isConfigured) {
            console.log("=========================================");
            console.log("CASHFREE CREATE DIGILOCKER URL (SIMULATION)");
            console.log("Verification ID:", verificationId);
            console.log("User Flow:", userFlow);
            console.log("=========================================");

            const simUrl = `${localCallback}?verification_id=${encodeURIComponent(verificationId)}&status=AUTHENTICATED`;

            const simRecord = simulatedVerifications.get(verificationId) || {
                verification_id: verificationId,
                status: "INITIATED",
                user_flow: userFlow,
            };
            simRecord.status = "AUTHENTICATED";
            simRecord.authenticated_at = new Date().toISOString();
            simulatedVerifications.set(verificationId, simRecord);

            return {
                http_status: 200,
                data: {
                    verification_id: verificationId,
                    url: simUrl,
                    status: "AUTHENTICATED",
                    user_flow: userFlow,
                    message: "DigiLocker URL generated successfully (Simulation)",
                },
            };
        }

        let callbackUrl = localCallback;
        // Cashfree strictly mandates HTTPS for redirect_url in production/sandbox API calls
        if (!callbackUrl.startsWith("https://")) {
            callbackUrl = process.env.DIGILOCKER_REDIRECT_URL || "https://digilocker.cashfree.com/verification/digilocker/callback";
        }

        try {
            const url = `${CASHFREE_BASE_URL}/digilocker`;
            const payload = {
                verification_id: verificationId,
                document_requested: ["AADHAAR"],
                redirect_url: callbackUrl,
                user_flow: userFlow,
            };

            const response = await axios.post(url, payload, {
                headers: this.headers,
                timeout: 30000,
            });

            return {
                http_status: response.status,
                data: response.data,
            };
        } catch (error) {
            console.error("Cashfree create URL error:", error.response?.data || error.message);
            return {
                http_status: error.response?.status || 500,
                data: error.response?.data || { message: error.message },
            };
        }
    }

    // =========================================================
    // 3. GET DIGILOCKER VERIFICATION STATUS
    // =========================================================
    async getDigiLockerStatus(verificationId) {
        if (!isConfigured) {
            const simRecord = simulatedVerifications.get(verificationId);
            const status = simRecord ? simRecord.status : "AUTHENTICATED";

            return {
                http_status: 200,
                data: {
                    verification_id: verificationId,
                    status: status,
                    document_type: "AADHAAR",
                    name: "Dr. Rahul Sharma",
                    dob: "1990-05-14",
                    gender: "MALE",
                    address: "New Delhi, India",
                    valid: true,
                    reference_id: `REF_${Date.now()}`,
                },
            };
        }

        try {
            const url = `${CASHFREE_BASE_URL}/digilocker`;
            const response = await axios.get(url, {
                headers: this.headers,
                params: { verification_id: verificationId },
                timeout: 30000,
            });

            return {
                http_status: response.status,
                data: response.data,
            };
        } catch (error) {
            console.error("Cashfree get status error:", error.response?.data || error.message);
            return {
                http_status: error.response?.status || 500,
                data: error.response?.data || { message: error.message },
            };
        }
    }
}

export const cashfreeService = new CashfreeService();
export default cashfreeService;
