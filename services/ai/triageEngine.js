/**
 * Deterministic Clinical Triage Engine
 * 
 * Rules:
 * - SpO2 < 92 → Urgent
 * - HR > 120 → Urgent
 * - BP ≥ 180 (systolic) OR ≥ 120 (diastolic) → Urgent
 * - BP ≤ 90 (systolic) → Urgent (Shock / Severe Hypotension)
 * - Critical Red Flag Symptoms (Chest pain, Shortness of breath, Fainting, etc.) → Urgent
 * - Moderate if: SpO2 92–94, HR 100–120 / < 50, BP ≥ 140/90, Temp ≥ 101°F
 * - Low otherwise
 */

import { CRITICAL_RED_FLAGS } from './utils.js';

/**
 * Evaluates clinical risk level and compiles active red flags.
 * 
 * @param {Object} normalizedData - Normalized clinical object from normalizer.js
 * @returns {{ triage_level: 'Low'|'Moderate'|'Urgent', redFlags: string[] }}
 */
export function evaluateTriage(normalizedData) {
  const { symptoms = [], clinicalFindings = {} } = normalizedData || {};
  const vitals = clinicalFindings.vitals || {};

  const redFlags = [];
  let isUrgent = false;
  let isModerate = false;

  // 1. Evaluate Symptom Red Flags
  symptoms.forEach((symptom) => {
    if (CRITICAL_RED_FLAGS.some((crf) => crf.toLowerCase() === symptom.toLowerCase())) {
      redFlags.push(symptom);
      isUrgent = true;
    }
  });

  // 2. Evaluate Oxygen Saturation (SpO2)
  if (vitals.spo2 !== null && vitals.spo2 !== undefined) {
    if (vitals.spo2 < 92) {
      redFlags.push(`Critical Hypoxemia (SpO2: ${vitals.spo2}%)`);
      isUrgent = true;
    } else if (vitals.spo2 < 95) {
      isModerate = true;
    }
  }

  // 3. Evaluate Heart Rate (HR)
  if (vitals.hr !== null && vitals.hr !== undefined) {
    if (vitals.hr > 120) {
      redFlags.push(`Severe Tachycardia (HR: ${vitals.hr} bpm)`);
      isUrgent = true;
    } else if (vitals.hr < 45) {
      redFlags.push(`Critical Bradycardia (HR: ${vitals.hr} bpm)`);
      isUrgent = true;
    } else if (vitals.hr > 100 || vitals.hr < 55) {
      isModerate = true;
    }
  }

  // 4. Evaluate Blood Pressure (BP)
  if (vitals.bp?.systolic !== null && vitals.bp?.systolic !== undefined) {
    const sys = vitals.bp.systolic;
    const dia = vitals.bp.diastolic;

    if (sys >= 180 || (dia !== null && dia >= 120)) {
      redFlags.push(`Hypertensive Crisis (BP: ${sys}/${dia ?? '?'})`);
      isUrgent = true;
    } else if (sys <= 90 || (dia !== null && dia <= 50)) {
      redFlags.push(`Severe Hypotension (BP: ${sys}/${dia ?? '?'})`);
      isUrgent = true;
    } else if (sys >= 140 || (dia !== null && dia >= 90)) {
      isModerate = true;
    }
  }

  // 5. Evaluate Temperature
  if (vitals.temp?.valueInF !== null && vitals.temp?.valueInF !== undefined) {
    if (vitals.temp.valueInF >= 102.5) {
      isModerate = true;
    } else if (vitals.temp.isFever) {
      isModerate = true;
    }
  }

  // Classify Triage Level
  let triage_level = 'Low';
  if (isUrgent) {
    triage_level = 'Urgent';
  } else if (isModerate) {
    triage_level = 'Moderate';
  }

  return {
    triage_level,
    redFlags,
  };
}

export default {
  evaluateTriage,
};

