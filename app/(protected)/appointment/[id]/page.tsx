"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@refugehouse/shared-core/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@refugehouse/shared-core/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@refugehouse/shared-core/components/ui/select"
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  User, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Edit,
  ExternalLink,
  Play,
  History,
  MessageSquare,
  Paperclip,
  Navigation,
  MapPin as MapPinIcon,
  Trash2,
  Send,
  Image,
  X
} from "lucide-react"
import { SidebarTrigger } from "@refugehouse/shared-core/components/ui/sidebar"
import { Separator } from "@refugehouse/shared-core/components/ui/separator"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { VisitFormButton } from "@/components/appointments/visit-form-button"
import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import EnhancedHomeVisitForm from "@/components/forms/home-visit-form-enhanced"
import { VisitHistoryTab } from "@/components/appointments/visit-history-tab"
import { StaffTrainingSummary } from "@/components/appointments/staff-training-summary"
import { logDriveStart, logDriveEnd, logVisitStart, logVisitEnd } from "@refugehouse/shared-core/continuum"

interface Appointment {
  appointment_id: string
  title: string
  start_datetime: string
  end_datetime: string
  status: "scheduled" | "completed" | "cancelled" | "in_progress" | "rescheduled"
  appointment_type: string
  home_name: string
  home_xref?: string
  location_address: string
  assigned_to_name: string
  assigned_to_role: string
  assigned_to_user_id: string
  priority: string
  description?: string
  preparation_notes?: string
  completion_notes?: string
  created_by_name?: string
  created_at?: string
  updated_at?: string
  // Mileage tracking fields
  start_drive_latitude?: number
  start_drive_longitude?: number
  start_drive_timestamp?: string
  arrived_latitude?: number
  arrived_longitude?: number
  arrived_timestamp?: string
  calculated_mileage?: number
  // Toll tracking fields
  estimated_toll_cost?: number | null
  toll_confirmed?: boolean
  actual_toll_cost?: number | null
  // Return travel tracking fields
  return_latitude?: number
  return_longitude?: number
  return_timestamp?: string
  return_start_timestamp?: string | null
  return_mileage?: number | null
  return_start_latitude?: number | null
  return_start_longitude?: number | null
  // Travel leg flags (from new leg-based system)
  has_in_progress_leg?: boolean
  has_completed_leg?: boolean
  has_in_progress_return_leg?: boolean
  return_leg_id?: string | null
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [visitFormStatus, setVisitFormStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [appointmentData, setAppointmentData] = useState<{ appointment: Appointment } | null>(null)
  const [prepopulationData, setPrepopulationData] = useState(null)
  const [existingFormData, setExistingFormData] = useState(null)
  const [formDataLoading, setFormDataLoading] = useState(false)
  const [capturingLocation, setCapturingLocation] = useState(false)
  const [showRecipientDialog, setShowRecipientDialog] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sendingLink, setSendingLink] = useState(false)
  const [homeGuid, setHomeGuid] = useState<string | null>(null)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [showPhoneMissingDialog, setShowPhoneMissingDialog] = useState(false)
  const [phoneMissingMessage, setPhoneMissingMessage] = useState("")
  const [showSendLinkDialog, setShowSendLinkDialog] = useState(false)
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<{ clerkUserId?: string; name: string; phone: string } | null>(null)
  const [recipientPhone, setRecipientPhone] = useState("")
  const [errorData, setErrorData] = useState<{ error: string; recipientName?: string; recipientClerkUserId?: string } | null>(null)
  const [mileageRate, setMileageRate] = useState<number>(0.67) // Default rate
  const [showTollDialog, setShowTollDialog] = useState(false)
  const [tollAmount, setTollAmount] = useState<string>("")
  const [showLeavingDialog, setShowLeavingDialog] = useState(false)
  const [nextAppointment, setNextAppointment] = useState<{ appointmentId: string; title: string; startDateTime: string; locationAddress?: string; homeName?: string } | null>(null)
  const [hasNextAppointment, setHasNextAppointment] = useState<boolean>(false)
  const [leavingAction, setLeavingAction] = useState<"next" | "return" | null>(null)
  const [attachments, setAttachments] = useState<any[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [trainingSummary, setTrainingSummary] = useState<string>("")
  const [loadingTrainingSummary, setLoadingTrainingSummary] = useState(false)

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails()
      fetchVisitFormStatus()
      fetchMileageRate()
    }
  }, [appointmentId])

  useEffect(() => {
    if (appointment?.appointment_type === "staff_training" && appointmentId) {
      fetchTrainingSummary()
    }
  }, [appointment?.appointment_type, appointmentId])

  useEffect(() => {
    if (activeTab === "attachments" && existingFormData?.visit_form_id) {
      fetchAttachments()
    }
  }, [activeTab, existingFormData?.visit_form_id])

  const fetchMileageRate = async () => {
    try {
      const response = await fetch("/api/settings?key=mileage_rate")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.setting?.ConfigValue) {
          const rate = parseFloat(data.setting.ConfigValue)
          if (!isNaN(rate)) {
            setMileageRate(rate)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching mileage rate:", error)
      // Use default rate if fetch fails
    }
  }

  const fetchAppointmentDetails = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch appointment")
      }
      const data = await response.json()
      setAppointment(data.appointment)
      
      // Fetch home GUID if we have home_xref
      if (data.appointment?.home_xref && !homeGuid) {
        try {
          console.log(`🔍 [APPT] Looking up home GUID for xref: ${data.appointment.home_xref}`)
          const homeLookupResponse = await fetch(`/api/homes/lookup?xref=${data.appointment.home_xref}`)
          if (homeLookupResponse.ok) {
            const homeLookupData = await homeLookupResponse.json()
            console.log(`✅ [APPT] Home GUID retrieved: ${homeLookupData.guid}`)
            setHomeGuid(homeLookupData.guid)
          } else {
            const lookupError = await homeLookupResponse.json().catch(() => ({ error: "Unknown error" }))
            console.error(`❌ [APPT] Failed to lookup home GUID:`, homeLookupResponse.status, lookupError)
          }
        } catch (error) {
          console.error("❌ [APPT] Error fetching home GUID:", error)
        }
      }
    } catch (error) {
      console.error("Error fetching appointment:", error)
      toast({
        title: "Error",
        description: "Failed to load appointment details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVisitFormStatus = async () => {
    try {
      const response = await fetch(`/api/visit-forms?appointmentId=${appointmentId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.visitForms && data.visitForms.length > 0) {
          setVisitFormStatus(data.visitForms[0].status)
          setExistingFormData(data.visitForms[0])
        }
      }
    } catch (error) {
      console.error("Error fetching visit form status:", error)
    }
  }

  const fetchTrainingSummary = async () => {
    if (!appointmentId) return
    
    setLoadingTrainingSummary(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/training-summary`)
      if (response.ok) {
        const data = await response.json()
        setTrainingSummary(data.summary || "")
      }
    } catch (error) {
      console.error("Error fetching training summary:", error)
    } finally {
      setLoadingTrainingSummary(false)
    }
  }

  const fetchAttachments = async () => {
    const visitFormId = existingFormData?.visit_form_id
    if (!visitFormId) return

    setLoadingAttachments(true)
    try {
      const response = await fetch(`/api/visit-forms/${visitFormId}/attachments`)
      const data = await response.json()

      if (data.success) {
        setAttachments(data.attachments || [])
      }
    } catch (error) {
      console.error("Error fetching attachments:", error)
      toast({
        title: "Error",
        description: "Failed to load attachments",
        variant: "destructive",
      })
    } finally {
      setLoadingAttachments(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    const visitFormId = existingFormData?.visit_form_id
    if (!visitFormId) return
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      const response = await fetch(`/api/visit-forms/${visitFormId}/attachments/${attachmentId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete file")
      }

      toast({
        title: "File Deleted",
        description: "File has been successfully deleted",
      })

      await fetchAttachments()
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith("image/")) return Image
    return FileText
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleVisitFormCompleted = async () => {
    try {
      console.log("🔍 [APPT] Visit Completed clicked, existingFormData:", {
        hasExistingFormData: !!existingFormData,
        visit_form_id: existingFormData?.visit_form_id,
        status: existingFormData?.status
      })
      
      // First, try to fetch the form if we don't have visit_form_id
      let visitFormId = existingFormData?.visit_form_id
      if (!visitFormId && appointmentId) {
        console.log("🔍 [APPT] No visit_form_id in existingFormData, fetching form...")
        try {
          const formResponse = await fetch(`/api/visit-forms?appointmentId=${appointmentId}`)
          if (formResponse.ok) {
            const formData = await formResponse.json()
            if (formData.visitForms && formData.visitForms.length > 0) {
              visitFormId = formData.visitForms[0].visit_form_id
              setExistingFormData(formData.visitForms[0])
              console.log("✅ [APPT] Found visit form, visit_form_id:", visitFormId)
            }
          }
        } catch (fetchError) {
          console.error("⚠️ [APPT] Failed to fetch form:", fetchError)
        }
      }
      
      // Update visit form status to "completed" if we have visit_form_id (this will create ContinuumMark)
      if (visitFormId) {
        try {
          console.log("📝 [APPT] Updating visit form status to completed, visit_form_id:", visitFormId)
          const formUpdateResponse = await fetch(`/api/visit-forms/${visitFormId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "completed",
              updatedByUserId: user?.id || appointment?.assigned_to_user_id || null,
              updatedByName: user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`.trim()
                : appointment?.assigned_to_name || "Unknown User",
              // Include existing form data to preserve it (use existingFormData if available, otherwise minimal data)
              visitDate: existingFormData?.visit_date || appointment?.start_datetime?.split('T')[0] || new Date().toISOString().split('T')[0],
              visitTime: existingFormData?.visit_time || appointment?.start_datetime?.split('T')[1]?.substring(0, 5) || "09:00",
              visitNumber: existingFormData?.visit_number || 1,
              quarter: existingFormData?.quarter || null,
              visitVariant: existingFormData?.visit_variant || 1,
              visitInfo: existingFormData?.visit_info || null,
              familyInfo: existingFormData?.family_info || null,
              attendees: existingFormData?.attendees || null,
              observations: existingFormData?.observations || null,
              recommendations: existingFormData?.recommendations || null,
              signatures: existingFormData?.signatures || null,
              homeEnvironment: existingFormData?.home_environment || null,
              childInterviews: existingFormData?.child_interviews || null,
              parentInterviews: existingFormData?.parent_interviews || null,
              complianceReview: existingFormData?.compliance_review || null,
            }),
          })

          if (formUpdateResponse.ok) {
            const formResult = await formUpdateResponse.json()
            console.log("✅ [APPT] Visit form marked as completed:", formResult)
            if (formResult.continuumMarkId) {
              console.log("✅ [APPT] ContinuumMark created:", formResult.continuumMarkId)
            }
          } else {
            const errorText = await formUpdateResponse.text()
            console.warn("⚠️ [APPT] Failed to update visit form status:", formUpdateResponse.status, errorText)
          }
        } catch (formError) {
          console.error("⚠️ [APPT] Error updating visit form status (non-blocking):", formError)
          // Continue with appointment update even if form update fails
        }
      } else {
        console.warn("⚠️ [APPT] No visit_form_id available, skipping form status update")
      }

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
        // Log visit end to continuum (non-blocking - don't fail if this fails)
        if (appointmentId && appointment) {
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
            homeGuid: homeGuid || (appointment.home_xref ? appointment.home_xref.toString() : null),
            homeXref: appointment.home_xref ? parseInt(String(appointment.home_xref)) : undefined,
            homeName: appointment.home_name || appointment.title || null,
            durationMinutes: durationMinutes,
            outcome: "Visit marked as completed",
            contextNotes: "Visit completed via form completion button",
            createdByUserId: user?.id || appointment.assigned_to_user_id || null,
          }).then((result) => {
            if (result.success) {
              console.log("✅ [CONTINUUM] Visit end logged:", result.entryId)
              // Refresh history tab to show the new entry
              setHistoryRefreshKey((prev) => prev + 1)
            } else {
              console.warn("⚠️ [CONTINUUM] Failed to log visit end:", result.error)
            }
          }).catch((error) => {
            console.error("❌ [CONTINUUM] Error logging visit end:", error)
          })
        } else {
          console.warn("⚠️ [CONTINUUM] Missing required data for logging visit end:", {
            appointmentId: !!appointmentId,
            appointment: !!appointment,
          })
        }

        toast({
          title: "Success",
          description: "Visit completed and appointment updated",
        })
        fetchAppointmentDetails()
        fetchVisitFormStatus()
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

  const handleStartVisit = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "in_progress",
        }),
      })

      let responseData
      try {
        const responseText = await response.text()
        if (!responseText || responseText.trim() === '') {
          console.error("❌ [API] Empty response body")
          toast({
            title: "Error",
            description: `Server error (${response.status}). Empty response from server.`,
            variant: "destructive",
          })
          return
        }
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error("❌ [API] Failed to parse response:", parseError)
        console.error("❌ [API] Response status:", response.status)
        console.error("❌ [API] Response headers:", Object.fromEntries(response.headers.entries()))
        toast({
          title: "Error",
          description: `Server error (${response.status}). Invalid response from server.`,
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        console.error("❌ [API] Failed to update appointment:", responseData)
        console.error("❌ [API] Response status:", response.status)
        console.error("❌ [API] Full error object:", JSON.stringify(responseData, null, 2))
        toast({
          title: "Error",
          description: responseData.error || responseData.details || `Failed to start visit (${response.status})`,
          variant: "destructive",
        })
        return
      }

      // Log visit start to continuum (non-blocking - don't fail if this fails)
      if (appointmentId && user && homeGuid && appointment) {
        logVisitStart({
          appointmentId,
          staffUserId: user.id,
          staffName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          homeGuid,
          homeXref: appointment.home_xref ? parseInt(String(appointment.home_xref)) : undefined,
          homeName: appointment.home_name,
          locationLatitude: appointment.arrived_latitude,
          locationLongitude: appointment.arrived_longitude,
          locationAddress: appointment.location_address,
          createdByUserId: user.id,
        })
          .then((result) => {
            if (result.success) {
              console.log("✅ [CONTINUUM] Visit start logged:", result.entryId)
              setHistoryRefreshKey(prev => prev + 1)
            } else {
              console.warn("⚠️ [CONTINUUM] Failed to log visit start:", result.error)
            }
          })
          .catch((error) => {
            console.error("❌ [CONTINUUM] Error logging visit start:", error)
            // Don't show error to user - logging is non-critical
          })
      } else {
        console.warn("⚠️ [CONTINUUM] Missing required data for logging:", {
          appointmentId: !!appointmentId,
          user: !!user,
          homeGuid: !!homeGuid,
          appointment: !!appointment,
        })
      }
      
      toast({
        title: "Visit Started",
        description: "Visit status updated to in_progress",
      })
      fetchAppointmentDetails()
      // Navigate to visit form
      router.push(`/visit-form?appointmentId=${appointmentId}`)
    } catch (error) {
      console.error("❌ [ERROR] Error starting visit:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start visit",
        variant: "destructive",
      })
    }
  }

  const captureLocation = async (action: "start_drive" | "arrived") => {
    setCapturingLocation(true)
    try {
      const { captureLocation: captureLocationHelper } = await import("@refugehouse/shared-core/geolocation")
      const location = await captureLocationHelper(action)
      setCapturingLocation(false)
      return location
    } catch (error: any) {
      setCapturingLocation(false)
      throw new Error(error.userFriendlyMessage || error.message || "Failed to capture location")
    }
  }

  const handleStartDrive = async () => {
    try {
      const location = await captureLocation("start_drive")

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (user) {
        headers["x-user-email"] = user.emailAddresses[0]?.emailAddress || ""
        headers["x-user-clerk-id"] = user.id
        headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
      }

      const response = await fetch(`/api/appointments/${appointmentId}/mileage`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "start_drive",
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Log drive start to continuum
        if (appointmentId && user) {
          try {
            await logDriveStart({
              appointmentId,
              staffUserId: user.id,
              staffName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
              locationLatitude: location.latitude,
              locationLongitude: location.longitude,
              createdByUserId: user.id,
            })
            console.log("✅ [CONTINUUM] Drive start logged")
            setHistoryRefreshKey(prev => prev + 1)
          } catch (error) {
            console.error("❌ [CONTINUUM] Failed to log drive start:", error)
          }
        }
        
        toast({
          title: "Drive Started",
          description: "Starting location captured",
        })
        fetchAppointmentDetails()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to capture starting location",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error starting drive:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to capture location. Please ensure location permissions are enabled.",
        variant: "destructive",
      })
    }
  }

  const handleArrived = async () => {
    try {
      const location = await captureLocation("arrived")

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (user) {
        headers["x-user-email"] = user.emailAddresses[0]?.emailAddress || ""
        headers["x-user-clerk-id"] = user.id
        headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
      }

      const response = await fetch(`/api/appointments/${appointmentId}/mileage`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "arrived",
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Log drive end to continuum
        if (appointmentId && user && appointment?.start_drive_timestamp) {
          try {
            const driveStartTime = new Date(appointment.start_drive_timestamp)
            const driveEndTime = new Date()
            const durationMinutes = Math.round((driveEndTime.getTime() - driveStartTime.getTime()) / 60000)
            
            await logDriveEnd({
              appointmentId,
              staffUserId: user.id,
              staffName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
              durationMinutes,
              locationLatitude: location.latitude,
              locationLongitude: location.longitude,
              createdByUserId: user.id,
            })
            console.log("✅ [CONTINUUM] Drive end logged")
            setHistoryRefreshKey(prev => prev + 1)
          } catch (error) {
            console.error("❌ [CONTINUUM] Failed to log drive end:", error)
          }
        }
        
        toast({
          title: "Arrived",
          description: data.mileage
            ? `Arrival location captured. Distance: ${data.mileage.toFixed(2)} miles`
            : "Arrival location captured",
        })
        fetchAppointmentDetails()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to capture arrival location",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error capturing arrival:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to capture location. Please ensure location permissions are enabled.",
        variant: "destructive",
      })
    }
  }

  const handleCalculateMileage = async () => {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (user) {
        headers["x-user-email"] = user.emailAddresses[0]?.emailAddress || ""
        headers["x-user-clerk-id"] = user.id
        headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
      }

      const response = await fetch(`/api/appointments/${appointmentId}/mileage`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "calculate",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Mileage Calculated",
          description: `Driving distance: ${data.mileage.toFixed(2)} miles${data.estimatedTollCost ? `, Estimated tolls: $${data.estimatedTollCost.toFixed(2)}` : ""}`,
        })
        fetchAppointmentDetails()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to calculate mileage",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error calculating mileage:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to calculate mileage",
        variant: "destructive",
      })
    }
  }

  const handleConfirmToll = async () => {
    try {
      const tollValue = parseFloat(tollAmount)
      if (isNaN(tollValue) || tollValue < 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid toll amount (0 or greater)",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tollConfirmed: true,
          actualTollCost: tollValue,
        }),
      })

      if (response.ok) {
        toast({
          title: "Toll Confirmed",
          description: `Toll cost set to $${tollValue.toFixed(2)}`,
        })
        setShowTollDialog(false)
        setTollAmount("")
        fetchAppointmentDetails()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update toll information",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error confirming toll:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to confirm toll",
        variant: "destructive",
      })
    }
  }

  const handleLeaving = async () => {
    try {
      // Check for next appointment
      const response = await fetch(`/api/appointments/${appointmentId}/next-appointment`)
      const data = await response.json()

      if (data.success) {
        setHasNextAppointment(data.hasNext)
        setNextAppointment(data.nextAppointment)
        setShowLeavingDialog(true)
      } else {
        toast({
          title: "Error",
          description: "Failed to check for next appointment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking for next appointment:", error)
      toast({
        title: "Error",
        description: "Failed to check for next appointment",
        variant: "destructive",
      })
    }
  }

  const handleLeavingAction = async (action: "next" | "return") => {
    try {
      setLeavingAction(action)
      setCapturingLocation(true)

      const location = await captureLocation("arrived")
      
      if (action === "next" && nextAppointment) {
        // Update next appointment's start_drive location
        const response = await fetch(`/api/appointments/${nextAppointment.appointmentId}/mileage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user ? {
              "x-user-email": user.emailAddresses[0]?.emailAddress || "",
              "x-user-clerk-id": user.id,
              "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            } : {}),
          },
          body: JSON.stringify({
            action: "start_drive",
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        })

        if (response.ok) {
          toast({
            title: "Travel Started",
            description: `Travel to next visit started. Location captured for ${nextAppointment.title || "next appointment"}.`,
          })
          setShowLeavingDialog(false)
          fetchAppointmentDetails()
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || "Failed to start travel to next visit",
            variant: "destructive",
          })
        }
      } else {
        // Return travel - calculate return mileage for current appointment
        const response = await fetch(`/api/appointments/${appointmentId}/mileage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user ? {
              "x-user-email": user.emailAddresses[0]?.emailAddress || "",
              "x-user-clerk-id": user.id,
              "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            } : {}),
          },
          body: JSON.stringify({
            action: "return",
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          toast({
            title: "Return Travel Logged",
            description: `Return travel completed. Distance: ${result.returnMileage?.toFixed(2) || "0.00"} miles.`,
          })
          setShowLeavingDialog(false)
          fetchAppointmentDetails()
          setHistoryRefreshKey((prev) => prev + 1)
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || "Failed to log return travel",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error handling leaving action:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process leaving action",
        variant: "destructive",
      })
    } finally {
      setCapturingLocation(false)
      setLeavingAction(null)
    }
  }

  const handlePopOut = () => {
    window.open(`/appointment/${appointmentId}`, '_blank')
  }

  // Fetch staff members for recipient selection
  const fetchStaffMembers = async () => {
    try {
      setLoadingStaff(true)
      const response = await fetch("/api/appointments/staff")
      if (response.ok) {
        const data = await response.json()
        
        // API already returns unique staff members with @refugehouse.org domain
        // No need for additional deduplication
        const allStaff = data.staff || []
        setStaffMembers(allStaff)
        
        // If we have a selected recipient, try to populate their phone from the staff list
        if (selectedRecipient?.clerkUserId) {
          const staff = allStaff.find((s: any) => 
            s.id === selectedRecipient.clerkUserId || 
            s.appUserId === selectedRecipient.clerkUserId ||
            (s.email && user?.emailAddresses?.[0]?.emailAddress === s.email)
          )
          if (staff && staff.phone && !recipientPhone) {
            setRecipientPhone(staff.phone)
            setSelectedRecipient({ ...selectedRecipient, phone: staff.phone })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching staff:", error)
    } finally {
      setLoadingStaff(false)
    }
  }

  // Initialize recipient when dialog opens
  useEffect(() => {
    if (showSendLinkDialog && appointment && user) {
      fetchStaffMembers()
      
      // Priority 1: Logged-in user (if they're assigned to this appointment)
      let defaultRecipient: { clerkUserId?: string; name: string; phone: string } | null = null
      
      if (user.id && appointment.assigned_to_user_id) {
        // Check if logged-in user matches assigned user (direct ID match or check via staffMembers if loaded)
        const directMatch = appointment.assigned_to_user_id === user.id
        const guidMatch = staffMembers.length > 0 && 
          staffMembers.some(s => s.id === user.id && (s.appUserId === appointment.assigned_to_user_id))
        
        if (directMatch || guidMatch) {
          defaultRecipient = {
            clerkUserId: user.id,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || appointment.assigned_to_name,
            phone: "",
          }
          console.log(`✅ [SEND-LINK] Defaulting to logged-in user: ${user.id}`)
        }
      }
      
      // Priority 2: Assigned staff member (fallback)
      if (!defaultRecipient) {
        defaultRecipient = {
          clerkUserId: appointment.assigned_to_user_id,
          name: appointment.assigned_to_name,
          phone: "",
        }
      }
      
      setSelectedRecipient(defaultRecipient)
      setRecipientPhone("")
      setErrorData(null)
    }
  }, [showSendLinkDialog, appointment, user])
  
  // Update recipient when staffMembers loads (to check GUID match and populate phone)
  // Use a ref to track if we've already processed this staffMembers array to prevent infinite loops
  const staffProcessedRef = useRef<string>("")
  
  useEffect(() => {
    // Create a unique key for this staffMembers array to track if we've processed it
    const staffKey = staffMembers.map(s => s.id).join(",")
    
    // Skip if we've already processed this exact staffMembers array
    if (staffProcessedRef.current === staffKey) {
      return
    }
    
    if (showSendLinkDialog && user && appointment && staffMembers.length > 0 && selectedRecipient) {
      // Check if logged-in user matches assigned user by GUID
      if (user.id && appointment.assigned_to_user_id && selectedRecipient.clerkUserId === appointment.assigned_to_user_id) {
        const loggedInStaff = staffMembers.find(s => 
          s.id === user.id || s.appUserId === user.id
        )
        const assignedStaff = staffMembers.find(s => 
          s.id === appointment.assigned_to_user_id || s.appUserId === appointment.assigned_to_user_id
        )
        
        // If logged-in user matches assigned user, switch to logged-in user
        if (loggedInStaff && assignedStaff && 
            (loggedInStaff.id === assignedStaff.id || loggedInStaff.appUserId === assignedStaff.appUserId)) {
          // Only update if the values are actually different
          const newPhone = loggedInStaff.phone || ""
          if (selectedRecipient.clerkUserId !== user.id || selectedRecipient.phone !== newPhone) {
            setSelectedRecipient({
              clerkUserId: user.id,
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || appointment.assigned_to_name,
              phone: newPhone,
            })
            if (loggedInStaff.phone) {
              setRecipientPhone(loggedInStaff.phone)
            }
            console.log(`✅ [SEND-LINK] Updated to logged-in user after staff load: ${user.id}`)
          }
          // Mark this staffMembers array as processed
          staffProcessedRef.current = staffKey
        } else if (assignedStaff && assignedStaff.phone && !recipientPhone) {
          // Populate phone for assigned staff
          setRecipientPhone(assignedStaff.phone)
          setSelectedRecipient({ ...selectedRecipient, phone: assignedStaff.phone })
          // Mark this staffMembers array as processed
          staffProcessedRef.current = staffKey
        }
      }
    }
  }, [staffMembers, showSendLinkDialog, user, appointment])
  
  // Reset the processed ref when dialog closes
  useEffect(() => {
    if (!showSendLinkDialog) {
      staffProcessedRef.current = ""
    }
  }, [showSendLinkDialog])

  // Handle recipient selection change
  const handleRecipientChange = (clerkUserId: string) => {
    const staff = staffMembers.find((s) => s.id === clerkUserId)
    if (staff) {
      const newRecipient = {
        clerkUserId: staff.id,
        name: staff.name,
        phone: staff.phone || "",
      }
      setSelectedRecipient(newRecipient)
      setRecipientPhone(staff.phone || "")
      // Clear error when selecting new recipient
      setErrorData(null)
    }
  }

  // Format phone number helper
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 10) {
      if (digits.length === 0) return ""
      if (digits.length <= 3) return `(${digits}`
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
    return `+${digits.slice(0, -10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setRecipientPhone(formatted)
    if (selectedRecipient) {
      setSelectedRecipient({ ...selectedRecipient, phone: formatted })
    }
  }

  // Get phone digits for API
  const getPhoneDigits = (phoneStr: string) => {
    return phoneStr.replace(/\D/g, "")
  }

  const handleSendAppointmentLink = async () => {
    if (!appointmentId) return

    try {
      setSendingLink(true)

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (user) {
        headers["x-user-email"] = user.emailAddresses[0]?.emailAddress || ""
        headers["x-user-clerk-id"] = user.id
        headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
      }

      // Prepare request body with recipient override if provided
      const body: any = {}
      if (selectedRecipient) {
        if (selectedRecipient.clerkUserId) {
          body.recipientClerkUserId = selectedRecipient.clerkUserId
        }
        if (recipientPhone && recipientPhone.trim()) {
          body.recipientPhone = getPhoneDigits(recipientPhone)
        }
        if (selectedRecipient.name) {
          body.recipientName = selectedRecipient.name
        }
      }

      const response = await fetch(`/api/appointments/${appointmentId}/send-link`, {
        method: "POST",
        headers,
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Link Sent",
          description: data.message || `Appointment link sent to ${data.recipientName || selectedRecipient?.name || "staff member"}`,
        })
        setShowSendLinkDialog(false)
        setSelectedRecipient(null)
        setRecipientPhone("")
      } else {
        // Handle "staff member not found" error by showing enhanced dialog
        if (data.error === "Staff member not found in system" || response.status === 404) {
          setErrorData({
            error: data.error,
            recipientName: data.recipientName,
            recipientClerkUserId: data.recipientClerkUserId,
          })
          // Keep dialog open so user can select different recipient
        } else if (data.error === "Phone number not found" || response.status === 400) {
          setErrorData({
            error: data.error,
            recipientName: data.recipientName,
            recipientClerkUserId: data.recipientClerkUserId,
          })
          // Keep dialog open so user can enter phone
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to send appointment link",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error sending appointment link:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send appointment link",
        variant: "destructive",
      })
    } finally {
      setSendingLink(false)
    }
  }

  const handleDeleteAppointment = async () => {
    if (!appointmentId) return

    try {
      setDeleting(true)

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (user) {
        headers["x-user-email"] = user.emailAddresses[0]?.emailAddress || ""
        headers["x-user-clerk-id"] = user.id
        headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
      }

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Appointment Deleted",
          description: data.message || "Appointment and all related documentation have been deleted successfully.",
        })
        // Redirect to appointments list
        router.push("/visits-calendar")
      } else {
        toast({
          title: "Error",
          description: data.message || data.error || "Failed to delete appointment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting appointment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete appointment",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Check if current user is authorized to delete (only jduarte@refugehouse.org)
  const isAuthorizedToDelete = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() === "jduarte@refugehouse.org"

  const fetchFormData = async () => {
    if (formDataLoading) return // Don't fetch if already loading
    
    try {
      setFormDataLoading(true)
      console.log("📋 [FORM] Fetching form data for appointment:", appointmentId)
      console.log("📋 [FORM] Current appointment:", appointment)

      // 1. Get appointment details (we already have this, but need it in the right format)
      // Set appointmentData immediately so form can render
      if (appointment) {
        setAppointmentData({ appointment })
        console.log("📋 [FORM] Set appointmentData:", { appointment })
      }

      // 2. Check for existing visit form
      const existingFormResponse = await fetch(`/api/visit-forms?appointmentId=${appointmentId}`)
      if (existingFormResponse.ok) {
        const existingFormResult = await existingFormResponse.json()
        console.log("📋 [FORM] Existing form response:", existingFormResult)
        if (existingFormResult.visitForms && existingFormResult.visitForms.length > 0) {
          console.log("📋 [FORM] Found existing form:", existingFormResult.visitForms[0])
          setExistingFormData(existingFormResult.visitForms[0])
          // Also update visit form status
          setVisitFormStatus(existingFormResult.visitForms[0].status)
        } else {
          console.log("📋 [FORM] No existing form found")
        }
      } else {
        console.error("❌ [FORM] Failed to fetch existing form:", existingFormResponse.status)
      }

      // 3. Get home GUID and prepopulation data
      const homeXref = appointment?.home_xref
      if (homeXref) {
        try {
          console.log(`🔍 [FORM] Looking up home GUID for xref: ${homeXref}`)
          const homeLookupResponse = await fetch(`/api/homes/lookup?xref=${homeXref}`)
          if (homeLookupResponse.ok) {
            const homeLookupData = await homeLookupResponse.json()
            const homeGuid = homeLookupData.guid
            console.log(`✅ [FORM] Home GUID retrieved: ${homeGuid}`)
            
            if (homeGuid) {
              console.log(`🔍 [FORM] Fetching prepopulation data for home: ${homeGuid}`)
              const prepopResponse = await fetch(`/api/homes/${homeGuid}/prepopulate`)
              if (prepopResponse.ok) {
                const prepopData = await prepopResponse.json()
                console.log(`✅ [FORM] Prepopulation data loaded:`, prepopData)
                setPrepopulationData(prepopData)
              } else {
                const prepopError = await prepopResponse.json().catch(() => ({ error: "Unknown error" }))
                console.error(`❌ [FORM] Failed to fetch prepopulation data:`, prepopResponse.status, prepopError)
              }
            } else {
              console.warn(`⚠️ [FORM] Home GUID is null for xref: ${homeXref}`)
            }
          } else {
            const lookupError = await homeLookupResponse.json().catch(() => ({ error: "Unknown error" }))
            console.error(`❌ [FORM] Failed to lookup home GUID:`, homeLookupResponse.status, lookupError)
          }
        } catch (lookupError) {
          console.error(`❌ [FORM] Error during home lookup/prepopulation:`, lookupError)
        }
      } else {
        console.warn(`⚠️ [FORM] No home_xref found in appointment`)
      }
    } catch (error) {
      console.error("❌ [FORM] Error fetching form data:", error)
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      })
    } finally {
      setFormDataLoading(false)
    }
  }

  const handleSaveForm = async (formData: any, options?: { silent?: boolean }) => {
    const isSilent = options?.silent === true
    try {
      console.log("💾 [APPT] Saving form from appointment detail page:", formData, isSilent ? "(auto-save)" : "(manual save)")

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
        
        // Check for items with data - handle both old format (status) and new format (month1, month2, month3)
        const filledItems = section.items.filter((item: any) => {
          // Old format: has status or notes
          if (item.status || item.notes) return true
          
          // New format: has monthly tracking data
          if (item.month1 || item.month2 || item.month3) {
            // Check if any month has compliant/na set or notes
            const hasData = [item.month1, item.month2, item.month3].some((month: any) => {
              if (!month) return false
              return month.compliant === true || month.na === true || (month.notes && month.notes.trim())
            })
            return hasData
          }
          
          return false
        })
        
        // If no filled items but we have combined notes, still include the section
        if (filledItems.length === 0 && !section.combinedNotes) return null
        
        // For saving, we only save items with data (to reduce payload size)
        // But for the report, we'll include all items
        return {
          items: filledItems,
          combinedNotes: section.combinedNotes || ""
        }
      }

      const filterSpecialSection = (section: any) => {
        if (!section) return null
        
        const hasData = Object.values(section).some(value => {
          if (typeof value === 'string') return value.trim() !== ''
          if (typeof value === 'boolean') return value === true
          if (Array.isArray(value)) return value.length > 0
          if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0
          return false
        })
        
        return hasData ? section : null
      }

      // Build compliance review
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
        visitDate: formData.visitInfo?.date || new Date().toISOString().split("T")[0],
        visitTime: formData.visitInfo?.time || new Date().toTimeString().slice(0, 5),
        visitNumber: formData.visitInfo?.visitNumberThisQuarter || 1,
        quarter: formData.visitInfo?.quarter || "",
        visitVariant: 1,
        
        visitInfo: formData.visitInfo,
        familyInfo: {
          fosterHome: formData.fosterHome,
          household: formData.household,
        },
        attendees: {
          attendance: formData.attendance,
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
        
        createdByUserId: appointmentData?.appointment?.assigned_to_user_id || "system",
        createdByName: appointmentData?.appointment?.assigned_to_name || "System",
        isAutoSave: false,
      }

      console.log("📤 [APPT] Sending save request...")
      
      const response = await fetch("/api/visit-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(savePayload),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("❌ [APPT] Save failed:", result)
        throw new Error(result.error || result.details || "Failed to save form")
      }

      console.log("✅ [APPT] Form saved successfully:", result)
      
      // Update visit form status and existingFormData
      if (result.visitFormId) {
        setVisitFormStatus("draft")
        
        // Update existingFormData with the saved form data so we have visit_form_id for later operations
        // Fetch the full form data to get all fields
        try {
          const formResponse = await fetch(`/api/visit-forms/${result.visitFormId}`)
          if (formResponse.ok) {
            const formData = await formResponse.json()
            if (formData.visitForm) {
              setExistingFormData(formData.visitForm)
              console.log("✅ [APPT] Updated existingFormData with full form data, visit_form_id:", result.visitFormId)
            } else {
              // Fallback if visitForm is missing
              console.warn("⚠️ [APPT] Form response missing visitForm, using fallback")
              setExistingFormData({
                visit_form_id: result.visitFormId,
                status: "draft",
                appointment_id: appointmentId
              })
            }
          } else {
            console.warn(`⚠️ [APPT] Failed to fetch form (status ${formResponse.status}), using fallback`)
            // Fallback: create a minimal existingFormData object with just the visitFormId
            setExistingFormData({
              visit_form_id: result.visitFormId,
              status: "draft",
              appointment_id: appointmentId
            })
          }
        } catch (fetchError) {
          console.warn("⚠️ [APPT] Failed to fetch form data after save (non-blocking):", fetchError)
          // Fallback: create a minimal existingFormData object with just the visitFormId
          setExistingFormData({
            visit_form_id: result.visitFormId,
            status: "draft",
            appointment_id: appointmentId
          })
          console.log("✅ [APPT] Set existingFormData with visit_form_id (fallback):", result.visitFormId)
        }
      }
      
      // Only show toast for manual saves
      if (!isSilent) {
        toast({
          title: "Draft Saved",
          description: "Your form has been saved as a draft",
        })
      }
    } catch (error) {
      console.error("❌ [APPT] Error saving form:", error)
      // Only show error toast for manual saves (auto-save errors are shown in badge)
      if (!isSilent) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save form draft",
          variant: "destructive",
        })
      }
      // Re-throw error so auto-save can handle it
      throw error
    }
  }

  const handleSubmitForm = async (formData: any) => {
    console.log("✅ [APPT] Submitting form from appointment detail page")
    console.log("📋 [APPT] FormData structure:", {
      hasComplianceReview: !!formData.complianceReview,
      complianceReviewKeys: formData.complianceReview ? Object.keys(formData.complianceReview) : [],
      hasSignatures: !!formData.signatures,
      signatureKeys: formData.signatures ? Object.keys(formData.signatures) : [],
      hasObservations: !!formData.observations,
      hasFamilyInfo: !!formData.familyInfo,
      allKeys: Object.keys(formData),
    })
    
    try {
      // 1. Save the form data first
      await handleSaveForm(formData)

      // 2. Build the complete report data structure (same as save payload)
      // Helper to build compliance review (same logic as handleSaveForm)
      const filterComplianceSection = (section: any) => {
        if (!section) return null
        if (!section.items || section.items.length === 0) return null
        
        // Check for items with data - handle both old format (status) and new format (month1, month2, month3)
        const filledItems = section.items.filter((item: any) => {
          // Old format: has status or notes
          if (item.status || item.notes) return true
          
          // New format: has monthly tracking data
          if (item.month1 || item.month2 || item.month3) {
            // Check if any month has compliant/na set or notes
            const hasData = [item.month1, item.month2, item.month3].some((month: any) => {
              if (!month) return false
              return month.compliant === true || month.na === true || (month.notes && month.notes.trim())
            })
            return hasData
          }
          
          return false
        })
        
        // If no filled items but we have combined notes, still include the section with all items
        if (filledItems.length === 0 && !section.combinedNotes) return null
        
        // Return ALL items (not just filled ones) so the report can show "Not answered" for empty ones
        return {
          items: section.items, // Return all items, not just filledItems
          combinedNotes: section.combinedNotes || ""
        }
      }

      const filterSpecialSection = (section: any) => {
        if (!section) return null
        
        const hasData = Object.values(section).some(value => {
          if (typeof value === 'string') return value.trim() !== ''
          if (typeof value === 'boolean') return value === true
          if (Array.isArray(value)) return value.length > 0
          if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0
          return false
        })
        
        return hasData ? section : null
      }

      // Build compliance review (same as handleSaveForm)
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
        vehicles: filterSpecialSection(formData.vehicles),
        swimming: filterSpecialSection(formData.swimming),
        infants: filterComplianceSection(formData.infants),
        qualityEnhancement: filterSpecialSection(formData.qualityEnhancement),
      }

      for (const [key, value] of Object.entries(sections)) {
        if (value !== null) {
          complianceReview[key] = value
        }
      }

      // Convert nested attendance structure to flat structure for report
      const flatAttendance: Record<string, boolean> = {}
      
      // Add foster parents
      if (formData.attendance?.fosterParents) {
        formData.attendance.fosterParents.forEach((fp: any) => {
          if (fp.present === true) {
            flatAttendance[fp.name] = true
          }
        })
      }
      
      // Add staff
      if (formData.attendance?.staff) {
        formData.attendance.staff.forEach((s: any) => {
          if (s.present === true) {
            flatAttendance[s.name] = true
          }
        })
      }
      
      // Add others (biological children, other members, foster children)
      if (formData.attendance?.others) {
        formData.attendance.others.forEach((o: any) => {
          if (o.present === true) {
            flatAttendance[o.name] = true
          }
        })
      }

      // Build complete report data structure
      const reportData = {
        visitInfo: formData.visitInfo,
        familyInfo: {
          fosterHome: formData.fosterHome,
          household: formData.household,
        },
        attendees: {
          attendance: flatAttendance,
        },
        placements: {
          children: formData.placements?.children || [],
        },
        homeEnvironment: {
          homeCondition: formData.homeCondition,
          outdoorSpace: formData.outdoorSpaceCompliance || formData.outdoorSpace,
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
      }

      console.log("📤 [APPT] Report data structure:", {
        hasComplianceReview: !!reportData.complianceReview,
        complianceReviewKeys: reportData.complianceReview ? Object.keys(reportData.complianceReview) : [],
        hasSignatures: !!reportData.signatures,
      })

      // Store the report data and show recipient selection dialog
      setPendingFormData(reportData)
      setShowRecipientDialog(true)
    } catch (error) {
      console.error("❌ [APPT] Error during form submission:", error)
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Failed to submit form",
        variant: "destructive",
      })
    }
  }

  const sendReportToRecipient = async (recipientType: "me" | "case-manager") => {
    if (!pendingFormData) return

    try {
      console.log("📧 [APPT] Sending report to:", recipientType)
      
      // Create headers with user identity for authentication
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      if (user) {
        headers["x-user-email"] = user.emailAddresses[0]?.emailAddress || ""
        headers["x-user-clerk-id"] = user.id
        headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
      }
      
      const reportResponse = await fetch("/api/visit-forms/send-report", {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          appointmentId, 
          formData: pendingFormData,
          recipientType // "me" or "case-manager"
        }),
      })

      const reportResult = await reportResponse.json()

      if (reportResponse.ok) {
        const recipientText = recipientType === "me" ? "you" : "case manager"
        toast({
          title: "Report Sent",
          description: `Report sent to ${recipientText}${reportResult.cc ? ` and CC'd to ${recipientType === "me" ? "case manager" : "you"}` : ""}`,
        })
        
        // Update visit form status to completed
        await handleVisitFormCompleted()
        
        // Close dialog and clear pending data
        setShowRecipientDialog(false)
        setPendingFormData(null)
      } else {
        toast({
          title: "Error Sending Report",
          description: reportResult.error || "Failed to send the report",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ [APPT] Error sending report:", error)
      toast({
        title: "Error Sending Report",
        description: error instanceof Error ? error.message : "Failed to send the report",
        variant: "destructive",
      })
    }
  }

  // Load form data when Visit Form tab is activated
  useEffect(() => {
    if (activeTab === "form" && appointment && !appointmentData) {
      console.log("📋 [FORM] Tab activated, fetching form data...")
      fetchFormData()
    } else if (activeTab === "form" && appointment && appointmentData) {
      console.log("📋 [FORM] Tab activated, form data already loaded")
    }
  }, [activeTab, appointment])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "cancelled":
        return "bg-refuge-magenta/10 text-refuge-magenta dark:bg-refuge-magenta/20 dark:text-refuge-magenta-light"
      case "in_progress":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
      case "rescheduled":
        return "bg-refuge-purple/10 text-refuge-purple dark:bg-refuge-purple/20 dark:text-refuge-purple-light"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-refuge-magenta/10 text-refuge-magenta dark:bg-refuge-magenta/20 dark:text-refuge-magenta-light"
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
    }
  }

  const getVisitFormStatusBadge = () => {
    if (!visitFormStatus) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          No Form
        </Badge>
      )
    }

    switch (visitFormStatus) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Form Complete
          </Badge>
        )
      case "draft":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Draft Saved
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            In Progress
          </Badge>
        )
      default:
        return null
    }
  }

  const parseLocalDatetime = (sqlDatetime: string): Date => {
    const cleaned = sqlDatetime.replace(" ", "T").replace("Z", "")
    const [datePart, timePart] = cleaned.split("T")
    const [year, month, day] = datePart.split("-").map(Number)
    const [hour, minute, second] = timePart.split(":").map(Number)
    return new Date(year, month - 1, day, hour, minute, second || 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-6">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Appointment not found</p>
            <Button onClick={() => router.back()} className="bg-refuge-purple hover:bg-refuge-purple-dark text-white shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Single Unified Header - Replaces AppHeader */}
      <header className="flex h-16 shrink-0 items-center gap-2 bg-card border-b border-border px-4">
        {/* Left: Sidebar Trigger + Navigation */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Link 
            href="/visits-calendar" 
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Appointments</span>
          </Link>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <h1 className="text-base font-semibold truncate text-foreground">
            {appointment.home_name || appointment.title}
          </h1>
        </div>
        
        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mileage Tracking Buttons */}
          {appointment && (appointment.status === "scheduled" || appointment.status === "in_progress") ? (
            <>
              {/* Check both old system (appointment fields) and new system (travel legs) */}
              {!appointment.start_drive_timestamp && !appointment.has_in_progress_leg && !appointment.has_completed_leg ? (
                <Button 
                  size="sm"
                  onClick={handleStartDrive}
                  disabled={capturingLocation}
                  className="h-8 px-3 text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                >
                  <Navigation className="h-4 w-4 mr-1.5" />
                  {capturingLocation ? "Capturing..." : "Start Drive"}
                </Button>
              ) : (appointment.start_drive_timestamp || appointment.has_in_progress_leg) && !appointment.arrived_timestamp && !appointment.has_completed_leg ? (
                <Button 
                  size="sm"
                  onClick={handleArrived}
                  disabled={capturingLocation}
                  className="h-8 px-3 text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
                >
                  <MapPinIcon className="h-4 w-4 mr-1.5" />
                  {capturingLocation ? "Capturing..." : "Arrived"}
                </Button>
              ) : (appointment.arrived_timestamp || appointment.has_completed_leg) && !appointment.return_timestamp && !appointment.has_in_progress_return_leg && (appointment.status === "scheduled" || appointment.status === "in_progress" || appointment.status === "completed") ? (
                <Button 
                  size="sm"
                  onClick={handleLeaving}
                  disabled={capturingLocation}
                  className="h-8 px-3 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Navigation className="h-4 w-4 mr-1.5" />
                  {capturingLocation ? "Capturing..." : "Leaving"}
                </Button>
              ) : appointment.has_in_progress_return_leg && appointment.return_leg_id ? (
                <Button 
                  size="sm"
                  onClick={async () => {
                    try {
                      setCapturingLocation(true)
                      const location = await captureLocation("arrived")
                      
                      const headers: HeadersInit = {
                        "Content-Type": "application/json",
                      }
                      if (user) {
                        headers["x-user-email"] = user.emailAddresses[0]?.emailAddress || ""
                        headers["x-user-clerk-id"] = user.id
                        headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      }
                      
                      const response = await fetch(`/api/travel-legs/${appointment.return_leg_id}`, {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify({
                          end_latitude: location.latitude,
                          end_longitude: location.longitude,
                          end_timestamp: new Date().toISOString(),
                          end_location_name: "Office/Home",
                          end_location_type: "office",
                          is_final_leg: true,
                        }),
                      })
                      
                      if (response.ok) {
                        const responseData = await response.json()
                        toast({
                          title: "Return Complete",
                          description: `Return travel completed successfully. Distance: ${responseData.calculated_mileage?.toFixed(2) || "0.00"} miles.`,
                        })
                        // Refresh appointment details to update button state and mileage tracking
                        await fetchAppointmentDetails()
                        setHistoryRefreshKey((prev) => prev + 1)
                      } else {
                        const errorData = await response.json()
                        toast({
                          title: "Error",
                          description: errorData.error || "Failed to complete return travel",
                          variant: "destructive",
                        })
                      }
                    } catch (error) {
                      console.error("Error completing return travel:", error)
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to complete return travel",
                        variant: "destructive",
                      })
                    } finally {
                      setCapturingLocation(false)
                    }
                  }}
                  disabled={capturingLocation}
                  className="h-8 px-3 text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  {capturingLocation ? "Capturing..." : "Complete Return"}
                </Button>
              ) : null}
            </>
          ) : null}
          {appointment && appointment.status === "scheduled" && appointment.arrived_timestamp && (
            <Button 
              size="sm"
              onClick={handleStartVisit}
              className="h-8 px-3 text-sm font-medium bg-refuge-purple hover:bg-refuge-purple-dark text-white"
            >
              <Play className="h-4 w-4 mr-1.5" />
              Start Visit
            </Button>
          )}
          {appointment && appointment.status === "in_progress" && (
            <Button 
              size="sm"
              onClick={() => {
                toast({
                  title: "Visit In Progress",
                  description: "Use the form to complete the visit",
                })
              }}
              className="h-8 px-3 text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Visit In Progress
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePopOut}
            className="h-8 px-3 text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4 mr-1.5" />
            Pop Out
          </Button>
          {appointment?.assigned_to_user_id && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSendLinkDialog(true)}
              disabled={sendingLink}
              className="h-8 px-3 text-sm font-medium"
            >
              <Send className="h-4 w-4 mr-1.5" />
              {sendingLink ? "Sending..." : "Text Appointment Link"}
            </Button>
          )}
          {isAuthorizedToDelete && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 px-3 text-sm font-medium"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </header>

      {/* ROW 2: Status Badges */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-2">
        <Badge className={getStatusColor(appointment.status)}>
          {appointment.status.replace("_", " ").replace("-", " ")}
        </Badge>
        <Badge className={getPriorityColor(appointment.priority)}>{appointment.priority} priority</Badge>
        {getVisitFormStatusBadge()}
      </div>

      {/* ROW 3: Tab Menu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-card border-b border-border">
          <TabsList className="h-auto bg-transparent w-full justify-start rounded-none border-0 p-0">
            <TabsTrigger 
              value="details" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-refuge-purple data-[state=active]:bg-transparent px-4 py-3 text-foreground data-[state=active]:text-refuge-purple"
            >
              <FileText className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger 
              value="form" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-refuge-purple data-[state=active]:bg-transparent px-4 py-3 text-foreground data-[state=active]:text-refuge-purple"
            >
              <Edit className="h-4 w-4" />
              <span>{appointment?.appointment_type === "staff_training" ? "Training Summary" : "Visit Form"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-refuge-purple data-[state=active]:bg-transparent px-4 py-3 text-foreground data-[state=active]:text-refuge-purple"
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-refuge-purple data-[state=active]:bg-transparent px-4 py-3 text-foreground data-[state=active]:text-refuge-purple"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Notes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="attachments" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-refuge-purple data-[state=active]:bg-transparent px-4 py-3 text-foreground data-[state=active]:text-refuge-purple"
            >
              <Paperclip className="h-4 w-4" />
              <span>Files</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-0">
            <div className="container mx-auto p-6 max-w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Appointment Details</h2>
              <CreateAppointmentDialog
                editingAppointment={appointment ? {
                  appointment_id: appointment.appointment_id,
                  title: appointment.title,
                  start_datetime: appointment.start_datetime,
                  end_datetime: appointment.end_datetime,
                  status: appointment.status,
                  appointment_type: appointment.appointment_type,
                  home_name: appointment.home_name,
                  home_xref: typeof appointment.home_xref === 'number' ? appointment.home_xref : (appointment.home_xref ? Number.parseInt(String(appointment.home_xref)) : undefined),
                  location_address: appointment.location_address,
                  assigned_to_name: appointment.assigned_to_name,
                  assigned_to_role: appointment.assigned_to_role,
                  assigned_to_user_id: appointment.assigned_to_user_id,
                  priority: appointment.priority,
                  description: appointment.description,
                  preparation_notes: appointment.preparation_notes,
                } : null}
                onAppointmentCreated={() => {
                  fetchAppointmentDetails()
                  setEditDialogOpen(false)
                }}
              >
                <Button variant="outline" size="sm" className="h-8 px-3">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CreateAppointmentDialog>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Details */}
              <div className="lg:col-span-2 space-y-6">
          {/* Date & Time */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Start</p>
                <p className="text-lg font-medium">
                  {format(parseLocalDatetime(appointment.start_datetime), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-muted-foreground">
                  {format(parseLocalDatetime(appointment.start_datetime), "h:mm a")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End</p>
                <p className="text-lg font-medium">
                  {format(parseLocalDatetime(appointment.end_datetime), "h:mm a")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-medium">
                  {Math.round(
                    (parseLocalDatetime(appointment.end_datetime).getTime() -
                      parseLocalDatetime(appointment.start_datetime).getTime()) /
                      (1000 * 60)
                  )}{" "}
                  minutes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointment.home_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Foster Home</p>
                  <p className="text-xl font-semibold text-refuge-purple dark:text-refuge-purple-light">{appointment.home_name}</p>
                  {appointment.home_xref && (
                    <p className="text-xs text-muted-foreground">Home ID: {appointment.home_xref}</p>
                  )}
                </div>
              )}
              {appointment.location_address && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="text-lg">{appointment.location_address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mileage Tracking */}
          {appointment && (appointment.start_drive_timestamp || appointment.arrived_timestamp || appointment.has_in_progress_leg || appointment.has_completed_leg || (appointment.calculated_mileage !== null && appointment.calculated_mileage !== undefined)) && (
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Mileage Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(appointment.calculated_mileage !== null && appointment.calculated_mileage !== undefined) && (
                  <div className="pb-3 border-b">
                    <p className="text-sm text-muted-foreground mb-1">Driving Distance</p>
                    <p className="text-3xl font-bold text-refuge-purple">
                      {typeof appointment.calculated_mileage === 'number' ? appointment.calculated_mileage.toFixed(2) : '0.00'} miles
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Calculated using actual road travel</p>
                    
                    {/* Toll Information */}
                    {(appointment.estimated_toll_cost !== null && appointment.estimated_toll_cost !== undefined && appointment.estimated_toll_cost > 0) && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-muted-foreground">Estimated Toll Cost</p>
                          {!appointment.toll_confirmed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTollAmount(appointment.estimated_toll_cost?.toFixed(2) || "")
                                setShowTollDialog(true)
                              }}
                            >
                              Confirm/Edit
                            </Button>
                          )}
                        </div>
                        {appointment.toll_confirmed && appointment.actual_toll_cost !== null && appointment.actual_toll_cost !== undefined ? (
                          <>
                            <p className="text-xl font-bold text-blue-600">
                              ${appointment.actual_toll_cost.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Confirmed toll cost
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-xs"
                              onClick={() => {
                                setTollAmount(appointment.actual_toll_cost?.toFixed(2) || "")
                                setShowTollDialog(true)
                              }}
                            >
                              Edit
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-semibold text-orange-600">
                              ${appointment.estimated_toll_cost.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Estimated (not confirmed)
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Reimbursement Calculator */}
                    {((typeof appointment.calculated_mileage === 'number' && appointment.calculated_mileage > 0) || 
                      (typeof appointment.return_mileage === 'number' && appointment.return_mileage > 0)) && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground mb-1">Reimbursement</p>
                        {(() => {
                          const outboundMileage = appointment.calculated_mileage || 0
                          const returnMileage = appointment.return_mileage || 0
                          const totalMileage = outboundMileage + returnMileage
                          const tollCost = (appointment.toll_confirmed && appointment.actual_toll_cost !== null && appointment.actual_toll_cost !== undefined) 
                            ? appointment.actual_toll_cost 
                            : (appointment.estimated_toll_cost || 0)
                          const totalReimbursement = (totalMileage * mileageRate) + tollCost
                          
                          return (
                            <>
                              <p className="text-2xl font-bold text-green-600">
                                ${totalReimbursement.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {mileageRate.toFixed(2)} per mile × {totalMileage.toFixed(2)} miles
                                {outboundMileage > 0 && returnMileage > 0 && (
                                  <span className="ml-1">
                                    ({outboundMileage.toFixed(2)} outbound + {returnMileage.toFixed(2)} return)
                                  </span>
                                )}
                                {tollCost > 0 && (
                                  <span className="ml-2">
                                    + ${tollCost.toFixed(2)} tolls
                                  </span>
                                )}
                              </p>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}
                {appointment.arrived_timestamp && (appointment.calculated_mileage === null || appointment.calculated_mileage === undefined) && (
                  <div className="pb-3 border-b">
                    <p className="text-sm text-muted-foreground mb-1">Driving Distance</p>
                    <p className="text-3xl font-bold text-refuge-purple">
                      0.00 miles
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Same start and end location</p>
                  </div>
                )}
                {appointment.start_drive_timestamp && (
                  <div>
                    <p className="text-sm text-muted-foreground">Drive Started</p>
                    <p className="text-sm">
                      {format(new Date(appointment.start_drive_timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {appointment.start_drive_latitude && appointment.start_drive_longitude && (
                      <p className="text-xs text-muted-foreground">
                        {appointment.start_drive_latitude.toFixed(6)}, {appointment.start_drive_longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                )}
                {appointment.arrived_timestamp && (
                  <div>
                    <p className="text-sm text-muted-foreground">Arrived</p>
                    <p className="text-sm">
                      {format(new Date(appointment.arrived_timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {appointment.arrived_latitude && appointment.arrived_longitude && (
                      <p className="text-xs text-muted-foreground">
                        {appointment.arrived_latitude.toFixed(6)}, {appointment.arrived_longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                )}
                {appointment.return_timestamp && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Return Travel</p>
                    {appointment.return_start_timestamp && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground">Started</p>
                        <p className="text-sm">
                          {format(new Date(appointment.return_start_timestamp), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        {appointment.return_start_latitude && appointment.return_start_longitude && (
                          <p className="text-xs text-muted-foreground">
                            {appointment.return_start_latitude.toFixed(6)}, {appointment.return_start_longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-sm">
                        {format(new Date(appointment.return_timestamp), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      {appointment.return_latitude && appointment.return_longitude && (
                        <p className="text-xs text-muted-foreground">
                          {appointment.return_latitude.toFixed(6)}, {appointment.return_longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                    {appointment.return_mileage !== null && appointment.return_mileage !== undefined && (
                      <p className="text-lg font-semibold text-purple-600 mt-2">
                        {appointment.return_mileage.toFixed(2)} miles
                      </p>
                    )}
                  </div>
                )}
                {/* Temporary Calculate Button for Testing */}
                {appointment.start_drive_timestamp && appointment.arrived_timestamp && (
                  <div className="pt-3 border-t">
                    <Button
                      onClick={handleCalculateMileage}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Calculate Mileage (Test)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {appointment.description && (
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{appointment.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Preparation Notes */}
          {appointment.preparation_notes && (
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle>Preparation Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{appointment.preparation_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Completion Notes */}
          {appointment.completion_notes && (
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle>Completion Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{appointment.completion_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned To */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assigned To
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">{appointment.assigned_to_name}</p>
              <p className="text-muted-foreground">{appointment.assigned_to_role}</p>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{appointment.appointment_type}</p>
              </div>
              {appointment.created_by_name && (
                <div>
                  <p className="text-muted-foreground">Created By</p>
                  <p className="font-medium">{appointment.created_by_name}</p>
                </div>
              )}
              {appointment.created_at && (
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(appointment.created_at), "MMM d, yyyy h:mm a")}</p>
                </div>
              )}
              {appointment.updated_at && (
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{format(new Date(appointment.updated_at), "MMM d, yyyy h:mm a")}</p>
                </div>
              )}
            </CardContent>
          </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Visit Form / Training Summary Tab */}
        <TabsContent value="form" className="mt-0 p-0">
          {appointment?.appointment_type === "staff_training" ? (
            // Staff Training Summary
            loadingTrainingSummary ? (
              <Card className="rounded-xl shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-refuge-purple mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading training summary...</p>
                </CardContent>
              </Card>
            ) : appointment ? (
              <StaffTrainingSummary
                appointmentId={appointmentId}
                appointmentType={appointment.appointment_type}
                initialSummary={trainingSummary}
                onSave={() => {
                  fetchTrainingSummary()
                  fetchAppointmentDetails()
                }}
              />
            ) : (
              <Card className="rounded-xl shadow-sm">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground">Appointment not loaded</p>
                </CardContent>
              </Card>
            )
          ) : (
            // Regular Visit Form
            formDataLoading ? (
              <Card className="rounded-xl shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-refuge-purple mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading visit form...</p>
                </CardContent>
              </Card>
            ) : appointmentData && appointment ? (
              <EnhancedHomeVisitForm
                appointmentId={appointmentId}
                appointmentData={appointmentData}
                prepopulationData={prepopulationData}
                existingFormData={existingFormData}
                onSave={handleSaveForm}
                onSubmit={handleSubmitForm}
                onCompleteVisit={handleVisitFormCompleted}
              />
            ) : appointment ? (
              <Card className="rounded-xl shadow-sm">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground mb-4">Loading form data...</p>
                  <Button onClick={fetchFormData} variant="outline">
                    Load Visit Form
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-xl shadow-sm">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground">Appointment not loaded</p>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0">
          <VisitHistoryTab key={`${appointmentId}-${historyRefreshKey}`} appointmentId={appointmentId} />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-0">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notes & Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Internal notes and team comments will appear here.</p>
                <p className="text-sm mt-2">Feature coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="mt-0">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments & Files
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!existingFormData?.visit_form_id ? (
                <div className="text-center text-muted-foreground py-8">
                  <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>No visit form found for this appointment.</p>
                  <p className="text-sm mt-2">Create a visit form to upload files.</p>
                </div>
              ) : loadingAttachments ? (
                <div className="text-center py-8 text-muted-foreground">Loading files...</div>
              ) : attachments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>No files uploaded yet.</p>
                  <p className="text-sm mt-2">Files uploaded in the visit form will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map((attachment) => {
                    const FileIcon = getFileIcon(attachment.mime_type)
                    return (
                      <div
                        key={attachment.attachment_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {attachment.file_data && attachment.mime_type?.startsWith("image/") ? (
                            <img
                              src={attachment.file_data}
                              alt={attachment.description || attachment.file_name}
                              className="w-16 h-16 object-cover rounded border flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                if (attachment.file_data) {
                                  // Create a new window with the image data URL
                                  const newWindow = window.open()
                                  if (newWindow) {
                                    newWindow.document.write(`<img src="${attachment.file_data}" style="max-width: 100%; height: auto;" />`)
                                  } else {
                                    // Fallback: try direct open
                                    window.open(attachment.file_data, "_blank")
                                  }
                                }
                              }}
                              onError={(e) => {
                                console.error("Image load error:", e)
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center flex-shrink-0">
                              <FileIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{attachment.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.file_size || 0)} • {new Date(attachment.created_at).toLocaleDateString()}
                            </p>
                            {attachment.description && (
                              <p className="text-xs text-muted-foreground mt-1">{attachment.description}</p>
                            )}
                            {attachment.attachment_type && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {attachment.attachment_type.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {attachment.file_data && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attachment.file_data, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAttachment(attachment.attachment_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recipient Selection Dialog */}
      <Dialog open={showRecipientDialog} onOpenChange={setShowRecipientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Report Recipient</DialogTitle>
            <DialogDescription>
              Select who should receive the visit report email. This helps prevent spamming the case manager during testing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              onClick={() => sendReportToRecipient("me")}
            >
              <div className="flex flex-col items-start">
                <span className="font-semibold">Send to me only</span>
                <span className="text-sm text-muted-foreground mt-1">
                  Send the report to your email address only
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              onClick={() => sendReportToRecipient("case-manager")}
            >
              <div className="flex flex-col items-start">
                <span className="font-semibold">Send to case manager</span>
                <span className="text-sm text-muted-foreground mt-1">
                  Send to the assigned case manager (you will be CC'd)
                </span>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowRecipientDialog(false)
              setPendingFormData(null)
            }}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Link Confirmation Dialog - Enhanced */}
      <Dialog open={showSendLinkDialog} onOpenChange={(open) => {
        setShowSendLinkDialog(open)
        if (!open) {
          setErrorData(null)
          setSelectedRecipient(null)
          setRecipientPhone("")
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Appointment Link</DialogTitle>
            <DialogDescription>
              Send a text message with the appointment link. The link will open the mobile-optimized appointment view where they can access directions, start drive tracking, and other quick actions.
            </DialogDescription>
          </DialogHeader>
          
          {errorData && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">{errorData.error}</p>
              {errorData.recipientName && (
                <p className="text-xs text-red-600 mt-1">Recipient: {errorData.recipientName}</p>
              )}
            </div>
          )}

          <div className="space-y-4 py-4">
            {/* Recipient Selection */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              {loadingStaff ? (
                <div className="text-sm text-muted-foreground">Loading staff members...</div>
              ) : (
                <Select
                  value={selectedRecipient?.clerkUserId || ""}
                  onValueChange={handleRecipientChange}
                  disabled={sendingLink}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient">
                      {selectedRecipient?.name || appointment?.assigned_to_name || "Select recipient"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} {staff.phone ? `(${staff.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number {!recipientPhone && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={recipientPhone}
                onChange={handlePhoneChange}
                disabled={sendingLink}
                className={errorData && !recipientPhone ? "border-red-500" : ""}
              />
              {selectedRecipient && selectedRecipient.phone && recipientPhone !== selectedRecipient.phone && (
                <p className="text-xs text-muted-foreground">
                  Phone number from database: {selectedRecipient.phone}
                </p>
              )}
              {errorData?.error === "Phone number not found" && (
                <p className="text-xs text-red-600">
                  Please enter a phone number for this recipient.
                </p>
              )}
            </div>

            {/* Confirmation Preview */}
            {selectedRecipient && recipientPhone && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-900">Confirmation</p>
                <p className="text-xs text-blue-700 mt-1">
                  <strong>Recipient:</strong> {selectedRecipient.name}
                </p>
                <p className="text-xs text-blue-700">
                  <strong>Phone:</strong> {recipientPhone}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSendLinkDialog(false)
                setErrorData(null)
                setSelectedRecipient(null)
                setRecipientPhone("")
              }} 
              disabled={sendingLink}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendAppointmentLink} 
              disabled={sendingLink || !recipientPhone || recipientPhone.trim() === ""}
              className="bg-refuge-purple hover:bg-refuge-purple-dark text-white"
            >
              {sendingLink ? "Sending..." : "Send Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Missing Dialog */}
      <Dialog open={showPhoneMissingDialog} onOpenChange={setShowPhoneMissingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phone Number Not Found</DialogTitle>
            <DialogDescription>
              {phoneMissingMessage || "No phone number on file for this staff member."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhoneMissingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this appointment? This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The appointment record</li>
                <li>All associated visit forms</li>
                <li>All related documentation</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAppointment}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toll Confirmation Dialog */}
      <Dialog open={showTollDialog} onOpenChange={setShowTollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Toll Cost</DialogTitle>
            <DialogDescription>
              {appointment?.estimated_toll_cost ? (
                <>
                  The estimated toll cost for this route is <strong>${appointment.estimated_toll_cost.toFixed(2)}</strong>.
                  <p className="mt-2">Please confirm the actual toll amount you paid, or enter 0 if you did not use toll roads.</p>
                </>
              ) : (
                "Enter the toll cost for this appointment, or 0 if no tolls were used."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="toll-amount">Toll Cost ($)</Label>
              <Input
                id="toll-amount"
                type="number"
                step="0.01"
                min="0"
                value={tollAmount}
                onChange={(e) => setTollAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTollDialog(false)
                setTollAmount("")
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmToll}
            >
              Confirm Toll Cost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


