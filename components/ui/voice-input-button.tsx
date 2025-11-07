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
  
  // Detect if we're on iPad/iOS - use non-continuous mode which works better
  // Check for iPad (including newer iPads that report as Mac)
  const isIOS = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPad on iOS 13+
  )
  
  console.log('🔍 Device detection:', {
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
    platform: typeof window !== 'undefined' ? navigator.platform : 'N/A',
    maxTouchPoints: typeof window !== 'undefined' ? navigator.maxTouchPoints : 'N/A',
    isIOS: isIOS
  })
  
  const { isListening, isSupported, startListening, stopListening, transcript } = useVoiceInput({
    onResult: (text) => {
      // For iOS/iPad (non-continuous), immediately add text to field
      // For continuous mode, accumulate text
      if (text && text.trim().length > 0) {
        if (isIOS) {
          // On iOS, immediately add to field since it's non-continuous
          onTranscript(text.trim())
        } else {
          // On desktop, accumulate for continuous mode
          setAccumulatedText(prev => {
            const newText = prev ? `${prev} ${text.trim()}` : text.trim()
            return newText
          })
        }
      }
    },
    onError: (error) => {
      // On iPad, "no-speech" errors are common and expected
      // Safari aborts very quickly if you don't speak immediately
      if (error && error.includes('Speak immediately')) {
        // This is our helpful message, show it
        if (onError) {
          onError(error)
        }
      } else if (error && !error.includes('aborted') && !error.includes('no-speech')) {
        // Show other errors, but not aborted/no-speech
        if (onError) {
          onError(error)
        }
      }
    },
    continuous: !isIOS, // Use non-continuous on iOS/iPad, continuous on desktop
    interimResults: !isIOS, // Don't use interim results on iOS (not well supported)
  })

  // Track if we're manually controlling the listening state
  const [manuallyStopped, setManuallyStopped] = useState(false)

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
      // Stop listening
      setManuallyStopped(true)
      stopListening()
      // For desktop (continuous mode), process accumulated text
      if (!isIOS) {
        const finalText = accumulatedText || transcript
        if (finalText && finalText.trim().length > 0) {
          onTranscript(finalText.trim())
          setAccumulatedText('') // Reset after sending
        }
      }
      // For iOS, text is already added in onResult callback
    } else {
      setManuallyStopped(false)
      setAccumulatedText('') // Reset when starting
      console.log('🎤 Starting voice input...', isIOS ? '(iOS mode)' : '(continuous mode)')
      startListening()
    }
  }

  // On iPad, recognition may end quickly - this is normal Safari behavior
  // User needs to tap the button again to continue speaking
  // We don't auto-restart to avoid confusion

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

