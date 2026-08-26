const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = 4000;

// Temporary secret key
const JWT_SECRET = "diagnect_secret_key_2026";


// ==========================
// TEMPORARY USERS
// Later → SQL Database
// ==========================

const users = [
    {
        id: "patient123",
        name: "Rahul Kumar",
        email: "patient@test.com",
        password: bcrypt.hashSync("123456", 10),
        role: "patient"
    },
    {
        id: "doctor123",
        name: "Dr. Sharma",
        email: "doctor@test.com",
        password: bcrypt.hashSync("123456", 10),
        role: "doctor"
    }
];


// ==========================
// TEMPORARY PATIENT DATA
// Later → SQL Database
// ==========================

const patients = [
    {
        id: "patient123",
        name: "Rahul Kumar",
        age: 22,
        symptoms: ["fever", "headache"],
        medicalHistory: ["diabetes"],
        reports: []
    }
];


// ==========================
// TEMPORARY SESSIONS
// Later → SQL Database
// ==========================

const sessions = [];


// ==========================
// HOME ROUTE
// ==========================

app.get("/", (req, res) => {
    res.send("DiagNect Backend server is working!");
});


// ==========================
// LOGIN API
// ==========================

app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    // Find user
    const user = users.find(
        (u) => u.email === email
    );

    // User not found
    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    // Create JWT token
    const token = jwt.sign(
        {
            id: user.id,
            role: user.role,
            name: user.name
        },
        JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    // Send response
    res.json({
        message: "Login successful",
        token: token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });

});


// ==========================
// AUTHENTICATION MIDDLEWARE
// ==========================

function authenticateToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    // Expected format:
    // Bearer TOKEN
    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Invalid token format"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(403).json({
            message: "Invalid or expired token"
        });

    }
}


// ==========================
// CHECK CURRENT USER
// ==========================

app.get("/profile", authenticateToken, (req, res) => {

    const user = users.find(
        (u) => u.id === req.user.id
    );

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    res.json({
        message: "Profile retrieved successfully",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });

});


// ==========================
// CREATE SHARING SESSION
// ==========================

app.post("/share-records", authenticateToken, (req, res) => {

    const { patientId, permissions } = req.body;

    // Only patient can share records
    if (req.user.role !== "patient") {
        return res.status(403).json({
            message: "Only patients can share records"
        });
    }

    // Patient can only share their own records
    if (req.user.id !== patientId) {
        return res.status(403).json({
            message: "You cannot share another patient's records"
        });
    }

    // Find patient
    const patient = patients.find(
        (p) => p.id === patientId
    );

    if (!patient) {
        return res.status(404).json({
            message: "Patient not found"
        });
    }

    // Generate secure session token
    const token = crypto.randomBytes(16).toString("hex");

    const session = {
        patientId,
        permissions,
        token,
        active: true,
        expiresAt: Date.now() + 10 * 60 * 1000
    };

    sessions.push(session);

    res.json({
        message: "Sharing session created",
        token,
        expiresIn: "10 minutes"
    });

});


// ==========================
// VERIFY SHARING SESSION
// ==========================

app.get("/verify-session/:token", authenticateToken, (req, res) => {

    const token = req.params.token;

    const session = sessions.find(
        (s) => s.token === token
    );

    if (!session) {
        return res.status(404).json({
            message: "Invalid session"
        });
    }

    if (!session.active) {
        return res.status(403).json({
            message: "Session revoked"
        });
    }

    if (Date.now() > session.expiresAt) {
        return res.status(403).json({
            message: "Session expired"
        });
    }

    // Find patient data
    const patient = patients.find(
        (p) => p.id === session.patientId
    );

    res.json({
        message: "Access granted",
        patientId: session.patientId,
        permissions: session.permissions,
        patient: patient
    });

});


// ==========================
// REVOKE SESSION
// ==========================

app.post("/revoke-session/:token", authenticateToken, (req, res) => {

    const token = req.params.token;

    const session = sessions.find(
        (s) => s.token === token
    );

    if (!session) {
        return res.status(404).json({
            message: "Session not found"
        });
    }

    // Only the patient who created the session
    // should revoke it
    if (req.user.id !== session.patientId) {
        return res.status(403).json({
            message: "You cannot revoke this session"
        });
    }

    session.active = false;

    res.json({
        message: "Session revoked successfully"
    });

});


// ==========================
// START SERVER
// ==========================

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});