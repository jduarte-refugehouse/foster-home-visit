"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronLeft, CheckCircle2, Edit2, Info, Sparkles, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Regulatory source interface
interface RegulatorySource {
  code?: string // e.g., "§749.1521", "RCC 5420"
  description?: string // e.g., "Chapter 749 Minimum Standards"
  required: boolean // Is this a regulatory requirement or agency practice?
  note?: string // Additional context about the requirement
}

// Question flow configurations with regulatory citations
// Only includes questions required by TAC Chapter 749, RCC, or T3C Blueprint for monthly/quarterly HOME VISIT reviews
// NOTE: Service planning and child-specific case management tasks are handled by case managers, not home visit liaisons
const questionFlows = {
  behaviors: {
    regulatoryBasis: {
      code: "Agency Practice",
      description: "Basic behavioral observations during home visit",
      required: false,
      note: "Detailed behavioral monitoring and service planning is handled by case managers",
    } as RegulatorySource,
    questions: [
      {
        id: "behaviorsObserved",
        type: "textarea",
        text: "Any behavioral observations or concerns noted during the visit?",
        placeholder: "Brief observations only - detailed behavioral monitoring is handled by case managers...",
        regulatorySource: {
          code: "Agency Practice",
          description: "Basic observations during home visit",
          required: false,
        } as RegulatorySource,
      },
    ],
    generateSummary: (answers: Record<string, any>) => {
      if (answers.behaviorsObserved) {
        return `Behavioral observations: ${answers.behaviorsObserved}`
      }
      return "No behavioral concerns observed during visit."
    },
  },
  school: {
    regulatoryBasis: {
      code: "§749.1893",
      description: "School enrollment and attendance monitoring during home visit",
      required: true,
      note: "Basic attendance verification - academic performance and service planning handled by case managers",
    } as RegulatorySource,
    questions: [
      {
        id: "attendance",
        type: "select",
        text: "What is the child's school attendance status?",
        options: ["Regular attendance (no absences)", "Occasional absences (excused)", "Frequent absences (concern)", "Not applicable (summer/holiday)"],
        required: true,
        regulatorySource: {
          code: "§749.1893",
          description: "School enrollment and attendance monitoring",
          required: true,
        } as RegulatorySource,
      },
    ],
    generateSummary: (answers: Record<string, any>) => {
      return `School attendance: ${answers.attendance || "Not reported"}`
    },
  },
  medical: {
    regulatoryBasis: {
      code: "§749.1521",
      description: "Medication documentation during home visit",
      required: true,
      note: "Medication changes must be documented - medical appointment tracking is handled by case managers",
    } as RegulatorySource,
    questions: [
      {
        id: "medicationChanges",
        type: "yesno",
        text: "Were there any medication changes (new, adjusted, or discontinued)?",
        required: true,
        regulatorySource: {
          code: "§749.1521 / RCC 5420",
          description: "Medication changes must be documented, especially psychotropic medications",
          required: true,
        } as RegulatorySource,
      },
      {
        id: "medicationDetails",
        type: "textarea",
        text: "If medication changed, describe the change:",
        conditional: { dependsOn: "medicationChanges", value: true },
        placeholder: "What medication, what change, and reason if known...",
        required: true,
        regulatorySource: {
          code: "§749.1521 / RCC 5420",
          description: "Detailed medication change documentation required",
          required: true,
        } as RegulatorySource,
      },
    ],
    generateSummary: (answers: Record<string, any>) => {
      if (answers.medicationChanges) {
        return `Medication changes: ${answers.medicationDetails || "Yes, see details"}`
      }
      return "No medication changes reported."
    },
  },
  qualityEnhancement: {
    regulatoryBasis: {
      code: "T3C Blueprint / TBRI Principles",
      description: "Trauma-Informed Care Quality Enhancement - TBRI (Trust-Based Relational Intervention) Practices",
      required: false,
      note: "This section helps prepare homes for T3C certification by observing TBRI principles: Connecting, Empowering, and Correcting",
    } as RegulatorySource,
    questions: [
      {
        id: "tbriPrinciple",
        type: "select",
        text: "Which TBRI principle are you observing?",
        options: [
          "Connecting (Building trust and attachment)",
          "Empowering (Meeting sensory and physical needs)",
          "Correcting (Teaching social skills and behaviors)",
        ],
        required: true,
        regulatorySource: {
          code: "TBRI Principles",
          description: "Trust-Based Relational Intervention core principles",
          required: false,
        } as RegulatorySource,
      },
      {
        id: "connectingObserved",
        type: "yesno",
        text: "Did you observe connecting behaviors (eye contact, touch, presence, playfulness)?",
        conditional: { dependsOn: "tbriPrinciple", value: "Connecting (Building trust and attachment)" },
        required: true,
        regulatorySource: {
          code: "TBRI Connecting",
          description: "Building trust through attunement, engagement, and playfulness",
          required: false,
        } as RegulatorySource,
      },
      {
        id: "connectingExamples",
        type: "textarea",
        text: "Describe specific examples of connecting behaviors you observed:",
        conditional: { dependsOn: "connectingObserved", value: true },
        placeholder: "Examples: Eye contact during conversation, appropriate touch (high-fives, hugs), being fully present, playful interactions...",
        regulatorySource: {
          code: "TBRI Connecting",
          description: "Document specific connecting behaviors observed",
          required: false,
        } as RegulatorySource,
      },
      {
        id: "empoweringObserved",
        type: "yesno",
        text: "Did you observe empowering strategies (sensory tools, choices, routines, hydration/nutrition)?",
        conditional: { dependsOn: "tbriPrinciple", value: "Empowering (Meeting sensory and physical needs)" },
        required: true,
        regulatorySource: {
          code: "TBRI Empowering",
          description: "Meeting sensory and physical needs to reduce stress and build self-regulation",
          required: false,
        } as RegulatorySource,
      },
      {
        id: "empoweringExamples",
        type: "textarea",
        text: "Describe specific examples of empowering strategies you observed:",
        conditional: { dependsOn: "empoweringObserved", value: true },
        placeholder: "Examples: Sensory tools available (fidget items, weighted blankets), children given choices, consistent routines, hydration/nutrition support...",
        regulatorySource: {
          code: "TBRI Empowering",
          description: "Document specific empowering strategies observed",
          required: false,
        } as RegulatorySource,
      },
      {
        id: "correctingObserved",
        type: "yesno",
        text: "Did you observe correcting strategies (proactive teaching, re-dos, life value terms)?",
        conditional: { dependsOn: "tbriPrinciple", value: "Correcting (Teaching social skills and behaviors)" },
        required: true,
        regulatorySource: {
          code: "TBRI Correcting",
          description: "Teaching appropriate behaviors through proactive strategies and social skills",
          required: false,
        } as RegulatorySource,
      },
      {
        id: "correctingExamples",
        type: "textarea",
        text: "Describe specific examples of correcting strategies you observed:",
        conditional: { dependsOn: "correctingObserved", value: true },
        placeholder: "Examples: Proactive teaching before situations, re-dos for mistakes, using life value terms (respectful, kind, safe), teaching social skills...",
        regulatorySource: {
          code: "TBRI Correcting",
          description: "Document specific correcting strategies observed",
          required: false,
        } as RegulatorySource,
      },
      {
        id: "overallAssessment",
        type: "select",
        text: "Overall assessment of trauma-informed practices:",
        options: [
          "Consistently observed across all interactions",
          "Frequently observed with some areas for growth",
          "Occasionally observed, needs more support",
          "Rarely observed, significant training needed",
          "Not applicable for this visit",
        ],
        required: true,
        regulatorySource: {
          code: "T3C Blueprint",
          description: "Overall assessment of trauma-informed care practices",
          required: false,
        } as RegulatorySource,
      },
      {
        id: "strengths",
        type: "textarea",
        text: "What strengths did you observe in trauma-informed care?",
        placeholder: "Describe specific strengths and positive examples...",
        regulatorySource: {
          code: "T3C Blueprint",
          description: "Document strengths to build upon",
          required: false,
        } as RegulatorySource,
      },
      {
        id: "growthOpportunities",
        type: "textarea",
        text: "What opportunities for growth did you identify?",
        placeholder: "Describe areas where additional support or training might be helpful...",
        regulatorySource: {
          code: "T3C Blueprint",
          description: "Identify growth opportunities for T3C preparation",
          required: false,
        } as RegulatorySource,
      },
    ],
    generateSummary: (answers: Record<string, any>) => {
      let summary = ""
      
      if (answers.tbriPrinciple) {
        summary += `TBRI Principle Observed: ${answers.tbriPrinciple}. `
      }
      
      if (answers.connectingObserved) {
        summary += `Connecting behaviors observed: ${answers.connectingExamples || "Yes"}. `
      }
      
      if (answers.empoweringObserved) {
        summary += `Empowering strategies observed: ${answers.empoweringExamples || "Yes"}. `
      }
      
      if (answers.correctingObserved) {
        summary += `Correcting strategies observed: ${answers.correctingExamples || "Yes"}. `
      }
      
      if (answers.overallAssessment) {
        summary += `Overall assessment: ${answers.overallAssessment}. `
      }
      
      if (answers.strengths) {
        summary += `Strengths: ${answers.strengths}. `
      }
      
      if (answers.growthOpportunities) {
        summary += `Growth opportunities: ${answers.growthOpportunities}.`
      }
      
      return summary.trim() || "Quality enhancement observations documented."
    },
  },
}

