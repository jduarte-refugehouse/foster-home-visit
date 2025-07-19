"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin } from "lucide-react"

interface Family {
  id: string
  familyName: string
  placements: Array<{
    id: string
    childName: string
    childAge: number | null
  }>
}

export default function NewVisit() {
  const searchParams = useSearchParams()
  const familyId = searchParams.get("familyId")

  const [families, setFamilies] = useState<Family[]>([])
  const [selectedFamily, setSelectedFamily] = useState<string>(familyId || "")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchFamilies()
  }, [])

  const fetchFamilies = async () => {
    try {
      const response = await fetch("/api/families")
      if (response.ok) {
        const data = await response.json()
        setFamilies(data)
      }
    } catch (error) {
      console.error("Error fetching families:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const visitData = {
      familyId: formData.get("familyId"),
      placementId: formData.get("placementId") || null,
      visitType: formData.get("visitType"),
      visitDate: formData.get("visitDate"),
      startTime: formData.get("startTime"),
      purpose: formData.get("purpose"),
      location: formData.get("location"),
      notes: formData.get("notes"),
    }

    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitData),
      })

      if (response.ok) {
        // Redirect to calendar or show success message
        window.location.href = "/calendar"
      } else {
        console.error("Error creating visit")
      }
    } catch (error) {
      console.error("Error submitting visit:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedFamilyData = families.find((f) => f.id === selectedFamily)

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedule New Visit</h1>
        <p className="text-gray-600">Create a new visit appointment with TAC Chapter 749 compliance tracking</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Visit Details
            </CardTitle>
            <CardDescription>Schedule a visit and ensure compliance with minimum standards</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="familyId">Family</Label>
                <Select name="familyId" value={selectedFamily} onValueChange={setSelectedFamily} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a family" />
                  </SelectTrigger>
                  <SelectContent>
                    {families.map((family) => (
                      <SelectItem key={family.id} value={family.id}>
                        {family.familyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFamilyData && selectedFamilyData.placements.length > 0 && (
                <div>
                  <Label htmlFor="placementId">Specific Child (Optional)</Label>
                  <Select name="placementId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a child or leave blank for family visit" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFamilyData.placements.map((placement) => (
                        <SelectItem key={placement.id} value={placement.id}>
                          {placement.childName} {placement.childAge && `(Age ${placement.childAge})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="visitType">Visit Type</Label>
                <Select name="visitType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled Visit</SelectItem>
                    <SelectItem value="unannounced">Unannounced Visit</SelectItem>
                    <SelectItem value="emergency">Emergency Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visitDate">Visit Date</Label>
                  <Input type="date" name="visitDate" required min={new Date().toISOString().split("T")[0]} />
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input type="time" name="startTime" required />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input name="location" placeholder="Visit location" className="pl-10" required />
                </div>
              </div>

              <div>
                <Label htmlFor="purpose">Purpose of Visit</Label>
                <Textarea name="purpose" placeholder="Describe the purpose and goals of this visit" rows={3} required />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea name="notes" placeholder="Any additional information or special considerations" rows={2} />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Scheduling..." : "Schedule Visit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
