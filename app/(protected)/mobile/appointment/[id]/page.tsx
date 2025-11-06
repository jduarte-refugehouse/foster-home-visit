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
    if (!isMobile) {
      router.replace(`/appointment/${appointmentId}`)
      return
    }
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
        toast({
          title: "Drive Started",
          description: "Starting location captured",
        })
        fetchAppointmentDetails()
      } else {
        throw new Error(data.error || "Failed to start drive")
      }
    } catch (error) {
      console.error("Error starting drive:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to capture location",
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
        toast({
          title: "Arrived",
          description: "Arrival location captured. Mileage calculated.",
        })
        fetchAppointmentDetails()
      } else {
        throw new Error(data.error || "Failed to record arrival")
      }
    } catch (error) {
      console.error("Error recording arrival:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to capture location",
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-muted-foreground">Loading appointment...</p>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Appointment not found</p>
          <Button onClick={() => router.push("/mobile")} className="mt-4" variant="outline">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/mobile")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">Appointment Details</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Appointment Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{appointment.home_name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
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
                    ? "bg-green-500"
                    : appointment.status === "in-progress"
                      ? "bg-blue-500"
                      : ""
                }
              >
                {appointment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointment.description && (
              <div>
                <p className="text-sm text-gray-700">{appointment.description}</p>
              </div>
            )}

            {appointment.location_address && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                  <span className="text-gray-700">{appointment.location_address}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
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
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  Calculated Mileage: <span className="font-semibold">{appointment.calculated_mileage.toFixed(1)} miles</span>
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
              className="w-full"
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
              className="w-full"
              size="lg"
              variant="default"
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
              className="w-full"
              size="lg"
              variant="default"
            >
              Start Visit
            </Button>
          )}

          {/* Link to full form (for iPad/desktop) */}
          <Button
            variant="outline"
            className="w-full"
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

