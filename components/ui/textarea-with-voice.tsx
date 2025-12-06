'use client'

import * as React from 'react'
import { Textarea } from '@refugehouse/shared-core/components/ui/textarea'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Mic } from 'lucide-react'
import { VoiceInputModal } from '@refugehouse/shared-core/components/ui/voice-input-modal'
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
  const [modalOpen, setModalOpen] = React.useState(false)

  // Combine refs
  React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

  const handleVoiceTranscript = (transcript: string) => {
    // Append transcript to existing text with a space
    const currentValue = (value as string) || ''
    const newValue = currentValue ? `${currentValue} ${transcript}`.trim() : transcript

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
        <>
          <div className="absolute bottom-2 right-2 z-10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-background border-border shadow-sm hover:bg-muted h-8 w-8 p-0"
              title="Open voice input"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          <VoiceInputModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onTranscript={handleVoiceTranscript}
            title="Voice Input"
            description="Click 'Start Recording' to begin. Speak your text, then click 'Stop Recording' and 'Insert Text' to add it to the field."
          />
        </>
      )}
    </div>
  )
})

TextareaWithVoice.displayName = 'TextareaWithVoice'

export { TextareaWithVoice }

