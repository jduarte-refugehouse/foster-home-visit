import { type NextRequest, NextResponse } from 'next/server'
import { transcribeWithGoogleSpeech, isGoogleSpeechAvailable } from '@/lib/google-speech-helper'

export const runtime = 'nodejs'

/**
 * POST /api/speech/transcribe
 * Transcribes audio using Google Cloud Speech-to-Text API
 * 
 * Request body:
 * {
 *   audioData: string (base64 encoded audio)
 *   encoding?: string (audio encoding, default: 'WEBM_OPUS')
 *   sampleRateHertz?: number (default: 16000 for WebM Opus)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Google Speech is available
    if (!isGoogleSpeechAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Cloud Speech-to-Text API key not configured. Please set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
          fallback: 'web-speech-api',
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { audioData, encoding, sampleRateHertz } = body

    if (!audioData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing audioData in request body',
        },
        { status: 400 }
      )
    }

    console.log('🎤 [API] Transcribing audio:', {
      encoding: encoding || 'WEBM_OPUS',
      sampleRate: sampleRateHertz || 16000,
      dataLength: audioData.length,
    })

    // Transcribe using Google Cloud Speech-to-Text
    const result = await transcribeWithGoogleSpeech(audioData, {
      encoding: (encoding as any) || 'WEBM_OPUS',
      sampleRateHertz: sampleRateHertz || 16000, // WebM Opus typically uses 16kHz
      enableAutomaticPunctuation: true,
      enableSpokenPunctuation: true,
      model: 'latest_long', // Better for longer transcripts
    })

    console.log('✅ [API] Transcription successful:', {
      transcriptLength: result.transcript.length,
      confidence: result.confidence,
    })

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      confidence: result.confidence,
    })
  } catch (error) {
    console.error('❌ [API] Speech transcription error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/speech/transcribe
 * Check if Google Cloud Speech-to-Text is available
 */
export async function GET() {
  const available = isGoogleSpeechAvailable()
  return NextResponse.json({
    available,
    message: available
      ? 'Google Cloud Speech-to-Text is available'
      : 'Google Cloud Speech-to-Text API key not configured. Using Web Speech API fallback.',
  })
}

