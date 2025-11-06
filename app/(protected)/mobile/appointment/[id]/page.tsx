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
}

export default function MobileAppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const { isMobile } = useDeviceType()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [capturingLocation, setCapturingLocation] = useState(false)

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
    }
  }, [appointmentId, isMobile, router])

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

  const parseLocalDatetime = (sqlDatetime: string): Date => {
    const cleaned = sqlDatetime.replace(" ", "T").replace("Z", "")
    const [datePart, timePart] = cleaned.split("T")
    const [year, month, day] = datePart.split("-").map(Number)
    const [hour, minute] = timePart.split(":").map(Number)
    return new Date(year, month - 1, day, hour, minute, 0)
  }

  const captureLocation = (action: "start_drive" | "arrived") => {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"))
        return
      }

      setCapturingLocation(true)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCapturingLocation(false)
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          setCapturingLocation(false)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    })
  }

  const handleStartDrive = async () => {
    try {
      // Check if user is loaded
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please wait for authentication to complete, then try again.",
          variant: "destructive",
        })
        return
      }

      const location = await captureLocation("start_drive")

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "x-user-email": user.emailAddresses[0]?.emailAddress || "",
        "x-user-clerk-id": user.id,
        "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to capture location. Please ensure location permissions are enabled in your browser settings.",
        variant: "destructive",
      })
    }
  }

  const handleArrived = async () => {
    try {
      // Check if user is loaded
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please wait for authentication to complete, then try again.",
          variant: "destructive",
        })
        return
      }

      const location = await captureLocation("arrived")

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "x-user-email": user.emailAddresses[0]?.emailAddress || "",
        "x-user-clerk-id": user.id,
        "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to capture location. Please ensure location permissions are enabled in your browser settings.",
        variant: "destructive",
      })
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
                {/* Appointment Title - Most Important */}
                <CardTitle className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
                  {appointment.title || appointment.home_name}
                </CardTitle>
                {/* Home Name if different from title */}
                {appointment.title && appointment.title !== appointment.home_name && (
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {appointment.home_name}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
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

            {/* Mileage Tracking */}
            {appointment.calculated_mileage && (
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
          {!hasStartedDrive && appointment.status === "scheduled" && (
            <Button
              onClick={handleStartDrive}
              disabled={capturingLocation}
              className="w-full bg-refuge-purple hover:bg-refuge-purple-dark text-white"
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
              className="w-full bg-refuge-purple hover:bg-refuge-purple-dark text-white"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {capturingLocation ? "Capturing Location..." : "Mark as Arrived"}
            </Button>
          )}

          {hasArrived && appointment.status === "scheduled" && (
            <Button
              onClick={async () => {
                const response = await fetch(`/api/appointments/${appointmentId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "in-progress" }),
                })
                if (response.ok) {
                  toast({ title: "Visit Started", description: "Visit status updated" })
                  fetchAppointmentDetails()
                }
              }}
              className="w-full bg-refuge-purple hover:bg-refuge-purple-dark text-white"
              size="lg"
            >
              Start Visit
            </Button>
          )}

          {/* Link to full form (for iPad/desktop) */}
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
        </div>
      </div>
    </div>
  )
}

