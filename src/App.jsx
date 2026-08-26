import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DoctorSignup from './pages/DoctorSignup'

function AppRoutes() {
  const location = useLocation()

  return (
    <div className="route-shell">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<DoctorSignup />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return <AppRoutes />
}
