'use client'

import { useState, useRef, useEffect } from 'react'

interface UseVoiceInputOptions {
  onResult?: (text: string) => void
  onError?: (error: string) => void
  continuous?: boolean
  interimResults?: boolean
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { onResult, onError, continuous = false, interimResults = false } = options
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
        console.log('🎤 Speech recognition started')
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('🎤 Recognition result received:', event.resultIndex, 'of', event.results.length)
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          const isFinal = event.results[i].isFinal
          console.log(`  Result ${i}: "${transcript}" (final: ${isFinal})`)
          if (isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        const fullTranscript = finalTranscript || interimTranscript
        console.log('📝 Full transcript:', fullTranscript)
        setTranscript(fullTranscript)
        
        // For continuous mode, only call onResult when we have final results
        // For non-continuous mode, call onResult when we have any results
        if (continuous) {
          if (finalTranscript && onResult) {
            console.log('✅ Calling onResult with final transcript (continuous mode)')
            onResult(finalTranscript.trim())
          }
        } else {
          // Non-continuous: call onResult with final transcript when available
          // or with interim if that's all we have (will be finalized on end)
          if (finalTranscript && onResult) {
            console.log('✅ Calling onResult with final transcript (non-continuous mode)')
            onResult(finalTranscript.trim())
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Speech recognition error:', event.error, event.message)
        setIsListening(false)
        
        // Don't show error for "aborted" - it's usually intentional or a timing issue
        if (event.error === 'aborted') {
          console.log('ℹ️ Recognition aborted (this is usually normal)')
          // Silently handle abort - user may have stopped it manually
          return
        }
        
        const errorMessage = 
          event.error === 'no-speech' 
            ? 'No speech detected. Please try again.'
            : event.error === 'audio-capture'
            ? 'Microphone not found. Please check your device settings.'
            : event.error === 'not-allowed'
            ? 'Microphone permission denied. Please enable microphone access.'
            : event.error === 'network'
            ? 'Network error. Please check your connection.'
            : `Speech recognition error: ${event.error}${event.message ? ' - ' + event.message : ''}`
        
        console.error('❌ Error message:', errorMessage)
        if (onError) {
          onError(errorMessage)
        }
      }

      recognition.onend = () => {
        const finalTranscript = transcript.trim()
        console.log('🎤 Speech recognition ended, continuous:', continuous, 'transcript length:', finalTranscript.length)
        console.log('🎤 Final transcript:', finalTranscript || '(empty)')
        
        setIsListening(false)
        
        // In continuous mode on iPad, recognition may end automatically after a pause
        // This is normal behavior - user needs to tap button again to continue
        if (continuous) {
          // Don't auto-restart - let the user control it via the button
          // The button will handle restarting if needed
          console.log('ℹ️ Continuous mode ended - user can restart if needed')
        } else {
          // Non-continuous mode: process final transcript
          if (finalTranscript.length > 0 && onResult) {
            console.log('✅ Processing final transcript in non-continuous mode')
            // Small delay to ensure transcript is finalized
            setTimeout(() => {
              onResult(finalTranscript)
            }, 100)
          } else {
            console.log('ℹ️ No transcript to process (empty or no onResult callback)')
          }
        }
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      if (onError) {
        onError('Speech recognition is not supported in this browser.')
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [continuous, interimResults, onResult, onError])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        // Reset transcript when starting
        setTranscript('')
        console.log('🎤 Attempting to start recognition...')
        const wasListening = isListening
        recognitionRef.current.start()
        console.log('🎤 Recognition.start() called successfully, wasListening:', wasListening)
        
        // Log that we've started - the onstart handler will confirm it actually started
      } catch (error: any) {
        console.error('❌ Error starting recognition:', error)
        // Handle "already started" error gracefully
        if (error?.message?.includes('already') || error?.name === 'InvalidStateError') {
          console.log('🔄 Recognition already started, stopping and restarting...')
          // Try to stop and restart
          try {
            recognitionRef.current.stop()
            setTimeout(() => {
              try {
                console.log('🔄 Restarting after stop...')
                recognitionRef.current?.start()
              } catch (retryError) {
                console.error('❌ Failed to restart:', retryError)
                if (onError) {
                  onError('Could not start voice input. Please try again.')
                }
              }
            }, 200) // Longer delay for iPad
          } catch (stopError) {
            console.error('❌ Error stopping recognition:', stopError)
            if (onError) {
              onError('Could not start voice input. Please try again.')
            }
          }
        } else {
          console.error('❌ Unknown error:', error)
          if (onError) {
            onError(`Could not start voice input: ${error?.message || 'Unknown error'}`)
          }
        }
      }
    } else {
      console.log('⚠️ Cannot start: recognitionRef.current =', !!recognitionRef.current, 'isListening =', isListening)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        // Only stop if we're actually listening
        if (isListening) {
          recognitionRef.current.stop()
        }
      } catch (error) {
        // Ignore errors when stopping - recognition may have already ended
      }
    }
  }

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
  }
}

