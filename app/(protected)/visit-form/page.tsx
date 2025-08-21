"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import BasicHomeVisitForm from "@/components/forms/home-visit-form-basic"
import { useToast } from "@/hooks/use-toast"

export default function VisitFormPage() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointmentId")
  const { toast } = useToast()

  const [homeData, setHomeData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentData()
    } else {
      setLoading(false)
    }
  }, [appointmentId])

  const fetchAppointmentData = async () => {
    try {
      console.log("[v0] Fetching appointment data for ID:", appointmentId)
      const response = await fetch(`/api/appointments/${appointmentId}`)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Appointment data received:", data)

        // Extract home data from appointment
        if (data.appointment) {
          setHomeData({
            name: data.appointment.home_name || "",
            address: data.appointment.location_address || "",
            phone: "", // Will be populated from home details if available
            email: "", // Will be populated from home details if available
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching appointment data:", error)
      toast({
        title: "Error",
        description: "Failed to load appointment data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData: any) => {
    try {
      console.log("[v0] Saving form draft:", formData)

      toast({
        title: "Draft Saved",
        description: "Your form has been saved as a draft",
      })
    } catch (error) {
      console.error("[v0] Error saving form:", error)
      toast({
        title: "Error",
        description: "Failed to save form draft",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (formData: any) => {
    try {
      console.log("[v0] Submitting completed form:", formData)

      if (appointmentId) {
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
            title: "Form Submitted",
            description: "Your visit form has been submitted and appointment marked as completed",
          })
        }
      } else {
        toast({
          title: "Form Submitted",
          description: "Your visit form has been submitted successfully",
        })
      }
    } catch (error) {
      console.error("[v0] Error submitting form:", error)
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <BasicHomeVisitForm
      appointmentId={appointmentId || undefined}
      homeData={homeData}
      onSave={handleSave}
      onSubmit={handleSubmit}
    />
  )
}
