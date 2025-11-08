// Quarterly Review Section Component
// Implements TAC §749.2815 requirements

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TextareaWithVoice } from "@/components/ui/textarea-with-voice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClipboardList, Plus, X, ExternalLink } from "lucide-react"
import { SignaturePad } from "@/components/ui/signature-pad"

export const QuarterlyReviewSection = ({ formData, onChange }) => {
  const quarterly = formData.quarterlyReview || {}

  const addLifeChange = () => {
    const current = quarterly.majorLifeChanges?.changes || []
    onChange("quarterlyReview.majorLifeChanges.changes", [
      ...current,
      { type: "", description: "", date: "", impact: "" },
    ])
  }

  const removeLifeChange = (index) => {
    const current = quarterly.majorLifeChanges?.changes || []
    onChange("quarterlyReview.majorLifeChanges.changes", current.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
          <ClipboardList className="h-6 w-6 text-refuge-purple" />
          Quarterly Review Items
        </h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          TAC §749.2815
        </Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Quarterly Requirements:</strong> These items must be reviewed and documented at least once per quarter
          per Texas Administrative Code §749.2815. Complete all sections during the first visit of each quarter.
        </AlertDescription>
      </Alert>

      {/* 1. Household Composition Updates (§749.2815(c)(1)) */}
      <Card>
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg">
          <CardTitle className="text-lg">
            1. Household Composition Updates
            <Badge variant="secondary" className="ml-2 text-xs">
              §749.2815(c)(1)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-muted-foreground italic">
            Note: "Changes Since Last Quarter" has been moved to the Foster Home Info section and will be automatically populated with placement history data.
          </p>
        </CardContent>
      </Card>

      {/* 2. Major Life Changes (§749.2815(c)(2)) */}
      <Card>
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg">
          <CardTitle className="text-lg">
            2. Major Life Changes in Foster Family
            <Badge variant="secondary" className="ml-2 text-xs">
              §749.2815(c)(2)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            {(quarterly.majorLifeChanges?.changes || []).map((change, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Type of Change</Label>
                      <Select
                        value={change.type}
                        onValueChange={(value) => {
                          const updated = [...(quarterly.majorLifeChanges?.changes || [])]
                          updated[index].type = value
                          onChange("quarterlyReview.majorLifeChanges.changes", updated)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marriage">Marriage</SelectItem>
                          <SelectItem value="divorce">Divorce</SelectItem>
                          <SelectItem value="birth">Birth</SelectItem>
                          <SelectItem value="serious-illness">Serious Illness</SelectItem>
                          <SelectItem value="employment-change">Employment Change</SelectItem>
                          <SelectItem value="extended-absence">Extended Absence</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={change.date}
                        onChange={(e) => {
                          const updated = [...(quarterly.majorLifeChanges?.changes || [])]
                          updated[index].date = e.target.value
                          onChange("quarterlyReview.majorLifeChanges.changes", updated)
                        }}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={change.description}
                        onChange={(e) => {
                          const updated = [...(quarterly.majorLifeChanges?.changes || [])]
                          updated[index].description = e.target.value
                          onChange("quarterlyReview.majorLifeChanges.changes", updated)
                        }}
                        placeholder="Describe the change..."
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Label>Impact on Home/Family</Label>
                      <Textarea
                        value={change.impact}
                        onChange={(e) => {
                          const updated = [...(quarterly.majorLifeChanges?.changes || [])]
                          updated[index].impact = e.target.value
                          onChange("quarterlyReview.majorLifeChanges.changes", updated)
                        }}
                        placeholder="How does this change impact the foster home and family?"
                        rows={2}
                      />
                    </div>

                    <div className="md:col-span-4 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeLifeChange(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button size="sm" variant="outline" onClick={addLifeChange} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Life Change
            </Button>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={quarterly.majorLifeChanges?.notes || ""}
              onChange={(e) => onChange("quarterlyReview.majorLifeChanges.notes", e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Disaster and Emergency Planning Updates (§749.2815(c)(3)) */}
      <Card>
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg">
          <CardTitle className="text-lg">
            3. Disaster and Emergency Planning Updates
            <Badge variant="secondary" className="ml-2 text-xs">
              §749.2815(c)(3)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Last Fire Drill Date</Label>
              <Input
                type="date"
                value={quarterly.disasterEmergencyPlanning?.fireDrillDate || ""}
                onChange={(e) => onChange("quarterlyReview.disasterEmergencyPlanning.fireDrillDate", e.target.value)}
              />
            </div>

            <div>
              <Label>Last Review Date</Label>
              <Input
                type="date"
                value={quarterly.disasterEmergencyPlanning?.lastReviewDate || ""}
                onChange={(e) => onChange("quarterlyReview.disasterEmergencyPlanning.lastReviewDate", e.target.value)}
              />
            </div>

            <div>
              <Label>Next Review Due</Label>
              <Input
                type="date"
                value={quarterly.disasterEmergencyPlanning?.nextReviewDue || ""}
                onChange={(e) => onChange("quarterlyReview.disasterEmergencyPlanning.nextReviewDue", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Planning Components Reviewed</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={quarterly.disasterEmergencyPlanning?.evacuationRoutesReviewed || false}
                  onChange={(e) => onChange("quarterlyReview.disasterEmergencyPlanning.evacuationRoutesReviewed", e.target.checked)}
                  className="rounded"
                />
                <Label className="font-normal">Evacuation routes reviewed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={quarterly.disasterEmergencyPlanning?.severeWeatherPlanUpdated || false}
                  onChange={(e) => onChange("quarterlyReview.disasterEmergencyPlanning.severeWeatherPlanUpdated", e.target.checked)}
                  className="rounded"
                />
                <Label className="font-normal">Severe weather plan updated</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={quarterly.disasterEmergencyPlanning?.contingencyContactsCurrent || false}
                  onChange={(e) => onChange("quarterlyReview.disasterEmergencyPlanning.contingencyContactsCurrent", e.target.checked)}
                  className="rounded"
                />
                <Label className="font-normal">Contingency contacts current</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={quarterly.disasterEmergencyPlanning?.planAccountsForAllMembers || false}
                  onChange={(e) => onChange("quarterlyReview.disasterEmergencyPlanning.planAccountsForAllMembers", e.target.checked)}
                  className="rounded"
                />
                <Label className="font-normal">Plan accounts for all household members</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Changes Since Last Quarter</Label>
            <TextareaWithVoice
              value={quarterly.disasterEmergencyPlanning?.changesSinceLastQuarter || ""}
              onChange={(value) => onChange("quarterlyReview.disasterEmergencyPlanning.changesSinceLastQuarter", value)}
              placeholder="Document any changes to disaster and emergency plans..."
              rows={3}
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={quarterly.disasterEmergencyPlanning?.notes || ""}
              onChange={(e) => onChange("quarterlyReview.disasterEmergencyPlanning.notes", e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Family Stress and Well-Being Assessment (§749.2815(c)(4)) */}
      <Card>
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg">
          <CardTitle className="text-lg">
            4. Family Stress and Well-Being Assessment
            <Badge variant="secondary" className="ml-2 text-xs">
              §749.2815(c)(4)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Overall Stress Level</Label>
            <Select
              value={quarterly.familyStressWellbeing?.stressLevel || ""}
              onValueChange={(value) => onChange("quarterlyReview.familyStressWellbeing.stressLevel", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stress level..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Financial Pressures</Label>
              <Textarea
                value={quarterly.familyStressWellbeing?.financialPressures || ""}
                onChange={(e) => onChange("quarterlyReview.familyStressWellbeing.financialPressures", e.target.value)}
                placeholder="Describe any financial pressures..."
                rows={3}
              />
            </div>

            <div>
              <Label>Health Pressures</Label>
              <Textarea
                value={quarterly.familyStressWellbeing?.healthPressures || ""}
                onChange={(e) => onChange("quarterlyReview.familyStressWellbeing.healthPressures", e.target.value)}
                placeholder="Describe any health pressures..."
                rows={3}
              />
            </div>

            <div>
              <Label>Emotional Pressures</Label>
              <Textarea
                value={quarterly.familyStressWellbeing?.emotionalPressures || ""}
                onChange={(e) => onChange("quarterlyReview.familyStressWellbeing.emotionalPressures", e.target.value)}
                placeholder="Describe any emotional pressures..."
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label>Methods Used to Respond to Challenging Behaviors</Label>
            <TextareaWithVoice
              value={quarterly.familyStressWellbeing?.methodsForChallengingBehaviors || ""}
              onChange={(value) => onChange("quarterlyReview.familyStressWellbeing.methodsForChallengingBehaviors", value)}
              placeholder="Document methods used to respond to children's challenging behaviors..."
              rows={3}
            />
          </div>

          <div>
            <Label>Stress Alleviation Methods</Label>
            <TextareaWithVoice
              value={quarterly.familyStressWellbeing?.stressAlleviationMethods || ""}
              onChange={(value) => onChange("quarterlyReview.familyStressWellbeing.stressAlleviationMethods", value)}
              placeholder="Document methods used to alleviate familial stress..."
              rows={3}
            />
          </div>

          <div>
            <Label>Support Systems in Place</Label>
            <Textarea
              value={quarterly.familyStressWellbeing?.supportSystemsInPlace || ""}
              onChange={(e) => onChange("quarterlyReview.familyStressWellbeing.supportSystemsInPlace", e.target.value)}
              placeholder="Describe support systems currently in place..."
              rows={2}
            />
          </div>

          <div>
            <Label>Additional Support Needed</Label>
            <Textarea
              value={quarterly.familyStressWellbeing?.additionalSupportNeeded || ""}
              onChange={(e) => onChange("quarterlyReview.familyStressWellbeing.additionalSupportNeeded", e.target.value)}
              placeholder="Describe any additional support needed..."
              rows={2}
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={quarterly.familyStressWellbeing?.notes || ""}
              onChange={(e) => onChange("quarterlyReview.familyStressWellbeing.notes", e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Quarterly Visit Documentation Standards (§749.2815(d), (e)) */}
      <Card>
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg">
          <CardTitle className="text-lg">
            5. Quarterly Visit Documentation Standards
            <Badge variant="secondary" className="ml-2 text-xs">
              §749.2815(d), (e)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Household Members Present</Label>
            <Textarea
              value={(quarterly.documentationStandards?.householdMembersPresent || []).join(", ") || ""}
              onChange={(e) => {
                const names = e.target.value.split(",").map(n => n.trim()).filter(n => n)
                onChange("quarterlyReview.documentationStandards.householdMembersPresent", names)
              }}
              placeholder="List names of all household members present (comma-separated)..."
              rows={2}
            />
          </div>

          <div>
            <Label>Rules/Standards Reviewed</Label>
            <Textarea
              value={(quarterly.documentationStandards?.rulesStandardsReviewed || []).join(", ") || ""}
              onChange={(e) => {
                const codes = e.target.value.split(",").map(c => c.trim()).filter(c => c)
                onChange("quarterlyReview.documentationStandards.rulesStandardsReviewed", codes)
              }}
              placeholder="List specific rules/standards reviewed (e.g., §749.1521, RCC 5420)..."
              rows={2}
            />
          </div>

          <div>
            <Label>Evaluation Results</Label>
            <TextareaWithVoice
              value={quarterly.documentationStandards?.evaluationResults || ""}
              onChange={(value) => onChange("quarterlyReview.documentationStandards.evaluationResults", value)}
              placeholder="Document the results of the evaluation..."
              rows={4}
            />
          </div>

          <div>
            <Label>Deficiencies Identified</Label>
            <Textarea
              value={(quarterly.documentationStandards?.deficienciesIdentified || []).join("\n") || ""}
              onChange={(e) => {
                const deficiencies = e.target.value.split("\n").filter(d => d.trim())
                onChange("quarterlyReview.documentationStandards.deficienciesIdentified", deficiencies)
              }}
              placeholder="List any deficiencies identified (one per line)..."
              rows={3}
            />
          </div>

          <div>
            <Label>Planned Corrective Actions</Label>
            <Textarea
              value={(quarterly.documentationStandards?.plannedCorrectiveActions || []).join("\n") || ""}
              onChange={(e) => {
                const actions = e.target.value.split("\n").filter(a => a.trim())
                onChange("quarterlyReview.documentationStandards.plannedCorrectiveActions", actions)
              }}
              placeholder="List planned corrective actions (one per line)..."
              rows={3}
            />
          </div>

          <div>
            <Label>Changes from Prior Screening</Label>
            <TextareaWithVoice
              value={quarterly.documentationStandards?.changesFromPriorScreening || ""}
              onChange={(value) => onChange("quarterlyReview.documentationStandards.changesFromPriorScreening", value)}
              placeholder="Document any changes from prior screening..."
              rows={3}
            />
          </div>

          <div>
            <Label>Explanations for Changes</Label>
            <TextareaWithVoice
              value={quarterly.documentationStandards?.explanationsForChanges || ""}
              onChange={(value) => onChange("quarterlyReview.documentationStandards.explanationsForChanges", value)}
              placeholder="Provide explanations for any changes identified..."
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <Label className="text-lg font-semibold mb-4 block">Signatures</Label>
            
            <div className="space-y-4">
              <div>
                <Label>Foster Parent Signatures</Label>
                <div className="space-y-2 mt-2">
                  {(quarterly.documentationStandards?.fosterParentSignatures || []).map((sig, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Foster parent name"
                        value={sig.name}
                        onChange={(e) => {
                          const updated = [...(quarterly.documentationStandards?.fosterParentSignatures || [])]
                          updated[index].name = e.target.value
                          onChange("quarterlyReview.documentationStandards.fosterParentSignatures", updated)
                        }}
                        className="flex-1"
                      />
                      <SignaturePad
                        value={sig.signature}
                        onChange={(value) => {
                          const updated = [...(quarterly.documentationStandards?.fosterParentSignatures || [])]
                          updated[index].signature = value
                          onChange("quarterlyReview.documentationStandards.fosterParentSignatures", updated)
                        }}
                      />
                      <Input
                        type="date"
                        value={sig.date}
                        onChange={(e) => {
                          const updated = [...(quarterly.documentationStandards?.fosterParentSignatures || [])]
                          updated[index].date = e.target.value
                          onChange("quarterlyReview.documentationStandards.fosterParentSignatures", updated)
                        }}
                        className="w-40"
                      />
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const current = quarterly.documentationStandards?.fosterParentSignatures || []
                      onChange("quarterlyReview.documentationStandards.fosterParentSignatures", [
                        ...current,
                        { name: "", signature: "", date: "" },
                      ])
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Foster Parent Signature
                  </Button>
                </div>
              </div>

              <div>
                <Label>Staff Member Signature</Label>
                <div className="flex gap-2 items-center mt-2">
                  <SignaturePad
                    value={quarterly.documentationStandards?.staffSignature || ""}
                    onChange={(value) => onChange("quarterlyReview.documentationStandards.staffSignature", value)}
                  />
                  <Input
                    type="date"
                    value={quarterly.documentationStandards?.staffSignatureDate || ""}
                    onChange={(e) => onChange("quarterlyReview.documentationStandards.staffSignatureDate", e.target.value)}
                    placeholder="Date"
                    className="w-40"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={quarterly.documentationStandards?.notes || ""}
              onChange={(e) => onChange("quarterlyReview.documentationStandards.notes", e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Combined Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Combined Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <TextareaWithVoice
            value={quarterly.combinedNotes || ""}
            onChange={(value) => onChange("quarterlyReview.combinedNotes", value)}
            placeholder="Additional notes for quarterly review..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  )
}

