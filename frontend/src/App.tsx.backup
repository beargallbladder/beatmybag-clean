import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ShotResultPage } from './pages/ShotResultPage'
import { ShotAnalyzer } from './pages/ShotAnalyzer'
import { AuthService } from './services/auth'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const auth = AuthService.getInstance()
    setIsAuthenticated(auth.isAuthenticated())
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/shot-result" 
          element={
            isAuthenticated ? <ShotResultPage /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/analyze" 
          element={
            isAuthenticated ? <ShotAnalyzer /> : <Navigate to="/login" />
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  )
}

export default App 