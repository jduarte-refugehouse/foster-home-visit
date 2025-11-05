// Additional Section Components for Enhanced Home Visit Form
// This file contains the remaining section components that were too large to fit in one file

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Users, TrendingUp, Heart, FileText, AlertTriangle, CheckCircle, Briefcase } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SignaturePad } from "@/components/ui/signature-pad"

export const TraumaInformedCareSection = ({ formData, onChange, onNotesChange }) => {
  const traumaCare = formData.traumaInformedCare

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <Brain className="h-6 w-6 text-refuge-purple" />
        Trauma-Informed Care & Training
      </h2>

      <Alert>
        <AlertDescription>
          <strong>RCC Requirements & T3C Development:</strong> Document training compliance and observe trauma-informed
          practices in the home.
        </AlertDescription>
      </Alert>

      {/* Training Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {traumaCare.items.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Badge variant="outline" className="text-xs mb-2">
                        {item.code}
                      </Badge>
                      <p className="text-sm font-medium">{item.requirement}</p>
                    </div>
                    {/* Compact Status Buttons and Notes - Side by Side */}
                    <div className="flex gap-2 w-full">
                      {/* Buttons - 1/2 width total (1/6 each) */}
                      <div className="flex gap-1 w-1/2">
                        <Button
                          size="sm"
                          variant={item.status === "compliant" ? "default" : "outline"}
                          className={`h-6 flex-1 ${
                            item.status === "compliant"
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "hover:bg-green-50"
                          }`}
                          onClick={() =>
                            onChange("traumaInformedCare", index, "status", item.status === "compliant" ? "" : "compliant")
                          }
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span className="text-xs font-semibold">Compliant</span>
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "non-compliant" ? "default" : "outline"}
                          className={`h-6 flex-1 ${
                            item.status === "non-compliant"
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "hover:bg-red-50"
                          }`}
                          onClick={() =>
                            onChange(
                              "traumaInformedCare",
                              index,
                              "status",
                              item.status === "non-compliant" ? "" : "non-compliant"
                            )
                          }
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span className="text-xs font-semibold">Non-Compliant</span>
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "na" ? "default" : "outline"}
                          className={`h-6 flex-1 ${
                            item.status === "na"
                              ? "bg-slate-600 hover:bg-slate-700 text-white"
                              : "hover:bg-slate-50"
                          }`}
                          onClick={() => onChange("traumaInformedCare", index, "status", item.status === "na" ? "" : "na")}
                        >
                          <span className="text-xs font-semibold">N/A</span>
                        </Button>
                      </div>

                      {/* Notes Field - 1/2 width, required only for non-compliant */}
                      <div className={`w-1/2 transition-opacity duration-200 ${item.status ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                        <Textarea
                          placeholder={item.status === "non-compliant" ? "Notes required..." : item.status ? "Add notes if needed..." : ""}
                          value={item.notes || ""}
                          onChange={(e) => onChange("traumaInformedCare", index, "notes", e.target.value)}
                          className={`text-sm min-h-[24px] h-6 resize-none ${item.status === "non-compliant" && !item.notes ? "border-red-300" : ""}`}
                          rows={1}
                          disabled={!item.status}
                          required={item.status === "non-compliant"}
                          aria-required={item.status === "non-compliant"}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TBRI Strategies */}
      <Card className="border-blue-200 bg-blue-50/30">
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
  const interview = formData.fosterParentInterview

  const addChild = () => {
    const newChildren = [
      ...interview.childrenDiscussed,
      { childName: "", behaviorsNoted: "", schoolPerformance: "", medicalTherapy: "", notes: "" },
    ]
    onChange("fosterParentInterview.childrenDiscussed", newChildren)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <Users className="h-6 w-6 text-refuge-purple" />
        Foster Parent Interview Summary
      </h2>

      <Alert>
        <AlertDescription>
          Document key discussion points from foster parent interview, including updates on each child and any support
          needs identified.
        </AlertDescription>
      </Alert>

      {/* Children Discussed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Children Discussed
            <Button size="sm" variant="outline" onClick={addChild}>
              Add Child
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interview.childrenDiscussed.map((child, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor={`child-name-${index}`}>Child Name</Label>
                      <Input
                        id={`child-name-${index}`}
                        value={child.childName}
                        onChange={(e) => {
                          const newChildren = [...interview.childrenDiscussed]
                          newChildren[index].childName = e.target.value
                          onChange("fosterParentInterview.childrenDiscussed", newChildren)
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`behaviors-${index}`}>Behaviors Noted</Label>
                      <Textarea
                        id={`behaviors-${index}`}
                        value={child.behaviorsNoted}
                        onChange={(e) => {
                          const newChildren = [...interview.childrenDiscussed]
                          newChildren[index].behaviorsNoted = e.target.value
                          onChange("fosterParentInterview.childrenDiscussed", newChildren)
                        }}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`school-${index}`}>School Performance</Label>
                      <Textarea
                        id={`school-${index}`}
                        value={child.schoolPerformance}
                        onChange={(e) => {
                          const newChildren = [...interview.childrenDiscussed]
                          newChildren[index].schoolPerformance = e.target.value
                          onChange("fosterParentInterview.childrenDiscussed", newChildren)
                        }}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`medical-${index}`}>Medical/Therapy</Label>
                      <Textarea
                        id={`medical-${index}`}
                        value={child.medicalTherapy}
                        onChange={(e) => {
                          const newChildren = [...interview.childrenDiscussed]
                          newChildren[index].medicalTherapy = e.target.value
                          onChange("fosterParentInterview.childrenDiscussed", newChildren)
                        }}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`child-notes-${index}`}>Additional Notes</Label>
                      <Textarea
                        id={`child-notes-${index}`}
                        value={child.notes}
                        onChange={(e) => {
                          const newChildren = [...interview.childrenDiscussed]
                          newChildren[index].notes = e.target.value
                          onChange("fosterParentInterview.childrenDiscussed", newChildren)
                        }}
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

      {/* Foster Parent Support Needs */}
      <Card>
        <CardHeader>
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

      <div className="border-t pt-6">
        <Label htmlFor="foster-parent-combined-notes">Combined Notes for Foster Parent Interview</Label>
        <Textarea
          id="foster-parent-combined-notes"
          value={interview.combinedNotes}
          onChange={(e) => onChange("fosterParentInterview.combinedNotes", e.target.value)}
          placeholder="Any additional observations or context from the foster parent interview..."
          rows={4}
          className="mt-2"
        />
      </div>
    </div>
  )
}

export const QualityEnhancementSection = ({ formData, onChange }) => {
  const quality = formData.qualityEnhancement

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-refuge-purple" />
        Quality Enhancement Discussion
      </h2>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription>
          <strong>T3C Preparation - For Development Only:</strong> This section helps prepare for future T3C
          certification. Items here are NOT compliance requirements.
        </AlertDescription>
      </Alert>

      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Trauma-Informed Practices Observed
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
              T3C Development
            </Badge>
          </CardTitle>
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
        <Label htmlFor="quality-enhancement-combined-notes">Strengths and Growth Opportunities</Label>
        <Textarea
          id="quality-enhancement-combined-notes"
          value={quality.combinedNotes}
          onChange={(e) => onChange("qualityEnhancement.combinedNotes", e.target.value)}
          placeholder="Document strengths observed and opportunities for growth in trauma-informed practices..."
          rows={4}
          className="mt-2"
        />
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
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
        <Heart className="h-5 w-5 text-refuge-purple" />
        Children Present
      </h2>

      <Alert className="py-2">
        <AlertDescription className="text-xs">
          <strong>Tap children who were present</strong> during the visit. Full interviews conducted by case managers.
        </AlertDescription>
      </Alert>

      <Alert className="border-yellow-200 bg-yellow-50 py-2">
        <AlertTriangle className="h-4 w-4 text-yellow-800" />
        <AlertDescription className="text-yellow-800 text-xs">
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
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                  <div className="flex gap-4 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
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
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-refuge-purple" />
        Additional Observations & Comments
      </h2>

      <Alert>
        <AlertDescription>Document all observations objectively. Use this section for important details not captured elsewhere.</AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="environmental">Environmental Observations</Label>
          <Textarea
            id="environmental"
            value={observations.environmental}
            onChange={(e) => onChange("observations.environmental", e.target.value)}
            placeholder="Overall home environment, cleanliness, safety observations..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="familyDynamics">Family Dynamics</Label>
          <Textarea
            id="familyDynamics"
            value={observations.familyDynamics}
            onChange={(e) => onChange("observations.familyDynamics", e.target.value)}
            placeholder="Interactions between family members, communication patterns..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="childInteractions">Child Interactions</Label>
          <Textarea
            id="childInteractions"
            value={observations.childInteractions}
            onChange={(e) => onChange("observations.childInteractions", e.target.value)}
            placeholder="How children interact with each other and foster parents..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="complianceConcerns">Compliance Concerns</Label>
          <Textarea
            id="complianceConcerns"
            value={observations.complianceConcerns}
            onChange={(e) => onChange("observations.complianceConcerns", e.target.value)}
            placeholder="Any compliance issues or areas requiring attention..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="recommendations">Recommendations</Label>
          <Textarea
            id="recommendations"
            value={observations.recommendations}
            onChange={(e) => onChange("observations.recommendations", e.target.value)}
            placeholder="Suggestions for improvements or resources..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="other">Other Observations</Label>
          <Textarea
            id="other"
            value={observations.other}
            onChange={(e) => onChange("observations.other", e.target.value)}
            placeholder="Any other relevant observations..."
            rows={4}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <Label htmlFor="observations-combined-notes">Combined General Observations</Label>
        <Textarea
          id="observations-combined-notes"
          value={observations.combinedNotes}
          onChange={(e) => onChange("observations.combinedNotes", e.target.value)}
          placeholder="Summary of overall observations and impressions from the visit..."
          rows={4}
          className="mt-2"
        />
      </div>
    </div>
  )
}

export const FollowUpItemsSection = ({ formData, onChange, onAdd }) => {
  const followUpItems = formData.followUpItems

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
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
                  <Textarea
                    id={`followup-issue-${index}`}
                    value={item.previousIssue}
                    onChange={(e) => {
                      const newItems = [...followUpItems]
                      newItems[index].previousIssue = e.target.value
                      onChange("followUpItems", newItems)
                    }}
                    rows={2}
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
                  <Textarea
                    id={`followup-resolution-${index}`}
                    value={item.resolutionDetails}
                    onChange={(e) => {
                      const newItems = [...followUpItems]
                      newItems[index].resolutionDetails = e.target.value
                      onChange("followUpItems", newItems)
                    }}
                    rows={2}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`followup-notes-${index}`}>Additional Notes</Label>
                  <Textarea
                    id={`followup-notes-${index}`}
                    value={item.notes}
                    onChange={(e) => {
                      const newItems = [...followUpItems]
                      newItems[index].notes = e.target.value
                      onChange("followUpItems", newItems)
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

export const CorrectiveActionsSection = ({ formData, onChange, onAdd }) => {
  const correctiveActions = formData.correctiveActions

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
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
          <Card key={index} className="border-2 border-red-200">
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
  const summary = formData.visitSummary

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <Briefcase className="h-6 w-6 text-refuge-purple" />
        Visit Summary
      </h2>

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
              { value: "fully-compliant", label: "Fully Compliant", color: "bg-green-100 border-green-300" },
              {
                value: "substantially-compliant",
                label: "Substantially Compliant with Minor Issues",
                color: "bg-yellow-100 border-yellow-300",
              },
              {
                value: "corrective-action",
                label: "Corrective Action Required",
                color: "bg-orange-100 border-orange-300",
              },
              {
                value: "immediate-intervention",
                label: "Immediate Intervention Needed",
                color: "bg-red-100 border-red-300",
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
                <Textarea
                  id={`strength-${index}`}
                  value={summary.keyStrengths[index]}
                  onChange={(e) => {
                    const newStrengths = [...summary.keyStrengths]
                    newStrengths[index] = e.target.value
                    onChange("visitSummary.keyStrengths", newStrengths)
                  }}
                  rows={2}
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
                      <Textarea
                        id={`priority-desc-${index}`}
                        value={summary.priorityAreas[index].description}
                        onChange={(e) => {
                          const newAreas = [...summary.priorityAreas]
                          newAreas[index].description = e.target.value
                          onChange("visitSummary.priorityAreas", newAreas)
                        }}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`priority-action-${index}`}>Action Planned</Label>
                      <Textarea
                        id={`priority-action-${index}`}
                        value={summary.priorityAreas[index].actionPlanned}
                        onChange={(e) => {
                          const newAreas = [...summary.priorityAreas]
                          newAreas[index].actionPlanned = e.target.value
                          onChange("visitSummary.priorityAreas", newAreas)
                        }}
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

      {/* Resources Provided */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resources Provided</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resources-training">Training Materials</Label>
              <Textarea
                id="resources-training"
                value={summary.resourcesProvided.trainingMaterials}
                onChange={(e) => onChange("visitSummary.resourcesProvided.trainingMaterials", e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="resources-contact">Contact Information</Label>
              <Textarea
                id="resources-contact"
                value={summary.resourcesProvided.contactInformation}
                onChange={(e) => onChange("visitSummary.resourcesProvided.contactInformation", e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="resources-templates">Templates/Forms</Label>
              <Textarea
                id="resources-templates"
                value={summary.resourcesProvided.templatesForms}
                onChange={(e) => onChange("visitSummary.resourcesProvided.templatesForms", e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="resources-other">Other Resources</Label>
              <Textarea
                id="resources-other"
                value={summary.resourcesProvided.other}
                onChange={(e) => onChange("visitSummary.resourcesProvided.other", e.target.value)}
                rows={2}
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

export const SignaturesSection = ({ formData, onChange }) => {
  const signatures = formData.signatures

  return (
    <div className="space-y-3">
      <Alert className="py-2">
        <AlertDescription className="text-xs">
          <strong>iPad Signatures:</strong> Foster parents can sign directly on screen with their finger or stylus. All signatures required before submission.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-3">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Visitor Signature *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Name *</Label>
              <Input
                value={signatures.visitor}
                onChange={(e) => onChange("signatures.visitor", e.target.value)}
                placeholder="Type your full name"
                className="text-sm"
              />
            </div>

            <SignaturePad
              label="Signature *"
              value={signatures.visitorSignature}
              onChange={(sig) => onChange("signatures.visitorSignature", sig)}
            />

            <div>
              <Label className="text-sm">Date *</Label>
              <Input
                type="date"
                value={signatures.visitorDate}
                onChange={(e) => onChange("signatures.visitorDate", e.target.value)}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Foster Parent 1 Signature *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Name *</Label>
              <Input
                value={signatures.parent1}
                onChange={(e) => onChange("signatures.parent1", e.target.value)}
                placeholder="Type full name"
                className="text-sm"
              />
            </div>

            <SignaturePad
              label="Signature *"
              value={signatures.parent1Signature}
              onChange={(sig) => onChange("signatures.parent1Signature", sig)}
            />

            <div>
              <Label className="text-sm">Date *</Label>
              <Input
                type="date"
                value={signatures.parent1Date}
                onChange={(e) => onChange("signatures.parent1Date", e.target.value)}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Foster Parent 2 Signature (if applicable)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Name</Label>
              <Input
                value={signatures.parent2}
                onChange={(e) => onChange("signatures.parent2", e.target.value)}
                placeholder="Type full name (optional)"
                className="text-sm"
              />
            </div>

            <SignaturePad
              label="Signature"
              value={signatures.parent2Signature}
              onChange={(sig) => onChange("signatures.parent2Signature", sig)}
            />

            <div>
              <Label className="text-sm">Date</Label>
              <Input
                type="date"
                value={signatures.parent2Date}
                onChange={(e) => onChange("signatures.parent2Date", e.target.value)}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Supervisor Signature *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Name *</Label>
              <Input
                value={signatures.supervisor}
                onChange={(e) => onChange("signatures.supervisor", e.target.value)}
                placeholder="Type full name"
                className="text-sm"
              />
            </div>

            <SignaturePad
              label="Signature *"
              value={signatures.supervisorSignature}
              onChange={(sig) => onChange("signatures.supervisorSignature", sig)}
            />

            <div>
              <Label className="text-sm">Date *</Label>
              <Input
                type="date"
                value={signatures.supervisorDate}
                onChange={(e) => onChange("signatures.supervisorDate", e.target.value)}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-green-200 bg-green-50 py-2">
        <CheckCircle className="h-4 w-4 text-green-800" />
        <AlertDescription className="text-green-800 text-xs">
          <strong>Ready to Submit:</strong> Review all sections before final submission. Ensure all required fields and signatures are complete.
        </AlertDescription>
      </Alert>
    </div>
  )
}

