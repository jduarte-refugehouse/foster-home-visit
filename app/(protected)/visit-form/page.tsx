"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import EnhancedHomeVisitForm from "@/components/forms/home-visit-form-enhanced"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { logVisitEnd } from "@/lib/continuum-logger"

export default function VisitFormPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const appointmentId = searchParams.get("appointmentId")
  const { toast } = useToast()
  const { user } = useUser()

  const [appointmentData, setAppointmentData] = useState(null)
  const [prepopulationData, setPrepopulationData] = useState(null)
  const [existingFormData, setExistingFormData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [debugData, setDebugData] = useState({
    apiResponse: null,
    error: null,
    lastAttempt: null,
  })
  
  // Session tracking - uses sessionStorage to persist across page refreshes within same browser session
  const sessionIdRef = useRef<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  
  // Initialize session ID on mount - persists across page refreshes within same browser session
  useEffect(() => {
    // Check if we already have a session ID in sessionStorage
    const storageKey = `visit-form-session-${appointmentId || 'new'}`
    let sessionId = null
    
    if (typeof window !== 'undefined') {
      sessionId = sessionStorage.getItem(storageKey)
    }
    
    if (!sessionId) {
      // Generate a unique session ID
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(storageKey, sessionId)
      }
      console.log("🆔 [SESSION] New browser session started:", sessionId)
    } else {
      console.log("🆔 [SESSION] Resuming browser session:", sessionId)
    }
    
    sessionIdRef.current = sessionId
    setCurrentSessionId(sessionId)
  }, [appointmentId])

  useEffect(() => {
    if (appointmentId) {
      fetchFormData()
    } else {
      setLoading(false)
    }
  }, [appointmentId])

  const fetchFormData = async () => {
    try {
      console.log("📋 [FORM] Fetching appointment data for ID:", appointmentId)
      setDebugData((prev) => ({ ...prev, lastAttempt: new Date().toISOString() }))

      // 1. Get appointment details
      const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`)
      
      if (!appointmentResponse.ok) {
        throw new Error("Failed to fetch appointment")
      }

      const appointmentData = await appointmentResponse.json()
      console.log("📋 [FORM] Appointment data received:", appointmentData)
      // Wrap appointment in same structure as appointment detail page expects
      setAppointmentData({ appointment: appointmentData.appointment || appointmentData })

      // 2. Check if a visit form already exists for this appointment
      console.log("🔍 [FORM] Checking for existing visit form...")
      const existingFormResponse = await fetch(`/api/visit-forms?appointmentId=${appointmentId}`)
      
      if (existingFormResponse.ok) {
        const existingFormResult = await existingFormResponse.json()
        if (existingFormResult.visitForms && existingFormResult.visitForms.length > 0) {
          const existingForm = existingFormResult.visitForms[0]
          console.log("✅ [FORM] Found existing visit form:", existingForm)
          setExistingFormData(existingForm)
          
          // Check if we're opening in a new session (different from stored session)
          if (existingForm.current_session_id && existingForm.current_session_id !== sessionIdRef.current) {
            console.log("🔄 [SESSION] New session detected - previous session:", existingForm.current_session_id)
            // The API will handle committing the previous session's save to history
          }
        } else {
          console.log("ℹ️ [FORM] No existing visit form found - will create new")
        }
      }

      // 3. Get home GUID from appointment via home_xref
      const homeXref = appointmentData.appointment?.home_xref
      
      if (!homeXref) {
        console.warn("⚠️ [FORM] No home_xref found in appointment - cannot pre-populate")
        setLoading(false)
        return
      }

      // 4. Look up home GUID from syncActiveHomes using xref
      console.log(`🔍 [FORM] Looking up home GUID for xref: ${homeXref}`)
      const homeLookupResponse = await fetch(`/api/homes/lookup?xref=${homeXref}`)
      
      if (!homeLookupResponse.ok) {
        console.error("❌ [FORM] Failed to lookup home GUID")
        setLoading(false)
        return
      }

      const homeLookupData = await homeLookupResponse.json()
      const homeGuid = homeLookupData.guid
      
      if (!homeGuid) {
        console.warn("⚠️ [FORM] No GUID found for home xref:", homeXref)
        setLoading(false)
        return
      }

      // 5. Fetch pre-population data for this home
      console.log(`📋 [FORM] Fetching pre-population data for home GUID: ${homeGuid}`)
      const prepopResponse = await fetch(`/api/homes/${homeGuid}/prepopulate`)
      
      if (prepopResponse.ok) {
        const prepopData = await prepopResponse.json()
        console.log("📋 [FORM] Pre-population data received:", prepopData)
        setPrepopulationData(prepopData)
        setDebugData((prev) => ({ ...prev, apiResponse: prepopData, error: null }))
      } else {
        const errorText = await prepopResponse.text()
        console.error("❌ [FORM] Failed to fetch pre-population data:", errorText)
        setDebugData((prev) => ({
          ...prev,
          error: {
            status: prepopResponse.status,
            statusText: prepopResponse.statusText,
            body: errorText,
          },
        }))
      }

    } catch (error) {
      console.error("❌ [FORM] Error fetching form data:", error)
      setDebugData((prev) => ({
        ...prev,
        error: {
          message: error.message,
          stack: error.stack,
        },
      }))
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData: any) => {
    try {
      console.log("💾 [FORM] Saving form draft:", formData)

      if (!appointmentId) {
        toast({
          title: "Error",
          description: "No appointment ID available",
          variant: "destructive",
        })
        return
      }

      // Helper to filter out empty compliance sections
      const filterComplianceSection = (section: any) => {
        if (!section) return null
        if (!section.items || section.items.length === 0) return null
        
        // Only include items with actual data (status or notes)
        const filledItems = section.items.filter((item: any) => 
          item.status || item.notes
        )
        
        if (filledItems.length === 0 && !section.combinedNotes) return null
        
        return {
          items: filledItems,
          combinedNotes: section.combinedNotes || ""
        }
      }

      // Helper to filter special sections (inspections, trauma-informed care, quality enhancement)
      const filterSpecialSection = (section: any) => {
        if (!section) return null
        
        // Check if any field has actual data
        const hasData = Object.values(section).some(value => {
          if (typeof value === 'string') return value.trim() !== ''
          if (typeof value === 'boolean') return value === true
          if (Array.isArray(value)) return value.length > 0
          if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0
          return false
        })
        
        return hasData ? section : null
      }

      // Build compliance review and remove null sections
      const complianceReview: any = {}
      const sections = {
        medication: filterComplianceSection(formData.medication),
        inspections: filterSpecialSection(formData.inspections),
        healthSafety: filterComplianceSection(formData.healthSafety),
        childrensRights: filterComplianceSection(formData.childrensRights),
        bedrooms: filterComplianceSection(formData.bedrooms),
        education: filterComplianceSection(formData.education),
        indoorSpace: filterComplianceSection(formData.indoorSpace),
        documentation: filterComplianceSection(formData.documentation),
        traumaInformedCare: filterSpecialSection(formData.traumaInformedCare),
        outdoorSpace: filterComplianceSection(formData.outdoorSpace),
        vehicles: filterComplianceSection(formData.vehicles),
        swimming: filterComplianceSection(formData.swimming),
        infants: filterComplianceSection(formData.infants),
        qualityEnhancement: filterSpecialSection(formData.qualityEnhancement),
      }

      // Only include non-null sections
      for (const [key, value] of Object.entries(sections)) {
        if (value !== null) {
          complianceReview[key] = value
        }
      }

      const savePayload = {
        appointmentId: appointmentId,
        formType: "monthly_home_visit",
        formVersion: "3.1",
        status: "draft",
        visitDate: formData.visitInfo.date || new Date().toISOString().split("T")[0],
        visitTime: formData.visitInfo.time || new Date().toTimeString().slice(0, 5),
        visitNumber: formData.visitInfo.visitNumberThisQuarter || 1,
        quarter: formData.visitInfo.quarter || "",
        visitVariant: 1,
        
        visitInfo: formData.visitInfo,
        familyInfo: {
          fosterHome: formData.fosterHome,
          household: formData.household,
        },
        attendees: {
          childrenPresent: formData.childrenPresent,
        },
        homeEnvironment: {
          homeCondition: formData.homeCondition,
          outdoorSpace: formData.outdoorSpace,
        },
        observations: {
          observations: formData.observations,
          followUpItems: formData.followUpItems,
          correctiveActions: formData.correctiveActions,
        },
        recommendations: {
          visitSummary: formData.visitSummary,
        },
        signatures: formData.signatures,
        complianceReview: complianceReview,
        childInterviews: {
          placements: formData.placements,
        },
        parentInterviews: {
          fosterParentInterview: formData.fosterParentInterview,
        },
        
        createdByUserId: appointmentData?.appointment?.assigned_to_user_id || appointmentData?.appointment?.created_by_user_id || user?.id || "system",
        createdByName: appointmentData?.appointment?.assigned_to_name || appointmentData?.appointment?.created_by_name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "System",
        isAutoSave: false,
        // Session tracking
        currentSessionId: sessionIdRef.current,
        currentSessionUserId: user?.id || "",
        currentSessionUserName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "",
      }

      // Calculate and log payload size
      const payloadString = JSON.stringify(savePayload)
      const payloadSizeKB = (payloadString.length / 1024).toFixed(2)
      console.log(`📦 [FORM] Payload size: ${payloadSizeKB} KB`)
      console.log(`📋 [FORM] Compliance sections with data: ${Object.keys(complianceReview).length}/${Object.keys(sections).length}`)
      console.log("📤 [FORM] Sending save request...")
      console.log("📦 [FORM] Full payload:", JSON.stringify(savePayload, null, 2))
      
      const response = await fetch("/api/visit-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(savePayload),
      })

      console.log("📬 [FORM] Response status:", response.status)
      const result = await response.json()
      console.log("📬 [FORM] Response data:", result)

      if (!response.ok) {
        console.error("❌ [FORM] Save failed:", result)
        throw new Error(result.error || result.details || "Failed to save form")
      }

      console.log("✅ [FORM] Form saved successfully:", result)
      toast({
        title: "Draft Saved",
        description: "Your form has been saved as a draft",
      })
    } catch (error) {
      console.error("❌ [FORM] Error saving form:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save form draft",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (formData: any) => {
    try {
      console.log("📋 [FORM] Submitting completed form:", formData)

      if (!appointmentData) {
        toast({
          title: "Error",
          description: "No appointment data available",
          variant: "destructive",
        })
        return
      }

      // Helper to filter out empty compliance sections
      const filterComplianceSection = (section: any) => {
        if (!section) return null
        if (!section.items || section.items.length === 0) return null
        
        const filledItems = section.items.filter((item: any) => 
          item.status || item.notes
        )
        
        if (filledItems.length === 0 && !section.combinedNotes) return null
        
        return {
          items: filledItems,
          combinedNotes: section.combinedNotes || ""
        }
      }

      // Helper to filter special sections (inspections, trauma-informed care, quality enhancement)
      const filterSpecialSection = (section: any) => {
        if (!section) return null
        
        // Check if any field has actual data
        const hasData = Object.values(section).some(value => {
          if (typeof value === 'string') return value.trim() !== ''
          if (typeof value === 'boolean') return value === true
          if (Array.isArray(value)) return value.length > 0
          if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0
          return false
        })
        
        return hasData ? section : null
      }

      // Build compliance review and remove null sections
      const complianceReview: any = {}
      const sections = {
        medication: filterComplianceSection(formData.medication),
        inspections: filterSpecialSection(formData.inspections),
        healthSafety: filterComplianceSection(formData.healthSafety),
        childrensRights: filterComplianceSection(formData.childrensRights),
        bedrooms: filterComplianceSection(formData.bedrooms),
        education: filterComplianceSection(formData.education),
        indoorSpace: filterComplianceSection(formData.indoorSpace),
        documentation: filterComplianceSection(formData.documentation),
        traumaInformedCare: filterSpecialSection(formData.traumaInformedCare),
        outdoorSpace: filterComplianceSection(formData.outdoorSpace),
        vehicles: filterComplianceSection(formData.vehicles),
        swimming: filterComplianceSection(formData.swimming),
        infants: filterComplianceSection(formData.infants),
        qualityEnhancement: filterSpecialSection(formData.qualityEnhancement),
      }

      // Only include non-null sections
      for (const [key, value] of Object.entries(sections)) {
        if (value !== null) {
          complianceReview[key] = value
        }
      }

      // First, save the form as completed
      const savePayload = {
        appointmentId: appointmentId,
        formType: "monthly_home_visit",
        formVersion: "3.1",
        status: "completed",
        visitDate: formData.visitInfo.date,
        visitTime: formData.visitInfo.time,
        visitNumber: formData.visitInfo.visitNumberThisQuarter || 1,
        quarter: formData.visitInfo.quarter,
        visitVariant: 1,
        
        visitInfo: formData.visitInfo,
        familyInfo: {
          fosterHome: formData.fosterHome,
          household: formData.household,
        },
        attendees: {
          childrenPresent: formData.childrenPresent,
        },
        homeEnvironment: {
          homeCondition: formData.homeCondition,
          outdoorSpace: formData.outdoorSpace,
        },
        observations: {
          observations: formData.observations,
          followUpItems: formData.followUpItems,
          correctiveActions: formData.correctiveActions,
        },
        recommendations: {
          visitSummary: formData.visitSummary,
        },
        signatures: formData.signatures,
        complianceReview: complianceReview,
        childInterviews: {
          placements: formData.placements,
        },
        parentInterviews: {
          fosterParentInterview: formData.fosterParentInterview,
        },
        
        createdByUserId: appointmentData?.appointment?.assigned_to_user_id || appointmentData?.appointment?.created_by_user_id || user?.id || "system",
        createdByName: appointmentData?.appointment?.assigned_to_name || appointmentData?.appointment?.created_by_name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "System",
        isAutoSave: false,
        // Session tracking
        currentSessionId: sessionIdRef.current,
        currentSessionUserId: user?.id || "",
        currentSessionUserName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "",
      }

      // Calculate and log payload size
      const payloadString = JSON.stringify(savePayload)
      const payloadSizeKB = (payloadString.length / 1024).toFixed(2)
      console.log(`📦 [FORM] Submit payload size: ${payloadSizeKB} KB`)
      console.log(`📋 [FORM] Compliance sections with data: ${Object.keys(complianceReview).length}/${Object.keys(sections).length}`)
      console.log("📤 [FORM] Sending submit request...")
      const formResponse = await fetch("/api/visit-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(savePayload),
      })

      const formResult = await formResponse.json()

      if (!formResponse.ok) {
        throw new Error(formResult.error || "Failed to submit form")
      }

      console.log("✅ [FORM] Form submitted successfully:", formResult)

      // Then, update the appointment status to completed
      if (appointmentId) {
        console.log("📅 [FORM] Updating appointment status...")
        const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
          }),
        })

        if (appointmentResponse.ok) {
          console.log("✅ [FORM] Appointment marked as completed")
          toast({
            title: "Form Submitted",
            description: "Your visit form has been submitted and appointment marked as completed",
          })
        } else {
          // Form was saved but appointment update failed
          toast({
            title: "Partial Success",
            description: "Form was saved but appointment status could not be updated",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Form Submitted",
          description: "Your visit form has been submitted successfully",
        })
      }
    } catch (error) {
      console.error("❌ [FORM] Error submitting form:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form",
        variant: "destructive",
      })
    }
  }

  const handleVisitFormCompleted = async () => {
    if (!appointmentId) {
      toast({
        title: "Error",
        description: "Appointment ID is required",
        variant: "destructive",
      })
      return
    }

    try {
      // Update appointment status
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
        }),
      })

      if (response.ok) {
        // Log visit end to continuum (non-blocking)
        if (appointmentId && appointmentData?.appointment) {
          const appointment = appointmentData.appointment
          // Calculate duration if we have visit start time
          let durationMinutes: number | undefined = undefined
          if (appointment.arrived_timestamp) {
            const startTime = new Date(appointment.arrived_timestamp).getTime()
            const endTime = new Date().getTime()
            durationMinutes = Math.round((endTime - startTime) / (1000 * 60))
          }

          logVisitEnd({
            appointmentId: appointmentId,
            staffUserId: user?.id || appointment.assigned_to_user_id || null,
            staffName: user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`.trim()
              : appointment.assigned_to_name || "Unknown Staff",
            homeGuid: appointment.home_xref ? appointment.home_xref.toString() : null,
            homeXref: appointment.home_xref ? parseInt(String(appointment.home_xref)) : undefined,
            homeName: appointment.home_name || appointment.title || null,
            durationMinutes: durationMinutes,
            outcome: "Visit marked as completed",
            contextNotes: "Visit completed via form completion button",
            createdByUserId: user?.id || appointment.assigned_to_user_id || null,
          }).then((result) => {
            if (result.success) {
              console.log("✅ [CONTINUUM] Visit end logged:", result.entryId)
            } else {
              console.warn("⚠️ [CONTINUUM] Failed to log visit end:", result.error)
            }
          }).catch((error) => {
            console.error("❌ [CONTINUUM] Error logging visit end:", error)
          })
        }

        toast({
          title: "Success",
          description: "Visit completed and appointment updated",
        })
        
        // Refresh appointment data
        if (appointmentId) {
          const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`)
          if (appointmentResponse.ok) {
            const appointmentData = await appointmentResponse.json()
            setAppointmentData({ appointment: appointmentData.appointment || appointmentData })
          }
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to complete visit",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating appointment status:", error)
      toast({
        title: "Error",
        description: "Failed to complete visit",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Debug dialog removed - no longer needed in production */}
      
      {/* Enhanced Home Visit Form - Version 3.1 */}
      <EnhancedHomeVisitForm
        appointmentId={appointmentId}
        appointmentData={appointmentData}
        prepopulationData={prepopulationData}
        existingFormData={existingFormData}
        onSave={async (formData) => {
          // The form component handles saving internally via saveFormData
          // This callback is just for notification
          await handleSave(formData)
        }}
        onSubmit={handleSubmit}
        onCompleteVisit={handleVisitFormCompleted}
      />
    </div>
  )
}
