"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { Plus, CalendarIcon, Clock, MapPin, RefreshCw, Shield, AlertTriangle, CheckCircle, Phone, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { VisitFormButton } from "@/components/appointments/visit-form-button"
import { OnCallAssignmentDialog } from "@/components/on-call/on-call-assignment-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  resource: Appointment | any
  eventType?: "appointment" | "on-call"
}

export default function VisitsCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [visitFormStatus, setVisitFormStatus] = useState<Record<string, string>>({})
  
  // On-Call State
  const [onCallSchedules, setOnCallSchedules] = useState<any[]>([])
  const [coverageData, setCoverageData] = useState<any>(null)
  const [currentOnCall, setCurrentOnCall] = useState<any>(null)
  const [showOnCallPanel, setShowOnCallPanel] = useState(true)
  const [showOnCallOnCalendar, setShowOnCallOnCalendar] = useState(true)
  const [editingOnCall, setEditingOnCall] = useState<any>(null)
  const [showOnCallEditDialog, setShowOnCallEditDialog] = useState(false)
  const [onCallTypeFilter, setOnCallTypeFilter] = useState<string>("all") // Filter by on-call type
  
  const { toast } = useToast()

  // Helper: Parse SQL datetime as local time (not UTC)
  // SQL Server DATETIME2 has no timezone info, so we explicitly parse as local
  const parseLocalDatetime = (sqlDatetime: string): Date => {
    // SQL format: "2025-11-03T14:00:00" or "2025-11-03 14:00:00"
    const cleaned = sqlDatetime.replace(' ', 'T').replace('Z', '')
    const [datePart, timePart] = cleaned.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute, second] = timePart.split(':').map(Number)
    
    // Create Date in LOCAL timezone (not UTC)
    return new Date(year, month - 1, day, hour, minute, second || 0)
  }

  useEffect(() => {
    fetchAppointments()
    fetchOnCallData()
  }, [])

  // Refetch on-call data when filter changes
  useEffect(() => {
    fetchOnCallData()
  }, [onCallTypeFilter])

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

  const fetchOnCallData = async () => {
    try {
      console.log("[v0] Fetching on-call data...")

      // Fetch on-call schedules for next 30 days
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)

      // Build query params with type filter
      const schedulesParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
      if (onCallTypeFilter !== "all") {
        schedulesParams.append("type", onCallTypeFilter)
      }

      const coverageParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
      if (onCallTypeFilter !== "all") {
        coverageParams.append("type", onCallTypeFilter)
      }

      const [schedulesResponse, coverageResponse] = await Promise.all([
        fetch(`/api/on-call?${schedulesParams}`),
        fetch(`/api/on-call/coverage?${coverageParams}`),
      ])

      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json()
        setOnCallSchedules(schedulesData.schedules || [])
      }

      if (coverageResponse.ok) {
        const coverageDataResult = await coverageResponse.json()
        setCoverageData(coverageDataResult.coverage)
        setCurrentOnCall(coverageDataResult.currentOnCall)
      }

      console.log("[v0] On-call data loaded successfully")
    } catch (error) {
      console.error("[v0] Error fetching on-call data:", error)
      // Don't show error toast - it's not critical for calendar viewing
    }
  }

  const handleOnCallAssignmentCreated = () => {
    fetchOnCallData()
    toast({
      title: "Success",
      description: "On-call assignment updated. Refreshing schedule...",
    })
  }

  // Transform appointments to calendar events
  const appointmentEvents: CalendarEvent[] = appointments.map((appointment) => ({
    id: appointment.appointment_id,
    title: appointment.title,
    start: parseLocalDatetime(appointment.start_datetime),
    end: parseLocalDatetime(appointment.end_datetime),
    resource: appointment,
    eventType: "appointment",
  }))

  // Transform on-call schedules to calendar events
  const onCallEvents: CalendarEvent[] = onCallSchedules.map((schedule) => {
    const start = parseLocalDatetime(schedule.start_datetime)
    const end = parseLocalDatetime(schedule.end_datetime)
    const timeRange = `${format(start, "MMM d, h:mm a")} - ${format(end, "MMM d, h:mm a")}`
    
    return {
      id: `oncall-${schedule.id}`,
      title: `🛡️ ${schedule.user_name} (On-Call)\n${timeRange}`,
      start,
      end,
      resource: schedule,
      eventType: "on-call",
    }
  })

  // Combine events based on toggle
  const calendarEvents: CalendarEvent[] = showOnCallOnCalendar 
    ? [...appointmentEvents, ...onCallEvents]
    : appointmentEvents

  const handleSelectEvent = (event: CalendarEvent) => {
    // Only show appointment details for appointments, not on-call events
    if (event.eventType === "appointment") {
      setSelectedAppointment(event.resource)
      setSelectedSlot(null)
    } else if (event.eventType === "on-call") {
      // For on-call events, open edit dialog
      const schedule = event.resource
      setEditingOnCall(schedule)
      setShowOnCallEditDialog(true)
    }
  }

  const handleDeleteOnCall = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/on-call/${scheduleId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete on-call schedule")
      }

      toast({
        title: "Success",
        description: "On-call assignment deleted successfully",
      })

      // Refresh data
      fetchOnCallData()
      setShowOnCallEditDialog(false)
      setEditingOnCall(null)
    } catch (error) {
      console.error("Error deleting on-call:", error)
      toast({
        title: "Error",
        description: "Failed to delete on-call assignment",
        variant: "destructive",
      })
    }
  }

  const handleOnCallUpdated = () => {
    fetchOnCallData()
    setShowOnCallEditDialog(false)
    setEditingOnCall(null)
    toast({
      title: "Success",
      description: "On-call assignment updated successfully",
    })
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

  // Generate a consistent color for each person/resource
  const getColorForResource = (name: string) => {
    const colors = [
      { bg: "#8b5cf6", border: "#7c3aed" }, // Purple
      { bg: "#ec4899", border: "#db2777" }, // Pink
      { bg: "#3b82f6", border: "#2563eb" }, // Blue
      { bg: "#10b981", border: "#059669" }, // Green
      { bg: "#f59e0b", border: "#d97706" }, // Amber
      { bg: "#ef4444", border: "#dc2626" }, // Red
      { bg: "#06b6d4", border: "#0891b2" }, // Cyan
      { bg: "#8b5cf6", border: "#7c3aed" }, // Violet
      { bg: "#f97316", border: "#ea580c" }, // Orange
      { bg: "#14b8a6", border: "#0d9488" }, // Teal
    ]
    
    // Simple hash function to get consistent color for same name
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    // Handle on-call events with color per person and smaller font
    if (event.eventType === "on-call") {
      const schedule = event.resource
      const personColor = getColorForResource(schedule.user_name)
      
      return {
        style: {
          backgroundColor: personColor.bg,
          borderRadius: "4px",
          opacity: 0.9,
          color: "white",
          border: `2px solid ${personColor.border}`,
          display: "block",
          fontWeight: "500",
          fontSize: "11px",
          padding: "2px 4px",
          lineHeight: "1.3",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      }
    }

    // Handle appointment events
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
        fontSize: "12px",
        padding: "2px 4px",
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
          <OnCallAssignmentDialog
            selectedDate={selectedSlot?.start}
            selectedTime={selectedSlot?.start ? format(selectedSlot.start, "HH:mm") : undefined}
            onAssignmentCreated={handleOnCallAssignmentCreated}
          >
            <Button variant="outline" className="border-refuge-purple text-refuge-purple hover:bg-refuge-purple/10">
              <Plus className="h-4 w-4 mr-2" />
              Add On-Call
            </Button>
          </OnCallAssignmentDialog>
          
          <Link href="/on-call-schedule">
            <Button 
              variant="default" 
              className="bg-refuge-purple hover:bg-refuge-purple/90"
            >
              <Shield className="h-4 w-4 mr-2" />
              Manage On-Call Schedule
            </Button>
          </Link>
          
          {/* Edit On-Call Dialog (opened by clicking calendar event) */}
          <OnCallAssignmentDialog
            open={showOnCallEditDialog}
            onOpenChange={setShowOnCallEditDialog}
            editingAssignment={editingOnCall}
            onAssignmentCreated={handleOnCallUpdated}
            onDelete={handleDeleteOnCall}
          />
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Calendar View
                  <Badge variant="secondary">
                    {appointments.length} appointments
                  </Badge>
                  {showOnCallOnCalendar && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Shield className="h-3 w-3 mr-1" />
                      {onCallSchedules.length} on-call
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox 
                      checked={showOnCallOnCalendar} 
                      onCheckedChange={(checked) => setShowOnCallOnCalendar(checked === true)}
                    />
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-700">Show On-Call</span>
                  </label>
                  
                  {showOnCallOnCalendar && (
                    <Select value={onCallTypeFilter} onValueChange={setOnCallTypeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="liaison">Liaison On-Call</SelectItem>
                        <SelectItem value="general">General On-Call</SelectItem>
                        <SelectItem value="emergency">Emergency Response</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
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
          {/* Current On-Call Status */}
          <Card className="border-refuge-purple/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-refuge-purple" />
                On-Call Status
                {onCallTypeFilter !== "all" && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {onCallTypeFilter === "liaison" && "Liaison Only"}
                    {onCallTypeFilter === "general" && "General Only"}
                    {onCallTypeFilter === "emergency" && "Emergency Only"}
                    {onCallTypeFilter === "technical" && "Technical Only"}
                    {onCallTypeFilter === "management" && "Management Only"}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentOnCall ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-semibold text-sm">Currently On-Call</span>
                  </div>
                  <div className="bg-refuge-purple/10 p-3 rounded-lg">
                    <p className="font-medium text-refuge-purple">{currentOnCall.user_name}</p>
                    {currentOnCall.user_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Phone className="h-3 w-3" />
                        {currentOnCall.user_phone}
                      </div>
                    )}
                    {currentOnCall.user_email && (
                      <p className="text-xs text-gray-500 mt-1">{currentOnCall.user_email}</p>
                    )}
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>No one currently on-call</AlertDescription>
                </Alert>
              )}

              {coverageData && (
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span>Coverage (30 days)</span>
                    <Badge
                      variant={
                        coverageData.coveragePercentage >= 100
                          ? "default"
                          : coverageData.coveragePercentage >= 75
                            ? "secondary"
                            : "destructive"
                      }
                      className={
                        coverageData.coveragePercentage >= 100
                          ? "bg-green-100 text-green-800"
                          : coverageData.coveragePercentage >= 75
                            ? "bg-yellow-100 text-yellow-800"
                            : ""
                      }
                    >
                      {coverageData.coveragePercentage}%
                    </Badge>
                  </div>
                  {coverageData.status === "critical" && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">Coverage gaps detected</AlertDescription>
                    </Alert>
                  )}
                  {coverageData.status === "full" && (
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-xs text-green-600">Full 24/7 coverage</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-3 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span>Upcoming Shifts</span>
                  <Badge variant="outline">{onCallSchedules.length}</Badge>
                </div>
                {onCallSchedules.slice(0, 3).map((schedule) => (
                  <div key={schedule.id} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="font-medium">{schedule.user_name}</div>
                    <div className="text-gray-500">
                      {format(parseLocalDatetime(schedule.start_datetime), "MMM d, h:mm a")} -{" "}
                      {format(parseLocalDatetime(schedule.end_datetime), "MMM d, h:mm a")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                    {format(parseLocalDatetime(selectedAppointment.start_datetime), "PPP")} at{" "}
                    {format(parseLocalDatetime(selectedAppointment.start_datetime), "p")}
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
