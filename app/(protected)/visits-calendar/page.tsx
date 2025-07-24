"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { Plus, CalendarIcon, Clock, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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

interface Visit {
  id: string
  title: string
  start: Date
  end: Date
  status: "scheduled" | "completed" | "cancelled" | "in-progress"
  home: {
    name: string
    address: string
  }
  visitor: {
    name: string
    role: string
  }
  notes?: string
}

export default function VisitsCalendarPage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchVisits()
  }, [])

  const fetchVisits = async () => {
    try {
      // Mock data - replace with actual API call
      const mockVisits: Visit[] = [
        {
          id: "1",
          title: "Home Visit - Johnson Family",
          start: new Date(2024, 0, 15, 10, 0),
          end: new Date(2024, 0, 15, 11, 30),
          status: "scheduled",
          home: {
            name: "Johnson Family Home",
            address: "123 Main St, City, State",
          },
          visitor: {
            name: "Sarah Wilson",
            role: "Case Manager",
          },
          notes: "Initial assessment visit",
        },
        {
          id: "2",
          title: "Follow-up Visit - Smith Family",
          start: new Date(2024, 0, 16, 14, 0),
          end: new Date(2024, 0, 16, 15, 0),
          status: "completed",
          home: {
            name: "Smith Family Home",
            address: "456 Oak Ave, City, State",
          },
          visitor: {
            name: "Mike Davis",
            role: "Social Worker",
          },
        },
        {
          id: "3",
          title: "Safety Check - Brown Family",
          start: new Date(2024, 0, 17, 9, 0),
          end: new Date(2024, 0, 17, 10, 0),
          status: "in-progress",
          home: {
            name: "Brown Family Home",
            address: "789 Pine St, City, State",
          },
          visitor: {
            name: "Lisa Chen",
            role: "Home Visitor",
          },
        },
      ]
      setVisits(mockVisits)
    } catch (error) {
      console.error("Error fetching visits:", error)
      toast({
        title: "Error",
        description: "Failed to fetch visits",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event: Visit) => {
    setSelectedVisit(event)
  }

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Handle creating new visit
    toast({
      title: "New Visit",
      description: `Create new visit for ${format(start, "PPP")} at ${format(start, "p")}`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const eventStyleGetter = (event: Visit) => {
    let backgroundColor = "#3174ad"
    switch (event.status) {
      case "scheduled":
        backgroundColor = "#3b82f6"
        break
      case "completed":
        backgroundColor = "#10b981"
        break
      case "cancelled":
        backgroundColor = "#ef4444"
        break
      case "in-progress":
        backgroundColor = "#f59e0b"
        break
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
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
          <p className="text-muted-foreground">Schedule and manage home visits</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Visit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: "600px" }}>
                <Calendar
                  localizer={localizer}
                  events={visits}
                  startAccessor="start"
                  endAccessor="end"
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  selectable
                  eventPropGetter={eventStyleGetter}
                  views={["month", "week", "day"]}
                  defaultView="week"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visit Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Scheduled</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {visits.filter((v) => v.status === "scheduled").length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed</span>
                <Badge className="bg-green-100 text-green-800">
                  {visits.filter((v) => v.status === "completed").length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">In Progress</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {visits.filter((v) => v.status === "in-progress").length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cancelled</span>
                <Badge className="bg-red-100 text-red-800">
                  {visits.filter((v) => v.status === "cancelled").length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {selectedVisit && (
            <Card>
              <CardHeader>
                <CardTitle>Visit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{selectedVisit.title}</h4>
                  <Badge className={getStatusColor(selectedVisit.status)}>{selectedVisit.status}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    {format(selectedVisit.start, "PPP")} at {format(selectedVisit.start, "p")}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {selectedVisit.home.address}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-sm">Visitor</h5>
                  <p className="text-sm text-muted-foreground">
                    {selectedVisit.visitor.name} ({selectedVisit.visitor.role})
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-sm">Home</h5>
                  <p className="text-sm text-muted-foreground">{selectedVisit.home.name}</p>
                </div>

                {selectedVisit.notes && (
                  <div>
                    <h5 className="font-medium text-sm">Notes</h5>
                    <p className="text-sm text-muted-foreground">{selectedVisit.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
