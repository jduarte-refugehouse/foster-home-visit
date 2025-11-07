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
import { ChevronRight, ChevronLeft, CheckCircle2, Edit2, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
// Only includes questions required by TAC Chapter 749, RCC, or T3C Blueprint for monthly/quarterly home visit reviews
const questionFlows = {
  behaviors: {
    regulatoryBasis: {
      code: "RCC 3600",
      description: "Behavioral monitoring required for service planning",
      required: true,
      note: "Service planning requires documentation of behavioral concerns and interventions",
    } as RegulatorySource,
    questions: [
      {
        id: "hasBehaviors",
        type: "yesno",
        text: "Has the child exhibited any challenging behaviors this month?",
        required: true,
        regulatorySource: {
          code: "RCC 3600",
          description: "Behavioral monitoring for service planning",
          required: true,
        } as RegulatorySource,
      },
      {
        id: "parentResponse",
        type: "textarea",
        text: "How did the foster parent respond to the behavior?",
        conditional: { dependsOn: "hasBehaviors", value: true },
        placeholder: "Describe the response strategy used...",
        required: true,
        regulatorySource: {
          code: "RCC 3600",
          description: "Document foster parent capacity and intervention effectiveness",
          required: true,
        } as RegulatorySource,
      },
    ],
    generateSummary: (answers: Record<string, any>) => {
      if (!answers.hasBehaviors) {
        return "No challenging behaviors reported this month."
      }
      let summary = "Challenging behaviors reported. "
      if (answers.parentResponse) summary += `Foster parent responded by: ${answers.parentResponse}. `
      return summary.trim()
    },
  },
  school: {
    regulatoryBasis: {
      code: "§749.1893 / RCC 6100",
      description: "Education Portfolio maintenance and school enrollment verification",
      required: true,
      note: "Monthly monitoring of school attendance and performance required",
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
      {
        id: "performance",
        type: "select",
        text: "How is the child performing academically?",
        options: ["Meeting/exceeding grade level", "Slightly below grade level", "Significantly below grade level", "Not assessed/unknown"],
        required: true,
        regulatorySource: {
          code: "RCC 6100",
          description: "Education Portfolio includes academic performance",
          required: true,
        } as RegulatorySource,
      },
      {
        id: "supportServices",
        type: "multiselect",
        text: "What support services is the child receiving?",
        options: ["Special Education (IEP)", "504 Plan", "Counseling", "Tutoring", "None", "Unknown"],
        regulatorySource: {
          code: "§749.1893",
          description: "Document educational supports and accommodations",
          required: true,
        } as RegulatorySource,
      },
    ],
    generateSummary: (answers: Record<string, any>) => {
      let summary = `School: ${answers.attendance || "Not reported"}. `
      summary += `Academic performance: ${answers.performance || "Not reported"}. `
      if (answers.supportServices && answers.supportServices.length > 0) {
        summary += `Support services: ${Array.isArray(answers.supportServices) ? answers.supportServices.join(", ") : answers.supportServices}. `
      }
      return summary.trim()
    },
  },
  medical: {
    regulatoryBasis: {
      code: "RCC 1420 / §749.1521",
      description: "Service planning requires documentation of medical and therapy services",
      required: true,
      note: "Medical appointments and medication changes must be tracked for service plan compliance",
    } as RegulatorySource,
    questions: [
      {
        id: "appointments",
        type: "yesno",
        text: "Were there any medical, dental, or therapy appointments this month?",
        required: true,
        regulatorySource: {
          code: "RCC 1420",
          description: "Service plan includes medical and dental checkups",
          required: true,
        } as RegulatorySource,
      },
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
      let summary = ""
      if (answers.appointments) {
        summary += "Appointments occurred this month. "
      } else {
        summary += "No appointments reported. "
      }
      if (answers.medicationChanges) {
        summary += `Medication changes: ${answers.medicationDetails || "Yes, see details"}. `
      } else {
        summary += "No medication changes. "
      }
      return summary.trim() || "No medical/therapy updates this month."
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
          onChange={(e) => handleEditSummary(e.target.value)}
          rows={3}
        />
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
            <Textarea
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => {
                const newAnswers = { ...answers, [currentQuestion.id]: e.target.value }
                setAnswers(newAnswers)
              }}
              placeholder={currentQuestion.placeholder}
              rows={3}
            />
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

