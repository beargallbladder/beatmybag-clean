import { GoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { AuthService } from '../services/auth'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const auth = AuthService.getInstance()

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true)
      await auth.loginWithGoogle(credentialResponse.credential)
      onLogin()
    } catch (error) {
      setMessage('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await auth.loginWithEmail(email)
      setMessage('Check your email for the login link!')
      setEmail('')
    } catch (error) {
      setMessage('Failed to send login link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to BeatMyBag</h2>
          <p className="mt-2 text-gray-600">Track your golf shots with AI precision</p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setMessage('Google login failed')}
              useOneTap
              theme="filled_blue"
              size="large"
              text="continue_with"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Send Magic Link'}
            </button>
          </form>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('Check your email') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Free users get 10 shots/month</p>
          <p>Pro users get unlimited shots for $5/year</p>
        </div>
      </div>
    </div>
  )
} 