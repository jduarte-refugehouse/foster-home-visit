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
        
        if (finalTranscript && onResult) {
          onResult(finalTranscript.trim())
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false)
        const errorMessage = 
          event.error === 'no-speech' 
            ? 'No speech detected. Please try again.'
            : event.error === 'audio-capture'
            ? 'Microphone not found. Please check your device settings.'
            : event.error === 'not-allowed'
            ? 'Microphone permission denied. Please enable microphone access.'
            : `Speech recognition error: ${event.error}`
        
        if (onError) {
          onError(errorMessage)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
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
        recognitionRef.current.start()
      } catch (error) {
        // Already started or other error
        if (onError) {
          onError('Could not start voice input. Please try again.')
        }
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        // Ignore errors when stopping
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

