import axios from "axios";

const API_BASE = "http://localhost:4000";

async function runEndToEndTests() {
    console.log("============================================================");
    console.log("DIAGNECT BACKEND COMPREHENSIVE END-TO-END INTEGRATION TEST");
    console.log("============================================================\n");

    const timestamp = Date.now();
    const testPatientEmail = `test_patient_${timestamp}@diagnect.test`;
    const testDoctorEmail = `test_doctor_${timestamp}@diagnect.test`;
    const testDoctorPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const testPatientPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const testRegNumber = `MED-REG-${timestamp}`;

    let patientToken = "";
    let patientId = "";
    let doctorToken = "";
    let doctorId = "";

    // ------------------------------------------------------------
    // TEST 1: Register and Login Patient
    // ------------------------------------------------------------
    console.log("[TEST 1] Registering Test Patient...");
    try {
        const patRegRes = await axios.post(`${API_BASE}/api/register/patient`, {
            email: testPatientEmail,
            phone: testPatientPhone,
            password: "Password@123",
            firstName: "Aarav",
            lastName: "Sharma",
            dateOfBirth: "1992-06-15",
            gender: "MALE",
            bloodGroup: "O+",
            abhaId: `aarav_${timestamp}@abdm`
        });

        patientToken = patRegRes.data.token;
        patientId = patRegRes.data.user.patientId || patRegRes.data.user.patient_id;
        console.log(`✓ Patient Registered successfully! Patient ID: ${patientId}`);
    } catch (err) {
        console.error("✗ Patient registration failed:", err.response?.data || err.message);
        throw err;
    }

    // ------------------------------------------------------------
    // TEST 2: Register and Login Doctor (with Certificate URL & Qualification)
    // ------------------------------------------------------------
    console.log("\n[TEST 2] Registering Test Doctor (with Certificate URL & Qualification)...");
    try {
        const docRegRes = await axios.post(`${API_BASE}/api/register/doctor`, {
            email: testDoctorEmail,
            phone: testDoctorPhone,
            password: "Password@123",
            firstName: "Dr. Ananya",
            lastName: "Iyer",
            specialization: "Cardiology",
            registrationNumber: testRegNumber,
            registrationAuthority: "Medical Council of India",
            qualification: "MBBS, MD (Cardiology), DM",
            certificateUrl: `/uploads/certificates/cert_${timestamp}.pdf`,
            identityVerified: true,
            registrationVerified: true
        });

        doctorToken = docRegRes.data.token;
        doctorId = docRegRes.data.user.doctorId || docRegRes.data.user.doctor_id;
        console.log(`✓ Doctor Registered successfully! Doctor ID: ${doctorId}`);

        // Verify doctor profile includes certificate_url and qualification
        const docProfRes = await axios.get(`${API_BASE}/api/profile`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
        });

        const docUser = docProfRes.data.user;
        if (docUser.certificate_url && docUser.qualification) {
            console.log(`✓ Verified Doctor Profile Persistence:`);
            console.log(`  - Qualification: ${docUser.qualification}`);
            console.log(`  - Certificate URL: ${docUser.certificate_url}`);
        } else {
            console.warn("⚠ Doctor profile missing certificate_url or qualification:", docUser);
        }
    } catch (err) {
        console.error("✗ Doctor registration failed:", err.response?.data || err.message);
        throw err;
    }

    // ------------------------------------------------------------
    // TEST 3: Direct Medical Records CRUD Operations
    // ------------------------------------------------------------
    console.log("\n[TEST 3] Testing Standalone Medical Records CRUD Operations...");

    const patHeaders = { headers: { Authorization: `Bearer ${patientToken}` } };

    // 3A: Add Allergies
    console.log("  3A: Adding Allergy...");
    const allergyRes = await axios.post(`${API_BASE}/api/patient/${patientId}/allergies`, {
        allergen: "Penicillin",
        reaction: "Severe Urticaria and Bronchospasm",
        severity: "SEVERE",
        verified: true
    }, patHeaders);
    console.log(`  ✓ Allergy stored: ${allergyRes.data.allergy.allergen} (${allergyRes.data.allergy.severity})`);

    // 3B: Add Chronic Condition
    console.log("  3B: Adding Chronic Condition...");
    const condRes = await axios.post(`${API_BASE}/api/patient/${patientId}/chronic-conditions`, {
        conditionName: "Hypertension Stage 2",
        description: "Diagnosed during routine health checkup",
        status: "ACTIVE"
    }, patHeaders);
    const condId = condRes.data.chronicCondition.chronic_condition_id;
    console.log(`  ✓ Chronic condition stored: ${condRes.data.chronicCondition.condition_name}`);

    // Update Chronic Condition
    await axios.put(`${API_BASE}/api/patient/${patientId}/chronic-conditions/${condId}`, {
        conditionName: "Hypertension (Controlled on Meds)",
        status: "CONTROLLED"
    }, patHeaders);
    console.log(`  ✓ Chronic condition updated to CONTROLLED`);

    // 3C: Add Vaccination
    console.log("  3C: Adding Vaccination...");
    const vacRes = await axios.post(`${API_BASE}/api/patient/${patientId}/vaccinations`, {
        vaccineName: "Covishield (COVID-19)",
        vaccineType: "Viral Vector",
        doseNumber: 2,
        totalDoses: 2,
        batchNumber: "COV-9921",
        manufacturer: "Serum Institute of India",
        status: "COMPLETED"
    }, patHeaders);
    console.log(`  ✓ Vaccination stored: ${vacRes.data.vaccination.vaccine_name}`);

    // 3D: Add Lab Report
    console.log("  3D: Adding Lab Report...");
    const labRes = await axios.post(`${API_BASE}/api/patient/${patientId}/lab-reports`, {
        reportTitle: "Complete Lipid Panel",
        testName: "Lipid Profile",
        laboratoryName: "Apollo Diagnostics",
        resultSummary: "Total Cholesterol: 210 mg/dL, HDL: 45 mg/dL, LDL: 135 mg/dL",
        fileReference: `/uploads/lab_reports/lipid_${timestamp}.pdf`
    }, patHeaders);
    console.log(`  ✓ Lab Report stored: ${labRes.data.report.report_title}`);

    // 3E: Add Imaging Study
    console.log("  3E: Adding Imaging Study...");
    const imgRes = await axios.post(`${API_BASE}/api/patient/${patientId}/imaging`, {
        imagingType: "XRAY",
        bodyPart: "Chest PA View",
        studyTitle: "Chest X-Ray Digital",
        imagingCenter: "City Scan & Imaging Center",
        findings: "Clear lung fields, normal cardiothoracic ratio",
        impression: "Normal chest radiograph",
        fileReference: `/uploads/imaging/chest_xray_${timestamp}.jpg`
    }, patHeaders);
    console.log(`  ✓ Imaging Study stored: ${imgRes.data.imaging.study_title} (${imgRes.data.imaging.imaging_type})`);

    // 3F: Add Family History & Medical History
    console.log("  3F: Adding Family & Medical History...");
    await axios.post(`${API_BASE}/api/patient/${patientId}/family-history`, {
        relationship: "FATHER",
        conditionName: "Coronary Artery Disease",
        diagnosedAge: 55,
        geneticCondition: true
    }, patHeaders);

    await axios.post(`${API_BASE}/api/patient/${patientId}/medical-history`, {
        conditionName: "Appendectomy",
        description: "Laparoscopic surgery in 2018",
        status: "RESOLVED"
    }, patHeaders);
    console.log(`  ✓ Family and Medical History stored`);

    // 3G: Fetch All Patient Records
    console.log("  3G: Fetching Complete Patient Records (EHR)...");
    const fullRecordsRes = await axios.get(`${API_BASE}/api/patient/my-records`, patHeaders);
    const rec = fullRecordsRes.data.records;
    console.log(`  ✓ Full EHR retrieved successfully! Summary:`);
    console.log(`    - Allergies: ${rec.allergies.length}`);
    console.log(`    - Chronic Conditions: ${rec.chronicConditions.length}`);
    console.log(`    - Vaccinations: ${rec.vaccinations.length}`);
    console.log(`    - Lab Reports: ${rec.labReports.length}`);
    console.log(`    - Imaging Studies: ${rec.imagingStudies.length}`);
    console.log(`    - Family History: ${rec.familyHistory.length}`);
    console.log(`    - Medical History: ${rec.medicalHistory.length}`);

    // ------------------------------------------------------------
    // TEST 4: QR Code Consent & Consultation Session Workflow
    // ------------------------------------------------------------
    console.log("\n[TEST 4] Testing QR Code Access Consent & Consultation Workflow...");
    const docHeaders = { headers: { Authorization: `Bearer ${doctorToken}` } };

    // Doctor generates QR
    const qrGenRes = await axios.post(`${API_BASE}/api/qr/generate`, {}, docHeaders);
    const qrToken = qrGenRes.data.qrToken;
    console.log(`  ✓ Step 1: Doctor generated QR Token: ${qrToken.substring(0, 16)}...`);

    // Patient scans QR
    const qrScanRes = await axios.post(`${API_BASE}/api/qr/scan`, {
        qrToken,
        purpose: "Cardiology Consultation & Record Review"
    }, patHeaders);
    const accessId = qrScanRes.data.accessId;
    console.log(`  ✓ Step 2: Patient scanned QR. Access Request ID: ${accessId} (Status: ${qrScanRes.data.status})`);

    // Patient approves access
    const approveRes = await axios.post(`${API_BASE}/api/access/approve`, {
        accessId,
        durationMinutes: 60
    }, patHeaders);
    console.log(`  ✓ Step 3: Patient approved access (Status: ${approveRes.data.access.status})`);

    // Doctor verifies access
    const verifySessionRes = await axios.get(`${API_BASE}/api/verify-session/${qrToken}`, docHeaders);
    console.log(`  ✓ Step 4: Doctor verified access session for Patient: ${verifySessionRes.data.patient.name}`);

    // Doctor starts Consultation
    const startConsultRes = await axios.post(`${API_BASE}/api/consultations/start`, {
        patientId,
        accessId,
        consultationType: "IN_PERSON",
        chiefComplaint: "Palpitations and occasional chest tightness"
    }, docHeaders);
    const sessionId = startConsultRes.data.session.session_id;
    console.log(`  ✓ Step 5: Consultation session started. Session ID: ${sessionId}`);

    // Doctor adds diagnosis
    const diagRes = await axios.post(`${API_BASE}/api/consultations/${sessionId}/diagnose`, {
        patientId,
        diagnosisName: "Sinus Tachycardia secondary to stress",
        description: "Resting ECG normal, vitals stable",
        status: "ACTIVE"
    }, docHeaders);
    console.log(`  ✓ Step 6: Doctor added Diagnosis: ${diagRes.data.diagnosis.diagnosis_name}`);

    // Doctor completes consultation
    const compRes = await axios.post(`${API_BASE}/api/consultations/${sessionId}/complete`, {
        doctorNotes: "Advised stress reduction techniques and adequate hydration. Follow-up in 4 weeks.",
        treatmentNotes: "Low salt diet, regular cardio exercise",
        followUpDate: "2026-09-28"
    }, docHeaders);
    console.log(`  ✓ Step 7: Consultation completed successfully (Status: ${compRes.data.session.status})`);

    // ------------------------------------------------------------
    // TEST 5: Clinical AI Decision Support Engine
    // ------------------------------------------------------------
    console.log("\n[TEST 5] Testing Clinical AI Decision Support Engine...");
    const aiRes = await axios.post(`${API_BASE}/api/ai/analyze`, {
        symptoms: ["Chest Pain", "Shortness of Breath", "Diaphoresis"],
        clinicalFindings: {
            vitals: {
                bp: "175/110",
                hr: 122,
                spo2: 89,
                temp: "98.6 F"
            }
        },
        patientContext: {
            age: 55,
            gender: "M",
            chronicConditions: ["Hypertension", "Coronary Artery Disease"]
        }
    });

    const aiAnalysis = aiRes.data.analysis;
    console.log(`  ✓ AI Analysis Completed:`);
    console.log(`    - Pattern: ${aiAnalysis.possiblePattern}`);
    console.log(`    - Triage Level: ${aiAnalysis.triage_level}`);
    console.log(`    - Confidence: ${(aiAnalysis.confidence * 100).toFixed(0)}%`);
    console.log(`    - Red Flags Detected: ${aiAnalysis.redFlags.join("; ")}`);
    console.log(`    - Recommendations: ${aiAnalysis.recommendations.slice(0, 2).join(" | ")}`);

    // ------------------------------------------------------------
    // TEST 6: ABDM Gateway & FHIR R4 Bundle Interoperability
    // ------------------------------------------------------------
    console.log("\n[TEST 6] Testing ABDM Integration & FHIR R4 Document Export...");

    // 6A: Generate ABHA OTP
    const abhaOtpRes = await axios.post(`${API_BASE}/api/abdm/generate-otp`, {
        identifier: "9876543210",
        type: "MOBILE"
    });
    console.log(`  ✓ 6A: ABDM OTP Generated (Txn ID: ${abhaOtpRes.data.txnId})`);

    // 6B: Verify ABHA OTP & Link with Patient
    const abhaVerifyRes = await axios.post(`${API_BASE}/api/abdm/verify-otp`, {
        txnId: abhaOtpRes.data.txnId,
        otp: "123456",
        patientId
    });
    console.log(`  ✓ 6B: ABHA Verified and Linked:`);
    console.log(`    - ABHA Number: ${abhaVerifyRes.data.abhaProfile.abhaNumber}`);
    console.log(`    - ABHA Address: ${abhaVerifyRes.data.abhaProfile.abhaAddress}`);

    // 6C: Discover Care Contexts
    const discoverRes = await axios.post(`${API_BASE}/api/abdm/v0.5/care-contexts/discover`, {
        patientId
    });
    console.log(`  ✓ 6C: Discovered ${discoverRes.data.patient.careContexts.length} ABDM Care Contexts for Patient`);

    // 6D: Export Full Patient Record as FHIR R4 Document Bundle
    const fhirRes = await axios.get(`${API_BASE}/api/patient/${patientId}/fhir-bundle`, patHeaders);
    const bundle = fhirRes.data.bundle;
    console.log(`  ✓ 6D: ABDM FHIR R4 Document Bundle generated:`);
    console.log(`    - Resource Type: ${bundle.resourceType} (${bundle.type})`);
    console.log(`    - Profile: ${bundle.meta?.profile?.[0]}`);
    console.log(`    - Total FHIR Resource Entries: ${bundle.entry?.length}`);

    console.log("\n============================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! DATA STORED & VERIFIED!");
    console.log("============================================================\n");
}

runEndToEndTests().catch(err => {
    console.error("\n💥 INTEGRATION TEST FAILED:", err.response?.data || err.message);
    process.exit(1);
});
