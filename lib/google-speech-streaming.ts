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
  // Initialize the Speech client with service account credentials
  let client: speech.SpeechClient
  
  try {
    // Check for service account credentials
    const credentialsJSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    
    if (credentialsJSON) {
      // Use credentials from environment variable (JSON string)
      console.log('🔑 [STREAMING] Using service account from GOOGLE_APPLICATION_CREDENTIALS_JSON')
      const credentials = JSON.parse(credentialsJSON)
      client = new speech.SpeechClient({
        credentials,
      })
    } else if (credentialsPath) {
      // Use credentials from file path
      console.log('🔑 [STREAMING] Using service account from GOOGLE_APPLICATION_CREDENTIALS file')
      client = new speech.SpeechClient({
        keyFilename: credentialsPath,
      })
    } else {
      // Try API key (may not work for streaming, but worth trying)
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (apiKey) {
        console.log('🔑 [STREAMING] Attempting to use API key (may not work for streaming)')
        client = new speech.SpeechClient({
          apiKey,
        })
      } else {
        throw new Error('No authentication configured. Set GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS')
      }
    }
    
    console.log('✅ [STREAMING] Speech client created successfully')
  } catch (error) {
    console.error('❌ [STREAMING] Failed to create Speech client:', error)
    throw new Error(`Failed to initialize Google Speech client: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

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
  console.log('🎤 [STREAMING] Initiating streamingRecognize call to Google...')
  
  const recognizeStream = client
    .streamingRecognize({ config: streamingConfig } as StreamingRecognizeRequest)
    .on('error', (error: Error) => {
      console.error('❌ [STREAMING] Recognition error:', error)
      console.error('❌ [STREAMING] Error details:', JSON.stringify(error, null, 2))
      onError(error)
    })
    .on('data', (data: google.cloud.speech.v1.IStreamingRecognizeResponse) => {
      console.log('📨 [STREAMING] Received data from Google:', JSON.stringify(data, null, 2))
      
      if (!data.results || data.results.length === 0) {
        console.log('⚠️ [STREAMING] Empty result received - no results array')
        
        // Check if there's an error in the response
        if (data.error) {
          console.error('❌ [STREAMING] Error in response:', data.error)
          onError(new Error(`Google API error: ${data.error.message}`))
        }
        return
      }

      // Get the first result (most recent)
      const result = data.results[0]
      console.log('📝 [STREAMING] Processing result:', {
        isFinal: result.isFinal,
        stability: result.stability,
        alternativesCount: result.alternatives?.length || 0,
      })
      
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
      } else {
        console.log('⚠️ [STREAMING] Empty transcript in alternative')
      }
    })
    .on('end', () => {
      console.log('🏁 [STREAMING] Recognition stream ended by Google')
    })
    .on('close', () => {
      console.log('🔒 [STREAMING] Recognition stream closed')
    })

  return {
    /**
     * Send audio chunk to Google for transcription
     */
    write: (audioChunk: Buffer) => {
      try {
        // Google Streaming API expects request objects, not raw buffers
        recognizeStream.write({
          audioContent: audioChunk,
        })
        console.log('✍️ [STREAMING] Wrote audio chunk to Google:', audioChunk.length, 'bytes')
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
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  )
}

