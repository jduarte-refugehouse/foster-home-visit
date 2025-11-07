/**
 * Google Cloud Speech-to-Text API Helper
 * Uses the same API key as Google Maps
 */

interface SpeechRecognitionConfig {
  encoding?: 'LINEAR16' | 'FLAC' | 'MULAW' | 'AMR' | 'AMR_WB' | 'OGG_OPUS' | 'SPEEX_WITH_HEADER_BYTE' | 'WEBM_OPUS'
  sampleRateHertz?: number
  languageCode?: string
  enableAutomaticPunctuation?: boolean
  enableSpokenPunctuation?: boolean
  enableSpokenEmojis?: boolean
  model?: 'default' | 'command_and_search' | 'phone_call' | 'video' | 'latest_long' | 'latest_short'
}

interface SpeechRecognitionResult {
  transcript: string
  confidence: number
}

/**
 * Transcribe audio using Google Cloud Speech-to-Text API
 * @param audioData - Base64 encoded audio data or audio buffer
 * @param config - Recognition configuration
 * @returns Transcribed text with punctuation
 */
export async function transcribeWithGoogleSpeech(
  audioData: string | Buffer,
  config: SpeechRecognitionConfig = {}
): Promise<SpeechRecognitionResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
  }

  // Convert audio data to base64 if it's a Buffer
  const audioContent = typeof audioData === 'string' ? audioData : audioData.toString('base64')

  // Default configuration with automatic punctuation enabled
  const recognitionConfig: any = {
    encoding: config.encoding || 'WEBM_OPUS',
    sampleRateHertz: config.sampleRateHertz || 48000,
    languageCode: config.languageCode || 'en-US',
    enableAutomaticPunctuation: config.enableAutomaticPunctuation !== false, // Default to true
    enableSpokenPunctuation: config.enableSpokenPunctuation !== false, // Default to true
    enableSpokenEmojis: config.enableSpokenEmojis || false,
    model: config.model || 'latest_long', // Use latest_long for better accuracy on longer transcripts
    ...config,
  }

  const requestBody = {
    config: recognitionConfig,
    audio: {
      content: audioContent,
    },
  }

  const url = 'https://speech.googleapis.com/v1/speech:recognize'

  try {
    console.log('🎤 [GOOGLE SPEECH] Sending transcription request...')
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ [GOOGLE SPEECH] API error:', response.status, errorData)
      throw new Error(
        `Google Speech-to-Text API error: ${response.status} ${errorData.error?.message || response.statusText}`
      )
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      console.log('⚠️ [GOOGLE SPEECH] No transcription results')
      return {
        transcript: '',
        confidence: 0,
      }
    }

    // Get the best result (highest confidence)
    const bestResult = data.results[0]
    const alternative = bestResult.alternatives[0]

    console.log('✅ [GOOGLE SPEECH] Transcription successful:', {
      transcript: alternative.transcript.substring(0, 100),
      confidence: alternative.confidence,
    })

    return {
      transcript: alternative.transcript,
      confidence: alternative.confidence || 0,
    }
  } catch (error) {
    console.error('❌ [GOOGLE SPEECH] Transcription failed:', error)
    throw error
  }
}

/**
 * Check if Google Cloud Speech-to-Text is available (API key configured)
 */
export function isGoogleSpeechAvailable(): boolean {
  return !!(process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
}

