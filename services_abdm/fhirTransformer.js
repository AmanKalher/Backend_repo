/**
 * FHIR R4 Document & Bundle Transformer for ABDM Compliance
 * Generates standard FHIR JSON resources:
 * - Patient
 * - Encounter / OPConsultation
 * - Condition
 * - MedicationRequest
 * - DiagnosticReport & Observation
 * - AllergyIntolerance
 * - Immunization
 */

export function createFhirPatientResource(patient) {
    if (!patient) return null;
    return {
        resourceType: "Patient",
        id: patient.patient_id || "patient-01",
        identifier: [
            ...(patient.abha_id ? [{
                system: "https://healthid.abdm.gov.in",
                value: patient.abha_id,
                type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "MR", display: "ABHA Number/Address" }] }
            }] : [])
        ],
        name: [{
            use: "official",
            text: `${patient.first_name || ""} ${patient.last_name || ""}`.trim(),
            family: patient.last_name || "",
            given: [patient.first_name || ""]
        }],
        gender: (patient.gender || "other").toLowerCase(),
        birthDate: patient.date_of_birth ? new Date(patient.date_of_birth).toISOString().split("T")[0] : undefined
    };
}

export function createFhirBundle({ patient, diagnoses = [], medications = [], labReports = [], imagingStudies = [], allergies = [], vaccinations = [] }) {
    const bundleId = `bundle-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const patientResource = createFhirPatientResource(patient);

    const entries = [];

    if (patientResource) {
        entries.push({
            fullUrl: `urn:uuid:${patientResource.id}`,
            resource: patientResource
        });
    }

    // Allergies
    allergies.forEach((alg, idx) => {
        entries.push({
            fullUrl: `urn:uuid:allergy-${idx}`,
            resource: {
                resourceType: "AllergyIntolerance",
                id: alg.allergy_id || `alg-${idx}`,
                clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", code: "active" }] },
                verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", code: alg.verified ? "confirmed" : "unconfirmed" }] },
                code: { text: alg.allergen },
                patient: { reference: `urn:uuid:${patientResource?.id}` },
                reaction: [{
                    manifestation: [{ text: alg.reaction || "Allergic response" }],
                    severity: (alg.severity || "moderate").toLowerCase()
                }]
            }
        });
    });

    // Diagnoses / Conditions
    diagnoses.forEach((diag, idx) => {
        entries.push({
            fullUrl: `urn:uuid:condition-${idx}`,
            resource: {
                resourceType: "Condition",
                id: diag.diagnosis_id || `cond-${idx}`,
                clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: (diag.status || "active").toLowerCase() }] },
                code: { text: diag.diagnosis_name || diag.condition_name },
                subject: { reference: `urn:uuid:${patientResource?.id}` },
                recordedDate: diag.diagnosed_date || timestamp
            }
        });
    });

    // Medications
    medications.forEach((med, idx) => {
        entries.push({
            fullUrl: `urn:uuid:med-req-${idx}`,
            resource: {
                resourceType: "MedicationRequest",
                id: med.patient_medication_id || `med-${idx}`,
                status: (med.status || "active").toLowerCase(),
                intent: "order",
                medicationCodeableConcept: { text: med.name || med.medication_name || "Prescribed Medicine" },
                subject: { reference: `urn:uuid:${patientResource?.id}` },
                dosageInstruction: [{
                    text: `${med.dosage || ""} ${med.frequency || ""} ${med.route || "Oral"}`.trim()
                }]
            }
        });
    });

    // Lab Reports
    labReports.forEach((lab, idx) => {
        entries.push({
            fullUrl: `urn:uuid:diagnostic-report-${idx}`,
            resource: {
                resourceType: "DiagnosticReport",
                id: lab.lab_report_id || `lab-${idx}`,
                status: "final",
                category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "LAB", display: "Laboratory" }] }],
                code: { text: lab.test_name || lab.report_title },
                subject: { reference: `urn:uuid:${patientResource?.id}` },
                effectiveDateTime: lab.report_date || timestamp,
                conclusion: lab.result_summary || "See attached diagnostic document",
                presentedForm: lab.file_reference ? [{
                    contentType: lab.file_type || "application/pdf",
                    url: lab.file_reference,
                    title: lab.report_title
                }] : []
            }
        });
    });

    // Immunizations
    vaccinations.forEach((vac, idx) => {
        entries.push({
            fullUrl: `urn:uuid:immunization-${idx}`,
            resource: {
                resourceType: "Immunization",
                id: vac.vaccination_id || `vac-${idx}`,
                status: (vac.status || "completed").toLowerCase(),
                vaccineCode: { text: vac.vaccine_name },
                patient: { reference: `urn:uuid:${patientResource?.id}` },
                occurrenceDateTime: vac.administration_date || timestamp,
                lotNumber: vac.batch_number || undefined,
                manufacturer: vac.manufacturer ? { display: vac.manufacturer } : undefined
            }
        });
    });

    return {
        resourceType: "Bundle",
        id: bundleId,
        meta: {
            lastUpdated: timestamp,
            profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
        },
        type: "document",
        timestamp,
        entry: entries
    };
}
