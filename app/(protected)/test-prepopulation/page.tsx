"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { CheckCircle2, XCircle, Loader2, AlertCircle, ChevronRight } from "lucide-react"
import { Separator } from "@refugehouse/shared-core/components/ui/separator"

interface StepStatus {
  status: "pending" | "loading" | "success" | "error"
  message?: string
  data?: any
  error?: any
  timestamp?: number
}

export default function TestPrepopulationPage() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointmentId") || searchParams.get("id")
  
  const [steps, setSteps] = useState<Record<string, StepStatus>>({
    step1: { status: "pending", message: "Waiting to start..." },
    step2: { status: "pending", message: "Waiting for appointment data..." },
    step3: { status: "pending", message: "Waiting for home lookup..." },
    step4: { status: "pending", message: "Waiting for prepopulation data..." },
    step5: { status: "pending", message: "Waiting for data extraction..." },
  })

  const [fullPrepopData, setFullPrepopData] = useState<any>(null)

  const updateStep = (stepKey: string, update: Partial<StepStatus>) => {
    setSteps(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        ...update,
        timestamp: Date.now(),
      },
    }))
  }

  const runTest = async () => {
    // Reset all steps
    setSteps({
      step1: { status: "pending", message: "Waiting to start..." },
      step2: { status: "pending", message: "Waiting for appointment data..." },
      step3: { status: "pending", message: "Waiting for home lookup..." },
      step4: { status: "pending", message: "Waiting for prepopulation data..." },
      step5: { status: "pending", message: "Waiting for data extraction..." },
    })
    setFullPrepopData(null)

    try {
      // STEP 1: Validate appointment ID
      updateStep("step1", { status: "loading", message: "Validating appointment ID..." })
      
      if (!appointmentId) {
        updateStep("step1", {
          status: "error",
          message: "No appointment ID provided",
          error: "Add ?appointmentId=XXX or ?id=XXX to the URL",
        })
        return
      }

      updateStep("step1", {
        status: "success",
        message: `Appointment ID: ${appointmentId}`,
        data: { appointmentId },
      })

      // STEP 2: Fetch appointment data
      updateStep("step2", { status: "loading", message: "Fetching appointment data..." })
      
      const appointmentResponse = await fetch(`/api/appointments/${appointmentId}`)
      
      if (!appointmentResponse.ok) {
        const errorText = await appointmentResponse.text()
        updateStep("step2", {
          status: "error",
          message: `Failed to fetch appointment (${appointmentResponse.status})`,
          error: errorText,
        })
        return
      }

      const appointmentData = await appointmentResponse.json()
      const appointment = appointmentData.appointment
      const homeXref = appointment?.home_xref

      if (!homeXref) {
        updateStep("step2", {
          status: "error",
          message: "No home_xref found in appointment",
          error: "Appointment data: " + JSON.stringify(appointment, null, 2),
        })
        return
      }

      updateStep("step2", {
        status: "success",
        message: `Found home_xref: ${homeXref}`,
        data: {
          appointmentId: appointment.appointment_id,
          homeXref,
          homeName: appointment.home_name,
        },
      })

      // STEP 3: Lookup home GUID
      updateStep("step3", { status: "loading", message: `Looking up home GUID for xref: ${homeXref}...` })
      
      const lookupResponse = await fetch(`/api/homes/lookup?xref=${homeXref}`)
      
      if (!lookupResponse.ok) {
        const errorText = await lookupResponse.text()
        updateStep("step3", {
          status: "error",
          message: `Failed to lookup home (${lookupResponse.status})`,
          error: errorText,
        })
        return
      }

      const lookupData = await lookupResponse.json()
      const homeGuid = lookupData.guid

      if (!homeGuid) {
        updateStep("step3", {
          status: "error",
          message: "No GUID found in lookup response",
          error: "Lookup response: " + JSON.stringify(lookupData, null, 2),
        })
        return
      }

      updateStep("step3", {
        status: "success",
        message: `Found home GUID: ${homeGuid}`,
        data: {
          homeGuid,
          homeName: lookupData.name,
          xref: homeXref,
        },
      })

      // STEP 4: Fetch prepopulation data
      updateStep("step4", { status: "loading", message: `Fetching prepopulation data for home: ${homeGuid}...` })
      
      const prepopResponse = await fetch(`/api/homes/${homeGuid}/prepopulate`)
      
      if (!prepopResponse.ok) {
        const errorText = await prepopResponse.text()
        updateStep("step4", {
          status: "error",
          message: `Failed to fetch prepopulation data (${prepopResponse.status})`,
          error: errorText,
        })
        return
      }

      const prepopData = await prepopResponse.json()
      setFullPrepopData(prepopData)

      updateStep("step4", {
        status: "success",
        message: "Prepopulation data received",
        data: {
          hasHome: !!prepopData.home,
          hasLicense: !!prepopData.license,
          hasHousehold: !!prepopData.household,
          hasPlacements: !!prepopData.placements,
          hasPlacementHistory: !!prepopData.placementHistory,
          hasPreviousVisit: !!prepopData.previousVisit,
        },
      })

      // STEP 5: Extract and validate data
      updateStep("step5", { status: "loading", message: "Extracting and validating data..." })
      
      const extractionResults = {
        home: {
          name: prepopData.home?.name || null,
          phone: prepopData.home?.phone || null,
          email: prepopData.home?.email || null,
          address: prepopData.home?.address || null,
          fullAddress: prepopData.home?.logistics?.fullAddress || null,
        },
        license: {
          licenseType: prepopData.license?.legacyLicense?.licenseType || null,
          licenseEffectiveDate: prepopData.license?.legacyLicense?.licenseEffectiveDate || null,
          licenseExpirationDate: prepopData.license?.legacyLicense?.licenseExpirationDate || null,
          totalCapacity: prepopData.license?.legacyLicense?.totalCapacity || null,
          fosterCareCapacity: prepopData.license?.legacyLicense?.fosterCareCapacity || null,
          currentCensus: prepopData.license?.legacyLicense?.currentCensus || null,
          respiteOnly: prepopData.license?.legacyLicense?.respiteOnly || null,
        },
        household: {
          providers: prepopData.household?.providers?.length || 0,
          biologicalChildren: prepopData.household?.biologicalChildren?.length || 0,
          otherMembers: prepopData.household?.otherHouseholdMembers?.length || 0,
        },
        placements: {
          count: prepopData.placements?.length || 0,
        },
        placementHistory: {
          count: prepopData.placementHistory?.length || 0,
        },
      }

      const missingFields: string[] = []
      if (!extractionResults.home.name) missingFields.push("Home Name")
      if (!extractionResults.home.phone) missingFields.push("Home Phone")
      if (!extractionResults.home.email) missingFields.push("Home Email")
      if (!extractionResults.home.fullAddress) missingFields.push("Home Address")
      if (!extractionResults.license.licenseEffectiveDate) missingFields.push("License Effective Date")
      if (!extractionResults.license.totalCapacity) missingFields.push("Total Capacity")
      if (!extractionResults.license.fosterCareCapacity) missingFields.push("Foster Care Capacity")
      if (extractionResults.placementHistory.count === 0) missingFields.push("Placement History")

      updateStep("step5", {
        status: missingFields.length > 0 ? "error" : "success",
        message: missingFields.length > 0 
          ? `Missing ${missingFields.length} field(s): ${missingFields.join(", ")}`
          : "All data extracted successfully",
        data: extractionResults,
        error: missingFields.length > 0 ? { missingFields } : undefined,
      })

    } catch (error) {
      console.error("❌ Test error:", error)
      // Find the last step that was loading and mark it as error
      const lastLoadingStep = Object.keys(steps).find(
        key => steps[key].status === "loading"
      )
      if (lastLoadingStep) {
        updateStep(lastLoadingStep, {
          status: "error",
          message: "Unexpected error occurred",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  const getStatusIcon = (status: StepStatus["status"]) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      case "loading":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: StepStatus["status"]) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-600"
      case "loading":
        return "bg-blue-100 text-blue-700"
      case "success":
        return "bg-green-100 text-green-700"
      case "error":
        return "bg-red-100 text-red-700"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Prepopulation Data Test</CardTitle>
          <CardDescription>
            Step-by-step test of the prepopulation data flow for home visit forms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Appointment ID</label>
                <input
                  type="text"
                  value={appointmentId || ""}
                  readOnly
                  className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-50"
                />
              </div>
              <Button onClick={runTest} className="mt-6">
                Run Test
              </Button>
            </div>

            {!appointmentId && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>No appointment ID provided.</strong> Add <code>?appointmentId=XXX</code> or <code>?id=XXX</code> to the URL.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {Object.entries(steps).map(([key, step], index) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getStatusIcon(step.status)}
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    Step {index + 1}: {
                      key === "step1" ? "Validate Appointment ID" :
                      key === "step2" ? "Fetch Appointment Data" :
                      key === "step3" ? "Lookup Home GUID" :
                      key === "step4" ? "Fetch Prepopulation Data" :
                      "Extract & Validate Data"
                    }
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {step.message}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(step.status)}>
                  {step.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            {step.data && (
              <CardContent>
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(step.data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            )}
            {step.error && (
              <CardContent>
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
                  <pre className="text-xs text-red-700 overflow-auto">
                    {typeof step.error === "string" ? step.error : JSON.stringify(step.error, null, 2)}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Full Prepopulation Data */}
      {fullPrepopData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Full Prepopulation Data</CardTitle>
            <CardDescription>
              Complete response from the prepopulation API endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Home Data */}
              <div>
                <h3 className="font-semibold mb-2">Home Data</h3>
                <div className="p-4 bg-gray-50 rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(fullPrepopData.home, null, 2)}
                  </pre>
                </div>
              </div>

              {/* License Data */}
              <div>
                <h3 className="font-semibold mb-2">License Data</h3>
                <div className="p-4 bg-gray-50 rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(fullPrepopData.license, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Household Data */}
              <div>
                <h3 className="font-semibold mb-2">Household Data</h3>
                <div className="p-4 bg-gray-50 rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(fullPrepopData.household, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Placements Data */}
              <div>
                <h3 className="font-semibold mb-2">Placements Data</h3>
                <div className="p-4 bg-gray-50 rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(fullPrepopData.placements, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Placement History */}
              <div>
                <h3 className="font-semibold mb-2">Placement History</h3>
                <div className="p-4 bg-gray-50 rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(fullPrepopData.placementHistory, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Raw Full Data */}
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-sm">Raw Full Response (Click to expand)</summary>
                <div className="mt-2 p-4 bg-gray-50 rounded-md">
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(fullPrepopData, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

