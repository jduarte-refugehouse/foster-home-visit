/**
 * Google Cloud Speech-to-Text Streaming API Helper
 * Provides real-time streaming transcription like Google Docs
 */

import speech from '@google-cloud/speech'
import type { google } from '@google-cloud/speech/build/protos/protos'

type StreamingRecognizeRequest = google.cloud.speech.v1.IStreamingRecognizeRequest

export interface StreamingTranscriptionConfig {
  encoding?: 'LINEAR16' | 'FLAC' | 'MULAW' | 'AMR' | 'AMR_WB' | 'OGG_OPUS' | 'SPEEX_WITH_HEADER_BYTE' | 'WEBM_OPUS' | 'MP4' | 'MP3'
  sampleRateHertz?: number
  languageCode?: string
  enableAutomaticPunctuation?: boolean
  enableSpokenPunctuation?: boolean
  model?: 'command_and_search' | 'phone_call' | 'video' | 'default' | 'medical_dictation' | 'medical_conversation'
  interimResults?: boolean
}

export interface TranscriptionResult {
  transcript: string
  isFinal: boolean
  confidence?: number
  stability?: number
}

/**
 * Create a streaming recognition client
 * This maintains context across audio chunks like Google Docs
 */
export function createStreamingRecognitionClient(
  config: StreamingTranscriptionConfig = {},
  onResult: (result: TranscriptionResult) => void,
  onError: (error: Error) => void
) {
  // Initialize the Speech client with API key authentication
  const client = new speech.SpeechClient({
    apiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  })

  // Configure the streaming request
  const streamingConfig: google.cloud.speech.v1.IStreamingRecognitionConfig = {
    config: {
      encoding: config.encoding || 'WEBM_OPUS',
      sampleRateHertz: config.sampleRateHertz || 48000,
      languageCode: config.languageCode || 'en-US',
      enableAutomaticPunctuation: config.enableAutomaticPunctuation !== false,
      enableSpokenPunctuation: config.enableSpokenPunctuation !== false,
      model: config.model || 'default',
      useEnhanced: true, // Use enhanced model for better accuracy
    },
    interimResults: config.interimResults !== false, // Enable interim results by default
    singleUtterance: false, // Don't stop after detecting pause
  }

  console.log('🎤 [STREAMING] Creating streaming recognition client with config:', {
    encoding: streamingConfig.config?.encoding,
    sampleRate: streamingConfig.config?.sampleRateHertz,
    model: streamingConfig.config?.model,
    interimResults: streamingConfig.interimResults,
  })

  // Create the streaming recognize request
  const recognizeStream = client
    .streamingRecognize({ config: streamingConfig } as StreamingRecognizeRequest)
    .on('error', (error: Error) => {
      console.error('❌ [STREAMING] Recognition error:', error)
      onError(error)
    })
    .on('data', (data: google.cloud.speech.v1.IStreamingRecognizeResponse) => {
      if (!data.results || data.results.length === 0) {
        console.log('⚠️ [STREAMING] Empty result received')
        return
      }

      // Get the first result (most recent)
      const result = data.results[0]
      
      if (!result.alternatives || result.alternatives.length === 0) {
        console.log('⚠️ [STREAMING] No alternatives in result')
        return
      }

      const alternative = result.alternatives[0]
      const transcript = alternative.transcript || ''

      if (transcript) {
        const transcriptionResult: TranscriptionResult = {
          transcript,
          isFinal: result.isFinal || false,
          confidence: alternative.confidence || undefined,
          stability: result.stability || undefined,
        }

        console.log(`${result.isFinal ? '✅' : '🔄'} [STREAMING] ${result.isFinal ? 'Final' : 'Interim'}:`, {
          text: transcript.substring(0, 50) + (transcript.length > 50 ? '...' : ''),
          isFinal: result.isFinal,
          confidence: alternative.confidence,
          stability: result.stability,
        })

        onResult(transcriptionResult)
      }
    })

  return {
    /**
     * Send audio chunk to Google for transcription
     */
    write: (audioChunk: Buffer) => {
      try {
        recognizeStream.write(audioChunk)
      } catch (error) {
        console.error('❌ [STREAMING] Error writing audio chunk:', error)
        onError(error as Error)
      }
    },

    /**
     * End the streaming session
     */
    end: () => {
      console.log('🏁 [STREAMING] Ending recognition stream')
      recognizeStream.end()
    },

    /**
     * Destroy the stream (for errors/cleanup)
     */
    destroy: () => {
      console.log('🗑️ [STREAMING] Destroying recognition stream')
      recognizeStream.destroy()
    },
  }
}

/**
 * Check if Google Cloud Speech-to-Text streaming is available
 */
export function isStreamingSpeechAvailable(): boolean {
  return !!(process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
}

