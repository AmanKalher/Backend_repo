/**
 * Multi-Factor Clinical Confidence Engine
 * 
 * Computes numeric confidence scores (0.00 to 1.00) based on:
 * 1. Symptom Match Strength (hallmark symptoms vs non-specific complaints)
 * 2. Vitals Severity & Physiological Alignment
 * 3. Patient History & Chronic Condition Relevance
 */

import { hasSymptom, hasCondition } from './utils.js';

/**
 * Computes confidence for a specific clinical pattern.
 * 
 * @param {string} domain - e.g. 'cardiopulmonary' | 'bronchospasm' | 'respiratory' | 'febrile' | 'gi' | 'neuro' | 'urinary'
 * @param {Object} normalizedData - Normalized clinical data
 * @returns {number} Confidence score as a float between 0.00 and 1.00
 */
export function computePatternConfidence(domain, normalizedData) {
  const { symptoms = [], clinicalFindings = {}, patientContext = {} } = normalizedData;
  const vitals = clinicalFindings.vitals || {};
  const chronic = patientContext.chronicConditions || [];
  const history = patientContext.pastMedicalHistory || [];

  let baseScore = 0.50;

  switch (domain) {
    case 'cardiopulmonary': {
      let score = 0.60;
      if (hasSymptom(symptoms, 'Chest pain')) score += 0.20;
      if (hasSymptom(symptoms, 'Shortness of breath')) score += 0.10;
      if (hasSymptom(symptoms, 'Palpitations') || hasSymptom(symptoms, 'Dizziness')) score += 0.05;
      if (vitals.hr && vitals.hr > 100) score += 0.08;
      if (vitals.spo2 && vitals.spo2 < 95) score += 0.08;
      if (hasCondition([...chronic, ...history], /hypertension|cardiac|cad|infarction|heart/i)) score += 0.08;
      return clampConfidence(score);
    }

    case 'bronchospasm': {
      let score = 0.65;
      if (hasCondition([...chronic, ...history], /asthma|reactive airway|copd/i)) score += 0.15;
      if (hasSymptom(symptoms, 'Wheezing')) score += 0.12;
      if (hasSymptom(symptoms, 'Shortness of breath')) score += 0.08;
      if (hasSymptom(symptoms, 'Cough')) score += 0.06;
      if (vitals.spo2 && vitals.spo2 < 95) score += 0.08;
      return clampConfidence(score);
    }

    case 'respiratory_infection': {
      let score = 0.60;
      if (hasSymptom(symptoms, 'Cough')) score += 0.12;
      if (hasSymptom(symptoms, 'Fever') || vitals.temp?.isFever) score += 0.12;
      if (hasSymptom(symptoms, 'Sore throat') || hasSymptom(symptoms, 'Nasal congestion')) score += 0.08;
      if (hasSymptom(symptoms, 'Chest tightness')) score += 0.05;
      return clampConfidence(score);
    }

    case 'febrile_prodrome': {
      let score = 0.55;
      if (hasSymptom(symptoms, 'Fever') || vitals.temp?.isFever) score += 0.20;
      if (hasSymptom(symptoms, 'Chills') || hasSymptom(symptoms, 'Fatigue')) score += 0.10;
      if (hasSymptom(symptoms, 'Weakness') || hasSymptom(symptoms, 'Loss of appetite')) score += 0.05;
      return clampConfidence(score);
    }

    case 'gastrointestinal': {
      let score = 0.58;
      if (hasSymptom(symptoms, 'Abdominal pain') || hasSymptom(symptoms, 'Vomiting')) score += 0.15;
      if (hasSymptom(symptoms, 'Nausea') || hasSymptom(symptoms, 'Diarrhea')) score += 0.12;
      if (hasCondition([...chronic, ...history], /gerd|gastric|ulcer|ibs/i)) score += 0.08;
      return clampConfidence(score);
    }

    case 'neurological': {
      let score = 0.55;
      if (hasSymptom(symptoms, 'Headache')) score += 0.15;
      if (hasSymptom(symptoms, 'Dizziness') || hasSymptom(symptoms, 'Confusion')) score += 0.12;
      if (vitals.bp?.systolic && vitals.bp.systolic >= 140) score += 0.08;
      if (hasCondition([...chronic, ...history], /migraine|neuropathy|stroke/i)) score += 0.08;
      return clampConfidence(score);
    }

    case 'urinary': {
      let score = 0.60;
      if (hasSymptom(symptoms, 'Painful urination')) score += 0.20;
      if (hasSymptom(symptoms, 'Increased frequency') || hasSymptom(symptoms, 'Flank pain')) score += 0.10;
      if (hasSymptom(symptoms, 'Blood in urine')) score += 0.10;
      return clampConfidence(score);
    }

    default:
      return clampConfidence(baseScore);
  }
}

/**
 * Computes root overall diagnostic confidence.
 * 
 * @param {Array<{ confidence: number }>} possiblePatterns
 * @returns {number} Primary confidence rounded to 2 decimal places
 */
export function computeOverallConfidence(possiblePatterns) {
  if (!possiblePatterns || possiblePatterns.length === 0) {
    return 0.50;
  }

  const highestConfidence = Math.max(...possiblePatterns.map((p) => p.confidence || 0));
  return parseFloat(highestConfidence.toFixed(2));
}

function clampConfidence(val) {
  return parseFloat(Math.min(Math.max(val, 0.25), 0.98).toFixed(2));
}

export default {
  computePatternConfidence,
  computeOverallConfidence,
};

