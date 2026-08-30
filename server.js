/* ============================================================
 * [ARCHIVED / DEPRECATED]
 * server.js has been commented out because first.js is the
 * active, updated server entrypoint.
 * ============================================================
import { createRequire } from "module";
import db from "./db.js";

const require = createRequire(import.meta.url);
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

app.use(express.json());
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

// Ensure uploads/certificates directory exists
const uploadDir = path.join(process.cwd(), "uploads", "certificates");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for doctor medical certificates / degrees
const certificateStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `cert_${uniqueSuffix}${ext}`);
    }
});

const uploadCertificate = multer({
    storage: certificateStorage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
    fileFilter: (req, file, cb) => {
        const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF, PNG, JPG, JPEG, and WebP files are allowed for certificates"));
        }
    }
});

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "diagnect_secret_key_2026";


// ============================================================
// HELPER: AUDIT LOGGER
// ============================================================
async function logAuditEvent({ actorUserId, patientId, doctorId, accessId, sessionId, action, resourceType, resourceId, description }) {
    try {
        await db.query(
            `INSERT INTO audit_logs (
                actor_user_id, patient_id, doctor_id, access_id, session_id,
                action, resource_type, resource_id, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [actorUserId || null, patientId || null, doctorId || null, accessId || null, sessionId || null, action, resourceType || null, resourceId || null, description || null]
        );
    } catch (err) {
        console.error("Audit log error:", err.message);
    }
}


// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Access token required" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Invalid token format" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

const axios = require("axios");

const CASHFREE_CLIENT_ID = (process.env.CASHFREE_CLIENT_ID || "").trim();
const CASHFREE_CLIENT_SECRET = (process.env.CASHFREE_CLIENT_SECRET || "").trim();
const CASHFREE_MODE = (process.env.CASHFREE_MODE || "").trim().toLowerCase();

const CASHFREE_BASE_URL =
    process.env.CASHFREE_ENV === "production"
        ? "https://api.cashfree.com/verification"
        : "https://sandbox.cashfree.com/verification";

const isCashfreeConfigured =
    CASHFREE_MODE !== "simulation" &&
    Boolean(CASHFREE_CLIENT_ID) &&
    CASHFREE_CLIENT_ID !== "PASTE_YOUR_CLIENT_ID_HERE" &&
    Boolean(CASHFREE_CLIENT_SECRET) &&
    CASHFREE_CLIENT_SECRET !== "PASTE_YOUR_CLIENT_SECRET_HERE";

if (!isCashfreeConfigured) {
    console.log("ℹ️  Cashfree running in SIMULATION/DEV mode (Test OTP: 123456)");
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role.toUpperCase())) {
            return res.status(403).json({ message: "Access forbidden: insufficient permissions" });
        }
        next();
    };
}


// ============================================================
// AADHAAR OTP (CASHFREE + DEV SIMULATION FALLBACK)
// ============================================================

app.post(["/send-otp", "/api/send-otp"], async (req, res) => {
    try {
        const { aadhaarNumber } = req.body;

        if (!aadhaarNumber) {
            return res.status(400).json({
                success: false,
                message: "Aadhaar number is required"
            });
        }

        const cleanAadhaar = String(aadhaarNumber).replace(/\s/g, "");

        if (!/^\d{12}$/.test(cleanAadhaar)) {
            return res.status(400).json({
                success: false,
                message: "Aadhaar number must contain exactly 12 digits"
            });
        }

        if (!isCashfreeConfigured) {
            const simulatedRefId = `sim_aadhaar_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
            console.log("=================================");
            console.log("AADHAAR OTP (SIMULATION MODE)");
            console.log("Aadhaar Number:", cleanAadhaar);
            console.log("Simulated Ref ID:", simulatedRefId);
            console.log("Test OTP: 123456");
            console.log("=================================");

            return res.status(200).json({
                success: true,
                message: "OTP sent successfully to Aadhaar-linked mobile number (Dev Mode: Use OTP 123456)",
                refId: simulatedRefId,
                devOtp: "123456",
                simulated: true
            });
        }

        const verificationId = `aadhaar_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
        const response = await axios.post(
            `${CASHFREE_BASE_URL}/offline-aadhaar/otp`,
            { aadhaar_number: cleanAadhaar },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": CASHFREE_CLIENT_ID,
                    "x-client-secret": CASHFREE_CLIENT_SECRET
                }
            }
        );

        const data = response.data;
        const refId = data.ref_id || data.reference_id;

        if (!refId) {
            return res.status(500).json({
                success: false,
                message: "Cashfree did not return a verification reference ID",
                data
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully to Aadhaar-linked mobile number",
            refId,
            verificationId
        });
    } catch (error) {
        const errData = error.response?.data;
        console.error("Cashfree Send OTP Error:", errData || error.message);

        let userMsg = errData?.message || "Failed to send Aadhaar OTP";
        if (errData?.code === "ip_validation_failed") {
            userMsg = `Cashfree IP Error: IP not whitelisted. Please whitelist your IP in Cashfree Dashboard -> Developers -> IP Whitelisting, or set CASHFREE_MODE=simulation in .env to test without live Cashfree SMS (OTP: 123456).`;
        } else if (errData?.type === "authentication_error" || error.response?.status === 401) {
            userMsg = `Cashfree Auth Error: Invalid Client ID / Secret combination for ${process.env.CASHFREE_ENV || 'sandbox'}. Please check your Verification API keys or set CASHFREE_MODE=simulation in .env to use dev mode (OTP: 123456).`;
        } else if (errData?.code === "verification_failed") {
            userMsg = `Cashfree Sandbox Notice: In Cashfree Sandbox/Test mode, real Aadhaar SMS is not sent to real phones by UIDAI. For development, set CASHFREE_MODE=simulation in .env (use OTP 123456), or use live production keys (CASHFREE_ENV=production).`;
        }

        return res.status(error.response?.status || 500).json({
            success: false,
            message: userMsg,
            error: errData || error.message
        });
    }
});

app.post(["/verify-otp", "/api/verify-otp"], async (req, res) => {
    try {
        const { otp, refId } = req.body;

        if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });
        if (!refId) return res.status(400).json({ success: false, message: "Verification reference ID is required" });
        if (!/^\d{6}$/.test(String(otp))) return res.status(400).json({ success: false, message: "OTP must contain 6 digits" });

        if (String(refId).startsWith("sim_aadhaar_") || !isCashfreeConfigured) {
            if (String(otp) === "123456" || /^\d{6}$/.test(String(otp))) {
                return res.status(200).json({
                    success: true,
                    verified: true,
                    message: "Aadhaar verified successfully",
                    verification: {
                        refId,
                        status: "VALID",
                        name: "Verified Doctor",
                        gender: "MALE",
                        simulated: true
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    verified: false,
                    message: "Invalid OTP. In dev mode, please use 123456."
                });
            }
        }

        const response = await axios.post(
            `${CASHFREE_BASE_URL}/offline-aadhaar/verify`,
            {
                otp: String(otp),
                ref_id: String(refId)
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": CASHFREE_CLIENT_ID,
                    "x-client-secret": CASHFREE_CLIENT_SECRET
                }
            }
        );

        const data = response.data;
        if (data.status === "VALID") {
            return res.status(200).json({
                success: true,
                verified: true,
                message: "Aadhaar and DigiLocker verified successfully",
                verification: {
                    refId: data.ref_id,
                    status: data.status,
                    name: data.name,
                    gender: data.gender,
                    dob: data.dob,
                    yearOfBirth: data.year_of_birth,
                    digilockerVerified: true
                }
            });
        }

        return res.status(400).json({
            success: false,
            verified: false,
            message: data.message || "Aadhaar verification failed",
            status: data.status
        });
    } catch (error) {
        console.error("Cashfree Verify OTP Error:", error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            verified: false,
            message: error.response?.data?.message || "OTP verification failed",
            error: error.response?.data || error.message
        });
    }
});


// ============================================================
// DOCTOR MEDICAL CERTIFICATE UPLOAD
// ============================================================

app.post(["/upload/certificate", "/api/upload/certificate"], uploadCertificate.single("certificate"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No certificate file provided. Please select a PDF or image file."
            });
        }

        const fileUrl = `/uploads/certificates/${req.file.filename}`;
        console.log("Medical certificate uploaded:", req.file.filename, `(${req.file.size} bytes)`);

        return res.status(200).json({
            success: true,
            message: "Medical registration certificate uploaded successfully",
            filename: req.file.filename,
            originalName: req.file.originalname,
            fileUrl,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadDate: new Date().toISOString()
        });
    } catch (error) {
        console.error("Certificate upload error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload certificate"
        });
    }
});


// ============================================================
// 1. HOME & DB HEALTH CHECK
// ============================================================
app.get(["/", "/api"], (req, res) => {
    res.json({
        name: "DiagNect Med-Tech API",
        version: "1.0.0",
        status: "Running with PostgreSQL database",
        timestamp: new Date().toISOString()
    });
});

app.get(["/test-db", "/api/test-db"], async (req, res) => {
    try {
        const result = await db.query("SELECT NOW() AS current_time, current_database() AS db_name, version()");
        res.json({
            message: "Database connected successfully",
            details: result.rows[0]
        });
    } catch (error) {
        console.error("DB Connection Error:", error);
        res.status(500).json({ error: "Database connection failed", details: error.message });
    }
});


// ============================================================
// 2. USER REGISTRATION (PATIENT & DOCTOR)
// ============================================================

// Register Patient
app.post(["/register/patient", "/api/register/patient"], async (req, res) => {
    const { email, phone, password, firstName, lastName, dateOfBirth, gender, bloodGroup, abhaId } = req.body;

    if (!email && !phone) return res.status(400).json({ message: "Email or phone number is required" });
    if (!password || !firstName) return res.status(400).json({ message: "Password and first name are required" });

    const client = await db.getClient();
    try {
        await client.query("BEGIN");

        const passwordHash = await bcrypt.hash(password, 10);

        const userRes = await client.query(
            `INSERT INTO users (email, phone, password_hash, role)
             VALUES ($1, $2, $3, 'PATIENT')
             RETURNING user_id, email, phone, role, created_at`,
            [email || null, phone || null, passwordHash]
        );
        const user = userRes.rows[0];

        const patientRes = await client.query(
            `INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, blood_group, abha_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING patient_id, first_name, last_name, date_of_birth, gender, blood_group, abha_id`,
            [user.user_id, firstName, lastName || null, dateOfBirth || null, gender ? gender.toUpperCase() : null, bloodGroup || null, abhaId || null]
        );
        const patient = patientRes.rows[0];

        await client.query("COMMIT");

        const name = `${firstName} ${lastName || ""}`.trim();
        const token = jwt.sign(
            {
                userId: user.user_id,
                role: user.role,
                patientId: patient.patient_id,
                name: name || user.email
            },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.status(201).json({
            message: "Patient registered successfully",
            token,
            user: {
                id: user.user_id,
                role: user.role.toLowerCase(),
                patientId: patient.patient_id,
                name,
                email: user.email,
                phone: user.phone,
                ...patient
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "23505") return res.status(409).json({ message: "Email, phone, or ABHA ID already registered" });
        res.status(500).json({ message: "Failed to register patient", error: error.message });
    } finally {
        client.release();
    }
});

// Register Doctor
app.post(["/register/doctor", "/api/register/doctor"], async (req, res) => {
    const { email, phone, password, firstName, lastName, specialization, registrationNumber, registrationAuthority, hospitalId, certificateUrl, identityVerified, registrationVerified } = req.body;

    if (!email && !phone) return res.status(400).json({ message: "Email or phone number is required" });
    if (!password || !firstName || !registrationNumber) return res.status(400).json({ message: "Password, first name, and registration number are required" });

    const client = await db.getClient();
    try {
        await client.query("BEGIN");

        const passwordHash = await bcrypt.hash(password, 10);

        const userRes = await client.query(
            `INSERT INTO users (email, phone, password_hash, role)
             VALUES ($1, $2, $3, 'DOCTOR')
             RETURNING user_id, email, phone, role, created_at`,
            [email || null, phone || null, passwordHash]
        );
        const user = userRes.rows[0];

        const doctorRes = await client.query(
            `INSERT INTO doctors (
                user_id, first_name, last_name, specialization, registration_number,
                registration_authority, hospital_id, identity_verified, identity_verified_at,
                registration_verified, registration_verified_at
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, NOW())
             RETURNING doctor_id, first_name, last_name, specialization, registration_number, hospital_id, identity_verified, registration_verified`,
            [
                user.user_id,
                firstName,
                lastName || null,
                specialization || null,
                registrationNumber,
                registrationAuthority || null,
                hospitalId || null,
                identityVerified !== false,
                registrationVerified !== false
            ]
        );
        const doctor = doctorRes.rows[0];

        await client.query("COMMIT");

        const name = `${firstName} ${lastName || ""}`.trim();
        const token = jwt.sign(
            {
                userId: user.user_id,
                role: user.role,
                doctorId: doctor.doctor_id,
                hospitalId: doctor.hospital_id || null,
                name: name || user.email
            },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.status(201).json({
            message: "Doctor registered successfully",
            token,
            user: {
                id: user.user_id,
                role: user.role.toLowerCase(),
                doctorId: doctor.doctor_id,
                name,
                email: user.email,
                phone: user.phone,
                ...doctor
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "23505") return res.status(409).json({ message: "User or Medical Registration Number already registered" });
        res.status(500).json({ message: "Failed to register doctor", error: error.message });
    } finally {
        client.release();
    }
});


// ============================================================
// 3. AUTHENTICATION (LOGIN & PROFILE)
// ============================================================

app.post("/login", async (req, res) => {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
        return res.status(400).json({ message: "Email/Phone and password are required" });
    }

    try {
        const userQuery = await db.query(
            `SELECT u.user_id, u.email, u.phone, u.password_hash, u.role, u.is_active,
                    p.patient_id, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    d.doctor_id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
                    d.hospital_id
             FROM users u
             LEFT JOIN patients p ON u.user_id = p.user_id
             LEFT JOIN doctors d ON u.user_id = d.user_id
             WHERE (u.email = $1 OR u.phone = $2) AND u.is_active = TRUE`,
            [email || null, phone || null]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials or inactive account" });
        }

        const user = userQuery.rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const name = user.role === "PATIENT"
            ? `${user.patient_first_name || ""} ${user.patient_last_name || ""}`.trim()
            : `${user.doctor_first_name || ""} ${user.doctor_last_name || ""}`.trim();

        const token = jwt.sign(
            {
                userId: user.user_id,
                role: user.role,
                patientId: user.patient_id || null,
                doctorId: user.doctor_id || null,
                hospitalId: user.hospital_id || null,
                name: name || user.email
            },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.user_id,
                role: user.role.toLowerCase(),
                patientId: user.patient_id,
                doctorId: user.doctor_id,
                name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

app.get("/profile", authenticateToken, async (req, res) => {
    try {
        if (req.user.role === "PATIENT") {
            const patientRes = await db.query(
                `SELECT u.user_id, u.email, u.phone, u.role, u.created_at,
                        p.patient_id, p.first_name, p.last_name, p.date_of_birth, p.gender, p.blood_group, p.abha_id, p.abha_verified
                 FROM users u
                 JOIN patients p ON u.user_id = p.user_id
                 WHERE u.user_id = $1`,
                [req.user.userId]
            );

            if (patientRes.rows.length === 0) return res.status(404).json({ message: "Patient profile not found" });
            return res.json({ message: "Profile retrieved", user: patientRes.rows[0] });
        } else if (req.user.role === "DOCTOR") {
            const doctorRes = await db.query(
                `SELECT u.user_id, u.email, u.phone, u.role, u.created_at,
                        d.doctor_id, d.first_name, d.last_name, d.specialization, d.registration_number,
                        d.registration_authority, d.identity_verified, d.registration_verified,
                        h.hospital_name, h.city, h.address
                 FROM users u
                 JOIN doctors d ON u.user_id = d.user_id
                 LEFT JOIN hospitals h ON d.hospital_id = h.hospital_id
                 WHERE u.user_id = $1`,
                [req.user.userId]
            );

            if (doctorRes.rows.length === 0) return res.status(404).json({ message: "Doctor profile not found" });
            return res.json({ message: "Profile retrieved", user: doctorRes.rows[0] });
        }

        res.json({ message: "Profile retrieved", user: req.user });
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
});


// ============================================================
// 4. QR CODE & ACCESS CONSENT WORKFLOW
// ============================================================

// Step 1: Doctor generates a temporary QR code
app.post("/qr/generate", authenticateToken, authorizeRoles("DOCTOR"), async (req, res) => {
    try {
        const doctorId = req.user.doctorId;
        if (!doctorId) return res.status(400).json({ message: "Doctor record not linked" });

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresInMinutes = 15;

        const qrRes = await db.query(
            `INSERT INTO qr_access_requests (doctor_id, token_hash, expires_at, status)
             VALUES ($1, $2, NOW() + make_interval(mins => $3), 'ACTIVE')
             RETURNING qr_request_id, doctor_id, created_at, expires_at, status`,
            [doctorId, tokenHash, expiresInMinutes]
        );

        const docInfo = await db.query(
            `SELECT d.first_name, d.last_name, d.specialization, d.registration_number, h.hospital_name
             FROM doctors d
             LEFT JOIN hospitals h ON d.hospital_id = h.hospital_id
             WHERE d.doctor_id = $1`,
            [doctorId]
        );

        await logAuditEvent({
            actorUserId: req.user.userId,
            doctorId,
            action: "QR_GENERATED",
            resourceType: "qr_access_requests",
            resourceId: qrRes.rows[0].qr_request_id,
            description: "Doctor generated access QR token"
        });

        res.json({
            message: "QR code generated successfully",
            qrToken: rawToken,
            doctor: docInfo.rows[0],
            expiresIn: `${expiresInMinutes} minutes`,
            expiresAt: qrRes.rows[0].expires_at
        });
    } catch (error) {
        console.error("QR Generate error:", error);
        res.status(500).json({ message: "Failed to generate QR code", error: error.message });
    }
});

// Step 2: Patient scans QR & creates pending access request
app.post("/qr/scan", authenticateToken, authorizeRoles("PATIENT"), async (req, res) => {
    const { qrToken, purpose } = req.body;
    const patientId = req.user.patientId;

    if (!qrToken) return res.status(400).json({ message: "QR token is required" });

    try {
        const tokenHash = crypto.createHash("sha256").update(qrToken).digest("hex");

        const qrRes = await db.query(
            `SELECT qr_request_id, doctor_id, status, expires_at
             FROM qr_access_requests
             WHERE token_hash = $1 AND status = 'ACTIVE' AND expires_at > NOW()`,
            [tokenHash]
        );

        if (qrRes.rows.length === 0) return res.status(404).json({ message: "Invalid or expired QR token" });

        const qrRecord = qrRes.rows[0];

        const accessRes = await db.query(
            `INSERT INTO patient_doctor_access (patient_id, doctor_id, status, purpose)
             VALUES ($1, $2, 'PENDING', $3)
             RETURNING access_id, patient_id, doctor_id, status, requested_at`,
            [patientId, qrRecord.doctor_id, purpose || "QR Scan Consultation Access"]
        );

        const access = accessRes.rows[0];

        await db.query(
            `UPDATE qr_access_requests
             SET patient_id = $1, access_id = $2
             WHERE qr_request_id = $3`,
            [patientId, access.access_id, qrRecord.qr_request_id]
        );

        const doctorRes = await db.query(
            `SELECT d.doctor_id, d.first_name, d.last_name, d.specialization, h.hospital_name
             FROM doctors d
             LEFT JOIN hospitals h ON d.hospital_id = h.hospital_id
             WHERE d.doctor_id = $1`,
            [qrRecord.doctor_id]
        );

        await logAuditEvent({
            actorUserId: req.user.userId,
            patientId,
            doctorId: qrRecord.doctor_id,
            accessId: access.access_id,
            action: "QR_SCANNED"
        });

        res.json({
            message: "QR code scanned successfully. Please approve access.",
            accessId: access.access_id,
            doctor: doctorRes.rows[0],
            status: "PENDING"
        });
    } catch (error) {
        console.error("QR Scan error:", error);
        res.status(500).json({ message: "Failed to scan QR", error: error.message });
    }
});

// Step 3: Patient APPROVES access
app.post("/access/approve", authenticateToken, authorizeRoles("PATIENT"), async (req, res) => {
    const { accessId, durationMinutes = 60 } = req.body;
    const patientId = req.user.patientId;

    if (!accessId) return res.status(400).json({ message: "accessId is required" });

    const client = await db.getClient();
    try {
        await client.query("BEGIN");

        const accessRes = await client.query(
            `UPDATE patient_doctor_access
             SET status = 'APPROVED',
                 approved_at = NOW(),
                 expires_at = NOW() + make_interval(mins => $1),
                 updated_at = NOW()
             WHERE access_id = $2 AND patient_id = $3 AND status = 'PENDING'
             RETURNING access_id, patient_id, doctor_id, status, approved_at, expires_at`,
            [parseInt(durationMinutes, 10), accessId, patientId]
        );

        if (accessRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Pending access request not found" });
        }

        const access = accessRes.rows[0];

        await client.query(
            `UPDATE qr_access_requests SET status = 'USED', used_at = NOW() WHERE access_id = $1`,
            [accessId]
        );

        await client.query("COMMIT");

        await logAuditEvent({
            actorUserId: req.user.userId,
            patientId,
            doctorId: access.doctor_id,
            accessId: access.access_id,
            action: "ACCESS_APPROVED",
            description: `Access granted for ${durationMinutes} minutes`
        });

        res.json({ message: "Access approved successfully", access });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Approve access error:", error);
        res.status(500).json({ message: "Failed to approve access", error: error.message });
    } finally {
        client.release();
    }
});

// Step 3b: Patient DECLINES access
app.post("/access/decline", authenticateToken, authorizeRoles("PATIENT"), async (req, res) => {
    const { accessId } = req.body;
    const patientId = req.user.patientId;

    if (!accessId) return res.status(400).json({ message: "accessId is required" });

    try {
        const accessRes = await db.query(
            `UPDATE patient_doctor_access
             SET status = 'DECLINED', updated_at = NOW()
             WHERE access_id = $1 AND patient_id = $2 AND status = 'PENDING'
             RETURNING access_id, doctor_id`,
            [accessId, patientId]
        );

        if (accessRes.rows.length === 0) return res.status(404).json({ message: "Pending access request not found" });

        await db.query(`UPDATE qr_access_requests SET status = 'CANCELLED' WHERE access_id = $1`, [accessId]);

        await logAuditEvent({
            actorUserId: req.user.userId,
            patientId,
            doctorId: accessRes.rows[0].doctor_id,
            accessId,
            action: "ACCESS_DECLINED"
        });

        res.json({ message: "Access request declined" });
    } catch (error) {
        console.error("Decline access error:", error);
        res.status(500).json({ message: "Failed to decline access", error: error.message });
    }
});

// Verify QR session / Check Doctor Access
app.get("/verify-session/:token", authenticateToken, async (req, res) => {
    const rawToken = req.params.token;

    try {
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        const sessionRes = await db.query(
            `SELECT qr.qr_request_id, qr.doctor_id, qr.patient_id, qr.status AS qr_status, qr.expires_at AS qr_expires_at,
                    pda.access_id, pda.status AS access_status, pda.approved_at, pda.expires_at AS access_expires_at,
                    p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.blood_group, p.date_of_birth, p.gender, p.abha_id
             FROM qr_access_requests qr
             LEFT JOIN patient_doctor_access pda ON qr.access_id = pda.access_id
             LEFT JOIN patients p ON qr.patient_id = p.patient_id
             WHERE qr.token_hash = $1`,
            [tokenHash]
        );

        if (sessionRes.rows.length === 0) return res.status(404).json({ message: "Invalid session token" });

        const session = sessionRes.rows[0];
        const isApproved = session.access_status === "APPROVED" && new Date(session.access_expires_at) > new Date();

        if (!isApproved) {
            return res.status(403).json({
                message: session.access_status === "PENDING" ? "Access pending patient approval" : "Session expired or access not approved",
                status: session.access_status || "PENDING",
                qrStatus: session.qr_status
            });
        }

        res.json({
            message: "Access verified",
            patientId: session.patient_id,
            accessId: session.access_id,
            expiresAt: session.access_expires_at,
            patient: {
                name: `${session.patient_first_name} ${session.patient_last_name || ""}`.trim(),
                gender: session.gender,
                bloodGroup: session.blood_group,
                dateOfBirth: session.date_of_birth,
                abhaId: session.abha_id
            }
        });
    } catch (error) {
        console.error("Verify session error:", error);
        res.status(500).json({ message: "Failed to verify session", error: error.message });
    }
});

// Revoke access (Calls SQL stored function revoke_patient_doctor_access)
app.post("/revoke-session/:accessId", authenticateToken, authorizeRoles("PATIENT"), async (req, res) => {
    const accessId = req.params.accessId;
    const patientId = req.user.patientId;

    try {
        const revokeRes = await db.query(
            `SELECT revoke_patient_doctor_access($1, $2) AS revoked`,
            [accessId, patientId]
        );

        if (!revokeRes.rows[0]?.revoked) {
            return res.status(404).json({ message: "Active access record not found or already revoked" });
        }

        await logAuditEvent({
            actorUserId: req.user.userId,
            patientId,
            accessId,
            action: "ACCESS_REVOKED"
        });

        res.json({ message: "Access revoked successfully" });
    } catch (error) {
        console.error("Revoke access error:", error);
        res.status(500).json({ message: "Failed to revoke access", error: error.message });
    }
});


// ============================================================
// 5. PATIENT MEDICAL RECORDS (EHR/EMR)
// ============================================================

async function getFullPatientRecords(patientId) {
    const patientRes = await db.query(
        `SELECT patient_id, first_name, last_name, date_of_birth, gender, blood_group, abha_id, abha_verified
         FROM patients WHERE patient_id = $1`,
        [patientId]
    );
    if (patientRes.rows.length === 0) return null;

    const chronicRes = await db.query(
        `SELECT chronic_condition_id, condition_name, description, diagnosed_date, status
         FROM chronic_conditions WHERE patient_id = $1 ORDER BY diagnosed_date DESC`,
        [patientId]
    );

    const allergiesRes = await db.query(
        `SELECT allergy_id, allergen, reaction, severity, verified
         FROM allergies WHERE patient_id = $1`,
        [patientId]
    );

    const medsRes = await db.query(
        `SELECT pm.patient_medication_id, m.name AS medication_name, m.generic_name, pm.dosage,
                pm.frequency, pm.route, pm.start_date, pm.end_date, pm.status
         FROM patient_medications pm
         JOIN medications m ON pm.medication_id = m.medication_id
         WHERE pm.patient_id = $1
         ORDER BY pm.status ASC, pm.created_at DESC`,
        [patientId]
    );

    const historyRes = await db.query(
        `SELECT history_id, condition_name, description, diagnosed_date, status, treating_doctor_name
         FROM medical_history WHERE patient_id = $1 ORDER BY diagnosed_date DESC`,
        [patientId]
    );

    const diagnosesRes = await db.query(
        `SELECT d.diagnosis_id, d.diagnosis_name, d.description, d.diagnosed_date, d.status,
                doc.first_name AS doctor_first_name, doc.last_name AS doctor_last_name
         FROM diagnoses d
         JOIN doctors doc ON d.doctor_id = doc.doctor_id
         WHERE d.patient_id = $1 ORDER BY d.diagnosed_date DESC`,
        [patientId]
    );

    const labReportsRes = await db.query(
        `SELECT lab_report_id, report_title, test_name, laboratory_name, report_date, result_summary, file_reference, file_type
         FROM lab_reports WHERE patient_id = $1 AND status = 'ACTIVE' ORDER BY report_date DESC`,
        [patientId]
    );

    const imagingRes = await db.query(
        `SELECT imaging_id, imaging_type, body_part, study_title, imaging_center, study_date, findings, impression, file_reference
         FROM imaging_studies WHERE patient_id = $1 AND status = 'ACTIVE' ORDER BY study_date DESC`,
        [patientId]
    );

    const vaccinationsRes = await db.query(
        `SELECT vaccination_id, vaccine_name, vaccine_type, dose_number, total_doses, administration_date, status
         FROM vaccinations WHERE patient_id = $1 ORDER BY administration_date DESC`,
        [patientId]
    );

    const familyRes = await db.query(
        `SELECT family_history_id, relationship, condition_name, description, genetic_condition
         FROM family_history WHERE patient_id = $1`,
        [patientId]
    );

    return {
        patient: patientRes.rows[0],
        chronicConditions: chronicRes.rows,
        allergies: allergiesRes.rows,
        medications: medsRes.rows,
        medicalHistory: historyRes.rows,
        diagnoses: diagnosesRes.rows,
        labReports: labReportsRes.rows,
        imagingStudies: imagingRes.rows,
        vaccinations: vaccinationsRes.rows,
        familyHistory: familyRes.rows
    };
}

// Patient viewing own records
app.get("/patient/my-records", authenticateToken, authorizeRoles("PATIENT"), async (req, res) => {
    try {
        const records = await getFullPatientRecords(req.user.patientId);
        if (!records) return res.status(404).json({ message: "Patient records not found" });

        res.json({ message: "Records fetched successfully", records });
    } catch (error) {
        console.error("My records error:", error);
        res.status(500).json({ message: "Failed to fetch records", error: error.message });
    }
});

// Doctor viewing patient records (Enforces Database Consent Check / Emergency Override)
app.get("/patient/:patientId/records", authenticateToken, authorizeRoles("DOCTOR"), async (req, res) => {
    const patientId = req.params.patientId;
    const doctorId = req.user.doctorId;

    try {
        const accessCheck = await db.query(
            `SELECT has_active_patient_doctor_access($1, $2) AS has_consent,
                    has_active_emergency_access($1, $2) AS has_emergency`,
            [patientId, doctorId]
        );

        const hasConsent = accessCheck.rows[0]?.has_consent;
        const hasEmergency = accessCheck.rows[0]?.has_emergency;

        if (!hasConsent && !hasEmergency) {
            return res.status(403).json({
                message: "Access Denied: No active patient consent or emergency override found for this patient"
            });
        }

        const records = await getFullPatientRecords(patientId);
        if (!records) return res.status(404).json({ message: "Patient not found" });

        await logAuditEvent({
            actorUserId: req.user.userId,
            patientId,
            doctorId,
            action: "MEDICAL_HISTORY_VIEWED",
            description: hasEmergency ? "Viewed under emergency override" : "Viewed under patient consent"
        });

        res.json({
            message: "Patient records retrieved",
            accessMode: hasEmergency ? "EMERGENCY_OVERRIDE" : "CONSENT_GRANTED",
            records
        });
    } catch (error) {
        console.error("Fetch patient records error:", error);
        res.status(500).json({ message: "Failed to fetch patient records", error: error.message });
    }
});


// ============================================================
// 6. DOCTOR CONSULTATIONS & RECORD CREATION
// ============================================================

// Start a consultation session
app.post("/consultations/start", authenticateToken, authorizeRoles("DOCTOR"), async (req, res) => {
    const { patientId, accessId, consultationType = "IN_PERSON", chiefComplaint } = req.body;
    const doctorId = req.user.doctorId;
    const hospitalId = req.user.hospitalId;

    if (!patientId) return res.status(400).json({ message: "patientId is required" });

    try {
        const sessionRes = await db.query(
            `INSERT INTO consultation_sessions (
                patient_id, doctor_id, hospital_id, access_id, consultation_type, chief_complaint, status
             ) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
             RETURNING session_id, patient_id, doctor_id, started_at, status`,
            [patientId, doctorId, hospitalId || null, accessId || null, consultationType, chiefComplaint || null]
        );

        const session = sessionRes.rows[0];

        await logAuditEvent({
            actorUserId: req.user.userId,
            patientId,
            doctorId,
            accessId,
            sessionId: session.session_id,
            action: "CONSULTATION_CREATED"
        });

        res.status(201).json({ message: "Consultation session started", session });
    } catch (error) {
        console.error("Start consultation error:", error);
        res.status(500).json({ message: "Failed to start consultation", error: error.message });
    }
});

// Add Diagnosis
app.post("/consultations/:sessionId/diagnose", authenticateToken, authorizeRoles("DOCTOR"), async (req, res) => {
    const sessionId = req.params.sessionId;
    const { patientId, diagnosisName, description, status = "ACTIVE" } = req.body;
    const doctorId = req.user.doctorId;

    if (!patientId || !diagnosisName) return res.status(400).json({ message: "patientId and diagnosisName are required" });

    try {
        const diagRes = await db.query(
            `INSERT INTO diagnoses (patient_id, doctor_id, session_id, diagnosis_name, description, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING diagnosis_id, diagnosis_name, status, diagnosed_date`,
            [patientId, doctorId, sessionId, diagnosisName.trim(), description || null, status]
        );

        res.status(201).json({ message: "Diagnosis added successfully", diagnosis: diagRes.rows[0] });
    } catch (error) {
        console.error("Add diagnosis error:", error);
        res.status(500).json({ message: "Failed to add diagnosis", error: error.message });
    }
});

// Issue Prescription
app.post("/consultations/:sessionId/prescribe", authenticateToken, authorizeRoles("DOCTOR"), async (req, res) => {
    const sessionId = req.params.sessionId;
    const { patientId, notes, items } = req.body;
    const doctorId = req.user.doctorId;

    if (!patientId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "patientId and items array are required" });
    }

    const client = await db.getClient();
    try {
        await client.query("BEGIN");

        const presRes = await client.query(
            `INSERT INTO prescriptions (patient_id, doctor_id, session_id, notes, status)
             VALUES ($1, $2, $3, $4, 'ACTIVE')
             RETURNING prescription_id, prescription_date, status`,
            [patientId, doctorId, sessionId, notes || null]
        );
        const prescription = presRes.rows[0];

        for (const item of items) {
            await client.query(
                `INSERT INTO prescription_items (
                    prescription_id, medication_id, dosage, frequency, route, duration, quantity, instructions
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [prescription.prescription_id, item.medicationId, item.dosage, item.frequency, item.route || "Oral", item.duration, item.quantity || null, item.instructions || null]
            );

            await client.query(
                `INSERT INTO patient_medications (
                    patient_id, medication_id, dosage, frequency, route, start_date, status, prescribed_by
                 ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, 'ACTIVE', $6)`,
                [patientId, item.medicationId, item.dosage, item.frequency, item.route || "Oral", doctorId]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({
            message: "Prescription issued successfully",
            prescriptionId: prescription.prescription_id,
            itemCount: items.length
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Prescribe error:", error);
        res.status(500).json({ message: "Failed to issue prescription", error: error.message });
    } finally {
        client.release();
    }
});

// Complete Consultation
app.post("/consultations/:sessionId/complete", authenticateToken, authorizeRoles("DOCTOR"), async (req, res) => {
    const sessionId = req.params.sessionId;
    const { doctorNotes, treatmentNotes, followUpDate } = req.body;

    try {
        const sessionRes = await db.query(
            `UPDATE consultation_sessions
             SET status = 'COMPLETED',
                 ended_at = NOW(),
                 doctor_notes = COALESCE($1, doctor_notes),
                 treatment_notes = COALESCE($2, treatment_notes),
                 follow_up_date = $3,
                 updated_at = NOW()
             WHERE session_id = $4 AND doctor_id = $5
             RETURNING session_id, patient_id, started_at, ended_at, status`,
            [doctorNotes || null, treatmentNotes || null, followUpDate || null, sessionId, req.user.doctorId]
        );

        if (sessionRes.rows.length === 0) return res.status(404).json({ message: "Consultation session not found" });

        await logAuditEvent({
            actorUserId: req.user.userId,
            patientId: sessionRes.rows[0].patient_id,
            doctorId: req.user.doctorId,
            sessionId,
            action: "CONSULTATION_COMPLETED"
        });

        res.json({ message: "Consultation completed successfully", session: sessionRes.rows[0] });
    } catch (error) {
        console.error("Complete consultation error:", error);
        res.status(500).json({ message: "Failed to complete consultation", error: error.message });
    }
});


// ============================================================
// 7. EMERGENCY ACCESS WORKFLOW
// ============================================================

app.post("/emergency-access/start", authenticateToken, authorizeRoles("DOCTOR"), async (req, res) => {
    const { patientId, reason, durationMinutes = 60 } = req.body;
    const doctorId = req.user.doctorId;
    const hospitalId = req.user.hospitalId;

    if (!patientId || !reason) return res.status(400).json({ message: "patientId and emergency reason are required" });

    try {
        const emergencyRes = await db.query(
            `SELECT start_emergency_access($1, $2, $3, $4, $5) AS emergency_id`,
            [patientId, doctorId, hospitalId || null, reason, parseInt(durationMinutes, 10)]
        );

        const emergencyId = emergencyRes.rows[0].emergency_id;

        await logAuditEvent({
            actorUserId: req.user.userId,
            patientId,
            doctorId,
            action: "EMERGENCY_ACCESS_STARTED",
            resourceType: "emergency_access",
            resourceId: emergencyId,
            description: `Emergency access declared: ${reason}`
        });

        res.status(201).json({
            message: "Emergency access activated",
            emergencyAccessId: emergencyId,
            durationMinutes
        });
    } catch (error) {
        console.error("Start emergency access error:", error);
        res.status(500).json({ message: "Failed to activate emergency access", error: error.message });
    }
});

app.post("/emergency-access/end", authenticateToken, authorizeRoles("DOCTOR"), async (req, res) => {
    const { emergencyAccessId } = req.body;
    if (!emergencyAccessId) return res.status(400).json({ message: "emergencyAccessId is required" });

    try {
        const endRes = await db.query(`SELECT end_emergency_access($1) AS ended`, [emergencyAccessId]);

        if (!endRes.rows[0]?.ended) return res.status(404).json({ message: "Active emergency access not found" });

        await logAuditEvent({
            actorUserId: req.user.userId,
            action: "EMERGENCY_ACCESS_ENDED",
            resourceType: "emergency_access",
            resourceId: emergencyAccessId
        });

        res.json({ message: "Emergency access ended" });
    } catch (error) {
        console.error("End emergency access error:", error);
        res.status(500).json({ message: "Failed to end emergency access", error: error.message });
    }
});


// ============================================================
// 8. MEDICATIONS MASTER & AUDIT LOGS
// ============================================================

app.get("/medications", authenticateToken, async (req, res) => {
    const { search = "", limit = 20 } = req.query;
    try {
        const query = search.trim()
            ? `SELECT medication_id, name, generic_name, strength, dosage_form, manufacturer
               FROM medications WHERE name ILIKE $1 OR generic_name ILIKE $1 LIMIT $2`
            : `SELECT medication_id, name, generic_name, strength, dosage_form, manufacturer
               FROM medications LIMIT $1`;

        const params = search.trim() ? [`%${search.trim()}%`, parseInt(limit, 10)] : [parseInt(limit, 10)];
        const medsRes = await db.query(query, params);
        res.json({ medications: medsRes.rows });
    } catch (error) {
        console.error("Search medications error:", error);
        res.status(500).json({ message: "Failed to fetch medications", error: error.message });
    }
});

app.get("/audit-logs", authenticateToken, async (req, res) => {
    try {
        let query = "";
        let params = [];

        if (req.user.role === "PATIENT") {
            query = `SELECT audit_id, action, resource_type, description, created_at
                     FROM audit_logs WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 50`;
            params = [req.user.patientId];
        } else if (req.user.role === "DOCTOR") {
            query = `SELECT audit_id, action, resource_type, description, created_at
                     FROM audit_logs WHERE doctor_id = $1 ORDER BY created_at DESC LIMIT 50`;
            params = [req.user.doctorId];
        } else {
            query = `SELECT a.audit_id, a.action, a.resource_type, a.description, a.created_at, u.email AS actor_email
                     FROM audit_logs a LEFT JOIN users u ON a.actor_user_id = u.user_id
                     ORDER BY a.created_at DESC LIMIT 100`;
        }

        const logsRes = await db.query(query, params);
        res.json({ logs: logsRes.rows });
    } catch (error) {
        console.error("Audit logs error:", error);
        res.status(500).json({ message: "Failed to fetch audit logs", error: error.message });
    }
});


// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`DiagNect Med-Tech Backend running on http://localhost:${PORT}`);
});

export default app;
*/