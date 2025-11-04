"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import EnhancedHomeVisitForm from "@/components/forms/home-visit-form-enhanced"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function VisitFormPage() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointmentId")
  const { toast } = useToast()

  const [appointmentData, setAppointmentData] = useState(null)
  const [prepopulationData, setPrepopulationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [debugData, setDebugData] = useState({
    apiResponse: null,
    error: null,
    lastAttempt: null,
  })

  useEffect(() => {
    if (appointmentId) {
      fetchFormData()
    } else {
      setLoading(false)
    }
  }, [appointmentId])

  const fetchFormData = async () => {
    try {
      console.log("📋 [FORM] Fetching appointment data for ID:", appointmentId)
      setDebugData((prev) => ({ ...prev, lastAttempt: new Date().toISOString() }))

      // 1. Get appointment details
      const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`)
      
      if (!appointmentResponse.ok) {
        throw new Error("Failed to fetch appointment")
      }

      const appointmentData = await appointmentResponse.json()
      console.log("📋 [FORM] Appointment data received:", appointmentData)
      setAppointmentData(appointmentData.appointment)

      // 2. Get home GUID from appointment
      const homeGuid = appointmentData.appointment?.home_guid
      
      if (!homeGuid) {
        console.warn("⚠️ [FORM] No home_guid found in appointment")
        setLoading(false)
        return
      }

      // 3. Fetch pre-population data for this home
      console.log(`📋 [FORM] Fetching pre-population data for home: ${homeGuid}`)
      const prepopResponse = await fetch(`/api/homes/${homeGuid}/prepopulate`)
      
      if (prepopResponse.ok) {
        const prepopData = await prepopResponse.json()
        console.log("📋 [FORM] Pre-population data received:", prepopData)
        setPrepopulationData(prepopData)
        setDebugData((prev) => ({ ...prev, apiResponse: prepopData, error: null }))
      } else {
        const errorText = await prepopResponse.text()
        console.error("❌ [FORM] Failed to fetch pre-population data:", errorText)
        setDebugData((prev) => ({
          ...prev,
          error: {
            status: prepopResponse.status,
            statusText: prepopResponse.statusText,
            body: errorText,
          },
        }))
      }

    } catch (error) {
      console.error("❌ [FORM] Error fetching form data:", error)
      setDebugData((prev) => ({
        ...prev,
        error: {
          message: error.message,
          stack: error.stack,
        },
      }))
      toast({
        title: "Error",
        description: "Failed to load form data",
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

              {appointmentData && (
                <div>
                  <h3 className="font-semibold text-blue-600">Appointment Data:</h3>
                  <pre className="font-mono text-sm bg-blue-50 p-2 rounded overflow-auto">
                    {JSON.stringify(appointmentData, null, 2)}
                  </pre>
                </div>
              )}

              {prepopulationData && (
                <div>
                  <h3 className="font-semibold text-green-600">Pre-population Data:</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{prepopulationData.home?.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <Badge variant="outline">{prepopulationData.household?.providers?.length || 0} Providers</Badge>
                        <Badge variant="outline" className="ml-2">{prepopulationData.placements?.length || 0} Children</Badge>
                        <Badge variant="outline" className="ml-2">
                          {prepopulationData.previousVisit ? 'Previous Visit Found' : 'First Visit'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <pre className="font-mono text-xs bg-green-50 p-2 rounded overflow-auto max-h-96">
                    {JSON.stringify(prepopulationData, null, 2)}
                  </pre>
                </div>
              )}

              <Button onClick={fetchFormData} className="w-full bg-transparent" variant="outline">
                Retry Loading Data
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Home Visit Form - Version 3.1 */}
      <EnhancedHomeVisitForm
        appointmentId={appointmentId}
        appointmentData={appointmentData}
        prepopulationData={prepopulationData}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
