"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, User, Clock, Phone, Calendar as CalendarIcon, Eye, CheckSquare, Square } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface IndividualReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedules: any[]
  onCallType: string
}

interface AssigneeWithSchedules {
  userId: string
  name: string
  email: string
  phone?: string
  schedules: any[]
  totalHours: number
  selected: boolean
}

export function IndividualReportDialog({ open, onOpenChange, schedules, onCallType }: IndividualReportDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [assignees, setAssignees] = useState<AssigneeWithSchedules[]>([])
  const [sending, setSending] = useState(false)
  const [expandedAssignee, setExpandedAssignee] = useState<string | null>(null)
  const { toast } = useToast()

  // Initialize assignees when dialog opens or schedules change
  useState(() => {
    if (open && schedules.length > 0) {
      const uniqueUsers = Array.from(new Set(schedules.map(s => s.user_id)))
      const assigneesList: AssigneeWithSchedules[] = uniqueUsers.map(userId => {
        const userSchedules = schedules.filter(s => s.user_id === userId)
        const firstSchedule = userSchedules[0]
        const totalHours = userSchedules.reduce((sum, s) => {
          const start = new Date(s.start_datetime)
          const end = new Date(s.end_datetime)
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        }, 0)

        return {
          userId,
          name: firstSchedule.user_name,
          email: firstSchedule.user_email,
          phone: firstSchedule.user_phone,
          schedules: userSchedules,
          totalHours,
          selected: false,
        }
      }).sort((a, b) => a.name.localeCompare(b.name))

      setAssignees(assigneesList)
    }
  })

  const filteredAssignees = assignees.filter(assignee =>
    assignee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignee.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCount = assignees.filter(a => a.selected).length

  const toggleAssignee = (userId: string) => {
    setAssignees(prev => prev.map(a =>
      a.userId === userId ? { ...a, selected: !a.selected } : a
    ))
  }

  const toggleAll = () => {
    const allSelected = filteredAssignees.every(a => a.selected)
    setAssignees(prev => prev.map(a => ({
      ...a,
      selected: filteredAssignees.some(fa => fa.userId === a.userId) ? !allSelected : a.selected
    })))
  }

  const toggleExpanded = (userId: string) => {
    setExpandedAssignee(expandedAssignee === userId ? null : userId)
  }

  const handleSendReports = async () => {
    const selectedAssignees = assignees.filter(a => a.selected)
    
    if (selectedAssignees.length === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one assignee to send reports to.",
        variant: "destructive",
      })
      return
    }

    if (!window.confirm(`Send individual reports to ${selectedAssignees.length} selected assignee(s)?`)) {
      return
    }

    setSending(true)
    let successCount = 0
    let errorCount = 0

    toast({
      title: "Sending Reports...",
      description: `Sending to ${selectedAssignees.length} assignee(s)...`,
    })

    for (const assignee of selectedAssignees) {
      const reportData = {
        assignee: {
          name: assignee.name,
          email: assignee.email,
          phone: assignee.phone,
        },
        schedules: assignee.schedules,
        totalHours: assignee.totalHours.toFixed(1),
      }

      try {
        const response = await fetch('/api/on-call/reports/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportType: 'individual',
            recipientEmail: assignee.email,
            reportData,
            onCallType,
          }),
        })

        if (response.ok) {
          successCount++
        } else {
          errorCount++
          console.error(`Failed to send report to ${assignee.name}`)
        }
      } catch (error) {
        errorCount++
        console.error(`Error sending report to ${assignee.name}:`, error)
      }
    }

    setSending(false)

    // Show summary and close dialog
    onOpenChange(false)
    
    setTimeout(() => {
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: "✓ All Reports Sent",
          description: `Successfully sent ${successCount} personalized report(s) with calendar attachments.`,
        })
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: "Partially Complete",
          description: `Sent ${successCount} report(s). ${errorCount} failed.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed to Send Reports",
          description: "Unable to send any reports. Please try again.",
          variant: "destructive",
        })
      }
    }, 100)

    // Reset selections
    setAssignees(prev => prev.map(a => ({ ...a, selected: false })))
    setSearchTerm("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-refuge-purple" />
            Send Individual Reports
          </DialogTitle>
          <DialogDescription>
            Select assignees to receive their personalized schedule with calendar attachment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Select All */}
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              disabled={filteredAssignees.length === 0}
            >
              {filteredAssignees.every(a => a.selected) ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select All
                </>
              )}
            </Button>
          </div>

          {/* Selected Count */}
          {selectedCount > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-900">
                <strong>{selectedCount}</strong> assignee{selectedCount !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Assignees List */}
          <div className="h-[400px] overflow-y-auto pr-4">
            {filteredAssignees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No assignees found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssignees.map((assignee) => (
                  <Card key={assignee.userId} className={assignee.selected ? "border-purple-300 bg-purple-50" : ""}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header with checkbox */}
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={assignee.selected}
                            onCheckedChange={() => toggleAssignee(assignee.userId)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{assignee.name}</h4>
                                <p className="text-sm text-gray-600">{assignee.email}</p>
                                {assignee.phone && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {assignee.phone}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="mb-1">
                                  {assignee.schedules.length} shift{assignee.schedules.length !== 1 ? 's' : ''}
                                </Badge>
                                <p className="text-xs text-gray-500">{assignee.totalHours.toFixed(1)} hours</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => toggleExpanded(assignee.userId)}
                        >
                          <Eye className="h-3 w-3 mr-2" />
                          {expandedAssignee === assignee.userId ? "Hide" : "View"} Schedule Details
                        </Button>

                        {/* Expanded Schedule Details */}
                        {expandedAssignee === assignee.userId && (
                          <div className="border-t pt-3 space-y-2">
                            {assignee.schedules.map((schedule, idx) => {
                              const start = new Date(schedule.start_datetime)
                              const end = new Date(schedule.end_datetime)
                              const hours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1)
                              
                              return (
                                <div key={idx} className="bg-white rounded border p-2 text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">Shift {idx + 1}</span>
                                    <Badge variant="outline" className="text-xs">{hours}h</Badge>
                                  </div>
                                  <div className="text-gray-600 space-y-0.5">
                                    <p><CalendarIcon className="h-3 w-3 inline mr-1" />{format(start, "EEE, MMM d, h:mm a")}</p>
                                    <p className="ml-4">to {format(end, "EEE, MMM d, h:mm a")}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSendReports} disabled={selectedCount === 0 || sending}>
            {sending ? (
              <>Sending...</>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send to {selectedCount > 0 ? selectedCount : ''} Selected
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

