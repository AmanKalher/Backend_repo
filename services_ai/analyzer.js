/**
 * DiagNect Standalone Clinical Reasoning Engine
 * 
 * Main Entry Point: analyzeClinicalData(input)
 * 
 * Pure function-based architecture with zero Express/HTTP/database dependencies.
 * Ready for immediate import into any external backend.
 */

import { normalizeClinicalData } from './normalizer.js';
import { evaluateTriage } from './triageEngine.js';
import { computePatternConfidence, computeOverallConfidence } from './confidenceEngine.js';
import { hasSymptom, hasCondition, ALLERGY_CONTRAINDICATIONS } from './utils.js';

/**
 * Performs full clinical analysis, triage risk-stratification, and differential evaluation.
 * 
 * @param {Object} input - Raw clinical payload
 * @param {string} [input.patientId] - Patient identifier
 * @param {string[]} [input.symptoms] - Reported symptoms list
 * @param {Object} [input.clinicalFindings] - Chief complaint, vitals, clinical notes
 * @param {Object} [input.patientContext] - Demographics, chronic conditions, history, allergies, meds
 * @returns {Promise<{
 *   possiblePattern: string,
 *   possiblePatterns: Array<{ name: string, confidence: number, reason: string }>,
 *   evidence: string[],
 *   redFlags: string[],
 *   clinicalConsiderations: string,
 *   recommendations: string[],
 *   triage_level: 'Low'|'Moderate'|'Urgent',
 *   confidence: number
 * }>}
 */
