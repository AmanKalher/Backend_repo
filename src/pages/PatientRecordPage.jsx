import DocumentViewerModal from '../components/DocumentViewerModal'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BrandLogo from '../components/BrandLogo'
import MorphicNavbar from '../components/MorphicNavbar'
import SmoothTab from '../components/SmoothTab'
import FileUpload from '../components/FileUpload'
import PrescriptionPreviewModal from '../components/PrescriptionPreviewModal'
import { useAuth } from '../context/AuthContext'

const symptomDatabase = [
  {
    category: 'GENERAL',
    symptoms: ['Fever', 'Fatigue', 'Chills', 'Weakness', 'Loss of appetite'],
  },
  {
    category: 'RESPIRATORY',
    symptoms: ['Cough', 'Shortness of breath', 'Wheezing', 'Sore throat', 'Nasal congestion', 'Chest tightness'],
  },
  {
    category: 'CARDIAC',
    symptoms: ['Chest pain', 'Palpitations', 'Dizziness', 'Fainting', 'Leg swelling'],
  },
  {
    category: 'GASTROINTESTINAL',
    symptoms: ['Nausea', 'Vomiting', 'Abdominal pain', 'Diarrhea', 'Constipation'],
  },
  {
    category: 'NEUROLOGICAL',
    symptoms: ['Headache', 'Confusion', 'Weakness', 'Numbness', 'Seizure'],
  },
  {
    category: 'URINARY',
    symptoms: ['Painful urination', 'Increased frequency', 'Blood in urine', 'Flank pain'],
  },
]

const redFlagSymptomsList = [
  'Chest pain',
  'Shortness of breath',
  'Fainting',
  'Confusion',
  'Seizure',
  'Blood in urine',
]

const recordTabs = {
  '/prescriptions': { name: 'Prescriptions' },
  '/labs': { name: 'Lab Reports' },
  '/imaging': { name: 'Imaging' },
  '/vaccinations': { name: 'Vaccinations' },
}

