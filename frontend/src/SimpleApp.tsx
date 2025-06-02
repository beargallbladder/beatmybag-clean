import { useState } from 'react'

// Simple self-contained BeatMyBag app
export function SimpleApp() {
  const [page, setPage] = useState('login')
  const [shots, setShots] = useState<any[]>([])
  const [analyzing, setAnalyzing] = useState(false)

  // Fake login
  const handleLogin = () => {
    localStorage.setItem('token', 'fake-token')
    setPage('dashboard')
  }

  // Fake shot analysis
  const handleCapture = () => {
    setAnalyzing(true)
    setTimeout(() => {
      const fakeShot = {
        id: Date.now(),
        club: '7 Iron',
        ballSpeed: Math.floor(Math.random() * 30) + 120,
        carry: Math.floor(Math.random() * 30) + 150,
        total: Math.floor(Math.random() * 30) + 160,
        timestamp: new Date().toLocaleTimeString()
      }
      setShots([fakeShot, ...shots].slice(0, 10))
      setAnalyzing(false)
      alert(`Shot analyzed! ${fakeShot.club}: ${fakeShot.carry} yards`)
    }, 2000)
  }

  // Login Page
  if (page === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BeatMyBag</h1>
          <p className="text-gray-600 mb-6">Track your golf shots with AI</p>
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Start Tracking Shots
          </button>
          <p className="text-sm text-gray-500 mt-4">Free: 30 shots • Pro: Unlimited for $7.99/year</p>
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
                      <div className="text-xs text-gray-500">{shot.timestamp}</div>
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