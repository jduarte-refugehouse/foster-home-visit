"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@refugehouse/shared-core/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@refugehouse/shared-core/components/ui/alert"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@refugehouse/shared-core/components/ui/tabs"
import { Calendar, Shield, AlertTriangle, CheckCircle, Mail, Download, Plus, Edit, Trash2, Clock, Phone, RefreshCw, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { OnCallAssignmentDialog } from "@/components/on-call/on-call-assignment-dialog"
import { ReportPreviewDialog } from "@/components/on-call/report-preview-dialog"
import { IndividualReportDialog } from "@/components/on-call/individual-report-dialog"

export default function OnCallSchedulePage() {
  const router = useRouter()
  const [onCallType, setOnCallType] = useState<string>("liaison")
  const [schedules, setSchedules] = useState<any[]>([])
  const [coverage, setCoverage] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showReportPreview, setShowReportPreview] = useState(false)
  const [currentReportType, setCurrentReportType] = useState<"gap" | "schedule" | "individual">("gap")
  const [currentReportData, setCurrentReportData] = useState<any>(null)
  const [showIndividualReportDialog, setShowIndividualReportDialog] = useState(false)
  const { toast } = useToast()

  // Helper: Parse SQL datetime as local time (not UTC)
  const parseLocalDatetime = (sqlDatetime: string): Date => {
    const cleaned = sqlDatetime.replace(' ', 'T').replace('Z', '')
    const [datePart, timePart] = cleaned.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute, second] = timePart.split(':').map(Number)
    return new Date(year, month - 1, day, hour, minute, second || 0)
  }

  useEffect(() => {
    fetchData()
  }, [onCallType])

  const fetchData = async () => {
    setLoading(true)
    try {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: onCallType,
      })

      console.log("🔍 Fetching on-call data with params:", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: onCallType,
      })

      const [schedulesRes, coverageRes] = await Promise.all([
        fetch(`/api/on-call?${params}`),
        fetch(`/api/on-call/coverage?${params}`),
      ])

      if (schedulesRes.ok) {
        const data = await schedulesRes.json()
        console.log("📅 Schedules received:", data.schedules?.length || 0)
        setSchedules(data.schedules || [])
      }

      if (coverageRes.ok) {
        const data = await coverageRes.json()
        console.log("📊 Coverage data:", data.coverage)
        setCoverage(data.coverage)
      }
    } catch (error) {
      console.error("❌ Error fetching on-call data:", error)
      toast({
        title: "Error",
        description: "Failed to load on-call data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return

    try {
      const response = await fetch(`/api/on-call/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "On-call assignment deleted",
        })
        fetchData()
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment)
    setShowEditDialog(true)
  }

  const handleAssignmentUpdated = () => {
    setShowAddDialog(false)
    setShowEditDialog(false)
    setEditingAssignment(null)
    fetchData()
  }

  const sendGapReport = () => {
    setCurrentReportType("gap")
    setCurrentReportData({
      gaps: coverage?.gaps || [],
      coveragePercentage: coverage?.covered_percentage || 0,
      schedules, // Include schedules so timeline can show both coverage and gaps
    })
    setShowReportPreview(true)
  }

  const send30DayReport = () => {
    setCurrentReportType("schedule")
    setCurrentReportData({
      schedules,
      coverage,
    })
    setShowReportPreview(true)
  }

  const sendIndividualReports = () => {
    // Open dialog to select which assignees to send reports to
    if (!schedules || schedules.length === 0) {
      toast({
        title: "No Assignees",
        description: "No assignments found to generate reports for",
        variant: "destructive",
      })
      return
    }

    setShowIndividualReportDialog(true)
  }

  const gaps = coverage?.gaps || []
  const coveragePercentage = coverage?.covered_percentage || 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb/Back Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/visits-calendar" className="hover:text-refuge-purple transition-colors">
          Visits Calendar
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">On-Call Schedule</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="text-gray-600 hover:text-refuge-purple"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-refuge-purple" />
              Manage On-Call Schedule
            </h1>
            <p className="text-gray-600 mt-1">View assignments, identify gaps, and generate reports for the next 30 days</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
        </div>
      </div>

      {/* Filter and Coverage Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">On-Call Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={onCallType} onValueChange={setOnCallType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="liaison">Liaison On-Call</SelectItem>
                <SelectItem value="general">General On-Call</SelectItem>
                <SelectItem value="emergency">Emergency Response</SelectItem>
                <SelectItem value="technical">Technical Support</SelectItem>
                <SelectItem value="management">Management</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Coverage Summary Card */}
        <Card className={`lg:col-span-2 ${coveragePercentage === 100 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {coveragePercentage === 100 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Coverage Status: {coveragePercentage.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {gaps.length === 0 ? "✅ Full coverage for next 30 days" : `⚠️ ${gaps.length} gap(s) detected`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={sendGapReport} size="sm" variant="outline" disabled={gaps.length === 0}>
                  <Mail className="h-4 w-4 mr-2" />
                  Gap Report
                </Button>
                <Button onClick={send30DayReport} size="sm" variant="outline" disabled={schedules.length === 0}>
                  <Mail className="h-4 w-4 mr-2" />
                  Schedule Report
                </Button>
                <Button onClick={sendIndividualReports} size="sm" variant="outline" disabled={schedules.length === 0}>
                  <Mail className="h-4 w-4 mr-2" />
                  Individual Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Assignments and Gaps */}
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignments">
            Assignments ({schedules.length})
          </TabsTrigger>
          <TabsTrigger value="gaps">
            Coverage Gaps ({gaps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-3">
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">Loading assignments...</p>
              </CardContent>
            </Card>
          ) : schedules.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Assignments</AlertTitle>
              <AlertDescription>
                No on-call assignments found for the next 30 days. Click "Add Assignment" to schedule coverage.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {schedules.map((schedule) => {
                const start = parseLocalDatetime(schedule.start_datetime)
                const end = parseLocalDatetime(schedule.end_datetime)
                
                return (
                  <Card key={schedule.id} className="border-refuge-purple/20">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="bg-purple-50">
                            {schedule.user_name}
                          </Badge>
                          {schedule.priority_level === "high" && (
                            <Badge variant="destructive">High Priority</Badge>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <div>{format(start, "MMM d, yyyy")}</div>
                              <div>{format(start, "h:mm a")} - {format(end, "h:mm a")}</div>
                            </div>
                          </div>
                          {schedule.user_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              {schedule.user_phone}
                            </div>
                          )}
                          {schedule.user_email && (
                            <div className="text-xs text-gray-500">{schedule.user_email}</div>
                          )}
                        </div>
                        {schedule.notes && (
                          <p className="text-sm text-gray-500 border-t pt-2">{schedule.notes}</p>
                        )}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEdit(schedule)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(schedule.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gaps" className="space-y-3">
          {gaps.length === 0 ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Full Coverage</AlertTitle>
              <AlertDescription className="text-green-700">
                No coverage gaps detected for the next 30 days. All time slots are assigned.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {gaps.map((gap: any, index: number) => {
                const gapStart = parseLocalDatetime(gap.gap_start)
                const gapEnd = parseLocalDatetime(gap.gap_end)
                const hours = gap.gap_hours.toFixed(1)
                
                return (
                  <Alert key={index} variant="destructive" className="border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Coverage Gap - {hours} hours</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-1 mt-2">
                        <p className="font-medium">{format(gapStart, "MMM d, yyyy h:mm a")}</p>
                        <p className="font-medium">to {format(gapEnd, "MMM d, yyyy h:mm a")}</p>
                        {gap.message && <p className="text-sm mt-2">{gap.message}</p>}
                      </div>
                    </AlertDescription>
                  </Alert>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Assignment Dialog */}
      <OnCallAssignmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAssignmentCreated={handleAssignmentUpdated}
      />

      {/* Edit Assignment Dialog */}
      <OnCallAssignmentDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        editingAssignment={editingAssignment}
        onAssignmentCreated={handleAssignmentUpdated}
        onDelete={(id) => {
          handleDelete(id)
          setShowEditDialog(false)
        }}
      />

      {/* Report Preview Dialog */}
      <ReportPreviewDialog
        open={showReportPreview}
        onOpenChange={setShowReportPreview}
        reportType={currentReportType}
        reportData={currentReportData}
        onCallType={onCallType}
      />

      {/* Individual Report Selection Dialog */}
      <IndividualReportDialog
        open={showIndividualReportDialog}
        onOpenChange={setShowIndividualReportDialog}
        schedules={schedules}
        onCallType={onCallType}
      />
    </div>
  )
}

