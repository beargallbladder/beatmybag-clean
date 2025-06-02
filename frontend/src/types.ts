// User types
export interface User {
  id: string
  email: string
  role: 'free' | 'pro' | 'dealer' | 'admin'
  credits: number
  name?: string
  picture?: string
}

// Shot types
export interface Shot {
  id: string
  userId: string
  ballSpeed: number
  launchAngle: number
  spinRate: number
  carry: number
  total: number
  club: string
  confidence: number
  imageUrl: string
  tags: string[]
  createdAt: string
}

// Session types (for dealers)
export interface Session {
  id: string
  dealerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  notes?: string
  tags: string[]
  shots: string[]
  sharedAt?: string
  createdAt: string
}

// API Response types
export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface ShotAnalysisResponse {
  shot: Shot
  creditsRemaining: number
  analysisDetails: {
    confidence: number
    modelTier: 'standard' | 'premium'
    processingNote: string
  }
}

export interface ShotsListResponse {
  items: Shot[]
  nextCursor?: string
  hasMore: boolean
}

export interface ErrorResponse {
  error: string
} 