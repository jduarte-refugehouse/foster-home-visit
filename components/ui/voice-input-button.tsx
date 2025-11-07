'use client'

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
  const { isListening, isSupported, startListening, stopListening } = useVoiceInput({
    onResult: (text) => {
      onTranscript(text)
      stopListening()
    },
    onError: (error) => {
      if (onError) {
        onError(error)
      }
    },
    continuous: false,
    interimResults: false,
  })

  if (!isSupported) {
    return null // Don't show button if not supported
  }

  const handleClick = () => {
    if (isListening) {
      stopListening()
    } else {
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

