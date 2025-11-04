"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Shield, AlertTriangle, CheckCircle, Mail, Download, Plus, Edit, Trash2, Clock, Phone } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { OnCallAssignmentDialog } from "./on-call-assignment-dialog"

interface ManageOnCallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
}

export function ManageOnCallDialog({ open, onOpenChange, onRefresh }: ManageOnCallDialogProps) {
  const [onCallType, setOnCallType] = useState<string>("liaison")
  const [schedules, setSchedules] = useState<any[]>([])
  const [coverage, setCoverage] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
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
    if (open) {
      fetchData()
    }
  }, [open, onCallType])

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

      const [schedulesRes, coverageRes] = await Promise.all([
        fetch(`/api/on-call?${params}`),
        fetch(`/api/on-call/coverage?${params}`),
      ])

      if (schedulesRes.ok) {
        const data = await schedulesRes.json()
        setSchedules(data.schedules || [])
      }

      if (coverageRes.ok) {
        const data = await coverageRes.json()
        setCoverage(data.coverage)
      }
    } catch (error) {
      console.error("Error fetching on-call data:", error)
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
        onRefresh()
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
    onRefresh()
  }

  const sendGapReport = async () => {
    toast({
      title: "Coming Soon",
      description: "Gap report generation will be implemented next",
    })
  }

  const send30DayReport = async () => {
    toast({
      title: "Coming Soon",
      description: "30-day report generation will be implemented next",
    })
  }

  const sendIndividualReports = async () => {
    toast({
      title: "Coming Soon",
      description: "Individual assignee reports will be implemented next",
    })
  }

  const gaps = coverage?.gaps || []
  const coveragePercentage = coverage?.covered_percentage || 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-refuge-purple" />
              Manage On-Call Schedule
            </DialogTitle>
            <DialogDescription>
              View assignments, identify gaps, and generate reports for the next 30 days
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Filter and Actions Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">On-Call Type:</label>
                <Select value={onCallType} onValueChange={setOnCallType}>
                  <SelectTrigger className="w-[200px]">
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
              </div>

              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            </div>

            {/* Coverage Summary */}
            <Card className={coveragePercentage === 100 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
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
                    <Button onClick={sendGapReport} size="sm" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Gap Report
                    </Button>
                    <Button onClick={send30DayReport} size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      30-Day Report
                    </Button>
                    <Button onClick={sendIndividualReports} size="sm" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Send to Assignees
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  <p className="text-center text-gray-500 py-8">Loading...</p>
                ) : schedules.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Assignments</AlertTitle>
                    <AlertDescription>
                      No on-call assignments found for the next 30 days. Click "Add Assignment" to schedule coverage.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {schedules.map((schedule) => {
                      const start = parseLocalDatetime(schedule.start_datetime)
                      const end = parseLocalDatetime(schedule.end_datetime)
                      
                      return (
                        <Card key={schedule.id} className="border-refuge-purple/20">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="bg-purple-50">
                                    {schedule.user_name}
                                  </Badge>
                                  {schedule.priority_level === "high" && (
                                    <Badge variant="destructive">High Priority</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(start, "MMM d, h:mm a")} - {format(end, "MMM d, h:mm a")}
                                  </div>
                                  {schedule.user_phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {schedule.user_phone}
                                    </div>
                                  )}
                                </div>
                                {schedule.notes && (
                                  <p className="text-sm text-gray-500 mt-2">{schedule.notes}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(schedule)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(schedule.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
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
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {gaps.map((gap: any, index: number) => {
                      const gapStart = new Date(gap.gap_start)
                      const gapEnd = new Date(gap.gap_end)
                      const hours = gap.gap_hours.toFixed(1)
                      
                      return (
                        <Alert key={index} variant="destructive" className="border-red-200">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Coverage Gap ({hours} hours)</AlertTitle>
                          <AlertDescription>
                            <div className="space-y-1">
                              <p>{format(gapStart, "MMM d, yyyy h:mm a")} - {format(gapEnd, "MMM d, yyyy h:mm a")}</p>
                              {gap.message && <p className="text-sm">{gap.message}</p>}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  )
}

