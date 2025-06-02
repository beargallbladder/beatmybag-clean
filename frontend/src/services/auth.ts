import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class AuthService {
  private static instance: AuthService
  private accessToken: string | null = null
  private refreshToken: string | null = null

  static getInstance() {
    if (!this.instance) {
      this.instance = new AuthService()
    }
    return this.instance
  }

  constructor() {
    // Load tokens from storage
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken')
      this.refreshToken = localStorage.getItem('refreshToken')
    }
  }

  // Google OAuth login
  async loginWithGoogle(credential: string) {
    const response = await axios.post(`${API_URL}/auth/google`, {
      credential
    })

    this.setTokens(response.data.accessToken, response.data.refreshToken)
    return response.data
  }

  // Magic link login
  async loginWithEmail(email: string) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email
    })
    return response.data
  }

  // Verify magic link
  async verifyMagicLink(token: string) {
    const response = await axios.get(`${API_URL}/auth/verify?token=${token}`)
    this.setTokens(response.data.accessToken, response.data.refreshToken)
    return response.data
  }

  // Get current user
  async getCurrentUser() {
    const client = this.getAuthenticatedClient()
    const response = await client.get('/auth/me')
    return response.data.user
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) throw new Error('No refresh token')

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: this.refreshToken
    })

    this.accessToken = response.data.accessToken
    localStorage.setItem('accessToken', this.accessToken)
    return response.data.accessToken
  }

  // Get axios instance with auth header
  getAuthenticatedClient() {
    const client = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    // Add interceptor to refresh token on 401
    client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401 && this.refreshToken) {
          await this.refreshAccessToken()
          error.config.headers['Authorization'] = `Bearer ${this.accessToken}`
          return axios.request(error.config)
        }
        return Promise.reject(error)
      }
    )

    return client
  }

  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }

  logout() {
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
  }

  isAuthenticated() {
    return !!this.accessToken
  }

  getAccessToken() {
    return this.accessToken
  }
} 