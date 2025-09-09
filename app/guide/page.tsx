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
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Suggested Opening Script:</h4>
                  <p className="text-purple-700 dark:text-purple-300">
                    "Hello! I'm here for our monthly home visit. I'm using an enhanced version of our monitoring form
                    today. The core requirements haven't changed, but we've added some discussion items to help prepare
                    for upcoming changes in the foster care system. Let's start with a walk-through, and then we'll sit
                    down to go over everything together."
                  </p>
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

                  <RequirementItem code="§749.1003(7)(b)" title="Rights Posters in English AND Spanish">
                    Must be visibly posted in common area. Both languages required regardless of languages spoken in
                    home. Provide if missing.
                  </RequirementItem>
                </div>
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

                <RequirementItem title="Overall Compliance Status (Select One)">
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
                <RequirementItem title="Critical Phone Numbers">
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

                <AlertBox type="danger">
                  <strong>CRITICAL - Suicide Screening:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Required for ALL children age 10+ every 90 days</li>
                    <li>Due quarterly: March, June, September, December</li>
                    <li>Must be conducted at admission and quarterly thereafter</li>
                    <li>Any positive screen requires immediate safety protocol</li>
                  </ul>
                </AlertBox>
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

        {/* Navigation Tabs */}
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-xl mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
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
