"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Phone, Navigation, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { format, parseISO, isToday, isPast, isFuture } from "date-fns"
import { useDeviceType } from "@/hooks/use-device-type"
import Link from "next/link"

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
}

export default function MobileDashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { type, isMobile } = useDeviceType()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  // Optional: Redirect to regular dashboard if not mobile
  // Commented out to allow testing on desktop browsers
  // Uncomment if you want to force mobile-only access
  // useEffect(() => {
  //   if (isLoaded && !isMobile) {
  //     router.replace("/dashboard")
  //   }
  // }, [isLoaded, isMobile, router])

  useEffect(() => {
    if (isLoaded) {
      fetchAppointments()
    }
  }, [isLoaded])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const today = new Date()
      const startDate = new Date(today.setHours(0, 0, 0, 0))
      const endDate = new Date(today.setHours(23, 59, 59, 999))

      const response = await fetch(
        `/api/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )

      if (response.ok) {
        const data = await response.json()
        // Filter to today's appointments and sort by time
        const todayAppointments = (data.appointments || [])
          .filter((apt: Appointment) => {
            const aptDate = parseISO(apt.start_datetime)
            return isToday(aptDate)
          })
          .sort((a: Appointment, b: Appointment) => {
            return parseISO(a.start_datetime).getTime() - parseISO(b.start_datetime).getTime()
          })
        setAppointments(todayAppointments)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
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

  const getDirectionsUrl = (address: string) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
  }

  const getStatusBadge = (status: string, startTime: Date) => {
    if (status === "completed") {
      return <Badge className="bg-green-500">Completed</Badge>
    }
    if (status === "in-progress") {
      return <Badge className="bg-blue-500">In Progress</Badge>
    }
    if (isPast(startTime)) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Past</Badge>
    }
    return <Badge variant="outline">Scheduled</Badge>
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Today's Visits</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>

        {/* Appointments List */}
        {loading ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">Loading appointments...</p>
            </CardContent>
          </Card>
        ) : appointments.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500 opacity-50" />
              <p className="text-gray-600 dark:text-gray-400">No appointments scheduled for today</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => {
            const startTime = parseLocalDatetime(appointment.start_datetime)
            const endTime = parseLocalDatetime(appointment.end_datetime)

            return (
              <Card key={appointment.appointment_id} className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Appointment Title - Most Important */}
                      <CardTitle className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">
                        {appointment.title || appointment.home_name}
                      </CardTitle>
                      {/* Home Name if different from title */}
                      {appointment.title && appointment.title !== appointment.home_name && (
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    {getStatusBadge(appointment.status, startTime)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {appointment.location_address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{appointment.location_address}</span>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      asChild
                    >
                      <a
                        href={getDirectionsUrl(appointment.location_address || appointment.home_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Directions
                      </a>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-refuge-purple hover:bg-refuge-purple-dark text-white"
                      asChild
                    >
                      <Link href={`/mobile/appointment/${appointment.appointment_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}

        {/* Footer Info */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
          <p>Mobile-optimized view for field staff</p>
        </div>
      </div>
    </div>
  )
}

