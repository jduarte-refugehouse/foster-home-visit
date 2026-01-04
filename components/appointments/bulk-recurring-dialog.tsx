"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@refugehouse/shared-core/components/ui/dialog"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Textarea } from "@refugehouse/shared-core/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@refugehouse/shared-core/components/ui/select"
import { Calendar, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Home {
  xref: number
  name: string
  address: string
}

interface BulkRecurringDialogProps {
  children: React.ReactNode
  onAppointmentsCreated?: () => void
}

export function BulkRecurringDialog({
  children,
  onAppointmentsCreated,
}: BulkRecurringDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [homes, setHomes] = useState<Home[]>([])
  const [loadingHomes, setLoadingHomes] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    homeXref: "",
    locationAddress: "",
    locationNotes: "",
    recurringPattern: "first_monday", // first_monday, second_tuesday, etc.
    startYear: "2026",
    endYear: "2026",
    time: "16:00", // 4pm default
    durationMinutes: "60",
    priority: "normal",
    preparationNotes: "",
  })

  // Load homes when dialog opens
  const loadHomes = async () => {
    if (homes.length > 0) return // Already loaded
    
    setLoadingHomes(true)
    try {
      const response = await fetch("/api/homes-list")
      if (response.ok) {
        const data = await response.json()
        setHomes(data.homes || [])
      }
    } catch (error) {
      console.error("Error loading homes:", error)
    } finally {
      setLoadingHomes(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      loadHomes()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.recurringPattern || !formData.startYear || !formData.time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/appointments/bulk-recurring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          appointmentType: "home_visit",
          homeXref: formData.homeXref ? Number.parseInt(formData.homeXref) : null,
          locationAddress: formData.locationAddress || null,
          locationNotes: formData.locationNotes || null,
          assignedToUserId: null, // Unassigned
          assignedToName: null,   // Unassigned
          assignedToRole: null,
          priority: formData.priority,
          preparationNotes: formData.preparationNotes || null,
          createdByName: "System",
          recurringPattern: formData.recurringPattern,
          startYear: Number.parseInt(formData.startYear),
          endYear: Number.parseInt(formData.endYear),
          time: formData.time,
          durationMinutes: Number.parseInt(formData.durationMinutes),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success!",
          description: `Created ${data.created} recurring appointments for ${formData.startYear}`,
        })
        setOpen(false)
        // Reset form
        setFormData({
          title: "",
          description: "",
          homeXref: "",
          locationAddress: "",
          locationNotes: "",
          recurringPattern: "first_monday",
          startYear: "2026",
          endYear: "2026",
          time: "16:00",
          durationMinutes: "60",
          priority: "normal",
          preparationNotes: "",
        })
        onAppointmentsCreated?.()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create recurring appointments",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating bulk recurring appointments:", error)
      toast({
        title: "Error",
        description: "Failed to create recurring appointments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedHome = homes.find(h => h.xref.toString() === formData.homeXref)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create Recurring Appointments
          </DialogTitle>
          <DialogDescription>
            Create multiple appointments for the entire year based on a recurring pattern (e.g., "First Monday of every month at 4pm").
            Appointments will be created as "unassigned" and can be assigned later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Monthly Home Visit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeXref">Foster Home</Label>
              <Select
                value={formData.homeXref}
                onValueChange={(value) => {
                  setFormData({ ...formData, homeXref: value })
                  const home = homes.find(h => h.xref.toString() === value)
                  if (home) {
                    setFormData(prev => ({
                      ...prev,
                      homeXref: value,
                      locationAddress: home.address || prev.locationAddress,
                    }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingHomes ? "Loading..." : "Select home"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (unassigned home)</SelectItem>
                  {homes.map((home) => (
                    <SelectItem key={home.xref} value={home.xref.toString()}>
                      {home.name} ({home.xref})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recurringPattern">Recurring Pattern *</Label>
              <Select
                value={formData.recurringPattern}
                onValueChange={(value) => setFormData({ ...formData, recurringPattern: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_monday">First Monday</SelectItem>
                  <SelectItem value="first_tuesday">First Tuesday</SelectItem>
                  <SelectItem value="first_wednesday">First Wednesday</SelectItem>
                  <SelectItem value="first_thursday">First Thursday</SelectItem>
                  <SelectItem value="first_friday">First Friday</SelectItem>
                  <SelectItem value="second_monday">Second Monday</SelectItem>
                  <SelectItem value="second_tuesday">Second Tuesday</SelectItem>
                  <SelectItem value="second_wednesday">Second Wednesday</SelectItem>
                  <SelectItem value="second_thursday">Second Thursday</SelectItem>
                  <SelectItem value="second_friday">Second Friday</SelectItem>
                  <SelectItem value="third_monday">Third Monday</SelectItem>
                  <SelectItem value="third_tuesday">Third Tuesday</SelectItem>
                  <SelectItem value="third_wednesday">Third Wednesday</SelectItem>
                  <SelectItem value="third_thursday">Third Thursday</SelectItem>
                  <SelectItem value="third_friday">Third Friday</SelectItem>
                  <SelectItem value="fourth_monday">Fourth Monday</SelectItem>
                  <SelectItem value="fourth_tuesday">Fourth Tuesday</SelectItem>
                  <SelectItem value="fourth_wednesday">Fourth Wednesday</SelectItem>
                  <SelectItem value="fourth_thursday">Fourth Thursday</SelectItem>
                  <SelectItem value="fourth_friday">Fourth Friday</SelectItem>
                  <SelectItem value="last_monday">Last Monday</SelectItem>
                  <SelectItem value="last_tuesday">Last Tuesday</SelectItem>
                  <SelectItem value="last_wednesday">Last Wednesday</SelectItem>
                  <SelectItem value="last_thursday">Last Thursday</SelectItem>
                  <SelectItem value="last_friday">Last Friday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                min="15"
                max="480"
                step="15"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startYear">Start Year *</Label>
              <Input
                id="startYear"
                type="number"
                value={formData.startYear}
                onChange={(e) => setFormData({ ...formData, startYear: e.target.value })}
                min="2024"
                max="2030"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endYear">End Year</Label>
              <Input
                id="endYear"
                type="number"
                value={formData.endYear}
                onChange={(e) => setFormData({ ...formData, endYear: e.target.value })}
                min="2024"
                max="2030"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationAddress">Location Address</Label>
            <Input
              id="locationAddress"
              value={formData.locationAddress}
              onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
              placeholder="Auto-filled from home selection"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationNotes">Location Notes</Label>
            <Textarea
              id="locationNotes"
              value={formData.locationNotes}
              onChange={(e) => setFormData({ ...formData, locationNotes: e.target.value })}
              placeholder="Optional location notes"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
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

          <div className="space-y-2">
            <Label htmlFor="preparationNotes">Preparation Notes</Label>
            <Textarea
              id="preparationNotes"
              value={formData.preparationNotes}
              onChange={(e) => setFormData({ ...formData, preparationNotes: e.target.value })}
              placeholder="Optional preparation notes"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Recurring Appointments
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

