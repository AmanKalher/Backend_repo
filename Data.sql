-- ============================================================
-- MED-TECH PROJECT
-- COMPLETE DATABASE SCHEMA
-- IDENTITY + PATIENT HEALTH
-- PostgreSQL
-- ============================================================


-- ============================================================
-- 1. EXTENSION
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- ============================================================
-- 2. CLEAN OLD TABLES
-- ============================================================
-- ONLY USE THIS WHILE DEVELOPING / TESTING.
-- This removes the existing tables so the schema can be
-- recreated cleanly without repeated CREATE/ALTER errors.
-- ============================================================

DROP TABLE IF EXISTS identity_verifications CASCADE;
DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP TABLE IF EXISTS emergency_access CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS qr_access_requests CASCADE;
DROP TABLE IF EXISTS diagnoses CASCADE;
DROP TABLE IF EXISTS prescription_items CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS medical_reports CASCADE;
DROP TABLE IF EXISTS patient_doctor_access CASCADE;
DROP TABLE IF EXISTS consultation_sessions CASCADE;
DROP TABLE IF EXISTS doctor_visits CASCADE;
DROP TABLE IF EXISTS patient_medications CASCADE;
DROP TABLE IF EXISTS medical_history CASCADE;
DROP TABLE IF EXISTS allergies CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- 3. USERS TABLE
-- ============================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) UNIQUE,

    phone VARCHAR(15) UNIQUE,

    password_hash TEXT,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_user_contact
        CHECK (
            email IS NOT NULL
            OR phone IS NOT NULL
        )
);


-- ============================================================
-- 4. PATIENTS TABLE
-- ============================================================

CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    date_of_birth DATE,

    gender VARCHAR(20),

    blood_group VARCHAR(5),

    abha_id VARCHAR(100) UNIQUE,

    abha_verified BOOLEAN NOT NULL DEFAULT FALSE,

    abha_verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_patient_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_patient_gender
        CHECK (
            gender IS NULL
            OR gender IN (
                'MALE',
                'FEMALE',
                'OTHER',
                'PREFER_NOT_TO_SAY'
            )
        ),

    CONSTRAINT chk_patient_dob
        CHECK (
            date_of_birth IS NULL
            OR date_of_birth <= CURRENT_DATE
        )
);


-- ============================================================
-- 5. HOSPITALS TABLE
-- ============================================================

CREATE TABLE hospitals (
    hospital_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hospital_name VARCHAR(255) NOT NULL,

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    pincode VARCHAR(10),

    latitude NUMERIC(10, 7),

    longitude NUMERIC(10, 7),

    registration_number VARCHAR(100) UNIQUE,

    external_hospital_id VARCHAR(150) UNIQUE,

    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_hospital_latitude
        CHECK (
            latitude IS NULL
            OR latitude BETWEEN -90 AND 90
        ),

    CONSTRAINT chk_hospital_longitude
        CHECK (
            longitude IS NULL
            OR longitude BETWEEN -180 AND 180
        )
);


-- ============================================================
-- 6. DOCTORS TABLE
-- ============================================================

