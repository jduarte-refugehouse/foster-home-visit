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
  
  const { isListening, isSupported, startListening, startListeningWithAutoRestart, stopListening, transcript } = useVoiceInput({
    onResult: (text) => {
      // For iOS/iPad (press-and-hold), accumulate text while holding
      // For continuous mode, accumulate text
      if (text && text.trim().length > 0) {
        if (isIOS) {
          // On iOS, accumulate while holding button down
          // Text will be added when button is released
          setAccumulatedText(prev => {
            const newText = prev ? `${prev} ${text.trim()}` : text.trim()
            console.log('📝 Accumulating text on iOS:', newText)
            return newText
          })
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

  // For iPad: Use press-and-hold to keep recognition active
  // For desktop: Use click to toggle
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isIOS) {
      // On iPad, start listening when button is pressed
      e.preventDefault()
      setManuallyStopped(false)
      setAccumulatedText('')
      console.log('🎤 Starting voice input (press-and-hold with auto-restart)...')
      // Use auto-restart so if Safari aborts, it will restart while button is held
      startListeningWithAutoRestart()
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isIOS) {
      // On iPad, stop listening when button is released
      e.preventDefault()
      setManuallyStopped(true)
      stopListening()
      // Process any accumulated text
      const finalText = accumulatedText || transcript
      if (finalText && finalText.trim().length > 0) {
        console.log('✅ Processing final text on release:', finalText)
        onTranscript(finalText.trim())
        setAccumulatedText('')
      } else {
        console.log('ℹ️ No text accumulated on release')
      }
    }
  }

  const handleClick = () => {
    // Desktop mode: toggle on/off
    if (!isIOS) {
      if (isListening) {
        // Stop listening
        setManuallyStopped(true)
        stopListening()
        // Process accumulated text
        const finalText = accumulatedText || transcript
        if (finalText && finalText.trim().length > 0) {
          onTranscript(finalText.trim())
          setAccumulatedText('') // Reset after sending
        }
      } else {
        setManuallyStopped(false)
        setAccumulatedText('') // Reset when starting
        console.log('🎤 Starting voice input (toggle mode)...')
        startListening()
      }
    }
    // On iOS, click is handled by pointer events
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
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp} // Handle if user drags finger away
      className={cn(
        'flex-shrink-0 touch-none', // touch-none prevents iOS from treating as scroll
        isListening && 'bg-red-500 hover:bg-red-600 text-white',
        className
      )}
      title={
        isIOS 
          ? (isListening ? 'Release to stop recording' : 'Press and hold to record')
          : (isListening ? 'Stop recording' : 'Start voice input')
      }
    >
      {isListening ? (
        <>
          <MicOff className="h-4 w-4" />
          {isIOS && <span className="ml-1 text-xs">Release</span>}
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          {isIOS && <span className="ml-1 text-xs">Hold</span>}
        </>
      )}
    </Button>
  )
}