interface GuidedQuestionFieldProps {
  fieldId: string
  fieldType: keyof typeof questionFlows
  value: string
  onChange: (value: string) => void
  label?: string
  context?: Record<string, any>
}

export function GuidedQuestionField({
  fieldId,
  fieldType,
  value,
  onChange,
  label,
  context = {},
}: GuidedQuestionFieldProps) {
  // Hooks must be called before any conditional returns
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [showSummary, setShowSummary] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [enhancing, setEnhancing] = useState<string | null>(null) // Track which field is being enhanced
  const [enhancingSummary, setEnhancingSummary] = useState(false) // Track if summary is being enhanced
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  const flow = questionFlows[fieldType]
  
  // Guard clause: if flow doesn't exist, show error
  if (!flow) {
    return (
      <div className="p-4 border border-red-300 rounded bg-red-50">
        <p className="text-sm text-red-600">
          Error: Invalid field type "{fieldType}". Valid types: {Object.keys(questionFlows).join(", ")}
        </p>
      </div>
    )
  }

  // Load existing structured data if value exists
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (parsed.structuredAnswers) {
          setAnswers(parsed.structuredAnswers)
          setShowSummary(true)
        }
      } catch {
        // If not structured, treat as plain text
        setEditMode(true)
      }
    }
  }, [value])

  const visibleQuestions = flow.questions.filter((q) => {
    if (!q.conditional) return true
    const dependsOnAnswer = answers[q.conditional.dependsOn]
    return dependsOnAnswer === q.conditional.value
  })

  // Guard clause: if no questions, show error
  if (visibleQuestions.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 rounded bg-yellow-50">
        <p className="text-sm text-yellow-600">
          No questions available for this field type.
        </p>
      </div>
    )
  }

  const currentQuestion = visibleQuestions[currentStep]
  
  // Guard clause: if current question is undefined, reset to first question
  if (!currentQuestion && visibleQuestions.length > 0) {
    // This shouldn't happen, but if it does, reset to first question
    if (currentStep >= visibleQuestions.length) {
      setCurrentStep(0)
    }
    return null // Will re-render with correct step
  }
  
  const progress = ((currentStep + 1) / visibleQuestions.length) * 100

  const handleAnswer = (answer: any) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer }
    setAnswers(newAnswers)

    // Auto-advance if not the last question
    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Generate summary and finish
      generateAndSave(newAnswers)
    }
  }

  const generateAndSave = (finalAnswers: Record<string, any>) => {
    const summary = flow.generateSummary(finalAnswers)
    const structuredData = {
      structuredAnswers: finalAnswers,
      generatedSummary: summary,
      finalText: summary,
      regulatorySources: flow.questions.map((q) => ({
        questionId: q.id,
        source: q.regulatorySource,
      })),
    }
    onChange(JSON.stringify(structuredData))
    setShowSummary(true)
  }

  const handleEditSummary = (newText: string) => {
    const data = JSON.parse(value || '{"structuredAnswers": {}, "regulatorySources": []}')
    const structuredData = {
      structuredAnswers: data.structuredAnswers || answers,
      generatedSummary: flow.generateSummary(data.structuredAnswers || answers),
      finalText: newText,
      regulatorySources: data.regulatorySources || [],
    }
    onChange(JSON.stringify(structuredData))
  }

  // Render regulatory source badge
  const RegulatoryBadge = ({ source }: { source: RegulatorySource }) => {
    if (!source) return null
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={source.required ? "default" : "secondary"}
              className="ml-2 cursor-help"
            >
              <Info className="h-3 w-3 mr-1" />
              {source.code || "Agency Practice"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{source.code || "Agency Practice"}</p>
              <p className="text-xs">{source.description}</p>
              {source.note && <p className="text-xs italic mt-1">{source.note}</p>}
              <p className="text-xs mt-1">
                {source.required ? (
                  <span className="text-red-400">Regulatory Requirement</span>
                ) : (
                  <span className="text-gray-400">Agency Practice</span>
                )}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (showSummary && !editMode) {
    const data = JSON.parse(value || '{"finalText":""}')
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">{label}</CardTitle>
              {flow.regulatoryBasis && (
                <RegulatoryBadge source={flow.regulatoryBasis} />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{data.finalText || "No response provided."}</p>
          {data.regulatorySources && data.regulatorySources.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 mb-2">Regulatory Sources:</p>
              <div className="flex flex-wrap gap-1">
                {data.regulatorySources.map((rs: any, idx: number) => (
                  rs.source && (
                    <RegulatoryBadge key={idx} source={rs.source} />
                  )
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (editMode) {
    const data = JSON.parse(value || '{"finalText":""}')
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>{label}</Label>
          {flow.regulatoryBasis && (
            <RegulatoryBadge source={flow.regulatoryBasis} />
          )}
        </div>
        <Textarea
          value={data.finalText || ""}
          onChange={(e) => {
            handleEditSummary(e.target.value)
            setError(null) // Clear error when user types
          }}
          rows={3}
        />
        {error && enhancingSummary && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
        {data.finalText && data.finalText.trim().length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              const currentText = data.finalText || ""
              if (!currentText.trim()) return

              setEnhancingSummary(true)
              setError(null)
              try {
                const response = await fetch("/api/visit-forms/ai-enhance", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    originalText: currentText,
                    fieldType: fieldType,
                    context: context,
                  }),
                })

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
                  throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`)
                }

                const data = await response.json()
                if (data.success && data.enhancedText) {
                  handleEditSummary(data.enhancedText)
                  toast({
                    title: "Text enhanced",
                    description: "Your text has been enhanced with AI.",
                  })
                } else {
                  throw new Error(data.error || "Enhancement failed - no enhanced text returned")
                }
              } catch (error) {
                console.error("Error enhancing text:", error)
                const errorMessage = error instanceof Error ? error.message : "Failed to enhance text. Please try again."
                setError(errorMessage)
                toast({
                  title: "Enhancement failed",
                  description: errorMessage,
                  variant: "destructive",
                })
              } finally {
                setEnhancingSummary(false)
              }
            }}
            disabled={enhancingSummary}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {enhancingSummary ? "Enhancing..." : "Enhance with AI"}
          </Button>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditMode(false)
              setShowSummary(true)
            }}
          >
            Done
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setAnswers({})
              setCurrentStep(0)
              setShowSummary(false)
              setEditMode(false)
            }}
          >
            Restart Questions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">{label}</CardTitle>
            {flow.regulatoryBasis && (
              <RegulatoryBadge source={flow.regulatoryBasis} />
            )}
          </div>
          <span className="text-xs text-gray-500">
            {currentStep + 1} of {visibleQuestions.length}
          </span>
        </div>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show regulatory basis for the entire field */}
        {flow.regulatoryBasis && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Regulatory Basis:</strong> {flow.regulatoryBasis.code} - {flow.regulatoryBasis.description}
              {flow.regulatoryBasis.note && (
                <span className="block mt-1 italic">{flow.regulatoryBasis.note}</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Label className="text-base font-semibold">
              {currentQuestion.text}
              {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {currentQuestion.regulatorySource && (
              <RegulatoryBadge source={currentQuestion.regulatorySource} />
            )}
          </div>

          {currentQuestion.type === "yesno" && (
            <div className="flex gap-3">
              <Button
                variant={answers[currentQuestion.id] === true ? "default" : "outline"}
                onClick={() => handleAnswer(true)}
                className="flex-1"
              >
                Yes
              </Button>
              <Button
                variant={answers[currentQuestion.id] === false ? "default" : "outline"}
                onClick={() => handleAnswer(false)}
                className="flex-1"
              >
                No
              </Button>
            </div>
          )}

          {currentQuestion.type === "select" && (
            <Select
              value={answers[currentQuestion.id] || ""}
              onValueChange={handleAnswer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {currentQuestion.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {currentQuestion.type === "multiselect" && (
            <div className="space-y-2">
              {currentQuestion.options?.map((opt) => (
                <div key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldId}-${currentQuestion.id}-${opt}`}
                    checked={
                      Array.isArray(answers[currentQuestion.id])
                        ? answers[currentQuestion.id].includes(opt)
                        : false
                    }
                    onCheckedChange={(checked) => {
                      const current = Array.isArray(answers[currentQuestion.id])
                        ? answers[currentQuestion.id]
                        : []
                      const updated = checked
                        ? [...current, opt]
                        : current.filter((v) => v !== opt)
                      setAnswers({ ...answers, [currentQuestion.id]: updated })
                    }}
                  />
                  <Label
                    htmlFor={`${fieldId}-${currentQuestion.id}-${opt}`}
                    className="cursor-pointer"
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === "textarea" && (
            <div className="space-y-2">
              <Textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => {
                  const newAnswers = { ...answers, [currentQuestion.id]: e.target.value }
                  setAnswers(newAnswers)
                  setError(null) // Clear error when user types
                }}
                placeholder={currentQuestion.placeholder}
                rows={3}
              />
              {error && enhancing === currentQuestion.id && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
              {answers[currentQuestion.id] && answers[currentQuestion.id].trim().length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const currentText = answers[currentQuestion.id] || ""
                    if (!currentText.trim()) return

                    setEnhancing(currentQuestion.id)
                    setError(null)
                    try {
                      const response = await fetch("/api/visit-forms/ai-enhance", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          originalText: currentText,
                          fieldType: fieldType,
                          context: context,
                        }),
                      })

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
                        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`)
                      }

                      const data = await response.json()
                      if (data.success && data.enhancedText) {
                        const newAnswers = { ...answers, [currentQuestion.id]: data.enhancedText }
                        setAnswers(newAnswers)
                        toast({
                          title: "Text enhanced",
                          description: "Your text has been enhanced with AI.",
                        })
                      } else {
                        throw new Error(data.error || "Enhancement failed - no enhanced text returned")
                      }
                    } catch (error) {
                      console.error("Error enhancing text:", error)
                      const errorMessage = error instanceof Error ? error.message : "Failed to enhance text. Please try again."
                      setError(errorMessage)
                      toast({
                        title: "Enhancement failed",
                        description: errorMessage,
                        variant: "destructive",
                      })
                    } finally {
                      setEnhancing(null)
                    }
                  }}
                  disabled={enhancing === currentQuestion.id}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {enhancing === currentQuestion.id ? "Enhancing..." : "Enhance with AI"}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          {currentQuestion.type === "textarea" || currentQuestion.type === "multiselect" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentStep < visibleQuestions.length - 1) {
                  setCurrentStep(currentStep + 1)
                } else {
                  generateAndSave(answers)
                }
              }}
              disabled={
                currentQuestion.required &&
                !answers[currentQuestion.id]
              }
            >
              {currentStep < visibleQuestions.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Finish
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentStep < visibleQuestions.length - 1) {
                  setCurrentStep(currentStep + 1)
                } else {
                  generateAndSave(answers)
                }
              }}
              disabled={
                currentQuestion.required &&
                (answers[currentQuestion.id] === undefined ||
                  answers[currentQuestion.id] === "" ||
                  (Array.isArray(answers[currentQuestion.id]) &&
                    answers[currentQuestion.id].length === 0))
              }
            >
              {currentStep < visibleQuestions.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Finish
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

