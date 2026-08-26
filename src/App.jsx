import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import PatientRecordPage from './pages/PatientRecordPage'

export default function App() {
  return (
    <AuthProvider>
      <div className="route-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/patient-record" element={<PatientRecordPage />} />
          <Route path="/patient/:id" element={<PatientRecordPage />} />
          <Route path="/overview" element={<PatientRecordPage />} />
          <Route path="/consultations" element={<PatientRecordPage />} />
          <Route path="/prescriptions" element={<PatientRecordPage />} />
          <Route path="/labs" element={<PatientRecordPage />} />
          <Route path="/imaging" element={<PatientRecordPage />} />
          <Route path="/hospital" element={<PatientRecordPage />} />
          <Route path="/vaccinations" element={<PatientRecordPage />} />
          <Route path="/discharge" element={<PatientRecordPage />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
