"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, MapPin, User, Calendar, FileText, AlertCircle, CheckCircle2, Edit } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { VisitFormButton } from "@/components/appointments/visit-form-button"
import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"

interface Appointment {
  appointment_id: string
  title: string
  start_datetime: string
  end_datetime: string
  status: "scheduled" | "completed" | "cancelled" | "in-progress" | "rescheduled"
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
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [visitFormStatus, setVisitFormStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails()
      fetchVisitFormStatus()
    }
  }, [appointmentId])

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

  const fetchVisitFormStatus = async () => {
    try {
      const response = await fetch(`/api/visit-forms?appointmentId=${appointmentId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.visitForms && data.visitForms.length > 0) {
          setVisitFormStatus(data.visitForms[0].status)
        }
      }
    } catch (error) {
      console.error("Error fetching visit form status:", error)
    }
  }

  const handleVisitFormCompleted = async () => {
    try {
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
        fetchAppointmentDetails()
        fetchVisitFormStatus()
      }
    } catch (error) {
      console.error("Error updating appointment status:", error)
    }
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
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "rescheduled":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
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
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Form Complete
          </Badge>
        )
      case "draft":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Draft Saved
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
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
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Appointment not found</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            {appointment.home_name && (
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-lg px-3 py-1 bg-blue-50 border-blue-200 text-blue-700">
                  {appointment.home_name}
                </Badge>
              </div>
            )}
            <h1 className="text-3xl font-bold mb-2">{appointment.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status.replace("_", " ").replace("-", " ")}
              </Badge>
              <Badge className={getPriorityColor(appointment.priority)}>{appointment.priority} priority</Badge>
              {getVisitFormStatusBadge()}
            </div>
          </div>
          <div className="flex gap-2">
            <CreateAppointmentDialog
              editingAppointment={appointment}
              onAppointmentCreated={() => {
                fetchAppointmentDetails()
                setEditDialogOpen(false)
              }}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
            >
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CreateAppointmentDialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date & Time */}
          <Card>
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
          <Card>
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
                  <p className="text-xl font-semibold text-blue-700">{appointment.home_name}</p>
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

          {/* Description */}
          {appointment.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{appointment.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Preparation Notes */}
          {appointment.preparation_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Preparation Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{appointment.preparation_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Completion Notes */}
          {appointment.completion_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Completion Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{appointment.completion_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned To */}
          <Card>
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

          {/* Visit Form Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Visit Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {getVisitFormStatusBadge()}
              <VisitFormButton
                appointmentId={appointment.appointment_id}
                appointmentStatus={appointment.status}
                visitFormStatus={visitFormStatus || undefined}
                onVisitFormCompleted={handleVisitFormCompleted}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
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
  )
}

