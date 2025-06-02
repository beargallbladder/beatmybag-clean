import { AuthService } from './auth'
import type { Shot, ShotAnalysisResponse } from '../types'

export class ShotService {
  private auth: AuthService

  constructor() {
    this.auth = AuthService.getInstance()
  }

  async analyzeShot(imageFile: File): Promise<ShotAnalysisResponse> {
    const formData = new FormData()
    formData.append('image', imageFile)

    const client = this.auth.getAuthenticatedClient()
    const response = await client.post('/shots/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  async getShots(limit = 20, cursor?: string): Promise<{ items: Shot[], nextCursor?: string, hasMore: boolean }> {
    const client = this.auth.getAuthenticatedClient()
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    if (cursor) params.append('cursor', cursor)

    const response = await client.get(`/shots?${params.toString()}`)
    return response.data
  }

  async deleteShot(shotId: string): Promise<void> {
    const client = this.auth.getAuthenticatedClient()
    await client.delete(`/shots/${shotId}`)
  }
} 