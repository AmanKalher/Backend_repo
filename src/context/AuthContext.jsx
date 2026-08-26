import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'diagnect_doctor_profile'

export function AuthProvider({ children }) {
  const [doctor, setDoctor] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error reading auth state from localStorage:', error)
    }
    return null
  })

  useEffect(() => {
    try {
      if (doctor) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doctor))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.error('Error writing auth state to localStorage:', error)
    }
  }, [doctor])

  const registerDoctor = (profileData) => {
    const cleanProfile = {
      fullName: profileData.fullName?.trim() || '',
      email: profileData.email?.trim() || '',
      phone: profileData.phone?.trim() || '',
      medicalRegistrationNumber: profileData.medicalRegistrationNumber?.trim() || '',
      stateMedicalCouncil: profileData.stateMedicalCouncil || '',
      specialization: profileData.specialization || '',
      qualification: profileData.qualification?.trim() || '',
      hospitalClinic: profileData.hospitalClinic?.trim() || '',
      yearsOfExperience: profileData.yearsOfExperience || '',
      identityVerified: true,
      identityVerificationStatus: 'Verified',
      createdAt: new Date().toISOString(),
    }
    setDoctor(cleanProfile)
    return cleanProfile
  }

  const loginDoctor = (email, password) => {
    // If matching existing profile in local storage or create session
    if (doctor && doctor.email?.toLowerCase() === email?.toLowerCase()) {
      return { success: true, doctor }
    }
    // If no existing doctor or different email, create a session with entered email
    const sessionDoctor = doctor || {
      fullName: 'Dr. Rahul Sharma',
      email: email || 'doctor@hospital.org',
      phone: '+91 98765 43210',
      medicalRegistrationNumber: 'MCI-2024-8842',
      stateMedicalCouncil: 'Delhi Medical Council',
      specialization: 'General Medicine',
      qualification: 'MBBS, MD',
      hospitalClinic: 'Apollo Clinic',
      yearsOfExperience: '6',
      identityVerified: true,
      identityVerificationStatus: 'Verified',
      createdAt: new Date().toISOString(),
    }
    setDoctor(sessionDoctor)
    return { success: true, doctor: sessionDoctor }
  }

  const logoutDoctor = () => {
    setDoctor(null)
  }

  return (
    <AuthContext.Provider
      value={{
        doctor,
        isAuthenticated: Boolean(doctor),
        registerDoctor,
        loginDoctor,
        logoutDoctor,
        setDoctor,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
