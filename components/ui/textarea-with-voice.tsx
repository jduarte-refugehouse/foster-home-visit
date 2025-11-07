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

  const voiceTextRef = React.useRef<string>('') // Track voice text separately from user-typed text
  
  const handleVoiceTranscript = (transcript: string) => {
    // For real-time updates, we need to replace the previous voice text, not append
    const currentValue = (value as string) || ''
    
    // Remove previous voice text if it exists
    const baseText = voiceTextRef.current 
      ? currentValue.replace(voiceTextRef.current, '').trim()
      : currentValue
    
    // Update voice text reference
    voiceTextRef.current = transcript
    
    // Combine base text (user-typed) with new voice text
    const newValue = baseText 
      ? `${baseText} ${transcript}`.trim()
      : transcript

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

    // Only show toast for final results (not interim/real-time updates)
    // We'll detect this by checking if transcript is being replaced or appended
    if (!transcript.includes(voiceTextRef.current) || voiceTextRef.current === '') {
      toast({
        title: 'Voice input added',
        description: 'Your spoken text has been added to the field.',
      })
    }
  }
  
  // Reset voice text when component unmounts or value is cleared
  React.useEffect(() => {
    if (!value || (value as string).trim() === '') {
      voiceTextRef.current = ''
    }
  }, [value])

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

