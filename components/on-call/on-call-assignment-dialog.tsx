"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, User, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface OnCallAssignmentDialogProps {
  children?: React.ReactNode
  onAssignmentCreated?: () => void
  editingAssignment?: any
  selectedDate?: Date
  selectedTime?: string
  onDelete?: (scheduleId: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface StaffMember {
  id: string
  appUserId?: string
  name: string
  email: string
  phone?: string | null
  role: string
  type: string
}

export function OnCallAssignmentDialog({
  children,
  onAssignmentCreated,
  editingAssignment,
  selectedDate,
  selectedTime,
  onDelete,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: OnCallAssignmentDialogProps) {
  const { user } = useUser()
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [conflictCheck, setConflictCheck] = useState<{ hasConflict: boolean; message?: string } | null>(null)

  // Use controlled open state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const [formData, setFormData] = useState({
    userId: "",
    appUserId: "",
    userName: "",
    userEmail: "",
    userPhone: "",
    phoneFromDatabase: false, // Track if phone came from app_users
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    notes: "",
    priorityLevel: "normal",
    // Enhanced fields for multiple on-call scenarios
    onCallType: "general",
    onCallCategory: "",
    roleRequired: "",
    department: "",
    region: "",
    escalationLevel: 1,
  })

  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchStaffMembers()
      if (editingAssignment) {
        populateEditForm()
      } else if (selectedDate) {
        setFormData((prev) => ({
          ...prev,
          startDate: selectedDate.toISOString().split("T")[0],
          startTime: selectedTime || "09:00",
        }))
      }
    }
  }, [open, editingAssignment, selectedDate, selectedTime])

  const fetchStaffMembers = async () => {
    try {
      const response = await fetch("/api/appointments/staff")
      if (response.ok) {
        const data = await response.json()
        const allStaff = [...(data.staff || []), ...(data.caseManagers || [])]
        setStaffMembers(allStaff)
      }
    } catch (error) {
      console.error("Error fetching staff:", error)
    }
  }

  const populateEditForm = () => {
    if (!editingAssignment) return

    const startDate = new Date(editingAssignment.start_datetime)
    const endDate = new Date(editingAssignment.end_datetime)

    setFormData({
      userId: editingAssignment.user_id || "",
      userName: editingAssignment.user_name || "",
      userEmail: editingAssignment.user_email || "",
      userPhone: editingAssignment.user_phone || "",
      startDate: startDate.toISOString().split("T")[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endDate: endDate.toISOString().split("T")[0],
      endTime: endDate.toTimeString().slice(0, 5),
      notes: editingAssignment.notes || "",
      priorityLevel: editingAssignment.priority_level || "normal",
      onCallType: editingAssignment.on_call_type || "general",
      onCallCategory: editingAssignment.on_call_category || "",
      roleRequired: editingAssignment.role_required || "",
      department: editingAssignment.department || "",
      region: editingAssignment.region || "",
      escalationLevel: editingAssignment.escalation_level || 1,
    })
  }

  const handleStaffSelect = (staffId: string) => {
    const staff = staffMembers.find((s) => s.id === staffId)
    if (staff) {
      setFormData((prev) => ({
        ...prev,
        userId: staff.id,
        appUserId: staff.appUserId || "",
        userName: staff.name,
        userEmail: staff.email || "",
        userPhone: staff.phone || "",
        phoneFromDatabase: !!staff.phone, // True if phone exists in database
      }))
    }
  }

  const checkForConflicts = async () => {
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      return
    }

    const startDatetime = `${formData.startDate}T${formData.startTime}:00`
    const endDatetime = `${formData.endDate}T${formData.endTime}:00`

    try {
      const response = await fetch(
        `/api/on-call?startDate=${startDatetime}&endDate=${endDatetime}${formData.userId ? `&userId=${formData.userId}` : ""}`,
      )
      if (response.ok) {
        const data = await response.json()
        const conflicts = data.schedules.filter((s: any) => s.id !== editingAssignment?.id)

        if (conflicts.length > 0) {
          setConflictCheck({
            hasConflict: true,
            message: `${conflicts[0].user_name} is already scheduled during this time`,
          })
        } else {
          setConflictCheck({
            hasConflict: false,
            message: "No conflicts found",
          })
        }
      }
    } catch (error) {
      console.error("Error checking conflicts:", error)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
        checkForConflicts()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime, formData.userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.userName) {
        toast({
          title: "Validation Error",
          description: "Please select a staff member",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
        toast({
          title: "Validation Error",
          description: "Please fill in all date and time fields",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Create datetime strings in local timezone (no conversion)
      // This ensures the times you select are the times that get stored
      const startDatetime = `${formData.startDate}T${formData.startTime}:00`
      const endDatetime = `${formData.endDate}T${formData.endTime}:00`

      if (new Date(endDatetime) <= new Date(startDatetime)) {
        toast({
          title: "Validation Error",
          description: "End time must be after start time",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Validate phone number is provided if not from database
      if (formData.userId && !formData.phoneFromDatabase && !formData.userPhone) {
        toast({
          title: "Validation Error",
          description: "Phone number is required. It will be saved to your user profile.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const url = editingAssignment ? `/api/on-call/${editingAssignment.id}` : "/api/on-call"
      const method = editingAssignment ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formData.userId || null,
          appUserId: formData.appUserId || null,
          userName: formData.userName,
          userEmail: formData.userEmail || null,
          userPhone: formData.userPhone || null,
          phoneFromDatabase: formData.phoneFromDatabase,
          startDatetime,
          endDatetime,
          notes: formData.notes || null,
          priorityLevel: formData.priorityLevel,
          onCallType: formData.onCallType || "general",
          onCallCategory: formData.onCallCategory || null,
          roleRequired: formData.roleRequired || null,
          department: formData.department || null,
          region: formData.region || null,
          escalationLevel: formData.escalationLevel || 1,
          createdByUserId: user?.id || "system",
          createdByName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.primaryEmailAddress?.emailAddress || "Unknown" : "System",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === "OVERLAP_CONFLICT") {
          toast({
            title: "Scheduling Conflict",
            description: data.error || "This person already has an overlapping on-call assignment",
            variant: "destructive",
          })
        } else {
          throw new Error(data.error || "Failed to save on-call assignment")
        }
        setLoading(false)
        return
      }

      toast({
        title: "Success",
        description: editingAssignment ? "On-call assignment updated successfully" : "On-call assignment created successfully",
      })

      setOpen(false)
      resetForm()
      onAssignmentCreated?.()
    } catch (error) {
      console.error("Error saving on-call assignment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save on-call assignment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      userId: "",
      userName: "",
      userEmail: "",
      userPhone: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      notes: "",
      priorityLevel: "normal",
      onCallType: "general",
      onCallCategory: "",
      roleRequired: "",
      department: "",
      region: "",
      escalationLevel: 1,
    })
    setConflictCheck(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-refuge-purple" />
            {editingAssignment ? "Edit On-Call Assignment" : "Create On-Call Assignment"}
          </DialogTitle>
          <DialogDescription>
            {editingAssignment 
              ? "Update the on-call assignment details below." 
              : "Schedule a staff member for on-call duty. The system will check for conflicts with existing assignments."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Staff Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Staff Member *
            </Label>
            <Select value={formData.userId} onValueChange={handleStaffSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name} ({staff.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manual Name Entry (fallback) */}
          {!formData.userId && (
            <div className="space-y-2">
              <Label>Or Enter Name Manually *</Label>
              <Input
                value={formData.userName}
                onChange={(e) => setFormData((prev) => ({ ...prev, userName: e.target.value }))}
                placeholder="Full Name"
              />
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.userEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, userEmail: e.target.value }))}
                placeholder="email@refugehouse.org"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Phone {!formData.phoneFromDatabase && formData.userId && <span className="text-red-500">*</span>}
                {formData.phoneFromDatabase && <span className="text-xs text-gray-500 ml-2">(from database)</span>}
              </Label>
              <Input
                type="tel"
                value={formData.userPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, userPhone: e.target.value }))}
                placeholder="(555) 123-4567"
                disabled={formData.phoneFromDatabase}
                className={formData.phoneFromDatabase ? "bg-gray-50" : ""}
                required={!formData.phoneFromDatabase && !!formData.userId}
              />
              {!formData.phoneFromDatabase && formData.userId && formData.userPhone === "" && (
                <p className="text-xs text-amber-600">
                  ⚠️ Phone number required. It will be saved to your user profile.
                </p>
              )}
            </div>
          </div>

          {/* Start Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date *
              </Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time *
              </Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* End Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date *
              </Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Time *
              </Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Conflict Check Alert */}
          {conflictCheck && (
            <Alert variant={conflictCheck.hasConflict ? "destructive" : "default"}>
              {conflictCheck.hasConflict ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <AlertDescription>{conflictCheck.message}</AlertDescription>
            </Alert>
          )}

          {/* On-Call Type */}
          <div className="space-y-2">
            <Label>On-Call Type</Label>
            <Select value={formData.onCallType} onValueChange={(value) => setFormData((prev) => ({ ...prev, onCallType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select on-call type" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="general">General On-Call</SelectItem>
                <SelectItem value="crisis_response">Crisis Response</SelectItem>
                <SelectItem value="medical">Medical On-Call</SelectItem>
                <SelectItem value="supervisor">Supervisor On-Call</SelectItem>
                <SelectItem value="liaison">Liaison On-Call</SelectItem>
                <SelectItem value="case_manager">Case Manager On-Call</SelectItem>
                <SelectItem value="after_hours">After Hours On-Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role and Department - Two columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role Required (Optional)</Label>
              <Select value={formData.roleRequired || "none"} onValueChange={(value) => setFormData((prev) => ({ ...prev, roleRequired: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any role" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="none">Any Role</SelectItem>
                  <SelectItem value="liaison">Liaison</SelectItem>
                  <SelectItem value="case_manager">Case Manager</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department (Optional)</Label>
              <Select value={formData.department || "none"} onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any department" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="none">Any Department</SelectItem>
                  <SelectItem value="foster_care">Foster Care</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                  <SelectItem value="clinical">Clinical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category and Escalation - Two columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>On-Call Category (Optional)</Label>
              <Select value={formData.onCallCategory || "none"} onValueChange={(value) => setFormData((prev) => ({ ...prev, onCallCategory: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="none">No Category</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                  <SelectItem value="escalation">Escalation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Escalation Level</Label>
              <Select 
                value={formData.escalationLevel.toString()} 
                onValueChange={(value) => setFormData((prev) => ({ ...prev, escalationLevel: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="1">Level 1 (Primary)</SelectItem>
                  <SelectItem value="2">Level 2 (Backup)</SelectItem>
                  <SelectItem value="3">Level 3 (Tertiary)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Region (Optional) */}
          <div className="space-y-2">
            <Label>Region (Optional)</Label>
            <Input
              value={formData.region}
              onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
              placeholder="e.g., North, South, East, West, County Name"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any relevant notes about this on-call assignment..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4">
            {/* Delete button - only show when editing */}
            {editingAssignment && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete this on-call assignment for ${editingAssignment.user_name}?`)) {
                    onDelete(editingAssignment.id)
                  }
                }}
                disabled={loading}
              >
                Delete
              </Button>
            )}
            
            {/* Spacer to push Cancel/Save to the right */}
            {!editingAssignment && <div className="flex-1"></div>}
            
            {/* Cancel and Save buttons */}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-refuge-purple hover:bg-refuge-purple-dark text-white"
                disabled={loading || (conflictCheck?.hasConflict ?? false)}
              >
                {loading ? "Saving..." : editingAssignment ? "Update Assignment" : "Create Assignment"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

