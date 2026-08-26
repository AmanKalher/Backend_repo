import ReactDOM from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as QRCode from 'qrcode'
import BrandLogo from '../components/BrandLogo'
import { useAuth } from '../context/AuthContext'

function getGreeting(name) {
  const hour = new Date().getHours()
  const docName = name || 'Doctor'
  
  if (hour >= 5 && hour < 11) {
    return `Good morning, ${docName}`
  } else if (hour >= 11 && hour < 16) {
    return `Good afternoon, ${docName}`
  } else if (hour >= 16 && hour < 19) {
    return `Good evening, ${docName}`
  } else {
    return `Hello, ${docName}`
  }
}

export default function DashboardPage() {
  const { doctor, logoutDoctor } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [sessionToken, setSessionToken] = useState('')
  const [patientScanned, setPatientScanned] = useState(false)
  const [isScanningSimulation, setIsScanningSimulation] = useState(false)
  const [newPatientAddedNotification, setNewPatientAddedNotification] = useState(null)

  // Fallback if accessed directly without signup
  const activeDoctor = doctor || {
    fullName: 'Dr. Rahul Sharma',
    specialization: 'General Medicine',
    hospitalClinic: 'Apollo Clinic',
    medicalRegistrationNumber: 'MCI-2024-9842',
    stateMedicalCouncil: 'Delhi Medical Council',
    qualification: 'MBBS, MD',
    yearsOfExperience: '8',
    email: 'doctor@hospital.org',
    phone: '+91 98765 43210',
    identityVerified: true,
    identityVerificationStatus: 'Verified',
  }

  const doctorInitials = activeDoctor.fullName
    ? activeDoctor.fullName
        .replace(/^Dr\.\s*/i, '')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'DR'

  const [patients, setPatients] = useState([
    {
      id: 'PT-9021',
      name: 'Aarav Mehta',
      age: 42,
      gender: 'Male',
      status: 'In Consultation',
      chiefComplaint: 'Persistent dry cough & mild chest tightness',
      allergies: ['Penicillin', 'Sulfa drugs'],
      aiFlag: 'Critical allergy clash detected with proposed amoxicillin prescription',
      flagSeverity: 'high',
      history: 'Hypertension (3 yrs), Mild asthma',
    },
    {
      id: 'PT-9022',
      name: 'Priyanka Verma',
      age: 29,
      gender: 'Female',
      status: 'Waiting',
      chiefComplaint: 'Migraine with aura, nausea for 3 days',
      allergies: ['NSAIDs (Ibuprofen)'],
      aiFlag: 'Drug interaction: Sumatriptan clash with current SSRI regimen',
      flagSeverity: 'medium',
      history: 'Recurrent migraine, Anxiety',
    },
    {
      id: 'PT-9023',
      name: 'Rohan Deshmukh',
      age: 58,
      gender: 'Male',
      status: 'Scheduled',
      chiefComplaint: 'Routine Type-2 Diabetes quarterly review & HbA1c review',
      allergies: ['None recorded'],
      aiFlag: 'HbA1c elevated (8.4%) - Metformin dose adjustment recommended',
      flagSeverity: 'low',
      history: 'Type-2 Diabetes (7 yrs), Hyperlipidemia',
    },
    {
      id: 'PT-9024',
      name: 'Sunita Rao',
      age: 64,
      gender: 'Female',
      status: 'Scheduled',
      chiefComplaint: 'Post-knee replacement follow-up and mobility check',
      allergies: ['Ciprofloxacin'],
      aiFlag: 'Kidney clearance eGFR borderline: monitor NSAID duration',
      flagSeverity: 'medium',
      history: 'Total knee arthroplasty (6 wks ago), Osteoarthritis',
    },
  ])

  const incomingPatientData = {
    id: 'PT-9088',
    name: 'Vikram Sengupta',
    age: 36,
    gender: 'Male',
    status: 'Connected via QR',
    chiefComplaint: 'Acute chest congestion & persistent dry cough after seasonal weather change',
    allergies: ['Aspirin', 'Codeine'],
    aiFlag: 'Safe for macrolides/azithromycin. Strict contraindication: Aspirin & NSAID compounds',
    flagSeverity: 'high',
    currentMedications: ['Pantoprazole 40mg (OD)', 'Levocetirizine 5mg (HS)'],
    recentConditions: ['Acute Bronchitis (2025)', 'Acid Reflux (GERD)'],
  }

  // Generate QR code using QRCode library
  const generateQR = async () => {
    try {
      const token =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'diag-' + Math.random().toString(36).substring(2, 10)

      const qrData = `diagnect://patient-connect/${token}`
      const toDataURLFn = QRCode.toDataURL || (QRCode.default && QRCode.default.toDataURL)
      
      if (toDataURLFn) {
        const qrImage = await toDataURLFn(qrData, {
          width: 380,
          margin: 1,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff',
          },
        })
        setQrCode(qrImage)
      }

      const toCanvasFn = QRCode.toCanvas || (QRCode.default && QRCode.default.toCanvas)
      if (toCanvasFn && canvasRef.current) {
        await toCanvasFn(canvasRef.current, qrData, {
          width: 380,
          margin: 1,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff',
          },
        })
      }

      setSessionToken(token)
    } catch (err) {
      console.error('Error generating QR code:', err)
    }
  }

  useEffect(() => {
    if (showQRModal) {
      generateQR()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showQRModal])

  const handleLogout = () => {
    logoutDoctor()
    navigate('/login')
  }

  const handleOpenQRModal = () => {
    setShowQRModal(true)
    setIsScanningSimulation(false)
  }

  const handleSimulatePatientScan = () => {
    setIsScanningSimulation(true)
    setTimeout(() => {
      setIsScanningSimulation(false)
      if (!patients.some((p) => p.id === incomingPatientData.id)) {
        setPatients([incomingPatientData, ...patients])
      }
      setShowQRModal(false)
      document.body.style.overflow = ''
      navigate('/patient-record')
    }, 850)
  }

  return (
    <div className="dashboard-shell">
      {/* Top Navigation */}
      <header className="dashboard-navbar">
        <div className="dashboard-nav-left">
          <BrandLogo />
          <span className="dashboard-badge">Clinical Workspace</span>
        </div>

        <div className="dashboard-nav-actions">
          <div className="doctor-profile-pill">
            <div className="doctor-avatar" aria-hidden="true">
              {doctorInitials}
            </div>
            <div className="doctor-info-text">
              <span className="doctor-name">{activeDoctor.fullName}</span>
              <span className="doctor-sub">
                {activeDoctor.specialization} • {activeDoctor.hospitalClinic}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            title="Sign out of DiagNect"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="dashboard-content">
        {/* New Patient Notification Toast */}
        {newPatientAddedNotification && (
          <div className="new-patient-toast">
            
            <span>{newPatientAddedNotification}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => setNewPatientAddedNotification(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Welcome Greeting Banner */}
        <section className="dashboard-hero-banner">
          <div className="banner-text">
            <div className="verification-status-pill">
              
              <span>Identity Verified Doctor (Aadhaar Secure)</span>
            </div>
            <h1>{getGreeting(activeDoctor.fullName)}</h1>
            <p>
              Welcome to your DiagNect clinical workspace at{' '}
              <strong>{activeDoctor.hospitalClinic}</strong>. Here is your patient queue and AI clinical intelligence alerts.
            </p>
          </div>

          <div className="doctor-credentials-card">
            <div className="credentials-header">
              <div className="cred-avatar">{doctorInitials}</div>
              <div>
                <h3>{activeDoctor.fullName}</h3>
                <p className="cred-spec">{activeDoctor.specialization}</p>
                <p className="cred-hosp">{activeDoctor.hospitalClinic}</p>
              </div>
            </div>
            <div className="credentials-meta">
              <div className="meta-item">
                <span className="meta-label">Reg Number</span>
                <span className="meta-value">{activeDoctor.medicalRegistrationNumber || 'MCI-REG-VERIFIED'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Medical Council</span>
                <span className="meta-value">{activeDoctor.stateMedicalCouncil || 'National Medical Commission'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Qualification</span>
                <span className="meta-value">{activeDoctor.qualification || 'MBBS'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Experience</span>
                <span className="meta-value">
                  {activeDoctor.yearsOfExperience ? `${activeDoctor.yearsOfExperience} Years` : 'Senior Consultant'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Generate QR Code Banner */}
        <section className="dashboard-scan-banner">
          <div className="scan-banner-content">
            <div className="scan-icon-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h3v3h-3z" />
              </svg>
            </div>
            <div className="scan-banner-text">
              <h3>Generate Patient Access QR Code</h3>
              <p>
                Display your consultation QR code for the patient to scan. When the patient scans it from their phone, their verified medical history, past prescriptions, and active allergy flags will instantly transfer to your screen.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="scan-action-primary-btn"
            onClick={handleOpenQRModal}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h3v3h-3z" />
            </svg>
            <span>Generate Consultation QR Code</span>
          </button>
        </section>

        {/* Clinical Workspace Section */}
        <section className="clinical-section">
          <div className="section-top-bar">
            <div>
              <h2>Patient Queue & Clinical Intelligence</h2>
              <p>Real-time clinical history, QR consent sessions, and smart contraindication alerts</p>
            </div>
          </div>

          <div className="patient-cards-list">
            {patients.map((patient) => (
              <article key={patient.id} className="patient-card">
                <div className="patient-card-header">
                  <div className="patient-main-info">
                    <div className="patient-avatar-mini" aria-hidden="true">
                      {patient.name[0]}
                    </div>
                    <div>
                      <h3>
                        {patient.name}
                        <span className="patient-id-tag">{patient.id}</span>
                      </h3>
                      <p className="patient-demographics">
                        {patient.age} yrs • {patient.gender}
                      </p>
                    </div>
                  </div>

                  <div className="patient-status-badge">
                    <span className={`status-dot ${patient.status === 'In Consultation' || patient.status === 'Connected via QR' ? 'active' : ''}`} />
                    {patient.status}
                  </div>
                </div>

                <div className="patient-details-grid">
                  <div className="detail-box">
                    <span className="box-title">Chief Complaint</span>
                    <p>{patient.chiefComplaint}</p>
                  </div>

                  <div className="detail-box">
                    <span className="box-title">Recorded Allergies</span>
                    <div className="allergy-tags">
                      {patient.allergies.map((allergy) => (
                        <span key={allergy} className="allergy-tag">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {patient.aiFlag && (
                  <div className={`ai-flag-banner severity-${patient.flagSeverity}`}>
                    <div className="ai-flag-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
                    <div>
                      <strong>DiagNect Smart AI Alert:</strong>
                      <p>{patient.aiFlag}</p>
                    </div>
                  </div>
                )}

                <div className="patient-card-actions">
                  <button
                    type="button"
                    className="consult-btn"
                    onClick={() => navigate('/patient-record')}
                  >
                    Open Complete Medical Record →
                  </button>
                  <button type="button" className="notes-btn">
                    + Add Prescription & Notes
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Doctor QR Code Modal for Patient to Scan (Centered & No-Scroll) */}
      {showQRModal &&
        ReactDOM.createPortal(
          <div
            className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowQRModal(false)}
            role="dialog"
            aria-modal="true"
          >
            <div className="scan-modal qr-generator-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Patient Access QR Code</h3>
                  <p className="modal-sub">Ask the patient to scan this QR code using their DiagNect app</p>
                </div>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setShowQRModal(false)}
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="doctor-qr-display-container">
                <div className="qr-code-card">
                  <div className="qr-pulse-wrapper">
                    {qrCode ? (
                      <img
                        src={qrCode}
                        alt="qr code for patient"
                        className="generated-qr-image"
                      />
                    ) : (
                      <canvas ref={canvasRef} className="generated-qr-canvas" />
                    )}
                    {isScanningSimulation && (
                      <div className="qr-laser-scanner-line" />
                    )}
                  </div>

                  <div className="qr-doctor-tag">
                    <strong>{activeDoctor.fullName}</strong>
                    <span>{activeDoctor.hospitalClinic}</span>
                  </div>

                  {sessionToken && (
                    <div className="qr-token-pill">
                      <span>Token: <code>{sessionToken.slice(0, 10)}...</code></span>
                      <button
                        type="button"
                        className="refresh-qr-btn"
                        onClick={generateQR}
                        title="Generate a new QR token"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>

                <div className="qr-session-info-panel">
                  <div className="session-status-row">
                    <span className="live-pulse-dot" />
                    <span>Live Secure Consultation Session (256-bit Encrypted)</span>
                  </div>
                  <p className="session-explanation">
                    Once the patient scans this code with DiagNect, their full medical history, active prescriptions, and critical allergy flags will instantly synchronize to your screen.
                  </p>

                  <div className="simulation-trigger-wrap">
                    <button
                      type="button"
                      className="simulate-scan-action-btn"
                      onClick={handleSimulatePatientScan}
                      disabled={isScanningSimulation}
                    >
                      {isScanningSimulation ? (
                        <>
                          <span
                            className="ai-pulse-spinner"
                            style={{
                              width: '14px',
                              height: '14px',
                              borderWidth: '2px',
                              marginRight: '6px',
                              display: 'inline-block',
                            }}
                          />
                          <span>Syncing Patient Medical Records...</span>
                        </>
                      ) : (
                        <span>Simulate Patient Scan</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
