'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { cn } from '@/lib/utils'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export function VoiceInputButton({
  onTranscript,
  onError,
  className,
  size = 'default',
  variant = 'outline',
}: VoiceInputButtonProps) {
  const [accumulatedText, setAccumulatedText] = useState('')
  
  const { isListening, isSupported, startListening, stopListening, transcript } = useVoiceInput({
    onResult: (text) => {
      // In continuous mode, accumulate text as we get final results
      // Don't call onTranscript yet - wait until user stops
      if (text && text.trim().length > 0) {
        setAccumulatedText(prev => {
          const newText = prev ? `${prev} ${text.trim()}` : text.trim()
          return newText
        })
      }
    },
    onError: (error) => {
      // Filter out "aborted" errors - they're usually harmless
      if (error && !error.includes('aborted')) {
        if (onError) {
          onError(error)
        }
      }
    },
    continuous: true, // Use continuous mode for better iPad support
    interimResults: true, // Show interim results for better UX
  })

  // Reset accumulated text when starting to listen
  useEffect(() => {
    if (isListening) {
      setAccumulatedText('')
    }
  }, [isListening])

  if (!isSupported) {
    return null // Don't show button if not supported
  }

  const handleClick = () => {
    if (isListening) {
      // Stop listening and process accumulated text
      stopListening()
      // Use accumulated text if available, otherwise use current transcript
      const finalText = accumulatedText || transcript
      if (finalText && finalText.trim().length > 0) {
        onTranscript(finalText.trim())
        setAccumulatedText('') // Reset after sending
      }
    } else {
      setAccumulatedText('') // Reset when starting
      startListening()
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        'flex-shrink-0',
        isListening && 'bg-red-500 hover:bg-red-600 text-white',
        className
      )}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  )
}

