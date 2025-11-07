'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, X, Check } from 'lucide-react'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { cn } from '@/lib/utils'
import { addPunctuation } from '@/lib/speech-utils'
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
  description = 'Speak your text. Click the microphone to start, then click again to stop and process.',
}: VoiceInputModalProps) {
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const finalTranscriptRef = useRef<string>('')

  const { isListening, isSupported, startListening, stopListening } = useVoiceInput({
    onResult: (text) => {
      if (text && text.trim().length > 0) {
        setTranscript(text.trim())
        finalTranscriptRef.current = text.trim()
      }
    },
    onError: (errorMsg) => {
      // Filter out common Safari/iPad errors that are expected
      if (!errorMsg.includes('aborted') && !errorMsg.includes('no-speech')) {
        setError(errorMsg)
      }
    },
    continuous: true,
    interimResults: true,
  })

  // Reset when modal opens/closes
  useEffect(() => {
    if (open) {
      setTranscript('')
      setError(null)
      setIsProcessing(false)
      finalTranscriptRef.current = ''
    } else {
      // Stop listening when modal closes
      if (isListening) {
        stopListening()
      }
    }
  }, [open, isListening, stopListening])

  const handleStartStop = () => {
    if (isListening) {
      stopListening()
      // Process the transcript after a brief delay
      setIsProcessing(true)
      setTimeout(() => {
        processTranscript()
      }, 500) // Wait for final results
    } else {
      setError(null)
      setTranscript('')
      finalTranscriptRef.current = ''
      startListening()
    }
  }

  const processTranscript = async () => {
    const finalText = finalTranscriptRef.current || transcript
    
    if (!finalText || finalText.trim().length === 0) {
      setIsProcessing(false)
      return
    }

    const trimmedFinal = finalText.trim()

    // Try to enhance with Google Cloud Speech-to-Text if available
    try {
      const response = await fetch('/api/speech/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: trimmedFinal,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.enhancedTranscript) {
          onTranscript(data.enhancedTranscript)
          onOpenChange(false)
          setIsProcessing(false)
          return
        }
      }
    } catch (error) {
      console.log('⚠️ Google Speech enhancement failed, using local punctuation:', error)
    }

    // Fallback: Use local punctuation
    const withPunctuation = addPunctuation(trimmedFinal)
    onTranscript(withPunctuation)
    onOpenChange(false)
    setIsProcessing(false)
  }

  const handleCancel = () => {
    if (isListening) {
      stopListening()
    }
    onOpenChange(false)
  }

  const handleInsert = () => {
    if (transcript.trim()) {
      processTranscript()
    }
  }

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Speech recognition is not supported in this browser.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
                {isListening ? 'Listening... Speak now.' : 'Click the microphone to start recording.'}
              </p>
            )}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div
              className={cn(
                'h-3 w-3 rounded-full transition-colors',
                isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
              )}
            />
            <span className="text-sm text-muted-foreground">
              {isListening ? 'Recording...' : isProcessing ? 'Processing...' : 'Ready'}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleStartStop}
              disabled={isProcessing}
              className={cn(
                'min-w-[140px]',
                isListening && 'bg-red-500 hover:bg-red-600 text-white'
              )}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
            {transcript && !isListening && (
              <Button onClick={handleInsert} disabled={isProcessing}>
                <Check className="h-4 w-4 mr-2" />
                Insert Text
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

