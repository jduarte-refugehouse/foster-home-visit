'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { cn } from '@/lib/utils'
import { accumulateTranscript, addPunctuation } from '@/lib/speech-utils'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  className?: string
  realTime?: boolean // If true, updates text field as you speak
}

export function VoiceInputButton({
  onTranscript,
  onError,
  className,
  realTime = true, // Default to real-time updates
}: VoiceInputButtonProps) {
  const [accumulatedText, setAccumulatedText] = useState('')
  const lastSentTextRef = useRef<string>('') // Track what we've already sent to the field
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
          
          // If real-time mode, update the field as we speak
          if (realTime && merged !== lastSentTextRef.current) {
            // Only send the new part, not the whole accumulated text
            // This prevents overwriting what the user might have typed
            const newPart = merged.replace(lastSentTextRef.current, '').trim()
            if (newPart) {
              console.log('🔄 Real-time update:', newPart.substring(0, 50))
              onTranscript(newPart) // Send just the new part
              lastSentTextRef.current = merged
            }
          }
          
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
      lastSentTextRef.current = '' // Reset tracking
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
  const processFinalText = async () => {
    if (isProcessingRef.current) {
      console.log('🚫 Already processing, skipping')
      return
    }
    
    isProcessingRef.current = true
    pendingStopRef.current = false
    
    // Use a small delay to ensure all final results are in
    setTimeout(async () => {
      const finalText = accumulatedText || transcript
      if (finalText && finalText.trim().length > 0) {
        const trimmedFinal = finalText.trim()
        
        // If real-time mode was active, we've already sent the text
        // Just add final punctuation
        if (realTime && lastSentTextRef.current === trimmedFinal) {
          // Text was already sent in real-time, just add punctuation to the end
          const withPunctuation = addPunctuation(trimmedFinal)
          if (withPunctuation !== trimmedFinal) {
            // Only send if punctuation was added
            const punctuationOnly = withPunctuation.replace(trimmedFinal, '').trim()
            if (punctuationOnly) {
              onTranscript(punctuationOnly)
            }
          }
          setAccumulatedText('')
          isProcessingRef.current = false
          return
        }
        
        // Non-real-time mode: process and send final text
        if (trimmedFinal !== lastSentTextRef.current) {
          lastSentTextRef.current = trimmedFinal
          
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
                console.log('✅ Enhanced with Google Cloud Speech:', {
                  original: trimmedFinal.substring(0, 100),
                  enhanced: data.enhancedTranscript.substring(0, 100),
                })
                onTranscript(data.enhancedTranscript)
                setAccumulatedText('')
                isProcessingRef.current = false
                return
              }
            }
          } catch (error) {
            console.log('⚠️ Google Speech enhancement failed, using local punctuation:', error)
          }
          
          // Fallback: Use local punctuation if Google isn't available
          const withPunctuation = addPunctuation(trimmedFinal)
          console.log('✅ Processing final text (local):', {
            original: trimmedFinal.substring(0, 100),
            withPunctuation: withPunctuation.substring(0, 100),
          })
          onTranscript(withPunctuation)
          setAccumulatedText('')
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

  const handleSwitchChange = (checked: boolean) => {
    if (checked) {
      // Turn on: Start listening
      setManuallyStopped(false)
      setAccumulatedText('')
      lastSentTextRef.current = ''
      isProcessingRef.current = false
      pendingStopRef.current = false
      console.log('🎤 Starting voice input (switch ON)...', isIOS ? '(iPad)' : '(Desktop)')
      startListening()
    } else {
      // Turn off: Stop listening and process final text
      setManuallyStopped(true)
      pendingStopRef.current = true
      stopListening()
      console.log('🛑 Stop requested (switch OFF), waiting for recognition to end...')
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Switch
        checked={isListening}
        onCheckedChange={handleSwitchChange}
        className={cn(
          isListening && 'data-[state=checked]:bg-red-500'
        )}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      />
      <Label 
        htmlFor="voice-input-switch" 
        className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
        onClick={() => handleSwitchChange(!isListening)}
      >
        <Mic className={cn('h-4 w-4', isListening && 'text-red-500 animate-pulse')} />
        <span className={cn(isListening && 'text-red-500')}>
          {isListening ? 'Listening...' : 'Voice Input'}
        </span>
      </Label>
    </div>
  )
}

