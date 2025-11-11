// Additional Section Components for Enhanced Home Visit Form
// This file contains the remaining section components that were too large to fit in one file

import React, { useEffect, useState, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TextareaWithVoice } from "@/components/ui/textarea-with-voice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Users, TrendingUp, Heart, FileText, AlertTriangle, CheckCircle, Briefcase, Mail, Phone, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SignaturePad } from "@/components/ui/signature-pad"
import { GuidedQuestionField } from "@/components/forms/guided-question-field"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export const TraumaInformedCareSection = ({ formData, onChange, onNotesChange }) => {
  const traumaCare = formData.traumaInformedCare

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <Brain className="h-6 w-6 text-refuge-purple" />
        Trauma-Informed Care & Training
      </h2>

      <Alert>
        <AlertDescription>
          <strong>RCC Requirements & T3C Development:</strong> Document training compliance and observe trauma-informed
          practices in the home.
        </AlertDescription>
      </Alert>

      {/* Training Requirements - Using Compact Table Format */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-1 bg-muted border-b p-2 text-sm font-semibold">
          <div className="col-span-3 text-foreground">Number</div>
          <div className="col-span-7 text-foreground">Training Requirement</div>
          <div className="col-span-2 text-center text-foreground">Status</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border">
          {traumaCare.items.map((item, index) => (
            <div key={index} className="bg-card">
              <div className="grid grid-cols-12 gap-1 p-2 items-center text-sm hover:bg-muted/50">
                {/* Number Column */}
                <div className="col-span-3 flex items-center gap-1.5">
                  <span className="font-mono text-xs text-muted-foreground">{item.code || ""}</span>
                </div>

                {/* Requirement Column */}
                <div className="col-span-7 text-foreground leading-tight text-sm">
                  {item.requirement}
                </div>

                {/* Status Column - Compliant/N/A Buttons */}
                <div className="col-span-2 flex flex-col gap-0.5 justify-center items-center">
                  <Button
                    size="sm"
                    variant={item.status === "compliant" ? "default" : "outline"}
                    className={`h-8 w-full text-xs px-2 font-medium ${
                      item.status === "compliant"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "hover:bg-green-50 dark:hover:bg-green-950/20"
                    }`}
                    onClick={() => {
                      onChange("traumaInformedCare", index, "status", item.status === "compliant" ? "" : "compliant")
                    }}
                  >
                    {item.status === "compliant" ? "✓" : "Compliant"}
                  </Button>
                  <Button
                    size="sm"
                    variant={item.status === "na" ? "default" : "outline"}
                    className={`h-6 w-full text-xs px-1 ${
                      item.status === "na"
                        ? "bg-slate-600 hover:bg-slate-700 text-white"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      onChange("traumaInformedCare", index, "status", item.status === "na" ? "" : "na")
                    }}
                  >
                    N/A
                  </Button>
                </div>
              </div>

              {/* Expanded Notes Row - Show if status is set or has notes */}
              {(item.status || item.notes) && (
                <div className="bg-muted border-t px-2 py-2">
                  <div>
                    <Label className="text-xs text-foreground mb-1 block font-medium">Notes</Label>
                    <Textarea
                      value={item.notes || ""}
                      onChange={(e) => onChange("traumaInformedCare", index, "notes", e.target.value)}
                      placeholder={item.status === "non-compliant" ? "Notes required..." : "Optional..."}
                      className={`text-sm h-10 resize-none p-2 ${item.status === "non-compliant" && !item.notes ? "border-red-300" : ""}`}
                      rows={2}
                      required={item.status === "non-compliant"}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TBRI Strategies */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Trust-Based Relational Intervention (TBRI) Practices Observed
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
              T3C Development
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(traumaCare.tbriStrategies).map(([strategy, data]) => (
              <Card key={strategy}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{strategy} Strategies</p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[300px]">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={data.status === "observed" ? "default" : "outline"}
                          onClick={() =>
                            onNotesChange(
                              `traumaInformedCare.tbriStrategies.${strategy}.status`,
                              data.status === "observed" ? "developing" : "observed"
                            )
                          }
                        >
                          Observed
                        </Button>
                        <Button
                          size="sm"
                          variant={data.status === "developing" ? "default" : "outline"}
                          onClick={() => onNotesChange(`traumaInformedCare.tbriStrategies.${strategy}.status`, "developing")}
                        >
                          Developing
                        </Button>
                        <Button
                          size="sm"
                          variant={data.status === "not-started" ? "default" : "outline"}
                          onClick={() =>
                            onNotesChange(
                              `traumaInformedCare.tbriStrategies.${strategy}.status`,
                              data.status === "not-started" ? "developing" : "not-started"
                            )
                          }
                        >
                          Not Started
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Notes..."
                        value={data.notes}
                        onChange={(e) => onNotesChange(`traumaInformedCare.tbriStrategies.${strategy}.notes`, e.target.value)}
                        className="text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="border-t pt-6">
        <Label htmlFor="trauma-care-combined-notes">Combined Notes for Trauma-Informed Care & Training</Label>
        <Textarea
          id="trauma-care-combined-notes"
          value={traumaCare.combinedNotes}
          onChange={(e) => onNotesChange("traumaInformedCare.combinedNotes", e.target.value)}
          placeholder="Any additional observations or context for trauma-informed care practices..."
          rows={4}
          className="mt-2"
        />
      </div>
    </div>
  )
}

export const FosterParentInterviewSection = ({ formData, onChange }) => {
  const interview = formData.fosterParentInterview || { childrenDiscussed: [], supportNeeds: {}, combinedNotes: "" }
  
  // Get placement children (not biological or adopted)
  const placementChildren = formData.placements?.children || []
  
  // Initialize children discussed with placement children if empty
  useEffect(() => {
    if (placementChildren.length > 0 && (!interview.childrenDiscussed || interview.childrenDiscussed.length === 0)) {
      const initialChildren = placementChildren.map(child => ({
        childName: `${child.firstName || ""} ${child.lastName || ""}`.trim(),
        childAge: child.age,
        behaviorsNoted: "",
        schoolPerformance: "",
        medicalTherapy: "",
        notes: "",
      }))
      onChange("fosterParentInterview.childrenDiscussed", initialChildren)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementChildren.length]) // Only run when placement children are first loaded

  const addChild = () => {
    const newChildren = [
      ...interview.childrenDiscussed,
      { childName: "", childAge: "", behaviorsNoted: "", schoolPerformance: "", medicalTherapy: "", notes: "" },
    ]
    onChange("fosterParentInterview.childrenDiscussed", newChildren)
  }

  const removeChild = (index: number) => {
    const newChildren = interview.childrenDiscussed.filter((_, i) => i !== index)
    onChange("fosterParentInterview.childrenDiscussed", newChildren)
  }

  return (
    <div className="space-y-4">
      <div className="bg-refuge-purple text-white rounded-xl px-4 py-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Foster Parent Interview Summary
        </h2>
        <p className="text-sm text-purple-100 mt-1">
          Document key discussion points from foster parent interview, including updates on each child and any support needs identified.
        </p>
      </div>

      {/* Children Discussed - Tabular Format */}
      <Card>
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Children Discussed</span>
            <Button size="sm" variant="secondary" onClick={addChild} className="bg-white text-refuge-purple hover:bg-purple-50">
              Add Child
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {interview.childrenDiscussed.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <p>No children added yet. Click "Add Child" to add a child or they will be auto-populated from placement data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="text-left p-3 text-sm font-semibold border-r border-slate-300 w-48">Child Name</th>
                    <th className="text-left p-3 text-sm font-semibold border-r border-slate-300">Behaviors Noted</th>
                    <th className="text-left p-3 text-sm font-semibold border-r border-slate-300">School Performance</th>
                    <th className="text-center p-3 text-sm font-semibold w-20">Actions</th>
                  </tr>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="text-left p-3 text-sm font-semibold border-r border-slate-300"></th>
                    <th className="text-left p-3 text-sm font-semibold border-r border-slate-300">Medical/Therapy</th>
                    <th className="text-left p-3 text-sm font-semibold border-r border-slate-300">Notes</th>
                    <th className="text-center p-3 text-sm font-semibold w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {interview.childrenDiscussed.map((child, index) => (
                    <>
                      {/* Row 1: Child Name | Behaviors Noted | School Performance | Actions */}
                      <tr key={`${index}-row1`} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-3 border-r border-slate-200 align-top" rowSpan={2}>
                          <div className="space-y-1">
                            <Label htmlFor={`child-name-${index}`} className="text-xs font-medium text-muted-foreground">
                              Child Name
                            </Label>
                            <Input
                              id={`child-name-${index}`}
                              value={child.childName || ""}
                              onChange={(e) => {
                                const newChildren = [...interview.childrenDiscussed]
                                newChildren[index].childName = e.target.value
                                onChange("fosterParentInterview.childrenDiscussed", newChildren)
                              }}
                              placeholder="Child name"
                              className="text-sm"
                            />
                          </div>
                        </td>
                        <td className="p-3 border-r border-slate-200">
                          <div className="space-y-1">
                            <Label htmlFor={`behaviors-${index}`} className="text-xs font-medium text-muted-foreground">
                              Behaviors Noted
                            </Label>
                            <TextareaWithVoice
                              id={`behaviors-${index}`}
                              value={child.behaviorsNoted || ""}
                              onChange={(e) => {
                                const newChildren = [...interview.childrenDiscussed]
                                newChildren[index].behaviorsNoted = e.target.value
                                onChange("fosterParentInterview.childrenDiscussed", newChildren)
                              }}
                              placeholder="Behavioral observations..."
                              rows={2}
                              className="text-sm min-w-[200px]"
                              showVoiceButton={true}
                            />
                          </div>
                        </td>
                        <td className="p-3 border-r border-slate-200">
                          <div className="space-y-1">
                            <Label htmlFor={`school-${index}`} className="text-xs font-medium text-muted-foreground">
                              School Performance
                            </Label>
                            <TextareaWithVoice
                              id={`school-${index}`}
                              value={child.schoolPerformance || ""}
                              onChange={(e) => {
                                const newChildren = [...interview.childrenDiscussed]
                                newChildren[index].schoolPerformance = e.target.value
                                onChange("fosterParentInterview.childrenDiscussed", newChildren)
                              }}
                              placeholder="School updates..."
                              rows={2}
                              className="text-sm min-w-[200px]"
                              showVoiceButton={true}
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center align-top" rowSpan={2}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChild(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      {/* Row 2: (empty) | Medical/Therapy | Notes | (empty) */}
                      <tr key={`${index}-row2`} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-3 border-r border-slate-200">
                          <div className="space-y-1">
                            <Label htmlFor={`medical-${index}`} className="text-xs font-medium text-muted-foreground">
                              Medical/Therapy
                            </Label>
                            <TextareaWithVoice
                              id={`medical-${index}`}
                              value={child.medicalTherapy || ""}
                              onChange={(e) => {
                                const newChildren = [...interview.childrenDiscussed]
                                newChildren[index].medicalTherapy = e.target.value
                                onChange("fosterParentInterview.childrenDiscussed", newChildren)
                              }}
                              placeholder="Medical/therapy updates..."
                              rows={2}
                              className="text-sm min-w-[200px]"
                              showVoiceButton={true}
                            />
                          </div>
                        </td>
                        <td className="p-3 border-r border-slate-200">
                          <div className="space-y-1">
                            <Label htmlFor={`notes-${index}`} className="text-xs font-medium text-muted-foreground">
                              Notes
                            </Label>
                            <TextareaWithVoice
                              id={`notes-${index}`}
                              value={child.notes || ""}
                              onChange={(e) => {
                                const newChildren = [...interview.childrenDiscussed]
                                newChildren[index].notes = e.target.value
                                onChange("fosterParentInterview.childrenDiscussed", newChildren)
                              }}
                              placeholder="Additional notes..."
                              rows={2}
                              className="text-sm min-w-[200px]"
                              showVoiceButton={true}
                            />
                          </div>
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Foster Parent Support Needs */}
      <Card>
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg">
          <CardTitle className="text-lg">Foster Parent Support Needs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(interview.supportNeeds).map(([area, data]) => (
              <Card key={area} className="border-2">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="capitalize font-semibold">{area.replace(/([A-Z])/g, " $1").trim()}</Label>
                    </div>

                    <div>
                      <Label htmlFor={`${area}-need`}>Need Identified</Label>
                      <Input
                        id={`${area}-need`}
                        value={data.needIdentified}
                        onChange={(e) => onChange(`fosterParentInterview.supportNeeds.${area}.needIdentified`, e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`${area}-support`}>Support Offered</Label>
                      <Input
                        id={`${area}-support`}
                        value={data.supportOffered}
                        onChange={(e) =>
                          onChange(`fosterParentInterview.supportNeeds.${area}.supportOffered`, e.target.value)
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id={`${area}-followup`}
                        checked={data.followUpRequired}
                        onCheckedChange={(checked) =>
                          onChange(`fosterParentInterview.supportNeeds.${area}.followUpRequired`, checked)
                        }
                      />
                      <Label htmlFor={`${area}-followup`} className="cursor-pointer">
                        Follow-up Required
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Combined Notes */}
      <Card>
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg">
          <CardTitle className="text-lg">Combined Notes</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <TextareaWithVoice
            id="foster-parent-combined-notes"
            value={interview.combinedNotes || ""}
            onChange={(e) => onChange("fosterParentInterview.combinedNotes", e.target.value)}
            placeholder="Any additional observations or context from the foster parent interview..."
            rows={4}
            showVoiceButton={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export const QualityEnhancementSection = ({ formData, onChange }) => {
  const quality = formData.qualityEnhancement

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <TrendingUp className="h-6 w-6 text-refuge-purple" />
        Quality Enhancement Discussion
      </h2>

      <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
        <AlertDescription>
          <strong>Optional - T3C Preparation:</strong> This section is <strong>optional</strong> and only needed for homes preparing for T3C (Trust-Based Relational Intervention) certification. 
          It helps document TBRI principles: <strong>Connecting</strong> (building trust), <strong>Empowering</strong> (meeting sensory needs), 
          and <strong>Correcting</strong> (teaching social skills). <strong>This is NOT a compliance requirement</strong> for regular home visits.
        </AlertDescription>
      </Alert>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>Trauma-Informed Practices Observed</span>
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Optional - T3C Only
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Optional:</strong> Only complete this if the home is preparing for T3C certification. Tap buttons to indicate what you observed.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quality.traumaInformedPractices.map((practice, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{practice.practice}</p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[300px]">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={practice.status === "observed" ? "default" : "outline"}
                          onClick={() => {
                            const newPractices = [...quality.traumaInformedPractices]
                            newPractices[index].status = practice.status === "observed" ? "" : "observed"
                            onChange("qualityEnhancement.traumaInformedPractices", newPractices)
                          }}
                        >
                          Observed
                        </Button>
                        <Button
                          size="sm"
                          variant={practice.status === "developing" ? "default" : "outline"}
                          onClick={() => {
                            const newPractices = [...quality.traumaInformedPractices]
                            newPractices[index].status = practice.status === "developing" ? "" : "developing"
                            onChange("qualityEnhancement.traumaInformedPractices", newPractices)
                          }}
                        >
                          In Development
                        </Button>
                        <Button
                          size="sm"
                          variant={practice.status === "not-started" ? "default" : "outline"}
                          onClick={() => {
                            const newPractices = [...quality.traumaInformedPractices]
                            newPractices[index].status = practice.status === "not-started" ? "" : "not-started"
                            onChange("qualityEnhancement.traumaInformedPractices", newPractices)
                          }}
                        >
                          Not Yet Started
                        </Button>
                      </div>
                      {practice.status && (
                        <Textarea
                          placeholder="Notes..."
                          value={practice.notes}
                          onChange={(e) => {
                            const newPractices = [...quality.traumaInformedPractices]
                            newPractices[index].notes = e.target.value
                            onChange("qualityEnhancement.traumaInformedPractices", newPractices)
                          }}
                          className="text-sm"
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-2">
          <Label htmlFor="quality-enhancement-combined-notes" className="text-base font-semibold">
            TBRI Quality Enhancement Observations
          </Label>
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Optional - T3C Only
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          <strong>Optional:</strong> Only complete this if documenting for T3C certification. You can either:
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Option 1: Simple Text Entry (Recommended)</p>
            <TextareaWithVoice
              id="quality-enhancement-combined-notes"
              value={quality.combinedNotes || ""}
              onChange={(e) => {
                // Handle both structured JSON and plain text
                const text = e.target.value
                onChange("qualityEnhancement.combinedNotes", text)
              }}
              placeholder="Describe any TBRI principles you observed: Connecting (trust building), Empowering (sensory needs), Correcting (social skills)..."
              rows={6}
              showVoiceButton={true}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Simply describe what you observed. No navigation or dropdowns needed.
            </p>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Option 2: Guided Questions (Advanced)</p>
            <p className="text-xs text-muted-foreground mb-2">
              If you prefer structured questions, click below to use guided questions. This will walk you through specific TBRI principles.
            </p>
            <GuidedQuestionField
              fieldId="quality-enhancement-observations"
              fieldType="qualityEnhancement"
              value={quality.combinedNotes || ""}
              onChange={(value) => onChange("qualityEnhancement.combinedNotes", value)}
              label="Quality Enhancement Observations"
              context={{}}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export const ChildrenPresentSection = ({ formData, onChange, onAddChild, prepopulationData }) => {
  const children = formData.childrenPresent
  
  // Get placement children from prepopulation data
  const placementChildren = prepopulationData?.placements || []
  const biologicalChildren = formData.household?.biologicalChildren || []
  
  // Combine all children in the home
  const allChildren = [
    ...placementChildren.map(child => ({
      id: `placement-${child.firstName}-${child.lastName}`,
      name: `${child.firstName} ${child.lastName}`,
      age: child.age,
      type: 'Foster Child',
      source: 'placement'
    })),
    ...biologicalChildren.map((child, idx) => ({
      id: `bio-${idx}`,
      name: child.name,
      age: child.age,
      type: 'Biological Child',
      source: 'biological'
    }))
  ]

  const toggleChildPresence = (childData) => {
    const existingIndex = children.findIndex(c => c.name === childData.name)
    
    if (existingIndex >= 0) {
      // Remove child
      const newChildren = children.filter((_, idx) => idx !== existingIndex)
      onChange("childrenPresent", newChildren)
    } else {
      // Add child with prepopulated data
      const newChild = {
        name: childData.name,
        age: childData.age,
        present: true,
        behaviorNotes: "",
        schoolNotes: "",
        medicalNotes: "",
        asqScreening: childData.age >= 10 ? "pending" : "not-required",
        type: childData.type
      }
      onChange("childrenPresent", [...children, newChild])
    }
  }

  const isChildSelected = (childName) => {
    return children.some(c => c.name === childName)
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-foreground">
        <Heart className="h-5 w-5 text-refuge-purple" />
        Children Present
      </h2>

      <Alert className="py-2">
        <AlertDescription className="text-xs">
          <strong>Tap children who were present</strong> during the visit. Full interviews conducted by case managers.
        </AlertDescription>
      </Alert>

      <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 py-2">
        <AlertTriangle className="h-4 w-4 text-yellow-800 dark:text-yellow-200" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-xs">
          <strong>ASQ Screening:</strong> Required for age 10+ every 90 days (quarterly).
        </AlertDescription>
      </Alert>

      {/* Smart Selection - Tap to Toggle */}
      {allChildren.length > 0 && (
        <Card className="bg-slate-50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Children in Home (Tap to Select)</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allChildren.map((child) => (
                <Button
                  key={child.id}
                  type="button"
                  variant={isChildSelected(child.name) ? "default" : "outline"}
                  className={`h-auto py-3 px-4 justify-start ${
                    isChildSelected(child.name)
                      ? "bg-refuge-purple hover:bg-refuge-purple-dark text-white"
                      : "hover:bg-refuge-purple/10"
                  }`}
                  onClick={() => toggleChildPresence(child)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Checkbox
                      checked={isChildSelected(child.name)}
                      className="pointer-events-none"
                    />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-sm">{child.name}</div>
                      <div className="text-xs opacity-90">Age {child.age} • {child.type}</div>
                    </div>
                  </div>
        </Button>
              ))}
      </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Children Details */}
      <div className="space-y-2">
        {children.map((child, index) => (
          <Card key={index} className="border-2 border-refuge-purple/20">
            <CardContent className="p-3">
              <div className="space-y-2">
                {/* Child Header */}
                <div className="flex items-center justify-between">
                <div>
                    <div className="font-semibold">{child.name}</div>
                    <div className="text-xs text-muted-foreground">Age {child.age} • {child.type || 'Child'}</div>
                </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newChildren = children.filter((_, idx) => idx !== index)
                      onChange("childrenPresent", newChildren)
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Remove
                  </Button>
                </div>

                {/* Compact Notes Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor={`child-behavior-${index}`} className="text-xs">Behavior Notes</Label>
                  <Textarea
                    id={`child-behavior-${index}`}
                    value={child.behaviorNotes}
                    onChange={(e) => {
                      const newChildren = [...children]
                      newChildren[index].behaviorNotes = e.target.value
                      onChange("childrenPresent", newChildren)
                    }}
                      placeholder="Demeanor, engagement..."
                      className="text-sm"
                    rows={2}
                  />
                </div>

                <div>
                    <Label htmlFor={`child-school-${index}`} className="text-xs">School Notes</Label>
                  <Textarea
                    id={`child-school-${index}`}
                    value={child.schoolNotes}
                    onChange={(e) => {
                      const newChildren = [...children]
                      newChildren[index].schoolNotes = e.target.value
                      onChange("childrenPresent", newChildren)
                    }}
                      placeholder="If mentioned..."
                      className="text-sm"
                    rows={2}
                  />
                </div>

                <div>
                    <Label htmlFor={`child-medical-${index}`} className="text-xs">Medical/Therapy</Label>
                  <Textarea
                    id={`child-medical-${index}`}
                    value={child.medicalTherapyNotes}
                    onChange={(e) => {
                      const newChildren = [...children]
                      newChildren[index].medicalTherapyNotes = e.target.value
                      onChange("childrenPresent", newChildren)
                    }}
                      placeholder="If mentioned..."
                      className="text-sm"
                    rows={2}
                  />
                  </div>
                </div>

                {/* ASQ Screening for Age 10+ */}
                {parseInt(child.age) >= 10 && (
                  <div className="flex gap-4 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`asq-due-${index}`}
                        checked={child.asqScreeningDue}
                        onCheckedChange={(checked) => {
                          const newChildren = [...children]
                          newChildren[index].asqScreeningDue = checked
                          onChange("childrenPresent", newChildren)
                        }}
                      />
                      <Label htmlFor={`asq-due-${index}`} className="cursor-pointer text-yellow-800 font-semibold text-xs">
                        ASQ Due
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`asq-completed-${index}`}
                        checked={child.asqCompleted}
                        onCheckedChange={(checked) => {
                          const newChildren = [...children]
                          newChildren[index].asqCompleted = checked
                          onChange("childrenPresent", newChildren)
                        }}
                      />
                      <Label htmlFor={`asq-completed-${index}`} className="cursor-pointer text-green-800 text-xs">
                        ASQ Completed
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export const ObservationsSection = ({ formData, onChange }) => {
  const observations = formData.observations

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <FileText className="h-6 w-6 text-refuge-purple" />
        Additional Observations & Comments
      </h2>

      <Alert>
        <AlertDescription>Document all observations objectively. Use this section for important details not captured elsewhere.</AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="environmental">Environmental Observations</Label>
          <TextareaWithVoice
            id="environmental"
            value={observations.environmental}
            onChange={(e) => onChange("observations.environmental", e.target.value)}
            placeholder="Overall home environment, cleanliness, safety observations..."
            rows={4}
            showVoiceButton={true}
          />
        </div>

        <div>
          <Label htmlFor="familyDynamics">Family Dynamics</Label>
          <TextareaWithVoice
            id="familyDynamics"
            value={observations.familyDynamics}
            onChange={(e) => onChange("observations.familyDynamics", e.target.value)}
            placeholder="Interactions between family members, communication patterns..."
            rows={4}
            showVoiceButton={true}
          />
        </div>

        <div>
          <Label htmlFor="childInteractions">Child Interactions</Label>
          <TextareaWithVoice
            id="childInteractions"
            value={observations.childInteractions}
            onChange={(e) => onChange("observations.childInteractions", e.target.value)}
            placeholder="How children interact with each other and foster parents..."
            rows={4}
            showVoiceButton={true}
          />
        </div>

        <div>
          <Label htmlFor="complianceConcerns">Compliance Concerns</Label>
          <TextareaWithVoice
            id="complianceConcerns"
            value={observations.complianceConcerns}
            onChange={(e) => onChange("observations.complianceConcerns", e.target.value)}
            placeholder="Any compliance issues or areas requiring attention..."
            rows={4}
            showVoiceButton={true}
          />
        </div>

        <div>
          <Label htmlFor="recommendations">Recommendations</Label>
          <TextareaWithVoice
            id="recommendations"
            value={observations.recommendations}
            onChange={(e) => onChange("observations.recommendations", e.target.value)}
            placeholder="Suggestions for improvements or resources..."
            rows={4}
            showVoiceButton={true}
          />
        </div>

        <div>
          <Label htmlFor="other">Other Observations</Label>
          <TextareaWithVoice
            id="other"
            value={observations.other}
            onChange={(e) => onChange("observations.other", e.target.value)}
            placeholder="Any other relevant observations..."
            rows={4}
            showVoiceButton={true}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <Label htmlFor="observations-combined-notes">Combined General Observations</Label>
        <TextareaWithVoice
          id="observations-combined-notes"
          value={observations.combinedNotes}
          onChange={(e) => onChange("observations.combinedNotes", e.target.value)}
          placeholder="Summary of overall observations and impressions from the visit..."
          rows={4}
          className="mt-2"
          showVoiceButton={true}
        />
      </div>
    </div>
  )
}

export const FollowUpItemsSection = ({ formData, onChange, onAdd }) => {
  const followUpItems = formData.followUpItems

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <CheckCircle className="h-6 w-6 text-refuge-purple" />
        Follow-Up Items from Previous Visit
      </h2>

      <Alert>
        <AlertDescription>
          Track resolution of issues from the previous visit. Update status and document progress on each item.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={onAdd} variant="outline">
          Add Follow-Up Item
        </Button>
      </div>

      <div className="space-y-4">
        {followUpItems.map((item, index) => (
          <Card key={index} className="border-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor={`followup-issue-${index}`}>Previous Issue</Label>
                  <TextareaWithVoice
                    id={`followup-issue-${index}`}
                    value={item.previousIssue}
                    onChange={(e) => {
                      const newItems = [...followUpItems]
                      newItems[index].previousIssue = e.target.value
                      onChange("followUpItems", newItems)
                    }}
                    rows={2}
                    showVoiceButton={true}
                  />
                </div>

                <div>
                  <Label htmlFor={`followup-status-${index}`}>Current Status</Label>
                  <Select
                    value={item.currentStatus}
                    onValueChange={(value) => {
                      const newItems = [...followUpItems]
                      newItems[index].currentStatus = value
                      onChange("followUpItems", newItems)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="new-plan">New Plan Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`followup-resolution-${index}`}>Resolution Details</Label>
                  <TextareaWithVoice
                    id={`followup-resolution-${index}`}
                    value={item.resolutionDetails}
                    onChange={(e) => {
                      const newItems = [...followUpItems]
                      newItems[index].resolutionDetails = e.target.value
                      onChange("followUpItems", newItems)
                    }}
                    rows={2}
                    showVoiceButton={true}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`followup-notes-${index}`}>Additional Notes</Label>
                  <TextareaWithVoice
                    id={`followup-notes-${index}`}
                    value={item.notes}
                    onChange={(e) => {
                      const newItems = [...followUpItems]
                      newItems[index].notes = e.target.value
                      onChange("followUpItems", newItems)
                    }}
                    rows={2}
                    showVoiceButton={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export const CorrectiveActionsSection = ({ formData, onChange, onAdd }) => {
  const correctiveActions = formData.correctiveActions

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <AlertTriangle className="h-6 w-6 text-refuge-purple" />
        Corrective Actions Required
      </h2>

      <Alert variant="destructive">
        <AlertDescription>
          <strong>Important:</strong> Document all deficiencies that require corrective action. Specify the standard
          violated, action required, and due date. Provide resources and support before citing deficiencies.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={onAdd} variant="outline">
          Add Corrective Action
        </Button>
      </div>

      <div className="space-y-4">
        {correctiveActions.map((action, index) => (
          <Card key={index} className="border-2 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor={`corrective-issue-${index}`}>Issue *</Label>
                  <Textarea
                    id={`corrective-issue-${index}`}
                    value={action.issue}
                    onChange={(e) => {
                      const newActions = [...correctiveActions]
                      newActions[index].issue = e.target.value
                      onChange("correctiveActions", newActions)
                    }}
                    placeholder="Describe the deficiency or non-compliance issue..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor={`corrective-standard-${index}`}>Standard/Requirement *</Label>
                  <Input
                    id={`corrective-standard-${index}`}
                    value={action.standardRequirement}
                    onChange={(e) => {
                      const newActions = [...correctiveActions]
                      newActions[index].standardRequirement = e.target.value
                      onChange("correctiveActions", newActions)
                    }}
                    placeholder="e.g., §749.1521(1-3)"
                  />
                </div>

                <div>
                  <Label htmlFor={`corrective-due-${index}`}>Due Date *</Label>
                  <Input
                    id={`corrective-due-${index}`}
                    type="date"
                    value={action.dueDate}
                    onChange={(e) => {
                      const newActions = [...correctiveActions]
                      newActions[index].dueDate = e.target.value
                      onChange("correctiveActions", newActions)
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`corrective-action-${index}`}>Action Required *</Label>
                  <Textarea
                    id={`corrective-action-${index}`}
                    value={action.actionRequired}
                    onChange={(e) => {
                      const newActions = [...correctiveActions]
                      newActions[index].actionRequired = e.target.value
                      onChange("correctiveActions", newActions)
                    }}
                    placeholder="Specific steps required to correct the deficiency..."
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`corrective-notes-${index}`}>Additional Notes</Label>
                  <Textarea
                    id={`corrective-notes-${index}`}
                    value={action.notes}
                    onChange={(e) => {
                      const newActions = [...correctiveActions]
                      newActions[index].notes = e.target.value
                      onChange("correctiveActions", newActions)
                    }}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export const VisitSummarySection = ({ formData, onChange }) => {
  const { user } = useUser()
  const summary = formData.visitSummary
  const [aiSummary, setAiSummary] = useState("")
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState("")

  // Get user headers for API calls
  const getUserHeaders = () => {
    if (!user) return { "Content-Type": "application/json" }
    return {
      "Content-Type": "application/json",
      "x-user-email": user.emailAddresses[0]?.emailAddress || "",
      "x-user-clerk-id": user.id,
      "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    }
  }

  // Generate full visit summary using AI
  const generateVisitSummary = async () => {
    setGeneratingSummary(true)
    setSummaryError("")
    
    try {
      const response = await fetch("/api/visit-forms/generate-visit-summary", {
        method: "POST",
        headers: getUserHeaders(),
        body: JSON.stringify({ formData }),
      })
      
      const data = await response.json()
      
      if (data.success && data.summary) {
        setAiSummary(data.summary)
        // Also save to formData if there's a field for it
        if (onChange) {
          onChange("visitSummary.aiGeneratedSummary", data.summary)
        }
      } else {
        setSummaryError(data.error || "Failed to generate summary")
      }
    } catch (error) {
      console.error("Error generating visit summary:", error)
      setSummaryError(error instanceof Error ? error.message : "Failed to generate summary")
    } finally {
      setGeneratingSummary(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <Briefcase className="h-6 w-6 text-refuge-purple" />
        Visit Summary
      </h2>

      {/* AI-Powered Visit Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-refuge-purple" />
              AI-Generated Visit Summary
            </CardTitle>
            <Button
              onClick={generateVisitSummary}
              disabled={generatingSummary}
              size="sm"
              className="bg-refuge-purple hover:bg-refuge-magenta"
            >
              {generatingSummary ? "Generating..." : "🤖 Generate Summary"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {summaryError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{summaryError}</AlertDescription>
            </Alert>
          )}
          {aiSummary || summary.aiGeneratedSummary ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm bg-white dark:bg-gray-900 p-4 rounded border">
                {aiSummary || summary.aiGeneratedSummary}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click "Generate Summary" to create an AI-powered comprehensive summary of the visit, including significant dates, 
              compliance status, observations, and key highlights. This summary will be generated before collecting signatures.
            </p>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          Provide an overall assessment of the visit, highlighting strengths, priorities for next visit, and resources
          provided.
        </AlertDescription>
      </Alert>

      {/* Overall Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Compliance Status *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: "fully-compliant", label: "Fully Compliant", color: "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700" },
              {
                value: "substantially-compliant",
                label: "Substantially Compliant with Minor Issues",
                color: "bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700",
              },
              {
                value: "corrective-action",
                label: "Corrective Action Required",
                color: "bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700",
              },
              {
                value: "immediate-intervention",
                label: "Immediate Intervention Needed",
                color: "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700",
              },
            ].map((status) => (
              <Card
                key={status.value}
                className={`cursor-pointer transition-all ${status.color} ${
                  summary.overallStatus === status.value ? "ring-2 ring-refuge-purple" : ""
                }`}
                onClick={() => onChange("visitSummary.overallStatus", status.value)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={summary.overallStatus === status.value} />
                    <Label className="cursor-pointer font-semibold">{status.label}</Label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Strengths Observed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <div key={index}>
                <Label htmlFor={`strength-${index}`}>{index + 1}. Strength</Label>
                <TextareaWithVoice
                  id={`strength-${index}`}
                  value={summary.keyStrengths[index]}
                  onChange={(e) => {
                    const newStrengths = [...summary.keyStrengths]
                    newStrengths[index] = e.target.value
                    onChange("visitSummary.keyStrengths", newStrengths)
                  }}
                  rows={2}
                  showVoiceButton={true}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Areas for Next Visit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Priority Areas for Next Visit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`priority-${index}`}>Priority #{index + 1}</Label>
                      <Input
                        id={`priority-${index}`}
                        value={summary.priorityAreas[index].priority}
                        onChange={(e) => {
                          const newAreas = [...summary.priorityAreas]
                          newAreas[index].priority = e.target.value
                          onChange("visitSummary.priorityAreas", newAreas)
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`priority-desc-${index}`}>Description</Label>
                      <TextareaWithVoice
                        id={`priority-desc-${index}`}
                        value={summary.priorityAreas[index].description}
                        onChange={(e) => {
                          const newAreas = [...summary.priorityAreas]
                          newAreas[index].description = e.target.value
                          onChange("visitSummary.priorityAreas", newAreas)
                        }}
                        rows={2}
                        showVoiceButton={true}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`priority-action-${index}`}>Action Planned</Label>
                      <TextareaWithVoice
                        id={`priority-action-${index}`}
                        value={summary.priorityAreas[index].actionPlanned}
                        onChange={(e) => {
                          const newAreas = [...summary.priorityAreas]
                          newAreas[index].actionPlanned = e.target.value
                          onChange("visitSummary.priorityAreas", newAreas)
                        }}
                        rows={2}
                        showVoiceButton={true}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources Provided */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resources Provided</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resources-training">Training Materials</Label>
              <TextareaWithVoice
                id="resources-training"
                value={summary.resourcesProvided.trainingMaterials}
                onChange={(e) => onChange("visitSummary.resourcesProvided.trainingMaterials", e.target.value)}
                rows={2}
                showVoiceButton={true}
              />
            </div>

            <div>
              <Label htmlFor="resources-contact">Contact Information</Label>
              <TextareaWithVoice
                id="resources-contact"
                value={summary.resourcesProvided.contactInformation}
                onChange={(e) => onChange("visitSummary.resourcesProvided.contactInformation", e.target.value)}
                rows={2}
                showVoiceButton={true}
              />
            </div>

            <div>
              <Label htmlFor="resources-templates">Templates/Forms</Label>
              <TextareaWithVoice
                id="resources-templates"
                value={summary.resourcesProvided.templatesForms}
                onChange={(e) => onChange("visitSummary.resourcesProvided.templatesForms", e.target.value)}
                rows={2}
                showVoiceButton={true}
              />
            </div>

            <div>
              <Label htmlFor="resources-other">Other Resources</Label>
              <TextareaWithVoice
                id="resources-other"
                value={summary.resourcesProvided.other}
                onChange={(e) => onChange("visitSummary.resourcesProvided.other", e.target.value)}
                rows={2}
                showVoiceButton={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Scheduled Visit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Next Scheduled Visit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="next-visit-type">Visit Type *</Label>
              <Select
                value={summary.nextVisit.visitType}
                onValueChange={(value) => onChange("visitSummary.nextVisit.visitType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="next-visit-date">Date</Label>
              <Input
                id="next-visit-date"
                type="date"
                value={summary.nextVisit.date}
                onChange={(e) => onChange("visitSummary.nextVisit.date", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="next-visit-time">Time</Label>
              <Input
                id="next-visit-time"
                type="time"
                value={summary.nextVisit.time}
                onChange={(e) => onChange("visitSummary.nextVisit.time", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="next-visit-location">Location</Label>
              <Input
                id="next-visit-location"
                value={summary.nextVisit.location}
                onChange={(e) => onChange("visitSummary.nextVisit.location", e.target.value)}
                placeholder="In-home, Virtual, etc."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const SignaturesSection = ({ formData, onChange, appointmentData, appointmentId, existingFormData }) => {
  const { user } = useUser()
  const { toast } = useToast()
  const signatures = formData.signatures || {}
  
  // Get foster parents from household data
  const providers = formData.household?.providers || []
  
  // Get staff conducting the visit
  const staffName = appointmentData?.appointment?.assigned_to_name || ""
  const staffRole = appointmentData?.appointment?.assigned_to_role || "Staff"
  
  // Get visit form ID
  const visitFormId = existingFormData?.visit_form_id || null
  
  // Helper to get signature value safely
  const getSignatureValue = (key) => {
    return signatures[key] || ""
  }

  // Helper to handle signature changes
  const handleSignatureChange = (key, value) => {
    onChange(`signatures.${key}`, value)
  }

  // Auto-populate names from providers - always use provider names for clarity
  useEffect(() => {
    // Pre-fill foster parent names from providers (always update to match providers)
    providers.forEach((provider, index) => {
      if (provider.name) {
        const sigKey = `parent${index + 1}`
        const currentValue = signatures[sigKey]
        // Always pre-populate with provider name if it's different or empty
        // This ensures the name field always shows the actual foster parent name
        if (!currentValue || currentValue === "" || currentValue !== provider.name) {
          handleSignatureChange(sigKey, provider.name)
        }
      }
      
      // Ensure date is set if signature exists but date doesn't
      const sigKey = `parent${index + 1}`
      const signature = signatures[`${sigKey}Signature`]
      const date = signatures[`${sigKey}Date`]
      if (signature && (!date || date === "")) {
        handleSignatureChange(`${sigKey}Date`, new Date().toISOString().split("T")[0])
      }
    })

    // Pre-fill staff name
    if (staffName) {
      const currentStaffValue = signatures.staff
      if (!currentStaffValue || currentStaffValue === "" || currentStaffValue !== staffName) {
        handleSignatureChange("staff", staffName)
      }
    }
    
    // Ensure staff date is set if signature exists but date doesn't
    const staffSignature = signatures.staffSignature
    const staffDate = signatures.staffDate
    if (staffSignature && (!staffDate || staffDate === "")) {
      handleSignatureChange("staffDate", new Date().toISOString().split("T")[0])
    }
    
    // Check fallback parent1/parent2 signatures
    const parent1Sig = signatures.parent1Signature
    const parent1Date = signatures.parent1Date
    if (parent1Sig && (!parent1Date || parent1Date === "")) {
      handleSignatureChange("parent1Date", new Date().toISOString().split("T")[0])
    }
    
    const parent2Sig = signatures.parent2Signature
    const parent2Date = signatures.parent2Date
    if (parent2Sig && (!parent2Date || parent2Date === "")) {
      handleSignatureChange("parent2Date", new Date().toISOString().split("T")[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers, staffName]) // Run when providers array or staffName changes (not signatures to avoid loops)

  return (
    <div className="space-y-3">
      <Alert className="py-2">
        <AlertDescription className="text-xs">
          <strong>iPad Signatures:</strong> Foster parents can sign directly on screen with their finger or stylus. All signatures required before submission.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-3">
        {/* Foster Parent Signatures - Show first */}
        {providers.length > 0 ? (
          providers.map((provider, index) => {
            const sigKey = `parent${index + 1}`
            // Always use the actual provider name for display - this is critical for EntityCommunicationBridge lookup
            const providerName = provider.name || ""
            const displayName = providerName || `Foster Parent ${index + 1}`
            const isRequired = index === 0 // First parent is required
            // Prefer provider name, then signature value, then empty
            const nameValue = providerName || getSignatureValue(sigKey) || ""
            
            return (
              <Card key={`parent-${index}`}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">
                    {displayName} Signature {isRequired && "*"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm">Name {isRequired && "*"}</Label>
                    <Input
                      value={nameValue}
                      onChange={(e) => handleSignatureChange(sigKey, e.target.value)}
                      placeholder={providerName || "Type full name"}
                      className="text-sm"
                      // Pre-populate with provider name if empty when field is focused
                      onFocus={(e) => {
                        if (!e.target.value && providerName) {
                          handleSignatureChange(sigKey, providerName)
                        }
                      }}
                    />
                  </div>

                <SignaturePad
                  label={`Signature ${isRequired ? "*" : ""}`}
                  value={getSignatureValue(`${sigKey}Signature`)}
                  onChange={(sig) => {
                    handleSignatureChange(`${sigKey}Signature`, sig)
                    // Auto-set date if signature is captured and date is not set
                    if (sig && !getSignatureValue(`${sigKey}Date`)) {
                      handleSignatureChange(`${sigKey}Date`, new Date().toISOString().split("T")[0])
                    }
                  }}
                />

                <div>
                  <Label className="text-sm">Date {isRequired && "*"}</Label>
                  <Input
                    type="date"
                    value={getSignatureValue(`${sigKey}Date`) || new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      handleSignatureChange(`${sigKey}Date`, e.target.value)
                    }}
                    onBlur={(e) => {
                      // Ensure date is saved even if user just clicked away without changing it
                      const currentDate = getSignatureValue(`${sigKey}Date`)
                      const signature = getSignatureValue(`${sigKey}Signature`)
                      if (signature && (!currentDate || currentDate === "")) {
                        handleSignatureChange(`${sigKey}Date`, new Date().toISOString().split("T")[0])
                      }
                    }}
                    className="text-sm"
                  />
                </div>
                
                {/* Send Signature Link Button */}
                <SendSignatureLinkButton
                  visitFormId={visitFormId}
                  signatureType={`parent${index + 1}`}
                  signatureKey={`${sigKey}Signature`}
                  recipientEmail={provider.email || ""}
                  recipientPhone={provider.phone || ""}
                  recipientName={providerName || nameValue || displayName}
                  entityGuid={provider.guid}
                  fosterFacilityGuid={formData.fosterHome?.homeId}
                  visitDate={formData.visitInfo?.date}
                  familyName={formData.fosterHome?.familyName}
                  createdByUserId={user?.id}
                  createdByName={`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
                />
              </CardContent>
            </Card>
            )
          })
        ) : (
          // Fallback: Show at least one foster parent signature if no providers found
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Foster Parent Signature *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm">Name *</Label>
                <Input
                  value={getSignatureValue("parent1")}
                  onChange={(e) => handleSignatureChange("parent1", e.target.value)}
                  placeholder="Type full name"
                  className="text-sm"
                />
              </div>

              <SignaturePad
                label="Signature *"
                value={getSignatureValue("parent1Signature")}
                onChange={(sig) => {
                  handleSignatureChange("parent1Signature", sig)
                  // Auto-set date if signature is captured and date is not set
                  if (sig && !getSignatureValue("parent1Date")) {
                    handleSignatureChange("parent1Date", new Date().toISOString().split("T")[0])
                  }
                }}
              />

              <div>
                <Label className="text-sm">Date *</Label>
                <Input
                  type="date"
                  value={getSignatureValue("parent1Date") || new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleSignatureChange("parent1Date", e.target.value)}
                  onBlur={(e) => {
                    // Ensure date is saved even if user just clicked away without changing it
                    const currentDate = getSignatureValue("parent1Date")
                    const signature = getSignatureValue("parent1Signature")
                    if (signature && (!currentDate || currentDate === "")) {
                      handleSignatureChange("parent1Date", new Date().toISOString().split("T")[0])
                    }
                  }}
                  className="text-sm"
                />
              </div>
              
              {/* Send Signature Link Button */}
              <SendSignatureLinkButton
                visitFormId={visitFormId}
                signatureType="parent1"
                signatureKey="parent1Signature"
                recipientEmail=""
                recipientPhone=""
                recipientName={getSignatureValue("parent1") || "Foster Parent"}
                fosterFacilityGuid={formData.fosterHome?.homeId}
                visitDate={formData.visitInfo?.date}
                familyName={formData.fosterHome?.familyName}
                createdByUserId={user?.id}
                createdByName={`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
              />
            </CardContent>
          </Card>
        )}

        {/* Staff Signature - Show after foster parents */}
        {staffName && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">{staffName} Signature *</CardTitle>
              {staffRole && (
                <p className="text-xs text-muted-foreground mt-1">{staffRole}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm">Name *</Label>
                <Input
                  value={getSignatureValue("staff") || staffName}
                  onChange={(e) => handleSignatureChange("staff", e.target.value)}
                  placeholder={staffName}
                  className="text-sm"
                />
              </div>

              <SignaturePad
                label="Signature *"
                value={getSignatureValue("staffSignature")}
                onChange={(sig) => {
                  handleSignatureChange("staffSignature", sig)
                  // Auto-set date if signature is captured and date is not set
                  if (sig && !getSignatureValue("staffDate")) {
                    handleSignatureChange("staffDate", new Date().toISOString().split("T")[0])
                  }
                }}
              />

              <div>
                <Label className="text-sm">Date *</Label>
                <Input
                  type="date"
                  value={getSignatureValue("staffDate") || new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleSignatureChange("staffDate", e.target.value)}
                  onBlur={(e) => {
                    // Ensure date is saved even if user just clicked away without changing it
                    const currentDate = getSignatureValue("staffDate")
                    const signature = getSignatureValue("staffSignature")
                    if (signature && (!currentDate || currentDate === "")) {
                      handleSignatureChange("staffDate", new Date().toISOString().split("T")[0])
                    }
                  }}
                  className="text-sm"
                />
              </div>
              
              {/* Send Signature Link Button */}
              <SendSignatureLinkButton
                visitFormId={visitFormId}
                signatureType="staff"
                signatureKey="staffSignature"
                recipientEmail=""
                recipientPhone=""
                recipientName={staffName}
                fosterFacilityGuid={formData.fosterHome?.homeId}
                visitDate={formData.visitInfo?.date}
                familyName={formData.fosterHome?.familyName}
                createdByUserId={user?.id}
                createdByName={`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
              />
            </CardContent>
          </Card>
        )}

      </div>

      <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 py-2">
        <CheckCircle className="h-4 w-4 text-green-800 dark:text-green-200" />
        <AlertDescription className="text-green-800 dark:text-green-200 text-xs">
          <strong>Ready to Submit:</strong> Review all sections before final submission. Ensure all required fields and signatures are complete.
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Send Signature Link Button Component
const SendSignatureLinkButton = ({ 
  visitFormId, 
  signatureType, 
  signatureKey, 
  recipientEmail, 
  recipientPhone,
  recipientName,
  entityGuid,
  fosterFacilityGuid,
  visitDate,
  familyName,
  createdByUserId,
  createdByName,
}: {
  visitFormId: string
  signatureType: string
  signatureKey: string
  recipientEmail?: string
  recipientPhone?: string
  recipientName: string
  entityGuid?: string
  fosterFacilityGuid?: string
  visitDate?: string
  familyName?: string
  createdByUserId?: string
  createdByName?: string
}) => {
  const [open, setOpen] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "sms">("email")
  const [name, setName] = useState(recipientName || "")
  const [email, setEmail] = useState(recipientEmail || "")
  const [phone, setPhone] = useState(recipientPhone || "")
  const [sending, setSending] = useState(false)
  const [loadingContact, setLoadingContact] = useState(false)
  const { toast } = useToast()

  // Helper to format phone number (basic validation)
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")
    // Format as (XXX) XXX-XXXX if 10 digits
    if (digits.length <= 10) {
      if (digits.length === 0) return ""
      if (digits.length <= 3) return `(${digits}`
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
    // If more than 10 digits, assume country code
    return `+${digits.slice(0, -10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  // Get just digits for API call
  const getPhoneDigits = (phoneStr: string) => {
    return phoneStr.replace(/\D/g, "")
  }

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Reset to initial values when dialog opens
      setName(recipientName || "")
      setEmail(recipientEmail || "")
      setPhone(recipientPhone || "")
    }
  }, [open, recipientName, recipientEmail, recipientPhone])

  // Look up contact info from EntityCommunicationBridge when dialog opens
  useEffect(() => {
    if (!open || !fosterFacilityGuid) return
    
    // Fetch contact info from EntityCommunicationBridge
    // This will pre-populate if found, even if we already have some data
    const fetchContactInfo = async () => {
      setLoadingContact(true)
      try {
        const params = new URLSearchParams({
          fosterFacilityGuid: fosterFacilityGuid,
        })
        
        // Prioritize entityGuid (PersonGUID from SyncCurrentFosterFacility)
        // This should match EntityCommunicationBridge.EntityGUID
        if (entityGuid) {
          params.append("entityGuid", entityGuid)
          console.log(`📞 [Signature] Looking up contact for entityGuid: ${entityGuid}, fosterFacilityGuid: ${fosterFacilityGuid}`)
        } else if (recipientName) {
          params.append("entityName", recipientName)
          console.log(`📞 [Signature] Looking up contact for name: ${recipientName}, fosterFacilityGuid: ${fosterFacilityGuid}`)
        } else {
          console.warn(`📞 [Signature] No entityGuid or recipientName provided for lookup`)
        }
        
        const response = await fetch(`/api/entity-communication/lookup?${params.toString()}`)
        const data = await response.json()
        
        console.log(`📞 [Signature] Lookup response:`, data)
        
        if (data.success && data.found && data.data) {
          // Pre-populate name if we have it from the bridge (prefer bridge data)
          if (data.data.name) {
            setName(data.data.name)
            console.log(`📞 [Signature] Pre-populated name: ${data.data.name}`)
          }
          
          // Pre-populate phone if we have it from the bridge (prefer bridge data)
          if (data.data.phone) {
            setPhone(formatPhoneNumber(data.data.phone))
            console.log(`📞 [Signature] Pre-populated phone: ${data.data.phone}`)
          }
          
          // Pre-populate email if we have it from the bridge (prefer bridge data)
          if (data.data.email) {
            setEmail(data.data.email)
            console.log(`📞 [Signature] Pre-populated email: ${data.data.email}`)
          }
        } else {
          console.log(`📞 [Signature] No contact info found in EntityCommunicationBridge`)
        }
      } catch (error) {
        console.error("Error fetching contact info:", error)
        // Silently fail - user can still enter manually
      } finally {
        setLoadingContact(false)
      }
    }
    
    fetchContactInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fosterFacilityGuid, entityGuid, recipientName])

  const handleSendClick = () => {
    // Check if visit form exists - if not, show helpful message
    if (!visitFormId) {
      toast({
        title: "Form Not Saved",
        description: "Please save the form first (click 'Save' button) before sending signature requests.",
        variant: "destructive",
      })
      return
    }

    // Validate based on delivery method
    if (deliveryMethod === "email") {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        toast({
          title: "Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        })
        return
      }
    } else {
      const phoneDigits = getPhoneDigits(phone)
      if (!phoneDigits || phoneDigits.length < 10) {
        toast({
          title: "Error",
          description: "Please enter a valid phone number (at least 10 digits)",
          variant: "destructive",
        })
        return
      }
    }

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter the signer's name",
        variant: "destructive",
      })
      return
    }

    // Show confirmation screen
    setShowConfirmation(true)
  }

  const handleConfirmSend = async () => {

    setSending(true)
    try {
      const requestBody: any = {
          signatureType,
          signatureKey,
        recipientName: name.trim(),
          visitDate,
          familyName,
          createdByUserId,
          createdByName,
      }

      if (deliveryMethod === "email") {
        requestBody.recipientEmail = email.trim()
        requestBody.sendViaSMS = false
      } else {
        requestBody.recipientPhone = getPhoneDigits(phone)
        requestBody.sendViaSMS = true
        // Still need recipientEmail for the API (it's required in schema), use phone as fallback
        requestBody.recipientEmail = getPhoneDigits(phone) + "@sms.refugehouse.org"
      }

      const response = await fetch(`/api/visit-forms/${visitFormId}/signature-tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send signature link")
      }

      toast({
        title: "Signature Link Sent",
        description: `A signature link has been sent to ${deliveryMethod === "email" ? email : phone}`,
      })
      setOpen(false)
      setShowConfirmation(false)
      // Reset form
      setName(recipientName || "")
      setEmail(recipientEmail || "")
      setPhone(recipientPhone || "")
    } catch (error: any) {
      console.error("Error sending signature link:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send signature link",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  // Reset confirmation state when dialog opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setShowConfirmation(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Mail className="h-4 w-4 mr-2" />
          Send Signature Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!showConfirmation ? (
          <>
        <DialogHeader>
          <DialogTitle>Send Signature Link</DialogTitle>
          <DialogDescription>
                Send a secure link to {recipientName || "the signer"} to sign this document remotely.
                {loadingContact && (
                  <span className="text-xs text-muted-foreground block mt-1">
                    Looking up contact information...
                  </span>
                )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
              <Tabs value={deliveryMethod} onValueChange={(value) => setDeliveryMethod(value as "email" | "sms")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    SMS
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="space-y-4 mt-4">
          <div>
                    <Label htmlFor="name">Signer Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the email address even if not in the system
                    </p>
          </div>
                </TabsContent>
                
                <TabsContent value="sms" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name-sms">Signer Name *</Label>
                    <Input
                      id="name-sms"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(555) 123-4567"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the phone number even if not in the system
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </Button>
                <Button onClick={handleSendClick} disabled={sending}>
                  Continue
            </Button>
          </div>
        </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Signature Request</DialogTitle>
              <DialogDescription>
                Please review the details before sending the signature request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>You are about to send a signature request to:</strong>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Signer Name</Label>
                  <p className="font-medium">{name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {deliveryMethod === "email" ? "Email Address" : "Phone Number"}
                  </Label>
                  <p className="font-medium">{deliveryMethod === "email" ? email : phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Delivery Method</Label>
                  <p className="font-medium">{deliveryMethod === "email" ? "Email" : "SMS"}</p>
                </div>
              </div>

              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  This will send a signature request {deliveryMethod === "email" ? "email" : "SMS text message"} to the recipient. 
                  Make sure the contact information is correct before confirming.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmation(false)} 
                  disabled={sending}
                >
                  Back
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setOpen(false)
                    setShowConfirmation(false)
                  }} 
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmSend} 
                  disabled={sending}
                  className="bg-refuge-purple hover:bg-refuge-purple/90"
                >
                  {sending ? "Sending..." : "Confirm & Send"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Files Section Component
export const FilesSection = ({ formData, onChange, appointmentId, existingFormData }) => {
  const { user } = useUser()
  const { toast } = useToast()
  const [attachments, setAttachments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const visitFormId = existingFormData?.visit_form_id || null

  // Fetch attachments
  useEffect(() => {
    if (visitFormId) {
      fetchAttachments()
    } else {
      setLoading(false)
    }
  }, [visitFormId])

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/visit-forms/${visitFormId}/attachments`)
      const data = await response.json()

      if (data.success) {
        setAttachments(data.attachments || [])
      }
    } catch (error) {
      console.error("Error fetching attachments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !visitFormId) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("description", "")
        formData.append("attachmentType", "photo")
        formData.append("createdByUserId", user?.id || "")
        formData.append("createdByName", `${user?.firstName || ""} ${user?.lastName || ""}`.trim())

        const response = await fetch(`/api/visit-forms/${visitFormId}/attachments`, {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload file")
        }
      }

      toast({
        title: "Files Uploaded",
        description: "Files have been successfully uploaded",
      })

      // Refresh attachments list
      await fetchAttachments()

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      const response = await fetch(`/api/visit-forms/${visitFormId}/attachments/${attachmentId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete file")
      }

      toast({
        title: "File Deleted",
        description: "File has been successfully deleted",
      })

      // Refresh attachments list
      await fetchAttachments()
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Delete Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith("image/")) return Image
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!visitFormId) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Please save the form first before uploading files.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <FileText className="h-6 w-6 text-refuge-purple" />
        Files & Attachments
      </h2>

      <Alert>
        <AlertDescription>
          Upload photos, screenshots, or documents related to this visit. Files can be viewed and managed here.
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Choose Files"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Supported: Images, PDF, Word documents (Max 10MB per file)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading files...</div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No files uploaded yet</div>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.mime_type)
                return (
                  <div
                    key={attachment.attachment_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileIcon className="h-5 w-5 text-refuge-purple flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.file_size || 0)} • {new Date(attachment.created_at).toLocaleDateString()}
                        </p>
                        {attachment.description && (
                          <p className="text-xs text-muted-foreground mt-1">{attachment.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(attachment.file_path, "_blank")}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAttachment(attachment.attachment_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

