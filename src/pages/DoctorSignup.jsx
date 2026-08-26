import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function DoctorSignup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // States
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [medicalRegNumber, setMedicalRegNumber] = useState('');
    // --> NEW: State to hold the uploaded file
    const [medicalDocument, setMedicalDocument] = useState(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSmartBack = () => {
        if (step === 3) {
            setStep(2);
        } else if (step === 2) {
            setStep(1);
        } else {
            navigate('/');
        }
    };

    const handleAadhaarSubmit = (event) => {
        event.preventDefault();
        setError('');
        const isValidAadhaar = /^\d{12}$/.test(aadhaarNumber);

        if (!isValidAadhaar) {
            setError('Please enter a valid 12-digit Aadhaar number.');
            return;
        }
        if (medicalRegNumber.trim() === '') {
            setError('Please enter your Medical Registration Number.');
            return;
        }
        // --> NEW: Check if they uploaded a document
        if (!medicalDocument) {
            setError('Please upload your Medical Registration Document.');
            return;
        }
        setStep(2);
    };

    const handleOtpSubmit = (event) => {
        event.preventDefault();
        setStep(3);
    };

    const handleFinalSubmit = (event) => {
        event.preventDefault();
        // Final check placeholder!
        alert(`Ready to send to Backend!\nEmail: ${email}\nDocument attached: ${medicalDocument.name}`);
    };

    return (
        <main className="signup-shell">
            <button
                className="login-back"
                onClick={handleSmartBack}
                aria-label="Go back"
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
            >
                ←
            </button>

            <section className="signup-panel">
                <div className="signup-form-wrap">
                    <p className="eyebrow">Doctor registration</p>

                    <h1>
                        {step === 1 && 'Verify Identity'}
                        {step === 2 && 'Enter OTP'}
                        {step === 3 && 'Account Details'}
                    </h1>

                    <p className="login-subtitle">
                        {step === 1 && 'Verify your identity to create your doctor account.'}
                        {step === 2 && `We sent a code to the number linked to Aadhaar ending in ${aadhaarNumber.slice(-4)}`}
                        {step === 3 && 'Set up your login credentials.'}
                    </p>

                    {step === 1 && (
                        <form onSubmit={handleAadhaarSubmit}>
                            <label htmlFor="aadhaar">Aadhaar number</label>
                            <input
                                id="aadhaar"
                                type="text"
                                placeholder="Enter your 12-digit number"
                                maxLength="12"
                                value={aadhaarNumber}
                                onChange={(e) => setAadhaarNumber(e.target.value)}
                            />

                            <label htmlFor="medicalReg" style={{ marginTop: '15px', display: 'block' }}>
                                Medical Registration Number (NMC/SMC)
                            </label>
                            <input
                                id="medicalReg"
                                type="text"
                                placeholder="e.g., DMC-12345"
                                value={medicalRegNumber}
                                onChange={(e) => setMedicalRegNumber(e.target.value)}
                            />

                            {/* --> NEW: File Upload Input */}
                            <label htmlFor="medicalDoc" style={{ marginTop: '15px', display: 'block' }}>
                                Upload Medical Registration Certificate (PDF/Image)
                            </label>
                            <input
                                id="medicalDoc"
                                type="file"
                                accept=".pdf, image/jpeg, image/png"
                                onChange={(e) => setMedicalDocument(e.target.files[0])}
                                style={{ marginTop: '5px', marginBottom: '10px' }}
                            />

                            {error && <p style={{ color: 'red', fontSize: '14px', marginTop: '4px', marginBottom: '10px' }}>{error}</p>}

                            <button type="submit" className="submit-button" style={{ marginTop: '15px' }}>
                                Verify Details
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleOtpSubmit}>
                            <label htmlFor="otp">One Time Password</label>
                            <input
                                id="otp"
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                maxLength="6"
                            />
                            <button type="submit" className="submit-button" style={{ marginTop: '15px' }}>
                                Confirm OTP
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleFinalSubmit}>
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="doctor@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <label htmlFor="password" style={{ marginTop: '15px', display: 'block' }}>Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ marginBottom: '15px' }}
                            />

                            <button type="submit" className="submit-button">
                                Create Doctor Account
                            </button>
                        </form>
                    )}

                    <p className="signup-copy">
                        Already have an account?{' '}
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </section>
        </main>
    )
}