import { useState } from 'react'

// ⚠️ IMPORTANT: Use the PUBLIC Railway URL, not .railway.internal
// Get it from Railway dashboard → Settings → Domains
const API_URL = 'https://golf-production-a62b.up.railway.app' // ✅ Your Railway URL!

// Simple self-contained BeatMyBag app
export function SimpleApp() {
  const [page, setPage] = useState('login')
  const [shots, setShots] = useState<any[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [email, setEmail] = useState('')

  // Real login
  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || 'test@example.com' })
      })
      const data = await res.json()
      localStorage.setItem('token', data.token)
      setPage('dashboard')
    } catch (err) {
      alert('Login failed - check if backend is running')
    }
  }

  // Real shot analysis
  const handleCapture = async () => {
    setAnalyzing(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/shots/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ captureData: { timestamp: Date.now() } })
      })
      const data = await res.json()
      if (data.shot) {
        setShots([data.shot, ...shots].slice(0, 10))
        alert(`Shot analyzed! ${data.shot.club}: ${data.shot.carry} yards`)
      }
    } catch (err) {
      alert('Analysis failed - check backend')
    }
    setAnalyzing(false)
  }

  // Login Page
  if (page === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BeatMyBag</h1>
          <p className="text-gray-600 mb-6">Track your golf shots with AI</p>
          <input
            type="email"
            placeholder="Enter email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Start Tracking Shots
          </button>
          <p className="text-sm text-gray-500 mt-4">Free: 30 shots • Pro: Unlimited for $7.99/year</p>
          <p className="text-xs text-red-500 mt-2">Backend URL: {API_URL}</p>
        </div>
      </div>
    )
  }

  // Dashboard Page
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">BeatMyBag</h1>
        <button 
          onClick={() => {
            localStorage.removeItem('token')
            setPage('login')
          }}
          className="text-sm text-gray-600"
        >
          Logout
        </button>
      </div>

      <div className="p-4">
        <button
          onClick={handleCapture}
          disabled={analyzing}
          className="w-full h-32 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg flex items-center justify-center"
        >
          {analyzing ? (
            <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <div className="text-center">
              <div className="text-3xl mb-1">📸</div>
              <div className="text-lg font-semibold">Capture Shot</div>
            </div>
          )}
        </button>

        {shots.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Shots</h2>
            <div className="space-y-2">
              {shots.map((shot) => (
                <div key={shot.id} className="bg-white rounded-lg p-3 shadow">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">{shot.club}</div>
                      <div className="text-sm text-gray-600">{shot.carry} carry • {shot.total} total</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">{shot.ballSpeed} mph</div>
                      <div className="text-xs text-gray-500">{new Date(shot.timestamp || Date.now()).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-4">
          <h3 className="font-semibold">🚀 Go Pro!</h3>
          <p className="text-sm mt-1">Unlimited shots + 30-day history for just $7.99/year</p>
          <button className="mt-2 bg-white text-orange-600 px-4 py-1 rounded text-sm font-semibold">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default SimpleApp 