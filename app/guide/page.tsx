"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  FileText,
  Pill,
  Shield,
  Scale,
  Bed,
  Building,
  Trees,
  GraduationCap,
  MessageCircle,
  Users,
  Heart,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
} from "lucide-react"

const tabs = [
  { id: "overview", title: "Overview", icon: Home },
  { id: "preparation", title: "Pre-Visit", icon: FileText },
  { id: "medication", title: "Medication", icon: Pill },
  { id: "safety", title: "Health/Safety", icon: Shield },
  { id: "rights", title: "Rights", icon: Scale },
  { id: "bedroom", title: "Bedrooms", icon: Bed },
  { id: "indoor", title: "Indoor", icon: Building },
  { id: "outdoor", title: "Outdoor", icon: Trees },
  { id: "education", title: "Education", icon: GraduationCap },
  { id: "interview-child", title: "Child Interview", icon: MessageCircle },
  { id: "interview-parent", title: "Parent Interview", icon: Users },
  { id: "normalcy", title: "T3C Prep", icon: Heart },
  { id: "documentation", title: "Documentation", icon: BookOpen },
  { id: "resources", title: "Resources", icon: HelpCircle },
]

const AlertBox = ({
  type,
  children,
}: { type: "info" | "warning" | "danger" | "success"; children: React.ReactNode }) => {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
    danger: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
  }

  const icons = {
    info: Info,
    warning: AlertTriangle,
    danger: AlertTriangle,
    success: CheckCircle,
  }

  const Icon = icons[type]

  return (
    <div className={`p-4 rounded-lg border-2 flex gap-3 mb-4 ${styles[type]}`}>
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  )
}

const RequirementItem = ({ code, title, children }: { code?: string; title: string; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500 mb-3 shadow-sm">
    {code && <div className="text-sm font-mono text-blue-600 dark:text-blue-400 mb-2">{code}</div>}
    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</div>
    <div className="text-gray-700 dark:text-gray-300">{children}</div>
  </div>
)

const TipBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 relative">
    <div className="flex gap-3">
      <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="text-blue-800 dark:text-blue-200">{children}</div>
    </div>
  </div>
)

const ChecklistItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg mb-2 shadow-sm">
    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
    <span className="text-gray-700 dark:text-gray-300">{children}</span>
  </li>
)

const ConversationStarter = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border-l-4 border-purple-500 mb-4">
    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">{title}</h4>
    <div className="text-purple-700 dark:text-purple-300">{children}</div>
  </div>
)