export async function analyzeClinicalData(input) {
  // 1. Normalize all clinical inputs (vitals, symptoms, context)
  const normalized = normalizeClinicalData(input);

  // 2. Evaluate Deterministic Triage Level and Red Flags
  const triage = evaluateTriage(normalized);

  const {
    symptoms = [],
    clinicalFindings = {},
    patientContext = {},
  } = normalized;

  const vitals = clinicalFindings.vitals || {};
  const chronic = patientContext.chronicConditions || [];
  const history = patientContext.pastMedicalHistory || [];
  const allergies = patientContext.allergies || [];
  const combinedHistory = [...chronic, ...history];

  // 3. Synthesize Evidence Checklist
  const evidence = [...symptoms];
  chronic.forEach((c) => evidence.push(`History: ${c}`));
  if (clinicalFindings.chiefComplaint) {
    evidence.push(`Chief Complaint: ${clinicalFindings.chiefComplaint}`);
  }
  if (vitals.bp?.systolic) {
    evidence.push(`BP: ${vitals.bp.systolic}/${vitals.bp.diastolic ?? '?'}`);
  }
  if (vitals.spo2) {
    evidence.push(`SpO2: ${vitals.spo2}%`);
  }
  if (vitals.hr) {
    evidence.push(`Heart Rate: ${vitals.hr} bpm`);
  }

  // 4. Clinical Domain Assessment
  const hasCardioSymptoms = ['Chest pain', 'Palpitations', 'Dizziness', 'Fainting'].some((s) => hasSymptom(symptoms, s));
  const hasRespSymptoms = ['Cough', 'Shortness of breath', 'Wheezing', 'Chest tightness', 'Sore throat', 'Nasal congestion'].some((s) => hasSymptom(symptoms, s));
  const hasAsthmaHistory = hasCondition(combinedHistory, /asthma|reactive airway|copd/i);
  const hasFebrileSymptoms = ['Fever', 'Chills', 'Fatigue', 'Weakness', 'Loss of appetite'].some((s) => hasSymptom(symptoms, s));
  const hasGISymptoms = ['Nausea', 'Vomiting', 'Abdominal pain', 'Diarrhea', 'Constipation'].some((s) => hasSymptom(symptoms, s));
  const hasNeuroSymptoms = ['Headache', 'Confusion', 'Numbness', 'Seizure'].some((s) => hasSymptom(symptoms, s));
  const hasUrinarySymptoms = ['Painful urination', 'Increased frequency', 'Blood in urine', 'Flank pain'].some((s) => hasSymptom(symptoms, s));

  const possiblePatterns = [];
  let possiblePattern = 'Multi-system presentation with non-specific clinical findings';
  let clinicalConsiderations = 'Correlate clinical findings with patient history and baseline diagnostics. Monitor symptom trajectory and vital signs.';
  let recommendations = [
    'Perform targeted physical examination',
    'Review chronological progression against baseline clinical records',
  ];

  // 4A. Cardiopulmonary Pattern
  if (hasCardioSymptoms || triage.triage_level === 'Urgent') {
    possiblePattern = 'Potential cardiopulmonary or thoracic symptom pattern';
    const confidenceScore = computePatternConfidence('cardiopulmonary', normalized);

    possiblePatterns.push({
      name: 'Cardiopulmonary / Thoracic Symptom Pattern',
      confidence: confidenceScore,
      reason: 'Acute thoracic indicators or vital anomalies detected requiring priority cardiopulmonary evaluation.',
    });

    possiblePatterns.push({
      name: 'Atypical Thoracic Musculoskeletal Strain',
      confidence: 0.38,
      reason: 'Differential consideration if chest discomfort is localized or reproducible on chest wall palpation.',
    });

    clinicalConsiderations = 'Consider evaluating urgent 12-lead ECG, continuous SpO2 monitoring, and targeted cardiopulmonary examination. Maintain vigilance regarding recorded medication allergies.';
    recommendations = [
      'Obtain immediate 12-lead ECG and continuous cardiac rhythm monitoring',
      'Evaluate vital signs including high-sensitivity cardiac biomarkers if clinically indicated',
      'Review allergies before administering any analgesics or cardiovascular agents',
    ];
  }
  // 4B. Bronchospasm Pattern (Respiratory + Asthma background)
  else if (hasRespSymptoms && hasAsthmaHistory) {
    possiblePattern = 'Respiratory symptoms with possible bronchospasm';
    const confidenceScore = computePatternConfidence('bronchospasm', normalized);

    possiblePatterns.push({
      name: 'Acute Bronchospasm / Asthma Flare',
      confidence: confidenceScore,
      reason: 'Acute respiratory symptoms presenting on a confirmed background of reactive airway disease / bronchial asthma.',
    });

    possiblePatterns.push({
      name: 'Acute Bronchitis / Viral Respiratory Infection',
      confidence: 0.58,
      reason: 'Concurrent constitutional febrile or upper airway findings.',
    });

    clinicalConsiderations = 'Consider evaluating asthma exacerbation versus infectious causes. Review respiratory status, auscultation findings, and peak flow if indicated.';
    recommendations = [
      'Assess airway patency, respiratory rate, and oxygen saturation (SpO2)',
      'Auscultate lung fields for bilateral wheezing or localized crackles',
      'Avoid prescribing NSAIDs or Aspirin if patient has known drug sensitivities',
      'Consider short-acting beta-2 agonist (SABA) nebulization or inhaler as per protocol',
    ];
  }
  // 4C. General Respiratory Infection Pattern
  else if (hasRespSymptoms) {
    possiblePattern = 'Acute upper or lower respiratory inflammatory pattern';
    const confidenceScore = computePatternConfidence('respiratory_infection', normalized);

    possiblePatterns.push({
      name: 'Upper/Lower Respiratory Tract Infection',
      confidence: confidenceScore,
      reason: 'Localized respiratory inflammatory cluster with associated cough and mucous membrane irritation.',
    });

    possiblePatterns.push({
      name: 'Allergic Rhinitis / Airway Irritation',
      confidence: 0.44,
      reason: 'Mucosal reactivity without severe systemic lower airway consolidation.',
    });

    clinicalConsiderations = 'Evaluate airway patency, chest auscultation for crackles/wheezes, and assess hydration and fever trajectory.';
    recommendations = [
      'Auscultate lungs for focal consolidation or adventitious sounds',
      'Assess hydration and temperature curve',
      'Prescribe symptomatic antipyretics while observing antibiotic stewardship',
    ];
  }
  // 4D. Febrile / Systemic Prodrome Pattern
  else if (hasFebrileSymptoms) {
    possiblePattern = 'Systemic infectious / febrile prodrome pattern';
    const confidenceScore = computePatternConfidence('febrile_prodrome', normalized);

    possiblePatterns.push({
      name: 'Systemic Febrile / Viral Prodrome',
      confidence: confidenceScore,
      reason: 'Constitutional fever, malaise, and fatigue without focal organ localization.',
    });

    clinicalConsiderations = 'Assess temperature curve, hydration status, and consider basic inflammatory markers (CBC/CRP) if symptoms persist beyond expected viral timeframe.';
    recommendations = [
      'Ensure adequate oral hydration and rest',
      'Monitor body temperature twice daily',
      'Perform CBC / ESR if fever persists beyond 72 hours',
    ];
  }
  // 4E. Gastrointestinal Pattern
  else if (hasGISymptoms) {
    possiblePattern = 'Gastrointestinal dysregulation / irritation pattern';
    const confidenceScore = computePatternConfidence('gastrointestinal', normalized);

    possiblePatterns.push({
      name: 'Acute Gastroenteritis / Gastric Irritation',
      confidence: confidenceScore,
      reason: 'Localized digestive mucosal irritation and motility dysregulation.',
    });

    clinicalConsiderations = 'Assess fluid and electrolyte balance, review current mucosal protective regimen, and rule out infectious or inflammatory etiology.';
    recommendations = [
      'Evaluate hydration and abdominal tenderness',
      'Consider oral rehydration salts and dietary adjustment',
    ];
  }
  // 4F. Neurological Pattern
  else if (hasNeuroSymptoms) {
    possiblePattern = 'Neurological / cephalalgic symptom pattern';
    const confidenceScore = computePatternConfidence('neurological', normalized);

    possiblePatterns.push({
      name: 'Tension / Migrainous Cephalea or Secondary Headache',
      confidence: confidenceScore,
      reason: 'Cranial vascular or muscular discomfort presentation.',
    });

    clinicalConsiderations = 'Perform focal neurological examination, check blood pressure, and assess for meningeal or secondary febrile signs.';
    recommendations = [
      'Check blood pressure and cranial nerve integrity',
      'Assess for neck stiffness and photophobia',
    ];
  }
  // 4G. Urinary Pattern
  else if (hasUrinarySymptoms) {
    possiblePattern = 'Genitourinary / renal irritative pattern';
    const confidenceScore = computePatternConfidence('urinary', normalized);

    possiblePatterns.push({
      name: 'Urinary Tract Infection / Urethritis',
      confidence: confidenceScore,
      reason: 'Lower urinary tract irritative presentation with dysuria or frequency.',
    });

    clinicalConsiderations = 'Consider urinalysis with microscopy and culture before initiating empirical antimicrobial therapy.';
    recommendations = [
      'Perform urine routine & microscopy test',
      'Encourage increased fluid intake',
    ];
  } else {
    possiblePatterns.push({
      name: 'Non-Specific Clinical Finding Cluster',
      confidence: 0.50,
      reason: 'Diffuse symptoms without a dominant single-organ syndromic presentation.',
    });
  }

  // 5. Allergy Safeguards Synthesis
  if (allergies.length > 0) {
    clinicalConsiderations += ` Note: Patient has documented allergies to ${allergies.join(', ')}.`;
    allergies.forEach((allergy) => {
      const lower = allergy.toLowerCase();
      for (const [key, drugs] of Object.entries(ALLERGY_CONTRAINDICATIONS)) {
        if (lower.includes(key)) {
          recommendations.push(`Avoid prescribing ${drugs.join(', ')} due to recorded ${allergy} allergy`);
          break;
        }
      }
    });
  }

  // 6. Compute Root Overall Confidence
  const overallConfidence = computeOverallConfidence(possiblePatterns);

  // Return Strict JSON response matching specification
  return {
    possiblePattern,
    possiblePatterns,
    evidence: evidence.length > 0 ? evidence : ['Selected clinical findings'],
    redFlags: triage.redFlags,
    clinicalConsiderations,
    recommendations,
    triage_level: triage.triage_level,
    confidence: overallConfidence,
  };
}

export default {
  analyzeClinicalData,
};

