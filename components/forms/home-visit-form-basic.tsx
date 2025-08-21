"use client"

import { useState, useEffect } from "react"
import { Calendar, Home, Users, FileText, User, Save, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface BasicHomeVisitFormProps {
  appointmentId?: string
  homeData?: {
    name: string
    address: string
    phone: string
    email: string
  }
  existingFormData?: any
  onSave?: (formData: any) => void
  onSubmit?: (formData: any) => void
}

const BasicHomeVisitForm = ({
  appointmentId,
  homeData,
  existingFormData,
  onSave,
  onSubmit,
}: BasicHomeVisitFormProps) => {
  const [formData, setFormData] = useState({
    visitInfo: {
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      quarter: "",
      visitNumber: 1,
      type: "announced",
      mode: "in-home",
      conductedBy: "",
      role: "liaison", // 'liaison' or 'case-manager'
    },
    family: {
      familyName: homeData?.name || "",
      address: homeData?.address || "",
      phone: homeData?.phone || "",
      email: homeData?.email || "",
    },
    attendees: [],
    homeEnvironment: {
      safetyChecklist: {},
      medicationStorage: {},
      emergencyPreparedness: {},
    },
    childInterviews: [],
    parentInterviews: [],
    observations: {
      homeAtmosphere: "",
      concerns: [],
      positiveObservations: "",
      behaviorObservations: "",
    },
    compliance: {
      documentsVerified: {},
      trainingsReviewed: {},
      nonCompliances: [],
    },
    recommendations: "",
    nextSteps: [],
    signatures: {
      visitor: "",
      parent1: "",
      parent2: "",
      supervisor: "",
    },
  })

  const [currentSection, setCurrentSection] = useState(0)
  const [errors, setErrors] = useState({})
  const [visitFormId, setVisitFormId] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [visitVariant, setVisitVariant] = useState(1)
  const [lookupData, setLookupData] = useState({
    visitTypes: [],
    visitModes: [],
    attendeeRoles: [],
  })
  const { toast } = useToast()

  useEffect(() => {
    const month = new Date(formData.visitInfo.date).getMonth() + 1
    let quarter = ""
    if (month <= 3) quarter = "Q1"
    else if (month <= 6) quarter = "Q2"
    else if (month <= 9) quarter = "Q3"
    else quarter = "Q4"

    setFormData((prev) => ({
      ...prev,
      visitInfo: { ...prev.visitInfo, quarter },
    }))
  }, [formData.visitInfo.date])

  useEffect(() => {
    const visitNum = formData.visitInfo.visitNumber
    setVisitVariant(((visitNum - 1) % 3) + 1)
  }, [formData.visitInfo.visitNumber])

  useEffect(() => {
    console.log("[v0] Form useEffect triggered - appointmentId:", appointmentId, "existingFormData:", existingFormData)

    if (existingFormData) {
      console.log("[v0] Loading form data from props:", existingFormData)
      loadFormDataFromProps(existingFormData)
    } else if (appointmentId) {
      console.log("[v0] No existing form data, loading from API for appointment:", appointmentId)
      loadExistingForm()
    } else {
      console.log("[v0] No appointment ID or existing form data")
    }
  }, [appointmentId, existingFormData])

  useEffect(() => {
    if (!autoSaveEnabled || !appointmentId) return

    console.log("[v0] Auto-save is currently disabled to prevent SQL recursion")
    return

    // const autoSaveInterval = setInterval(() => {
    //   handleAutoSave()
    // }, 30000) // Auto-save every 30 seconds

    // return () => clearInterval(autoSaveInterval)
  }, [formData, autoSaveEnabled, appointmentId])

  const loadFormDataFromProps = (existingForm: any) => {
    try {
      console.log("[v0] Loading form data from props:", existingForm)
      console.log("[v0] Existing form keys:", Object.keys(existingForm))
      console.log("[v0] Family info raw:", existingForm.family_info)
      console.log("[v0] Visit info raw:", existingForm.visit_info)

      // Parse JSON fields if they're strings
      const parseField = (field: any) => {
        if (typeof field === "string") {
          try {
            return JSON.parse(field)
          } catch (e) {
            console.error("[v0] JSON parse error for field:", field, e)
            return field
          }
        }
        return field
      }

      const parsedFamilyInfo = parseField(existingForm.family_info)
      const parsedVisitInfo = parseField(existingForm.visit_info)
      const parsedAttendees = parseField(existingForm.attendees)
      const parsedObservations = parseField(existingForm.observations)
      const parsedRecommendations = parseField(existingForm.recommendations)
      const parsedSignatures = parseField(existingForm.signatures)

      console.log("[v0] Parsed family info:", parsedFamilyInfo)
      console.log("[v0] Parsed visit info:", parsedVisitInfo)

      // Map database fields to form fields with proper property names
      const mappedFamilyInfo = parsedFamilyInfo
        ? {
            familyName: parsedFamilyInfo.familyName || parsedFamilyInfo.name || "",
            address: parsedFamilyInfo.address || "",
            phone: parsedFamilyInfo.phone || "",
            email: parsedFamilyInfo.email || "",
          }
        : {}

      console.log("[v0] Mapped family info:", mappedFamilyInfo)

      setFormData((prevData) => {
        const newFormData = {
          ...prevData,
          visitInfo: {
            ...prevData.visitInfo,
            ...(parsedVisitInfo || {}),
            date: parsedVisitInfo?.date || existingForm.visit_date?.split("T")[0] || prevData.visitInfo.date,
            time: parsedVisitInfo?.time || existingForm.visit_time || prevData.visitInfo.time,
            quarter: parsedVisitInfo?.quarter || existingForm.quarter || prevData.visitInfo.quarter,
            visitNumber: parsedVisitInfo?.visitNumber || existingForm.visit_number || prevData.visitInfo.visitNumber,
          },
          family: {
            ...prevData.family,
            ...mappedFamilyInfo,
          },
          attendees: Array.isArray(parsedAttendees) ? parsedAttendees : prevData.attendees || [], // Ensure attendees is always an array when loading existing data
          observations: {
            ...prevData.observations,
            ...(parsedObservations || {}),
          },
          recommendations: parsedRecommendations || prevData.recommendations,
          signatures: {
            ...prevData.signatures,
            ...(parsedSignatures || {}),
          },
        }

        console.log("[v0] Final form data after loading:", newFormData)
        console.log("[v0] Family name in final data:", newFormData.family.familyName)

        return newFormData
      })

      setVisitFormId(existingForm.visit_form_id)

      toast({
        title: "Form Data Loaded",
        description: `Loaded existing form data for ${mappedFamilyInfo.familyName || "this home"}`,
      })

      console.log("[v0] Successfully loaded form data from props")
    } catch (error) {
      console.error("[v0] Error loading form data from props:", error)
      toast({
        title: "Error",
        description: "Failed to load existing form data",
        variant: "destructive",
      })
    }
  }

  const loadExistingForm = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading existing form for appointment:", appointmentId)

      const response = await fetch(`/api/visit-forms?appointmentId=${appointmentId}`)

      if (response.ok) {
        const data = await response.json()

        if (data.success && data.visitForms.length > 0) {
          const existingForm = data.visitForms[0] // Get the most recent form
          console.log("[v0] Loaded existing form:", existingForm)

          loadFormDataFromProps(existingForm)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading existing form:", error)
      toast({
        title: "Load Error",
        description: "Failed to load existing form data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSave = async () => {
    if (saving || !appointmentId) return

    try {
      setSaving(true)
      console.log("[v0] Auto-saving form...")

      await saveFormData(true) // isAutoSave = true
    } catch (error) {
      console.error("[v0] Auto-save failed:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log("[v0] Manually saving form...")

      await saveFormData(false) // isAutoSave = false

      toast({
        title: "Draft Saved",
        description: "Your form has been saved as a draft",
      })

      onSave?.(formData)
    } catch (error) {
      console.error("[v0] Manual save failed:", error)
      toast({
        title: "Save Error",
        description: error instanceof Error ? error.message : "Failed to save form draft",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveFormData = async (isAutoSave = false) => {
    if (!appointmentId) {
      throw new Error("No appointment ID provided")
    }

    if (!formData.visitInfo.date || !formData.visitInfo.time) {
      throw new Error("Visit date and time are required")
    }

    console.log("[v0] Preparing to save form data:", {
      appointmentId,
      visitDate: formData.visitInfo.date,
      visitTime: formData.visitInfo.time,
      isAutoSave,
      visitFormId,
    })

    const saveData = {
      appointmentId,
      formType: "home_visit",
      status: "draft",
      visitDate: formData.visitInfo.date,
      visitTime: formData.visitInfo.time,
      visitNumber: formData.visitInfo.visitNumber || 1,
      quarter: formData.visitInfo.quarter || null,
      visitVariant: 1,
      visitInfo: formData.visitInfo,
      familyInfo: formData.family,
      attendees: formData.attendees,
      observations: formData.observations,
      recommendations: formData.recommendations,
      signatures: formData.signatures,
      createdByUserId: "system-user",
      createdByName: "System User",
      isAutoSave,
    }

    console.log("[v0] Save data prepared:", saveData)

    const url = visitFormId ? `/api/visit-forms/${visitFormId}` : "/api/visit-forms"
    const method = visitFormId ? "PUT" : "POST"

    console.log("[v0] Making API request:", { url, method })

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(saveData),
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorData = await response.json()
        console.log("[v0] API error response:", errorData)

        if (errorData.error) {
          errorMessage = errorData.error
        }
        if (errorData.details) {
          errorMessage += ` - ${errorData.details}`
        }
      } catch (parseError) {
        console.log("[v0] Could not parse error response:", parseError)
        // Use the original error message if we can't parse the response
      }

      throw new Error(`Failed to save form: ${errorMessage}`)
    }

    const result = await response.json()
    console.log("[v0] API response:", result)

    if (result.success) {
      if (!visitFormId) {
        setVisitFormId(result.visitFormId)
      }
      setLastSaved(new Date())

      if (isAutoSave) {
        console.log("[v0] Form auto-saved successfully")
      }
    } else {
      throw new Error(result.error || "Failed to save form")
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      console.log("[v0] Submitting completed form...")

      if (!formData.visitInfo.date || !formData.visitInfo.time) {
        throw new Error("Visit date and time are required")
      }

      // First save as completed
      const saveData = {
        appointmentId,
        formType: "home_visit",
        status: "completed",
        visitDate: formData.visitInfo.date,
        visitTime: formData.visitInfo.time,
        visitNumber: formData.visitInfo.visitNumber || 1,
        quarter: formData.visitInfo.quarter || null,
        visitVariant: 1,
        visitInfo: formData.visitInfo,
        familyInfo: formData.family,
        attendees: formData.attendees,
        observations: formData.observations,
        recommendations: formData.recommendations,
        signatures: formData.signatures,
        createdByUserId: "system-user",
        createdByName: "System User",
        isAutoSave: false,
      }

      console.log("[v0] Submit data prepared:", saveData)

      const url = visitFormId ? `/api/visit-forms/${visitFormId}` : "/api/visit-forms"
      const method = visitFormId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveData),
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          const errorData = await response.json()
          console.log("[v0] Submit API error response:", errorData)

          if (errorData.error) {
            errorMessage = errorData.error
          }
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`
          }
        } catch (parseError) {
          console.log("[v0] Could not parse submit error response:", parseError)
        }

        throw new Error(`Failed to submit form: ${errorMessage}`)
      }

      const result = await response.json()
      console.log("[v0] Submit API response:", result)

      if (result.success) {
        toast({
          title: "Form Submitted",
          description: "Your visit form has been submitted successfully",
        })

        onSubmit?.(formData)
      } else {
        throw new Error(result.error || "Failed to submit form")
      }
    } catch (error) {
      console.error("[v0] Form submission failed:", error)
      toast({
        title: "Submit Error",
        description: error instanceof Error ? error.message : "Failed to submit form",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getQuarter = (dateString: string) => {
    const month = new Date(dateString).getMonth() + 1
    if (month <= 3) return "Q1"
    if (month <= 6) return "Q2"
    if (month <= 9) return "Q3"
    return "Q4"
  }

  const getSectionsForRole = () => {
    const baseSections = [
      { title: "Visit Information", icon: Calendar },
      { title: "Family & Home", icon: Home },
      { title: "Attendees", icon: Users },
      { title: "Observations", icon: FileText },
      { title: "Recommendations", icon: FileText },
      { title: "Signatures", icon: User },
    ]

    if (formData.visitInfo.role === "case-manager") {
      // Case managers see additional sections
      return [
        ...baseSections.slice(0, 3),
        { title: "Home Environment", icon: CheckCircle },
        { title: "Child Interviews", icon: Users },
        { title: "Parent Interviews", icon: Users },
        { title: "Compliance Review", icon: AlertCircle },
        ...baseSections.slice(3),
      ]
    }

    return baseSections
  }

  const getVariantQuestions = (variant: number) => {
    const variantConfig = {
      1: {
        // First visit of quarter - comprehensive
        childQuestions: [
          "How have things been going this month?",
          "What makes you happy? What makes you upset?",
          "Tell me about school - your favorite and least favorite parts.",
          "What activities do you enjoy doing with your foster family?",
          "Do you feel safe and comfortable in this home?",
        ],
        parentQuestions: [
          "Describe any behavioral incidents this month.",
          "What positive changes have you observed?",
          "How are the children adjusting to routines?",
          "What activities has the family done together?",
          "Any medical, dental, or therapy appointments?",
        ],
        focusAreas: ["comprehensive", "baseline", "relationships"],
      },
      2: {
        // Second visit - behavioral/educational focus
        childQuestions: [
          "How is school going? Any challenges or successes?",
          "Tell me about your friends and social activities.",
          "What's been the best part of this month?",
          "Have you tried any new activities or hobbies?",
          "How do you handle it when you get upset?",
        ],
        parentQuestions: [
          "Describe the children's school performance and behavior.",
          "How do they interact with peers?",
          "What behavioral strategies are working well?",
          "Any changes in medication or therapy?",
          "How are you managing challenging behaviors?",
        ],
        focusAreas: ["education", "behavior", "social"],
      },
      3: {
        // Third visit - health/development focus
        childQuestions: [
          "How are you feeling physically and emotionally?",
          "What new things have you learned recently?",
          "Tell me about your daily routines.",
          "What goals are you working on?",
          "How is therapy going? Is it helpful?",
        ],
        parentQuestions: [
          "Update on medical/dental/vision appointments.",
          "Any developmental concerns or milestones?",
          "How are the children's sleeping and eating patterns?",
          "Progress on treatment goals?",
          "Life skills being taught?",
        ],
        focusAreas: ["health", "development", "planning"],
      },
    }

    return variantConfig[variant as keyof typeof variantConfig] || variantConfig[1]
  }

  // Input change handler
  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }))
  }

  const renderSection = () => {
    const activeSections = getSectionsForRole()
    const section = activeSections[currentSection]

    switch (section.title) {
      case "Visit Information":
        return <VisitInfoSection formData={formData} onChange={handleInputChange} lookupData={lookupData} />
      case "Family & Home":
        return <FamilyHomeSection formData={formData} onChange={handleInputChange} />
      case "Attendees":
        return <AttendeesSection formData={formData} onChange={handleInputChange} lookupData={lookupData} />
      case "Home Environment":
        return <HomeEnvironmentSection formData={formData} onChange={handleInputChange} />
      case "Child Interviews":
        return (
          <ChildInterviewSection
            formData={formData}
            onChange={handleInputChange}
            variant={visitVariant}
            questions={getVariantQuestions(visitVariant).childQuestions}
          />
        )
      case "Parent Interviews":
        return (
          <ParentInterviewSection
            formData={formData}
            onChange={handleInputChange}
            variant={visitVariant}
            questions={getVariantQuestions(visitVariant).parentQuestions}
          />
        )
      case "Compliance Review":
        return <ComplianceSection formData={formData} onChange={handleInputChange} />
      case "Observations":
        return <ObservationsSection formData={formData} onChange={handleInputChange} />
      case "Recommendations":
        return <RecommendationsSection formData={formData} onChange={handleInputChange} />
      case "Signatures":
        return <SignatureSection formData={formData} onChange={handleInputChange} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const activeSections = getSectionsForRole()

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Foster Home Visit Form</h1>
              <p className="text-gray-600 mt-2">
                {formData.visitInfo.quarter} - Visit {formData.visitInfo.visitNumber}
                {visitVariant && (
                  <span className="ml-2">
                    (Variant {visitVariant}: {getVariantQuestions(visitVariant).focusAreas.join(", ")})
                  </span>
                )}
              </p>
              {appointmentId && (
                <Badge variant="outline" className="mt-2">
                  Appointment ID: {appointmentId}
                </Badge>
              )}
              {lastSaved && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  Last saved: {lastSaved.toLocaleString()}
                  {saving && <span className="text-blue-600">(Saving...)</span>}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Role: {formData.visitInfo.role === "liaison" ? "Home Visit Liaison" : "Case Manager"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="autoSave"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autoSave" className="text-sm text-gray-600">
                  Auto-save
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            {activeSections.map((section, idx) => (
              <div
                key={idx}
                className={`flex items-center cursor-pointer ${idx === currentSection ? "text-blue-600" : "text-gray-400"}`}
                onClick={() => setCurrentSection(idx)}
              >
                <section.icon className="w-5 h-5" />
                <span className="ml-2 text-sm hidden md:inline">{section.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentSection + 1) / activeSections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">{renderSection()}</div>

        {/* Navigation & Actions */}
        <div className="flex justify-between">
          <Button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            variant="outline"
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button onClick={handleSave} variant="outline" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Draft"}
            </Button>

            {currentSection === activeSections.length - 1 ? (
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Submitting..." : "Submit Form"}
              </Button>
            ) : (
              <Button onClick={() => setCurrentSection(Math.min(activeSections.length - 1, currentSection + 1))}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const VisitInfoSection = ({ formData, onChange, lookupData }: any) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold mb-4">Visit Information</h2>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Date</Label>
        <Input
          type="date"
          value={formData.visitInfo.date}
          onChange={(e) => onChange("visitInfo", "date", e.target.value)}
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Time</Label>
        <Input
          type="time"
          value={formData.visitInfo.time}
          onChange={(e) => onChange("visitInfo", "time", e.target.value)}
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Visit Number</Label>
        <Input
          type="number"
          min="1"
          value={formData.visitInfo.visitNumber}
          onChange={(e) => onChange("visitInfo", "visitNumber", Number.parseInt(e.target.value) || 1)}
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Quarter</Label>
        <Input type="text" value={formData.visitInfo.quarter} disabled className="bg-gray-100" />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</Label>
        <Select value={formData.visitInfo.type} onValueChange={(value) => onChange("visitInfo", "type", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lookupData.visitTypes.length > 0 ? (
              lookupData.visitTypes.map((type: any) => (
                <SelectItem key={type.id} value={type.name.toLowerCase().replace(" ", "_")}>
                  {type.name}
                </SelectItem>
              ))
            ) : (
              <>
                <SelectItem value="announced">Announced</SelectItem>
                <SelectItem value="unannounced">Unannounced</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Visit Mode</Label>
        <Select value={formData.visitInfo.mode} onValueChange={(value) => onChange("visitInfo", "mode", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lookupData.visitModes.length > 0 ? (
              lookupData.visitModes.map((mode: any) => (
                <SelectItem key={mode.id} value={mode.name.toLowerCase().replace(" ", "-")}>
                  {mode.name}
                </SelectItem>
              ))
            ) : (
              <>
                <SelectItem value="in-home">In-Home</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2">
        <Label className="block text-sm font-medium text-gray-700 mb-1">Conducted By</Label>
        <Input
          type="text"
          value={formData.visitInfo.conductedBy}
          onChange={(e) => onChange("visitInfo", "conductedBy", e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Your Role</Label>
        <Select value={formData.visitInfo.role} onValueChange={(value) => onChange("visitInfo", "role", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="liaison">Home Visit Liaison</SelectItem>
            <SelectItem value="case-manager">Case Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
)

const FamilyHomeSection = ({ formData, onChange }: any) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold mb-4">Family & Home Information</h2>

    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Label className="block text-sm font-medium text-gray-700 mb-1">Family Name</Label>
        <Input
          type="text"
          value={formData.family.familyName}
          onChange={(e) => onChange("family", "familyName", e.target.value)}
        />
      </div>

      <div className="col-span-2">
        <Label className="block text-sm font-medium text-gray-700 mb-1">Address</Label>
        <Input
          type="text"
          value={formData.family.address}
          onChange={(e) => onChange("family", "address", e.target.value)}
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Phone</Label>
        <Input type="tel" value={formData.family.phone} onChange={(e) => onChange("family", "phone", e.target.value)} />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Email</Label>
        <Input
          type="email"
          value={formData.family.email}
          onChange={(e) => onChange("family", "email", e.target.value)}
        />
      </div>
    </div>
  </div>
)

const AttendeesSection = ({ formData, onChange, lookupData }: any) => {
  const [attendees, setAttendees] = useState(() => {
    const initialAttendees = formData.attendees
    return Array.isArray(initialAttendees) ? initialAttendees : []
  })
  const [newAttendee, setNewAttendee] = useState({ name: "", role: "", present: true })

  useEffect(() => {
    if (Array.isArray(formData.attendees)) {
      setAttendees(formData.attendees)
    }
  }, [formData.attendees])

  const addAttendee = () => {
    if (newAttendee.name) {
      const updated = [...attendees, newAttendee]
      setAttendees(updated)
      onChange("attendees", "list", updated)
      setNewAttendee({ name: "", role: "", present: true })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Visit Attendees</h2>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Add Attendee</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Name"
            value={newAttendee.name}
            onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
            className="flex-1"
          />
          <Select value={newAttendee.role} onValueChange={(value) => setNewAttendee({ ...newAttendee, role: value })}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              {lookupData.attendeeRoles.length > 0 ? (
                lookupData.attendeeRoles.map((role: any) => (
                  <SelectItem key={role.id} value={role.name.toLowerCase().replace(" ", "-")}>
                    {role.name}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="foster-parent">Foster Parent</SelectItem>
                  <SelectItem value="foster-child">Foster Child</SelectItem>
                  <SelectItem value="bio-child">Biological Child</SelectItem>
                  <SelectItem value="relative">Relative</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Button onClick={addAttendee}>Add</Button>
        </div>
      </div>

      <div className="space-y-2">
        {attendees.map((attendee: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between border rounded p-2">
            <span>
              {attendee.name} - {attendee.role}
            </span>
            <input
              type="checkbox"
              checked={attendee.present}
              onChange={(e) => {
                const updated = [...attendees]
                updated[idx].present = e.target.checked
                setAttendees(updated)
                onChange("attendees", "list", updated)
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

const HomeEnvironmentSection = ({ formData, onChange }: any) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold mb-4">Home Environment Assessment</h2>

    <Card>
      <CardHeader>
        <CardTitle>Safety Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          "Smoke detectors present and functional",
          "Fire extinguisher accessible",
          "Emergency exits clear",
          "Hazardous materials secured",
          "Medications properly stored",
        ].map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <Checkbox
              id={`safety-${idx}`}
              checked={formData.homeEnvironment.safetyChecklist?.[`item_${idx}`] || false}
              onCheckedChange={(checked) =>
                onChange("homeEnvironment", "safetyChecklist", {
                  ...formData.homeEnvironment.safetyChecklist,
                  [`item_${idx}`]: checked,
                })
              }
            />
            <Label htmlFor={`safety-${idx}`} className="text-sm">
              {item}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
)

const ChildInterviewSection = ({ formData, onChange, variant, questions }: any) => {
  const [interviews, setInterviews] = useState(formData.childInterviews || [])

  const addChildInterview = () => {
    const newInterview = {
      childName: "",
      age: "",
      responses: questions.map((q: string) => ({ question: q, answer: "" })),
      privateInterview: false,
    }
    const updated = [...interviews, newInterview]
    setInterviews(updated)
    onChange("childInterviews", "list", updated)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Child Interviews (Variant {variant})</h2>

      <Button onClick={addChildInterview} variant="outline">
        Add Child Interview
      </Button>

      {interviews.map((interview: any, idx: number) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle>Child Interview {idx + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Child Name</Label>
                <Input
                  value={interview.childName}
                  onChange={(e) => {
                    const updated = [...interviews]
                    updated[idx].childName = e.target.value
                    setInterviews(updated)
                    onChange("childInterviews", "list", updated)
                  }}
                />
              </div>
              <div>
                <Label>Age</Label>
                <Input
                  type="number"
                  value={interview.age}
                  onChange={(e) => {
                    const updated = [...interviews]
                    updated[idx].age = e.target.value
                    setInterviews(updated)
                    onChange("childInterviews", "list", updated)
                  }}
                />
              </div>
            </div>

            {interview.responses.map((response: any, qIdx: number) => (
              <div key={qIdx}>
                <Label className="text-sm font-medium">{response.question}</Label>
                <Textarea
                  value={response.answer}
                  onChange={(e) => {
                    const updated = [...interviews]
                    updated[idx].responses[qIdx].answer = e.target.value
                    setInterviews(updated)
                    onChange("childInterviews", "list", updated)
                  }}
                  rows={2}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const ParentInterviewSection = ({ formData, onChange, variant, questions }: any) => {
  const [interviews, setInterviews] = useState(formData.parentInterviews || [])

  const addParentInterview = () => {
    const newInterview = {
      parentName: "",
      role: "foster-parent",
      responses: questions.map((q: string) => ({ question: q, answer: "" })),
    }
    const updated = [...interviews, newInterview]
    setInterviews(updated)
    onChange("parentInterviews", "list", updated)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Parent Interviews (Variant {variant})</h2>

      <Button onClick={addParentInterview} variant="outline">
        Add Parent Interview
      </Button>

      {interviews.map((interview: any, idx: number) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle>Parent Interview {idx + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Parent Name</Label>
                <Input
                  value={interview.parentName}
                  onChange={(e) => {
                    const updated = [...interviews]
                    updated[idx].parentName = e.target.value
                    setInterviews(updated)
                    onChange("parentInterviews", "list", updated)
                  }}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={interview.role}
                  onValueChange={(value) => {
                    const updated = [...interviews]
                    updated[idx].role = value
                    setInterviews(updated)
                    onChange("parentInterviews", "list", updated)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foster-parent">Foster Parent</SelectItem>
                    <SelectItem value="relative">Relative Caregiver</SelectItem>
                    <SelectItem value="guardian">Legal Guardian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {interview.responses.map((response: any, qIdx: number) => (
              <div key={qIdx}>
                <Label className="text-sm font-medium">{response.question}</Label>
                <Textarea
                  value={response.answer}
                  onChange={(e) => {
                    const updated = [...interviews]
                    updated[idx].responses[qIdx].answer = e.target.value
                    setInterviews(updated)
                    onChange("parentInterviews", "list", updated)
                  }}
                  rows={2}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const ComplianceSection = ({ formData, onChange }: any) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold mb-4">Compliance Review</h2>

    <Card>
      <CardHeader>
        <CardTitle>Document Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          "Foster care license current",
          "Background checks up to date",
          "Training certificates current",
          "Medical records accessible",
          "Emergency contact information updated",
        ].map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <Checkbox
              id={`doc-${idx}`}
              checked={formData.compliance.documentsVerified?.[`doc_${idx}`] || false}
              onCheckedChange={(checked) =>
                onChange("compliance", "documentsVerified", {
                  ...formData.compliance.documentsVerified,
                  [`doc_${idx}`]: checked,
                })
              }
            />
            <Label htmlFor={`doc-${idx}`} className="text-sm">
              {item}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>

    <div>
      <Label className="block text-sm font-medium text-gray-700 mb-1">Non-Compliance Issues</Label>
      <Textarea
        value={formData.compliance.nonCompliances?.join("\n") || ""}
        onChange={(e) => onChange("compliance", "nonCompliances", e.target.value.split("\n").filter(Boolean))}
        placeholder="List any non-compliance issues identified..."
        rows={3}
      />
    </div>
  </div>
)

const ObservationsSection = ({ formData, onChange }: any) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold mb-4">Observations</h2>

    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Home Atmosphere</Label>
        <Textarea
          value={formData.observations.homeAtmosphere}
          onChange={(e) => onChange("observations", "homeAtmosphere", e.target.value)}
          placeholder="Describe the overall atmosphere and environment of the home..."
          rows={4}
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Positive Observations</Label>
        <Textarea
          value={formData.observations.positiveObservations}
          onChange={(e) => onChange("observations", "positiveObservations", e.target.value)}
          placeholder="Note positive aspects observed during the visit..."
          rows={3}
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Behavioral Observations</Label>
        <Textarea
          value={formData.observations.behaviorObservations}
          onChange={(e) => onChange("observations", "behaviorObservations", e.target.value)}
          placeholder="Describe any behavioral observations of children and family interactions..."
          rows={3}
        />
      </div>
    </div>
  </div>
)

const RecommendationsSection = ({ formData, onChange }: any) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold mb-4">Recommendations & Next Steps</h2>

    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</Label>
        <Textarea
          value={formData.recommendations}
          onChange={(e) => onChange("recommendations", "", e.target.value)}
          placeholder="Provide recommendations based on the visit..."
          rows={4}
        />
      </div>
    </div>
  </div>
)

const SignatureSection = ({ formData, onChange }: any) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold mb-4">Signatures</h2>

    <div className="grid grid-cols-1 gap-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Visitor Signature</Label>
        <Input
          type="text"
          value={formData.signatures.visitor}
          onChange={(e) => onChange("signatures", "visitor", e.target.value)}
          placeholder="Type your name to sign"
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Foster Parent 1 Signature</Label>
        <Input
          type="text"
          value={formData.signatures.parent1}
          onChange={(e) => onChange("signatures", "parent1", e.target.value)}
          placeholder="Foster parent signature"
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          Foster Parent 2 Signature (if applicable)
        </Label>
        <Input
          type="text"
          value={formData.signatures.parent2}
          onChange={(e) => onChange("signatures", "parent2", e.target.value)}
          placeholder="Second foster parent signature"
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Signature (if required)</Label>
        <Input
          type="text"
          value={formData.signatures.supervisor}
          onChange={(e) => onChange("signatures", "supervisor", e.target.value)}
          placeholder="Supervisor signature"
        />
      </div>
    </div>
  </div>
)

export default BasicHomeVisitForm
