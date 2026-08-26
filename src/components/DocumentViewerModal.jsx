import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import html2pdf from 'html2pdf.js'

export default function DocumentViewerModal({
  isOpen,
  onClose,
  documentData,
  patient,
}) {
  const previewRef = useRef(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // Lock body scroll and reset scroll to top on mount/open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    if (previewRef.current) {
      previewRef.current.scrollTop = 0
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !documentData) return null

  // Native Browser Print
  const handlePrint = () => {
    window.print()
  }

  // Client-Side PDF Generation
  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-prescription-document')
    if (!element) return

    try {
      setIsGeneratingPdf(true)
      const patientIdClean = patient?.patientId || 'PT-9942'
      const filename = `DiagNect_${documentData.category || 'Record'}_${patientIdClean}_${Date.now()}.pdf`

      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          windowWidth: 800,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('PDF generation error:', err)
      window.print()
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const modalContent = (
    <div className="pdf-overlay fixed inset-0 z-50 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
        {/* 1. Header (Fixed Height, flex: 0 0 auto) */}
        <header className="pdf-header">
          <div className="pdf-header-left">
            <h2 className="pdf-modal-title">{documentData.title || 'Medical Document'}</h2>
            <div className="pdf-modal-subline">
              <span>{documentData.category || documentData.type || 'Clinical Record'}</span>
              <span className="dot-sep">•</span>
              <span>Patient: <strong>{patient?.name || 'Jane Doe'}</strong> ({patient?.patientId || 'PT-9942'})</span>
            </div>
          </div>

          <button
            type="button"
            className="pdf-modal-close-btn"
            onClick={onClose}
            aria-label="Close document viewer"
          >
            ✕
          </button>
        </header>

        {/* 2. Scrollable Document Preview Stage (flex: 1 1 auto, height: 0, overflow-y: auto) */}
        <main ref={previewRef} className="pdf-preview">
          <div className="a4-document-wrapper">
            <div id="printable-prescription-document" className="a4-prescription-sheet">
              {/* Clinic Brand & Doctor Header */}
              <div className="a4-header-row">
                <div className="clinic-brand-block">
                  <div className="clinic-logo-text">
                    <span className="brand-dot" />
                    <h2>DiagNect Health Clinic</h2>
                  </div>
                  <p className="clinic-subtitle">Clinical Intelligence & Comprehensive Care Network</p>
                  <p className="clinic-contact-sub">Apollo Health Complex, Bangalore · Tel: +91 (080) 4122-9000</p>
                </div>

                <div className="doctor-header-stamp">
                  <h3>{documentData.doctor || 'Dr. Rahul Sharma, MD'}</h3>
                  <p>Consultant Pulmonologist & Internal Medicine</p>
                  <p className="reg-no-text">Reg. No: <strong>KMC-84920-A</strong></p>
                </div>
              </div>

              <div className="a4-divider-line" />

              {/* Patient Demographics Strip */}
              <div className="a4-patient-meta-strip">
                <div className="meta-cell">
                  <span className="meta-cell-label">PATIENT NAME</span>
                  <span className="meta-cell-value">{patient?.name || 'Jane Doe'}</span>
                </div>
                <div className="meta-cell">
                  <span className="meta-cell-label">AGE / GENDER</span>
                  <span className="meta-cell-value">{patient?.age || '29'} yrs / {patient?.gender || 'Female'}</span>
                </div>
                <div className="meta-cell">
                  <span className="meta-cell-label">PATIENT ID</span>
                  <span className="meta-cell-value">{patient?.patientId || 'PT-9942'}</span>
                </div>
                <div className="meta-cell">
                  <span className="meta-cell-label">DATE</span>
                  <span className="meta-cell-value">{documentData.date || '26 Aug 2026'}</span>
                </div>
              </div>

              {/* Allergy Banner if patient has allergies */}
              {patient?.allergies && patient.allergies.length > 0 && (
                <div className="a4-allergy-alert-box">
                  <span className="alert-flag">KNOWN DRUG ALLERGIES:</span>
                  <span>{patient.allergies.join(', ')}</span>
                  <span className="contra-note">(Strictly Contraindicated)</span>
                </div>
              )}

              {/* RENDER VIEW ACCORDING TO DOCUMENT TYPE */}
              {documentData.type === 'prescription_builder' || documentData.type === 'Prescription Record' ? (
                /* PRESCRIPTION TYPE */
                <div className="a4-rx-section">
                  <div className="a4-rx-symbol">℞</div>
                  <table className="a4-prescription-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30px' }}>#</th>
                        <th>Medication & Strength</th>
                        <th>Dosage & Frequency</th>
                        <th>Duration</th>
                        <th>Route</th>
                        <th>Special Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(documentData.medicines || [
                        { name: 'Amoxicillin', dosage: '500 mg', frequency: 'Three times daily', durationValue: '5', durationUnit: 'Days', route: 'Oral', instructions: 'Take after food with a full glass of water' },
                        { name: 'Pantoprazole', dosage: '40 mg', frequency: 'Once daily', durationValue: '7', durationUnit: 'Days', route: 'Oral', instructions: 'Take 30 minutes before morning breakfast' },
                        { name: 'Levocetirizine', dosage: '5 mg', frequency: 'Once daily', durationValue: '5', durationUnit: 'Days', route: 'Oral', instructions: 'Take at bedtime for cough & allergy relief' },
                      ]).map((med, idx) => (
                        <tr key={idx}>
                          <td className="center-cell">{idx + 1}</td>
                          <td>
                            <strong className="med-name-text">{med.name}</strong>
                            <span className="med-dosage-text"> {med.dosage}</span>
                          </td>
                          <td>{med.frequency}</td>
                          <td>{med.durationValue ? `${med.durationValue} ${med.durationUnit}` : '5 Days'}</td>
                          <td>{med.route || 'Oral'}</td>
                          <td className="instruction-cell">{med.instructions || 'As directed by physician'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="a4-advice-section" style={{ marginTop: '16px' }}>
                    <div className="advice-block">
                      <h4>CLINICAL ADVICE & INSTRUCTIONS</h4>
                      <p>{documentData.notes || 'Maintain adequate oral hydration. Avoid cold or dusty environments. Complete the antibiotic course without interruption.'}</p>
                    </div>

                    <div className="a4-followup-row">
                      <span>Follow-up:</span>
                      <strong>{documentData.followUp || 'Review in 7 days or earlier if shortness of breath persists.'}</strong>
                    </div>
                  </div>
                </div>
              ) : documentData.category === 'Radiology & Imaging Report' || documentData.type === 'imaging_report' ? (
                /* IMAGING / RADIOLOGY REPORT */
                <div className="a4-clinical-doc-body">
                  <div className="doc-section-card">
                    <h3 className="doc-section-header">IMAGING STUDY SPECIFICATIONS</h3>
                    <div className="doc-meta-grid">
                      <div className="doc-meta-item">
                        <span>Study Name:</span>
                        <strong>{documentData.studyName || documentData.title}</strong>
                      </div>
                      <div className="doc-meta-item">
                        <span>Reported By:</span>
                        <strong>{documentData.radiologist || 'Dr. Ananya Roy, DMRD'}</strong>
                      </div>
                      <div className="doc-meta-item">
                        <span>Modality:</span>
                        <strong>High-Resolution Digital DICOM</strong>
                      </div>
                      <div className="doc-meta-item">
                        <span>PACS Archive Status:</span>
                        <strong style={{ color: '#059669' }}>Archived & Verified</strong>
                      </div>
                    </div>
                  </div>

                  <div className="doc-section-card" style={{ marginTop: '16px' }}>
                    <h3 className="doc-section-header">RADIOLOGICAL IMPRESSION & CLINICAL FINDINGS</h3>
                    <p className="doc-text-content" style={{ fontSize: '12px', lineHeight: '1.6', color: '#1e293b' }}>
                      {documentData.summary || documentData.details || 'No acute focal consolidation, pneumothorax, or pleural effusion. Cardiac silhouette is within normal limits for age and gender. Bronchovascular markings show mild symmetric peribronchial thickening compatible with reactive airway response.'}
                    </p>
                  </div>

                  <div className="doc-section-card" style={{ marginTop: '16px' }}>
                    <h3 className="doc-section-header">RECOMMENDATIONS</h3>
                    <p className="doc-text-content" style={{ fontSize: '11.5px', color: '#475569' }}>
                      Correlate with spirometry and clinical response to bronchodilators. Follow-up imaging indicated only if symptoms worsen.
                    </p>
                  </div>
                </div>
              ) : (
                /* LAB REPORT / GENERAL MEDICAL RECORD */
                <div className="a4-clinical-doc-body">
                  <div className="doc-section-card">
                    <h3 className="doc-section-header">DIAGNOSTIC TEST SUMMARY</h3>
                    <div className="doc-meta-grid">
                      <div className="doc-meta-item">
                        <span>Test / Record:</span>
                        <strong>{documentData.title}</strong>
                      </div>
                      <div className="doc-meta-item">
                        <span>Laboratory / Facility:</span>
                        <strong>{documentData.facility || 'Apollo Diagnostics Laboratory'}</strong>
                      </div>
                      <div className="doc-meta-item">
                        <span>Verification:</span>
                        <strong style={{ color: '#059669' }}>Certified by Clinical Pathologist</strong>
                      </div>
                    </div>
                  </div>

                  <div className="doc-section-card" style={{ marginTop: '16px' }}>
                    <h3 className="doc-section-header">CLINICAL OBSERVATION & RESULTS</h3>
                    <p className="doc-text-content" style={{ fontSize: '12px', lineHeight: '1.6', color: '#1e293b' }}>
                      {documentData.summary || documentData.details || 'All parameters evaluated in accordance with standardized laboratory quality metrics. Results correlate with documented patient presentation.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Digital Authentication & Doctor Signature */}
              <div className="a4-footer-signature-area">
                <div className="a4-qr-seal">
                  <span className="seal-badge">DiagNect Verified Health Record</span>
                  <span className="seal-token-sub">UUID: {Date.now().toString(36).toUpperCase()}-VERIFIED</span>
                </div>

                <div className="doctor-signature-box">
                  <div className="signature-line" />
                  <span className="signature-name">{documentData.doctor || 'Dr. Rahul Sharma'}</span>
                  <span className="signature-sub">Authorized Medical Practitioner</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 3. Footer (Fixed Height, flex: 0 0 auto) */}
        <footer className="pdf-footer">
          <div className="footer-status-hint">
            <span>A4 Document Preview • 100% Scaled</span>
          </div>

          <div className="footer-btn-actions">
            <button
              type="button"
              className="footer-btn secondary-btn"
              onClick={handlePrint}
            >
              Print
            </button>

            <button
              type="button"
              className="footer-btn primary-download-btn"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}
