"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
}

export default function MobileAppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoaded } = useUser()
  const { isMobile } = useDeviceType()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [capturingLocation, setCapturingLocation] = useState(false)
  const [showLeavingDialog, setShowLeavingDialog] = useState(false)
  const [nextAppointment, setNextAppointment] = useState<{ appointmentId: string; title: string; startDateTime: string; locationAddress?: string; homeName?: string } | null>(null)
  const [hasNextAppointment, setHasNextAppointment] = useState<boolean>(false)
  const [leavingAction, setLeavingAction] = useState<"next" | "return" | null>(null)
  const [sendingLink, setSendingLink] = useState(false)
  const [showSendLinkDialog, setShowSendLinkDialog] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log("Mobile Appointment Page - Auth State:", { isLoaded, hasUser: !!user, userId: user?.id })
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
      fetchAppointmentDetails()
      fetchNextAppointment()
    }
  }, [appointmentId, isMobile, router])

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

  const captureLocation = (action: "start_drive" | "arrived") => {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        setCapturingLocation(false)
        reject(new Error("Geolocation is not supported by your browser"))
        return
      }

      setCapturingLocation(true)
      console.log(`📍 [LOCATION] Starting location capture for: ${action}`)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCapturingLocation(false)
          console.log(`✅ [LOCATION] Location captured:`, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          setCapturingLocation(false)
          console.error(`❌ [LOCATION] Location capture failed:`, {
            code: error.code,
            message: error.message,
            action,
          })
          
          // Provide more descriptive error messages
          let errorMessage = error.message
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access in your browser settings."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please check your device's location settings."
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again."
              break
            default:
              errorMessage = error.message || "Failed to capture location"
          }
          
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout to 15 seconds
          maximumAge: 0,
        },
      )
    })
  }

  const handleStartDrive = async () => {
    try {
      const location = await captureLocation("start_drive")

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      // Add auth headers - user should be available since page is protected
      // Wait a moment for user to be available if not yet loaded
      let currentUser = user
      if (!currentUser && isLoaded) {
        // User should exist but hook might not have it yet - wait briefly
        await new Promise(resolve => setTimeout(resolve, 100))
        // Re-check - but we can't re-call the hook, so just try with what we have
      }
      
      if (currentUser?.id) {
        headers["x-user-email"] = currentUser.emailAddresses[0]?.emailAddress || ""
        headers["x-user-clerk-id"] = currentUser.id
        headers["x-user-name"] = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
      } else {
        // If still no user, the API should still work if cookies are set
        // Clerk cookies should be sent automatically with the request
        console.warn("User object not available, relying on Clerk session cookies")
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
        toast({
          title: "Drive Started",
          description: "Starting location captured",
        })
        fetchAppointmentDetails()
      } else {
        throw new Error(data.error || data.details || "Failed to start drive")
      }
    } catch (error) {
      console.error("Error starting drive:", error)
      
      // Provide more specific error messages
      let errorMessage = "Failed to start drive"
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

  const handleArrived = async () => {
    try {
      const location = await captureLocation("arrived")

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      // Add auth headers - user should be available since page is protected
      let currentUser = user
      if (!currentUser && isLoaded) {
        // User should exist but hook might not have it yet - wait briefly
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      if (currentUser?.id) {
        headers["x-user-email"] = currentUser.emailAddresses[0]?.emailAddress || ""
        headers["x-user-clerk-id"] = currentUser.id
        headers["x-user-name"] = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
      } else {
        // If still no user, the API should still work if cookies are set
        console.warn("User object not available, relying on Clerk session cookies")
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
        toast({
          title: "Arrived",
          description: data.mileage
            ? `Arrival location captured. Distance: ${data.mileage.toFixed(2)} miles`
            : "Arrival location captured",
        })
        fetchAppointmentDetails()
      } else {
        throw new Error(data.error || data.details || "Failed to record arrival")
      }
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
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      let currentUser = user
      if (!currentUser && isLoaded) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      if (currentUser?.id) {
        headers["x-user-email"] = currentUser.emailAddresses[0]?.emailAddress || ""
        headers["x-user-clerk-id"] = currentUser.id
        headers["x-user-name"] = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
      }

      const response = await fetch(`/api/appointments/${nextAppointment.appointmentId}/mileage`, {
        method: "POST",
        headers,
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
        fetchAppointmentDetails()
        // Refresh next appointment info
        fetchNextAppointment()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to start travel to next visit",
          variant: "destructive",
        })
      }
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
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      let currentUser = user
      if (!currentUser && isLoaded) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      if (currentUser?.id) {
        headers["x-user-email"] = currentUser.emailAddresses[0]?.emailAddress || ""
        headers["x-user-clerk-id"] = currentUser.id
        headers["x-user-name"] = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
      }
      
      if (action === "next" && nextAppointment) {
        // Update next appointment's start_drive location
        const response = await fetch(`/api/appointments/${nextAppointment.appointmentId}/mileage`, {
          method: "POST",
          headers,
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
        // Return travel - start return trip (first click starts the timer)
        const response = await fetch(`/api/appointments/${appointmentId}/mileage`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "return",
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.returnStarted) {
            // Return trip started - show success and refresh to show "Arrived at Home" button
            toast({
              title: "Return Travel Started",
              description: "Return trip tracking started. Click 'Arrived at Home' when you reach your destination.",
            })
            setShowLeavingDialog(false)
            fetchAppointmentDetails()
          } else if (result.returnCompleted) {
            // Return trip completed
            toast({
              title: "Return Travel Completed",
              description: `Return travel completed. Distance: ${result.returnMileage?.toFixed(2) || "0.00"} miles.`,
            })
            setShowLeavingDialog(false)
            fetchAppointmentDetails()
          } else {
            // Legacy response format
            toast({
              title: "Return Travel Logged",
              description: `Return travel completed. Distance: ${result.returnMileage?.toFixed(2) || "0.00"} miles.`,
            })
            setShowLeavingDialog(false)
            fetchAppointmentDetails()
          }
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || "Failed to start return travel",
            variant: "destructive",
          })
        }
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
  const hasStartedDrive = !!appointment.start_drive_timestamp
  const hasArrived = !!appointment.arrived_timestamp
  const hasReturnStarted = !!appointment.return_timestamp
  const hasReturnCompleted = !!appointment.return_mileage
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
                  className="w-full bg-refuge-purple hover:bg-refuge-purple-dark text-white disabled:opacity-50"
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
                  className="w-full bg-refuge-purple hover:bg-refuge-purple-dark text-white disabled:opacity-50"
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
          {(visitCompleted || (hasArrived && !hasReturnStarted && (appointment.status === "scheduled" || visitInProgress))) && (
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

          {/* Return Travel In Progress: Show "Arrived at Home" button */}
          {hasReturnStarted && !hasReturnCompleted && (
            <Button
              onClick={async () => {
                try {
                  // Don't set capturingLocation here - captureLocation does it internally
                  const location = await captureLocation("arrived")
                  
                  const headers: HeadersInit = {
                    "Content-Type": "application/json",
                  }
                  
                  let currentUser = user
                  if (!currentUser && isLoaded) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                  }
                  
                  if (currentUser?.id) {
                    headers["x-user-email"] = currentUser.emailAddresses[0]?.emailAddress || ""
                    headers["x-user-clerk-id"] = currentUser.id
                    headers["x-user-name"] = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
                  }

                  const response = await fetch(`/api/appointments/${appointmentId}/mileage`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                      action: "return",
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }),
                  })

                  if (response.ok) {
                    const result = await response.json()
                    toast({
                      title: "Arrived at Home",
                      description: `Return travel completed. Distance: ${result.returnMileage?.toFixed(2) || "0.00"} miles.`,
                    })
                    fetchAppointmentDetails()
                  } else {
                    const errorData = await response.json()
                    toast({
                      title: "Error",
                      description: errorData.error || "Failed to log arrival at home",
                      variant: "destructive",
                    })
                  }
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
              className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {capturingLocation ? "Capturing Location..." : "Arrived at Home"}
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

