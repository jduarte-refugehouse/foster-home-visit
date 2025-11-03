"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  type: string
}

export function OnCallAssignmentDialog({
  children,
  onAssignmentCreated,
  editingAssignment,
  selectedDate,
  selectedTime,
}: OnCallAssignmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [conflictCheck, setConflictCheck] = useState<{ hasConflict: boolean; message?: string } | null>(null)

  const [formData, setFormData] = useState({
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
    })
  }

  const handleStaffSelect = (staffId: string) => {
    const staff = staffMembers.find((s) => s.id === staffId)
    if (staff) {
      setFormData((prev) => ({
        ...prev,
        userId: staff.id,
        userName: staff.name,
        userEmail: staff.email || "",
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

      const url = editingAssignment ? `/api/on-call/${editingAssignment.id}` : "/api/on-call"
      const method = editingAssignment ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formData.userId || null,
          userName: formData.userName,
          userEmail: formData.userEmail || null,
          userPhone: formData.userPhone || null,
          startDatetime,
          endDatetime,
          notes: formData.notes || null,
          priorityLevel: formData.priorityLevel,
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
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.userPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, userPhone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
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

          {/* Priority Level */}
          <div className="space-y-2">
            <Label>Priority Level</Label>
            <Select value={formData.priorityLevel} onValueChange={(value) => setFormData((prev) => ({ ...prev, priorityLevel: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="backup">Backup</SelectItem>
              </SelectContent>
            </Select>
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
          <div className="flex justify-end gap-2 pt-4">
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
        </form>
      </DialogContent>
    </Dialog>
  )
}