CREATE TABLE doctors (
    doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    specialization VARCHAR(100),

    registration_number VARCHAR(100) NOT NULL UNIQUE,

    registration_authority VARCHAR(150),

    identity_verified BOOLEAN NOT NULL DEFAULT FALSE,

    identity_verified_at TIMESTAMPTZ,

    registration_verified BOOLEAN NOT NULL DEFAULT FALSE,

    registration_verified_at TIMESTAMPTZ,

    hospital_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_doctor_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospitals(hospital_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ============================================================
-- 7. MEDICAL HISTORY
-- ============================================================

CREATE TABLE medical_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,

    condition_name VARCHAR(255) NOT NULL,

    description TEXT,

    diagnosed_date DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    treating_doctor_name VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_medical_history_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_medical_history_status
        CHECK (
            status IN (
                'ACTIVE',
                'RESOLVED',
                'CHRONIC',
                'UNKNOWN'
            )
        ),

    CONSTRAINT chk_medical_history_date
        CHECK (
            diagnosed_date IS NULL
            OR diagnosed_date <= CURRENT_DATE
        )
);


-- ============================================================
-- 8. ALLERGIES
-- ============================================================

CREATE TABLE allergies (
    allergy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,

    allergen VARCHAR(255) NOT NULL,

    reaction TEXT,

    severity VARCHAR(30),

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_allergy_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_allergy_severity
        CHECK (
            severity IS NULL
            OR severity IN (
                'MILD',
                'MODERATE',
                'SEVERE',
                'LIFE_THREATENING'
            )
        )
);


-- ============================================================
-- 9. MEDICATION MASTER
-- ============================================================

CREATE TABLE medications (
    medication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    generic_name VARCHAR(255),

    strength VARCHAR(100),

    dosage_form VARCHAR(100),

    manufacturer VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_medication_name
        CHECK (LENGTH(TRIM(name)) > 0)
);


-- ============================================================
-- 10. PATIENT MEDICATIONS
-- ============================================================

CREATE TABLE patient_medications (
    patient_medication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,

    medication_id UUID NOT NULL,

    dosage VARCHAR(100),

    frequency VARCHAR(100),

    route VARCHAR(50),

    start_date DATE,

    end_date DATE,

    quantity INTEGER,

    refill_threshold INTEGER,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    prescribed_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_patient_medication_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_patient_medication_medication
        FOREIGN KEY (medication_id)
        REFERENCES medications(medication_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_patient_medication_doctor
        FOREIGN KEY (prescribed_by)
        REFERENCES doctors(doctor_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_patient_medication_status
        CHECK (
            status IN (
                'ACTIVE',
                'COMPLETED',
                'STOPPED'
            )
        ),

    CONSTRAINT chk_medication_quantity
        CHECK (
            quantity IS NULL
            OR quantity >= 0
        ),

    CONSTRAINT chk_refill_threshold
        CHECK (
            refill_threshold IS NULL
            OR refill_threshold >= 0
        ),

    CONSTRAINT chk_medication_dates
        CHECK (
            end_date IS NULL
            OR start_date IS NULL
            OR end_date >= start_date
        )
);


-- ============================================================
-- 11. INDEXES
-- ============================================================

CREATE INDEX idx_users_role
ON users(role);

CREATE INDEX idx_users_active
ON users(is_active);

CREATE INDEX idx_patients_abha
ON patients(abha_id);

CREATE INDEX idx_doctors_identity_verified
ON doctors(identity_verified);

CREATE INDEX idx_doctors_registration_verified
ON doctors(registration_verified);

CREATE INDEX idx_doctors_specialization
ON doctors(specialization);

CREATE INDEX idx_doctors_hospital
ON doctors(hospital_id);

CREATE INDEX idx_hospitals_city
ON hospitals(city);

CREATE INDEX idx_hospitals_location
ON hospitals(latitude, longitude);

CREATE INDEX idx_medical_history_patient
ON medical_history(patient_id);

CREATE INDEX idx_allergies_patient
ON allergies(patient_id);

CREATE INDEX idx_medications_name
ON medications(name);

CREATE INDEX idx_patient_medications_patient
ON patient_medications(patient_id);

CREATE INDEX idx_patient_medications_medication
ON patient_medications(medication_id);

CREATE INDEX idx_patient_medications_status
ON patient_medications(status);

CREATE INDEX idx_patient_medications_doctor
ON patient_medications(prescribed_by);


-- ============================================================
-- 12. AUTOMATIC updated_at FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 13. UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_hospitals_updated_at
BEFORE UPDATE ON hospitals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON doctors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_medical_history_updated_at
BEFORE UPDATE ON medical_history
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_allergies_updated_at
BEFORE UPDATE ON allergies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON medications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_patient_medications_updated_at
BEFORE UPDATE ON patient_medications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 14. DOCTOR VISITS / CONSULTATIONS
-- ============================================================

CREATE TABLE doctor_visits (
    visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,

    doctor_id UUID NOT NULL,

    hospital_id UUID,

    visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    visit_type VARCHAR(30) NOT NULL DEFAULT 'CONSULTATION',

    chief_complaint TEXT,

    symptoms TEXT,

    clinical_notes TEXT,

    diagnosis TEXT,

    treatment_notes TEXT,

    follow_up_date DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Patient involved in visit
    CONSTRAINT fk_visit_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Doctor involved in visit
    CONSTRAINT fk_visit_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- Hospital where visit occurred
    CONSTRAINT fk_visit_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospitals(hospital_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- Visit type
    CONSTRAINT chk_visit_type
        CHECK (
            visit_type IN (
                'CONSULTATION',
                'FOLLOW_UP',
                'EMERGENCY',
                'ROUTINE_CHECKUP'
            )
        ),

    -- Visit status
    CONSTRAINT chk_visit_status
        CHECK (
            status IN (
                'SCHEDULED',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    -- Follow-up cannot be before visit
    CONSTRAINT chk_follow_up_date
        CHECK (
            follow_up_date IS NULL
            OR follow_up_date >= visit_date::DATE
        )
);

-- ============================================================
-- 15. DOCTOR VISIT INDEXES
-- ============================================================

CREATE INDEX idx_doctor_visits_patient
ON doctor_visits(patient_id);

CREATE INDEX idx_doctor_visits_doctor
ON doctor_visits(doctor_id);

CREATE INDEX idx_doctor_visits_hospital
ON doctor_visits(hospital_id);

CREATE INDEX idx_doctor_visits_date
ON doctor_visits(visit_date);

CREATE INDEX idx_doctor_visits_status
ON doctor_visits(status);

CREATE TRIGGER update_doctor_visits_updated_at
BEFORE UPDATE ON doctor_visits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 16. CONSULTATION SESSIONS
-- ============================================================

CREATE TABLE consultation_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,

    doctor_id UUID NOT NULL,

    hospital_id UUID,

    -- The access/consent record that allowed this consultation
    access_id UUID,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    ended_at TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    consultation_type VARCHAR(30) NOT NULL DEFAULT 'IN_PERSON',

    chief_complaint TEXT,

    diagnosis TEXT,

    doctor_notes TEXT,

    treatment_notes TEXT,

    follow_up_date DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Patient participating in consultation
    CONSTRAINT fk_session_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- Doctor conducting consultation
    CONSTRAINT fk_session_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- Hospital where consultation takes place
    CONSTRAINT fk_session_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospitals(hospital_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- Session status
    CONSTRAINT chk_session_status
        CHECK (
            status IN (
                'ACTIVE',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    -- Type of consultation
    CONSTRAINT chk_consultation_type
        CHECK (
            consultation_type IN (
                'IN_PERSON',
                'VIDEO',
                'TELEPHONE'
            )
        ),

    -- End time cannot be before start time
    CONSTRAINT chk_session_times
        CHECK (
            ended_at IS NULL
            OR ended_at >= started_at
        ),

    -- Follow-up date cannot be before consultation
    CONSTRAINT chk_session_follow_up
        CHECK (
            follow_up_date IS NULL
            OR follow_up_date >= started_at::DATE
        )
);

-- ============================================================
-- 17. CONSULTATION SESSION INDEXES
-- ============================================================

CREATE INDEX idx_sessions_patient
ON consultation_sessions(patient_id);

CREATE INDEX idx_sessions_doctor
ON consultation_sessions(doctor_id);

CREATE INDEX idx_sessions_hospital
ON consultation_sessions(hospital_id);

CREATE INDEX idx_sessions_access
ON consultation_sessions(access_id);

CREATE INDEX idx_sessions_started_at
ON consultation_sessions(started_at);

CREATE INDEX idx_sessions_status
ON consultation_sessions(status);

-- ============================================================
-- 18. CONSULTATION SESSION TRIGGER
-- ============================================================

CREATE TRIGGER update_consultation_sessions_updated_at
BEFORE UPDATE ON consultation_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 19. PATIENT-DOCTOR ACCESS / CONSENT
-- ============================================================
-- Controls whether a doctor is allowed to access
-- a patient's medical information.
--
-- QR WORKFLOW:
--
-- Doctor generates QR
--        ↓
-- Patient scans QR
--        ↓
-- Access request created
--        ↓
-- Patient APPROVES / DECLINES
--        ↓
-- If approved:
-- Doctor gets temporary access
--        ↓
-- Access expires automatically
-- ============================================================

CREATE TABLE patient_doctor_access (
    access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,

    doctor_id UUID NOT NULL,

    -- Optional connection to the consultation
    session_id UUID,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    approved_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    revoked_at TIMESTAMPTZ,

    -- Patient can optionally provide a reason/context
    purpose TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ========================================================
    -- FOREIGN KEYS
    -- ========================================================

    CONSTRAINT fk_access_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_access_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_access_session
        FOREIGN KEY (session_id)
        REFERENCES consultation_sessions(session_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- ========================================================
    -- STATUS
    -- ========================================================

    CONSTRAINT chk_access_status
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'DECLINED',
                'EXPIRED',
                'REVOKED'
            )
        ),

    -- Approval time required when approved
    CONSTRAINT chk_access_approved_time
        CHECK (
            status <> 'APPROVED'
            OR approved_at IS NOT NULL
        ),

    -- Expiry required when approved
    CONSTRAINT chk_access_expiry
        CHECK (
            status <> 'APPROVED'
            OR expires_at IS NOT NULL
        ),

    -- Revocation time required when revoked
    CONSTRAINT chk_access_revoked_time
        CHECK (
            status <> 'REVOKED'
            OR revoked_at IS NOT NULL
        ),

    -- Expiry must be after approval
    CONSTRAINT chk_access_dates
        CHECK (
            expires_at IS NULL
            OR approved_at IS NULL
            OR expires_at > approved_at
        )
);

-- ============================================================
-- 20. ACCESS INDEXES
-- ============================================================

CREATE INDEX idx_access_patient
ON patient_doctor_access(patient_id);

CREATE INDEX idx_access_doctor
ON patient_doctor_access(doctor_id);

CREATE INDEX idx_access_session
ON patient_doctor_access(session_id);

CREATE INDEX idx_access_status
ON patient_doctor_access(status);

CREATE INDEX idx_access_expiry
ON patient_doctor_access(expires_at);

CREATE INDEX idx_access_requested_at
ON patient_doctor_access(requested_at);

-- ============================================================
-- 21. ACCESS UPDATED_AT TRIGGER
-- ============================================================

CREATE TRIGGER update_patient_doctor_access_updated_at

BEFORE UPDATE ON patient_doctor_access

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();


ALTER TABLE consultation_sessions

ADD CONSTRAINT fk_session_access

FOREIGN KEY (access_id)

REFERENCES patient_doctor_access(access_id)

ON DELETE SET NULL

ON UPDATE CASCADE;


-- ============================================================
-- 22. MEDICAL REPORTS / DOCUMENTS
-- ============================================================
-- Stores information ABOUT a medical report/document.
--
-- The actual file should normally be stored in secure file
-- storage, not directly inside PostgreSQL.
--
-- PostgreSQL stores the metadata and the secure file reference.
-- ============================================================

CREATE TABLE medical_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,

    -- Doctor who uploaded/created the report
    uploaded_by_doctor UUID,

    -- Consultation during which the report was created
    session_id UUID,

    report_title VARCHAR(255) NOT NULL,

    report_type VARCHAR(50) NOT NULL,

    description TEXT,

    report_date DATE,

    -- Secure reference/path/URL to the actual document
    file_reference TEXT NOT NULL,

    -- Example: application/pdf, image/jpeg
    file_type VARCHAR(100),

    file_size_bytes BIGINT,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ========================================================
    -- FOREIGN KEYS
    -- ========================================================

    CONSTRAINT fk_report_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_report_doctor
        FOREIGN KEY (uploaded_by_doctor)
        REFERENCES doctors(doctor_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_report_session
        FOREIGN KEY (session_id)
        REFERENCES consultation_sessions(session_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- ========================================================
    -- REPORT TYPE
    -- ========================================================

    CONSTRAINT chk_report_type
        CHECK (
            report_type IN (
                'LAB_REPORT',
                'XRAY',
                'CT_SCAN',
                'MRI',
                'ULTRASOUND',
                'PRESCRIPTION',
                'DISCHARGE_SUMMARY',
                'MEDICAL_CERTIFICATE',
                'OTHER'
            )
        ),

    -- ========================================================
    -- STATUS
    -- ========================================================

    CONSTRAINT chk_report_status
        CHECK (
            status IN (
                'ACTIVE',
                'ARCHIVED',
                'DELETED'
            )
        ),

    -- File size cannot be negative
    CONSTRAINT chk_report_file_size
        CHECK (
            file_size_bytes IS NULL
            OR file_size_bytes >= 0
        ),

    -- Report date cannot be in the future
    CONSTRAINT chk_report_date
        CHECK (
            report_date IS NULL
            OR report_date <= CURRENT_DATE
        )
);

-- ============================================================
-- 23. MEDICAL REPORT INDEXES
-- ============================================================

CREATE INDEX idx_medical_reports_patient
ON medical_reports(patient_id);

CREATE INDEX idx_medical_reports_doctor
ON medical_reports(uploaded_by_doctor);

CREATE INDEX idx_medical_reports_session
ON medical_reports(session_id);

CREATE INDEX idx_medical_reports_type
ON medical_reports(report_type);

CREATE INDEX idx_medical_reports_date
ON medical_reports(report_date);

CREATE INDEX idx_medical_reports_status
ON medical_reports(status);

-- ============================================================
-- 24. MEDICAL REPORT UPDATED_AT TRIGGER
-- ============================================================

CREATE TRIGGER update_medical_reports_updated_at
BEFORE UPDATE ON medical_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 25. PRESCRIPTIONS
-- ============================================================
-- Represents one prescription issued by a doctor
-- during a consultation.
-- ============================================================

CREATE TABLE prescriptions (
    prescription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,

    doctor_id UUID NOT NULL,

    session_id UUID,

    prescription_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    notes TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ========================================================
    -- FOREIGN KEYS
    -- ========================================================

    CONSTRAINT fk_prescription_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_prescription_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_prescription_session
        FOREIGN KEY (session_id)
        REFERENCES consultation_sessions(session_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- ========================================================
    -- STATUS
    -- ========================================================

    CONSTRAINT chk_prescription_status
        CHECK (
            status IN (
                'ACTIVE',
                'COMPLETED',
                'CANCELLED'
            )
        )
);

-- ============================================================
-- 26. PRESCRIPTION ITEMS
-- ============================================================
-- Individual medicines contained in a prescription.
-- ============================================================

CREATE TABLE prescription_items (
    prescription_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    prescription_id UUID NOT NULL,

    medication_id UUID NOT NULL,

    dosage VARCHAR(100),

    frequency VARCHAR(100),

    route VARCHAR(50),

    duration VARCHAR(100),

    quantity INTEGER,

    instructions TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ========================================================
    -- FOREIGN KEYS
    -- ========================================================

    CONSTRAINT fk_prescription_item_prescription
        FOREIGN KEY (prescription_id)
        REFERENCES prescriptions(prescription_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_prescription_item_medication
        FOREIGN KEY (medication_id)
        REFERENCES medications(medication_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- Quantity cannot be negative
    CONSTRAINT chk_prescription_quantity
        CHECK (
            quantity IS NULL
            OR quantity >= 0
        )
);

-- ============================================================
-- 27. PRESCRIPTION INDEXES
-- ============================================================

CREATE INDEX idx_prescriptions_patient
ON prescriptions(patient_id);

CREATE INDEX idx_prescriptions_doctor
ON prescriptions(doctor_id);

CREATE INDEX idx_prescriptions_session
ON prescriptions(session_id);

CREATE INDEX idx_prescriptions_date
ON prescriptions(prescription_date);

CREATE INDEX idx_prescriptions_status
ON prescriptions(status);

CREATE INDEX idx_prescription_items_prescription
ON prescription_items(prescription_id);

CREATE INDEX idx_prescription_items_medication
ON prescription_items(medication_id);

-- ============================================================
-- 28. PRESCRIPTION UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_prescription_items_updated_at
BEFORE UPDATE ON prescription_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 29. CASE-INSENSITIVE TEXT
-- ============================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- ============================================================
-- 30. DIAGNOSES
-- ============================================================
-- Stores diagnoses associated with a patient's consultation.
--
-- Diagnosis is intentionally FREE TEXT.
--
-- Examples:
--     fever
--     FEVER
--     Fever
--     viral fever
--     Type 2 Diabetes
--
-- CITEXT makes comparisons case-insensitive.
-- ============================================================

CREATE TABLE diagnoses (
    diagnosis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,

    doctor_id UUID NOT NULL,

    session_id UUID,

    diagnosis_name CITEXT NOT NULL,

    description TEXT,

    diagnosed_date DATE NOT NULL DEFAULT CURRENT_DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ========================================================
    -- FOREIGN KEYS
    -- ========================================================

    CONSTRAINT fk_diagnosis_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_diagnosis_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_diagnosis_session
        FOREIGN KEY (session_id)
        REFERENCES consultation_sessions(session_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- ========================================================
    -- STATUS
    -- ========================================================

    CONSTRAINT chk_diagnosis_status
        CHECK (
            status IN (
                'ACTIVE',
                'RESOLVED',
                'CHRONIC',
                'SUSPECTED'
            )
        ),

    -- Diagnosis cannot be empty
    CONSTRAINT chk_diagnosis_name
        CHECK (
            LENGTH(TRIM(diagnosis_name::TEXT)) > 0
        ),

    -- Diagnosis date cannot be in the future
    CONSTRAINT chk_diagnosis_date
        CHECK (
            diagnosed_date <= CURRENT_DATE
        )
);

-- ============================================================
-- 31. DIAGNOSIS INDEXES
-- ============================================================

CREATE INDEX idx_diagnoses_patient
ON diagnoses(patient_id);

CREATE INDEX idx_diagnoses_doctor
ON diagnoses(doctor_id);

CREATE INDEX idx_diagnoses_session
ON diagnoses(session_id);

CREATE INDEX idx_diagnoses_name
ON diagnoses(diagnosis_name);

CREATE INDEX idx_diagnoses_status
ON diagnoses(status);

CREATE INDEX idx_diagnoses_date
ON diagnoses(diagnosed_date);

-- ============================================================
-- 32. DIAGNOSIS UPDATED_AT TRIGGER
-- ============================================================

CREATE TRIGGER update_diagnoses_updated_at
BEFORE UPDATE ON diagnoses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 33. QR ACCESS REQUESTS
-- ============================================================
-- A doctor generates a short-lived QR code.
--
-- The QR contains a temporary token.
-- The database stores only a HASH of that token.
--
-- QR TOKEN
--     ↓
-- Patient scans
--     ↓
-- Backend finds QR request
--     ↓
-- Patient sees doctor + consent warning
-- ============================================================

CREATE TABLE qr_access_requests (
    qr_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    doctor_id UUID NOT NULL,

    -- The patient is NOT known when the doctor initially
    -- generates the QR.
    patient_id UUID,

    -- Links the QR request to the consent request
    access_id UUID,

    -- SHA-256 hash of the temporary QR token
    token_hash TEXT NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- ========================================================
    -- FOREIGN KEYS
    -- ========================================================

    CONSTRAINT fk_qr_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_qr_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_qr_access
        FOREIGN KEY (access_id)
        REFERENCES patient_doctor_access(access_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- ========================================================
    -- STATUS
    -- ========================================================

    CONSTRAINT chk_qr_status
        CHECK (
            status IN (
                'ACTIVE',
                'USED',
                'EXPIRED',
                'CANCELLED'
            )
        ),

    -- QR cannot expire before it was created
    CONSTRAINT chk_qr_expiry
        CHECK (
            expires_at > created_at
        ),

    -- USED QR must have a used timestamp
    CONSTRAINT chk_qr_used_at
        CHECK (
            status <> 'USED'
            OR used_at IS NOT NULL
        )
);

-- ============================================================
-- 34. QR ACCESS INDEXES
-- ============================================================

CREATE INDEX idx_qr_doctor
ON qr_access_requests(doctor_id);

CREATE INDEX idx_qr_patient
ON qr_access_requests(patient_id);

CREATE INDEX idx_qr_access
ON qr_access_requests(access_id);

CREATE INDEX idx_qr_status
ON qr_access_requests(status);

CREATE INDEX idx_qr_expiry
ON qr_access_requests(expires_at);

-- ============================================================
-- 35. AUDIT LOGS
-- ============================================================
-- Records important security and medical-data actions.
--
-- Examples:
--
-- Doctor requested access
-- Patient approved access
-- Patient declined access
-- Doctor viewed medical history
-- Doctor viewed report
-- Doctor viewed prescription
-- Access revoked
-- ============================================================

CREATE TABLE audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User who performed the action
    actor_user_id UUID,

    -- Patient whose information was involved
    patient_id UUID,

    -- Doctor involved, if applicable
    doctor_id UUID,

    -- Related consent/access record
    access_id UUID,

    -- Related consultation session
    session_id UUID,

    -- What action happened
    action VARCHAR(50) NOT NULL,

    -- What type of data/resource was involved
    resource_type VARCHAR(50),

    -- ID of the affected record, if applicable
    resource_id UUID,

    -- Additional information
    description TEXT,

    -- When the action happened
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ========================================================
    -- FOREIGN KEYS
    -- ========================================================

    CONSTRAINT fk_audit_actor
        FOREIGN KEY (actor_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_audit_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_audit_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_audit_access
        FOREIGN KEY (access_id)
        REFERENCES patient_doctor_access(access_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_audit_session
        FOREIGN KEY (session_id)
        REFERENCES consultation_sessions(session_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- ========================================================
    -- ACTION VALIDATION
    -- ========================================================

    CONSTRAINT chk_audit_action
        CHECK (
            action IN (
                'QR_GENERATED',
                'QR_SCANNED',
                'ACCESS_REQUESTED',
                'ACCESS_APPROVED',
                'ACCESS_DECLINED',
                'ACCESS_REVOKED',
                'ACCESS_EXPIRED',
                'MEDICAL_HISTORY_VIEWED',
                'ALLERGY_VIEWED',
                'MEDICATION_VIEWED',
                'REPORT_VIEWED',
                'PRESCRIPTION_VIEWED',
                'DIAGNOSIS_VIEWED',
                'CONSULTATION_CREATED',
                'CONSULTATION_COMPLETED'
            )
        )
);
-- ============================================================
-- 36. STRONGER ACCESS RULES
-- ============================================================
-- Only ONE APPROVED access record can exist between
-- the same patient and doctor at a time.
-- ============================================================

CREATE UNIQUE INDEX idx_one_active_patient_doctor_access
ON patient_doctor_access(patient_id, doctor_id)
WHERE status = 'APPROVED';

-- ============================================================
-- 37. VALIDATE CONSULTATION ACCESS
-- ============================================================

CREATE OR REPLACE FUNCTION validate_consultation_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_access_patient UUID;
    v_access_doctor UUID;
BEGIN

    -- If no access is attached, allow it.
    IF NEW.access_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT
        patient_id,
        doctor_id
    INTO
        v_access_patient,
        v_access_doctor
    FROM patient_doctor_access
    WHERE access_id = NEW.access_id;

    -- Access record must exist
    IF v_access_patient IS NULL THEN
        RAISE EXCEPTION
            'Invalid access_id: access record does not exist';
    END IF;

    -- Patient must match
    IF v_access_patient <> NEW.patient_id THEN
        RAISE EXCEPTION
            'Access record does not belong to this patient';
    END IF;

    -- Doctor must match
    IF v_access_doctor <> NEW.doctor_id THEN
        RAISE EXCEPTION
            'Access record does not belong to this doctor';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_consultation_access_trigger
BEFORE INSERT OR UPDATE
ON consultation_sessions
FOR EACH ROW
EXECUTE FUNCTION validate_consultation_access();


-- ============================================================
-- 38. GET CURRENT ACTIVE ACCESS
-- ============================================================

CREATE OR REPLACE FUNCTION get_active_patient_doctor_access(
    p_patient_id UUID,
    p_doctor_id UUID
)
RETURNS TABLE (
    access_id UUID,
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        access_id,
        approved_at,
        expires_at
    FROM patient_doctor_access
    WHERE patient_id = p_patient_id
      AND doctor_id = p_doctor_id
      AND status = 'APPROVED'
      AND expires_at IS NOT NULL
      AND expires_at > NOW()
      AND revoked_at IS NULL
    ORDER BY approved_at DESC
    LIMIT 1;
$$;


-- ============================================================
-- 39. EXPIRE OLD ACCESS RECORDS
-- ============================================================
-- Changes APPROVED access to EXPIRED when its expiry time
-- has passed.
--
-- IMPORTANT:
-- Actual access security is still checked using:
--
-- status = 'APPROVED'
-- AND expires_at > NOW()
--
-- This function simply keeps the status accurate.
-- ============================================================

CREATE OR REPLACE FUNCTION expire_patient_doctor_access()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN

    UPDATE patient_doctor_access
    SET
        status = 'EXPIRED',
        updated_at = NOW()
    WHERE status = 'APPROVED'
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
      AND revoked_at IS NULL;

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    RETURN v_expired_count;

END;
$$;

-- ============================================================
-- 40. REVOKE DOCTOR ACCESS
-- ============================================================
-- The patient can revoke an APPROVED access record.
-- ============================================================

CREATE OR REPLACE FUNCTION revoke_patient_doctor_access(
    p_access_id UUID,
    p_patient_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN

    UPDATE patient_doctor_access
    SET
        status = 'REVOKED',
        revoked_at = NOW(),
        updated_at = NOW()
    WHERE access_id = p_access_id
      AND patient_id = p_patient_id
      AND status = 'APPROVED'
      AND expires_at > NOW()
      AND revoked_at IS NULL;

    IF FOUND THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;

END;
$$;

-- ============================================================
-- 41. FINAL ACTIVE ACCESS CHECK
-- ============================================================

CREATE OR REPLACE FUNCTION has_active_patient_doctor_access(
    p_patient_id UUID,
    p_doctor_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN

    RETURN EXISTS (
        SELECT 1
        FROM patient_doctor_access
        WHERE patient_id = p_patient_id
          AND doctor_id = p_doctor_id

          -- Patient must have explicitly approved
          AND status = 'APPROVED'

          -- Access must have an expiry
          AND expires_at IS NOT NULL

          -- Expiry must still be in the future
          AND expires_at > NOW()

          -- Patient must not have revoked it
          AND revoked_at IS NULL
    );

END;
$$;

-- ============================================================
-- 42. EMERGENCY MEDICAL ACCESS
-- ============================================================
-- Used when normal patient consent cannot reasonably be
-- obtained because of an emergency.
--
-- IMPORTANT:
-- Emergency access is temporary and MUST be audited.
-- ============================================================

CREATE TABLE emergency_access (
    emergency_access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL,

    doctor_id UUID NOT NULL,

    hospital_id UUID,

    session_id UUID,

    -- Why emergency access was required
    reason TEXT NOT NULL,

    -- Doctor confirms that this is an emergency
    emergency_declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Emergency access is deliberately short-lived
    expires_at TIMESTAMPTZ NOT NULL,

    ended_at TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- ========================================================
    -- FOREIGN KEYS
    -- ========================================================

    CONSTRAINT fk_emergency_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_emergency_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_emergency_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospitals(hospital_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_emergency_session
        FOREIGN KEY (session_id)
        REFERENCES consultation_sessions(session_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- ========================================================
    -- STATUS
    -- ========================================================

    CONSTRAINT chk_emergency_status
        CHECK (
            status IN (
                'ACTIVE',
                'EXPIRED',
                'ENDED'
            )
        ),

    -- Expiry must be after emergency declaration
    CONSTRAINT chk_emergency_expiry
        CHECK (
            expires_at > emergency_declared_at
        ),

    -- Ended time must exist when manually ended
    CONSTRAINT chk_emergency_ended
        CHECK (
            status <> 'ENDED'
            OR ended_at IS NOT NULL
        )
);

-- ============================================================
-- 43. EMERGENCY ACCESS INDEXES
-- ============================================================

CREATE INDEX idx_emergency_patient
ON emergency_access(patient_id);

CREATE INDEX idx_emergency_doctor
ON emergency_access(doctor_id);

CREATE INDEX idx_emergency_hospital
ON emergency_access(hospital_id);

CREATE INDEX idx_emergency_session
ON emergency_access(session_id);

CREATE INDEX idx_emergency_status
ON emergency_access(status);

CREATE INDEX idx_emergency_expiry
ON emergency_access(expires_at);

-- ============================================================
-- 44. START EMERGENCY ACCESS
-- ============================================================

CREATE OR REPLACE FUNCTION start_emergency_access(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_hospital_id UUID,
    p_reason TEXT,
    p_duration_minutes INTEGER DEFAULT 60
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_emergency_access_id UUID;
BEGIN

    -- --------------------------------------------------------
    -- Basic validation
    -- --------------------------------------------------------

    IF p_reason IS NULL
       OR LENGTH(TRIM(p_reason)) = 0 THEN

        RAISE EXCEPTION
            'Emergency access requires a reason';

    END IF;


    IF p_duration_minutes <= 0
       OR p_duration_minutes > 240 THEN

        RAISE EXCEPTION
            'Emergency access duration must be between 1 and 240 minutes';

    END IF;


    -- --------------------------------------------------------
    -- Create emergency access
    -- --------------------------------------------------------

    INSERT INTO emergency_access (
        patient_id,
        doctor_id,
        hospital_id,
        reason,
        expires_at,
        status
    )
    VALUES (
        p_patient_id,
        p_doctor_id,
        p_hospital_id,
        p_reason,
        NOW() + make_interval(
            mins => p_duration_minutes
        ),
        'ACTIVE'
    )
    RETURNING emergency_access_id
    INTO v_emergency_access_id;


    RETURN v_emergency_access_id;

END;
$$;

-- ============================================================
-- 45. CHECK ACTIVE EMERGENCY ACCESS
-- ============================================================

CREATE OR REPLACE FUNCTION has_active_emergency_access(
    p_patient_id UUID,
    p_doctor_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN

    RETURN EXISTS (
        SELECT 1
        FROM emergency_access
        WHERE patient_id = p_patient_id
          AND doctor_id = p_doctor_id
          AND status = 'ACTIVE'
          AND expires_at > NOW()
          AND ended_at IS NULL
    );

END;
$$;

-- ============================================================
-- 46. END EMERGENCY ACCESS
-- ============================================================

CREATE OR REPLACE FUNCTION end_emergency_access(
    p_emergency_access_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN

    UPDATE emergency_access
    SET
        status = 'ENDED',
        ended_at = NOW()
    WHERE emergency_access_id = p_emergency_access_id
      AND status = 'ACTIVE'
      AND expires_at > NOW();

    IF FOUND THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;

END;
$$;

-- ============================================================
-- 47. EXPIRE EMERGENCY ACCESS
-- ============================================================

CREATE OR REPLACE FUNCTION expire_emergency_access()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN

    UPDATE emergency_access
    SET
        status = 'EXPIRED',
        ended_at = NOW()
    WHERE status = 'ACTIVE'
      AND expires_at <= NOW();

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    RETURN v_expired_count;

END;
$$;

-- ============================================================
-- 48. UPDATE AUDIT ACTIONS
-- ============================================================

ALTER TABLE audit_logs
DROP CONSTRAINT IF EXISTS chk_audit_action;

ALTER TABLE audit_logs
ADD CONSTRAINT chk_audit_action
CHECK (
    action IN (
        'QR_GENERATED',
        'QR_SCANNED',

        'ACCESS_REQUESTED',
        'ACCESS_APPROVED',
        'ACCESS_DECLINED',
        'ACCESS_REVOKED',
        'ACCESS_EXPIRED',

        'EMERGENCY_ACCESS_STARTED',
        'EMERGENCY_ACCESS_ENDED',
        'EMERGENCY_ACCESS_EXPIRED',

        'MEDICAL_HISTORY_VIEWED',
        'ALLERGY_VIEWED',
        'MEDICATION_VIEWED',
        'REPORT_VIEWED',
        'PRESCRIPTION_VIEWED',
        'DIAGNOSIS_VIEWED',

        'CONSULTATION_CREATED',
        'CONSULTATION_COMPLETED'
    )
);

-- ============================================================
-- 49. AUTHENTICATION SESSIONS
-- ============================================================
-- Stores active/login sessions for users.
--
-- The actual session token should be generated by the backend.
-- Store only a secure hash of the token.
-- ============================================================

CREATE TABLE auth_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ,

    last_used_at TIMESTAMPTZ,

    ip_address INET,

    user_agent TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_auth_session_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_auth_session_status
        CHECK (
            status IN (
                'ACTIVE',
                'EXPIRED',
                'REVOKED'
            )
        ),

    CONSTRAINT chk_auth_session_expiry
        CHECK (
            expires_at > created_at
        ),

    CONSTRAINT chk_auth_session_revoked
        CHECK (
            status <> 'REVOKED'
            OR revoked_at IS NOT NULL
        )
);

-- ============================================================
-- 50. AUTH SESSION INDEXES
-- ============================================================

CREATE INDEX idx_auth_sessions_user
ON auth_sessions(user_id);

CREATE INDEX idx_auth_sessions_status
ON auth_sessions(status);

CREATE INDEX idx_auth_sessions_expiry
ON auth_sessions(expires_at);

-- ============================================================
-- 51. IDENTITY / CREDENTIAL VERIFICATION
-- ============================================================

CREATE TABLE identity_verifications (
    verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    verification_type VARCHAR(40) NOT NULL,

    provider VARCHAR(100),

    external_reference TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    verified_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    failure_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_identity_verification_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_verification_type
        CHECK (
            verification_type IN (
                'ABHA',
                'AADHAAR_DIGILOCKER',
                'DOCTOR_REGISTRATION'
            )
        ),

    CONSTRAINT chk_verification_status
        CHECK (
            status IN (
                'PENDING',
                'VERIFIED',
                'FAILED',
                'EXPIRED'
            )
        ),

    CONSTRAINT chk_verified_at
        CHECK (
            status <> 'VERIFIED'
            OR verified_at IS NOT NULL
        )
);

-- ============================================================
-- 52. VERIFICATION INDEXES
-- ============================================================

CREATE INDEX idx_identity_verifications_user
ON identity_verifications(user_id);

CREATE INDEX idx_identity_verifications_type
ON identity_verifications(verification_type);

CREATE INDEX idx_identity_verifications_status
ON identity_verifications(status);

-- ============================================================
-- TEST DATA IS NOT INCLUDED IN THIS SCHEMA.
-- Keep fake patient/doctor/QR/consultation data in a separate test_data.sql file.

-- 53. VERIFICATION UPDATED_AT TRIGGER
-- ============================================================

CREATE TRIGGER update_identity_verifications_updated_at
BEFORE UPDATE ON identity_verifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
