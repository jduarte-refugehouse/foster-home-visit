'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@refugehouse/shared-core/components/ui/dialog'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Mic, MicOff, X, Check } from 'lucide-react'
import { cn } from '@refugehouse/shared-core/utils'
import { Alert, AlertDescription } from '@refugehouse/shared-core/components/ui/alert'
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'

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
  const deepgramConnectionRef = useRef<any>(null)
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

    // Close Deepgram connection
    if (deepgramConnectionRef.current) {
      try {
        deepgramConnectionRef.current.finish()
      } catch (e) {
        console.log('Deepgram connection already closed')
      }
      deepgramConnectionRef.current = null
    }

    setIsRecording(false)
  }

  const handleStart = async (isContinuation: boolean = false) => {
    try {
      setError(null)
      setIsProcessing(true)
      
      // Only clear transcript if starting fresh
      if (!isContinuation) {
        setTranscript('')
        finalTranscriptRef.current = ''
      }

      console.log('🎙️ [DEEPGRAM] Getting API key...')
      
      // Get Deepgram API key from server
      const keyResponse = await fetch('/api/speech/deepgram-token')
      if (!keyResponse.ok) {
        throw new Error('Failed to get Deepgram API key')
      }
      const { key } = await keyResponse.json()

      console.log('🎙️ [DEEPGRAM] Creating Deepgram client...')
      
      // Create Deepgram client
      const deepgram = createClient(key)

      // Connect to Deepgram live transcription
      const connection = deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        punctuate: true,
        interim_results: true,
        endpointing: 300,
        smart_format: true,
      })

      deepgramConnectionRef.current = connection

      // Handle transcription results
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('✅ [DEEPGRAM] Connection opened')

        // Request microphone access
        navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          } 
        }).then((stream) => {
          streamRef.current = stream

          // Create MediaRecorder with Safari/iPad compatibility
          let mediaRecorderOptions: MediaRecorderOptions = {}
          
          // Detect supported format for Safari/iPad
          if (MediaRecorder.isTypeSupported('audio/webm')) {
            mediaRecorderOptions.mimeType = 'audio/webm'
            console.log('🎤 [DEEPGRAM] Using audio/webm')
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mediaRecorderOptions.mimeType = 'audio/mp4'
            console.log('🎤 [DEEPGRAM] Using audio/mp4 (Safari)')
          } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
            mediaRecorderOptions.mimeType = 'audio/mpeg'
            console.log('🎤 [DEEPGRAM] Using audio/mpeg (Safari)')
          } else {
            // Let browser choose default format
            console.log('🎤 [DEEPGRAM] Using default format (Safari fallback)')
          }
          
          const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions)
          mediaRecorderRef.current = mediaRecorder
          
          console.log('🎤 [DEEPGRAM] MediaRecorder created with:', mediaRecorder.mimeType)

          // Send audio data to Deepgram
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && connection.getReadyState() === 1) {
              connection.send(event.data)
              console.log('📦 [DEEPGRAM] Sent audio:', event.data.size, 'bytes')
            }
          }

          mediaRecorder.onstop = () => {
            console.log('🛑 [DEEPGRAM] Recording stopped')
            setIsRecording(false)
            setHasStopped(true)
            setIsProcessing(false)
          }

          // Start recording (send audio every 250ms)
          mediaRecorder.start(250)
          setIsRecording(true)
          setIsProcessing(false)
          console.log('🎤 [DEEPGRAM] Recording started', isContinuation ? '(continuing)' : '(new)')
        }).catch((err) => {
          console.error('❌ [DEEPGRAM] Microphone error:', err)
          setError(
            err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
              ? 'Microphone permission denied. Please allow microphone access and try again.'
              : 'Failed to access microphone. Please check your device settings.'
          )
          setIsProcessing(false)
        })
      })

      // Handle interim transcripts
      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const words = data.channel?.alternatives?.[0]?.words
        const transcript = data.channel?.alternatives?.[0]?.transcript
        
        if (transcript && transcript.length > 0) {
          const isFinal = data.is_final
          
          if (isFinal) {
            // Final transcript - add to accumulated text
            finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + transcript
            setTranscript(finalTranscriptRef.current)
            console.log('✅ [DEEPGRAM] Final:', transcript)
          } else {
            // Interim transcript - show with accumulated text
            setTranscript(finalTranscriptRef.current + (finalTranscriptRef.current ? ' ' : '') + transcript)
            console.log('🔄 [DEEPGRAM] Interim:', transcript.substring(0, 50))
          }
        }
      })

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error('❌ [DEEPGRAM] Error:', error)
        setError('Transcription error occurred')
        setIsProcessing(false)
      })

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('🔌 [DEEPGRAM] Connection closed')
        setIsProcessing(false)
      })

    } catch (err: any) {
      console.error('❌ [DEEPGRAM] Error starting:', err)
      setError(err.message || 'Failed to start transcription')
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
