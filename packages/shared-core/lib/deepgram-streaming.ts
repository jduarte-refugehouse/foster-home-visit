/**
 * Deepgram Real-Time Speech-to-Text
 * Specifically designed for browser streaming - works like Google Docs
 */

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'

export interface DeepgramConfig {
  model?: 'nova-2' | 'nova' | 'enhanced' | 'base'
  language?: string
  punctuate?: boolean
  interimResults?: boolean
  endpointing?: number | false
}

export interface TranscriptionResult {
  transcript: string
  isFinal: boolean
  confidence?: number
}

/**
 * Create a Deepgram live transcription connection
 * Returns WebSocket URL for browser to connect directly
 */
export async function createDeepgramLiveConnection(config: DeepgramConfig = {}) {
  const apiKey = process.env.DEEPGRAM_API_KEY
  
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY not configured')
  }

  const deepgram = createClient(apiKey)

  // Configure live transcription
  const connection = deepgram.listen.live({
    model: config.model || 'nova-2', // Best accuracy
    language: config.language || 'en-US',
    punctuate: config.punctuate !== false,
    interim_results: config.interimResults !== false,
    endpointing: config.endpointing === false ? false : 300, // 300ms silence = end of utterance
    smart_format: true, // Automatic formatting
    utterance_end_ms: config.endpointing === false ? undefined : 1000,
  })

  console.log('🎤 [DEEPGRAM] Created live transcription connection')

  return connection
}

/**
 * Check if Deepgram is available
 */
export function isDeepgramAvailable(): boolean {
  return !!process.env.DEEPGRAM_API_KEY
}

