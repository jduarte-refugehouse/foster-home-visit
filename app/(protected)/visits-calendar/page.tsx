"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { Plus, CalendarIcon, Clock, MapPin, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { VisitFormButton } from "@/components/appointments/visit-form-button"
import "react-big-calendar/lib/css/react-big-calendar.css"

const locales = {
  "en-US": enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface Appointment {
  appointment_id: string
  title: string
  start_datetime: string
  end_datetime: string
  status: "scheduled" | "completed" | "cancelled" | "in-progress" | "rescheduled"
  appointment_type: string
  home_name: string
  location_address: string
  assigned_to_name: string
  assigned_to_role: string
  priority: string
  description?: string
  preparation_notes?: string
  completion_notes?: string
}

// Transform appointment data for react-big-calendar
interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Appointment
}

export default function VisitsCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [visitFormStatus, setVisitFormStatus] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchVisitFormStatus = async (appointmentIds: string[]) => {
    try {
      const statusPromises = appointmentIds.map(async (id) => {
        const response = await fetch(`/api/visit-forms?appointmentId=${id}`)
        if (response.ok) {
          const data = await response.json()
          return {
            appointmentId: id,
            status: data.visitForms.length > 0 ? data.visitForms[0].status : "none",
          }
        }
        return { appointmentId: id, status: "none" }
      })

      const results = await Promise.all(statusPromises)
      const statusMap = results.reduce(
        (acc, { appointmentId, status }) => {
          acc[appointmentId] = status
          return acc
        },
        {} as Record<string, string>,
      )

      setVisitFormStatus(statusMap)
    } catch (error) {
      console.error("[v0] Error fetching visit form status:", error)
    }
  }

  const fetchAppointments = async () => {
    try {
      console.log("[v0] Fetching appointments from API...")
      setLoading(true)

      // Get appointments for the next 3 months
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 3)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const response = await fetch(`/api/appointments?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Appointments data received:", data)

      if (data.success) {
        setAppointments(data.appointments)
        console.log(`[v0] Successfully loaded ${data.appointments.length} appointments`)

        const appointmentIds = data.appointments.map((apt: Appointment) => apt.appointment_id)
        if (appointmentIds.length > 0) {
          await fetchVisitFormStatus(appointmentIds)
        }
      } else {
        throw new Error(data.error || "Failed to fetch appointments")
      }
    } catch (error) {
      console.error("[v0] Error fetching appointments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch appointments. Please try again.",
        variant: "destructive",
      })
      // Keep existing appointments if fetch fails
    } finally {
      setLoading(false)
    }
  }

  // Transform appointments to calendar events
  const calendarEvents: CalendarEvent[] = appointments.map((appointment) => ({
    id: appointment.appointment_id,
    title: appointment.title,
    start: new Date(appointment.start_datetime),
    end: new Date(appointment.end_datetime),
    resource: appointment,
  }))

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedAppointment(event.resource)
    setSelectedSlot(null)
  }

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end })
    setSelectedAppointment(null)
    console.log("[v0] Selected time slot:", { start, end })
  }

  const handleAppointmentCreated = () => {
    fetchAppointments()
    setSelectedSlot(null)
    setEditingAppointment(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "in_progress":
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "rescheduled":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "normal":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const appointment = event.resource
    let backgroundColor = "#3174ad"

    switch (appointment.status) {
      case "scheduled":
        backgroundColor = "#3b82f6"
        break
      case "completed":
        backgroundColor = "#10b981"
        break
      case "cancelled":
        backgroundColor = "#ef4444"
        break
      case "in_progress":
      case "in-progress":
        backgroundColor = "#f59e0b"
        break
      case "rescheduled":
        backgroundColor = "#8b5cf6"
        break
    }

    // Adjust opacity based on priority
    let opacity = 0.8
    if (appointment.priority === "urgent") opacity = 1.0
    if (appointment.priority === "low") opacity = 0.6

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity,
        color: "white",
        border: "0px",
        display: "block",
      },
    }
  }

  const businessHours = {
    start: 7, // 7 AM
    end: 20, // 8 PM
  }

  const slotStyleGetter = (date: Date) => {
    const hour = date.getHours()

    if (hour < businessHours.start || hour >= businessHours.end) {
      return {
        style: {
          backgroundColor: "#f3f4f6",
          color: "#9ca3af",
          pointerEvents: "none" as const,
        },
      }
    }

    return {}
  }

  const handleEditAppointment = () => {
    if (selectedAppointment) {
      setEditingAppointment(selectedAppointment)
    }
  }

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return

    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.appointment_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...selectedAppointment,
          status: "cancelled",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel appointment")
      }

      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      })

      fetchAppointments()
      setSelectedAppointment(null)
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      })
    }
  }

  const handleVisitFormCompleted = async (appointmentId: string) => {
    try {
      // Update appointment status to completed
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
        toast({
          title: "Success",
          description: "Visit completed and appointment updated",
        })

        // Refresh appointments and form status
        fetchAppointments()
      }
    } catch (error) {
      console.error("[v0] Error updating appointment status:", error)
    }
  }

  const getVisitFormStatusBadge = (appointmentId: string) => {
    const status = visitFormStatus[appointmentId] || "none"

    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Form Complete</Badge>
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Draft Saved</Badge>
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>
      default:
        return (
          <Badge variant="outline" className="text-xs">
            No Form
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Visits Calendar</h1>
          <p className="text-muted-foreground">Schedule and manage home visits and appointments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAppointments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <CreateAppointmentDialog
            selectedDate={selectedSlot?.start}
            selectedTime={selectedSlot?.start ? format(selectedSlot.start, "HH:mm") : undefined}
            editingAppointment={editingAppointment}
            onAppointmentCreated={handleAppointmentCreated}
          >
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </CreateAppointmentDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar View
                <Badge variant="secondary" className="ml-auto">
                  {appointments.length} appointments
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: "600px" }}>
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  selectable
                  eventPropGetter={eventStyleGetter}
                  slotPropGetter={slotStyleGetter}
                  views={["month", "week", "day"]}
                  defaultView="week"
                  step={30}
                  timeslots={2}
                  min={new Date(2025, 0, 1, businessHours.start, 0)}
                  max={new Date(2025, 0, 1, businessHours.end, 0)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Scheduled</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {appointments.filter((a) => a.status === "scheduled").length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed</span>
                <Badge className="bg-green-100 text-green-800">
                  {appointments.filter((a) => a.status === "completed").length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">In Progress</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {appointments.filter((a) => a.status === "in_progress" || a.status === "in-progress").length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cancelled</span>
                <Badge className="bg-red-100 text-red-800">
                  {appointments.filter((a) => a.status === "cancelled").length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {selectedSlot && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Selected Time Slot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Clock className="h-4 w-4" />
                  {format(selectedSlot.start, "PPP")} at {format(selectedSlot.start, "p")}
                </div>
                <p className="text-sm text-blue-600">
                  Click "Schedule Appointment" to create a new appointment for this time.
                </p>
              </CardContent>
            </Card>
          )}

          {selectedAppointment && (
            <Card>
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{selectedAppointment.title}</h4>
                  <div className="flex gap-2 mt-1">
                    <Badge className={getStatusColor(selectedAppointment.status)}>
                      {selectedAppointment.status.replace("_", " ")}
                    </Badge>
                    <Badge className={getPriorityColor(selectedAppointment.priority)}>
                      {selectedAppointment.priority}
                    </Badge>
                    {getVisitFormStatusBadge(selectedAppointment.appointment_id)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    {format(new Date(selectedAppointment.start_datetime), "PPP")} at{" "}
                    {format(new Date(selectedAppointment.start_datetime), "p")}
                  </div>
                  {selectedAppointment.location_address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      {selectedAppointment.location_address}
                    </div>
                  )}
                </div>

                <div>
                  <h5 className="font-medium text-sm">Assigned To</h5>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.assigned_to_name} ({selectedAppointment.assigned_to_role})
                  </p>
                </div>

                {selectedAppointment.home_name && (
                  <div>
                    <h5 className="font-medium text-sm">Home</h5>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.home_name}</p>
                  </div>
                )}

                {selectedAppointment.description && (
                  <div>
                    <h5 className="font-medium text-sm">Description</h5>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.description}</p>
                  </div>
                )}

                {selectedAppointment.preparation_notes && (
                  <div>
                    <h5 className="font-medium text-sm">Preparation Notes</h5>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.preparation_notes}</p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <VisitFormButton
                    appointmentId={selectedAppointment.appointment_id}
                    appointmentTitle={selectedAppointment.title}
                    disabled={selectedAppointment.status === "cancelled"}
                  />

                  <div className="flex gap-2">
                    <CreateAppointmentDialog
                      editingAppointment={editingAppointment}
                      onAppointmentCreated={handleAppointmentCreated}
                    >
                      <Button size="sm" className="flex-1" onClick={handleEditAppointment}>
                        Edit
                      </Button>
                    </CreateAppointmentDialog>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={handleCancelAppointment}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
