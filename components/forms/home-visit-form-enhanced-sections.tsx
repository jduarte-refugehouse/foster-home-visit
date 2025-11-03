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
                    <div className="flex flex-col gap-2 min-w-[300px]">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={item.status === "compliant" ? "default" : "outline"}
                          className={item.status === "compliant" ? "bg-green-600 hover:bg-green-700" : ""}
                          onClick={() =>
                            onChange("traumaInformedCare", index, "status", item.status === "compliant" ? "" : "compliant")
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Compliant
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "non-compliant" ? "default" : "outline"}
                          className={item.status === "non-compliant" ? "bg-red-600 hover:bg-red-700" : ""}
                          onClick={() =>
                            onChange(
                              "traumaInformedCare",
                              index,
                              "status",
                              item.status === "non-compliant" ? "" : "non-compliant"
                            )
                          }
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Non-Compliant
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "na" ? "default" : "outline"}
                          onClick={() => onChange("traumaInformedCare", index, "status", item.status === "na" ? "" : "na")}
                        >
                          N/A
                        </Button>
                      </div>
                      {item.status && (
                        <Textarea
                          placeholder="Notes (if needed)..."
                          value={item.notes}
                          onChange={(e) => onChange("traumaInformedCare", index, "notes", e.target.value)}
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

export const ChildrenPresentSection = ({ formData, onChange, onAddChild }) => {
  const children = formData.childrenPresent

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <Heart className="h-6 w-6 text-refuge-purple" />
        Children Present
      </h2>

      <Alert>
        <AlertDescription>
          <strong>Liaison Note:</strong> Document children's presence and capture basic information from cursory
          interactions. Full interviews are conducted by case managers during quarterly reviews.
        </AlertDescription>
      </Alert>

      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-800" />
        <AlertDescription className="text-yellow-800">
          <strong>ASQ Screening Reminder:</strong> Required for all children age 10+ every 90 days (quarterly: March,
          June, September, December). If positive screen, follow immediate safety protocols.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={onAddChild} variant="outline">
          Add Child
        </Button>
      </div>

      <div className="space-y-4">
        {children.map((child, index) => (
          <Card key={index} className="border-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`child-name-${index}`}>Child Name *</Label>
                  <Input
                    id={`child-name-${index}`}
                    value={child.name}
                    onChange={(e) => {
                      const newChildren = [...children]
                      newChildren[index].name = e.target.value
                      onChange("childrenPresent", newChildren)
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor={`child-age-${index}`}>Age *</Label>
                  <Input
                    id={`child-age-${index}`}
                    type="number"
                    value={child.age}
                    onChange={(e) => {
                      const newChildren = [...children]
                      newChildren[index].age = e.target.value
                      onChange("childrenPresent", newChildren)
                    }}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id={`child-present-${index}`}
                    checked={child.present}
                    onCheckedChange={(checked) => {
                      const newChildren = [...children]
                      newChildren[index].present = checked
                      onChange("childrenPresent", newChildren)
                    }}
                  />
                  <Label htmlFor={`child-present-${index}`} className="cursor-pointer">
                    Present During Visit
                  </Label>
                </div>

                <div className="md:col-span-3">
                  <Label htmlFor={`child-behavior-${index}`}>Behavior & Interaction Notes</Label>
                  <Textarea
                    id={`child-behavior-${index}`}
                    value={child.behaviorNotes}
                    onChange={(e) => {
                      const newChildren = [...children]
                      newChildren[index].behaviorNotes = e.target.value
                      onChange("childrenPresent", newChildren)
                    }}
                    placeholder="Brief notes from cursory interaction (demeanor, engagement, any concerns observed)..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor={`child-school-${index}`}>School Notes (if mentioned)</Label>
                  <Textarea
                    id={`child-school-${index}`}
                    value={child.schoolNotes}
                    onChange={(e) => {
                      const newChildren = [...children]
                      newChildren[index].schoolNotes = e.target.value
                      onChange("childrenPresent", newChildren)
                    }}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor={`child-medical-${index}`}>Medical/Therapy Notes (if mentioned)</Label>
                  <Textarea
                    id={`child-medical-${index}`}
                    value={child.medicalTherapyNotes}
                    onChange={(e) => {
                      const newChildren = [...children]
                      newChildren[index].medicalTherapyNotes = e.target.value
                      onChange("childrenPresent", newChildren)
                    }}
                    rows={2}
                  />
                </div>

                {parseInt(child.age) >= 10 && (
                  <div className="space-y-2">
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
                      <Label htmlFor={`asq-due-${index}`} className="cursor-pointer text-yellow-800 font-semibold">
                        ASQ Screening Due
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
                      <Label htmlFor={`asq-completed-${index}`} className="cursor-pointer text-green-800">
                        ASQ Completed This Visit
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
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-refuge-purple" />
        Signatures
      </h2>

      <Alert>
        <AlertDescription>
          All required signatures must be collected before submission. Signatures confirm receipt and understanding of
          visit findings.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visitor Signature *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="visitor-sig">Name *</Label>
                <Input
                  id="visitor-sig"
                  value={signatures.visitor}
                  onChange={(e) => onChange("signatures.visitor", e.target.value)}
                  placeholder="Type your full name"
                />
              </div>

              <div>
                <Label htmlFor="visitor-date">Date *</Label>
                <Input
                  id="visitor-date"
                  type="date"
                  value={signatures.visitorDate}
                  onChange={(e) => onChange("signatures.visitorDate", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Foster Parent 1 Signature *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="parent1-sig">Name *</Label>
                <Input
                  id="parent1-sig"
                  value={signatures.parent1}
                  onChange={(e) => onChange("signatures.parent1", e.target.value)}
                  placeholder="Type full name"
                />
              </div>

              <div>
                <Label htmlFor="parent1-date">Date *</Label>
                <Input
                  id="parent1-date"
                  type="date"
                  value={signatures.parent1Date}
                  onChange={(e) => onChange("signatures.parent1Date", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Foster Parent 2 Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="parent2-sig">Name</Label>
                <Input
                  id="parent2-sig"
                  value={signatures.parent2}
                  onChange={(e) => onChange("signatures.parent2", e.target.value)}
                  placeholder="Type full name (if applicable)"
                />
              </div>

              <div>
                <Label htmlFor="parent2-date">Date</Label>
                <Input
                  id="parent2-date"
                  type="date"
                  value={signatures.parent2Date}
                  onChange={(e) => onChange("signatures.parent2Date", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supervisor Signature *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="supervisor-sig">Name *</Label>
                <Input
                  id="supervisor-sig"
                  value={signatures.supervisor}
                  onChange={(e) => onChange("signatures.supervisor", e.target.value)}
                  placeholder="Type full name"
                />
              </div>

              <div>
                <Label htmlFor="supervisor-date">Date *</Label>
                <Input
                  id="supervisor-date"
                  type="date"
                  value={signatures.supervisorDate}
                  onChange={(e) => onChange("signatures.supervisorDate", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-800" />
        <AlertDescription className="text-green-800">
          <strong>Ready to Submit:</strong> Review all sections before final submission. Ensure all required fields are
          complete and signatures are collected.
        </AlertDescription>
      </Alert>
    </div>
  )
}

