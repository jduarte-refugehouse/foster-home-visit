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
      // Accumulate text for both iOS and desktop
      // Text will be added when user stops recording
      if (text && text.trim().length > 0) {
        setAccumulatedText(prev => {
          const newText = prev ? `${prev} ${text.trim()}` : text.trim()
          console.log('📝 Accumulating text:', newText)
          return newText
        })
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
    continuous: true, // Use continuous mode for both iOS and desktop (works better)
    interimResults: true, // Use interim results for better responsiveness
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

  // For iPad: Use simple toggle (press-and-hold doesn't work well with Safari's quick abort)
  // Toggle on/off is simpler and more reliable

  const handleClick = () => {
    // Both desktop and iPad: use toggle mode
    if (isListening) {
      // Stop listening
      setManuallyStopped(true)
      stopListening()
      // Process accumulated text
      const finalText = accumulatedText || transcript
      if (finalText && finalText.trim().length > 0) {
        console.log('✅ Processing final text on stop:', finalText)
        onTranscript(finalText.trim())
        setAccumulatedText('') // Reset after sending
      } else {
        console.log('ℹ️ No text accumulated on stop')
      }
    } else {
      setManuallyStopped(false)
      setAccumulatedText('') // Reset when starting
      console.log('🎤 Starting voice input (toggle mode)...', isIOS ? '(iPad)' : '(Desktop)')
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
      onContextMenu={(e) => {
        // Prevent context menu on long press
        e.preventDefault()
      }}
      className={cn(
        'flex-shrink-0 select-none flex items-center justify-center gap-1', // select-none prevents text selection
        isListening && 'bg-red-500 hover:bg-red-600 text-white',
        className
      )}
      title={
        isListening ? 'Click to stop recording' : 'Click to start voice input'
      }
    >
      {isListening ? (
        <MicOff className="h-4 w-4 flex-shrink-0" />
      ) : (
        <Mic className="h-4 w-4 flex-shrink-0" />
      )}
    </Button>
  )
}

