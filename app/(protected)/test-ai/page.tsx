"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function TestAIPage() {
  const { user, isLoaded } = useUser()
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null)
  const [questionsResult, setQuestionsResult] = useState<string>("")
  const [enhanceResult, setEnhanceResult] = useState<string>("")
  const [loading, setLoading] = useState(false)
  
  // Form state for question generation
  const [questionFieldType, setQuestionFieldType] = useState("behaviors")
  const [childName, setChildName] = useState("Test Child")
  const [childAge, setChildAge] = useState("10")
  const [placementDuration, setPlacementDuration] = useState("6")
  
  // Form state for response enhancement
  const [originalText, setOriginalText] = useState("Child seems fine, school is okay")
  const [enhanceFieldType, setEnhanceFieldType] = useState("behaviors")

  // Get user headers for API calls
  const getUserHeaders = () => {
    if (!user) return {}
    return {
      "Content-Type": "application/json",
      "x-user-email": user.emailAddresses[0]?.emailAddress || "",
      "x-user-clerk-id": user.id,
      "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    }
  }

  // Check API key status
  const checkApiKey = async () => {
    // We can't check server-side env vars from client, but we can test by making a call
    setApiKeyConfigured(null)
  }

  const testQuestions = async () => {
    if (!user || !isLoaded) {
      setQuestionsResult("❌ Error: Please log in to test")
      return
    }

    if (!questionFieldType) {
      setQuestionsResult("❌ Error: Please select a field type")
      return
    }

    setLoading(true)
    setQuestionsResult("Generating questions...")

    const context: any = {}
    if (childName) context.childName = childName
    if (childAge) context.childAge = parseInt(childAge)
    if (placementDuration) context.placementDuration = parseInt(placementDuration)

    try {
      const response = await fetch("/api/visit-forms/ai-questions", {
        method: "POST",
        headers: getUserHeaders(),
        body: JSON.stringify({ fieldType: questionFieldType, context }),
      })

      const data = await response.json()

      if (data.success) {
        setQuestionsResult(
          "✅ Success!\n\nGenerated Questions:\n" +
          data.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")
        )
      } else {
        setQuestionsResult("❌ Error:\n" + JSON.stringify(data, null, 2))
      }
    } catch (error) {
      setQuestionsResult("❌ Request Failed:\n" + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const testEnhancement = async () => {
    if (!user || !isLoaded) {
      setEnhanceResult("❌ Error: Please log in to test")
      return
    }

    if (!originalText || !enhanceFieldType) {
      setEnhanceResult("❌ Error: Please provide original text and select a field type")
      return
    }

    setLoading(true)
    setEnhanceResult("Enhancing response...")

    try {
      const response = await fetch("/api/visit-forms/ai-enhance", {
        method: "POST",
        headers: getUserHeaders(),
        body: JSON.stringify({ originalText, fieldType: enhanceFieldType }),
      })

      const data = await response.json()

      if (data.success) {
        setEnhanceResult(
          "✅ Success!\n\nOriginal:\n" +
          data.originalText +
          "\n\nEnhanced:\n" +
          data.enhancedText
        )
      } else {
        setEnhanceResult("❌ Error:\n" + JSON.stringify(data, null, 2))
      }
    } catch (error) {
      setEnhanceResult("❌ Request Failed:\n" + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-refuge-purple mb-2">🤖 AI Endpoints Test Page</h1>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>API Key Status:</strong> Check server logs to verify environment variable is set.
              <br />
              <small>Environment Variable: home_visit_general_key</small>
            </AlertDescription>
          </Alert>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Test Question Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Generate context-aware questions for a field type:</p>

            <div>
              <Label>Field Type:</Label>
              <Select value={questionFieldType} onValueChange={setQuestionFieldType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behaviors">Behaviors</SelectItem>
                  <SelectItem value="school">School Performance</SelectItem>
                  <SelectItem value="medical">Medical/Therapy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Child Name (optional):</Label>
              <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Test Child" />
            </div>

            <div>
              <Label>Child Age (optional):</Label>
              <Input value={childAge} onChange={(e) => setChildAge(e.target.value)} type="number" placeholder="10" />
            </div>

            <div>
              <Label>Placement Duration in Months (optional):</Label>
              <Input value={placementDuration} onChange={(e) => setPlacementDuration(e.target.value)} type="number" placeholder="6" />
            </div>

            <Button onClick={testQuestions} disabled={loading}>
              Generate Questions
            </Button>

            {questionsResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded border">
                <pre className="text-sm whitespace-pre-wrap">{questionsResult}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Test Response Enhancement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Enhance a brief response to be more professional:</p>

            <div>
              <Label>Original Text:</Label>
              <Textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>Field Type:</Label>
              <Select value={enhanceFieldType} onValueChange={setEnhanceFieldType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behaviors">Behaviors</SelectItem>
                  <SelectItem value="school">School Performance</SelectItem>
                  <SelectItem value="medical">Medical/Therapy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={testEnhancement} disabled={loading}>
              Enhance Response
            </Button>

            {enhanceResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded border">
                <pre className="text-sm whitespace-pre-wrap">{enhanceResult}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

