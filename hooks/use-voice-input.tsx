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
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        const fullTranscript = finalTranscript || interimTranscript
        setTranscript(fullTranscript)
        
        // For continuous mode, only call onResult when we have final results
        // For non-continuous mode, call onResult when we have any results
        if (continuous) {
          if (finalTranscript && onResult) {
            onResult(finalTranscript.trim())
          }
        } else {
          // Non-continuous: call onResult with final transcript when available
          // or with interim if that's all we have (will be finalized on end)
          if (finalTranscript && onResult) {
            onResult(finalTranscript.trim())
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false)
        
        // Don't show error for "aborted" - it's usually intentional or a timing issue
        if (event.error === 'aborted') {
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
            : `Speech recognition error: ${event.error}`
        
        if (onError) {
          onError(errorMessage)
        }
      }

      recognition.onend = () => {
        console.log('🎤 Speech recognition ended, continuous:', continuous, 'transcript length:', transcript.length)
        setIsListening(false)
        
        // In continuous mode on iPad, recognition may end automatically after a pause
        // This is normal behavior - user needs to tap button again to continue
        if (continuous) {
          // Don't auto-restart - let the user control it via the button
          // The button will handle restarting if needed
        } else {
          // Non-continuous mode: process final transcript
          const finalTranscript = transcript.trim()
          if (finalTranscript.length > 0 && onResult) {
            // Small delay to ensure transcript is finalized
            setTimeout(() => {
              onResult(finalTranscript)
            }, 100)
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
        recognitionRef.current.start()
      } catch (error: any) {
        // Handle "already started" error gracefully
        if (error?.message?.includes('already') || error?.name === 'InvalidStateError') {
          // Try to stop and restart
          try {
            recognitionRef.current.stop()
            setTimeout(() => {
              try {
                recognitionRef.current?.start()
              } catch (retryError) {
                if (onError) {
                  onError('Could not start voice input. Please try again.')
                }
              }
            }, 100)
          } catch (stopError) {
            if (onError) {
              onError('Could not start voice input. Please try again.')
            }
          }
        } else {
          if (onError) {
            onError('Could not start voice input. Please try again.')
          }
        }
      }
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

