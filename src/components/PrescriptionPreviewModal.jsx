import { useEffect, useRef, useState } from 'react'

export default function PrescriptionPreviewModal({
  isOpen,
  onClose,
  patient,
  medicines = [],
  notes = '',
  followUp = '',
  doctor = {
    name: 'Dr. Rahul Sharma',
    degrees: 'MBBS, MD (General Medicine)',
    regNo: 'MCI-2024-9842 (Delhi Medical Council)',
  },
  date = '26 Aug 2026',
}) {
  const previewStageRef = useRef(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [uuid] = useState(() => 'DIAG-RX-' + Math.random().toString(36).substring(2, 9).toUpperCase())

  // Reset scroll to top every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      // Immediate and next-tick scroll reset to ensure page 1 top is always shown
      if (previewStageRef.current) {
        previewStageRef.current.scrollTop = 0
      }
      const raf = requestAnimationFrame(() => {
        if (previewStageRef.current) {
          previewStageRef.current.scrollTop = 0
        }
      })
      document.body.style.overflow = 'hidden'
      return () => {
        cancelAnimationFrame(raf)
        document.body.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-prescription-document')
    if (!element) return

    setIsDownloading(true)
    try {
      const html2pdfModule = await import('html2pdf.js')
      const html2pdf = html2pdfModule.default || html2pdfModule

      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Prescription_${patient.name.replace(/\s+/g, '_')}_${date.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('Error generating PDF with html2pdf, falling back to print dialog:', err)
      window.print()
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="pdf-preview-backdrop" onClick={onClose}>
      <div className="pdf-preview-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 1. Compact Modal Header (Fixed Top) */}
        <header className="pdf-preview-header">
          <div className="header-meta-group">
            <h3 className="pdf-modal-title">Prescription Preview</h3>
            <div className="pdf-modal-subline">
              <span>Patient: <strong>{patient.name}</strong> ({patient.patientId})</span>
              <span className="dot-sep">•</span>
              <span>Date: <strong>{date}</strong></span>
              <span className="dot-sep">•</span>
              <span>Prescriber: <strong>{doctor.name}</strong></span>
            </div>
          </div>
          <button
            type="button"
            className="pdf-modal-close-btn"
            onClick={onClose}
            aria-label="Close Preview"
            title="Close Preview"
          >
            ✕
          </button>
        </header>

        {/* 2. Scrollable Document Canvas / Stage (The ONLY Scrollable Area) */}
        <div className="pdf-preview-stage" ref={previewStageRef}>
          <div className="a4-document-wrapper">
            <div className="a4-prescription-sheet" id="printable-prescription-document">
              {/* Header / Clinic Details */}
              <div className="a4-header-row">
                <div className="clinic-brand-block">
                  <div className="clinic-logo-text">
                    <span className="brand-dot" />
                    <h2>DiagNect Clinical Health Network</h2>
                  </div>
                  <p className="clinic-subtitle">Apollo Multispeciality Medical Center • Department of General Medicine</p>
                  <p className="clinic-contact-sub">Tel: +91 11 2682 5000 • Web: diagnect.health • NABH Accredited</p>
                </div>
                <div className="doctor-header-stamp">
                  <h3>{doctor.name}</h3>
                  <p>{doctor.degrees}</p>
                  <p className="reg-no-text">Reg No: {doctor.regNo}</p>
                </div>
              </div>

              <div className="a4-divider-line" />

              {/* Patient Demographics */}
              <div className="a4-patient-meta-strip">
                <div className="meta-cell">
                  <span className="meta-cell-label">PATIENT NAME</span>
                  <strong className="meta-cell-value">{patient.name}</strong>
                </div>
                <div className="meta-cell">
                  <span className="meta-cell-label">AGE / GENDER</span>
                  <strong className="meta-cell-value">{patient.age} Y / {patient.gender}</strong>
                </div>
                <div className="meta-cell">
                  <span className="meta-cell-label">PATIENT ID</span>
                  <strong className="meta-cell-value">{patient.patientId}</strong>
                </div>
                <div className="meta-cell">
                  <span className="meta-cell-label">CONSULTATION DATE</span>
                  <strong className="meta-cell-value">{date}</strong>
                </div>
              </div>

              {/* Allergy Warning Alert */}
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="a4-allergy-alert-box">
                  <span className="alert-flag">⚠️ DRUG ALLERGIES RECORDED:</span>
                  <strong>{patient.allergies.join(', ')}</strong>
                  <span className="contra-note">(Strict Contraindication: Aspirin, NSAIDs & Codeine formulations)</span>
                </div>
              )}

              {/* ℞ Prescription Table */}
              <div className="a4-rx-section">
                <div className="a4-rx-symbol">℞</div>
                <table className="a4-prescription-table">
                  <thead>
                    <tr>
                      <th style={{ width: '38px' }}>#</th>
                      <th>Medicine Name & Strength</th>
                      <th>Dosage & Frequency</th>
                      <th>Duration</th>
                      <th>Route</th>
                      <th>Administration Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((m, idx) => (
                      <tr key={m.id || idx}>
                        <td className="center-cell">{idx + 1}</td>
                        <td>
                          <strong className="med-name-text">{m.name || 'Prescribed Medicine'}</strong>
                          {m.dosage && <span className="med-dosage-text"> {m.dosage}</span>}
                        </td>
                        <td>{m.frequency || 'As directed'}</td>
                        <td>{m.durationValue ? `${m.durationValue} ${m.durationUnit || 'Days'}` : '-'}</td>
                        <td>{m.route || 'Oral'}</td>
                        <td className="instruction-cell">{m.instructions || 'Take as instructed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Clinical Advice & Follow-up */}
              <div className="a4-advice-section">
                <div className="advice-block">
                  <h4>Doctor's Advice & Clinical Instructions:</h4>
                  <p>{notes || 'Maintain adequate hydration and rest. Follow medication schedule rigorously.'}</p>
                </div>
                {followUp && (
                  <div className="a4-followup-row">
                    <span>Follow-Up Schedule:</span>
                    <strong>{followUp}</strong>
                  </div>
                )}
              </div>

              {/* Footer Signature & Verified Digital Seal */}
              <div className="a4-footer-signature-area">
                <div className="a4-qr-seal">
                  <div className="seal-badge">
                    <span className="lock-glyph">🔒</span>
                    <span className="digital-seal-text">Digitally Verified & Signed Prescription</span>
                  </div>
                  <span className="seal-token-sub">Verification UUID: {uuid}</span>
                </div>

                <div className="doctor-signature-box">
                  <div className="signature-line" />
                  <strong className="signature-name">{doctor.name}</strong>
                  <span className="signature-sub">Authorized Medical Practitioner</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Fixed Footer Actions (Bottom) */}
        <footer className="pdf-preview-footer">
          <div className="footer-status-hint">
            <span>A4 Document Preview • Fit to screen</span>
          </div>
          <div className="footer-btn-actions">
            <button
              type="button"
              className="footer-btn secondary-btn"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="footer-btn secondary-btn print-btn"
              onClick={handlePrint}
            >
              🖨️ Print
            </button>
            <button
              type="button"
              className="footer-btn primary-download-btn"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? 'Generating PDF...' : '⬇ Download PDF'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
