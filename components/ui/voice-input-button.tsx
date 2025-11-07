'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { cn } from '@/lib/utils'
import { accumulateTranscript, addPunctuation } from '@/lib/speech-utils'

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
  const lastProcessedTextRef = useRef<string>('') // Track what we've already processed
  const isProcessingRef = useRef(false) // Track if we're currently processing
  const pendingStopRef = useRef(false) // Track if user clicked stop but we're waiting for recognition to end
  
  // Detect if we're on iPad/iOS
  const isIOS = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
  
  const { isListening, isSupported, startListening, stopListening, transcript } = useVoiceInput({
    onResult: (text) => {
      // Accumulate text intelligently (handles duplicates, overlaps, etc.)
      if (text && text.trim().length > 0) {
        setAccumulatedText(prev => {
          const merged = accumulateTranscript(prev, text)
          console.log('📝 Accumulating transcript:', { prev: prev.substring(0, 50), new: text.substring(0, 50), merged: merged.substring(0, 50) })
          return merged
        })
      }
    },
    onError: (error) => {
      if (error && error.includes('Speak immediately')) {
        if (onError) {
          onError(error)
        }
      } else if (error && !error.includes('aborted') && !error.includes('no-speech')) {
        if (onError) {
          onError(error)
        }
      }
    },
    continuous: true,
    interimResults: true,
  })

  const [manuallyStopped, setManuallyStopped] = useState(false)

  // Reset accumulated text when starting to listen
  useEffect(() => {
    if (isListening) {
      setAccumulatedText('')
      lastProcessedTextRef.current = '' // Reset tracking
      isProcessingRef.current = false
      pendingStopRef.current = false
    } else {
      // When recognition stops, process pending text if user clicked stop
      if (pendingStopRef.current && !isProcessingRef.current) {
        processFinalText()
      }
    }
  }, [isListening])
  
  // Process final text when recognition fully stops
  const processFinalText = () => {
    if (isProcessingRef.current) {
      console.log('🚫 Already processing, skipping')
      return
    }
    
    isProcessingRef.current = true
    pendingStopRef.current = false
    
    // Use a small delay to ensure all final results are in
    setTimeout(() => {
      const finalText = accumulatedText || transcript
      if (finalText && finalText.trim().length > 0) {
        const trimmedFinal = finalText.trim()
        
        // Check if we've already processed this exact text
        if (trimmedFinal !== lastProcessedTextRef.current) {
          // Add punctuation before sending
          const withPunctuation = addPunctuation(trimmedFinal)
          console.log('✅ Processing final text:', { original: trimmedFinal.substring(0, 100), withPunctuation: withPunctuation.substring(0, 100) })
          lastProcessedTextRef.current = trimmedFinal
          onTranscript(withPunctuation)
          setAccumulatedText('') // Reset after sending
        } else {
          console.log('🚫 Skipping duplicate final text')
        }
      } else {
        console.log('ℹ️ No text to process')
      }
      
      isProcessingRef.current = false
    }, 300) // Wait 300ms for any final results to come in
  }

  if (!isSupported) {
    return null
  }

  const handleClick = () => {
    if (isListening) {
      // Stop listening - but wait for recognition to fully stop before processing
      setManuallyStopped(true)
      pendingStopRef.current = true // Mark that we want to process when it stops
      stopListening()
      // Don't process immediately - wait for onend/useEffect to handle it
      console.log('🛑 Stop requested, waiting for recognition to end...')
    } else {
      setManuallyStopped(false)
      setAccumulatedText('')
      lastProcessedTextRef.current = '' // Reset tracking
      isProcessingRef.current = false
      pendingStopRef.current = false
      console.log('🎤 Starting voice input (toggle mode)...', isIOS ? '(iPad)' : '(Desktop)')
      startListening()
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault()
      }}
      className={cn(
        'flex-shrink-0 select-none flex items-center justify-center gap-1',
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

