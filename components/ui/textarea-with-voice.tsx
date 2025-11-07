'use client'

import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInputButton } from '@/components/ui/voice-input-button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface TextareaWithVoiceProps extends React.ComponentProps<'textarea'> {
  onVoiceTranscript?: (text: string) => void
  showVoiceButton?: boolean
}

const TextareaWithVoice = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithVoiceProps
>(({ className, onVoiceTranscript, showVoiceButton = true, value, onChange, ...props }, ref) => {
  const { toast } = useToast()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Combine refs
  React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

  const handleVoiceTranscript = (transcript: string) => {
    // If there's existing text, append with a space
    const currentValue = (value as string) || ''
    const newValue = currentValue ? `${currentValue} ${transcript}` : transcript

    // Update the textarea value
    if (onChange) {
      const event = {
        target: { value: newValue },
      } as React.ChangeEvent<HTMLTextAreaElement>
      onChange(event)
    }

    // Call custom handler if provided
    if (onVoiceTranscript) {
      onVoiceTranscript(transcript)
    }

    // Show success toast
    toast({
      title: 'Voice input added',
      description: 'Your spoken text has been added to the field.',
    })
  }

  const handleVoiceError = (error: string) => {
    toast({
      title: 'Voice input error',
      description: error,
      variant: 'destructive',
    })
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        className={cn(showVoiceButton && 'pr-20', className)}
        value={value}
        onChange={onChange}
        {...props}
      />
      {showVoiceButton && (
        <div className="absolute bottom-2 right-2 z-10">
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            onError={handleVoiceError}
            realTime={true}
            className="bg-background/95 backdrop-blur-sm rounded-lg p-1.5 shadow-sm"
          />
        </div>
      )}
    </div>
  )
})

TextareaWithVoice.displayName = 'TextareaWithVoice'

export { TextareaWithVoice }

