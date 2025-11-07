"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { TextareaWithVoice } from "@/components/ui/textarea-with-voice"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Mic, CheckCircle2, XCircle } from "lucide-react"

export default function TestVoicePage() {
  const { user, isLoaded } = useUser()
  const [text1, setText1] = useState("")
  const [text2, setText2] = useState("")
  const [text3, setText3] = useState("")
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([])
  const [isSupported, setIsSupported] = useState<boolean | null>(null)

  // Check if speech recognition is supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)
    }
  }, [])

  const handleVoiceTranscript = (text: string, fieldNumber: number) => {
    const timestamp = new Date().toLocaleTimeString()
    setTranscriptHistory(prev => [
      ...prev,
      `[${timestamp}] Field ${fieldNumber}: "${text}"`
    ])
  }

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertDescription>Please log in to access the test page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-refuge-purple mb-2">🎤 Speech-to-Text Test Page</h1>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Device Support:</strong> {isSupported === null ? "Checking..." : isSupported ? "✅ Speech recognition is supported" : "❌ Speech recognition is not supported in this browser"}
              <br />
              <small>On iPad: Press and hold the microphone button, speak, then release to add text.</small>
              <br />
              <small>On Desktop: Click the microphone button to toggle recording on/off.</small>
            </AlertDescription>
          </Alert>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Test Field 1: Basic Text Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Enter text or use voice input:</Label>
              <TextareaWithVoice
                value={text1}
                onChange={(e) => setText1(e.target.value)}
                onVoiceTranscript={(text) => {
                  setText1(prev => prev ? `${prev} ${text}` : text)
                  handleVoiceTranscript(text, 1)
                }}
                showVoiceButton={true}
                rows={4}
                placeholder="Type here or use the microphone button to speak..."
                className="mt-2"
              />
            </div>
            {text1 && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-medium mb-1">Current Value:</div>
                <div className="text-sm">{text1}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Test Field 2: Notes Field
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Notes (with voice input):</Label>
              <TextareaWithVoice
                value={text2}
                onChange={(e) => setText2(e.target.value)}
                onVoiceTranscript={(text) => {
                  setText2(prev => prev ? `${prev} ${text}` : text)
                  handleVoiceTranscript(text, 2)
                }}
                showVoiceButton={true}
                rows={6}
                placeholder="Add notes here. Use voice input for hands-free entry..."
                className="mt-2"
              />
            </div>
            {text2 && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-medium mb-1">Current Value:</div>
                <div className="text-sm whitespace-pre-wrap">{text2}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Test Field 3: Long Form Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Long form text (voice input enabled):</Label>
              <TextareaWithVoice
                value={text3}
                onChange={(e) => setText3(e.target.value)}
                onVoiceTranscript={(text) => {
                  setText3(prev => prev ? `${prev} ${text}` : text)
                  handleVoiceTranscript(text, 3)
                }}
                showVoiceButton={true}
                rows={8}
                placeholder="Try speaking a longer passage. On iPad, hold the button while speaking..."
                className="mt-2"
              />
            </div>
            {text3 && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-medium mb-1">Current Value:</div>
                <div className="text-sm whitespace-pre-wrap">{text3}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transcript History</CardTitle>
          </CardHeader>
          <CardContent>
            {transcriptHistory.length === 0 ? (
              <div className="text-sm text-muted-foreground">No voice transcripts yet. Use the microphone buttons above to test.</div>
            ) : (
              <div className="space-y-2">
                {transcriptHistory.map((entry, index) => (
                  <div key={index} className="p-2 bg-muted rounded text-sm">
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">On iPad:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Press and hold the microphone button</li>
                <li>Start speaking immediately (while holding)</li>
                <li>Keep holding while you speak</li>
                <li>Release the button when done</li>
                <li>Your text will be automatically added to the field</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">On Desktop:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click the microphone button to start recording</li>
                <li>Speak your text</li>
                <li>Click the button again to stop and add text</li>
              </ol>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> The first time you use voice input, your browser will ask for microphone permission. 
                Make sure to grant permission for the feature to work.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

