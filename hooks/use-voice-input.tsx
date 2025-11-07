'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

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
  // Store auto-restart flag in a ref so it persists across recognition object recreations
  const autoRestartRef = useRef(false)

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
      
      // On iOS/iPad, set a longer timeout before aborting
      // Safari on iPad aborts very quickly if no speech is detected
      // We can't directly set timeout, but we can log it
      console.log('🎤 Recognition configured:', {
        continuous,
        interimResults,
        lang: recognition.lang,
        userAgent: navigator.userAgent
      })

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
          // Non-continuous: only call onResult with final transcript
          // Don't call here - wait for onend to process final transcript
          // This prevents duplicate calls
          if (finalTranscript) {
            console.log('📝 Final transcript in non-continuous mode (will process on end):', finalTranscript.trim())
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Speech recognition error:', event.error, event.message)
        setIsListening(false)
        
        // On iPad Safari, "aborted" with "No speech detected" happens immediately
        // This is a known Safari quirk - it aborts if no speech is detected very quickly
        if (event.error === 'aborted') {
          console.log('ℹ️ Recognition aborted')
          // If it aborted immediately after starting, it might be Safari's quick abort
          // Don't show error - user can try again
          return
        }
        
        // "no-speech" on iPad Safari often means it aborted too quickly
        // This is different from desktop where it waits longer
        if (event.error === 'no-speech') {
          console.log('ℹ️ No speech detected - this may be Safari aborting too quickly on iPad')
          // On iPad, this often happens immediately - don't show as error
          // User can try again and speak immediately
          if (onError) {
            // Only show a helpful message, not an error
            onError('Speak immediately after tapping the microphone button. If it stops, tap again.')
          }
          return
        }
        
        const errorMessage = 
          event.error === 'audio-capture'
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
        // Use a closure to capture current transcript and auto-restart state
        // Get the latest transcript from state at the time onend fires
        const currentTranscript = transcript
        const shouldAutoRestart = autoRestartRef.current
        
        console.log('🎤 Speech recognition ended, continuous:', continuous, 'transcript length:', currentTranscript.trim().length)
        console.log('🎤 Final transcript:', currentTranscript.trim() || '(empty)')
        console.log('🎤 Auto-restart flag:', shouldAutoRestart)
        
        setIsListening(false)
        
        // In continuous mode, we accumulate results as they come in
        // The button component handles processing when user stops
        // But if recognition ends unexpectedly, we should still process what we have
        if (continuous) {
          // In continuous mode, process any final transcript we have
          // The button will also process accumulated text, but this ensures we don't lose data
          if (currentTranscript.trim().length > 0 && onResult) {
            console.log('✅ Processing transcript on end (continuous mode):', currentTranscript.trim().substring(0, 100))
            onResult(currentTranscript.trim())
          }
          console.log('ℹ️ Continuous mode ended - user can restart if needed')
        } else {
          // Non-continuous mode: process final transcript ONCE
          const finalTranscript = currentTranscript.trim()
          if (finalTranscript.length > 0 && onResult) {
            console.log('✅ Processing final transcript in non-continuous mode (single call)')
            // Process immediately - transcript is already final
            onResult(finalTranscript)
          } else {
            console.log('ℹ️ No transcript to process (empty or no onResult callback)')
          }
          
          // If we should auto-restart (button still being held), restart after a brief delay
          if (shouldAutoRestart) {
            console.log('🔄 Auto-restarting recognition (button still held)...')
            setTimeout(() => {
              // Check flag again before restarting (it might have been cleared)
              if (!autoRestartRef.current) {
                console.log('ℹ️ Auto-restart cancelled (flag cleared)')
                return
              }
              
              try {
                if (recognitionRef.current) {
                  console.log('🔄 Actually restarting now...')
                  recognitionRef.current.start()
                } else {
                  console.log('ℹ️ Auto-restart cancelled (recognition object gone)')
                }
              } catch (restartError) {
                console.error('❌ Failed to auto-restart:', restartError)
                // If restart fails, try one more time after a longer delay
                if (autoRestartRef.current) {
                  setTimeout(() => {
                    try {
                      if (recognitionRef.current && autoRestartRef.current) {
                        console.log('🔄 Retrying auto-restart...')
                        recognitionRef.current.start()
                      }
                    } catch (retryError) {
                      console.error('❌ Retry also failed:', retryError)
                    }
                  }, 300)
                }
              }
            }, 150) // Slightly longer delay for iPad
          } else {
            console.log('ℹ️ No auto-restart (flag is false)')
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
  }, [continuous, interimResults, onResult, onError, transcript])

  const startListening = (autoRestart = false) => {
    if (recognitionRef.current && !isListening) {
      try {
        // Reset transcript when starting
        setTranscript('')
        console.log('🎤 Attempting to start recognition...', autoRestart ? '(auto-restart)' : '')
        const wasListening = isListening
        
        // Store auto-restart flag in ref
        autoRestartRef.current = autoRestart
        
        recognitionRef.current.start()
        console.log('🎤 Recognition.start() called successfully, wasListening:', wasListening, 'autoRestart:', autoRestart)
        
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
    // Clear auto-restart flag immediately
    autoRestartRef.current = false
    console.log('🛑 Stopping recognition, auto-restart disabled')
    
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

  const startListeningWithAutoRestart = () => {
    startListening(true)
  }

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    startListeningWithAutoRestart,
    stopListening,
  }
}

