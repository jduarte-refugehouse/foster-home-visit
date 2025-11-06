"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, MapPin, User, Plus } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Staff {
  id: string
  name: string
  email: string
  role: string
  type: "user" | "case_manager"
}

interface Home {
  xref: number
  name: string
  address: string
  caseManager: string
  phone: string
}

interface Appointment {
  appointment_id: string
  title: string
  start_datetime: string
  end_datetime: string
  status: "scheduled" | "completed" | "cancelled" | "in-progress" | "rescheduled"
  appointment_type: string
  home_name: string
  location_address: string
  assigned_to_name: string
  assigned_to_role: string
  priority: string
  description?: string
  preparation_notes?: string
  completion_notes?: string
  home_xref?: number
  assigned_to_user_id?: string
  location_notes?: string
}

interface CreateAppointmentDialogProps {
  children: React.ReactNode
  selectedDate?: Date
  selectedTime?: string
  editingAppointment?: Appointment | null
  onAppointmentCreated?: () => void
}

export function CreateAppointmentDialog({
  children,
  selectedDate,
  selectedTime,
  editingAppointment,
  onAppointmentCreated,
}: CreateAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [homes, setHomes] = useState<Home[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const { toast } = useToast()

  const initializeFormData = () => {
    if (editingAppointment) {
      const startDate = new Date(editingAppointment.start_datetime)
      const endDate = new Date(editingAppointment.end_datetime)
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))

      // Format date as YYYY-MM-DD string for the date input
      const dateString = format(startDate, "yyyy-MM-dd")

      return {
        title: editingAppointment.title,
        description: editingAppointment.description || "",
        appointmentType: editingAppointment.appointment_type,
        date: dateString, // Use string format for date input
        startTime: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        duration: duration.toString(),
        homeXref: editingAppointment.home_xref?.toString() || "",
        homeName: editingAppointment.home_name || "",
        locationAddress: editingAppointment.location_address || "",
        locationNotes: editingAppointment.location_notes || "",
        assignedToUserId: editingAppointment.assigned_to_user_id || "",
        assignedToName: editingAppointment.assigned_to_name,
        assignedToRole: editingAppointment.assigned_to_role,
        priority: editingAppointment.priority,
        preparationNotes: editingAppointment.preparation_notes || "",
      }
    }

    return {
      title: "",
      description: "",
      appointmentType: "home_visit",
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"), // Use string format
      startTime: selectedTime || "09:00",
      endTime: "",
      duration: "60",
      homeXref: "",
      homeName: "",
      locationAddress: "",
      locationNotes: "",
      assignedToUserId: "",
      assignedToName: "",
      assignedToRole: "",
      priority: "normal",
      preparationNotes: "",
    }
  }

  // Form state
  const [formData, setFormData] = useState(initializeFormData)

  useEffect(() => {
    setFormData(initializeFormData())
  }, [editingAppointment, selectedDate, selectedTime])

  // Load staff and homes data when dialog opens
  useEffect(() => {
    if (open && staff.length === 0) {
      loadStaffAndHomes()
    }
  }, [open])

  // Update end time when start time or duration changes
  useEffect(() => {
    if (formData.startTime && formData.duration) {
      const [hours, minutes] = formData.startTime.split(":").map(Number)
      const durationMinutes = Number.parseInt(formData.duration)
      const endDate = new Date()
      endDate.setHours(hours, minutes + durationMinutes)
      setFormData((prev) => ({
        ...prev,
        endTime: format(endDate, "HH:mm"),
      }))
    }
  }, [formData.startTime, formData.duration])

  const loadStaffAndHomes = async () => {
    setLoadingData(true)
    try {
      const [staffResponse, homesResponse] = await Promise.all([
        fetch("/api/appointments/staff"),
        fetch("/api/appointments/homes"),
      ])

      if (staffResponse.ok) {
        const staffData = await staffResponse.json()
        setStaff([...staffData.staff, ...staffData.caseManagers])
      }

      if (homesResponse.ok) {
        const homesData = await homesResponse.json()
        setHomes(homesData.homes)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load staff and homes data",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.title || !formData.assignedToUserId || !formData.assignedToName) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (title, assigned staff)",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Validate date and time fields
      if (!formData.date || !formData.startTime || !formData.endTime) {
        toast({
          title: "Validation Error",
          description: "Please select a date and time for the appointment",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Create start and end datetime objects in local timezone
      // Parse the date string and time separately to avoid timezone issues
      // IMPORTANT: Treat user input as local time, not UTC
      const dateParts = formData.date.split("-")
      if (dateParts.length !== 3) {
        toast({
          title: "Validation Error",
          description: "Invalid date format",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const [year, month, day] = dateParts.map(Number)
      const startTimeParts = formData.startTime.split(":")
      const endTimeParts = formData.endTime.split(":")
      
      if (startTimeParts.length < 2 || endTimeParts.length < 2) {
        toast({
          title: "Validation Error",
          description: "Invalid time format. Please use HH:mm format",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const [startHours, startMinutes] = startTimeParts.map(Number)
      const [endHours, endMinutes] = endTimeParts.map(Number)
      
      // Create dates using Date constructor with components (avoids timezone conversion)
      // This creates a date in LOCAL timezone
      const startDateTime = new Date(year, month - 1, day, startHours, startMinutes, 0, 0)
      const endDateTime = new Date(year, month - 1, day, endHours, endMinutes, 0, 0)

      // Format as ISO string but WITHOUT timezone (remove 'Z')
      // SQL Server DATETIME2 has no timezone, so we store as local time string
      // Format: YYYY-MM-DDTHH:mm:ss (no Z, no timezone offset)
      const formatLocalISO = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
      }

      const appointmentData = {
        title: formData.title,
        description: formData.description,
        appointmentType: formData.appointmentType,
        startDateTime: formatLocalISO(startDateTime),
        endDateTime: formatLocalISO(endDateTime),
        homeXref: formData.homeXref ? Number.parseInt(formData.homeXref) : null,
        homeName: formData.homeName,
        locationAddress: formData.locationAddress,
        locationNotes: formData.locationNotes,
        assignedToUserId: formData.assignedToUserId,
        assignedToName: formData.assignedToName,
        assignedToRole: formData.assignedToRole,
        priority: formData.priority,
        preparationNotes: formData.preparationNotes,
        createdByName: "System User",
      }

      const isEditing = !!editingAppointment
      const url = isEditing ? `/api/appointments/${editingAppointment.appointment_id}` : "/api/appointments"
      const method = isEditing ? "PUT" : "POST"

      console.log("📅 [DIALOG] Submitting appointment:", appointmentData)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        const errorMessage = responseData.error || responseData.details || `Failed to ${isEditing ? "update" : "create"} appointment`
        console.error("❌ [DIALOG] Appointment API error:", {
          status: response.status,
          error: errorMessage,
          responseData,
        })
        throw new Error(errorMessage)
      }

      toast({
        title: "Success",
        description: `Appointment ${isEditing ? "updated" : "created"} successfully`,
      })

      // Reset form and close dialog
      setFormData(initializeFormData())
      setOpen(false)
      onAppointmentCreated?.()
    } catch (error) {
      console.error(`Error ${editingAppointment ? "updating" : "creating"} appointment:`, error)
      toast({
        title: "Error",
        description: `Failed to ${editingAppointment ? "update" : "create"} appointment`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStaffChange = (staffId: string) => {
    const selectedStaff = staff.find((s) => s.id === staffId)
    if (selectedStaff) {
      setFormData((prev) => ({
        ...prev,
        assignedToUserId: selectedStaff.id,
        assignedToName: selectedStaff.name,
        assignedToRole: selectedStaff.role,
      }))
    }
  }

  const handleHomeChange = (homeXref: string) => {
    const selectedHome = homes.find((h) => h.xref.toString() === homeXref)
    if (selectedHome) {
      // Auto-generate title based on appointment type and home name
      const appointmentTypeLabel = formData.appointmentType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
      const newTitle = `${appointmentTypeLabel} - ${selectedHome.name}`
      
      setFormData((prev) => ({
        ...prev,
        homeXref,
        homeName: selectedHome.name,
        locationAddress: selectedHome.address,
        title: newTitle, // Always update title when home changes
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingAppointment ? "Edit Appointment" : "Create New Appointment"}
          </DialogTitle>
          <DialogDescription>
            {editingAppointment
              ? "Update the appointment details below."
              : "Schedule a new appointment with foster homes and assign staff members."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title * (Auto-generated)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  readOnly
                  className="bg-muted"
                  placeholder="Select home and type to generate title"
                  required
                />
                <p className="text-xs text-muted-foreground">Title is automatically generated from appointment type and home name</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type</Label>
                <Select
                  value={formData.appointmentType}
                  onValueChange={(value) => {
                    setFormData((prev) => {
                      // Auto-update title when type changes if home is selected
                      const appointmentTypeLabel = value.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
                      const newTitle = prev.homeName ? `${appointmentTypeLabel} - ${prev.homeName}` : prev.title
                      return { ...prev, appointmentType: value, title: newTitle }
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home_visit">Home Visit</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="court_hearing">Court Hearing</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the appointment purpose"
                rows={2}
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date & Time
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !formData.date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {formData.date ? format(new Date(formData.date + "T00:00:00"), "MMMM do, yyyy") : "Pick a date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={8} alignOffset={0}>
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date + "T00:00:00") : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData((prev) => ({ ...prev, date: format(date, "yyyy-MM-dd") }))
                        }
                      }}
                      initialFocus
                      className="rounded-md border-0"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell:
                          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex items-center justify-center",
                        row: "flex w-full mt-2",
                        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                        day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                        day_range_end: "day-range-end",
                        day_selected:
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground font-semibold",
                        day_outside:
                          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" value={formData.endTime} readOnly className="bg-muted" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="home">Foster Home</Label>
                <Select value={formData.homeXref} onValueChange={handleHomeChange} disabled={loadingData}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading homes..." : "Select a home"} />
                  </SelectTrigger>
                  <SelectContent>
                    {homes.map((home) => (
                      <SelectItem key={home.xref} value={home.xref.toString()}>
                        {home.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationAddress">Address</Label>
                <Input
                  id="locationAddress"
                  value={formData.locationAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, locationAddress: e.target.value }))}
                  placeholder="Full address"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationNotes">Location Notes</Label>
              <Textarea
                id="locationNotes"
                value={formData.locationNotes}
                onChange={(e) => setFormData((prev) => ({ ...prev, locationNotes: e.target.value }))}
                placeholder="Special instructions, parking info, etc."
                rows={2}
              />
            </div>
          </div>

          {/* Staff Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Staff Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To *</Label>
                <Select value={formData.assignedToUserId} onValueChange={handleStaffChange} disabled={loadingData}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading staff..." : "Select staff member"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preparation Notes */}
          <div className="space-y-2">
            <Label htmlFor="preparationNotes">Preparation Notes</Label>
            <Textarea
              id="preparationNotes"
              value={formData.preparationNotes}
              onChange={(e) => setFormData((prev) => ({ ...prev, preparationNotes: e.target.value }))}
              placeholder="Items to bring, forms needed, special preparations..."
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? editingAppointment
                  ? "Updating..."
                  : "Creating..."
                : editingAppointment
                  ? "Update Appointment"
                  : "Create Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
