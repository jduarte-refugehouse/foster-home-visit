import { type NextRequest, NextResponse } from 'next/server'
import { transcribeWithGoogleSpeech, isGoogleSpeechAvailable } from '@/lib/google-speech-helper'

export const runtime = 'nodejs'

/**
 * POST /api/speech/enhance
 * Enhances a transcript using Google Cloud Speech-to-Text API
 * This is used to improve punctuation and accuracy of Web Speech API transcripts
 * 
 * Request body:
 * {
 *   transcript: string (text to enhance)
 * }
 * 
 * Note: This endpoint doesn't actually re-transcribe audio.
 * It's a placeholder for future enhancement features.
 * For now, it just returns the transcript with better formatting.
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Google Speech is available
    if (!isGoogleSpeechAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Cloud Speech-to-Text API key not configured',
          fallback: 'web-speech-api',
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { transcript } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid transcript in request body',
        },
        { status: 400 }
      )
    }

    // For now, we can't enhance text without audio
    // This endpoint is a placeholder for future features
    // In a real implementation, you'd need to:
    // 1. Store the original audio
    // 2. Send it to Google Cloud Speech-to-Text
    // 3. Return the enhanced transcript
    
    // For now, just return the transcript as-is
    // The actual enhancement happens when audio is captured
    return NextResponse.json({
      success: true,
      enhancedTranscript: transcript,
      message: 'Google Cloud Speech-to-Text is available, but audio enhancement requires audio data',
    })
  } catch (error) {
    console.error('❌ [API] Speech enhancement error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


