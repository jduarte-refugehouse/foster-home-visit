"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@refugehouse/shared-core/components/ui/dialog"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Card, CardContent } from "@refugehouse/shared-core/components/ui/card"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Mail, X, AlertTriangle, Clock, User, Phone, Calendar as CalendarIcon } from "lucide-react"
import { format, min, max, addDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { ReportTimeline } from "./report-timeline"
import { CoverageTimeline } from "./coverage-timeline"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@refugehouse/shared-core/components/ui/tabs"

interface ReportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportType: "gap" | "schedule" | "individual"
  reportData: any
  onCallType: string
}

export function ReportPreviewDialog({ open, onOpenChange, reportType, reportData, onCallType }: ReportPreviewDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState("")
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  // Reset sending state when dialog closes or report changes
  useEffect(() => {
    if (!open) {
      setSending(false)
      setRecipientEmail("")
    }
  }, [open])

  useEffect(() => {
    setSending(false)
  }, [reportType, reportData])

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: "Email Required",
        description: "Please enter a recipient email address",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/on-call/reports/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          recipientEmail,
          reportData,
          onCallType,
        }),
      })

      if (response.ok) {
        // Close dialog immediately
        onOpenChange(false)
        
        // Show success toast after closing
        setTimeout(() => {
          toast({
            title: "✓ Report Sent Successfully",
            description: `The report has been emailed to ${recipientEmail}`,
          })
        }, 100)
        
        // Reset state
        setRecipientEmail("")
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to send report")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send report"
      toast({
        title: "Error Sending Report",
        description: errorMessage + ". Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const renderGapReport = () => {
    if (!reportData) return null
    const { gaps, coveragePercentage, schedules = [] } = reportData
    
    // Calculate date range from schedules and gaps
    const allDates = [
      ...schedules.map((s: any) => [new Date(s.start_datetime), new Date(s.end_datetime)]),
      ...gaps.map((g: any) => [new Date(g.gap_start), new Date(g.gap_end)]),
    ].flat()
    
    const startDate = allDates.length > 0 ? min(allDates) : new Date()
    const endDate = allDates.length > 0 ? max(allDates) : addDays(new Date(), 30)
    
    return (
      <div className="space-y-4">
        <Card className={coveragePercentage === 100 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Coverage Status</p>
                <p className="text-2xl font-bold">{coveragePercentage}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{gaps.length} Gap(s) Detected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <div className="max-h-[500px] overflow-y-auto">
              <CoverageTimeline 
                schedules={schedules} 
                gaps={gaps} 
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {gaps.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No coverage gaps - Full 24/7 coverage</p>
              ) : (
                gaps.map((gap: any, index: number) => {
                  const start = new Date(gap.gap_start)
                  const end = new Date(gap.gap_end)
                  return (
                    <Card key={index} className="border-red-200">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-red-700">Gap {index + 1}: {gap.gap_hours.toFixed(1)} hours</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Clock className="h-3 w-3" />
                              {format(start, "MMM d, h:mm a")} - {format(end, "MMM d, h:mm a")}
                            </div>
                            {gap.message && <p className="text-sm text-gray-600 mt-2">{gap.message}</p>}
                          </div>
                          <Badge variant="destructive">{gap.severity}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  const renderScheduleReport = () => {
    if (!reportData) return null
    const { schedules, coverage } = reportData
    
    // Calculate date range from schedules
    const allDates = schedules.flatMap((s: any) => [new Date(s.start_datetime), new Date(s.end_datetime)])
    const startDate = allDates.length > 0 ? min(allDates) : new Date()
    const endDate = allDates.length > 0 ? max(allDates) : addDays(new Date(), 30)
    
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Coverage</p>
                <p className="text-2xl font-bold">{coverage?.covered_percentage || 0}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Assignees</p>
                <p className="text-2xl font-bold">{new Set(schedules.map((s: any) => s.user_id)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <div className="max-h-[500px] overflow-y-auto">
              <CoverageTimeline 
                schedules={schedules} 
                gaps={coverage?.gaps || []} 
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {schedules.map((schedule: any, index: number) => {
                const start = new Date(schedule.start_datetime)
                const end = new Date(schedule.end_datetime)
                return (
                  <Card key={index} className="border-purple-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{schedule.user_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            {format(start, "MMM d, h:mm a")} - {format(end, "MMM d, h:mm a")}
                          </div>
                          {schedule.user_phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {schedule.user_phone}
                            </div>
                          )}
                        </div>
                        {schedule.priority_level === "high" && (
                          <Badge variant="destructive">High Priority</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  const renderIndividualReport = () => {
    if (!reportData) return null
    const { assignee, schedules, totalHours } = reportData
    
    // Calculate date range from schedules
    const allDates = schedules.flatMap((s: any) => [new Date(s.start_datetime), new Date(s.end_datetime)])
    const startDate = allDates.length > 0 ? min(allDates) : new Date()
    const endDate = allDates.length > 0 ? max(allDates) : addDays(new Date(), 30)
    
    return (
      <div className="space-y-4">
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assignee</p>
                <p className="text-lg font-bold">{assignee.name}</p>
                <p className="text-sm text-gray-600">{assignee.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Shifts</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
                <p className="text-sm text-gray-600">{totalHours} hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <div className="max-h-[500px] overflow-y-auto">
              <CoverageTimeline 
                schedules={schedules}
                gaps={[]}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {schedules.map((schedule: any, index: number) => {
                const start = new Date(schedule.start_datetime)
                const end = new Date(schedule.end_datetime)
                const hours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1)
                return (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Shift {index + 1}</p>
                          <Badge variant="outline">{hours} hours</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{format(start, "EEEE, MMM d, yyyy")}</p>
                          <p>{format(start, "h:mm a")} - {format(end, "h:mm a")}</p>
                        </div>
                        {schedule.notes && (
                          <p className="text-sm text-gray-600 border-t pt-2">{schedule.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  const getTitle = () => {
    switch (reportType) {
      case "gap": return `Coverage Gap Report - ${onCallType}`
      case "schedule": return `30-Day Schedule Report - ${onCallType}`
      case "individual": return `Individual Schedule Report - ${onCallType}`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-refuge-purple" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            Preview the report below and enter an email address to send it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {reportType === "gap" && renderGapReport()}
          {reportType === "schedule" && renderScheduleReport()}
          {reportType === "individual" && renderIndividualReport()}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="flex gap-2 items-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sending || !recipientEmail}>
              <Mail className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : "Send Report"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

