import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Trash2 } from 'lucide-react'
import type { Shot } from '../types'

export function ShotResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { shot, isNew } = location.state as { shot: Shot; isNew?: boolean }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'My Golf Shot',
        text: `${shot.club}: ${shot.carry} yards carry, ${shot.total} yards total`,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-700"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="flex space-x-2">
            <button onClick={handleShare} className="p-2">
              <Share2 size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        {isNew && (
          <div className="mb-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center">
            ✅ Shot analyzed successfully!
          </div>
        )}

        {/* Club & Main Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
            {shot.club}
          </h1>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{shot.carry}</div>
              <div className="text-sm text-gray-600">Carry (yards)</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{shot.total}</div>
              <div className="text-sm text-gray-600">Total (yards)</div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Ball Speed</span>
              <span className="font-semibold">{shot.ballSpeed} mph</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Launch Angle</span>
              <span className="font-semibold">{shot.launchAngle}°</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Spin Rate</span>
              <span className="font-semibold">{shot.spinRate} rpm</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Confidence</span>
              <span className="font-semibold">{Math.round(shot.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Shot Image */}
        {shot.imageUrl && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4">
            <img 
              src={shot.imageUrl} 
              alt="Golf shot" 
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Take Another Shot
          </button>
          <button
            onClick={() => navigate('/analyze')}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View History
          </button>
        </div>
      </div>
    </div>
  )
} 