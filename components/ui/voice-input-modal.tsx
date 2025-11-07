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
  const [hasStopped, setHasStopped] = useState(false) // Track if we've stopped at least once
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const accumulatedTranscriptRef = useRef<string>('')
  const allAudioChunksRef = useRef<Blob[]>([]) // Store all audio for final processing

  // Cleanup when modal closes
  useEffect(() => {
    if (!open) {
      // Stop recording if still active
      if (isRecording) {
        handleStop()
      }
      // Clean up media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Reset state
      setTranscript('')
      setError(null)
      setIsProcessing(false)
      setHasStopped(false)
      accumulatedTranscriptRef.current = ''
      allAudioChunksRef.current = []
    }
  }, [open, isRecording])

  const sendAudioChunk = async (audioBlob: Blob, isLastChunk: boolean = false, isInterim: boolean = false) => {
    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1]
        
        try {
          // Send to API for transcription
          const response = await fetch('/api/speech/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audioData: base64Audio,
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 48000,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `API error: ${response.status}`)
          }

          const data = await response.json()
          
          if (data.success && data.transcript) {
            const newText = data.transcript.trim()
            
            if (isLastChunk) {
              // For final chunk, use the full transcript
              setTranscript(newText)
              accumulatedTranscriptRef.current = newText
            } else if (isInterim && newText) {
              // For interim chunks, always update to show real-time progress
              // Google returns progressively more complete transcripts
              setTranscript(newText)
              accumulatedTranscriptRef.current = newText
            }
          }
        } catch (apiError: any) {
          console.error('❌ [GOOGLE SPEECH] API error:', apiError)
          // Don't show error for interim chunks, only for final
          if (isLastChunk) {
            setError(apiError.message || 'Failed to transcribe audio. Please try again.')
          }
        }
      }

      reader.onerror = () => {
        console.error('❌ [GOOGLE SPEECH] Error reading audio file')
        if (isLastChunk) {
          setError('Failed to process audio. Please try again.')
        }
      }

      reader.readAsDataURL(audioBlob)
    } catch (error: any) {
      console.error('❌ [GOOGLE SPEECH] Error processing audio chunk:', error)
      if (isLastChunk) {
        setError(error.message || 'Failed to process audio. Please try again.')
      }
    }
  }

  const handleStart = async (isContinuation: boolean = false) => {
    try {
      setError(null)
      
      // Only clear transcript if starting fresh, not continuing
      if (!isContinuation) {
        setTranscript('')
        accumulatedTranscriptRef.current = ''
        allAudioChunksRef.current = []
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } 
      })
      
      streamRef.current = stream

      // Create MediaRecorder with WebM format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      mediaRecorderRef.current = mediaRecorder

      let audioChunks: Blob[] = []
      let lastInterimSendTime = 0
      const INTERIM_INTERVAL_MS = 1500 // Send interim chunks every 1.5 seconds

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
          allAudioChunksRef.current.push(event.data) // Store for final processing
          
          const now = Date.now()
          
          // Send chunk for real-time transcription every 1.5 seconds
          // Google recommends 100ms-1s for streaming, but we use 1.5s to balance
          // API calls with real-time feedback
          if (now - lastInterimSendTime >= INTERIM_INTERVAL_MS) {
            const chunkToSend = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' })
            sendAudioChunk(chunkToSend, false, true)
            // Keep last 1 second of audio for continuity, but reset the rest
            // This ensures we don't send duplicate audio
            audioChunks = audioChunks.slice(-1) // Keep only the most recent chunk
            lastInterimSendTime = now
          }
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Process ALL accumulated audio for final, complete transcript
        if (allAudioChunksRef.current.length > 0) {
          const finalAudio = new Blob(allAudioChunksRef.current, { type: 'audio/webm;codecs=opus' })
          await sendAudioChunk(finalAudio, true, false)
        }
        setIsProcessing(false)
        setHasStopped(true)
      }

      // Start recording with 1 second intervals
      mediaRecorder.start(1000)
      setIsRecording(true)
      console.log('🎤 [GOOGLE SPEECH] Recording started', isContinuation ? '(continuing)' : '(new)')
    } catch (err: any) {
      console.error('❌ [GOOGLE SPEECH] Error starting recording:', err)
      setError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access and try again.'
          : err.message || 'Failed to access microphone. Please check your device settings.'
      )
      setIsRecording(false)
    }
  }

  const handleStop = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      console.log('🛑 [GOOGLE SPEECH] Recording stopped, processing final audio...')
    }
  }

  const handleKeepGoing = () => {
    // Continue recording - don't clear transcript
    handleStart(true)
  }

  const handleStartOver = () => {
    setTranscript('')
    accumulatedTranscriptRef.current = ''
    allAudioChunksRef.current = []
    setHasStopped(false)
    setError(null)
    // If recording, stop first
    if (isRecording) {
      handleStop()
    }
  }

  const handleDone = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim())
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    if (isRecording) {
      handleStop()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Transcript Display */}
          <div className="min-h-[120px] p-4 border rounded-lg bg-muted/50">
            {transcript ? (
              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {isRecording 
                  ? 'Listening... Speak now. Text will appear as you talk.' 
                  : isProcessing 
                    ? 'Processing final audio...' 
                    : 'Click "Listen" to start recording.'}
              </p>
            )}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div
              className={cn(
                'h-3 w-3 rounded-full transition-colors',
                isRecording ? 'bg-red-500 animate-pulse' : isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              )}
            />
            <span className="text-sm text-muted-foreground">
              {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Ready'}
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isProcessing} className="flex-shrink-0">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            {transcript && !isRecording && !isProcessing && (
              <>
                <Button variant="outline" onClick={handleStartOver} className="flex-shrink-0">
                  Start Over
                </Button>
                <Button
                  onClick={isRecording ? handleStop : (hasStopped ? handleKeepGoing : () => handleStart(false))}
                  disabled={isProcessing}
                  className={cn(
                    'min-w-[120px] flex-shrink-0',
                    isRecording && 'bg-red-500 hover:bg-red-600 text-white'
                  )}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : hasStopped ? (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Keep Going
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Listen
                    </>
                  )}
                </Button>
                <Button onClick={handleDone} className="flex-shrink-0">
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </>
            )}
            {!transcript && (
              <Button
                onClick={isRecording ? handleStop : (hasStopped ? handleKeepGoing : () => handleStart(false))}
                disabled={isProcessing}
                className={cn(
                  'min-w-[120px] flex-shrink-0',
                  isRecording && 'bg-red-500 hover:bg-red-600 text-white'
                )}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : hasStopped ? (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Keep Going
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Listen
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
