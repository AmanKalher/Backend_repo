import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '../components/BrandLogo'

const steps = [
  { label: 'Personal Information', short: 'PERSONAL', number: '01' },
  { label: 'Professional Details', short: 'PROFESSIONAL', number: '02' },
  { label: 'Identity Verification', short: 'VERIFICATION', number: '03' },
]

const councilOptions = [
  'National Medical Commission (NMC) / MCI',
  'Andhra Pradesh Medical Council',
  'Assam Medical Council',
  'Bihar Medical Council',
  'Delhi Medical Council',
  'Goa Medical Council',
  'Gujarat Medical Council',
  'Karnataka Medical Council',
  'Kerala Medical Council',
  'Madhya Pradesh Medical Council',
  'Maharashtra Medical Council',
  'Odisha Medical Council',
  'Punjab Medical Council',
  'Rajasthan Medical Council',
  'Tamil Nadu Medical Council',
  'Telangana Medical Council',
  'Uttar Pradesh Medical Council',
  'West Bengal Medical Council',
  'Other State Medical Council',
]

const specializationOptions = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Psychiatry',
  'Gynecology',
  'ENT',
  'Ophthalmology',
  'Other',
]

const qualificationOptions = [
  'MBBS',
  'MBBS, MD',
  'MBBS, MS',
  'MBBS, DNB',
  'MBBS, MD, DM',
  'MBBS, MS, MCh',
  'Other',
]

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  medicalRegistrationNumber: '',
  stateMedicalCouncil: '',
  specialization: '',
  qualification: '',
  customQualification: '',
  hospitalClinic: '',
  yearsOfExperience: '',
  aadhaar: '',
}

function getPasswordStrength(password) {
  if (!password) return { label: '', percent: 0, level: 'empty' }
  if (password.length < 8) return { label: 'Too short (min 8 chars)', percent: 25, level: 'weak' }
  
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score >= 4) return { label: 'Strong password', percent: 100, level: 'strong' }
  if (score >= 2) return { label: 'Medium strength', percent: 65, level: 'medium' }
  return { label: 'Weak password', percent: 35, level: 'weak' }
}

function formatCountdown(seconds) {
  const safeSeconds = Math.max(seconds, 0)
  const mins = String(Math.floor(safeSeconds / 60)).padStart(2, '0')
  const secs = String(safeSeconds % 60).padStart(2, '0')
  return `${mins}:${secs}`
}

function EyeIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 4 20 20" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function SignupPage() {
  const { registerDoctor } = useAuth()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // OTP Verification state
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [countdown, setCountdown] = useState(28)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)
  const [createdProfile, setCreatedProfile] = useState(null)

  const otpRefs = useRef([])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (!otpSent || otpVerified) return
    if (countdown <= 0) return

    const timer = window.setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [otpSent, otpVerified, countdown])

  const strength = getPasswordStrength(form.password)

  // Input change handler
  const handleInput = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // Step 1 Validation
  const validateStep1 = () => {
    let isValid = true
    const newErrors = {}

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Doctor full name is required'
      isValid = false
    } else if (form.fullName.trim().length < 3) {
      newErrors.fullName = 'Please enter a valid full name'
      isValid = false
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Valid email address is required'
      isValid = false
    }

    const cleanPhone = form.phone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Valid 10-digit phone number is required'
      isValid = false
    }

    if (!form.password || form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
      isValid = false
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Step 2 Validation
  const validateStep2 = () => {
    let isValid = true
    const newErrors = {}

    if (!form.medicalRegistrationNumber.trim()) {
      newErrors.medicalRegistrationNumber = 'Medical registration number is required'
      isValid = false
    }

    if (!form.stateMedicalCouncil) {
      newErrors.stateMedicalCouncil = 'Please select your State Medical Council'
      isValid = false
    }

    if (!form.specialization) {
      newErrors.specialization = 'Please select your medical specialization'
      isValid = false
    }

    if (!form.qualification) {
      newErrors.qualification = 'Please select your qualification'
      isValid = false
    }

    if (!form.hospitalClinic.trim()) {
      newErrors.hospitalClinic = 'Hospital or clinic name is required'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Navigate to Step 2
  const handleContinueToStep2 = (e) => {
    if (e) e.preventDefault()
    if (validateStep1()) {
      setCurrentStep(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Navigate to Step 3 (Aadhaar verification)
  const handleContinueToStep3 = (e) => {
    if (e) e.preventDefault()
    if (validateStep2()) {
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handle direct step pill clicks
  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Aadhaar input format helper (XXXX XXXX XXXX)
  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12)
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
    setForm((prev) => ({ ...prev, aadhaar: formatted }))
    if (errors.aadhaar) setErrors((prev) => ({ ...prev, aadhaar: '' }))
  }

  // Send OTP
  const handleSendOtp = () => {
    const digits = form.aadhaar.replace(/\D/g, '')
    if (digits.length !== 12) {
      setErrors((prev) => ({ ...prev, aadhaar: 'Please enter a valid 12-digit Aadhaar number' }))
      return
    }

    setSendingOtp(true)
    setTimeout(() => {
      setSendingOtp(false)
      setOtpSent(true)
      setOtpVerified(false)
      setCountdown(28)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }, 600)
  }

  // OTP digit entry
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return

    const nextOtp = [...otp]
    nextOtp[index] = value
    setOtp(nextOtp)

    if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }))

    if (value && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (event) => {
    const pasted = (event.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    event.preventDefault()
    const nextOtp = Array(6).fill('')
    pasted.split('').forEach((digit, index) => {
      nextOtp[index] = digit
    })
    setOtp(nextOtp)
    const focusIndex = Math.min(pasted.length, 5)
    otpRefs.current[focusIndex]?.focus()
  }

  // Verify OTP
  const handleVerifyOtp = () => {
    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: 'Please enter the 6-digit verification code' }))
      return
    }

    setVerifyingOtp(true)
    setTimeout(() => {
      setVerifyingOtp(false)
      setOtpVerified(true)
    }, 700)
  }

  // Final Account Creation
  const handleCreateAccount = () => {
    if (!otpVerified) {
      setErrors((prev) => ({ ...prev, otp: 'Please complete identity verification' }))
      return
    }

    setCreatingAccount(true)

    const finalQualification =
      form.qualification === 'Other' && form.customQualification
        ? form.customQualification
        : form.qualification

    const profileData = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      medicalRegistrationNumber: form.medicalRegistrationNumber,
      stateMedicalCouncil: form.stateMedicalCouncil,
      specialization: form.specialization,
      qualification: finalQualification,
      hospitalClinic: form.hospitalClinic,
      yearsOfExperience: form.yearsOfExperience,
      identityVerified: true,
      identityVerificationStatus: 'Verified',
    }

    // Save in Auth Context and localStorage
    const saved = registerDoctor(profileData)
    setCreatedProfile(saved)

    setTimeout(() => {
      setCreatingAccount(false)
      setAccountCreated(true)
    }, 800)
  }

  return (
    <main className="signup-shell">
      {/* Left Brand Panel */}
      <div className="signup-brand-panel">
        <Link className="login-back" to="/" aria-label="Back to DiagNect home" title="Back to home">
          ←
        </Link>
        <div className="signup-brand-logo"><BrandLogo /></div>

        <div className="signup-visual-wrap">
          <p className="signup-visual-kicker">PATIENT CONTEXT • CLINICAL INTELLIGENCE • SECURE ACCESS</p>
          <img
            className="signup-medical-visual"
            src="/visual 2.png"
            alt="Medical professionals reviewing patient care information"
          />
        </div>

        <div className="signup-supporting-copy">
          <h2>Built for better clinical decisions.</h2>
          <p>
            Bring patient history, symptoms, medications, and clinical context together in one secure clinical workspace.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <section className="signup-panel">
        <div className="signup-form-wrap">
          {!accountCreated ? (
            <>
              {/* Step Progress Topbar */}
              <div className="signup-topbar">
                <div className="signup-progress" aria-label="Signup progress">
                  {steps.map((step, index) => (
                    <button
                      key={step.short}
                      type="button"
                      onClick={() => handleStepClick(index)}
                      className={`signup-progress-step ${
                        index === currentStep ? 'active' : ''
                      } ${index < currentStep ? 'done' : ''}`}
                    >
                      <span>{step.number}</span>
                      <small>{step.short}</small>
                    </button>
                  ))}
                </div>
                <span className="signup-progress-label">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>

              {/* ====================================================== */}
              {/* STEP 1: PERSONAL INFORMATION */}
              {/* ====================================================== */}
              {currentStep === 0 && (
                <div className="signup-step-panel">
                  <div className="signup-header">
                    <p className="eyebrow">Step 1 — Doctor Profile</p>
                    <h1>Create your DiagNect account</h1>
                    <p className="signup-subtitle">
                      Tell us a little about yourself to create your clinical workspace.
                    </p>
                  </div>

                  <form onSubmit={handleContinueToStep2} className="field-list" noValidate>
                    {/* Full Name */}
                    <div className="field-group">
                      <label htmlFor="fullName">Full Name</label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Dr. Rahul Sharma"
                        value={form.fullName}
                        onChange={handleInput}
                        className={errors.fullName ? 'input-error' : ''}
                        autoFocus
                      />
                      {errors.fullName && <span className="field-error-msg">{errors.fullName}</span>}
                    </div>

                    {/* Email Address */}
                    <div className="field-group">
                      <label htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="doctor@hospital.org"
                        value={form.email}
                        onChange={handleInput}
                        className={errors.email ? 'input-error' : ''}
                      />
                      {errors.email && <span className="field-error-msg">{errors.email}</span>}
                    </div>

                    {/* Phone Number */}
                    <div className="field-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={form.phone}
                        onChange={handleInput}
                        className={errors.phone ? 'input-error' : ''}
                      />
                      {errors.phone && <span className="field-error-msg">{errors.phone}</span>}
                    </div>

                    {/* Password */}
                    <div className="field-group">
                      <label htmlFor="password">Password</label>
                      <div className="password-wrap">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          value={form.password}
                          onChange={handleInput}
                          className={errors.password ? 'input-error' : ''}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          <EyeIcon visible={showPassword} />
                        </button>
                      </div>
                      {errors.password && <span className="field-error-msg">{errors.password}</span>}

                      {/* Password Strength Meter */}
                      {form.password && (
                        <div className="password-meter">
                          <div className="password-meter-bar">
                            <span
                              className={`strength strength-${strength.level}`}
                              style={{ width: `${strength.percent}%` }}
                            />
                          </div>
                          <small className={`password-label-text strength-text-${strength.level}`}>
                            {strength.label}
                          </small>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="field-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <div className="password-wrap">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={form.confirmPassword}
                          onChange={handleInput}
                          className={errors.confirmPassword ? 'input-error' : ''}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                          <EyeIcon visible={showConfirmPassword} />
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <span className="field-error-msg">{errors.confirmPassword}</span>
                      )}
                    </div>

                    <button type="submit" className="primary-button">
                      Continue →
                    </button>
                  </form>
                </div>
              )}

              {/* ====================================================== */}
              {/* STEP 2: PROFESSIONAL DETAILS */}
              {/* ====================================================== */}
              {currentStep === 1 && (
                <div className="signup-step-panel">
                  <div className="signup-header">
                    <p className="eyebrow">Step 2 — Clinical Practice</p>
                    <h1>Professional information</h1>
                    <p className="signup-subtitle">
                      Help us set up your clinical profile.
                    </p>
                  </div>

                  <form onSubmit={handleContinueToStep3} className="field-list" noValidate>
                    {/* Medical Registration Number */}
                    <div className="field-group">
                      <label htmlFor="medicalRegistrationNumber">Medical Registration Number</label>
                      <input
                        id="medicalRegistrationNumber"
                        name="medicalRegistrationNumber"
                        type="text"
                        placeholder="Enter registration number"
                        value={form.medicalRegistrationNumber}
                        onChange={handleInput}
                        className={errors.medicalRegistrationNumber ? 'input-error' : ''}
                        autoFocus
                      />
                      {errors.medicalRegistrationNumber && (
                        <span className="field-error-msg">{errors.medicalRegistrationNumber}</span>
                      )}
                    </div>

                    {/* State Medical Council */}
                    <div className="field-group">
                      <label htmlFor="stateMedicalCouncil">State Medical Council</label>
                      <select
                        id="stateMedicalCouncil"
                        name="stateMedicalCouncil"
                        value={form.stateMedicalCouncil}
                        onChange={handleInput}
                        className={errors.stateMedicalCouncil ? 'input-error' : ''}
                      >
                        <option value="">Select State Medical Council</option>
                        {councilOptions.map((council) => (
                          <option key={council} value={council}>
                            {council}
                          </option>
                        ))}
                      </select>
                      {errors.stateMedicalCouncil && (
                        <span className="field-error-msg">{errors.stateMedicalCouncil}</span>
                      )}
                    </div>

                    {/* Specialization */}
                    <div className="field-group">
                      <label htmlFor="specialization">Specialization</label>
                      <select
                        id="specialization"
                        name="specialization"
                        value={form.specialization}
                        onChange={handleInput}
                        className={errors.specialization ? 'input-error' : ''}
                      >
                        <option value="">Select Specialization</option>
                        {specializationOptions.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                      {errors.specialization && (
                        <span className="field-error-msg">{errors.specialization}</span>
                      )}
                    </div>

                    {/* Qualification & Experience Row */}
                    <div className="field-row two-col">
                      <div className="field-group">
                        <label htmlFor="qualification">Qualification</label>
                        <select
                          id="qualification"
                          name="qualification"
                          value={form.qualification}
                          onChange={handleInput}
                          className={errors.qualification ? 'input-error' : ''}
                        >
                          <option value="">Select Qualification</option>
                          {qualificationOptions.map((q) => (
                            <option key={q} value={q}>
                              {q}
                            </option>
                          ))}
                        </select>
                        {errors.qualification && (
                          <span className="field-error-msg">{errors.qualification}</span>
                        )}
                      </div>

                      <div className="field-group">
                        <label htmlFor="yearsOfExperience">Years of Experience</label>
                        <input
                          id="yearsOfExperience"
                          name="yearsOfExperience"
                          type="number"
                          min="0"
                          max="60"
                          placeholder="e.g. 8"
                          value={form.yearsOfExperience}
                          onChange={handleInput}
                        />
                      </div>
                    </div>

                    {/* Custom Qualification if 'Other' */}
                    {form.qualification === 'Other' && (
                      <div className="field-group">
                        <label htmlFor="customQualification">Specify Qualification</label>
                        <input
                          id="customQualification"
                          name="customQualification"
                          type="text"
                          placeholder="e.g. MBBS, M.Ch (Neurosurgery)"
                          value={form.customQualification}
                          onChange={handleInput}
                        />
                      </div>
                    )}

                    {/* Hospital / Clinic */}
                    <div className="field-group">
                      <label htmlFor="hospitalClinic">Hospital / Clinic</label>
                      <input
                        id="hospitalClinic"
                        name="hospitalClinic"
                        type="text"
                        placeholder="Hospital or clinic name"
                        value={form.hospitalClinic}
                        onChange={handleInput}
                        className={errors.hospitalClinic ? 'input-error' : ''}
                      />
                      {errors.hospitalClinic && (
                        <span className="field-error-msg">{errors.hospitalClinic}</span>
                      )}
                    </div>

                    <div className="step-actions-row">
                      <button
                        type="button"
                        className="secondary-button back-step-btn"
                        onClick={() => setCurrentStep(0)}
                      >
                        ← Back
                      </button>
                      <button type="submit" className="primary-button flex-1">
                        Continue to Identity Verification →
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ====================================================== */}
              {/* STEP 3: IDENTITY VERIFICATION (AADHAAR & OTP) */}
              {/* ====================================================== */}
              {currentStep === 2 && (
                <div className="signup-step-panel">
                  <div className="signup-header">
                    <p className="eyebrow">Step 3 — Identity Verification</p>
                    <h1>Verify your identity</h1>
                    <p className="signup-subtitle">
                      Securely verify your identity before creating your clinical workspace.
                    </p>
                  </div>

                  {!otpVerified ? (
                    <div className="field-list">
                      {/* Aadhaar Number Input */}
                      <div className="field-group">
                        <label htmlFor="aadhaar">Aadhaar Number</label>
                        <input
                          id="aadhaar"
                          name="aadhaar"
                          type="text"
                          inputMode="numeric"
                          maxLength={14}
                          placeholder="XXXX XXXX XXXX"
                          value={form.aadhaar}
                          onChange={handleAadhaarChange}
                          disabled={otpSent}
                          className={errors.aadhaar ? 'input-error' : ''}
                          autoFocus
                        />
                        {errors.aadhaar && <span className="field-error-msg">{errors.aadhaar}</span>}
                      </div>

                      <p className="security-note">
                        🔒 Identity verification is powered by secure national registry check. Your Aadhaar number is never stored or displayed on prescriptions.
                      </p>

                      {!otpSent ? (
                        <div className="step-actions-row">
                          <button
                            type="button"
                            className="secondary-button back-step-btn"
                            onClick={() => setCurrentStep(1)}
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            className="primary-button flex-1"
                            onClick={handleSendOtp}
                            disabled={sendingOtp || form.aadhaar.replace(/\D/g, '').length !== 12}
                          >
                            {sendingOtp ? 'Sending OTP...' : 'Send OTP →'}
                          </button>
                        </div>
                      ) : (
                        /* OTP Input State */
                        <div className="otp-state">
                          <div className="otp-label-row">
                            <h3>Verify your identity</h3>
                            <span className="countdown-pill">Resend in {formatCountdown(countdown)}</span>
                          </div>
                          <p>We've sent a verification code to your Aadhaar-linked mobile number.</p>

                          <div className="otp-grid" onPaste={handleOtpPaste}>
                            {otp.map((digit, index) => (
                              <input
                                key={index}
                                ref={(node) => {
                                  otpRefs.current[index] = node
                                }}
                                value={digit}
                                maxLength={1}
                                inputMode="numeric"
                                aria-label={`OTP digit ${index + 1}`}
                                className="otp-box"
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              />
                            ))}
                          </div>

                          {errors.otp && <span className="field-error-msg">{errors.otp}</span>}

                          <div className="otp-footer-row">
                            <button
                              type="button"
                              className="text-link"
                              disabled={countdown > 0}
                              onClick={() => {
                                setCountdown(28)
                                setOtp(['', '', '', '', '', ''])
                                otpRefs.current[0]?.focus()
                              }}
                            >
                              Didn't receive the code?{' '}
                              <span className={countdown > 0 ? 'text-muted' : 'text-purple'}>
                                Resend OTP
                              </span>
                            </button>

                            <button
                              type="button"
                              className="text-link"
                              onClick={() => {
                                setOtpSent(false)
                                setOtp(['', '', '', '', '', ''])
                              }}
                            >
                              Change Aadhaar number
                            </button>
                          </div>

                          <button
                            type="button"
                            className="primary-button"
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp || otp.join('').length !== 6}
                          >
                            {verifyingOtp ? 'Verifying...' : 'Verify identity →'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Verified Success Badge State */
                    <div className="field-list">
                      <div className="verification-success-box">
                        <div className="verification-success-icon">✓</div>
                        <div>
                          <h3>Identity verified</h3>
                          <p>Aadhaar identity confirmed for <strong>{form.fullName}</strong>.</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="primary-button"
                        onClick={handleCreateAccount}
                        disabled={creatingAccount}
                      >
                        {creatingAccount ? 'Creating account...' : 'Continue to DiagNect →'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Trust Badge at bottom */}
              <div className="signup-trust-banner">
                <span className="shield-icon">🔒</span>
                <span>Protected with 256-bit clinical encryption & secure identity verification.</span>
              </div>
            </>
          ) : (
            /* ====================================================== */
            /* SUCCESS SCREEN */
            /* ====================================================== */
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h2>Welcome to DiagNect, {createdProfile?.fullName || form.fullName}</h2>
              <p className="success-subtitle">Your clinical workspace is ready.</p>

              <div className="success-summary-card">
                <div className="summary-row-main">
                  <div className="summary-avatar" aria-hidden="true">
                    {(createdProfile?.fullName || form.fullName)
                      .replace(/^Dr\.\s*/i, '')
                      .charAt(0)
                      .toUpperCase() || 'D'}
                  </div>
                  <div className="summary-doctor-details">
                    <h4>{createdProfile?.fullName || form.fullName}</h4>
                    <p className="summary-spec">{createdProfile?.specialization || form.specialization}</p>
                    <p className="summary-hosp">{createdProfile?.hospitalClinic || form.hospitalClinic}</p>
                  </div>
                </div>

                <div className="summary-verification-badge">
                  <span className="badge-check">✓</span>
                  <span>Identity verified</span>
                </div>
              </div>

              <div className="success-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
