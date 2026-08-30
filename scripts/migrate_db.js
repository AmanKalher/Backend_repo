import db from "../db.js";

async function runMigrations() {
    console.log("Running database column sync and migrations for DigiLocker & Cashfree...");
    try {
        await db.query(`
            ALTER TABLE doctors 
            ADD COLUMN IF NOT EXISTS certificate_url VARCHAR(500),
            ADD COLUMN IF NOT EXISTS qualification VARCHAR(100);
        `);
        console.log("✓ Added certificate_url and qualification columns to doctors table");

        await db.query(`
            ALTER TABLE patients
            ADD COLUMN IF NOT EXISTS abha_id VARCHAR(100) UNIQUE,
            ADD COLUMN IF NOT EXISTS abha_verified BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS abha_verified_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS aadhaar_hash VARCHAR(64),
            ADD COLUMN IF NOT EXISTS digilocker_verification_id VARCHAR(100);
        `);
        console.log("✓ Verified ABHA and DigiLocker columns on patients table");

        await db.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS aadhaar_hash VARCHAR(64),
            ADD COLUMN IF NOT EXISTS digilocker_verification_id VARCHAR(100);
        `);
        console.log("✓ Verified aadhaar_hash and digilocker_verification_id on users table");

        await db.query(`
            CREATE TABLE IF NOT EXISTS auth_sessions (
                session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                refresh_token TEXT NOT NULL UNIQUE,
                revoked BOOLEAN NOT NULL DEFAULT FALSE,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log("✓ Verified auth_sessions table");
        await db.query(`
            CREATE TABLE IF NOT EXISTS sharing_sessions (
                room_id VARCHAR(100) PRIMARY KEY,
                doctor_token_hash VARCHAR(64) NOT NULL,
                patient_token_hash VARCHAR(64) NOT NULL,
                doctor_name VARCHAR(255) NOT NULL,
                doctor_hospital VARCHAR(255),
                doctor_specialization VARCHAR(255),
                status VARCHAR(50) NOT NULL DEFAULT 'WAITING_FOR_PATIENT',
                patient_id UUID REFERENCES patients(patient_id) ON DELETE SET NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log("✓ Verified sharing_sessions table");

        await db.query(`
            CREATE TABLE IF NOT EXISTS diagnosis_reports (
                id VARCHAR(100) PRIMARY KEY,
                room_id VARCHAR(100) NOT NULL,
                patient_id UUID REFERENCES patients(patient_id) ON DELETE SET NULL,
                doctor_name VARCHAR(255) NOT NULL,
                doctor_hospital VARCHAR(255),
                diagnosis TEXT NOT NULL,
                symptoms TEXT,
                medicines TEXT,
                clinical_notes TEXT,
                follow_up VARCHAR(255),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log("✓ Verified diagnosis_reports table");

        console.log("✓ Database migrations completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err.message);
        process.exit(1);
    }
}

runMigrations();
