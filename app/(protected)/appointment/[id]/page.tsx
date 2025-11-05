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
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
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
    if (formDataLoading) return // Don't fetch if already loading
    
    try {
      setFormDataLoading(true)
      console.log("📋 [FORM] Fetching form data for appointment:", appointmentId)
      console.log("📋 [FORM] Current appointment:", appointment)

      // 1. Get appointment details (we already have this, but need it in the right format)
      // Set appointmentData immediately so form can render
      setAppointmentData({ appointment })
      console.log("📋 [FORM] Set appointmentData:", { appointment })

      // 2. Check for existing visit form
      const existingFormResponse = await fetch(`/api/visit-forms?appointmentId=${appointmentId}`)
      if (existingFormResponse.ok) {
        const existingFormResult = await existingFormResponse.json()
        console.log("📋 [FORM] Existing form response:", existingFormResult)
        if (existingFormResult.visitForms && existingFormResult.visitForms.length > 0) {
          console.log("📋 [FORM] Found existing form:", existingFormResult.visitForms[0])
          setExistingFormData(existingFormResult.visitForms[0])
          // Also update visit form status
          setVisitFormStatus(existingFormResult.visitForms[0].status)
        } else {
          console.log("📋 [FORM] No existing form found")
        }
      } else {
        console.error("❌ [FORM] Failed to fetch existing form:", existingFormResponse.status)
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
    if (activeTab === "form" && appointment && !appointmentData) {
      console.log("📋 [FORM] Tab activated, fetching form data...")
      fetchFormData()
    } else if (activeTab === "form" && appointment && appointmentData) {
      console.log("📋 [FORM] Tab activated, form data already loaded")
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
    <div className="min-h-screen bg-gray-50">
      {/* Single Unified Header - Replaces AppHeader */}
      <header className="flex h-16 shrink-0 items-center gap-2 bg-white border-b border-slate-200 px-4">
        {/* Left: Sidebar Trigger + Navigation */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Link 
            href="/visits-calendar" 
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Appointments</span>
          </Link>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <h1 className="text-base font-semibold truncate text-foreground">
            {appointment.home_name || appointment.title}
          </h1>
        </div>
        
        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {appointment.status === "scheduled" && (
            <Button 
              size="sm"
              onClick={handleStartVisit}
              className="h-8 px-3 text-sm font-medium bg-refuge-purple hover:bg-refuge-purple-dark text-white"
            >
              <Play className="h-4 w-4 mr-1.5" />
              Start Visit
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePopOut}
            className="h-8 px-3 text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4 mr-1.5" />
            Pop Out
          </Button>
        </div>
      </header>

      {/* ROW 2: Status Badges */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2">
        <Badge className={getStatusColor(appointment.status)}>
          {appointment.status.replace("_", " ").replace("-", " ")}
        </Badge>
        <Badge className={getPriorityColor(appointment.priority)}>{appointment.priority} priority</Badge>
        {getVisitFormStatusBadge()}
      </div>

      {/* ROW 3: Tab Menu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white border-b border-slate-200">
          <TabsList className="h-auto bg-transparent w-full justify-start rounded-none border-0 p-0">
            <TabsTrigger 
              value="details" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-refuge-purple data-[state=active]:bg-transparent px-4 py-3"
            >
              <FileText className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger 
              value="form" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-refuge-purple data-[state=active]:bg-transparent px-4 py-3"
            >
              <Edit className="h-4 w-4" />
              <span>Visit Form</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-refuge-purple data-[state=active]:bg-transparent px-4 py-3"
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-refuge-purple data-[state=active]:bg-transparent px-4 py-3"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Notes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="attachments" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-refuge-purple data-[state=active]:bg-transparent px-4 py-3"
            >
              <Paperclip className="h-4 w-4" />
              <span>Files</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-0">
          <div className="container mx-auto p-6 max-w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Appointment Details</h2>
              <CreateAppointmentDialog
                editingAppointment={appointment}
                onAppointmentCreated={() => {
                  fetchAppointmentDetails()
                  setEditDialogOpen(false)
                }}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
              >
                <Button variant="outline" size="sm" className="h-8 px-3">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CreateAppointmentDialog>
            </div>
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
          </div>
        </TabsContent>

        {/* Visit Form Tab */}
        <TabsContent value="form" className="mt-0 p-0">
          {formDataLoading ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-refuge-purple mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading visit form...</p>
              </CardContent>
            </Card>
          ) : appointmentData && appointment ? (
            <EnhancedHomeVisitForm
              appointmentId={appointmentId}
              appointmentData={appointmentData}
              prepopulationData={prepopulationData}
              existingFormData={existingFormData}
              onSave={handleSaveForm}
              onSubmit={handleSubmitForm}
            />
          ) : appointment ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground mb-4">Loading form data...</p>
                <Button onClick={fetchFormData} variant="outline">
                  Load Visit Form
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">Appointment not loaded</p>
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