const InterviewQuestion = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-green-500 mb-4 shadow-sm">
    <div className="font-semibold text-green-800 dark:text-green-200 mb-2">{title}</div>
    <div className="text-gray-700 dark:text-gray-300">{children}</div>
  </div>
)

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState("overview")

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <AlertBox type="info">
              <strong>Important Phase 1 Note:</strong> This guide supports the enhanced monitoring form Version 25.1.
              Core Chapter 749 requirements remain unchanged. T3C sections are for discussion and development only, NOT
              compliance monitoring.
            </AlertBox>

            <AlertBox type="danger">
              <strong>Division of Responsibilities:</strong>
              <br />
              As the Home Visit Liaison, you are responsible for household safety, well-being, and compliance oversight.
              The child's case manager separately handles service planning and child-specific goal progress. Do NOT
              document progress on service plans or therapeutic/educational goals - this is the case manager's
              responsibility.
            </AlertBox>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  What's Different in This Version
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Critical Updates in Version 25.1:</h3>
                  <ul className="space-y-2">
                    <ChecklistItem>Enhanced child interview sections for up to 5 children</ChecklistItem>
                    <ChecklistItem>Service level and service package tracking per child</ChecklistItem>
                    <ChecklistItem>Legal status verification (TMC/PMC/JMC/Voluntary)</ChecklistItem>
                    <ChecklistItem>ASQ suicide screening requirement for ages 10+</ChecklistItem>
                    <ChecklistItem>Placement authorization verification</ChecklistItem>
                    <ChecklistItem>Visit summary and compliance status tracking</ChecklistItem>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">What Remains the Same:</h3>
                  <ul className="space-y-2">
                    <ChecklistItem>All existing Chapter 749 minimum standards</ChecklistItem>
                    <ChecklistItem>Three-visit tracking system</ChecklistItem>
                    <ChecklistItem>Page layout and flow</ChecklistItem>
                    <ChecklistItem>Current compliance requirements</ChecklistItem>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">What's Enhanced:</h3>
                  <ul className="space-y-2">
                    <ChecklistItem>Disaster planning requirements (§749.2907-2908)</ChecklistItem>
                    <ChecklistItem>Child rights poster requirement (§749.1003(7)(b))</ChecklistItem>
                    <ChecklistItem>2021 weapon storage update clarification</ChecklistItem>
                    <ChecklistItem>RCC contract enhancement for medication logs</ChecklistItem>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">What's New for Development:</h3>
                  <AlertBox type="warning">
                    These sections are for conversation and planning only - families are NOT being evaluated on these
                    items yet.
                  </AlertBox>
                  <ul className="space-y-2">
                    <ChecklistItem>Normalcy & Child Well-Being section (preparatory)</ChecklistItem>
                    <ChecklistItem>T3C Preparation section (discussion only)</ChecklistItem>
                    <ChecklistItem>Trauma-informed care conversation starters</ChecklistItem>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Visit Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <strong>Primary Goals:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Ensure compliance with all Chapter 749 minimum standards</li>
                    <li>Verify RCC contract requirements are met</li>
                    <li>Support foster families through monitoring and resources</li>
                    <li>Begin conversations about T3C preparation (non-evaluative)</li>
                    <li>Document child well-being and safety</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "preparation":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pre-Visit Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Documents to Bring:</h3>
                  <ul className="space-y-2">
                    <ChecklistItem>Enhanced Digital Monitoring Checklist (current version)</ChecklistItem>
                    <ChecklistItem>Child/Youth Rights posters (English AND Spanish)</ChecklistItem>
                    <ChecklistItem>Disaster plan template</ChecklistItem>
                    <ChecklistItem>Medication log template</ChecklistItem>
                    <ChecklistItem>Basic trauma-informed care handout</ChecklistItem>
                    <ChecklistItem>Normalcy activities checklist</ChecklistItem>
                    <ChecklistItem>Previous visit reports for reference</ChecklistItem>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Review Before Visit:</h3>
                  <ul className="space-y-2">
                    <ChecklistItem>Previous visit notes and any outstanding issues</ChecklistItem>
                    <ChecklistItem>Current placement information and child details</ChecklistItem>
                    <ChecklistItem>Any recent incidents or concerns</ChecklistItem>
                    <ChecklistItem>Upcoming inspection or certification deadlines</ChecklistItem>
                    <ChecklistItem>Special needs or requirements for children in home</ChecklistItem>
                  </ul>
                </div>

                <TipBox>
                  <strong>Pro Tip:</strong> Call ahead to confirm the visit and ensure all household members who need to
                  be present are available. This is especially important for conducting private child interviews.
                </TipBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Opening the Visit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConversationStarter title="Suggested Opening Script:">
                  "Hello! I'm here for our monthly home visit. I'm using an enhanced version of our monitoring form
                  today. The core requirements haven't changed, but we've added some discussion items to help prepare
                  for upcoming changes in the foster care system. Let's start with a walk-through, and then we'll sit
                  down to go over everything together."
                </ConversationStarter>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border-l-4 border-yellow-500">
                  <strong>Documentation Tip:</strong> Note the date, time of arrival, and all persons present at the
                  beginning of your visit documentation.
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "medication":
        return (
          <div className="space-y-6">
            <AlertBox type="danger">
              <strong>Critical:</strong> All medication items are compliance requirements and must be met. Document any
              deficiencies for immediate correction.
            </AlertBox>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medication Requirements
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Storage Requirements:</h3>

                  <RequirementItem code="§749.1463(b)(2)" title="Original Containers">
                    All medications must be stored in original containers with labels intact. Check that prescription
                    labels are legible and match the child's current name.
                  </RequirementItem>

                  <RequirementItem code="§749.1521(1-3)" title="Double Lock Requirement">
                    All medications must be under double lock (e.g., locked box within locked cabinet). Both locks must
                    be functioning and keys controlled.
                  </RequirementItem>

                  <RequirementItem code="§749.1521" title="External Use Medications">
                    Topical medications, creams, and ointments marked "external use only" must be stored separately from
                    oral medications.
                  </RequirementItem>

                  <RequirementItem code="§749.1521(4)" title="Refrigerated Medications">
                    Must be in a locked box within the refrigerator. Box should be clearly labeled and not used for food
                    storage.
                  </RequirementItem>

                  <RequirementItem code="§749.1521(5)" title="Storage Area Cleanliness">
                    Medication storage area must be clean, dry, and organized. No expired medications should be mixed
                    with current medications.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Documentation Requirements:</h3>

                  <RequirementItem code="RCC 5420" title="Medication Administration Record (MAR)">
                    <p>
                      Check that MAR is current and accurate. Should show date, time, medication given, and initials for
                      each administration.
                    </p>
                    <TipBox>
                      <strong>Enhancement:</strong> If family doesn't have a MAR, provide template and explain it
                      protects both them and the children.
                    </TipBox>
                  </RequirementItem>

                  <RequirementItem code="RCC 5420" title="Psychotropic Medications">
                    Form 4526 must be submitted within 5 days for any psychotropic medication. Verify consent forms are
                    current.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Disposal of Medications:</h3>
                  <RequirementItem code="§749.1521 & §749.1523" title="Expired/Discontinued Medications">
                    Must be removed from active storage and properly stored for disposal within 30 days. Should be kept
                    in separate, labeled container until disposal.
                  </RequirementItem>
                </div>

                <InterviewQuestion title="Questions to Ask:">
                  <ul className="list-disc list-inside space-y-1">
                    <li>"Have there been any medication changes since last visit?"</li>
                    <li>"Any challenges with medication administration?"</li>
                    <li>"Do you need any supplies like pill organizers or lock boxes?"</li>
                    <li>"Are you familiar with proper disposal methods for expired medications?"</li>
                  </ul>
                </InterviewQuestion>
              </CardContent>
            </Card>
          </div>
        )

      case "safety":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Health & Safety Requirements
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Annual Inspections:</h3>

                  <RequirementItem code="§749.2905" title="Fire Inspection">
                    Check current inspection date and expiration. Certificate should be on file. If expiring within 30
                    days, remind family to schedule renewal.
                  </RequirementItem>

                  <RequirementItem code="§749.2905" title="Health Inspection">
                    Verify current health inspection is on file. Check expiration date and remind if renewal needed
                    soon.
                  </RequirementItem>
                </div>

                <AlertBox type="warning">
                  <strong>Recently Added Requirements:</strong> These three items are now required for compliance.
                </AlertBox>

                <div>
                  <h3 className="font-semibold mb-3">New/Enhanced Requirements:</h3>

                  <RequirementItem code="§749.2907" title="Written Disaster Plan">
                    <p>Must include:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Evacuation routes for the home</li>
                      <li>Designated meeting place</li>
                      <li>Out-of-area contact person</li>
                      <li>Plan for pets (if applicable)</li>
                    </ul>
                    <TipBox>Provide template if missing. Can be simple one-page document.</TipBox>
                  </RequirementItem>

                  <RequirementItem code="§749.2908" title="Annual Disaster Drill">
                    Must be documented at least annually. Simple documentation acceptable: "Fire drill conducted [date],
                    all household members evacuated to meeting spot in X minutes."
                  </RequirementItem>

                  <RequirementItem code="§749.1003(7)(b)" title="Rights Posters in English AND Spanish">
                    Must be visibly posted in common area. Both languages required regardless of languages spoken in
                    home. Provide if missing.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Fire Safety:</h3>

                  <RequirementItem code="§749.2909" title="Smoke Detectors">
                    Required in hallways outside bedrooms and on each level. Test during visit if possible.
                  </RequirementItem>

                  <RequirementItem code="§749.2913" title="Fire Extinguishers">
                    <p>Required in kitchen and on each level. Check:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Gauge is in green zone</li>
                      <li>Inspection tag is current</li>
                      <li>Pin and seal are intact</li>
                      <li>No visible damage</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Weapon Storage:</h3>

                  <RequirementItem code="§749.2961" title="Firearms Storage (2021 Update)">
                    <AlertBox type="info">
                      <strong>2021 Change:</strong> Trigger lock with ammunition stored in same locked container is now
                      acceptable. Previous requirement of separate storage still acceptable. Gun safe meets all
                      requirements.
                    </AlertBox>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">General Safety:</h3>

                  <RequirementItem code="§749.3041(7)" title="Hazardous Substances">
                    All cleaning supplies, chemicals, and hazardous materials must be out of reach of children or in
                    locked storage.
                  </RequirementItem>

                  <RequirementItem code="§749.2917" title="Pets/Animals">
                    Verify vaccination records are current and animals appear healthy and non-aggressive.
                  </RequirementItem>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "rights":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Children's Rights & Well-Being
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Posting Requirements:</h3>

                  <RequirementItem code="§749.1003(7)(b) / RCC 1110" title="Rights Posters">
                    <p>Must be posted in common area visible to children:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Child/Youth Rights poster in ENGLISH</li>
                      <li>Child/Youth Rights poster in SPANISH</li>
                      <li>Both required regardless of languages spoken</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="RCC 1110" title="Contact Information Display">
                    <p>Following must be posted visibly:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>DFPS Statewide Intake: 1-800-252-5400</li>
                      <li>Foster Care Ombudsman poster</li>
                      <li>Agency emergency contact number</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Rights Documentation:</h3>

                  <RequirementItem code="RCC 1540" title="Rights Review with Child">
                    Form 2530 must be signed indicating rights have been reviewed with child in age-appropriate manner.
                    Check for current signature.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Normalcy Requirements:</h3>

                  <RequirementItem code="§749.2601-2605 / RCC 4410" title="Supporting Normalcy Activities">
                    <p>Verify children are participating in age-appropriate activities:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Sports, clubs, or extracurriculars</li>
                      <li>Social activities with peers</li>
                      <li>Cultural or religious activities</li>
                      <li>Family outings and celebrations</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Family Connections:</h3>

                  <RequirementItem code="RCC 3600" title="Maintaining Connections">
                    <p>Document how family is supporting child's connections to:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Biological family (when appropriate)</li>
                      <li>Siblings</li>
                      <li>Previous caregivers</li>
                      <li>Important friends</li>
                      <li>Cultural community</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="RCC 3610" title="Sibling Visits">
                    If siblings are placed elsewhere within 100 miles, monthly visits must occur. Document frequency and
                    quality of visits.
                  </RequirementItem>
                </div>

                <InterviewQuestion title="Questions for Foster Parents:">
                  <ul className="list-disc list-inside space-y-1">
                    <li>"What activities is [child] involved in?"</li>
                    <li>"How are sibling visits going?"</li>
                    <li>"Any barriers to normalcy activities we can help address?"</li>
                    <li>"How is contact with bio family working?"</li>
                  </ul>
                </InterviewQuestion>
              </CardContent>
            </Card>
          </div>
        )

      case "bedroom":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Bedrooms & Living Space
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Space Requirements:</h3>

                  <RequirementItem code="§749.3029(a)" title="Bedroom Square Footage">
                    <p>Minimum requirements:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>
                        <strong>Single occupancy:</strong> 80 square feet
                      </li>
                      <li>
                        <strong>Multiple occupancy:</strong> 40 square feet per child
                      </li>
                      <li>
                        <strong>Maximum:</strong> 4 children per bedroom
                      </li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="§749.3029(b)" title="Bedroom Requirements">
                    <p>Each bedroom must have:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Window to outside for ventilation/emergency exit</li>
                      <li>Door for privacy</li>
                      <li>Adequate lighting</li>
                      <li>Comfortable temperature control</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Furnishings:</h3>

                  <RequirementItem code="§749.3033" title="Required Furnishings Per Child">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Individual bed with mattress in good condition</li>
                      <li>Clean bedding (sheets, blanket, pillow)</li>
                      <li>Storage for clothing (dresser/closet space)</li>
                      <li>Personal storage space for belongings</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Privacy & Dignity:</h3>

                  <RequirementItem code="§749.2595" title="No Unauthorized Surveillance">
                    No cameras or monitoring devices in bedrooms, bathrooms, or areas where children change clothes.
                  </RequirementItem>

                  <RequirementItem code="§749.3031" title="Sharing Bedrooms">
                    <p>Rules for room sharing:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Children 6+ cannot share with opposite gender</li>
                      <li>Children cannot share with adults (except infants under 18 months)</li>
                      <li>Consider trauma history when making room assignments</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Bathroom Facilities:</h3>

                  <RequirementItem code="§749.3035(a)" title="Bathroom Ratios">
                    Minimum of one toilet, sink, and tub/shower per 8 household members. Must have hot and cold running
                    water.
                  </RequirementItem>
                </div>

                <TipBox>
                  <strong>Assessment Tip:</strong> During bedroom inspection, note personalization - posters, photos,
                  decorations. This indicates the child feels at home and has ownership of their space.
                </TipBox>

                <InterviewQuestion title="Things to Observe:">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Are beds made and rooms reasonably clean?</li>
                    <li>Does child have age-appropriate belongings visible?</li>
                    <li>Is there evidence of hobbies or interests?</li>
                    <li>Are there family photos including the foster child?</li>
                  </ul>
                </InterviewQuestion>
              </CardContent>
            </Card>
          </div>
        )

      case "indoor":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Other Indoor Space Requirements
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Video Surveillance:</h3>

                  <RequirementItem code="§749.2595" title="No Unauthorized Video Surveillance">
                    <p>Cameras or monitoring devices are prohibited in:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Bedrooms</li>
                      <li>Bathrooms</li>
                      <li>Areas where children change clothes</li>
                      <li>Any private spaces</li>
                    </ul>
                    <p className="mt-2">Common area cameras must be disclosed to all household members.</p>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Activity Space:</h3>

                  <RequirementItem code="§749.3037" title="Indoor Activity Space">
                    Minimum 40 square feet of indoor activity space per child (excluding bedrooms and bathrooms).
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Food Storage & Kitchen:</h3>

                  <RequirementItem code="§749.3079(1-4)" title="Food Storage Requirements">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Food properly stored and protected from contamination</li>
                      <li>All food in sealed containers or original packaging</li>
                      <li>Food stored off floor (minimum 6 inches)</li>
                      <li>Separate storage for cleaning supplies</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="§749.3079(5-6)" title="Refrigeration">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Perishables refrigerated promptly</li>
                      <li>Refrigerator temperature 40°F or below</li>
                      <li>Freezer temperature 0°F or below</li>
                      <li>No expired food items</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="§749.3081(a)" title="Kitchen Cleanliness">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Food preparation areas clean and sanitized</li>
                      <li>Dishes washed and properly stored</li>
                      <li>Garbage disposed of regularly</li>
                      <li>No evidence of pests</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">General Indoor Requirements:</h3>

                  <RequirementItem code="§749.3041(1-2)" title="Indoor Areas">
                    <p>All indoor areas must be clean, safe, and in good repair. Check for:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>No exposed wiring or electrical hazards</li>
                      <li>Floors free of tripping hazards</li>
                      <li>Adequate lighting in all rooms</li>
                      <li>Functioning locks on exterior doors</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="§749.3041(3)" title="Exit Access">
                    Exits must not be blocked by furniture or other items. All household members must be able to exit
                    quickly in emergency.
                  </RequirementItem>

                  <RequirementItem code="§749.3041(6)" title="Ventilation">
                    Windows and doors used for ventilation must have intact screens to prevent insect entry.
                  </RequirementItem>

                  <RequirementItem code="§749.3041(8)" title="Pest Control">
                    Home must be free of rodents and insects. Evidence of infestation requires immediate corrective
                    action.
                  </RequirementItem>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "outdoor":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trees className="h-5 w-5" />
                  Outdoor Space Requirements
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Outdoor Activity Space:</h3>

                  <RequirementItem code="§749.3039" title="Outdoor Play Area">
                    <p>Minimum 80 square feet of outdoor activity space per child. Area must be:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Safe and free from hazards</li>
                      <li>Appropriately fenced if near traffic or water</li>
                      <li>Free of toxic plants</li>
                      <li>Equipment age-appropriate and in good repair</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Pool and Water Safety:</h3>

                  <RequirementItem code="§749.3043" title="Swimming Pools and Hot Tubs">
                    <p>If property has pool or hot tub:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Must be fenced with self-closing, self-latching gate</li>
                      <li>Fence minimum 4 feet high</li>
                      <li>Safety equipment readily available</li>
                      <li>Posted rules for use</li>
                      <li>Adult supervision required for children under 12</li>
                      <li>Hot tub covers must lock when not in use</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Outdoor Hazards:</h3>

                  <RequirementItem code="§749.3045" title="Outdoor Safety Check">
                    <p>Inspect outdoor areas for:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Broken glass or sharp objects</li>
                      <li>Holes or uneven surfaces</li>
                      <li>Toxic plants or mushrooms</li>
                      <li>Standing water (mosquito breeding)</li>
                      <li>Unsafe structures (sheds, playhouses)</li>
                      <li>Proper storage of lawn equipment</li>
                      <li>Secure garbage/recycling containers</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Trampolines:</h3>

                  <RequirementItem code="§749.3047" title="Trampoline Safety">
                    <p>If trampoline present:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Safety net enclosure required</li>
                      <li>Padding on springs and frame</li>
                      <li>One child at a time rule</li>
                      <li>Adult supervision for children under 12</li>
                      <li>Regular inspection for wear/damage</li>
                    </ul>
                  </RequirementItem>
                </div>

                <TipBox>
                  <strong>Outdoor Inspection Tip:</strong> Walk the entire perimeter of the property. Check fencing
                  integrity, gate latches, and look for any potential escape routes or hazards a child might encounter.
                </TipBox>

                <InterviewQuestion title="Questions to Ask:">
                  <ul className="list-disc list-inside space-y-1">
                    <li>"How often do the children play outside?"</li>
                    <li>"What outdoor activities do they enjoy?"</li>
                    <li>"Any outdoor safety concerns you've noticed?"</li>
                    <li>"Do you have rules for outdoor play?"</li>
                  </ul>
                </InterviewQuestion>
              </CardContent>
            </Card>
          </div>
        )

      case "education":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education & Life Skills
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Educational Requirements:</h3>

                  <RequirementItem code="§749.1893 / RCC 6700" title="Education Portfolio">
                    <p>Must maintain portfolio containing:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Current report cards</li>
                      <li>School enrollment documents</li>
                      <li>IEP/504 plans if applicable</li>
                      <li>Achievement certificates</li>
                      <li>Standardized test results</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="§749.1893(4)" title="Study Environment">
                    <p>Child must have:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Quiet space for homework</li>
                      <li>Designated homework time</li>
                      <li>Necessary school supplies</li>
                      <li>Access to resources (computer/library)</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="RCC 6100" title="School Enrollment">
                    Verify child is currently enrolled and attending school regularly. Check for any attendance issues.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Life Skills Development:</h3>

                  <RequirementItem code="RCC 4500" title="Basic Life Skills Training">
                    <p>Must provide minimum 2 life skills activities per month. Examples:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Cooking and meal planning</li>
                      <li>Budgeting and money management</li>
                      <li>Laundry and housekeeping</li>
                      <li>Personal hygiene and self-care</li>
                      <li>Social skills and communication</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Youth 14+ Requirements:</h3>

                  <RequirementItem code="RCC 4120" title="Casey Life Skills Assessment">
                    Required for all youth 14 and older. Should be completed annually to track progress.
                  </RequirementItem>

                  <RequirementItem code="RCC 1433" title="PAL (Preparation for Adult Living)">
                    All youth 14+ must be enrolled in PAL program. Verify enrollment and participation.
                  </RequirementItem>
                </div>

                <ConversationStarter title="For Teens - Additional Topics:">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Driver's education progress</li>
                    <li>Work experience or volunteer opportunities</li>
                    <li>College or vocational planning</li>
                    <li>Independent living skills practice</li>
                  </ul>
                </ConversationStarter>
              </CardContent>
            </Card>
          </div>
        )

      case "interview-child":
        return (
          <div className="space-y-6">
            <AlertBox type="danger">
              <strong>CRITICAL REQUIREMENT:</strong> You must conduct and document individual interviews for EACH child
              in placement (up to 5 children). Each child requires their own interview section with complete
              identification and assessment.
            </AlertBox>

            <AlertBox type="info">
              <strong>Privacy Note:</strong> Conduct interviews privately when age-appropriate. Use child's preferred
              space if they have one. Ensure a comfortable, relaxed environment.
            </AlertBox>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Child Identification Requirements (Per Child)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RequirementItem title="Essential Information to Capture:">
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      <strong>Legal Name:</strong> Must match placement authorization
                    </li>
                    <li>
                      <strong>Preferred Name/Nickname:</strong> Document if different
                    </li>
                    <li>
                      <strong>Date of Birth & Age:</strong> Verify accuracy
                    </li>
                    <li>
                      <strong>Placement ID (PID):</strong> Required for tracking
                    </li>
                    <li>
                      <strong>Medicaid #:</strong> Verify current
                    </li>
                    <li>
                      <strong>Placement Date:</strong> Calculate days in placement
                    </li>
                    <li>
                      <strong>Legal Status:</strong> TMC / PMC / JMC / Voluntary
                    </li>
                    <li>
                      <strong>SSCC Region:</strong> Document for compliance
                    </li>
                    <li>
                      <strong>Service Level:</strong> Basic / Moderate / Specialized / Intense
                    </li>
                    <li>
                      <strong>Service Package:</strong> Select applicable package type
                    </li>
                  </ul>
                </RequirementItem>

                <TipBox>
                  <strong>Service Package Options:</strong>
                  <br />• Basic Foster Family Home
                  <br />• Mental & Behavioral Health
                  <br />• IDD/Autism Support
                  <br />• Youth Transition
                  <br />• Pregnant/Parenting Youth
                  <br />• Kinship Support
                </TipBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Building Rapport
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConversationStarter title="Opening Questions (Choose based on age):">
                  <ul className="list-disc list-inside space-y-1">
                    <li>"What's been the best part of your month?"</li>
                    <li>"Tell me about something fun you've done recently."</li>
                    <li>"What's your favorite thing about living here?"</li>
                  </ul>
                </ConversationStarter>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  ASQ Suicide Risk Screening (CRITICAL)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertBox type="danger">
                  <strong>MANDATORY REQUIREMENT:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Required for ALL children age 10+ every 90 days</li>
                    <li>Due quarterly: March, June, September, December</li>
                    <li>Must be conducted at admission AND quarterly thereafter</li>
                    <li>Document date of last ASQ and next due date</li>
                    <li>
                      <span className="bg-red-600 text-white px-2 py-1 rounded font-bold">IMMEDIATE ACTION</span>{" "}
                      required for any positive screen
                    </li>
                    <li>Follow agency safety protocol immediately if positive</li>
                  </ul>
                </AlertBox>

                <RequirementItem title="ASQ Screening Process:">
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>
                      <strong>Verify Age:</strong> Check if child is 10 or older
                    </li>
                    <li>
                      <strong>Check Due Date:</strong> Confirm if screening is due this quarter
                    </li>
                    <li>
                      <strong>Private Setting:</strong> Must be conducted privately without foster parents
                    </li>
                    <li>
                      <strong>Use Approved Tool:</strong> Only use agency-approved ASQ screening tool
                    </li>
                    <li>
                      <strong>Document Completely:</strong> Record all responses exactly
                    </li>
                    <li>
                      <strong>Score Immediately:</strong> Calculate risk level during visit
                    </li>
                    <li>
                      <strong>Take Action:</strong> Follow protocol based on score
                    </li>
                  </ol>
                </RequirementItem>

                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    If ASQ is Positive (ANY positive response):
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-red-700 dark:text-red-300">
                    <li>
                      <strong>DO NOT LEAVE</strong> the child alone
                    </li>
                    <li>Contact supervisor IMMEDIATELY</li>
                    <li>Implement safety plan with foster parents</li>
                    <li>Remove access to means (medications, sharps, etc.)</li>
                    <li>Schedule emergency mental health assessment within 24 hours</li>
                    <li>Document all actions taken</li>
                    <li>Follow up within 48 hours</li>
                  </ol>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <strong>Quarterly Schedule Tracking:</strong>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <strong>Q1 (March):</strong> Due March 1-31
                    </p>
                    <p>
                      <strong>Q2 (June):</strong> Due June 1-30
                    </p>
                    <p>
                      <strong>Q3 (September):</strong> Due September 1-30
                    </p>
                    <p>
                      <strong>Q4 (December):</strong> Due December 1-31
                    </p>
                    <p className="mt-2 italic">Note: If child turns 10 during quarter, begin screening immediately</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Core Interview Areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InterviewQuestion title="General Well-being:">
                  <p>"How have things been going this month?"</p>
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <strong>Listen for:</strong> Emotional regulation, stressors, positive experiences, any mentions of
                    being upset or angry
                  </div>
                </InterviewQuestion>

                <InterviewQuestion title="Daily Life & Routines:">
                  <ul className="list-disc list-inside space-y-1">
                    <li>"What's your typical day like here?"</li>
                    <li>"Tell me about meal times - do you get foods you like?"</li>
                    <li>"How does laundry and keeping your room work?"</li>
                    <li>"Do you have privacy when you need it?"</li>
                  </ul>
                </InterviewQuestion>

                <InterviewQuestion title="School Experience:">
                  <ul className="list-disc list-inside space-y-1">
                    <li>"How's school going?"</li>
                    <li>"Tell me about your friends."</li>
                    <li>"What's your favorite/least favorite subject?"</li>
                    <li>"Is there anything at school you need help with?"</li>
                  </ul>
                </InterviewQuestion>

                <InterviewQuestion title="Relationship with Foster Family:">
                  <ul className="list-disc list-inside space-y-1">
                    <li>"What do you like about living with [foster parent names]?"</li>
                    <li>"Is there anything you wish was different?"</li>
                    <li>"Do you feel listened to when you have concerns?"</li>
                    <li>"Who do you talk to when you're upset?"</li>
                  </ul>
                </InterviewQuestion>

                <InterviewQuestion title="Needs Assessment:">
                  <ul className="list-disc list-inside space-y-1">
                    <li>"Is there anything you need that you don't have?"</li>
                    <li>"Are you able to see/talk to your family/siblings?"</li>
                    <li>"What activities would you like to be involved in?"</li>
                    <li>"How are things going with your therapist/counselor?"</li>
                  </ul>
                </InterviewQuestion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Red Flags Requiring Immediate Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertBox type="danger">
                  <strong>If child reports any of these, follow immediate safety protocols:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      <span className="bg-red-600 text-white px-2 py-1 rounded font-bold">CRITICAL</span> Fear of foster
                      parents
                    </li>
                    <li>
                      <span className="bg-red-600 text-white px-2 py-1 rounded font-bold">CRITICAL</span> Hunger or food
                      restriction as punishment
                    </li>
                    <li>
                      <span className="bg-red-600 text-white px-2 py-1 rounded font-bold">CRITICAL</span> Physical
                      discipline or threats
                    </li>
                    <li>
                      <span className="bg-red-600 text-white px-2 py-1 rounded font-bold">CRITICAL</span> Isolation or
                      extreme restrictions
                    </li>
                    <li>
                      <span className="bg-red-600 text-white px-2 py-1 rounded font-bold">CRITICAL</span> Missing school
                      frequently without valid reason
                    </li>
                    <li>
                      <span className="bg-red-600 text-white px-2 py-1 rounded font-bold">CRITICAL</span> No personal
                      belongings allowed
                    </li>
                    <li>
                      <span className="bg-red-600 text-white px-2 py-1 rounded font-bold">CRITICAL</span> Prevented from
                      family contact without court order
                    </li>
                  </ul>
                </AlertBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Age-Specific Considerations</CardTitle>
              </CardHeader>
              <CardContent>
                <TipBox>
                  <strong>Young Children (5-8):</strong> Use simple language, incorporate play or drawing, keep sessions
                  shorter
                  <br />
                  <br />
                  <strong>Tweens (9-12):</strong> Respect growing need for privacy, ask about friendships, discuss
                  activities
                  <br />
                  <br />
                  <strong>Teens (13+):</strong> Treat more like adults, discuss future plans, respect their autonomy
                </TipBox>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border-l-4 border-yellow-500">
                  <strong>Documentation Tips:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Quote significant statements directly</li>
                    <li>Note body language and emotional state</li>
                    <li>Document both positives and concerns</li>
                    <li>Include child's exact words when reporting concerns</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "interview-parent":
        return (
          <div className="space-y-6">
            <AlertBox type="success">
              <strong>Approach:</strong> Collaborative, not interrogative. Recognize their expertise about the child.
              Balance information gathering with support.
            </AlertBox>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Foster Parent Interview Guide
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Key Topics to Cover:</h3>

                  <InterviewQuestion title="Behavioral Patterns:">
                    <p>"How has [child's] behavior been this month?"</p>
                    <div className="mt-2">
                      <strong>Get specific details on:</strong>
                      <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                        <li>Frequency, intensity, duration of behaviors</li>
                        <li>Triggers and patterns noticed</li>
                        <li>Successful intervention strategies</li>
                        <li>Changes from previous month</li>
                      </ul>
                    </div>
                  </InterviewQuestion>

                  <TipBox>
                    <strong>Documentation Tip:</strong> Avoid labels like "tantrum." Instead document: "Screams, throws
                    objects, episodes last approximately 20 minutes, triggered by transitions."
                  </TipBox>

                  <InterviewQuestion title="Daily Functioning:">
                    <ul className="list-disc list-inside space-y-1">
                      <li>"Walk me through a typical day with [child]."</li>
                      <li>"How independent are they with daily routines?"</li>
                      <li>"How are sleep patterns and eating habits?"</li>
                      <li>"Any concerns about hygiene or self-care?"</li>
                    </ul>
                  </InterviewQuestion>

                  <InterviewQuestion title="Services & Appointments:">
                    <ul className="list-disc list-inside space-y-1">
                      <li>"How is therapy going? Any progress to note?"</li>
                      <li>"Are all medical/dental appointments current?"</li>
                      <li>"How does [child] do with family visits?"</li>
                      <li>"Any challenges with school?"</li>
                    </ul>
                  </InterviewQuestion>

                  <InterviewQuestion title="Activities & Normalcy:">
                    <ul className="list-disc list-inside space-y-1">
                      <li>"What activities is [child] participating in?"</li>
                      <li>"How are peer relationships developing?"</li>
                      <li>"Tell me about family activities they enjoy."</li>
                      <li>"Any interests they'd like to explore?"</li>
                    </ul>
                  </InterviewQuestion>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Support Needs Assessment:</h3>

                  <ConversationStarter title="Always Ask:">
                    <ul className="list-disc list-inside space-y-1">
                      <li>"What support would be most helpful to you right now?"</li>
                      <li>"Are there any behaviors you're struggling to manage?"</li>
                      <li>"What training would be beneficial?"</li>
                      <li>"Do you need respite care?"</li>
                      <li>"How are YOU doing? Any self-care needs?"</li>
                    </ul>
                  </ConversationStarter>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Concerning Responses Requiring Follow-up:</h3>

                  <AlertBox type="warning">
                    <strong>Watch for these signs:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Overwhelm or burnout expressions</li>
                      <li>Punitive discipline approaches</li>
                      <li>Inability to manage behaviors</li>
                      <li>Lack of warmth when discussing child</li>
                      <li>Immediate removal requests</li>
                      <li>Isolation of child from family activities</li>
                    </ul>
                  </AlertBox>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Strengths to Document:</h3>

                  <InterviewQuestion title="Look for and document:">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Creative problem-solving strategies</li>
                      <li>Commitment to child's growth</li>
                      <li>Seeking appropriate help when needed</li>
                      <li>Maintaining important connections</li>
                      <li>Celebrating child's progress</li>
                      <li>Including child in family life</li>
                      <li>Advocating for child's needs</li>
                    </ul>
                  </InterviewQuestion>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border-l-4 border-yellow-500">
                  <strong>Good Documentation Examples:</strong>
                  <p className="mt-2">
                    "Foster parents report child has made significant progress with emotional regulation. They've
                    implemented a calm-down corner with sensory tools that child uses independently 75% of the time when
                    upset. Parents demonstrate warm, patient approach and celebrate small victories."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "normalcy":
        return (
          <div className="space-y-6">
            <AlertBox type="info">
              <strong>Critical Framing:</strong> "This section isn't about compliance - it's about celebrating what
              you're already doing and exploring opportunities. The state is moving toward greater emphasis on normalcy,
              and we want to support you in that transition."
            </AlertBox>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Normalcy & T3C Preparation
                  <Badge variant="secondary">DEVELOPMENT ONLY</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Normalcy Enhancement Areas:</h3>

                  <ConversationStarter title="Age-Appropriate Activities:">
                    <p>
                      <strong>ASK:</strong> "What fun things are the kids involved in?"
                    </p>
                    <p>
                      <strong>CELEBRATE:</strong> Any activities mentioned
                    </p>
                    <p>
                      <strong>EXPLORE:</strong> "Any activities they've expressed interest in?"
                    </p>
                    <p>
                      <strong>SUPPORT:</strong> "How can we help make that happen?"
                    </p>
                  </ConversationStarter>

                  <ConversationStarter title="Educational Support:">
                    <p>
                      <strong>ASK:</strong> "Beyond homework, any educational enrichment happening?"
                    </p>
                    <p>
                      <strong>EXAMPLES:</strong> Library visits, educational apps, museum trips, tutoring
                    </p>
                    <p>
                      <strong>EXPLORE:</strong> "Any educational goals for the children?"
                    </p>
                  </ConversationStarter>

                  <ConversationStarter title="Cultural/Religious Connections:">
                    <p>
                      <strong>ASK:</strong> "How are you supporting their cultural identity?"
                    </p>
                    <p>
                      <strong>SENSITIVE:</strong> This varies greatly by child's background
                    </p>
                    <p>
                      <strong>SUPPORT:</strong> Connect with resources if needed
                    </p>
                  </ConversationStarter>

                  <ConversationStarter title="Life Skills for Teens:">
                    <p>
                      <strong>ASK:</strong> "What life skills are you working on with the teens?"
                    </p>
                    <p>
                      <strong>EXAMPLES:</strong> Cooking, budgeting, job applications, driving
                    </p>
                    <p>
                      <strong>CELEBRATE:</strong> Any efforts in this area
                    </p>
                  </ConversationStarter>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">T3C Preparation Discussion:</h3>

                  <AlertBox type="warning">
                    <strong>Opening Script:</strong> "T3C implementation is coming but isn't here yet. This conversation
                    is just to help you prepare and to identify any support you might need. Nothing we discuss here
                    affects your current compliance or licensing."
                  </AlertBox>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Trauma-Informed Care Practices:</h3>

                  <InterviewQuestion title="Building Trust (Discussion Only):">
                    <ul className="list-disc list-inside space-y-1">
                      <li>"What works best for connecting with [child's name]?"</li>
                      <li>"What activities do you enjoy together?"</li>
                      <li>Share: "Some families find [technique] helpful..."</li>
                    </ul>
                  </InterviewQuestion>

                  <InterviewQuestion title="Managing Dysregulation (Discussion Only):">
                    <ul className="list-disc list-inside space-y-1">
                      <li>"When [child] gets upset, what helps them calm down?"</li>
                      <li>"Have you noticed patterns in what triggers difficult moments?"</li>
                      <li>Offer: "There's a great training on co-regulation strategies..."</li>
                    </ul>
                  </InterviewQuestion>

                  <InterviewQuestion title="Supporting Physical/Sensory Needs (Discussion Only):">
                    <ul className="list-disc list-inside space-y-1">
                      <li>"Have you noticed any sensory preferences or sensitivities?"</li>
                      <li>"What routines seem to work best?"</li>
                      <li>Share: "Some children benefit from sensory tools like weighted blankets..."</li>
                    </ul>
                  </InterviewQuestion>
                </div>

                <TipBox>
                  <strong>Important:</strong> If family is already using trauma-informed practices, acknowledge and
                  celebrate this. If not, present as opportunities for learning, not deficiencies.
                </TipBox>

                <div>
                  <h3 className="font-semibold mb-3">Key Phrases to Use:</h3>
                  <ul className="space-y-2">
                    <ChecklistItem>"That's wonderful that you're..."</ChecklistItem>
                    <ChecklistItem>"Have you considered..."</ChecklistItem>
                    <ChecklistItem>"Other families have found success with..."</ChecklistItem>
                    <ChecklistItem>"What support would help with that?"</ChecklistItem>
                    <ChecklistItem>"Let me connect you with resources for..."</ChecklistItem>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border-l-4 border-yellow-500">
                  <strong>Documentation for Development Sections:</strong>
                  <p>Use phrases like:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>"Opportunities for growth discussed..."</li>
                    <li>"Family interested in learning more about..."</li>
                    <li>"Resources provided for..."</li>
                    <li>"Will follow up with support for..."</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Never write:</strong> "Family not meeting T3C requirements" or "Deficient in trauma-informed
                    care"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "documentation":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Documentation Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">General Documentation Principles:</h3>
                  <ul className="space-y-2">
                    <ChecklistItem>Be objective, specific, and factual</ChecklistItem>
                    <ChecklistItem>Use direct quotes when significant</ChecklistItem>
                    <ChecklistItem>Document both strengths and concerns</ChecklistItem>
                    <ChecklistItem>Include dates, times, and persons present</ChecklistItem>
                    <ChecklistItem>Note follow-up actions needed</ChecklistItem>
                    <ChecklistItem>Check "Notes?" box if additional documentation needed for any item</ChecklistItem>
                    <ChecklistItem>Use combined notes fields for section-specific observations</ChecklistItem>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Visit Summary Requirements:</h3>

                  <RequirementItem title="Overall Compliance Status (Select One):">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>
                        <strong>Fully Compliant:</strong> All requirements met, no issues identified
                      </li>
                      <li>
                        <strong>Substantially Compliant with Minor Issues:</strong> Small corrections needed
                      </li>
                      <li>
                        <strong>Corrective Action Required:</strong> Significant deficiencies found
                      </li>
                      <li>
                        <strong>Immediate Intervention Needed:</strong> Safety concerns or critical issues
                      </li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem title="Key Strengths Observed (Minimum 3):">
                    <p>Document at least three specific strengths observed during visit:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Foster parent engagement and commitment</li>
                      <li>Home environment quality</li>
                      <li>Child adjustment and well-being</li>
                      <li>Compliance with requirements</li>
                      <li>Creative problem-solving</li>
                      <li>Support of normalcy activities</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem title="Priority Areas for Next Visit (Document 3):">
                    <p>Identify three specific areas to focus on during next visit:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Follow-up on corrective actions</li>
                      <li>Check expiring certifications</li>
                      <li>Review new placements</li>
                      <li>Assess ongoing concerns</li>
                      <li>Verify documentation updates</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem title="Resources Provided Documentation:">
                    <p>List all resources given during visit:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>
                        <strong>Training Materials:</strong> Handouts, guides, curriculum
                      </li>
                      <li>
                        <strong>Contact Information:</strong> Support services, emergency contacts
                      </li>
                      <li>
                        <strong>Templates/Forms:</strong> MAR, disaster plan, etc.
                      </li>
                      <li>
                        <strong>Other:</strong> Equipment, supplies, referrals
                      </li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem title="Next Scheduled Visit:">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Visit Type: Monthly / Quarterly / Annual / Follow-up</li>
                      <li>Date, Time, and Location</li>
                      <li>Any special preparations needed</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">For Compliance Sections:</h3>

                  <RequirementItem title="Document exactly as trained:">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Check compliant/non-compliant/N/A boxes</li>
                      <li>Note specific deficiencies found</li>
                      <li>Document corrective actions required</li>
                      <li>Set clear deadlines for corrections</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">For Enhancement/T3C Sections:</h3>

                  <TipBox>
                    <strong>Remember:</strong> These sections are developmental, not evaluative. Focus on growth
                    opportunities and support needs.
                  </TipBox>

                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <strong>Good Documentation Examples:</strong>
                    <div className="mt-2 space-y-3">
                      <p>
                        <strong>Normalcy:</strong>
                        <br />
                        "Family actively supporting child's participation in soccer and youth group. Discussed
                        possibilities for summer camp. Family interested in resources for funding activities."
                      </p>

                      <p>
                        <strong>T3C Preparation:</strong>
                        <br />
                        "Family demonstrates natural use of trauma-informed approaches, including co-regulation and
                        sensory supports. Expressed interest in formal TBRI training when available."
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Critical Incident Documentation:</h3>

                  <AlertBox type="danger">
                    <strong>If safety concerns identified:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Document exact observations/statements</li>
                      <li>Note immediate actions taken</li>
                      <li>Contact supervisor immediately</li>
                      <li>Follow agency protocol for reporting</li>
                      <li>Complete incident report same day</li>
                    </ol>
                  </AlertBox>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Completing the Visit:</h3>

                  <RequirementItem title="Before Leaving:">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Review any deficiencies found with foster parents</li>
                      <li>Provide resources or templates needed</li>
                      <li>Set clear expectations for corrections</li>
                      <li>Schedule follow-up if needed</li>
                      <li>Thank family for their time and service</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Signatures & Certification:</h3>

                  <RequirementItem code="§749.2815(e)" title="Required Signatures">
                    <p>Obtain signatures from:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Agency field staff (you)</li>
                      <li>Foster parent(s) present during visit</li>
                      <li>Supervisor review (if applicable)</li>
                    </ul>
                  </RequirementItem>

                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border-l-4 border-yellow-500">
                    <strong>Certification Statement:</strong>
                    <p>
                      "By signing below, all parties certify that this home visit was conducted in accordance with TAC
                      Chapter 749 Minimum Standards and RCC Contract Requirements."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "resources":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Resources & Quick References
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Critical Phone Numbers:</h3>

                  <RequirementItem title="Emergency Contacts:">
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <strong>DFPS Statewide Intake:</strong> 1-800-252-5400
                      </li>
                      <li>
                        <strong>Foster Care Ombudsman:</strong> 1-844-286-0769
                      </li>
                      <li>
                        <strong>Agency Emergency Line:</strong> [Your Agency Number]
                      </li>
                      <li>
                        <strong>Supervisor Direct:</strong> [Supervisor Number]
                      </li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Required Forms & Documents:</h3>
                  <ul className="space-y-2">
                    <ChecklistItem>Form 2530 - Rights Acknowledgment</ChecklistItem>
                    <ChecklistItem>Form 4526 - Psychotropic Medication Consent</ChecklistItem>
                    <ChecklistItem>Medication Administration Record (MAR) Template</ChecklistItem>
                    <ChecklistItem>Disaster Plan Template</ChecklistItem>
                    <ChecklistItem>Rights Posters (English & Spanish)</ChecklistItem>
                  </ul>
                </div>

                <TipBox>
                  <strong>Quick Reference - Square Footage:</strong>
                  <br />
                  <strong>Bedroom Requirements:</strong>
                  <br />• Single child: 80 sq ft minimum
                  <br />• Multiple children: 40 sq ft per child
                  <br />• Maximum: 4 children per bedroom
                  <br />
                  <br />
                  <strong>Activity Space:</strong>
                  <br />• Indoor: 40 sq ft per child
                  <br />• Outdoor: 80 sq ft per child
                </TipBox>

                <div>
                  <h3 className="font-semibold mb-3">Training Resources:</h3>

                  <RequirementItem title="Recommended Trainings for Foster Parents:">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>TBRI (Trust-Based Relational Intervention)</li>
                      <li>CPR/First Aid Certification</li>
                      <li>Medication Administration</li>
                      <li>De-escalation Techniques</li>
                      <li>Normalcy and Prudent Parenting</li>
                      <li>Cultural Competency</li>
                    </ul>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Common Issues & Solutions:</h3>

                  <InterviewQuestion title="Missing Documentation:">
                    Provide templates immediately, set 7-day deadline for completion
                  </InterviewQuestion>

                  <InterviewQuestion title="Expired Inspections:">
                    Provide contact info for inspectors, require scheduling within 48 hours
                  </InterviewQuestion>

                  <InterviewQuestion title="Medication Storage Issues:">
                    Provide lock boxes if needed, demonstrate proper storage
                  </InterviewQuestion>

                  <InterviewQuestion title="Missing Rights Posters:">
                    Leave copies with family, verify posting before next visit
                  </InterviewQuestion>
                </div>

                <AlertBox type="danger">
                  <strong>CRITICAL - Suicide Screening:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Required for ALL children age 10+ every 90 days</li>
                    <li>Due quarterly: March, June, September, December</li>
                    <li>Must be conducted at admission and quarterly thereafter</li>
                    <li>Any positive screen requires immediate safety protocol</li>
                  </ul>
                </AlertBox>

                <div>
                  <h3 className="font-semibold mb-3">Managing Different Family Responses:</h3>

                  <ConversationStarter title="The Eager Family:">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Celebrate their enthusiasm</li>
                      <li>Provide additional resources</li>
                      <li>Connect with advanced training</li>
                      <li>Consider as mentors for others</li>
                    </ul>
                  </ConversationStarter>

                  <ConversationStarter title="The Overwhelmed Family:">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Reassure that requirements haven't changed</li>
                      <li>Focus on one area for growth</li>
                      <li>Increase support and check-ins</li>
                      <li>Consider respite care options</li>
                    </ul>
                  </ConversationStarter>

                  <ConversationStarter title="The Resistant Family:">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Acknowledge change is challenging</li>
                      <li>Focus only on compliance items</li>
                      <li>Don't push enhancement discussions</li>
                      <li>Document willingness to engage</li>
                    </ul>
                  </ConversationStarter>

                  <ConversationStarter title="The Confused Family:">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Simplify explanations</li>
                      <li>Provide written materials</li>
                      <li>Offer follow-up discussion</li>
                      <li>Connect with peer support</li>
                    </ul>
                  </ConversationStarter>
                </div>

                <AlertBox type="warning">
                  <strong>Contact Supervisor When:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Any safety concerns identified</li>
                    <li>Family refuses required corrections</li>
                    <li>Multiple compliance issues found</li>
                    <li>Removal request from foster parents</li>
                    <li>Child discloses abuse or neglect</li>
                    <li>Medical emergency during visit</li>
                    <li>Support needs exceed available resources</li>
                  </ul>
                </AlertBox>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Visit Completion Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <ChecklistItem>All sections of monitoring form completed</ChecklistItem>
                  <ChecklistItem>Private interview with each child conducted</ChecklistItem>
                  <ChecklistItem>Foster parent interview completed</ChecklistItem>
                  <ChecklistItem>All bedrooms and common areas inspected</ChecklistItem>
                  <ChecklistItem>Medication storage verified</ChecklistItem>
                  <ChecklistItem>Safety equipment checked</ChecklistItem>
                  <ChecklistItem>Rights posters confirmed posted</ChecklistItem>
                  <ChecklistItem>Documentation requirements reviewed</ChecklistItem>
                  <ChecklistItem>Resources provided as needed</ChecklistItem>
                  <ChecklistItem>Follow-up actions clearly communicated</ChecklistItem>
                  <ChecklistItem>All required signatures obtained</ChecklistItem>
                  <ChecklistItem>Copy of report left with family</ChecklistItem>
                </ul>

                <TipBox>
                  <strong>Remember:</strong> Phase 1 is about building bridges, not just compliance monitoring. Your
                  role is to:
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Maintain all current standards (unchanged)</li>
                    <li>Introduce new concepts gently</li>
                    <li>Assess readiness and support needs</li>
                    <li>Build enthusiasm rather than anxiety</li>
                    <li>Document development, not deficiency</li>
                  </ol>
                </TipBox>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Content for this section is being developed.</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-refuge-purple to-refuge-magenta text-white rounded-xl p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">🏠 Home Visit Liaison Reference Guide</h1>
            <p className="text-lg opacity-95">Enhanced Digital Monitoring - TAC Chapter 749 & RCC Requirements</p>
            <p className="text-sm opacity-90 mt-2">Version 25.1 - Phase 1 Implementation</p>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-refuge-purple hover:bg-refuge-light-purple text-white"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.title}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">{renderTabContent()}</div>

        {/* Quick Reference Button */}
        <div className="fixed bottom-6 right-6">
          <Button
            size="lg"
            className="bg-refuge-purple hover:bg-refuge-light-purple text-white shadow-lg rounded-full px-6"
            onClick={() => {
              alert(`Quick Reference Guide - Key Points:

• Bedroom: 80 sq ft single, 40 sq ft per child multiple
• Meds: Double lock required
• Rights posters: English AND Spanish
• Fire extinguisher: Kitchen + each level
• Disaster plan: Written plan required
• ASQ: Age 10+ every 90 days
• Weapons: Trigger lock with ammo OK (2021)`)
            }}
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Quick Reference
          </Button>
        </div>
      </div>
    </div>
  )
}
