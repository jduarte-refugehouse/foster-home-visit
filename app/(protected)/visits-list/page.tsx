"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  RefreshCw, 
  Search,
  ChevronRight,
  FileText,
  Home as HomeIcon
} from "lucide-react"
import { format, startOfWeek, addMonths, subWeeks, isToday, isTomorrow, isPast, isFuture } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Appointment {
  appointment_id: string
  title: string
  start_datetime: string
  end_datetime: string
  status: "scheduled" | "completed" | "cancelled" | "in-progress" | "rescheduled"
  appointment_type: string
  home_name: string
  home_xref?: number
  location_address: string
  assigned_to_name: string
  assigned_to_role: string
  priority: string
  description?: string
}

export default function VisitsListPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      
      // Calculate date range: 1 week ago to 1 month from now
      const startDate = subWeeks(new Date(), 1)
      const endDate = addMonths(new Date(), 1)

      const response = await fetch(
        `/api/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch appointments")
      }

      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error("Error fetching appointments:", error)
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    if (!searchTerm.trim()) {
      setFilteredAppointments(appointments)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = appointments.filter(
      (apt) =>
        apt.title.toLowerCase().includes(term) ||
        apt.home_name?.toLowerCase().includes(term) ||
        apt.assigned_to_name.toLowerCase().includes(term) ||
        apt.location_address?.toLowerCase().includes(term) ||
        apt.appointment_type.toLowerCase().includes(term)
    )
    setFilteredAppointments(filtered)
  }

  const parseLocalDatetime = (sqlDatetime: string): Date => {
    const cleaned = sqlDatetime.replace(" ", "T").replace("Z", "")
    const [datePart, timePart] = cleaned.split("T")
    const [year, month, day] = datePart.split("-").map(Number)
    const [hour, minute, second] = timePart.split(":").map(Number)
    return new Date(year, month - 1, day, hour, minute, second || 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "cancelled":
        return "bg-refuge-magenta/10 text-refuge-magenta dark:bg-refuge-magenta/20 dark:text-refuge-magenta-light"
      case "in-progress":
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

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    if (isPast(date)) return format(date, "EEEE, MMMM d, yyyy")
    return format(date, "EEEE, MMMM d, yyyy")
  }

  const getTimeStatus = (startDate: Date) => {
    if (isToday(startDate)) {
      return <Badge className="bg-refuge-purple hover:bg-refuge-purple-dark text-white shadow-sm">Today</Badge>
    }
    if (isTomorrow(startDate)) {
      return <Badge className="bg-refuge-magenta hover:bg-refuge-magenta-dark text-white shadow-sm">Tomorrow</Badge>
    }
    if (isPast(startDate)) {
      return <Badge variant="outline" className="text-slate-500 dark:text-slate-400">Past</Badge>
    }
    return <Badge variant="outline" className="text-refuge-purple dark:text-refuge-purple-light border-refuge-purple/20">Upcoming</Badge>
  }

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
    const date = format(parseLocalDatetime(appointment.start_datetime), "yyyy-MM-dd")
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(appointment)
    return groups
  }, {} as Record<string, Appointment[]>)

  // Sort dates
  const sortedDates = Object.keys(groupedAppointments).sort()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Visits Schedule</h1>
            <p className="text-muted-foreground">Past week through next month</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAppointments} disabled={loading} className="hover:bg-refuge-purple/10 hover:text-refuge-purple hover:border-refuge-purple/20">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild className="bg-refuge-purple hover:bg-refuge-purple-dark text-white shadow-sm hover:shadow-md transition-all duration-200">
              <Link href="/visits-calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by home, staff, location, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-refuge-purple dark:text-refuge-purple-light">{filteredAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Total Visits</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              {filteredAppointments.filter((a) => a.status === "scheduled").length}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {filteredAppointments.filter((a) => a.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {filteredAppointments.filter((a) => a.status === "in-progress" || a.status === "in_progress").length}
            </div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      {sortedDates.length === 0 ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-refuge-purple/40 dark:text-refuge-purple-light/40 mb-4" />
            <p className="text-lg font-medium mb-2">No visits found</p>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search" : "No visits scheduled in this time range"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => {
            const dateObj = new Date(date + "T00:00:00")
            const dayAppointments = groupedAppointments[date].sort(
              (a, b) =>
                parseLocalDatetime(a.start_datetime).getTime() - parseLocalDatetime(b.start_datetime).getTime()
            )

            return (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{format(dateObj, "d")}</div>
                      <div className="text-sm text-muted-foreground uppercase">{format(dateObj, "MMM")}</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{getDateLabel(dateObj)}</h2>
                    <p className="text-sm text-muted-foreground">{dayAppointments.length} visit(s)</p>
                  </div>
                </div>

                {/* Appointments for this date */}
                <div className="space-y-3 ml-16">
                  {dayAppointments.map((appointment) => {
                    const startDate = parseLocalDatetime(appointment.start_datetime)
                    const endDate = parseLocalDatetime(appointment.end_datetime)

                    return (
                      <Link key={appointment.appointment_id} href={`/appointment/${appointment.appointment_id}`}>
                        <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer hover:border-refuge-purple/20">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              {/* Time */}
                              <div className="flex-shrink-0 text-center min-w-[80px]">
                                <div className="text-lg font-semibold">{format(startDate, "h:mm a")}</div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} min
                                </div>
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg truncate">{appointment.title}</h3>
                                    {appointment.home_name && (
                                      <div className="flex items-center gap-1 text-refuge-purple dark:text-refuge-purple-light mt-1">
                                        <HomeIcon className="h-4 w-4 flex-shrink-0" />
                                        <span className="font-medium">{appointment.home_name}</span>
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                </div>

                                <div className="flex flex-wrap gap-2 mb-2">
                                  <Badge className={getStatusColor(appointment.status)}>
                                    {appointment.status.replace("_", " ").replace("-", " ")}
                                  </Badge>
                                  <Badge className={getPriorityColor(appointment.priority)}>
                                    {appointment.priority}
                                  </Badge>
                                  {getTimeStatus(startDate)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  {appointment.assigned_to_name && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-4 w-4 flex-shrink-0" />
                                      <span className="truncate">{appointment.assigned_to_name}</span>
                                    </div>
                                  )}
                                  {appointment.location_address && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4 flex-shrink-0" />
                                      <span className="truncate">{appointment.location_address}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

