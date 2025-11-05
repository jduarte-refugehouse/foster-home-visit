"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  User, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Edit,
  ExternalLink,
  Play,
  History,
  MessageSquare,
  Paperclip
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { VisitFormButton } from "@/components/appointments/visit-form-button"
import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import EnhancedHomeVisitForm from "@/components/forms/home-visit-form-enhanced"

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
  const [activeTab, setActiveTab] = useState("details")
  const [appointmentData, setAppointmentData] = useState(null)
  const [prepopulationData, setPrepopulationData] = useState(null)
  const [existingFormData, setExistingFormData] = useState(null)
  const [formDataLoading, setFormDataLoading] = useState(false)

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

  const handleStartVisit = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "in-progress",
        }),
      })

      if (response.ok) {
        toast({
          title: "Visit Started",
          description: "Visit status updated to in-progress",
        })
        fetchAppointmentDetails()
        // Navigate to visit form
        router.push(`/visit-form?appointmentId=${appointmentId}`)
      }
    } catch (error) {
      console.error("Error starting visit:", error)
      toast({
        title: "Error",
        description: "Failed to start visit",
        variant: "destructive",
      })
    }
  }

  const handlePopOut = () => {
    window.open(`/appointment/${appointmentId}`, '_blank')
  }

  const fetchFormData = async () => {
    if (formDataLoading || appointmentData) return // Don't fetch if already loading or loaded
    
    try {
      setFormDataLoading(true)
      console.log("📋 [FORM] Fetching form data for appointment:", appointmentId)

      // 1. Get appointment details (we already have this, but need it in the right format)
      setAppointmentData({ appointment })

      // 2. Check for existing visit form
      const existingFormResponse = await fetch(`/api/visit-forms?appointmentId=${appointmentId}`)
      if (existingFormResponse.ok) {
        const existingFormResult = await existingFormResponse.json()
        if (existingFormResult.visitForms && existingFormResult.visitForms.length > 0) {
          setExistingFormData(existingFormResult.visitForms[0])
        }
      }

      // 3. Get home GUID and prepopulation data
      const homeXref = appointment?.home_xref
      if (homeXref) {
        const homeLookupResponse = await fetch(`/api/homes/lookup?xref=${homeXref}`)
        if (homeLookupResponse.ok) {
          const homeLookupData = await homeLookupResponse.json()
          const homeGuid = homeLookupData.guid
          
          if (homeGuid) {
            const prepopResponse = await fetch(`/api/homes/${homeGuid}/prepopulate`)
            if (prepopResponse.ok) {
              const prepopData = await prepopResponse.json()
              setPrepopulationData(prepopData)
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ [FORM] Error fetching form data:", error)
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      })
    } finally {
      setFormDataLoading(false)
    }
  }

  const handleSaveForm = async (formData: any) => {
    // This will be handled by the form component's existing save logic
    console.log("💾 Saving form from appointment detail page")
  }

  const handleSubmitForm = async (formData: any) => {
    // This will be handled by the form component's existing submit logic
    console.log("✅ Submitting form from appointment detail page")
    await handleVisitFormCompleted()
  }

  // Load form data when Visit Form tab is activated
  useEffect(() => {
    if (activeTab === "form" && appointment) {
      fetchFormData()
    }
  }, [activeTab, appointment])

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
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Form Complete
          </Badge>
        )
      case "draft":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Draft Saved
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400 flex items-center gap-1">
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
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Appointment not found</p>
            <Button onClick={() => router.back()} className="bg-refuge-purple hover:bg-refuge-purple-dark text-white shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-full">
      {/* Header with Back Button and Actions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="hover:bg-refuge-purple/10 hover:text-refuge-purple">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handlePopOut}
              className="hover:bg-refuge-purple/10 hover:text-refuge-purple hover:border-refuge-purple/20"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Pop Out
            </Button>
            {appointment.status === "scheduled" && (
              <Button 
                onClick={handleStartVisit}
                className="bg-refuge-purple hover:bg-refuge-purple-dark text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Visit
              </Button>
            )}
            <CreateAppointmentDialog
              editingAppointment={appointment}
              onAppointmentCreated={() => {
                fetchAppointmentDetails()
                setEditDialogOpen(false)
              }}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
            >
              <Button variant="outline" className="hover:bg-refuge-purple/10 hover:text-refuge-purple hover:border-refuge-purple/20">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CreateAppointmentDialog>
          </div>
        </div>

        {/* Title Section */}
        <div className="flex items-start justify-between">
          <div>
            {appointment.home_name && (
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-lg px-3 py-1 bg-refuge-purple/10 border-refuge-purple/20 text-refuge-purple dark:bg-refuge-purple/20 dark:text-refuge-purple-light">
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
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl mb-6">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Visit Form</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <span className="hidden sm:inline">Files</span>
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date & Time */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
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
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
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
                  <p className="text-xl font-semibold text-refuge-purple dark:text-refuge-purple-light">{appointment.home_name}</p>
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
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{appointment.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Preparation Notes */}
          {appointment.preparation_notes && (
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle>Preparation Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{appointment.preparation_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Completion Notes */}
          {appointment.completion_notes && (
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle>Completion Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{appointment.completion_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned To */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
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

          {/* Metadata */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
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
        </TabsContent>

        {/* Visit Form Tab */}
        <TabsContent value="form" className="mt-0">
          {formDataLoading ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-refuge-purple mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading visit form...</p>
              </CardContent>
            </Card>
          ) : appointmentData ? (
            <div>
              <div className="mb-4 flex justify-end">
                <Button 
                  variant="outline"
                  size="sm"
                  asChild
                  className="hover:bg-refuge-purple/10 hover:text-refuge-purple hover:border-refuge-purple/20"
                >
                  <Link href={`/visit-form?appointmentId=${appointmentId}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Link>
                </Button>
              </div>
              <EnhancedHomeVisitForm
                appointmentId={appointmentId}
                appointmentData={appointmentData}
                prepopulationData={prepopulationData}
                existingFormData={existingFormData}
                onSave={handleSaveForm}
                onSubmit={handleSubmitForm}
              />
            </div>
          ) : (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">Click to load the visit form</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Visit History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground py-8">
                <History className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Visit history and activity log will appear here.</p>
                <p className="text-sm mt-2">Feature coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-0">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notes & Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Internal notes and team comments will appear here.</p>
                <p className="text-sm mt-2">Feature coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="mt-0">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments & Files
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground py-8">
                <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Documents, photos, and attachments will appear here.</p>
                <p className="text-sm mt-2">Feature coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

