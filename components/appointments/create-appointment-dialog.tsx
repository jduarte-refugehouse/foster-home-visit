"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

interface CreateAppointmentDialogProps {
  children: React.ReactNode
  selectedDate?: Date
  selectedTime?: string
  onAppointmentCreated?: () => void
}

export function CreateAppointmentDialog({
  children,
  selectedDate,
  selectedTime,
  onAppointmentCreated,
}: CreateAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [homes, setHomes] = useState<Home[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    appointmentType: "home_visit",
    date: selectedDate || new Date(),
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
  })

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
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Create start and end datetime objects
      const startDateTime = new Date(formData.date)
      const [startHours, startMinutes] = formData.startTime.split(":").map(Number)
      startDateTime.setHours(startHours, startMinutes, 0, 0)

      const endDateTime = new Date(formData.date)
      const [endHours, endMinutes] = formData.endTime.split(":").map(Number)
      endDateTime.setHours(endHours, endMinutes, 0, 0)

      const appointmentData = {
        title: formData.title,
        description: formData.description,
        appointmentType: formData.appointmentType,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        homeXref: formData.homeXref ? Number.parseInt(formData.homeXref) : null,
        homeName: formData.homeName,
        locationAddress: formData.locationAddress,
        locationNotes: formData.locationNotes,
        assignedToUserId: formData.assignedToUserId,
        assignedToName: formData.assignedToName,
        assignedToRole: formData.assignedToRole,
        priority: formData.priority,
        preparationNotes: formData.preparationNotes,
        createdByName: "Current User", // This should come from auth context
      }

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      })

      if (!response.ok) {
        throw new Error("Failed to create appointment")
      }

      toast({
        title: "Success",
        description: "Appointment created successfully",
      })

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        appointmentType: "home_visit",
        date: new Date(),
        startTime: "09:00",
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
      })
      setOpen(false)
      onAppointmentCreated?.()
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Error",
        description: "Failed to create appointment",
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
      setFormData((prev) => ({
        ...prev,
        homeXref,
        homeName: selectedHome.name,
        locationAddress: selectedHome.address,
        title: prev.title || `${prev.appointmentType.replace("_", " ")} - ${selectedHome.name}`,
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Appointment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Home Visit - Johnson Family"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type</Label>
                <Select
                  value={formData.appointmentType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, appointmentType: value }))}
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
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData((prev) => ({ ...prev, date }))}
                      initialFocus
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
                <Label htmlFor="duration">Duration (min)</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To *</Label>
                <Select value={formData.assignedToUserId} onValueChange={handleStaffChange} disabled={loadingData}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Loading staff..." : "Select staff member"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.role})
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
              {loading ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
