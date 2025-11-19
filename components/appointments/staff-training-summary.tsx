"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Textarea } from "@refugehouse/shared-core/components/ui/textarea"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Save, Loader2 } from "lucide-react"

interface StaffTrainingSummaryProps {
  appointmentId: string
  appointmentType: string
  initialSummary?: string
  onSave?: () => void
}

export function StaffTrainingSummary({
  appointmentId,
  appointmentType,
  initialSummary = "",
  onSave,
}: StaffTrainingSummaryProps) {
  const [summary, setSummary] = useState(initialSummary)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  // Update summary when initialSummary changes
  useEffect(() => {
    setSummary(initialSummary || "")
    setHasChanges(false)
  }, [initialSummary])

  const handleSummaryChange = (value: string) => {
    setSummary(value)
    setHasChanges(value !== initialSummary)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/training-summary`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: summary,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save training summary")
      }

      const result = await response.json()
      setHasChanges(false)
      toast({
        title: "Summary Saved",
        description: "Training summary has been saved successfully.",
      })
      
      if (onSave) {
        onSave()
      }
    } catch (error: any) {
      console.error("Error saving training summary:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save training summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="bg-refuge-purple text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2">
          <span>Staff Training Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="training-summary" className="text-base font-medium">
            Training Summary
          </Label>
          <p className="text-sm text-muted-foreground">
            Enter a summary of the training session, including key learnings, observations, and any notes.
          </p>
          <Textarea
            id="training-summary"
            value={summary}
            onChange={(e) => handleSummaryChange(e.target.value)}
            placeholder="Enter training summary..."
            rows={12}
            className="min-h-[300px] resize-y"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-refuge-purple hover:bg-refuge-purple-dark text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Summary
              </>
            )}
          </Button>
        </div>

        {hasChanges && (
          <div className="text-sm text-amber-600 dark:text-amber-400">
            You have unsaved changes. Don't forget to save!
          </div>
        )}
      </CardContent>
    </Card>
  )
}


