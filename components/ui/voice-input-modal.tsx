'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface VoiceInputModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTranscript: (text: string) => void
  title?: string
  description?: string
}

export function VoiceInputModal({
  open,
  onOpenChange,
  onTranscript,
  title = 'Voice Input',
  description = 'Click "Listen" to start recording. Text will appear as you speak.',
}: VoiceInputModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [hasStopped, setHasStopped] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioStreamRef = useRef<ReadableStreamDefaultController<Uint8Array> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const detectedMimeTypeRef = useRef<string>('')
  const finalTranscriptRef = useRef<string>('')

  // Cleanup when modal closes
  useEffect(() => {
    if (!open) {
      handleCleanup()
      setTranscript('')
      setError(null)
      setIsProcessing(false)
      setHasStopped(false)
      finalTranscriptRef.current = ''
    }
  }, [open])

  const handleCleanup = () => {
    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        console.log('MediaRecorder already stopped')
      }
    }

    // Clean up media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Close audio stream
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.close()
      } catch (e) {
        console.log('Audio stream already closed')
      }
      audioStreamRef.current = null
    }

    // Close event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsRecording(false)
  }

  const handleStart = async (isContinuation: boolean = false) => {
    try {
      setError(null)
      
      // Only clear transcript if starting fresh
      if (!isContinuation) {
        setTranscript('')
        finalTranscriptRef.current = ''
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        } 
      })
      streamRef.current = stream

      // Detect supported audio format (Safari/iPad compatibility)
      let mimeType = ''
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/mpeg',
        'audio/ogg;codecs=opus',
      ]
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type
          console.log('🎤 [STREAMING] Using audio format:', mimeType)
          break
        }
      }
      
      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(stream, recorderOptions)
      detectedMimeTypeRef.current = mimeType || mediaRecorder.mimeType || 'audio/webm;codecs=opus'
      console.log('🎤 [STREAMING] MediaRecorder mimeType:', mediaRecorder.mimeType || 'default')

      mediaRecorderRef.current = mediaRecorder

      // Determine encoding for Google API
      const encoding = detectedMimeTypeRef.current.includes('mp4') || detectedMimeTypeRef.current.includes('mpeg')
        ? 'MP3'
        : detectedMimeTypeRef.current.includes('ogg')
        ? 'OGG_OPUS'
        : 'WEBM_OPUS'

      // Create a readable stream for sending audio to the server
      const audioStream = new ReadableStream({
        start(controller) {
          audioStreamRef.current = controller

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              console.log('📦 [STREAMING] Audio chunk:', event.data.size, 'bytes')
              
              // Convert Blob to Uint8Array and send to server
              // Check if controller is still writable
              event.data.arrayBuffer().then(buffer => {
                try {
                  if (controller.desiredSize !== null) {
                    controller.enqueue(new Uint8Array(buffer))
                  } else {
                    console.log('⚠️ [STREAMING] Stream already closed, skipping chunk')
                  }
                } catch (e) {
                  console.log('⚠️ [STREAMING] Failed to enqueue chunk:', e)
                }
              })
            }
          }

          mediaRecorder.onstop = () => {
            console.log('🛑 [STREAMING] MediaRecorder stopped')
            try {
              if (controller.desiredSize !== null) {
                controller.close()
              }
            } catch (e) {
              console.log('⚠️ [STREAMING] Stream already closed')
            }
            setIsRecording(false)
            setHasStopped(true)
          }

          mediaRecorder.onerror = (event) => {
            console.error('❌ [STREAMING] MediaRecorder error:', event)
            try {
              controller.error(new Error('Recording error'))
            } catch (e) {
              console.log('⚠️ [STREAMING] Failed to send error to stream')
            }
            setError('Recording error occurred. Please try again.')
            setIsRecording(false)
          }
        },
      })

      // Start the streaming transcription
      setIsProcessing(true)
      console.log('🎙️ [STREAMING] Starting streaming transcription...')

      // Send audio stream to server and receive SSE responses
      fetch(`/api/speech/stream?encoding=${encoding}&sampleRate=48000&model=default`, {
        method: 'POST',
        body: audioStream,
        // @ts-ignore - duplex is needed for streaming but not in TypeScript types yet
        duplex: 'half',
      }).then(async (response) => {
        console.log('📡 [STREAMING] Server response status:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unable to read error')
          console.error('❌ [STREAMING] Server error response:', errorText)
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No response body')
        }

        // Read SSE events
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('✅ [STREAMING] Stream completed')
            setIsProcessing(false)
            break
          }

          // Decode and process SSE messages
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'connected') {
                  console.log('🔌 [STREAMING] Connected to server')
                } else if (data.type === 'interim') {
                  // Update transcript with interim result (progressive refinement)
                  const interimText = data.transcript
                  setTranscript(finalTranscriptRef.current + interimText)
                  console.log('🔄 [STREAMING] Interim:', interimText.substring(0, 50))
                } else if (data.type === 'final') {
                  // Append final result to accumulated transcript
                  const finalText = data.transcript
                  finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + finalText
                  setTranscript(finalTranscriptRef.current)
                  console.log('✅ [STREAMING] Final:', finalText)
                } else if (data.type === 'error') {
                  console.error('❌ [STREAMING] Server error:', data.error)
                  setError(data.error || 'Transcription error occurred')
                  setIsProcessing(false)
                } else if (data.type === 'complete') {
                  console.log('🏁 [STREAMING] Transcription complete')
                  setIsProcessing(false)
                }
              } catch (e) {
                console.error('❌ [STREAMING] Failed to parse SSE message:', e)
              }
            }
          }
        }
      }).catch((error) => {
        console.error('❌ [STREAMING] Fetch error:', error)
        setError(error.message || 'Failed to connect to transcription service')
        setIsProcessing(false)
      })

      // Start recording (250ms chunks for smooth streaming)
      mediaRecorder.start(250)
      setIsRecording(true)
      console.log('🎤 [STREAMING] Recording started', isContinuation ? '(continuing)' : '(new)')

    } catch (err: any) {
      console.error('❌ [STREAMING] Error starting recording:', err)
      setError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access and try again.'
          : err.message || 'Failed to access microphone. Please check your device settings.'
      )
      setIsRecording(false)
      setIsProcessing(false)
    }
  }

  const handleStop = () => {
    console.log('🛑 [STREAMING] Stopping recording...')
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  const handleKeepGoing = () => {
    handleStart(true)
  }

  const handleStartOver = () => {
    handleCleanup()
    setTranscript('')
    finalTranscriptRef.current = ''
    setHasStopped(false)
    handleStart(false)
  }

  const handleDone = () => {
    onTranscript(transcript)
    onOpenChange(false)
  }

  const handleCancel = () => {
    handleCleanup()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recording Indicator */}
          {isRecording && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-500 font-medium">Recording...</span>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && !isRecording && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm text-blue-500 font-medium">Processing...</span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Transcript Display */}
          <div className="min-h-[120px] max-h-[300px] overflow-y-auto rounded-md border border-input bg-background p-4">
            {transcript ? (
              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {isRecording ? 'Speak now...' : 'Your transcribed text will appear here'}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isProcessing} className="flex-shrink-0">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            {/* Stop button - show when recording */}
            {isRecording && (
              <Button
                onClick={handleStop}
                disabled={isProcessing && !isRecording}
                className="min-w-[120px] flex-shrink-0 bg-red-500 hover:bg-red-600 text-white"
              >
                <MicOff className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
            
            {/* Action buttons when stopped and has transcript */}
            {!isRecording && transcript && !isProcessing && (
              <>
                <Button variant="outline" onClick={handleStartOver} className="flex-shrink-0">
                  Start Over
                </Button>
                <Button
                  onClick={hasStopped ? handleKeepGoing : () => handleStart(false)}
                  disabled={isProcessing}
                  className="min-w-[120px] flex-shrink-0"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {hasStopped ? 'Keep Going' : 'Listen'}
                </Button>
                <Button onClick={handleDone} className="flex-shrink-0">
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </>
            )}
            
            {/* Listen button when no transcript and not recording */}
            {!isRecording && !transcript && !isProcessing && (
              <Button
                onClick={() => handleStart(false)}
                disabled={isProcessing}
                className="min-w-[120px] flex-shrink-0"
              >
                <Mic className="h-4 w-4 mr-2" />
                Listen
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
