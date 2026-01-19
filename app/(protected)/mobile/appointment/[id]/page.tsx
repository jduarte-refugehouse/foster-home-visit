"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser, useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Phone,
  Navigation,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@refugehouse/shared-core/components/ui/dialog"
import { format, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useDeviceType } from "@/hooks/use-device-type"

interface Appointment {
  appointment_id: string
  title: string
  start_datetime: string
  end_datetime: string
  status: "scheduled" | "completed" | "cancelled" | "in-progress" | "rescheduled"
  home_name: string
  location_address: string
  assigned_to_name: string
  priority: string
  description?: string
  // Mileage tracking fields
  start_drive_latitude?: number
  start_drive_longitude?: number
  start_drive_timestamp?: string
  arrived_latitude?: number
  arrived_longitude?: number
  arrived_timestamp?: string
  calculated_mileage?: number
  // Return travel tracking fields
  return_latitude?: number
  return_longitude?: number
  return_timestamp?: string
  return_mileage?: number | null
  // Travel leg tracking fields
  has_in_progress_leg?: boolean
  has_completed_leg?: boolean
  has_in_progress_return_leg?: boolean
  return_leg_id?: string | null
}

export default function MobileAppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoaded } = useUser()
  const { userId: authUserId, getToken } = useAuth()
  const { isMobile } = useDeviceType()
  const appointmentId = params.id as string

  // Store user info in refs so they're always available, even in dialogs
  const userRef = useRef<{ id: string | null; email: string | null; name: string | null }>({ id: null, email: null, name: null })

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [capturingLocation, setCapturingLocation] = useState(false)
  const [showLeavingDialog, setShowLeavingDialog] = useState(false)
  const [nextAppointment, setNextAppointment] = useState<{ appointmentId: string; title: string; startDateTime: string; locationAddress?: string; homeName?: string } | null>(null)
  const [hasNextAppointment, setHasNextAppointment] = useState<boolean>(false)
  const [leavingAction, setLeavingAction] = useState<"next" | "return" | null>(null)
  const [sendingLink, setSendingLink] = useState(false)
  const [showSendLinkDialog, setShowSendLinkDialog] = useState(false)
  // Travel leg tracking state
  const [currentLegId, setCurrentLegId] = useState<string | null>(null)
  const [journeyId, setJourneyId] = useState<string | null>(null)

  // SECURE: Get user ID from session cookie via API (server-side, secure)
  // This is the ONLY use of Clerk APIs after authentication - just to get the user ID
  // After this, we store it and never use Clerk APIs again
  useEffect(() => {
    const fetchSessionUser = async () => {
      // Check sessionStorage first (persists across page refreshes within same session)
      const storedUser = sessionStorage.getItem("session_user")
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          if (parsed.clerkUserId) {
            userRef.current = {
              id: parsed.clerkUserId,
              email: parsed.email || null,
              name: parsed.name || null,
            }
            console.log("✅ [Mobile Appointment] User loaded from sessionStorage:", userRef.current)
            return
          }
        } catch (e) {
          // Invalid stored data, fetch fresh
        }
      }

      // Check if auth already failed (prevent infinite retries)
      const authFailed = sessionStorage.getItem("auth_failed")
      if (authFailed === "true") {
        console.warn("⚠️ [Mobile Appointment] Auth failed - stopping retries")
        return
      }

      // Fetch from API (reads from Clerk session cookie server-side)
      try {
        const response = await fetch("/api/auth/get-session-user", {
          method: "GET",
          credentials: 'include', // Ensure session cookies are sent
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.clerkUserId) {
            userRef.current = {
              id: data.clerkUserId,
              email: data.email || null,
              name: data.name || null,
            }
            // Store in sessionStorage for future use (cleared on browser close)
            sessionStorage.setItem("session_user", JSON.stringify({
              clerkUserId: data.clerkUserId,
              email: data.email,
              name: data.name,
            }))
            // Clear auth failed flag if we successfully authenticated
            sessionStorage.removeItem("auth_failed")
            console.log("✅ [Mobile Appointment] User loaded from session API:", userRef.current)
          }
        } else if (response.status === 401) {
          // Authentication failed - stop retrying
          console.warn("⚠️ [Mobile Appointment] Not authenticated - stopping retries")
          sessionStorage.setItem("auth_failed", "true")
        } else {
          console.error("❌ [Mobile Appointment] Failed to get session user:", response.status)
        }
      } catch (error) {
        console.error("❌ [Mobile Appointment] Error fetching session user:", error)
      }
    }

    // Fetch user ID from session (only once, on mount)
    fetchSessionUser()
  }, []) // Empty deps - only run once on mount

  // Debug logging
  useEffect(() => {
    console.log("Mobile Appointment Page - Auth State:", { 
      isLoaded, 
      hasUser: !!user, 
      userId: user?.id,
      userRefId: userRef.current.id,
      sessionStorageUser: sessionStorage.getItem("session_user") ? "present" : "missing"
    })
  }, [isLoaded, user])

  useEffect(() => {
    // Optional: Redirect to regular appointment page if not mobile
    // Commented out to allow testing on desktop browsers
    // Uncomment if you want to force mobile-only access
    // if (!isMobile) {
    //   router.replace(`/appointment/${appointmentId}`)
    //   return
    // }
    if (appointmentId) {
      // Fetch appointment details immediately (doesn't require user ID)
      fetchAppointmentDetails()
      fetchNextAppointment()
      // Note: fetchCurrentTravelLeg is called in a separate useEffect below
    }
  }, [appointmentId, isMobile, router])
  
  // Fetch travel leg when appointment is available
  // Don't wait for user to be loaded - API will use session cookies
  useEffect(() => {
    if (appointmentId) {
      fetchCurrentTravelLeg()
    }
  }, [appointmentId])
  
  // Sync currentLegId from appointment data when it's loaded
  useEffect(() => {
    if (appointment?.return_leg_id && !currentLegId) {
      setCurrentLegId(appointment.return_leg_id)
    }
  }, [appointment?.return_leg_id, currentLegId])

  // Fetch current in-progress travel leg for this appointment
  const fetchCurrentTravelLeg = async () => {
    if (!appointmentId) return

    try {
      // Set Clerk auth headers if available, but API will fall back to session cookies
      const headers: HeadersInit = {}
      
      // Use ref first (most reliable), then fall back to user object
      const userId = userRef.current.id || user?.id
      const userEmail = userRef.current.email || user?.emailAddresses?.[0]?.emailAddress
      const userName = userRef.current.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      
      if (userId) {
        headers["x-user-clerk-id"] = userId
        if (userEmail) {
          headers["x-user-email"] = userEmail
        }
        if (userName) {
          headers["x-user-name"] = userName
        }
      }

      // API will filter by authenticated user automatically, or use appointment context
      // Include credentials to ensure Clerk cookies are sent (critical for mobile)
      // Also pass appointmentId so API can use appointment context if user ID not available
      const response = await fetch(`/api/travel-legs?status=in_progress&appointmentId=${appointmentId}`, {
        headers,
        credentials: 'include',
      })
      const data = await response.json()
      
      console.log("🔍 [fetchCurrentTravelLeg] Response:", {
        success: data.success,
        legsCount: data.legs?.length || 0,
        legs: data.legs
      })

      if (data.success && data.legs && data.legs.length > 0) {
        // Prioritize return legs (FROM appointment) over incoming legs (TO appointment)
        // First, try to find a leg going FROM this appointment (return leg)
        let relevantLeg = data.legs.find(
          (leg: any) => leg.appointment_id_from === appointmentId
        )
        
        // If no return leg found, look for leg going TO this appointment (incoming leg)
        if (!relevantLeg) {
          relevantLeg = data.legs.find(
            (leg: any) => leg.appointment_id_to === appointmentId && leg.leg_status === 'in_progress'
          )
        }

        if (relevantLeg) {
          console.log("✅ [fetchCurrentTravelLeg] Found relevant leg:", {
            leg_id: relevantLeg.leg_id,
            journey_id: relevantLeg.journey_id,
            status: relevantLeg.leg_status,
            appointment_id_to: relevantLeg.appointment_id_to,
            appointment_id_from: relevantLeg.appointment_id_from
          })
          // Only update if we found a leg - don't clear currentLegId if no leg found
          setCurrentLegId(relevantLeg.leg_id)
          setJourneyId(relevantLeg.journey_id)
        } else {
          console.log("ℹ️ [fetchCurrentTravelLeg] No relevant leg found for appointment:", appointmentId)
          // Don't clear currentLegId - it might have been set by a recent action
        }
      } else {
        console.log("ℹ️ [fetchCurrentTravelLeg] No in-progress legs found")
      }
    } catch (error) {
      console.error("Error fetching current travel leg:", error)
      // Silently fail - this is not critical
    }
  }

  const fetchNextAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/next-appointment`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHasNextAppointment(data.hasNext)
          setNextAppointment(data.nextAppointment)
        }
      }
    } catch (error) {
      console.error("Error fetching next appointment:", error)
      // Silently fail - we'll just not show the "Drive to Next Visit" button
      setHasNextAppointment(false)
      setNextAppointment(null)
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

  const parseLocalDatetime = (sqlDatetime: string | null | undefined): Date | null => {
    if (!sqlDatetime) return null
    
    try {
      // Handle various datetime formats from SQL Server
      // Format 1: "2025-01-15T17:30:00" (ISO-like)
      // Format 2: "2025-01-15 17:30:00" (SQL Server default)
      // Format 3: "2025-01-15T17:30:00.000Z" (with milliseconds and Z)
      // Format 4: "2025-01-15T17:30:00.000" (with milliseconds, no Z)
      
      let cleaned = sqlDatetime.trim()
      
      // Remove milliseconds if present
      cleaned = cleaned.replace(/\.\d{3,7}/, "")
      
      // Replace space with T for ISO format
      cleaned = cleaned.replace(" ", "T")
      
      // Remove Z if present
      cleaned = cleaned.replace("Z", "")
      
      // Split into date and time parts
      const parts = cleaned.split("T")
      if (parts.length !== 2) {
        console.error("Invalid datetime format:", sqlDatetime)
        return null
      }
      
      const [datePart, timePart] = parts
      
      // Parse date part (YYYY-MM-DD)
      const dateComponents = datePart.split("-")
      if (dateComponents.length !== 3) {
        console.error("Invalid date format:", datePart)
        return null
      }
      const [year, month, day] = dateComponents.map(Number)
      
      // Parse time part (HH:mm:ss or HH:mm)
      const timeComponents = timePart.split(":")
      if (timeComponents.length < 2) {
        console.error("Invalid time format:", timePart)
        return null
      }
      const [hour, minute] = timeComponents.map(Number)
      const second = timeComponents[2] ? Number(timeComponents[2]) : 0
      
      // Validate parsed values
      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
        console.error("Invalid datetime values:", { year, month, day, hour, minute })
        return null
      }
      
      return new Date(year, month - 1, day, hour, minute, second)
    } catch (error) {
      console.error("Error parsing datetime:", sqlDatetime, error)
      return null
    }
  }

  // Helper function to handle API responses and redirect on authentication errors
  const handleApiResponse = async (response: Response, errorContext: string): Promise<any> => {
    if (response.status === 401) {
      // Authentication required - redirect to sign-in
      const currentPath = window.location.pathname + window.location.search
      const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(currentPath)}`
      console.log(`🔐 [${errorContext}] Authentication required, redirecting to sign-in`)
      router.push(signInUrl)
      throw new Error("Authentication required")
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.details || `API error: ${response.status}`)
    }
    
    return response.json()
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

      // Create new travel leg using leg-based system
      // Set Clerk auth headers if available, but API will fall back to session cookies
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      // Use ref first (most reliable), then fall back to user object, then authUserId
      const userId = userRef.current.id || user?.id || authUserId
      const userEmail = userRef.current.email || user?.emailAddresses?.[0]?.emailAddress
      const userName = userRef.current.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      
      // Set headers if available (desktop/tablet), but API will use appointment context on mobile
      if (userId) {
        headers["x-user-clerk-id"] = userId
        if (userEmail) {
          headers["x-user-email"] = userEmail
        }
        if (userName) {
          headers["x-user-name"] = userName
        }
        console.log("✅ [Start Drive] Headers set:", {
          "x-user-clerk-id": headers["x-user-clerk-id"],
          "x-user-email": headers["x-user-email"],
          "x-user-name": headers["x-user-name"],
        })
      } else {
        // No headers available - API will use appointment context to determine user
        // This is normal on mobile where Clerk hooks may not be fully loaded
        console.log("ℹ️ [Start Drive] No user ID in headers - API will use appointment context for authentication")
      }

      const response = await fetch(`/api/travel-legs`, {
        method: "POST",
        headers,
        credentials: 'include', // Ensure Clerk cookies are sent (critical for mobile)
        body: JSON.stringify({
          start_latitude: location.latitude,
          start_longitude: location.longitude,
          start_timestamp: new Date().toISOString(),
          start_location_name: "Office", // Could be dynamic based on user's office location
          start_location_type: "office",
          appointment_id_to: appointmentId, // This leg ends at the current appointment
          travel_purpose: `Travel to ${appointment?.home_name || appointment?.title || "appointment"}`,
          journey_id: journeyId, // Use existing journey or create new one
        }),
      })

      const data = await handleApiResponse(response, "Start Drive")
      
      console.log("🚗 [Start Drive] API Response:", data)

      if (data.success) {
        // Store leg_id and journey_id for completing the leg later
        setCurrentLegId(data.leg_id)
        setJourneyId(data.journey_id)
        
        console.log("✅ [Start Drive] Leg created successfully:", {
          leg_id: data.leg_id,
          journey_id: data.journey_id
        })
        
        toast({
          title: "Drive Started",
          description: "Starting location captured",
        })
        // Refresh appointment details to update UI
        await fetchAppointmentDetails()
        // Also refresh current travel leg to ensure state is in sync
        await fetchCurrentTravelLeg()
      }
    } catch (error) {
      console.error("Error starting drive:", error)
      
      // Provide more specific error messages with better user guidance
      let errorMessage = "Failed to start drive"
      let errorTitle = "Error"
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        
        if (errorMsg.includes("timeout")) {
          errorTitle = "Location Timeout"
          errorMessage = "Location capture timed out. Please move to an area with better GPS signal and try again."
        } else if (errorMsg.includes("permission") || errorMsg.includes("denied")) {
          errorTitle = "Location Permission Required"
          errorMessage = error.message.includes("\n") 
            ? error.message // Use multi-line message from geolocation helper
            : "Location permission denied. Please enable location access in your browser settings and refresh the page."
        } else if (errorMsg.includes("not supported")) {
          errorTitle = "Location Not Supported"
          errorMessage = "Geolocation is not supported by your browser. Please use a different device or browser."
        } else if (errorMsg.includes("https")) {
          errorTitle = "Secure Connection Required"
          errorMessage = "Location services require HTTPS. Please access this page over a secure connection."
        } else {
          errorTitle = "Location Error"
          errorMessage = error.message || "Failed to capture location. Please check that location services are enabled and try again."
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds to give user time to read
      })
    } finally {
      // Ensure state is always reset
      setCapturingLocation(false)
    }
  }

  const handleArrived = async () => {
    try {
      const location = await captureLocation("arrived")

      if (!currentLegId) {
        // If no current leg, we might need to create one or use the old system as fallback
        console.warn("No current leg ID found, falling back to appointment-based tracking")
        // Fallback to old system for backward compatibility
        const response = await fetch(`/api/appointments/${appointmentId}/mileage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "arrived",
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        })
        const data = await response.json()
        if (response.ok) {
          toast({
            title: "Arrived",
            description: data.mileage
              ? `Arrival location captured. Distance: ${data.mileage.toFixed(2)} miles`
              : "Arrival location captured",
          })
          fetchAppointmentDetails()
          return
        } else {
          throw new Error(data.error || data.details || "Failed to record arrival")
        }
      }

      // Set Clerk auth headers - use ref to ensure we always have the latest user info
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      // Use ref first (most reliable), then fall back to user object, then authUserId
      const userId = userRef.current.id || user?.id || authUserId
      const userEmail = userRef.current.email || user?.emailAddresses?.[0]?.emailAddress
      const userName = userRef.current.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      
      console.log("🚗 [handleArrived] User ID sources:", {
        refId: userRef.current.id,
        userObjectId: user?.id,
        authUserId: authUserId,
        finalUserId: userId,
      })
      
      // Set headers if available (desktop/tablet), but API will use appointment context on mobile
      if (userId) {
        headers["x-user-clerk-id"] = userId
        if (userEmail) {
          headers["x-user-email"] = userEmail
        }
        if (userName) {
          headers["x-user-name"] = userName
        }
        console.log("✅ [handleArrived] Headers set:", {
          "x-user-clerk-id": headers["x-user-clerk-id"],
          "x-user-email": headers["x-user-email"],
          "x-user-name": headers["x-user-name"],
        })
      } else {
        // No headers available - API will use leg context to determine user
        console.log("ℹ️ [handleArrived] No user ID in headers - API will use leg context for authentication")
      }

      // Complete the current travel leg
      const response = await fetch(`/api/travel-legs/${currentLegId}`, {
        method: "PATCH",
        headers,
        credentials: 'include', // Ensure Clerk cookies are sent (critical for mobile)
        body: JSON.stringify({
          end_latitude: location.latitude,
          end_longitude: location.longitude,
          end_timestamp: new Date().toISOString(),
          end_location_name: appointment?.home_name || appointment?.title || "Appointment Location",
          end_location_address: appointment?.location_address || null,
          end_location_type: "appointment",
          appointment_id_to: appointmentId,
        }),
      })

      const data = await handleApiResponse(response, "Arrived")

      // Clear current leg since it's now completed
      setCurrentLegId(null)
      
      toast({
        title: "Arrived",
        description: data.calculated_mileage
          ? `Arrival location captured. Distance: ${data.calculated_mileage.toFixed(2)} miles`
          : "Arrival location captured",
      })
      await fetchAppointmentDetails()
      await fetchCurrentTravelLeg()
    } catch (error) {
      console.error("Error recording arrival:", error)
      
      // Provide more specific error messages
      let errorMessage = "Failed to record arrival"
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "Location capture timed out. Please try again."
        } else if (error.message.includes("permission") || error.message.includes("denied")) {
          errorMessage = "Location permission denied. Please enable location access in your browser settings."
        } else if (error.message.includes("not supported")) {
          errorMessage = "Geolocation is not supported by your browser."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      // Ensure state is always reset
      setCapturingLocation(false)
    }
  }

  const handleLeaving = () => {
    // Show dialog for return travel
    setShowLeavingDialog(true)
  }

  const handleDriveToNext = async () => {
    try {
      if (!nextAppointment) {
        toast({
          title: "Error",
          description: "Next appointment information not available",
          variant: "destructive",
        })
        return
      }

      // Don't set capturingLocation here - captureLocation does it internally
      const location = await captureLocation("arrived")

      // Create new travel leg for next appointment (using same journey)
      // Set Clerk auth headers - use ref to ensure we always have the latest user info
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      // Use ref first (most reliable), then fall back to user object, then authUserId
      const userId = userRef.current.id || user?.id || authUserId
      const userEmail = userRef.current.email || user?.emailAddresses?.[0]?.emailAddress
      const userName = userRef.current.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      
      console.log("🚗 [handleDriveToNext] User ID sources:", {
        refId: userRef.current.id,
        userObjectId: user?.id,
        authUserId: authUserId,
        finalUserId: userId,
      })
      
      // Set headers if available (desktop/tablet), but API will use appointment context on mobile
      if (userId) {
        headers["x-user-clerk-id"] = userId
        if (userEmail) {
          headers["x-user-email"] = userEmail
        }
        if (userName) {
          headers["x-user-name"] = userName
        }
        console.log("✅ [handleDriveToNext] Headers set:", {
          "x-user-clerk-id": headers["x-user-clerk-id"],
          "x-user-email": headers["x-user-email"],
          "x-user-name": headers["x-user-name"],
        })
      } else {
        // No headers available - API will use appointment context to determine user
        console.log("ℹ️ [handleDriveToNext] No user ID in headers - API will use appointment context for authentication")
      }

      const response = await fetch(`/api/travel-legs`, {
        method: "POST",
        headers,
        credentials: 'include', // Ensure Clerk cookies are sent (critical for mobile)
        body: JSON.stringify({
          start_latitude: location.latitude,
          start_longitude: location.longitude,
          start_timestamp: new Date().toISOString(),
          start_location_name: appointment?.home_name || appointment?.title || "Current Location",
          start_location_type: "appointment",
          appointment_id_from: appointmentId, // Starting from current appointment
          appointment_id_to: nextAppointment.appointmentId, // Ending at next appointment
          travel_purpose: `Travel to ${nextAppointment.title || nextAppointment.homeName || "next appointment"}`,
          journey_id: journeyId, // Continue same journey
        }),
      })

      const data = await handleApiResponse(response, "Drive To Next")

      // Store new leg_id for completing later
      setCurrentLegId(data.leg_id)
      
      toast({
        title: "Travel Started",
        description: `Travel to next visit started. Location captured for ${nextAppointment.title || "next appointment"}.`,
      })
      fetchAppointmentDetails()
      // Refresh next appointment info
      fetchNextAppointment()
    } catch (error) {
      console.error("Error starting travel to next visit:", error)
      
      // Provide more specific error messages
      let errorMessage = "Failed to start travel to next visit"
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "Location capture timed out. Please try again."
        } else if (error.message.includes("permission") || error.message.includes("denied")) {
          errorMessage = "Location permission denied. Please enable location access in your browser settings."
        } else if (error.message.includes("not supported")) {
          errorMessage = "Geolocation is not supported by your browser."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      // Ensure state is always reset
      setCapturingLocation(false)
    }
  }

  const handleLeavingAction = async (action: "next" | "return") => {
    try {
      setLeavingAction(action)
      // Don't set capturingLocation here - captureLocation does it internally

      const location = await captureLocation("arrived")
      
      // Set Clerk auth headers - simplified approach like original working version
      // Use userRef first (most reliable on mobile), then user object, then authUserId
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      // Try multiple sources for user ID (mobile-friendly)
      const userId = userRef.current.id || user?.id || authUserId
      const userEmail = userRef.current.email || user?.emailAddresses?.[0]?.emailAddress
      const userName = userRef.current.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      
      // Include headers if we have a user ID (don't block if not - API will use session cookies)
      if (userId) {
        headers["x-user-clerk-id"] = userId
        if (userEmail) {
          headers["x-user-email"] = userEmail
        }
        if (userName) {
          headers["x-user-name"] = userName
        }
        console.log("✅ [handleLeavingAction] Sending headers:", { 
          "x-user-clerk-id": headers["x-user-clerk-id"],
          "x-user-email": headers["x-user-email"],
          "x-user-name": headers["x-user-name"]
        })
      } else {
        console.warn("⚠️ [handleLeavingAction] No user ID available, API will use session cookies")
      }
      
      if (action === "next" && nextAppointment) {
        // Create new travel leg for next appointment (using same journey)
        const response = await fetch(`/api/travel-legs`, {
          method: "POST",
          headers,
          credentials: 'include', // Ensure Clerk cookies are sent (critical for mobile)
          body: JSON.stringify({
            start_latitude: location.latitude,
            start_longitude: location.longitude,
            start_timestamp: new Date().toISOString(),
            start_location_name: appointment?.home_name || appointment?.title || "Current Location",
            start_location_type: "appointment",
            appointment_id_from: appointmentId,
            appointment_id_to: nextAppointment.appointmentId,
            travel_purpose: `Travel to ${nextAppointment.title || nextAppointment.homeName || "next appointment"}`,
            journey_id: journeyId, // Continue same journey
          }),
        })

        const data = await handleApiResponse(response, "Leaving - Next")

        // Store new leg_id for completing later
        setCurrentLegId(data.leg_id)
        
        toast({
          title: "Travel Started",
          description: `Travel to next visit started. Location captured for ${nextAppointment.title || "next appointment"}.`,
        })
        setShowLeavingDialog(false)
        fetchAppointmentDetails()
      } else {
        // Return travel - create new leg for return trip
        const response = await fetch(`/api/travel-legs`, {
          method: "POST",
          headers,
          credentials: 'include', // Ensure Clerk cookies are sent (critical for mobile)
          body: JSON.stringify({
            start_latitude: location.latitude,
            start_longitude: location.longitude,
            start_timestamp: new Date().toISOString(),
            start_location_name: appointment?.home_name || appointment?.title || "Current Location",
            start_location_type: "appointment",
            appointment_id_from: appointmentId,
            travel_purpose: "Return to office/home",
            journey_id: journeyId, // Continue same journey
            is_final_leg: true, // This is the final leg of the journey
          }),
        })

        const data = await handleApiResponse(response, "Leaving - Return")

        // Store leg_id for completing when they arrive at home
        setCurrentLegId(data.leg_id)
        
        toast({
          title: "Return Travel Started",
          description: "Return trip tracking started. Click 'Arrived at Home' when you reach your destination.",
        })
        setShowLeavingDialog(false)
        
        // Refresh appointment details and travel leg to ensure state is synced
        await fetchAppointmentDetails()
        await fetchCurrentTravelLeg()
      }
    } catch (error) {
      console.error("Error handling leaving action:", error)
      
      // Provide more specific error messages based on error type
      let errorMessage = "Failed to process leaving action"
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "Location capture timed out. Please try again."
        } else if (error.message.includes("permission") || error.message.includes("denied")) {
          errorMessage = "Location permission denied. Please enable location access in your browser settings."
        } else if (error.message.includes("not supported")) {
          errorMessage = "Geolocation is not supported by your browser."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setCapturingLocation(false)
      setLeavingAction(null)
    }
  }

  const getDirectionsUrl = (address: string) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
  }

  const getPhoneUrl = (phone: string) => {
    return `tel:${phone.replace(/\D/g, "")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading appointment...</p>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-gray-600 dark:text-gray-400">Appointment not found</p>
          <Button 
            onClick={() => router.push("/mobile")} 
            className="mt-4 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" 
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const startTime = parseLocalDatetime(appointment.start_datetime)
  const endTime = parseLocalDatetime(appointment.end_datetime)
  // Check for in-progress travel leg OR legacy appointment timestamp
  // New leg-based system uses currentLegId, old system used appointment.start_drive_timestamp
  const hasStartedDrive = !!currentLegId || !!appointment.start_drive_timestamp || !!appointment.has_in_progress_leg
  const hasArrived = !!appointment.arrived_timestamp || !!appointment.has_completed_leg
  // Return has started if: return_timestamp exists (legacy) OR appointment has return leg flag OR currentLegId exists (set when return leg created)
  const hasReturnStarted = !!appointment.return_timestamp || 
    !!appointment.has_in_progress_return_leg ||
    (!!currentLegId && appointment.return_leg_id === currentLegId)
  const hasReturnCompleted = !!appointment.return_mileage || (!!appointment.return_timestamp && !appointment.has_in_progress_return_leg)
  const visitInProgress = appointment.status === "in-progress"
  const visitCompleted = appointment.status === "completed"
  const showVisitContent = visitInProgress || visitCompleted
  
  // Validate dates before rendering
  if (!startTime || !endTime) {
    console.error("Invalid appointment times:", { 
      start: appointment.start_datetime, 
      end: appointment.end_datetime 
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Compact Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-3 py-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/mobile")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base font-semibold flex-1 text-gray-900 dark:text-gray-100 truncate">Appointment</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Appointment Card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Appointment Title and Home Name - Stacked on 2 rows if both exist */}
                <div className="mb-2">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {appointment.title || appointment.home_name}
                  </CardTitle>
                  {/* Home Name if different from title - on second row */}
                  {appointment.title && appointment.title !== appointment.home_name && appointment.home_name && (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                      {appointment.home_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {startTime && endTime ? (
                      <>
                        {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                      </>
                    ) : (
                      <span className="text-gray-400">Time not available</span>
                    )}
                  </span>
                </div>
              </div>
              <Badge
                variant={
                  appointment.status === "completed"
                    ? "default"
                    : appointment.status === "in-progress"
                      ? "default"
                      : "outline"
                }
                className={
                  appointment.status === "completed"
                    ? "bg-green-500 dark:bg-green-600"
                    : appointment.status === "in-progress"
                      ? "bg-blue-500 dark:bg-blue-600"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                }
              >
                {appointment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointment.description && (
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{appointment.description}</p>
              </div>
            )}

            {appointment.location_address && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{appointment.location_address}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  asChild
                >
                  <a
                    href={getDirectionsUrl(appointment.location_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </a>
                </Button>
              </div>
            )}

            {/* Mileage Tracking - Only show if visit has started or completed */}
            {showVisitContent && appointment.calculated_mileage && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Calculated Mileage: <span className="font-semibold text-gray-900 dark:text-gray-100">{appointment.calculated_mileage.toFixed(1)} miles</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Pre-Visit Phase: Travel to appointment */}
          {!showVisitContent && (
            <>
              {!hasStartedDrive && (
                <Button
                  onClick={handleStartDrive}
                  disabled={capturingLocation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  size="lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {capturingLocation ? "Capturing Location..." : "Start Drive"}
                </Button>
              )}

              {hasStartedDrive && !hasArrived && (
                <Button
                  onClick={handleArrived}
                  disabled={capturingLocation}
                  className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  size="lg"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  {capturingLocation ? "Capturing Location..." : "Mark as Arrived"}
                </Button>
              )}

              {hasArrived && appointment.status === "scheduled" && (
                <div className="w-full p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium mb-1">Start Visit on Tablet/iPad</p>
                      <p className="text-xs">Please use a tablet or larger device to start the visit and access the full visit form.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Visit Phase: During the visit */}
          {visitInProgress && (
            <Button
              onClick={async () => {
                const response = await fetch(`/api/appointments/${appointmentId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "completed" }),
                })
                if (response.ok) {
                  toast({ title: "Visit Ended", description: "Visit marked as completed" })
                  fetchAppointmentDetails()
                  
                  // Automatically prompt to text appointment link for easy access to "Leave" button
                  setShowSendLinkDialog(true)
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              End Visit
            </Button>
          )}

          {/* Post-Visit Phase: Leaving */}
          {/* Show if visit completed or arrived, but NOT if return travel leg exists (currentLegId) */}
          {(visitCompleted || (hasArrived && !currentLegId && (appointment.status === "scheduled" || visitInProgress))) && (
            <>
              {hasNextAppointment && nextAppointment && (
                <Button
                  onClick={async () => {
                    // If visit is still in-progress, mark it as completed first
                    if (visitInProgress) {
                      await fetch(`/api/appointments/${appointmentId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "completed" }),
                      })
                      fetchAppointmentDetails()
                    }
                    handleDriveToNext()
                  }}
                  disabled={capturingLocation}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 whitespace-normal text-left h-auto py-3 px-4"
                  size="lg"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Navigation className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1 break-words">
                      {capturingLocation ? "Capturing Location..." : `Drive to Next Visit${nextAppointment.title ? `: ${nextAppointment.title}` : ""}`}
                    </span>
                  </div>
                </Button>
              )}
              <Button
                onClick={async () => {
                  // If visit is still in-progress, mark it as completed first
                  if (visitInProgress) {
                    await fetch(`/api/appointments/${appointmentId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "completed" }),
                    })
                    fetchAppointmentDetails()
                  }
                  handleLeaving()
                }}
                disabled={capturingLocation}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                size="lg"
              >
                <MapPin className="h-5 w-5 mr-2" />
                {capturingLocation ? "Capturing Location..." : "Return to Office/Home"}
              </Button>
            </>
          )}

          {/* Return Travel In Progress: Show "Complete Return" button */}
          {/* Show if currentLegId exists (return leg was created) and return is not completed */}
          {currentLegId && !hasReturnCompleted && (
            <Button
              onClick={async () => {
                try {
                  setCapturingLocation(true)
                  const location = await captureLocation("arrived")

                  // Set Clerk auth headers - use ref to ensure we always have the latest user info
                  const headers: HeadersInit = {
                    "Content-Type": "application/json",
                  }
                  
                  // Use ref first (most reliable), then fall back to user object
                  const userId = userRef.current.id || user?.id
                  const userEmail = userRef.current.email || user?.emailAddresses?.[0]?.emailAddress
                  const userName = userRef.current.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                  
                  if (userId) {
                    headers["x-user-clerk-id"] = userId
                    if (userEmail) {
                      headers["x-user-email"] = userEmail
                    }
                    if (userName) {
                      headers["x-user-name"] = userName
                    }
                  }

                  // Complete the return travel leg
                  const response = await fetch(`/api/travel-legs/${currentLegId}`, {
                    method: "PATCH",
                    headers,
                    credentials: 'include', // Ensure Clerk cookies are sent (critical for mobile)
                    body: JSON.stringify({
                      end_latitude: location.latitude,
                      end_longitude: location.longitude,
                      end_timestamp: new Date().toISOString(),
                      end_location_name: "Office/Home",
                      end_location_type: "office",
                      is_final_leg: true,
                    }),
                  })

                  const data = await handleApiResponse(response, "Complete Return")

                  // Clear current leg since it's now completed
                  setCurrentLegId(null)
                  
                  toast({
                    title: "Return Complete",
                    description: `Return travel completed successfully. Distance: ${data.calculated_mileage?.toFixed(2) || "0.00"} miles.`,
                  })
                  
                  // Refresh appointment details to update button state and mileage tracking
                  await fetchAppointmentDetails()
                  await fetchCurrentTravelLeg()
                } catch (error) {
                  console.error("Error logging arrival at home:", error)
                  
                  // Provide more specific error messages based on error type
                  let errorMessage = "Failed to log arrival at home"
                  if (error instanceof Error) {
                    if (error.message.includes("timeout")) {
                      errorMessage = "Location capture timed out. Please try again."
                    } else if (error.message.includes("permission") || error.message.includes("denied")) {
                      errorMessage = "Location permission denied. Please enable location access in your browser settings."
                    } else if (error.message.includes("not supported")) {
                      errorMessage = "Geolocation is not supported by your browser."
                    } else {
                      errorMessage = error.message
                    }
                  }
                  
                  toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                  })
                } finally {
                  setCapturingLocation(false)
                }
              }}
              disabled={capturingLocation}
              className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {capturingLocation ? "Capturing..." : "Complete Return"}
            </Button>
          )}

          {/* Link to full form (for iPad/desktop) - Only show during visit */}
          {showVisitContent && (
            <Button
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              asChild
            >
              <a href={`/appointment/${appointmentId}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Full Form (Desktop/iPad)
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Return Travel Dialog */}
      <Dialog open={showLeavingDialog} onOpenChange={setShowLeavingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return to Office/Home</DialogTitle>
            <DialogDescription>
              This is your last visit for today. Would you like to log your return travel to the office/home?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              This will calculate and log your return travel mileage for this visit.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowLeavingDialog(false)
              }}
              disabled={capturingLocation || leavingAction !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleLeavingAction("return")}
              disabled={capturingLocation || leavingAction !== null}
            >
              {leavingAction === "return" ? "Capturing location..." : "Log Return Travel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Appointment Link Dialog */}
      <Dialog open={showSendLinkDialog} onOpenChange={setShowSendLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Text Appointment Link</DialogTitle>
            <DialogDescription>
              Send yourself a text message with a link to this appointment so you can easily access the "Leave" button when you're ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              This will send an SMS to your phone number on file with a quick link to access this appointment.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSendLinkDialog(false)
              }}
              disabled={sendingLink}
            >
              Skip
            </Button>
            <Button
              onClick={async () => {
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

                  const response = await fetch(`/api/appointments/${appointmentId}/send-link`, {
                    method: "POST",
                    headers,
                  })

                  const data = await response.json()

                  if (response.ok) {
                    toast({
                      title: "Link Sent",
                      description: data.message || "Appointment link sent to your phone",
                    })
                    setShowSendLinkDialog(false)
                  } else {
                    if (data.error === "Phone number not found" || response.status === 400) {
                      toast({
                        title: "Phone Number Not Found",
                        description: data.message || "No phone number on file. Please add your phone number to your profile.",
                        variant: "destructive",
                      })
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
              }}
              disabled={sendingLink}
            >
              {sendingLink ? "Sending..." : "Send Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

