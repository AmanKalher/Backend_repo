/**
 * ABDM (Ayushman Bharat Digital Mission) Constants & Configuration
 */

export const ABDM_GATEWAY_URL = process.env.ABDM_GATEWAY_URL || "https://dev.abdm.gov.in/gateway/v0.5";
export const ABDM_SBX_URL = process.env.ABDM_SBX_URL || "https://healthidsbx.abdm.gov.in/api/v1";

export const ABDM_CLIENT_ID = process.env.ABDM_CLIENT_ID || "";
export const ABDM_CLIENT_SECRET = process.env.ABDM_CLIENT_SECRET || "";
export const ABDM_HIP_ID = process.env.ABDM_HIP_ID || "DIAGNECT_HIP_01";
export const ABDM_HIU_ID = process.env.ABDM_HIU_ID || "DIAGNECT_HIU_01";

export const CONSENT_STATUS = {
    REQUESTED: "REQUESTED",
    GRANTED: "GRANTED",
    DENIED: "DENIED",
    REVOKED: "REVOKED",
    EXPIRED: "EXPIRED"
};

export const HI_TYPES = {
    PRESCRIPTION: "Prescription",
    DIAGNOSTIC_REPORT: "DiagnosticReport",
    OP_CONSULTATION: "OPConsultation",
    DISCHARGE_SUMMARY: "DischargeSummary",
    IMMUNIZATION_RECORD: "ImmunizationRecord",
    HEALTH_DOCUMENT_RECORD: "HealthDocumentRecord"
};

export const PURPOSE_CODES = {
    CARE_MANAGEMENT: "CAREMGT",
    BREAK_THE_GLASS: "BTG",
    PUBLIC_HEALTH: "PUBHLTH",
    HEALTHCARE_PAYMENT: "HPAYMT",
    DISEASE_SPECIFIC_HEALTHCARE_RESEARCH: "DSRCH",
    SELF_REQUESTED: "PATRQT"
};
