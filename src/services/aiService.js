/**
 * DiagNect AI Clinical Decision Support Service
 * 
 * Communicates with the production Express backend endpoint: POST /api/ai/analyze
 * 
 * IMPORTANT:
 * - Real AI API keys (e.g. Gemini, OpenAI) remain strictly on the backend.
 * - Frontend only interacts with our backend API.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

/**
 * Known red-flag symptoms requiring emergency attention
 */
export const RED_FLAG_SYMPTOMS = [
  'Chest pain',
  'Shortness of breath',
  'Fainting',
  'Confusion',
  'Seizure',
  'Blood in urine',
]

/**
 * Analyzes patient symptoms and clinical context by calling the Express backend.
 * 
 * @param {Object} payload
 * @param {string} payload.patientId - Unique patient ID
 * @param {Array<string>} payload.symptoms - List of selected symptoms
 * @param {Object} [payload.clinicalFindings] - Objective findings (vitals, exam notes)
 * @param {Object} [payload.patientContext] - Patient demographic and historical context
 * @returns {Promise<Object>} Structured clinical decision support output
 */
export async function analyzeSymptoms(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('diagnect_token')
          ? { Authorization: `Bearer ${localStorage.getItem('diagnect_token')}` }
          : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `AI Analysis service returned HTTP ${response.status}`
      )
    }

    return await response.json()
  } catch (err) {
    // If backend server is unreachable during standalone frontend tests, provide helpful diagnostic error
    console.error('AI Service Error:', err.message)
    throw err
  }
}

export default {
  analyzeSymptoms,
  RED_FLAG_SYMPTOMS,
}
