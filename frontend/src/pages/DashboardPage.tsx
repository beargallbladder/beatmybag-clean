import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, TrendingUp, Users } from 'lucide-react'
import { AuthService } from '../services/auth'
import { ShotService } from '../services/shots'
import type { Shot } from '../types'

export function DashboardPage() {
  const [shots, setShots] = useState<Shot[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [lastShot, setLastShot] = useState<Shot | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const auth = AuthService.getInstance()

  const handleCapture = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAnalyzing(true)
    try {
      const shotService = new ShotService()
      const result = await shotService.analyzeShot(file)
      
      // Add to running memory
      const newShots = [result.shot, ...shots].slice(0, 10) // Keep last 10
      setShots(newShots)
      setLastShot(result.shot)
      
      // Auto-navigate to result view
      navigate('/shot-result', { state: { shot: result.shot, isNew: true } })
    } catch (error: any) {
      if (error.response?.status === 403) {
        // No credits - prompt to login or upgrade
        navigate('/upgrade')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const quickStats = {
    todayShots: shots.filter(s => {
      const today = new Date().toDateString()
      return new Date(s.createdAt).toDateString() === today
    }).length,
    avgCarry: shots.length > 0 
      ? Math.round(shots.reduce((acc, s) => acc + s.carry, 0) / shots.length)
      : 0,
    lastClub: lastShot?.club || '—'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">BeatMyBag</h1>
          <button 
            onClick={() => auth.logout()}
            className="text-sm text-gray-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{quickStats.todayShots}</div>
            <div className="text-xs text-gray-600">Today</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{quickStats.avgCarry}</div>
            <div className="text-xs text-gray-600">Avg Carry</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{quickStats.lastClub}</div>
            <div className="text-xs text-gray-600">Last Club</div>
          </div>
        </div>

        {/* Big Capture Button */}
        <button
          onClick={handleCapture}
          disabled={analyzing}
          className="w-full h-32 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl shadow-lg flex flex-col items-center justify-center space-y-2 disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
              <span className="text-sm">Analyzing...</span>
            </>
          ) : (
            <>
              <Camera size={32} />
              <span className="text-lg font-semibold">Capture Shot</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Recent Shots */}
        {shots.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Shots</h2>
            <div className="space-y-2">
              {shots.map((shot) => (
                <div 
                  key={shot.id}
                  onClick={() => navigate('/shot-result', { state: { shot } })}
                  className="bg-white rounded-lg p-3 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="font-semibold">{shot.club}</div>
                    <div className="text-sm text-gray-600">
                      {shot.carry} carry • {shot.total} total
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      {shot.ballSpeed} mph
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(shot.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retailer CTA */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 text-white">
          <div className="flex items-start space-x-3">
            <Users className="flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-semibold">Are you a retailer?</h3>
              <p className="text-sm opacity-90 mt-1">
                Get advanced analytics, lead generation, and customer management for $399/month
              </p>
              <button 
                onClick={() => navigate('/retailer-info')}
                className="mt-2 text-sm font-semibold underline"
              >
                Learn More →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 