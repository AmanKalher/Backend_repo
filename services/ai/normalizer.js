/**
 * Clinical Data Normalizer
 * 
 * Normalizes raw/unstructured inputs (vitals, symptoms, demographics, history)
 * into safe, structured numeric formats.
 */

/**
 * Normalizes blood pressure string (e.g. "128/82", "120 / 80 mmHg", "130/85")
 * @param {string|Object|null} bpRaw
 * @returns {{ systolic: number|null, diastolic: number|null }}
 */
export function normalizeBloodPressure(bpRaw) {
  if (!bpRaw) {
    return { systolic: null, diastolic: null };
  }

  if (typeof bpRaw === 'object' && bpRaw.systolic !== undefined) {
    return {
      systolic: typeof bpRaw.systolic === 'number' ? bpRaw.systolic : parseInt(bpRaw.systolic, 10) || null,
      diastolic: typeof bpRaw.diastolic === 'number' ? bpRaw.diastolic : parseInt(bpRaw.diastolic, 10) || null,
    };
  }

  if (typeof bpRaw === 'string') {
    const match = bpRaw.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    if (match) {
      return {
        systolic: parseInt(match[1], 10),
        diastolic: parseInt(match[2], 10),
      };
    }
  }

  return { systolic: null, diastolic: null };
}

/**
 * Normalizes oxygen saturation (e.g. "98%", "91 % SpO2", 94)
 * @param {string|number|null} spo2Raw
 * @returns {number|null}
 */
export function normalizeOxygenSaturation(spo2Raw) {
  if (spo2Raw === null || spo2Raw === undefined || spo2Raw === '') {
    return null;
  }

  if (typeof spo2Raw === 'number') {
    return isNaN(spo2Raw) ? null : spo2Raw;
  }

  const num = parseInt(String(spo2Raw).replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? null : num;
}

/**
 * Normalizes heart rate (e.g. "130 bpm", "78", 82)
 * @param {string|number|null} hrRaw
 * @returns {number|null}
 */
export function normalizeHeartRate(hrRaw) {
  if (hrRaw === null || hrRaw === undefined || hrRaw === '') {
    return null;
  }

  if (typeof hrRaw === 'number') {
    return isNaN(hrRaw) ? null : hrRaw;
  }

  const num = parseInt(String(hrRaw).replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? null : num;
}

/**
 * Normalizes temperature (e.g. "98.4°F", "38.5 C", "101.2 F", 37)
 * @param {string|number|null} tempRaw
 * @returns {{ value: number|null, unit: string, valueInF: number|null, isFever: boolean }}
 */
export function normalizeTemperature(tempRaw) {
  if (tempRaw === null || tempRaw === undefined || tempRaw === '') {
    return { value: null, unit: 'F', valueInF: null, isFever: false };
  }

  if (typeof tempRaw === 'number') {
    const isCelsius = tempRaw < 45;
    const valueInF = isCelsius ? (tempRaw * 9) / 5 + 32 : tempRaw;
    return {
      value: tempRaw,
      unit: isCelsius ? 'C' : 'F',
      valueInF,
      isFever: valueInF >= 100.4,
    };
  }

  const str = String(tempRaw).trim();
  const numMatch = str.match(/[\d.]+/);
  if (!numMatch) {
    return { value: null, unit: 'F', valueInF: null, isFever: false };
  }

  const value = parseFloat(numMatch[0]);
  const isCelsius = /c/i.test(str) || value < 45;
  const valueInF = isCelsius ? (value * 9) / 5 + 32 : value;

  return {
    value,
    unit: isCelsius ? 'C' : 'F',
    valueInF,
    isFever: valueInF >= 100.4,
  };
}

/**
 * Master Clinical Data Normalizer
 * 
 * @param {Object} input - Raw clinical payload
 * @returns {Object} Cleaned, type-safe clinical data structure
 */
export function normalizeClinicalData(input = {}) {
  const safeInput = input && typeof input === 'object' ? input : {};

  const {
    patientId = 'ANONYMOUS',
    symptoms = [],
    clinicalFindings = {},
    patientContext = {},
  } = safeInput;

  // Safe symptoms array
  const cleanSymptoms = (Array.isArray(symptoms) ? symptoms : [])
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);

  // Safe Vitals
  const rawVitals = clinicalFindings && typeof clinicalFindings === 'object' ? clinicalFindings.vitals || {} : {};
  const normalizedVitals = {
    bp: normalizeBloodPressure(rawVitals.bp),
    spo2: normalizeOxygenSaturation(rawVitals.spo2),
    hr: normalizeHeartRate(rawVitals.hr),
    temp: normalizeTemperature(rawVitals.temp),
  };

  // Safe Context Collections
  const safeContext = patientContext && typeof patientContext === 'object' ? patientContext : {};

  const cleanChronic = (Array.isArray(safeContext.chronicConditions) ? safeContext.chronicConditions : [])
    .map((c) => (typeof c === 'string' ? c.trim() : ''))
    .filter(Boolean);

  const cleanHistory = (Array.isArray(safeContext.pastMedicalHistory) ? safeContext.pastMedicalHistory : [])
    .map((h) => (typeof h === 'string' ? h.trim() : ''))
    .filter(Boolean);

  const cleanAllergies = (Array.isArray(safeContext.allergies) ? safeContext.allergies : [])
    .map((a) => (typeof a === 'string' ? a.trim() : ''))
    .filter(Boolean);

  const cleanMedications = (Array.isArray(safeContext.currentMedications) ? safeContext.currentMedications : [])
    .map((m) => {
      if (typeof m === 'string') return { name: m.trim(), frequency: 'As directed' };
      if (m && typeof m === 'object') {
        return {
          name: String(m.name || '').trim(),
          frequency: String(m.frequency || 'As directed').trim(),
        };
      }
      return null;
    })
    .filter((m) => m && m.name.length > 0);

  return {
    patientId: String(patientId),
    symptoms: cleanSymptoms,
    clinicalFindings: {
      chiefComplaint: String(clinicalFindings?.chiefComplaint || '').trim(),
      preliminaryDiagnosis: String(clinicalFindings?.preliminaryDiagnosis || '').trim(),
      clinicalNotes: String(clinicalFindings?.clinicalNotes || '').trim(),
      vitals: normalizedVitals,
    },
    patientContext: {
      age: typeof safeContext.age === 'number' ? safeContext.age : parseInt(safeContext.age, 10) || null,
      sex: String(safeContext.sex || '').trim(),
      bloodGroup: String(safeContext.bloodGroup || '').trim(),
      chronicConditions: cleanChronic,
      pastMedicalHistory: cleanHistory,
      allergies: cleanAllergies,
      currentMedications: cleanMedications,
      previousProcedures: Array.isArray(safeContext.previousProcedures) ? safeContext.previousProcedures : [],
      familyHistory: Array.isArray(safeContext.familyHistory) ? safeContext.familyHistory : [],
    },
  };
}

export default {
  normalizeBloodPressure,
  normalizeOxygenSaturation,
  normalizeHeartRate,
  normalizeTemperature,
  normalizeClinicalData,
};

