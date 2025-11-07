import { type NextRequest } from 'next/server'
import { createStreamingRecognitionClient, isStreamingSpeechAvailable } from '@/lib/google-speech-streaming'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/speech/stream
 * Streaming Speech-to-Text endpoint using Server-Sent Events (SSE)
 * 
 * This provides real-time transcription like Google Docs:
 * - Client sends audio chunks in the request body
 * - Server streams back interim and final transcription results
 * - Maintains context across the entire session
 * 
 * Request body: Raw audio data (WebM/Opus)
 * Query params:
 *   - encoding: Audio encoding (default: WEBM_OPUS)
 *   - sampleRate: Sample rate in Hz (default: 48000)
 *   - model: Recognition model (default: default)
 */
export async function POST(request: NextRequest) {
  // Check if streaming is available
  if (!isStreamingSpeechAvailable()) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Google Cloud Speech-to-Text API key not configured',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Get configuration from query params
  const { searchParams } = new URL(request.url)
  const encoding = (searchParams.get('encoding') || 'WEBM_OPUS') as any
  const sampleRate = parseInt(searchParams.get('sampleRate') || '48000', 10)
  const model = (searchParams.get('model') || 'default') as any

  console.log('🎤 [STREAMING API] Starting streaming recognition:', {
    encoding,
    sampleRate,
    model,
  })

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // Helper to send SSE message
      const sendMessage = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Create streaming recognition client
      const recognitionStream = createStreamingRecognitionClient(
        {
          encoding,
          sampleRateHertz: sampleRate,
          model,
          enableAutomaticPunctuation: true,
          enableSpokenPunctuation: true,
          interimResults: true,
        },
        // onResult callback
        (result) => {
          sendMessage({
            type: result.isFinal ? 'final' : 'interim',
            transcript: result.transcript,
            confidence: result.confidence,
            stability: result.stability,
          })
        },
        // onError callback
        (error) => {
          console.error('❌ [STREAMING API] Recognition error:', error)
          sendMessage({
            type: 'error',
            error: error.message,
          })
          controller.close()
        }
      )

      // Process incoming audio data
      ;(async () => {
        try {
          const reader = request.body?.getReader()
          if (!reader) {
            throw new Error('No request body')
          }

          // Send keepalive to establish connection
          sendMessage({ type: 'connected' })

          // Read and process audio chunks
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              console.log('📥 [STREAMING API] Audio stream ended')
              recognitionStream.end()
              break
            }

            if (value && value.length > 0) {
              console.log('📦 [STREAMING API] Received audio chunk:', value.length, 'bytes')
              recognitionStream.write(Buffer.from(value))
            }
          }

          // Send final message and close
          sendMessage({ type: 'complete' })
          controller.close()
        } catch (error) {
          console.error('❌ [STREAMING API] Stream processing error:', error)
          sendMessage({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          recognitionStream.destroy()
          controller.close()
        }
      })()
    },
  })

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

