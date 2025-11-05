"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import BasicHomeVisitForm from "@/components/forms/home-visit-form-basic"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function VisitFormPage() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointmentId")
  const { toast } = useToast()

  const [homeData, setHomeData] = useState(null)
  const [existingFormData, setExistingFormData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [debugData, setDebugData] = useState({
    apiResponse: null,
    error: null,
    lastAttempt: null,
  })

  useEffect(() => {
    if (appointmentId) {
      checkForExistingForm()
    } else {
      setLoading(false)
    }
  }, [appointmentId])

  const checkForExistingForm = async () => {
    try {
      console.log("[v0] Checking for existing form for appointment:", appointmentId)
      setDebugData((prev) => ({ ...prev, lastAttempt: new Date().toISOString() }))

      const formResponse = await fetch(`/api/visit-forms?appointmentId=${appointmentId}`)

      if (formResponse.ok) {
        const formData = await formResponse.json()
        console.log("[v0] Existing form data:", formData)
        setDebugData((prev) => ({ ...prev, apiResponse: formData, error: null }))

        if (formData.visitForms && formData.visitForms.length > 0) {
          const existingForm = formData.visitForms[0]
          console.log("[v0] Found existing form:", existingForm)
          console.log("[v0] Form ID:", existingForm.visit_form_id)
          console.log("[v0] Form status:", existingForm.status)
          console.log("[v0] Family info:", existingForm.family_info)
          console.log("[v0] Visit info:", existingForm.visit_info)
          setExistingFormData(existingForm)
          console.log("[v0] Set existingFormData state")
        } else {
          console.log("[v0] No existing forms found")
        }
      } else {
        const errorText = await formResponse.text()
        console.log("[v0] Form response not ok:", formResponse.status, errorText)
        setDebugData((prev) => ({
          ...prev,
          error: {
            status: formResponse.status,
            statusText: formResponse.statusText,
            body: errorText,
          },
        }))
      }

      await fetchAppointmentData()
    } catch (error) {
      console.error("[v0] Error checking for existing form:", error)
      setDebugData((prev) => ({
        ...prev,
        error: {
          message: error.message,
          stack: error.stack,
        },
      }))
      await fetchAppointmentData()
    }
  }

  const fetchAppointmentData = async () => {
    try {
      console.log("[v0] Fetching appointment data for ID:", appointmentId)
      const response = await fetch(`/api/appointments/${appointmentId}`)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Appointment data received:", data)

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
      console.log("[v0] Saving form draft via API:", formData)

      // Actually save the form data to the API
      const response = await fetch("/api/visit-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId: appointmentId,
          formData: formData,
          status: "draft",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save form")
      }

      const result = await response.json()
      console.log("[v0] Form saved successfully:", result)

      toast({
        title: "Draft Saved",
        description: "Your form has been saved as a draft",
      })
    } catch (error) {
      console.error("[v0] Error saving form:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save form draft",
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
    <div>
      <div className="fixed top-4 right-4 z-50">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Debug Data
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Database Debug Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Appointment ID:</h3>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">{appointmentId}</p>
              </div>

              <div>
                <h3 className="font-semibold">Last API Attempt:</h3>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">{debugData.lastAttempt}</p>
              </div>

              {debugData.error && (
                <div>
                  <h3 className="font-semibold text-red-600">API Error:</h3>
                  <pre className="font-mono text-sm bg-red-50 p-2 rounded overflow-auto">
                    {JSON.stringify(debugData.error, null, 2)}
                  </pre>
                </div>
              )}

              {debugData.apiResponse && (
                <div>
                  <h3 className="font-semibold text-green-600">API Response:</h3>
                  <pre className="font-mono text-sm bg-green-50 p-2 rounded overflow-auto">
                    {JSON.stringify(debugData.apiResponse, null, 2)}
                  </pre>
                </div>
              )}

              {existingFormData && (
                <div>
                  <h3 className="font-semibold text-blue-600">Existing Form Data (Parsed):</h3>
                  <pre className="font-mono text-sm bg-blue-50 p-2 rounded overflow-auto">
                    {JSON.stringify(existingFormData, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="font-semibold">Home Data:</h3>
                <pre className="font-mono text-sm bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(homeData, null, 2)}
                </pre>
              </div>

              <Button onClick={checkForExistingForm} className="w-full bg-transparent" variant="outline">
                Retry Loading Data
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <BasicHomeVisitForm
        appointmentId={appointmentId || undefined}
        homeData={homeData}
        existingFormData={existingFormData}
        onSave={async (formData) => {
          // The form component handles saving internally via saveFormData
          // This callback is just for notification
          await handleSave(formData)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