export default function PatientRecordPage() {
  const { doctor, logoutDoctor } = useAuth()
  const navigate = useNavigate()
  
  // Navigation & Session States - Tabs: 'records', 'diagnosis', 'prescription'
  const [activeMainTab, setActiveMainTab] = useState('records')
  const [remainingSeconds, setRemainingSeconds] = useState(44 * 60 + 32)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [activeRecordSubTab, setActiveRecordSubTab] = useState('/prescriptions')
  const [showPrintModal, setShowPrintModal] = useState(false)

  // Feedback Toasts
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Countdown timer for access expiration
  useEffect(() => {
    if (remainingSeconds <= 0) {
      navigate('/dashboard')
      return
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate, remainingSeconds])

  // Lock body scroll when selectedRecord modal is open
  useEffect(() => {
    if (selectedRecord) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedRecord])

  const formatTimer = (totalSeconds) => {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const secs = String(totalSeconds % 60).padStart(2, '0')
    return mins + ':' + secs
  }

  const patient = {
    name: 'Vikram Sengupta',
    age: 36,
    gender: 'Male',
    dob: '14 May 1990',
    abhaId: 'Not available',
    patientId: 'PT-9088',
    bloodGroup: 'B+',
    avatarLetter: 'V',
    reasonForVisit: 'Persistent cough and mild chest discomfort',
    allergies: ['Aspirin', 'Codeine'],
    medications: [
      { name: 'Pantoprazole 40mg', frequency: 'Once daily' },
      { name: 'Levocetirizine 5mg', frequency: 'At bedtime' },
    ],
    chronicConditions: ['Asthma'],
    pastMedicalHistory: ['History of bronchial asthma'],
    previousProcedures: ['Appendectomy — 2021'],
    familyHistory: ['Hypertension — Father'],
    vitals: {
      bp: '128/82',
      hr: '78',
      spo2: '98%',
      temp: '98.4°F',
    },
  }

  const [prescriptionsList, setPrescriptionsList] = useState([
    {
      date: '12 Aug 2026',
      drug: 'Pantoprazole 40mg',
      dosage: 'Once daily',
      instructions: 'Take 30 minutes before breakfast with water',
      doctor: 'Dr. Sharma',
    },
    {
      date: '12 Aug 2026',
      drug: 'Levocetirizine 5mg',
      dosage: 'At bedtime',
      instructions: 'For allergic rhinitis & nighttime cough suppression',
      doctor: 'Dr. Sharma',
    },
    {
      date: '18 Jan 2026',
      drug: 'Budesonide + Formoterol 200mcg Inhaler',
      dosage: '2 puffs twice daily',
      instructions: 'Rinse mouth thoroughly after inhalation',
      doctor: 'Dr. Kapoor',
    },
  ])

  const [labReportsList, setLabReportsList] = useState([
    {
      name: 'CBC',
      date: '12 Aug 2026',
      summary: 'Normal — Hb: 14.8 g/dL, TLC: 7,400, Platelets: 2.4 Lacs',
      facility: 'Apollo Diagnostics Lab',
    },
    {
      name: 'Lipid Profile',
      date: '12 Aug 2026',
      summary: 'Total Cholesterol: 184 mg/dL, Triglycerides: 142 mg/dL, HDL: 48 mg/dL',
      facility: 'Apollo Diagnostics Lab',
    },
    {
      name: 'Liver Function Test',
      date: '04 Jun 2026',
      summary: 'Normal — Bilirubin: 0.8 mg/dL, SGOT: 24 U/L, SGPT: 28 U/L',
      facility: 'City Reference Labs',
    },
    {
      name: 'HbA1c & Fasting Glucose',
      date: '04 Jun 2026',
      summary: 'HbA1c: 5.6% (Non-diabetic), Fasting Plasma Glucose: 92 mg/dL',
      facility: 'City Reference Labs',
    },
  ])

  const [imagingList, setImagingList] = useState([
    {
      name: 'Chest X-Ray',
      date: '24 Aug 2026',
      summary: 'PA View: Normal cardiac size. No focal consolidation or effusion. Mild broncho-vascular markings.',
      radiologist: 'Dr. R. Kulkarni (MD Radiology)',
    },
    {
      name: 'Ultrasound',
      date: '04 Jun 2026',
      summary: 'Ultrasound Whole Abdomen: Normal liver size and echotexture. Gallbladder and kidneys unremarkable.',
      radiologist: 'Dr. S. Nair (Consultant Radiologist)',
    },
    {
      name: '12-Lead ECG',
      date: '04 Jun 2026',
      summary: 'Normal Sinus Rhythm at 74 bpm. Normal axis, no ST-T segment abnormalities.',
      radiologist: 'Dr. Mehta (Cardiology)',
    },
  ])

  const vaccinationsList = [
    {
      vaccine: 'COVID-19 Booster (Covaxin)',
      date: '12 Jan 2023',
      dose: 'Dose 3 (Precautionary)',
      status: 'Completed ✓',
    },
    {
      vaccine: 'Influenza Annual Vaccine',
      date: '18 Oct 2025',
      dose: 'Annual Shot',
      status: 'Completed ✓',
    },
    {
      vaccine: 'Hepatitis B Complete Series',
      date: '05 May 2018',
      dose: '3 Doses Complete',
      status: 'Completed ✓',
    },
    {
      vaccine: 'Tetanus Toxoid (TT)',
      date: '14 Mar 2021',
      dose: '0.5ml Booster',
      status: 'Completed ✓',
    },
  ]

  // Symptoms & AI Guidance States
  const [symptomSearch, setSymptomSearch] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState(['Cough', 'Fever', 'Fatigue'])
  const [expandedCategories, setExpandedCategories] = useState([])

  const handleToggleCategory = (categoryName) => {
    if (expandedCategories.includes(categoryName)) {
      setExpandedCategories(expandedCategories.filter((c) => c !== categoryName))
    } else {
      setExpandedCategories([...expandedCategories, categoryName])
    }
  }
  
  const [isSidebarAiLoading, setIsSidebarAiLoading] = useState(false)

  // 1. Clinical Record Update States (Diagnosis, Condition, Notes)
  const [updateDiagnosis, setUpdateDiagnosis] = useState('Acute Bronchitis with reactive airway response')
  const [updateCondition, setUpdateCondition] = useState('Bronchial Asthma Flare')
  const [updateNotes, setUpdateNotes] = useState(
    'Bilateral vesicular breath sounds present. Mild end-expiratory rhonchi audible on right lower base. Reactive bronchospasm responding to bronchodilators.'
  )

  // 2. Medical Record Upload State
  const [medicalDocFile, setMedicalDocFile] = useState(null)

  // 3. Imaging Upload States
  const [imagingFile, setImagingFile] = useState(null)
  const [imagingType, setImagingType] = useState('X-Ray')
  const [imagingStudyDate, setImagingStudyDate] = useState('2026-08-26')
  const [imagingBodyArea, setImagingBodyArea] = useState('Chest (PA View)')

  // 4. Prescription Builder States
  const [prescribedMedicines, setPrescribedMedicines] = useState([
    {
      id: 1,
      name: 'Amoxicillin',
      dosage: '500 mg',
      frequency: 'Three times daily',
      durationValue: '5',
      durationUnit: 'Days',
      route: 'Oral',
      instructions: 'Take after food with a full glass of water',
    },
    {
      id: 2,
      name: 'Pantoprazole',
      dosage: '40 mg',
      frequency: 'Once daily',
      durationValue: '7',
      durationUnit: 'Days',
      route: 'Oral',
      instructions: 'Take 30 minutes before morning breakfast',
    },
    {
      id: 3,
      name: 'Levocetirizine',
      dosage: '5 mg',
      frequency: 'Once daily',
      durationValue: '5',
      durationUnit: 'Days',
      route: 'Oral',
      instructions: 'Take at bedtime for cough & allergy relief',
    },
  ])
  const [prescriptionNotes, setPrescriptionNotes] = useState(
    'Maintain adequate oral hydration. Avoid cold or dusty environments. Complete the 5-day antibiotic course without interruption.'
  )
  const [prescriptionFollowUp, setPrescriptionFollowUp] = useState('Review in 7 days or earlier if shortness of breath persists.')

  // Symptom toggling from Diagnosis checkboxes
  const handleToggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom))
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom])
    }
  }

  const handleRemoveSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom))
  }

  const filteredSymptomCategories = useMemo(() => {
    const query = symptomSearch.trim().toLowerCase()
    if (!query) return symptomDatabase

    return symptomDatabase
      .map((cat) => ({
        ...cat,
        symptoms: cat.symptoms.filter((s) => s.toLowerCase().includes(query)),
      }))
      .filter((cat) => cat.symptoms.length > 0)
  }, [symptomSearch])

  const activeRedFlags = useMemo(() => {
    return selectedSymptoms.filter((s) => redFlagSymptomsList.includes(s))
  }, [selectedSymptoms])

  // Structured AI Clinical Guidance Generator for the Sticky Live Assistant
  const aiClinicalGuidance = useMemo(() => {
    if (selectedSymptoms.length === 0) {
      return {
        condition: 'Awaiting Symptom Selection',
        interpretation: 'Select patient clinical findings to generate real-time diagnostic synthesis.',
        recommendation: 'Complete symptom checklist and review longitudinal patient records.',
      }
    }

    const lowerSelected = selectedSymptoms.map((s) => s.toLowerCase())
    const hasRespiratory = lowerSelected.some((s) => ['cough', 'shortness of breath', 'wheezing', 'chest tightness', 'sore throat', 'nasal congestion'].includes(s))
    const hasCardiac = lowerSelected.some((s) => ['chest pain', 'palpitations', 'dizziness', 'fainting', 'leg swelling'].includes(s))
    const hasConstitutional = lowerSelected.some((s) => ['fever', 'chills', 'fatigue', 'weakness', 'loss of appetite'].includes(s))
    const hasGI = lowerSelected.some((s) => ['nausea', 'vomiting', 'abdominal pain', 'diarrhea', 'constipation'].includes(s))
    const hasNeuro = lowerSelected.some((s) => ['headache', 'confusion', 'numbness', 'seizure'].includes(s))
    const hasUrinary = lowerSelected.some((s) => ['painful urination', 'increased frequency', 'blood in urine', 'flank pain'].includes(s))

    if (hasCardiac) {
      return {
        condition: 'Potential Cardiopulmonary Process',
        interpretation: 'Symptoms suggest possible cardiac involvement or ischemic reaction.',
        recommendation: 'Order urgent 12-lead ECG, SpO2 monitoring, and observe strict Aspirin allergy safeguards.',
      }
    }

    if (hasRespiratory && patient.chronicConditions.includes('Asthma')) {
      return {
        condition: 'Acute respiratory process with possible bronchospasm',
        interpretation: 'Symptoms suggest reactive airway involvement on a background of bronchial asthma.',
        recommendation: 'Evaluate for asthma flare vs infectious causes; assess bronchodilator response and peak flow.',
      }
    }

    if (hasRespiratory) {
      return {
        condition: 'Acute Upper/Lower Respiratory Tract Infection',
        interpretation: 'Airway inflammatory signs present with reactive cough and congestion response.',
        recommendation: 'Perform chest auscultation, assess fever curve, and consider supportive respiratory regimen.',
      }
    }

    if (hasConstitutional) {
      return {
        condition: 'Systemic Infectious / Inflammatory Response',
        interpretation: 'Elevated temperature curve and constitutional signs suggest acute viral or systemic prodrome.',
        recommendation: 'Monitor core temperature, maintain oral hydration, and check CBC/CRP if symptoms persist.',
      }
    }

    if (hasGI) {
      return {
        condition: 'Gastrointestinal Dysregulation / Flare',
        interpretation: 'Gastrointestinal complaints present. Continue proton-pump inhibitor mucosal protection.',
        recommendation: 'Assess hydration and electrolyte balance, and rule out infectious gastroenteritis.',
      }
    }

    if (hasNeuro) {
      return {
        condition: 'Neurological / Cephalalgic Cluster',
        interpretation: 'Headache or neurological complaints warrant baseline cranial screening.',
        recommendation: 'Perform neurological exam, check blood pressure, and assess for secondary febrile signs.',
      }
    }

    if (hasUrinary) {
      return {
        condition: 'Urinary Tract Infection / Renal Colic',
        interpretation: 'Urinary complaints suggest lower urinary tract irritation or ascending infection.',
        recommendation: 'Order urinalysis with microscopy and renal parameter evaluation.',
      }
    }

    return {
      condition: 'Multi-System Clinical Presentation',
      interpretation: 'Selected findings (' + selectedSymptoms.join(', ') + ') indicate multi-factorial presentation.',
      recommendation: 'Synthesize physical exam findings with historical diagnostic records.',
    }
  }, [selectedSymptoms, patient.chronicConditions])

  const handleTriggerSidebarAiReanalyze = () => {
    setIsSidebarAiLoading(true)
    setTimeout(() => {
      setIsSidebarAiLoading(false)
      showToast('⚡ AI clinical suggestions updated based on selected findings.')
    }, 600)
  }

  // 1. Handler: Add Clinical Record Entry
  const handleAddClinicalRecord = (e) => {
    e.preventDefault()
    if (!updateDiagnosis.trim()) return
    showToast('✓ Clinical record updated and appended to patient history.')
  }

  // 2. Handler: Save Medical Record Upload
  const handleSaveMedicalRecord = (e) => {
    e.preventDefault()
    if (!medicalDocFile) {
      showToast('⚠️ Please select a medical document to upload.')
      return
    }

    setLabReportsList([
      {
        name: `Medical Document (${medicalDocFile.name})`,
        date: '26 Aug 2026',
        summary: 'Uploaded during active consultation',
        facility: 'DiagNect Upload',
      },
      ...labReportsList,
    ])
    setMedicalDocFile(null)
    showToast('✓ Medical document saved to historical records.')
  }

  // 3. Handler: Save Imaging Upload
  const handleSaveImaging = (e) => {
    e.preventDefault()
    if (!imagingFile) {
      showToast('⚠️ Please select an imaging file to upload.')
      return
    }

    setImagingList([
      {
        name: `${imagingType} (${imagingBodyArea})`,
        date: '26 Aug 2026',
        summary: 'Imaging study uploaded in consultation',
        radiologist: 'Dr. Rahul Sharma (Clinician Upload)',
      },
      ...imagingList,
    ])
    setImagingFile(null)
    showToast('✓ Imaging study uploaded and added to imaging archive.')
  }

  // 4. Handler: Add / Remove Medicines in Prescription Tab
  const handleAddMedicineRow = () => {
    const newId = prescribedMedicines.length ? Math.max(...prescribedMedicines.map((m) => m.id)) + 1 : 1
    setPrescribedMedicines([
      ...prescribedMedicines,
      {
        id: newId,
        name: '',
        dosage: '',
        frequency: 'Twice daily',
        durationValue: '5',
        durationUnit: 'Days',
        route: 'Oral',
        instructions: 'Take after food',
      },
    ])
  }

  const handleUpdateMedicine = (id, field, value) => {
    setPrescribedMedicines(
      prescribedMedicines.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  const handleRemoveMedicine = (id) => {
    if (prescribedMedicines.length === 1) {
      showToast('⚠️ Prescription must contain at least one medicine.')
      return
    }
    setPrescribedMedicines(prescribedMedicines.filter((m) => m.id !== id))
  }

  const handleSavePrescriptionOnly = () => {
    const validMeds = prescribedMedicines.filter((m) => m.name.trim())
    if (validMeds.length === 0) {
      showToast('⚠️ Please specify at least one medication name.')
      return
    }
    showToast('✓ Prescription saved to patient records.')
  }

  const handleGeneratePrescriptionPDF = () => {
    const validMeds = prescribedMedicines.filter((m) => m.name.trim())
    if (validMeds.length === 0) {
      showToast('⚠️ Please specify at least one medication name before generating PDF.')
      return
    }
    setShowPrintModal(true)
  }

  // 3 MAIN TABS: 1. "Patient Records", 2. "Diagnosis", 3. "Prescription"
  const mainTabs = [
    {
      id: 'records',
      title: 'Patient Records',
      content: (
        <div className="patient-records-full-container">
          {/* Clinical Summary & Medical Information Two-Column Grid */}
          <div className="patient-two-col-grid">
            <section className="patient-section-card">
              <div className="section-card-header">
                <span className="section-eyebrow">ESSENTIAL HIGHLIGHTS</span>
                <h2>Clinical Summary</h2>
              </div>

              <div className="clinical-summary-content">
                <div className="summary-field-block">
                  <span className="summary-field-label">Blood Group</span>
                  <span className="blood-group-badge">{patient.bloodGroup}</span>
                </div>

                <div className="summary-field-block">
                  <span className="summary-field-label">Known Allergies</span>
                  <div className="allergies-warning-wrap">
                    {patient.allergies.map((allergy) => (
                      <span key={allergy} className="allergy-warning-pill">
                        ⚠ {allergy}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="summary-field-block">
                  <span className="summary-field-label">Current Medications</span>
                  <div className="current-meds-stack">
                    {patient.medications.map((med) => (
                      <div key={med.name} className="med-line-item">
                        <span className="med-dot" />
                        <div>
                          <strong>{med.name}</strong>
                          <span className="med-frequency"> — {med.frequency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="patient-section-card">
              <div className="section-card-header">
                <span className="section-eyebrow">BACKGROUND CONTEXT</span>
                <h2>Medical Information</h2>
              </div>

              <div className="medical-info-list">
                <div className="info-row-item">
                  <span className="info-row-label">Chronic Conditions</span>
                  <span className="info-row-value">{patient.chronicConditions.join(', ')}</span>
                </div>

                <div className="info-row-item">
                  <span className="info-row-label">Past Medical History</span>
                  <span className="info-row-value">{patient.pastMedicalHistory.join(', ')}</span>
                </div>

                <div className="info-row-item">
                  <span className="info-row-label">Previous Procedures</span>
                  <span className="info-row-value">{patient.previousProcedures.join(', ')}</span>
                </div>

                <div className="info-row-item">
                  <span className="info-row-label">Family History</span>
                  <span className="info-row-value">{patient.familyHistory.join(', ')}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Medical Records Sub-Navigation with MorphicNavbar */}
          <section className="patient-section-card medical-records-main-card">
            <div className="records-heading-row">
              <div>
                <h2>Medical Records</h2>
                <p className="records-sub-desc">Comprehensive patient health timeline and authorized diagnostic archive</p>
              </div>

              <div className="authorized-data-pill">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="auth-lock-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                <span>Patient-authorized records</span>
              </div>
            </div>

            {/* MorphicNavbar Component */}
            <div className="morphic-nav-wrapper">
              <MorphicNavbar
                items={recordTabs}
                defaultPath="/prescriptions"
                activePath={activeRecordSubTab}
                onChange={(path) => setActiveRecordSubTab(path)}
                className="patient-record-morphic-nav"
              />
            </div>

            <div className="tab-panel-display" role="tabpanel">
              {/* TAB 1: PRESCRIPTIONS */}
              {activeRecordSubTab === '/prescriptions' && (
                <div className="tab-records-table">
                  <div className="table-header-row">
                    <span>DATE</span>
                    <span>MEDICATION</span>
                    <span>DOSAGE</span>
                    <span>INSTRUCTIONS</span>
                    <span>ACTION</span>
                  </div>
                  {prescriptionsList.map((item, idx) => (
                    <div key={idx} className="table-data-row">
                      <span className="data-date">{item.date}</span>
                      <span className="data-drug"><strong>{item.drug}</strong></span>
                      <span className="data-dosage">{item.dosage}</span>
                      <span className="data-instr">{item.instructions}</span>
                      <button
                        type="button"
                        className="view-link-btn"
                        onClick={() =>
                          setSelectedRecord({
                            type: 'Prescription Record',
                            title: 'Prescription: ' + item.drug,
                            category: 'Prescription & Medication Record',
                            date: item.date,
                            doctor: item.doctor || 'Dr. Rahul Sharma, MD',
                            medicines: [
                              {
                                name: item.drug,
                                dosage: item.dosage,
                                frequency: item.dosage || 'Once daily',
                                durationValue: '5',
                                durationUnit: 'Days',
                                route: 'Oral',
                                instructions: item.instructions,
                              },
                            ],
                            notes: 'Medication prescribed as part of comprehensive clinical protocol.',
                            followUp: 'Review in 7 days or as advised by clinician.',
                          })
                        }
                      >
                        View →
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: LAB REPORTS */}
              {activeRecordSubTab === '/labs' && (
                <div className="tab-records-table">
                  <div className="table-header-row">
                    <span>DATE</span>
                    <span>TEST / PANEL</span>
                    <span>LABORATORY</span>
                    <span>CLINICAL SUMMARY</span>
                    <span>ACTION</span>
                  </div>
                  {labReportsList.map((item, idx) => (
                    <div key={idx} className="table-data-row">
                      <span className="data-date">{item.date}</span>
                      <span className="data-drug"><strong>{item.name}</strong></span>
                      <span className="data-dosage">{item.facility}</span>
                      <span className="data-instr">{item.summary}</span>
                      <button
                        type="button"
                        className="view-link-btn"
                        onClick={() =>
                          setSelectedRecord({
                            type: 'lab_report',
                            title: item.name,
                            category: 'Diagnostic Laboratory Report',
                            date: item.date,
                            facility: item.facility,
                            summary: item.summary,
                            details:
                              'Diagnostic Investigation: ' +
                              item.name +
                              '\nLaboratory: ' +
                              item.facility +
                              '\nSummary: ' +
                              item.summary +
                              '\nVerification: Verified & Signed by Chief Pathologist',
                          })
                        }
                      >
                        View →
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: IMAGING */}
              {activeRecordSubTab === '/imaging' && (
                <div className="tab-records-table">
                  <div className="table-header-row">
                    <span>DATE</span>
                    <span>STUDY NAME</span>
                    <span>RADIOLOGIST</span>
                    <span>IMPRESSION</span>
                    <span>ACTION</span>
                  </div>
                  {imagingList.map((item, idx) => (
                    <div key={idx} className="table-data-row">
                      <span className="data-date">{item.date}</span>
                      <span className="data-drug"><strong>{item.name}</strong></span>
                      <span className="data-dosage">{item.radiologist}</span>
                      <span className="data-instr">{item.summary}</span>
                      <button
                        type="button"
                        className="view-link-btn"
                        onClick={() =>
                          setSelectedRecord({
                            type: 'imaging_report',
                            title: 'Radiology Study: ' + item.name,
                            studyName: item.name,
                            category: 'Radiology & Imaging Report',
                            date: item.date,
                            radiologist: item.radiologist,
                            summary: item.summary,
                            details:
                              'Radiology Modality: ' +
                              item.name +
                              '\nConsultant Radiologist: ' +
                              item.radiologist +
                              '\nImpression: ' +
                              item.summary,
                          })
                        }
                      >
                        View →
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: VACCINATIONS */}
              {activeRecordSubTab === '/vaccinations' && (
                <div className="tab-records-table">
                  <div className="table-header-row">
                    <span>DATE</span>
                    <span>VACCINE</span>
                    <span>DOSE</span>
                    <span>STATUS</span>
                    <span>ACTION</span>
                  </div>
                  {vaccinationsList.map((item, idx) => (
                    <div key={idx} className="table-data-row">
                      <span className="data-date">{item.date}</span>
                      <span className="data-drug"><strong>{item.vaccine}</strong></span>
                      <span className="data-dosage">{item.dose}</span>
                      <span className="data-instr" style={{ color: '#059669', fontWeight: 700 }}>{item.status}</span>
                      <button
                        type="button"
                        className="view-link-btn"
                        onClick={() =>
                          setSelectedRecord({
                            type: 'immunization_certificate',
                            title: item.vaccine + ' Certificate',
                            category: 'Immunization Certificate',
                            date: item.date,
                            summary:
                              item.vaccine +
                              ' (' +
                              item.dose +
                              ') administered on ' +
                              item.date +
                              '. Universal Immunization Certified.',
                            details:
                              'Vaccine: ' +
                              item.vaccine +
                              '\nDose: ' +
                              item.dose +
                              '\nStatus: ' +
                              item.status,
                          })
                        }
                      >
                        View →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      ),
    },
    {
      id: 'diagnosis',
      title: 'Diagnosis',
      content: (
        <div className="clinical-consultation-workspace-grid">
          {/* ====================================================== */}
          {/* MAIN COLUMN (LEFT / CENTER): DIAGNOSIS & RECORD UPDATES */}
          {/* ====================================================== */}
          <div className="consultation-main-work-area">
            {/* Symptoms & Search Box */}
            <div className="patient-section-card diagnosis-workspace-card">
              <div className="assessment-top-header">
                <div>
                  <span className="section-eyebrow">DECISION SUPPORT WORKSPACE</span>
                  <h2>Symptoms & Clinical Findings</h2>
                  <p className="assessment-instruction-text">
                    Select symptoms to assist the clinical assessment and generate real-time AI guidance.
                  </p>
                </div>
                <div className="ai-status-pill">
                  <span className="ai-spark-dot" />
                  <span>Clinical Decision Assist</span>
                </div>
              </div>

              {/* Symptom Search Bar */}
              <div className="symptom-search-bar-wrap">
                <div className="search-input-box">
                  <span className="search-icon" aria-hidden="true">🔍</span>
                  <input
                    type="text"
                    className="symptom-filter-input"
                    placeholder="Search symptoms..."
                    value={symptomSearch}
                    onChange={(e) => setSymptomSearch(e.target.value)}
                  />
                  {symptomSearch && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSymptomSearch('')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Symptoms Summary Chips */}
              <div className="selected-symptoms-bar">
                <div className="selected-bar-label">
                  <span className="kicker-label">SELECTED SYMPTOMS</span>
                  <span className="selected-count-badge">
                    {selectedSymptoms.length} selected
                  </span>
                </div>

                {selectedSymptoms.length > 0 ? (
                  <div className="selected-chips-flow">
                    {selectedSymptoms.map((symptom) => (
                      <span key={symptom} className="selected-symptom-chip">
                        <span>{symptom}</span>
                        <button
                          type="button"
                          className="remove-chip-btn"
                          onClick={() => handleRemoveSymptom(symptom)}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      className="clear-all-chips-btn"
                      onClick={() => setSelectedSymptoms([])}
                    >
                      Clear All
                    </button>
                  </div>
                ) : (
                  <p className="no-symptoms-prompt">
                    No symptoms selected yet. Choose from the clinical categories below.
                  </p>
                )}
              </div>

              {/* Red Flags Alert Banner */}
              {activeRedFlags.length > 0 && (
                <div className="red-flags-alert-card">
                  <div className="red-flag-icon">⚠️</div>
                  <div className="red-flag-body">
                    <strong>RED FLAGS:</strong>
                    <p>
                      Patient reports {activeRedFlags.join(', ')}. Evaluate for urgent cardiac/respiratory intervention or emergency stabilization.
                    </p>
                  </div>
                </div>
              )}

              {/* Aesthetic Joined Dropdown Box (Smooth Rounded Outer Corners, 0 Gap) */}
              <div className="symptoms-accordion-stack">
                {filteredSymptomCategories.map((cat) => {
                  const categorySelectedCount = cat.symptoms.filter((s) => selectedSymptoms.includes(s)).length
                  const isExpanded = expandedCategories.includes(cat.category) || (symptomSearch.trim().length > 0)

                  return (
                    <div
                      key={cat.category}
                      className={'symptom-accordion-item ' + (categorySelectedCount > 0 ? 'has-selected ' : '') + (isExpanded ? 'is-open' : '')}
                    >
                      <button
                        type="button"
                        className="symptom-accordion-header"
                        onClick={() => handleToggleCategory(cat.category)}
                        aria-expanded={isExpanded}
                      >
                        <div className="accordion-title-left">
                          {categorySelectedCount > 0 && <span className="category-active-dot" aria-hidden="true" />}
                          <span className="accordion-category-name">{cat.category}</span>
                        </div>

                        <div className="accordion-meta-right">
                          <span className={'accordion-count-badge ' + (categorySelectedCount > 0 ? 'active' : '')}>
                            {categorySelectedCount} selected
                          </span>
                          <motion.span
                            className="accordion-chevron"
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            aria-hidden="true"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </motion.span>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key="accordion-content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="symptom-accordion-body"
                          >
                            <div className="symptom-checkbox-list">
                              {cat.symptoms.map((symptom) => {
                                const isChecked = selectedSymptoms.includes(symptom)
                                return (
                                  <div
                                    key={symptom}
                                    className={'custom-checkbox-row ' + (isChecked ? 'selected' : '')}
                                    onClick={() => handleToggleSymptom(symptom)}
                                    role="checkbox"
                                    aria-checked={isChecked}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === ' ' || e.key === 'Enter') {
                                        e.preventDefault()
                                        handleToggleSymptom(symptom)
                                      }
                                    }}
                                  >
                                    <div className={'checkbox-custom-indicator ' + (isChecked ? 'checked' : '')}>
                                      {isChecked ? '✓' : ''}
                                    </div>
                                    <span className="checkbox-symptom-name">{symptom}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ====================================================== */}
            {/* 1. CLINICAL RECORD UPDATE SECTION */}
            {/* ====================================================== */}
            <div className="patient-section-card documentation-block-card">
              <div className="section-card-header">
                <span className="section-eyebrow">CLINICAL DOCUMENTATION</span>
                <h2>Clinical Record Update</h2>
                <p className="records-sub-desc">Update the patient's clinical record based on today's consultation.</p>
              </div>

              <form onSubmit={handleAddClinicalRecord} className="clinical-update-form">
                <div className="form-two-col-grid">
                  <div className="form-group">
                    <label>Diagnosis / Clinical Impression</label>
                    <input
                      type="text"
                      className="form-input-text"
                      placeholder="Type diagnosis or clinical impression..."
                      value={updateDiagnosis}
                      onChange={(e) => setUpdateDiagnosis(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Associated Condition</label>
                    <select
                      className="form-select-dropdown"
                      value={updateCondition}
                      onChange={(e) => setUpdateCondition(e.target.value)}
                    >
                      <option value="Bronchial Asthma Flare">Bronchial Asthma Flare</option>
                      <option value="Acute Bronchitis">Acute Bronchitis</option>
                      <option value="Upper Respiratory Infection">Upper Respiratory Infection</option>
                      <option value="Allergic Rhinitis">Allergic Rhinitis</option>
                      <option value="Acid Reflux (GERD)">Acid Reflux (GERD)</option>
                      <option value="Hypertension">Hypertension</option>
                      <option value="Other">Other Diagnostic Condition</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Clinical Notes</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Enter detailed clinical examination, auscultation, or observations..."
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                  />
                </div>

                <div className="form-row-metadata" style={{ justifyContent: 'flex-start' }}>
                  <div className="doctor-date-stamp">
                    <span>Date: <strong>26 Aug 2026</strong></span>
                    <span>•</span>
                    <span>Doctor: <strong>Dr. Rahul Sharma</strong></span>
                  </div>
                </div>

                <div className="form-action-right">
                  <button type="submit" className="primary-action-btn">
                    + Add to Patient Record
                  </button>
                </div>
              </form>
            </div>

            {/* ====================================================== */}
            {/* 2. MEDICAL RECORD UPLOAD */}
            {/* ====================================================== */}
            <div className="patient-section-card documentation-block-card">
              <div className="section-card-header">
                <span className="section-eyebrow">MEDICAL REPORTS & ARCHIVES</span>
                <h2>Upload Reports</h2>
                <p className="records-sub-desc">Upload reports, prescriptions, discharge summaries or other medical documents.</p>
              </div>

              <form onSubmit={handleSaveMedicalRecord} className="upload-doc-form">
                <FileUpload
                  accept=".pdf,.png,.jpg,.jpeg"
                  maxSizeMB={10}
                  onFileSelect={setMedicalDocFile}
                  label="Drag and drop medical documents here, or browse files"
                />

                <div className="form-action-right" style={{ marginTop: '10px' }}>
                  <button
                    type="submit"
                    className="secondary-action-btn"
                    disabled={!medicalDocFile}
                  >
                    Save to Medical Records
                  </button>
                </div>
              </form>
            </div>

            {/* ====================================================== */}
            {/* 3. IMAGING UPLOAD */}
            {/* ====================================================== */}
            <div className="patient-section-card documentation-block-card">
              <div className="section-card-header">
                <span className="section-eyebrow">RADIOLOGY & DIAGNOSTICS</span>
                <h2>Add Imaging</h2>
                <p className="records-sub-desc">Upload imaging studies or diagnostic images for this patient.</p>
              </div>

              <form onSubmit={handleSaveImaging} className="upload-doc-form">
                <FileUpload
                  accept=".pdf,.png,.jpg,.jpeg,.dcm"
                  maxSizeMB={25}
                  onFileSelect={setImagingFile}
                  label="Drag and drop imaging study or DICOM scans here, or browse files"
                />

                <div className="form-three-col-grid" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Imaging Type</label>
                    <select
                      className="form-select-dropdown"
                      value={imagingType}
                      onChange={(e) => setImagingType(e.target.value)}
                    >
                      <option value="X-Ray">X-Ray</option>
                      <option value="CT Scan">CT Scan</option>
                      <option value="MRI">MRI</option>
                      <option value="Ultrasound">Ultrasound</option>
                      <option value="Mammography">Mammography</option>
                      <option value="Other">Other Modality</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Study Date</label>
                    <input
                      type="date"
                      className="form-input-text"
                      value={imagingStudyDate}
                      onChange={(e) => setImagingStudyDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Body Area</label>
                    <input
                      type="text"
                      className="form-input-text"
                      placeholder="e.g. Chest (PA View), Lumbar Spine"
                      value={imagingBodyArea}
                      onChange={(e) => setImagingBodyArea(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-action-right" style={{ marginTop: '10px' }}>
                  <button
                    type="submit"
                    className="secondary-action-btn"
                    disabled={!imagingFile}
                  >
                    Save to Imaging Records
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ====================================================== */}
          {/* RIGHT SIDEBAR: STICKY LIVE AI ASSISTANT PANEL */}
          {/* ====================================================== */}
          <aside className="consultation-right-sidebar">
            <div className="ai-assistant-sidebar-card">
              {/* Header */}
              <div className="ai-sidebar-header">
                <div className="ai-sidebar-title-row">
                  <div className="ai-title-badge">
                    <span className="ai-spark-icon">⚡</span>
                    <h3>AI Clinical Suggestions</h3>
                  </div>
                  <span className="ai-status-tag">AI-assisted guidance</span>
                </div>
              </div>

              <div className="ai-sidebar-divider" />

              {/* Structured Body */}
              <div className="ai-sidebar-body">
                {isSidebarAiLoading ? (
                  <div className="ai-sidebar-loading-box">
                    <div className="ai-pulse-spinner" />
                    <span>Analyzing clinical findings & history...</span>
                  </div>
                ) : (
                  <div className="ai-structured-content">
                    {/* Likely Condition */}
                    <div className="ai-chunk-section likely-condition-chunk">
                      <div className="ai-chunk-header">
                        <span className="ai-chunk-dot purple-dot" />
                        <span className="ai-chunk-label">LIKELY CONDITION</span>
                      </div>
                      <div className="ai-condition-highlight-box">
                        <p className="ai-condition-title">{aiClinicalGuidance.condition}</p>
                      </div>
                    </div>

                    {/* Interpretation */}
                    <div className="ai-chunk-section">
                      <div className="ai-chunk-header">
                        <span className="ai-chunk-dot blue-dot" />
                        <span className="ai-chunk-label">INTERPRETATION</span>
                      </div>
                      <p className="ai-chunk-text">{aiClinicalGuidance.interpretation}</p>
                    </div>

                    {/* Recommendation */}
                    <div className="ai-chunk-section">
                      <div className="ai-chunk-header">
                        <span className="ai-chunk-dot green-dot" />
                        <span className="ai-chunk-label">RECOMMENDATION</span>
                      </div>
                      <div className="ai-recommendation-box">
                        <p className="ai-chunk-text">{aiClinicalGuidance.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer CTA & Disclaimer */}
              <div className="ai-sidebar-footer">
                <button
                  type="button"
                  className={'ai-rerun-analysis-btn ' + (isSidebarAiLoading ? 'loading' : '')}
                  onClick={handleTriggerSidebarAiReanalyze}
                  disabled={isSidebarAiLoading}
                >
                  {isSidebarAiLoading ? (
                    <span>Running Analysis...</span>
                  ) : (
                    <>
                      <span>Re-run Analysis</span>
                      <b aria-hidden="true">→</b>
                    </>
                  )}
                </button>
                <p className="ai-sidebar-disclaimer-text">
                  AI decision support only. Confirm with clinician.
                </p>
              </div>
            </div>
          </aside>
        </div>
      ),
    },
    {
      id: 'prescription',
      title: 'Prescription',
      content: (
        <div className="dedicated-prescription-workspace">
          {/* Prominent Allergy Safeguard Alert */}
          <div className="prescription-allergy-safeguard">
            <div className="safeguard-icon">⚠️</div>
            <div className="safeguard-text">
              <strong>Critical Patient Allergies: {patient.allergies.join(', ')}</strong>
              <p>Review patient allergies and current medications before prescribing. Strictly avoid NSAIDs / Aspirin & Codeine compounds.</p>
            </div>
          </div>

          <div className="prescription-two-column-grid">
            {/* Left Column: Medication Builder Form */}
            <div className="prescription-builder-column">
              <div className="patient-section-card">
                <div className="prescription-builder-header">
                  <div>
                    <span className="section-eyebrow">MEDICATION REGIMEN</span>
                    <h2>Prescription Builder</h2>
                    <p className="records-sub-desc">Add and customize therapeutic medications, dosage, frequency, and administration instructions.</p>
                  </div>
                  <button
                    type="button"
                    className="add-medicine-btn"
                    onClick={handleAddMedicineRow}
                  >
                    + Add Medicine
                  </button>
                </div>

                <div className="medicines-builder-list">
                  <AnimatePresence>
                    {prescribedMedicines.map((med, index) => (
                      <motion.div
                        key={med.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="medicine-editor-card"
                      >
                        <div className="med-card-top-row">
                          <span className="med-index-label">Medicine #{index + 1}</span>
                          <button
                            type="button"
                            className="remove-med-action-btn"
                            onClick={() => handleRemoveMedicine(med.id)}
                          >
                            Remove medicine ✕
                          </button>
                        </div>

                        <div className="med-inputs-grid-1">
                          <div className="form-group">
                            <label>Medicine Name</label>
                            <input
                              type="text"
                              className="form-input-text"
                              placeholder="Search or type medicine name (e.g. Amoxicillin)"
                              value={med.name}
                              onChange={(e) => handleUpdateMedicine(med.id, 'name', e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label>Dosage</label>
                            <input
                              type="text"
                              className="form-input-text"
                              placeholder="e.g. 500 mg"
                              value={med.dosage}
                              onChange={(e) => handleUpdateMedicine(med.id, 'dosage', e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label>Frequency</label>
                            <select
                              className="form-select-dropdown"
                              value={med.frequency}
                              onChange={(e) => handleUpdateMedicine(med.id, 'frequency', e.target.value)}
                            >
                              <option value="Once daily">Once daily</option>
                              <option value="Twice daily">Twice daily</option>
                              <option value="Three times daily">Three times daily</option>
                              <option value="Four times daily">Four times daily</option>
                              <option value="As needed">As needed (PRN)</option>
                            </select>
                          </div>
                        </div>

                        <div className="med-inputs-grid-2">
                          <div className="form-group">
                            <label>Duration</label>
                            <div className="duration-split-input">
                              <input
                                type="number"
                                min="1"
                                className="form-input-text"
                                value={med.durationValue}
                                onChange={(e) => handleUpdateMedicine(med.id, 'durationValue', e.target.value)}
                              />
                              <select
                                className="form-select-dropdown"
                                value={med.durationUnit}
                                onChange={(e) => handleUpdateMedicine(med.id, 'durationUnit', e.target.value)}
                              >
                                <option value="Days">Days</option>
                                <option value="Weeks">Weeks</option>
                                <option value="Months">Months</option>
                              </select>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Route</label>
                            <select
                              className="form-select-dropdown"
                              value={med.route}
                              onChange={(e) => handleUpdateMedicine(med.id, 'route', e.target.value)}
                            >
                              <option value="Oral">Oral</option>
                              <option value="Inhalation">Inhalation</option>
                              <option value="Topical">Topical</option>
                              <option value="Injection">Injection</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Instructions & Administration</label>
                          <input
                            type="text"
                            className="form-input-text"
                            placeholder="e.g. Take after food with warm water"
                            value={med.instructions}
                            onChange={(e) => handleUpdateMedicine(med.id, 'instructions', e.target.value)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="rx-notes-group">
                  <div className="form-group">
                    <label>Doctor's Advice & Clinical Instructions</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="Dietary advice, rest, inhalation..."
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Follow-up Schedule</label>
                    <input
                      type="text"
                      className="form-input-text"
                      placeholder="e.g. Review in 7 days or earlier if wheezing worsens"
                      value={prescriptionFollowUp}
                      onChange={(e) => setPrescriptionFollowUp(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Prescription Summary */}
            <div className="prescription-summary-column">
              <div className="patient-section-card sticky-summary-card">
                <div className="summary-card-header">
                  <div className="rx-title-group">
                    <span className="rx-logo-symbol">℞</span>
                    <h3>Prescription Summary</h3>
                  </div>
                  <span className="live-preview-pill">Live Preview</span>
                </div>

                <div className="prescription-meta-block">
                  <div className="meta-row">
                    <span>Patient:</span>
                    <strong>{patient.name} ({patient.age}y / {patient.gender[0]})</strong>
                  </div>
                  <div className="meta-row">
                    <span>Patient ID:</span>
                    <strong>{patient.patientId}</strong>
                  </div>
                  <div className="meta-row">
                    <span>Date:</span>
                    <strong>26 Aug 2026</strong>
                  </div>
                  <div className="meta-row">
                    <span>Prescriber:</span>
                    <strong>Dr. Rahul Sharma</strong>
                  </div>
                </div>

                <div className="summary-medications-list">
                  <span className="section-eyebrow">PRESCRIBED MEDICINES ({prescribedMedicines.length})</span>
                  {prescribedMedicines.map((m, idx) => (
                    <div key={m.id} className="summary-med-item">
                      <span className="summary-med-num">{idx + 1}.</span>
                      <div className="summary-med-content">
                        <h4 className="summary-med-name">{m.name || 'Untitled Medicine'} {m.dosage}</h4>
                        <p className="summary-med-sub">
                          {m.frequency} • {m.durationValue} {m.durationUnit} • {m.route}
                        </p>
                        {m.instructions && <p className="summary-med-instr">Instructions: {m.instructions}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="prescription-action-buttons">
                  <button
                    type="button"
                    className="save-rx-only-btn"
                    onClick={handleSavePrescriptionOnly}
                  >
                    Save Prescription
                  </button>
                  <button
                    type="button"
                    className="primary-generate-pdf-btn"
                    onClick={handleGeneratePrescriptionPDF}
                  >
                    Save & Generate PDF →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="patient-record-shell">
      {/* Top Clinical Header */}
      <header className="patient-top-bar">
        <div className="top-bar-left">
          <Link to="/dashboard" className="back-icon-btn" title="Back to Doctor Workspace" aria-label="Back">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </Link>
          <BrandLogo />
        </div>

        <div className="top-bar-right">
          <button
            type="button"
            className="end-session-btn"
            onClick={() => navigate('/dashboard')}
          >
            End Session
          </button>
        </div>
      </header>

      <main className="patient-main-container">
        {/* Toast notifications */}
        {toastMessage && (
          <div className="consultation-saved-toast">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. PATIENT HEADER */}
        <section className="patient-profile-header-card">
          <div className="profile-identity-group">
            <div className="patient-avatar-large" aria-hidden="true">
              {patient.avatarLetter}
            </div>
            <div className="patient-meta-text">
              <h1 className="patient-full-name">{patient.name}</h1>
              <p className="patient-demographics-line">
                {patient.age} years · {patient.gender} · DOB {patient.dob}
              </p>
              <div className="patient-id-tags-row">
                <span className="id-pill">Patient ID: <strong>{patient.patientId}</strong></span>
                <span className="id-pill">ABHA ID: <strong>{patient.abhaId}</strong></span>
              </div>
            </div>
          </div>

          <div className="consent-timer-group">
            <div className="consent-status-badge">
              <span className="consent-check-icon">✓</span>
              <span>Patient consented</span>
            </div>
            <div className="access-expiry-box">
              <span className="timer-icon">⏳</span>
              <span>Access expires in <strong>{formatTimer(remainingSeconds)}</strong></span>
            </div>
          </div>
        </section>

        {/* SMOOTHTAB NAVIGATION BAR (3 TABS: Patient Records, Diagnosis, Prescription) */}
        <SmoothTab
          tabs={mainTabs}
          activeTabId={activeMainTab}
          onChange={setActiveMainTab}
          className="clinical-workspace-smoothtab"
        />
      </main>

      {/* Record Inspector Modal */}
      

      {/* Clean, Isolated A4 Prescription PDF Preview Modal */}
      <DocumentViewerModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        patient={patient}
        documentData={{
          type: 'prescription_builder',
          title: 'Prescription Document: ' + patient.name,
          category: 'Prescription & Therapeutic Regimen',
          medicines: prescribedMedicines,
          notes: prescriptionNotes,
          followUp: prescriptionFollowUp,
          doctor: 'Dr. Rahul Sharma, MD',
          date: '26 Aug 2026',
        }}
      />

      <DocumentViewerModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        patient={patient}
        documentData={selectedRecord}
      />
    </div>
  )
}
