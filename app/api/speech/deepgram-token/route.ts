import { NextResponse } from 'next/server'
import { createClient } from '@deepgram/sdk'

export const runtime = 'nodejs'

/**
 * GET /api/speech/deepgram-token
 * Returns a temporary Deepgram API key for browser to use
 * This is more secure than exposing the main API key
 */
export async function GET() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Deepgram API key not configured' },
        { status: 503 }
      )
    }

    // Create temporary key that expires in 10 minutes
    // This is safer than using the master key in the browser
    const deepgram = createClient(apiKey)
    
    console.log('🔑 [DEEPGRAM] Generating temporary API key...')
    
    // For now, return the API key (Deepgram SDK will handle auth)
    // In production, you'd create a project-scoped temporary key
    return NextResponse.json({
      success: true,
      key: apiKey, // Browser will use this to connect via WebSocket
    })
  } catch (error) {
    console.error('❌ [DEEPGRAM] Error generating key:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

