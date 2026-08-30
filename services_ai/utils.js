/**
 * Clinical Decision Support Constants & Utilities
 */

export const CRITICAL_RED_FLAGS = [
  'Chest pain',
  'Shortness of breath',
  'Fainting',
  'Confusion',
  'Seizure',
  'Blood in urine',
];

export const ALLERGY_CONTRAINDICATIONS = {
  aspirin: ['Aspirin', 'NSAIDs', 'Ibuprofen', 'Naproxen', 'Diclofenac'],
  nsaids: ['Ibuprofen', 'Naproxen', 'Diclofenac', 'Aspirin', 'Ketorolac'],
  penicillin: ['Penicillin', 'Amoxicillin', 'Ampicillin', 'Augmentin'],
  sulfa: ['Sulfa drugs', 'Sulfamethoxazole', 'Trimethoprim-Sulfamethoxazole (TMP-SMX)'],
  codeine: ['Codeine', 'Opioid analgesics', 'Tramadol'],
};

/**
 * Checks if a symptom is present in the symptom list (case-insensitive substring match)
 */
export function hasSymptom(symptomsList, targetSymptom) {
  const target = targetSymptom.toLowerCase();
  return symptomsList.some((s) => s.toLowerCase() === target || s.toLowerCase().includes(target));
}

/**
 * Checks if a chronic condition or past medical history matches a pattern
 */
export function hasCondition(conditionList, regexPattern) {
  return conditionList.some((c) => regexPattern.test(c));
}

