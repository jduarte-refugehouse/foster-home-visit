"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
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
  Car,
  Waves,
  Baby,
  Activity,
  Brain,
  Stethoscope,
  ExternalLink,
  Mail,
  Copy,
  ChevronDown,
  ChevronRight,
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
  { id: "vehicles", title: "Vehicles", icon: Car },
  { id: "swimming", title: "Swimming Area", icon: Waves },
  { id: "infants", title: "Infants/Toddlers", icon: Baby },
  { id: "education", title: "Education", icon: GraduationCap },
  { id: "interview-child", title: "Child Interview", icon: MessageCircle },
  { id: "interview-parent", title: "Parent Interview", icon: Users },
  { id: "packages", title: "Package Requirements", icon: Activity },
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

interface RequirementItemProps {
  code?: string
  title: string
  frequency?: "Monthly" | "Quarterly" | "Weekly" | "Annually"
  children: React.ReactNode
  helpText?: string
  detailedHelp?: {
    whatToCheck?: string[]
    redFlags?: string[]
    questionsToAsk?: string[]
    commonIssues?: Array<{ issue: string; solution: string }>
    resources?: Array<{ title: string; url: string }>
    regulatoryLinks?: Array<{ code: string; url: string }>
  }
  quickHint?: string
}

const RequirementItem = ({ 
  code, 
  title, 
  frequency, 
  children,
  helpText,
  detailedHelp,
  quickHint,
}: RequirementItemProps) => {
  const [helpOpen, setHelpOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { toast } = useToast()

  const handleCopyLink = () => {
    const url = `${window.location.origin}/guide${code ? `#${code.replace(/\s+/g, '-').toLowerCase()}` : ''}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      description: "Share this guide section with others",
    })
  }

  const handleSendReference = () => {
    const url = `${window.location.origin}/guide${code ? `#${code.replace(/\s+/g, '-').toLowerCase()}` : ''}`
    const subject = encodeURIComponent(`Home Visit Guide: ${title}`)
    const body = encodeURIComponent(`Reference for: ${title}\n\n${url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  // Create a clean ID from the code for anchor navigation
  // Handle formats like "TAC §749.1521(6), (7), (8)" or "749.1521(6), (7), (8)"
  const itemId = code ? code
    .replace(/§/g, '') // Remove section symbol
    .replace(/tac\s*/gi, '') // Remove "TAC" prefix if present
    .replace(/\s*,\s*/g, '-') // Replace commas and spaces with single dash
    .replace(/[()]/g, '-') // Replace parentheses with dashes
    .replace(/\./g, '-') // Replace dots with dashes
    .replace(/\s+/g, '-') // Replace remaining spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .toLowerCase() : undefined

  return (
    <div 
      id={itemId}
      className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500 mb-3 shadow-sm hover:shadow-md transition-shadow scroll-mt-20"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 flex items-start gap-2">
          <div className="flex-1">
            {code && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{code}</span>
                {detailedHelp?.regulatoryLinks && detailedHelp.regulatoryLinks.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={detailedHelp.regulatoryLinks[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View regulatory reference</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{title}</span>
              {(helpText || detailedHelp || quickHint) && (
                <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{title}</DialogTitle>
                      {code && (
                        <DialogDescription className="font-mono text-sm">{code}</DialogDescription>
                      )}
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {helpText && (
                        <div>
                          <h4 className="font-semibold mb-2">Why This Matters</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{helpText}</p>
                        </div>
                      )}
                      
                      {detailedHelp?.whatToCheck && detailedHelp.whatToCheck.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">What to Check</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                            {detailedHelp.whatToCheck.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {detailedHelp?.redFlags && detailedHelp.redFlags.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">Red Flags</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                            {detailedHelp.redFlags.map((flag, idx) => (
                              <li key={idx} className="text-red-700 dark:text-red-300">{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {detailedHelp?.questionsToAsk && detailedHelp.questionsToAsk.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Questions to Ask</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                            {detailedHelp.questionsToAsk.map((q, idx) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {detailedHelp?.commonIssues && detailedHelp.commonIssues.length > 0 && (
                        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                            {detailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            Common Issues & Solutions
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-3">
                            {detailedHelp.commonIssues.map((item, idx) => (
                              <div key={idx} className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm">
                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                  Issue: {item.issue}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  Solution: {item.solution}
                                </p>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {detailedHelp?.resources && detailedHelp.resources.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Resources</h4>
                          <ul className="space-y-2">
                            {detailedHelp.resources.map((resource, idx) => (
                              <li key={idx}>
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
                                >
                                  {resource.title}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyLink}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSendReference}
                          className="flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Send Reference
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          {frequency && (
            <Badge 
              variant={frequency === "Monthly" ? "default" : frequency === "Quarterly" ? "secondary" : "outline"}
              className="ml-2 whitespace-nowrap"
            >
              {frequency}
            </Badge>
          )}
        </div>
      </div>
      <div className="text-gray-700 dark:text-gray-300">{children}</div>
      {quickHint && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic cursor-help">
                💡 Quick tip: {quickHint}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{quickHint}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

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
  
  // Wrap in TooltipProvider for tooltips to work
  return (
    <TooltipProvider delayDuration={200}>
      <GuideContent activeTab={activeTab} setActiveTab={setActiveTab} />
    </TooltipProvider>
  )
}

function GuideContent({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Handle hash navigation and tab switching from URL
  useEffect(() => {
    // Check for tab parameter in URL
    const tabParam = searchParams.get('tab')
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam)
    }

    // Handle hash navigation after a short delay to ensure content is rendered
    const handleHashNavigation = () => {
      if (window.location.hash) {
        const hash = window.location.hash.substring(1) // Remove the #
        console.log('🔍 [GUIDE] Looking for element with ID:', hash)
        const element = document.getElementById(hash)
        if (element) {
          console.log('✅ [GUIDE] Found element, scrolling to it')
          // Small delay to ensure tab content is rendered
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            // Highlight the element briefly
            element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2')
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2')
            }, 2000)
          }, 300)
        } else {
          console.warn('⚠️ [GUIDE] Element not found with ID:', hash)
          // List all IDs on the page for debugging
          const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id)
          console.log('📋 [GUIDE] Available IDs on page:', allIds.slice(0, 20)) // First 20 for debugging
        }
      }
    }

    // Run immediately and also after a short delay
    handleHashNavigation()
    const timeout = setTimeout(handleHashNavigation, 500)

    return () => clearTimeout(timeout)
  }, [searchParams, setActiveTab, activeTab])

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <AlertBox type="info">
              <strong>Enhanced Monitoring Checklist:</strong> This guide incorporates requirements from TAC Chapter 749, RCC Contract (Term 7), and T3C Blueprint.
              All requirements now include monthly/quarterly frequency designations. Package-specific requirements apply ONLY to homes credentialed for those specialized service packages.
            </AlertBox>

            <AlertBox type="danger">
              <strong>CRITICAL: Role Boundaries - Home Liaison vs. Direct Care Staff</strong>
              <br />
              <br />
              <strong>If you are ONLY a Home Visit Liaison (not a case manager or direct care staff):</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>You conduct <strong>general observation only</strong> - observing children's general well-being, safety, and environment</li>
                <li>You do <strong>NOT</strong> conduct individual child interviews or ASQ suicide risk screenings</li>
                <li>You do <strong>NOT</strong> engage in case-specific interactions or therapeutic discussions</li>
                <li>You focus on <strong>household compliance, safety, and environmental requirements</strong></li>
                <li>You document general observations about child well-being without conducting formal assessments</li>
              </ul>
              <br />
              <strong>If you are Direct Care Staff or Case Manager conducting a home visit:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>You may conduct child interviews and ASQ screenings as part of your role</li>
                <li>You handle case-specific interactions and service planning</li>
                <li>You may combine home monitoring with your direct care responsibilities</li>
              </ul>
              <br />
              <strong>This guide includes sections for both roles.</strong> Home Liaisons should skip the "Child Interview" section entirely.
            </AlertBox>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Role-Specific Guidance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Sections for Home Liaisons ONLY:</h3>
                  <ul className="space-y-2">
                    <ChecklistItem>Pre-Visit Preparation</ChecklistItem>
                    <ChecklistItem>Medication Requirements</ChecklistItem>
                    <ChecklistItem>Health & Safety Inspections</ChecklistItem>
                    <ChecklistItem>Rights Posters & Documentation</ChecklistItem>
                    <ChecklistItem>Bedroom & Living Space Requirements</ChecklistItem>
                    <ChecklistItem>Indoor & Outdoor Space Safety</ChecklistItem>
                    <ChecklistItem>Vehicle Safety (if applicable)</ChecklistItem>
                    <ChecklistItem>Swimming Area Safety (if applicable)</ChecklistItem>
                    <ChecklistItem>Infants/Toddlers Safety (if applicable)</ChecklistItem>
                    <ChecklistItem>Foster Parent Interview (general household observations)</ChecklistItem>
                    <ChecklistItem>Package-Specific Requirements (if home is credentialed)</ChecklistItem>
                    <ChecklistItem>Documentation & Visit Summary</ChecklistItem>
                  </ul>
                </div>

                <AlertBox type="warning">
                  <strong>⚠️ NOT for Home Liaisons:</strong>
                  <br />
                  <strong>Child Interview Section:</strong> Individual child interviews, ASQ suicide risk screenings, and case-specific child assessments are the responsibility of direct care staff/case managers, NOT home liaisons.
                  <br />
                  <br />
                  Home Liaisons should observe children's general well-being and safety during the visit but should NOT conduct formal interviews or screenings.
                </AlertBox>

                <div>
                  <h3 className="font-semibold mb-3">Sections for Direct Care Staff/Case Managers:</h3>
                  <ul className="space-y-2">
                    <ChecklistItem>Individual Child Interviews (up to 5 children)</ChecklistItem>
                    <ChecklistItem>ASQ Suicide Risk Screening (ages 10+ every 90 days)</ChecklistItem>
                    <ChecklistItem>Service level and service package tracking per child</ChecklistItem>
                    <ChecklistItem>Legal status verification (TMC/PMC/JMC/Voluntary)</ChecklistItem>
                    <ChecklistItem>Placement authorization verification</ChecklistItem>
                    <ChecklistItem>Case-specific service planning discussions</ChecklistItem>
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
                  be present are available. 
                  <br />
                  <br />
                  <strong>Note:</strong> If you are a home liaison, you do not need children present for private interviews. 
                  If direct care staff will be conducting child interviews, coordinate with them to ensure children are available.
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
                <ConversationStarter title="Suggested Opening Script (Home Liaison):">
                  "Hello! I'm here for our monthly home visit to check on household safety and compliance. I'll be conducting a walk-through of the home and reviewing requirements with you. This visit focuses on the home environment and compliance with standards."
                </ConversationStarter>

                <ConversationStarter title="If Direct Care Staff Will Also Visit:">
                  "Hello! I'm here for our monthly home visit. The case manager/direct care staff may also be visiting separately to conduct child interviews and case-specific assessments. Today I'm focusing on household safety and compliance requirements."
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

                  <RequirementItem 
                    code="TAC §749.1463(b)(2)" 
                    title="Medications stored in original containers" 
                    frequency="Monthly"
                    helpText="Proper medication storage and handling prevents accidental poisoning, substance misuse, and ensures medications remain effective. Children in foster care often have complex medication regimens requiring careful management."
                    detailedHelp={{
                      whatToCheck: [
                        "All medications in pharmacy-labeled bottles or original packaging",
                        "Labels clearly legible with child's name, medication name, dosage, prescriber",
                        "No medications in unlabeled containers, pill organizers, or baggies"
                      ],
                      redFlags: [
                        "Medications transferred to different containers",
                        "Multiple children's medications mixed together",
                        "Labels missing or illegible",
                        "Expired prescriptions still in use"
                      ],
                      questionsToAsk: [
                        "\"Can you show me where all medications are stored?\"",
                        "\"Are there any over-the-counter medications or vitamins?\"",
                        "\"Do any children have emergency medications (EpiPen, inhaler, seizure meds)?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Foster parent uses weekly pill organizer for convenience",
                          solution: "Explain that this violates TAC requirements. Medications must stay in original containers. Consider using a checklist system instead."
                        },
                        {
                          issue: "Old medications not disposed of properly",
                          solution: "Provide information on medication take-back programs or safe disposal methods. Most pharmacies accept medication returns."
                        }
                      ],
                      resources: [
                        {
                          title: "DFPS Medication Management Training",
                          url: "https://www.dfps.state.tx.us/Training/"
                        },
                        {
                          title: "DFPS Psychotropic Medication Guidelines",
                          url: "https://www.dfps.state.tx.us/Child_Protection/Medical_Services/psychotropic_medications.asp"
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.1463",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=1463"
                        },
                        {
                          code: "TAC §749.1521",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=1521"
                        }
                      ]
                    }}
                    quickHint="Check labels are intact and match current child's name"
                  >
                    All medications must be stored in original containers with labels intact. Check that prescription
                    labels are legible and match the child's current name.
                  </RequirementItem>

                  <RequirementItem 
                    code="TAC §749.1521(1), (2), (3)" 
                    title="All medications locked; Schedule II double-locked" 
                    frequency="Monthly"
                    helpText="Schedule II medications have high abuse potential. Verify youth do not have access to keys or combinations. This is a critical safety requirement."
                    detailedHelp={{
                      whatToCheck: [
                        "ALL medications (prescription and OTC) in locked location",
                        "Schedule II controlled substances under DOUBLE lock",
                        "Lock functional (test it!)",
                        "Key access limited to designated adults only"
                      ],
                      redFlags: [
                        "Two separate locks on same cabinet door (NOT double lock)",
                        "Schedule II medications accessible to youth",
                        "Lock not functional or keys accessible to children",
                        "No separate secure container for Schedule II"
                      ],
                      questionsToAsk: [
                        "\"Where are the keys kept?\"",
                        "\"Who has access to medication storage?\"",
                        "\"Can you show me how the double lock works?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Foster parent thinks two locks on one door is double lock",
                          solution: "Double lock means locked box INSIDE locked cabinet. Verify the Schedule II medications are in a separate locked container within the main locked storage."
                        }
                      ],
                      resources: [
                        {
                          title: "DEA Schedule II Drug List",
                          url: "https://www.dea.gov/drug-information/drug-scheduling"
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.1521",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=1521"
                        }
                      ]
                    }}
                    quickHint="Double lock = locked box INSIDE locked cabinet, not two locks on one door"
                  >
                    All medications stored in locked container; Schedule II controlled substances under double lock in separate, secure container. Both locks must
                    be functioning and keys controlled.
                  </RequirementItem>

                  <RequirementItem 
                    code="TAC §749.1521(4)" 
                    title="Refrigerated medications properly stored" 
                    frequency="Monthly"
                    helpText="Refrigerated medications must be locked inside the refrigerator to prevent access while maintaining proper temperature. Critical medications like insulin can lose effectiveness if not stored correctly."
                    detailedHelp={{
                      whatToCheck: [
                        "Refrigerated medications in locked container INSIDE refrigerator",
                        "Temperature appropriate (35-46°F / 2-8°C is typical for medications)",
                        "Medications separated from food to prevent contamination",
                        "Labels clearly visible"
                      ],
                      redFlags: [
                        "Shelf in regular refrigerator without lock",
                        "Mixed with food items without separation",
                        "Insulin or other critical medications stored without proper temperature control"
                      ],
                      questionsToAsk: [
                        "\"Do any children have medications that need refrigeration?\"",
                        "\"Where are these stored?\"",
                        "\"How do you ensure children can't access them?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Medications stored on refrigerator shelf without lock",
                          solution: "Must use locked medication box, drawer, or dedicated mini-fridge. Provide lock boxes if needed."
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.1521",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=1521"
                        }
                      ]
                    }}
                    quickHint="Common refrigerated meds: Insulin, some antibiotics, growth hormone"
                  >
                    Medications requiring refrigeration properly stored in locked container within refrigerator. Box should be clearly labeled and not used for food
                    storage.
                  </RequirementItem>

                  <RequirementItem 
                    code="TAC §749.1521(5)" 
                    title="Medication storage areas clean and orderly" 
                    frequency="Monthly"
                    helpText="Disorganized medication storage increases risk of medication errors, missing doses, and giving expired medications. Clean, organized storage is essential for safety."
                    detailedHelp={{
                      whatToCheck: [
                        "No dust, spills, or debris in medication storage area",
                        "Medications organized (not jumbled together)",
                        "Easy to locate specific medication quickly",
                        "No expired medications mixed with current ones",
                        "Storage area not cluttered with non-medication items"
                      ],
                      redFlags: [
                        "Medications loose in drawer with other items",
                        "Spilled pills or liquids",
                        "Sticky residue or dust accumulation",
                        "Unable to quickly locate a specific medication"
                      ],
                      questionsToAsk: [
                        "\"Can you quickly find [child's name]'s morning medication?\"",
                        "\"How do you organize medications?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Medications disorganized and hard to find",
                          solution: "Recommend organizing by child, then by time of day. Use small containers or bags to separate. Keep medication log nearby."
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.1521",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=1521"
                        }
                      ]
                    }}
                    quickHint="Rate organization: Well-organized / Adequate / Needs improvement / Unsafe"
                  >
                    Medication storage area(s) clean, orderly, and free from expired/discontinued medications. No expired medications should be mixed
                    with current medications.
                  </RequirementItem>

                  <RequirementItem 
                    code="TAC §749.1521(6), (7), (8)" 
                    title="Expired/discontinued medications properly managed" 
                    frequency="Monthly"
                    helpText="Three-step process: Immediate removal, separate locked storage, then disposal within 30 days. Expired medications pose safety risks and must be managed properly."
                    detailedHelp={{
                      whatToCheck: [
                        "No expired medications in active storage",
                        "Discontinued medications removed (child discharged, prescription changed)",
                        "Separated medications clearly labeled \"For Disposal\"",
                        "Documentation of disposal plan"
                      ],
                      redFlags: [
                        "Expired medications from more than 30 days ago still on premises",
                        "Medications from discharged children mixed with current children's meds",
                        "No tracking system for disposal",
                        "Caregiver unaware of disposal requirements"
                      ],
                      questionsToAsk: [
                        "\"Have any children been discharged recently? Where are their medications?\"",
                        "\"Do you have any medications waiting to be disposed of?\"",
                        "\"When were they set aside for disposal?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Foster parent doesn't know how to dispose of medications",
                          solution: "Provide information on medication take-back programs (most pharmacies accept), DEA-approved collection sites, or safe home disposal methods."
                        },
                        {
                          issue: "Old medications still in active storage",
                          solution: "Immediately remove and place in separate locked container labeled \"For Disposal\". Set 30-day deadline for disposal."
                        }
                      ],
                      resources: [
                        {
                          title: "Find DEA Collection Sites",
                          url: "https://apps.deadiversion.usdoj.gov/pubdispsearch/"
                        },
                        {
                          title: "FDA Medication Disposal Guidelines",
                          url: "https://www.fda.gov/drugs/safe-disposal-medicines"
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.1521",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=1521"
                        }
                      ]
                    }}
                    quickHint="Three steps: Remove → Separate → Dispose (within 30 days)"
                  >
                    Discontinued medications, expired medications, or medications of discharged/deceased child removed immediately from active storage and stored separately until properly destroyed (within 30 days).
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

                  <RequirementItem 
                    code="TAC §749.2902, §749.2903, §749.2905" 
                    title="Fire and health inspections current" 
                    frequency="Quarterly"
                    helpText="Fire and health inspections ensure the home meets safety and health codes. Overdue inspections may require pausing new placements until compliance is verified."
                    detailedHelp={{
                      whatToCheck: [
                        "Inspection certificates posted or available",
                        "Inspection dates within required timeframe",
                        "No outstanding violations or corrections pending",
                        "Contact information for local fire marshal/health dept current"
                      ],
                      redFlags: [
                        "No documentation of inspections",
                        "Inspections expired more than 30 days",
                        "Outstanding violations not corrected",
                        "Foster parent unaware of inspection requirement"
                      ],
                      questionsToAsk: [
                        "\"Can I see your fire and health inspection certificates?\"",
                        "\"When do they expire?\"",
                        "\"Are there any outstanding violations?\""
                      ],
                      commonIssues: [
                        {
                          issue: "New foster parents unaware they need inspections",
                          solution: "Explain requirement and help coordinate with local authorities. Provide contact information for fire marshal and health department."
                        },
                        {
                          issue: "Lost documentation but inspection was completed",
                          solution: "Contact local authorities to get copies. Verify inspection date with authorities."
                        },
                        {
                          issue: "Inspections overdue",
                          solution: "Document the gap, verify no changes to home since last inspection, contact authorities to schedule immediately, follow up within 2 weeks. May need to pause new placements until current."
                        }
                      ],
                      resources: [
                        {
                          title: "Texas Fire Marshal's Office",
                          url: "https://www.tdi.texas.gov/fire/fmabout.html"
                        },
                        {
                          title: "County Health Department Directory",
                          url: "https://www.dshs.texas.gov/region-local-health-departments-lhds"
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.2902",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=2902"
                        },
                        {
                          code: "TAC §749.2903",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=2903"
                        }
                      ]
                    }}
                    quickHint="Typical: Fire = annual, Health = varies by county (annual to every 2 years)"
                  >
                    Current fire safety inspection and health department evaluation on file; any required corrections completed. Check current inspection date and expiration. Certificate should be on file. If expiring within 30
                    days, remind family to schedule renewal.
                  </RequirementItem>
                </div>

                <AlertBox type="warning">
                  <strong>Recently Added Requirements:</strong> These three items are now required for compliance.
                </AlertBox>

                <div>
                  <h3 className="font-semibold mb-3">New/Enhanced Requirements:</h3>

                  <RequirementItem 
                    code="TAC §749.2907" 
                    title="Written disaster plan" 
                    frequency="Annually"
                    helpText="Written disaster plan ensures all household members know what to do in emergencies. Plan should be simple, accessible, and reviewed with all family members."
                    detailedHelp={{
                      whatToCheck: [
                        "Written plan is present and accessible",
                        "Evacuation routes clearly described",
                        "Designated meeting place identified",
                        "Out-of-area contact person listed with phone number",
                        "Plan for pets included (if applicable)",
                        "Plan reviewed with household members"
                      ],
                      redFlags: [
                        "No written plan exists",
                        "Plan not accessible or lost",
                        "Contact information outdated",
                        "Household members unaware of plan",
                        "Evacuation routes not clear"
                      ],
                      questionsToAsk: [
                        "\"Can I see your disaster plan?\"",
                        "\"When did you last review it with the family?\"",
                        "\"Where is your designated meeting place?\"",
                        "\"Who is your out-of-area contact?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Foster parent doesn't have a written plan",
                          solution: "Provide template immediately. Can be simple one-page document. Help them complete it during visit. Set deadline for completion."
                        },
                        {
                          issue: "Plan exists but family members don't know about it",
                          solution: "Review plan with family. Practice evacuation if possible. Ensure all children know meeting place and contact person."
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.2907",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=2907"
                        }
                      ]
                    }}
                    quickHint="Must include: Evacuation routes, meeting place, out-of-area contact, pet plan. Provide template if missing"
                  >
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

                  <RequirementItem 
                    code="TAC §749.1003(7)(b)" 
                    title="Rights posters in English AND Spanish" 
                    frequency="Quarterly"
                    helpText="Rights posters inform children of their rights in foster care. Both English and Spanish versions must be posted regardless of languages spoken in home."
                    detailedHelp={{
                      whatToCheck: [
                        "Rights poster in English visible in common area",
                        "Rights poster in Spanish visible in common area",
                        "Posters are current and not damaged",
                        "Posters posted at appropriate height for children",
                        "Both posters posted regardless of languages spoken"
                      ],
                      redFlags: [
                        "Only one language posted",
                        "Posters missing or damaged",
                        "Posters not visible to children",
                        "Posters outdated or incorrect",
                        "Foster parent unaware of requirement"
                      ],
                      questionsToAsk: [
                        "\"Can you show me where the rights posters are posted?\"",
                        "\"Do you have both English and Spanish versions?\"",
                        "\"Are they current and readable?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Only English poster posted, Spanish missing",
                          solution: "Both languages required regardless of languages spoken. Provide Spanish poster immediately. Both must be visible in common area."
                        },
                        {
                          issue: "Posters posted but not visible to children",
                          solution: "Posters must be at appropriate height for children to see and read. Reposition if needed."
                        }
                      ],
                      resources: [
                        {
                          title: "DFPS Foster Care Rights",
                          url: "https://www.dfps.state.tx.us/Child_Protection/Foster_Care/rights.asp"
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.1003",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=1003"
                        }
                      ]
                    }}
                    quickHint="BOTH languages required regardless of languages spoken. Must be visible in common area at child-appropriate height"
                  >
                    Must be visibly posted in common area. Both languages required regardless of languages spoken in
                    home. Provide if missing.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Fire Safety:</h3>

                  <RequirementItem 
                    code="TAC §749.2909" 
                    title="Smoke detectors properly installed and functional" 
                    frequency="Monthly"
                    helpText="Smoke detectors are critical life safety devices. Non-functional detectors are an immediate safety hazard requiring correction within 24 hours."
                    detailedHelp={{
                      whatToCheck: [
                        "Hallways or open areas OUTSIDE all sleeping rooms",
                        "On EACH LEVEL of the home (including basement)",
                        "Test each detector - press test button, hear loud beep",
                        "Check age - detectors expire after 10 years",
                        "Not in kitchens or bathrooms (causes false alarms)"
                      ],
                      redFlags: [
                        "Detector doesn't sound when tested",
                        "Weak or chirping sound (dead battery)",
                        "Detector older than 10 years",
                        "Wrong placement (in kitchen, bathroom, basement only)",
                        "Detector removed or covered",
                        "Foster parent can't remember last time tested"
                      ],
                      questionsToAsk: [
                        "\"May I test your smoke detectors?\"",
                        "\"When were batteries last changed?\"",
                        "\"How old are these detectors?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Detector doesn't work when tested",
                          solution: "This is an immediate safety issue. Provide batteries if available, or require installation/repair within 24 hours. Document as non-compliance."
                        },
                        {
                          issue: "Detectors older than 10 years",
                          solution: "Check manufacture date on back of detector. Replace if >10 years old. Recommend interconnected/hardwired systems."
                        }
                      ],
                      resources: [
                        {
                          title: "NFPA Smoke Alarm Safety",
                          url: "https://www.nfpa.org/Public-Education/Fire-causes-and-risks/Top-fire-causes/Smoking/Smoke-alarms"
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.2909",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=2909"
                        }
                      ]
                    }}
                    quickHint="Test each detector during visit. Replace if >10 years old or not functional"
                  >
                    Smoke detectors installed in hallways or open areas outside all sleeping rooms and on each level of the home; functional and tested. Test during visit if possible.
                  </RequirementItem>

                  <RequirementItem 
                    code="TAC §749.2913" 
                    title="Fire extinguishers present and current" 
                    frequency="Quarterly"
                    helpText="Fire extinguishers must be accessible, properly maintained, and inspected annually. Gauge in red zone requires immediate attention."
                    detailedHelp={{
                      whatToCheck: [
                        "Each kitchen has extinguisher",
                        "Each level of the home has extinguisher",
                        "Gauge needle in green zone (proper pressure)",
                        "Inspection tag within last year",
                        "No visible damage (dents, rust, broken seal)",
                        "Easily accessible (not blocked by furniture)"
                      ],
                      redFlags: [
                        "No fire extinguisher present",
                        "Gauge in red zone (needs recharge/replacement)",
                        "Inspection tag older than 1 year",
                        "Visible damage (dents, rust, broken seal)",
                        "Wrong type (CO2 only, foam only)",
                        "Inaccessible location (buried in closet, under sink)"
                      ],
                      questionsToAsk: [
                        "\"Can you show me where your fire extinguishers are located?\"",
                        "\"Do you know how to use them?\"",
                        "\"When were they last inspected?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Extinguisher gauge in red zone",
                          solution: "Needs immediate recharge or replacement. Provide resources for fire extinguisher inspection services or replacement. Many fire departments offer free inspections."
                        },
                        {
                          issue: "Foster parent doesn't know extinguisher needs annual inspection",
                          solution: "Explain requirement. Annual professional inspection needed. Provide local service information."
                        }
                      ],
                      resources: [
                        {
                          title: "NFPA Fire Extinguisher Guide",
                          url: "https://www.nfpa.org/Public-Education/Staying-safe/Safety-equipment/Fire-extinguishers"
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.2913",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=2913"
                        }
                      ]
                    }}
                    quickHint="PASS method: Pull, Aim, Squeeze, Sweep. Gauge must be in green zone"
                  >
                    Fire extinguishers located in each kitchen and on each level of the home; current inspection tags visible; accessible. Check:
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

                  <RequirementItem 
                    code="TAC §749.2961" 
                    title="Weapons stored per requirements" 
                    frequency="Monthly"
                    helpText="CRITICAL SAFETY ITEM - Verify carefully. Non-compliance requires immediate supervisor contact. This is a serious safety issue that may affect placement."
                    detailedHelp={{
                      whatToCheck: [
                        "Weapons UNLOADED at all times",
                        "Stored in LOCKED location",
                        "Ammunition stored SEPARATELY in locked location",
                        "Keys/combinations accessible to adults ONLY",
                        "Location not disclosed to children"
                      ],
                      redFlags: [
                        "Foster parent defensive or unclear about storage",
                        "Weapons visible during home visit",
                        "Children mention knowing where guns are",
                        "Ammunition observed in accessible locations",
                        "Inadequate locking mechanisms",
                        "Guns and ammunition stored together"
                      ],
                      questionsToAsk: [
                        "\"Do you have any firearms or weapons in the home?\"",
                        "\"Where are they stored?\" (general location, not specific)",
                        "\"Are they kept unloaded and locked?\"",
                        "\"Where is the ammunition kept?\"",
                        "\"Who has access to the keys or combination?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Foster parent thinks trigger lock only is sufficient",
                          solution: "Trigger lock must be PLUS locked storage. Guns must be in locked safe, cabinet, or container, not just trigger-locked."
                        },
                        {
                          issue: "Non-compliance found",
                          solution: "Document non-compliance, provide written notice, set 24-48 hour deadline, consider whether children can remain safely, contact supervisor immediately."
                        }
                      ],
                      resources: [
                        {
                          title: "Project ChildSafe (free gun locks)",
                          url: "https://projectchildsafe.org/"
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.2961",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=2961"
                        }
                      ]
                    }}
                    quickHint="⚠️ DO NOT ask to see weapons. DO verify presence and locking mechanism. Non-compliance = immediate supervisor contact"
                  >
                    Weapons, firearms, explosive materials, and projectiles stored unloaded in locked location; ammunition stored separately in locked location.
                    <AlertBox type="danger">
                      <strong>⚠️ IMMEDIATE SUPERVISOR CONTACT REQUIRED IF:</strong> Loaded weapons accessible to children, children know location, or foster parent refuses to secure properly.
                    </AlertBox>
                    <AlertBox type="info">
                      <strong>Note:</strong> Trigger lock with ammunition stored in same locked container is acceptable. Gun safe meets all requirements.
                    </AlertBox>
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">General Safety:</h3>

                  <RequirementItem 
                    code="TAC §749.3041(7)" 
                    title="Hazardous substances stored appropriately" 
                    frequency="Monthly"
                    helpText="Cleaning supplies, pesticides, and other hazardous materials must be stored out of reach or locked to prevent accidental poisoning or injury."
                    detailedHelp={{
                      whatToCheck: [
                        "Cleaning supplies stored out of reach or locked",
                        "Pesticides and chemicals secured",
                        "Flammable liquids properly stored",
                        "All hazardous materials clearly labeled",
                        "Storage separate from food items"
                      ],
                      redFlags: [
                        "Cleaning supplies under sink accessible to children",
                        "Chemicals in unlocked cabinets in reach of children",
                        "Hazardous materials mixed with food storage",
                        "Unlabeled containers",
                        "Spills or leaks visible"
                      ],
                      questionsToAsk: [
                        "\"Where do you store cleaning supplies and chemicals?\"",
                        "\"Are they locked or out of reach of children?\"",
                        "\"Do you have any pesticides or other hazardous materials?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Cleaning supplies under kitchen/bathroom sink accessible",
                          solution: "Must move to locked cabinet or high shelf out of children's reach. Provide lock boxes if needed."
                        },
                        {
                          issue: "Chemicals stored with food items",
                          solution: "Separate storage required. Hazardous materials should never be stored with food or in food preparation areas."
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.3041",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=3041"
                        }
                      ]
                    }}
                    quickHint="Check: Under sinks, garage, laundry room. Must be locked or high shelf out of reach"
                  >
                    Flammable or poisonous substances (cleaning supplies, pesticides, etc.) stored out of reach of children or in locked cabinets. All cleaning supplies, chemicals, and hazardous materials must be out of reach of children or in
                    locked storage.
                  </RequirementItem>

                  <RequirementItem 
                    code="TAC §749.2917" 
                    title="Animals vaccinated and disease-free" 
                    frequency="Quarterly"
                    helpText="All animals on premises must be current on vaccinations (especially rabies), free from disease, and not exhibiting aggressive behavior. This protects children from injury and disease."
                    detailedHelp={{
                      whatToCheck: [
                        "Current vaccinations (especially rabies for dogs/cats)",
                        "Vaccination records available (tags, certificates, vet records)",
                        "Animals appear healthy (no visible signs of illness)",
                        "Animal behavior appropriate around children",
                        "Clean living conditions for animals"
                      ],
                      redFlags: [
                        "No documentation of rabies vaccination",
                        "Vaccinations expired more than 30 days",
                        "Animal appears ill (lethargy, discharge, limping, etc.)",
                        "Aggressive behavior toward children",
                        "Unsanitary animal living conditions",
                        "No established veterinary care"
                      ],
                      questionsToAsk: [
                        "\"Can I see vaccination records for your pets?\"",
                        "\"When was the last time they saw a veterinarian?\"",
                        "\"Have you had any concerns about your pet's health?\"",
                        "\"How do your pets typically interact with foster children?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Vaccination records not available",
                          solution: "Check rabies tag on collar (shows year). If no tag, require proof from veterinarian. Most counties require annual rabies vaccination."
                        },
                        {
                          issue: "Animal appears ill but foster parent says it's fine",
                          solution: "Document observations. Require veterinary visit within 7 days. Animal must be free from disease to remain in home."
                        }
                      ],
                      resources: [
                        {
                          title: "Texas Rabies Laws",
                          url: "https://www.dshs.texas.gov/immunize/rabies/"
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.2917",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=2917"
                        }
                      ]
                    }}
                    quickHint="Required: Rabies (annual or 3-year), other vaccines typically annual. Check tags or vet records"
                  >
                    All animals on premises kept free of disease, current on required vaccinations; documentation available for review. Verify vaccination records are current and animals appear healthy and non-aggressive.
                  </RequirementItem>

                  <RequirementItem 
                    code="TAC §749.2915" 
                    title="Tools and dangerous equipment stored appropriately" 
                    frequency="Monthly"
                    helpText="Power tools, sharp implements, and dangerous equipment must be secured from children's access. Age-appropriate considerations apply based on children in home."
                    detailedHelp={{
                      whatToCheck: [
                        "Power tools (drills, saws, nail guns) locked or secured",
                        "Sharp tools (axes, machetes, large knives) out of reach",
                        "Tall ladders secured from children",
                        "Automotive equipment (jacks, air compressors) secured",
                        "Tools stored separately from play areas"
                      ],
                      redFlags: [
                        "Power tools accessible in open garage",
                        "Sharp implements within children's reach",
                        "Chemicals stored with tools (double hazard)",
                        "Tools in common areas or play spaces",
                        "No awareness of where tools are"
                      ],
                      questionsToAsk: [
                        "\"Where do you keep your tools and equipment?\"",
                        "\"Do any children have access to the garage/workshop?\"",
                        "\"Are any older youth permitted to use tools with supervision?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Teenage child interested in woodworking",
                          solution: "Supervised use of hand tools acceptable. Power tools must remain locked when not supervised. Ensure proper supervision and safety training."
                        },
                        {
                          issue: "Tools needed for home maintenance left accessible",
                          solution: "Tools must be locked or secured when not in use. Use locked toolbox, keys kept by adults only. Never leave tools out after use."
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.2915",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=2915"
                        }
                      ]
                    }}
                    quickHint="Check: Garage, workshop, sheds, basements. Age-appropriate: Young children = all locked, Teens = supervised access OK"
                  >
                    Tools, power equipment, and dangerous equipment stored appropriately and secured from children's access.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3041(1), (2)" title="Indoor Safety & Cleanliness" frequency="Monthly">
                    Indoor areas, equipment, and furniture are safe for children, kept clean, and maintained in good repair.
                  </RequirementItem>

                  <RequirementItem 
                    code="TAC §749.3041(3)" 
                    title="Exit access clear" 
                    frequency="Monthly"
                    helpText="Clear exit routes are critical for fire safety and emergency evacuation. Blocked exits can prevent safe escape in emergencies."
                    detailedHelp={{
                      whatToCheck: [
                        "All doors leading outside are accessible",
                        "No furniture blocking exit routes",
                        "No items stacked in front of doors",
                        "Hallways clear of obstructions",
                        "Windows used for emergency egress are accessible"
                      ],
                      redFlags: [
                        "Furniture blocking doorways",
                        "Items stacked in front of exits",
                        "Hallways cluttered with belongings",
                        "Exit doors blocked or difficult to open",
                        "Path to exit not clear"
                      ],
                      questionsToAsk: [
                        "\"Can you show me all the exits from this area?\"",
                        "\"Are these exits always kept clear?\"",
                        "\"What would happen if we needed to evacuate quickly?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Furniture moved to block exit during visit",
                          solution: "Immediate correction required. Explain fire safety importance. Furniture must be repositioned to allow clear exit access."
                        },
                        {
                          issue: "Clutter accumulating in hallways",
                          solution: "Require cleanup. Establish system for keeping exits clear. Regular checks needed."
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.3041",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=3041"
                        }
                      ]
                    }}
                    quickHint="Critical for fire safety. All exits must be accessible and clear at all times"
                  >
                    Exits in living areas are not blocked by furniture or other items; egress routes clear.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3041(6)" title="Ventilation Screens" frequency="Quarterly">
                    Windows and doors used for ventilation are properly screened.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3041(8)" title="Pest Control" frequency="Monthly">
                    Home is free of rodent and insect infestation; pest control measures current.
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

                  <RequirementItem 
                    code="TAC §749.3021" 
                    title="Bedroom square footage meets requirements" 
                    frequency="Quarterly"
                    helpText="Bedroom size ensures adequate personal space for children. Measure when room appears small, layout changes, or capacity questions arise."
                    detailedHelp={{
                      whatToCheck: [
                        "ONE child in bedroom: Minimum 80 square feet",
                        "MULTIPLE children: Minimum 40 square feet PER CHILD",
                        "MAXIMUM 4 children per bedroom (NO EXCEPTIONS)",
                        "Measure length × width = square footage"
                      ],
                      redFlags: [
                        "Room obviously too small",
                        "More than 4 children sharing room",
                        "Unable to fit required furniture comfortably",
                        "No walking space between beds"
                      ],
                      questionsToAsk: [
                        "\"How many children share this bedroom?\"",
                        "\"Can you show me the measurements?\"",
                        "\"Does each child have their own space?\""
                      ],
                      commonIssues: [
                        {
                          issue: "Foster parent converted small bedroom to take more children",
                          solution: "Measure room. If doesn't meet 40 sq ft per child, must reduce number of children in room. Document non-compliance."
                        },
                        {
                          issue: "Irregular shaped room (L-shaped)",
                          solution: "Divide into rectangles, calculate each section separately, add sections together. Only count main bedroom space, not closets (unless door removed)."
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.3021",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=3021"
                        }
                      ]
                    }}
                    quickHint="Example: 10ft × 8ft = 80 sq ft (1-2 children). 12ft × 10ft = 120 sq ft (1-3 children)"
                  >
                    <p>Minimum requirements:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>
                        <strong>Bedroom for one child:</strong> minimum 80 square feet
                      </li>
                      <li>
                        <strong>Bedroom for multiple children:</strong> minimum 40 square feet per child
                      </li>
                      <li>
                        <strong>Maximum:</strong> NO MORE THAN 4 CHILDREN PER BEDROOM
                      </li>
                    </ul>
                    <TipBox>
                      <strong>Measurement tips:</strong> Measure length × width. Count closet only if door removed. Don't count bathroom or hallway space. If borderline, recommend fewer children for comfort.
                    </TipBox>
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3023(a), (c)" title="Bedroom Adequacy" frequency="Monthly">
                    Bedroom is adequate for rest, sleep, and privacy; has functional door that closes for privacy.
                    <p className="mt-2">Each bedroom must have:</p>
                    <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                      <li>Door for privacy</li>
                      <li>Adequate lighting</li>
                      <li>Comfortable temperature control</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3023(b)" title="Natural Light Source" frequency="Quarterly">
                    Bedroom has at least one source of natural light (window).
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3023(c)(1), (2)" title="Prohibited Bedroom Spaces" frequency="Quarterly">
                    Dining room, living room, hallway, porch, garage, or any room serving as passageway to other rooms NOT used as bedroom.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3025" title="Child-Adult Room Sharing" frequency="Quarterly">
                    Child shares bedroom with adult in care only if agency has assessed and approved arrangement in writing.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3027" title="Child-Caregiver Room Sharing" frequency="Quarterly">
                    Child shares bedroom with caregiver only if child is under 3 years old, arrangement is in best interests of child, and approved by service planning team.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3029" title="Opposite Gender Room Sharing" frequency="Quarterly">
                    Child over six years old does not share bedroom with person of opposite sex, unless sharing with parent or meets other specified criteria (siblings, etc.).
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Furnishings:</h3>

                  <RequirementItem code="TAC §749.3031" title="Bedding Requirements" frequency="Monthly">
                    Each child has own clean, comfortable bed with mattress cover or mattress protector; bed linens washed at least weekly; bedding appropriate for season.
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Individual bed with mattress in good condition</li>
                      <li>Clean bedding (sheets, blanket, pillow)</li>
                      <li>Mattress cover or protector</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3033" title="Storage Space" frequency="Monthly">
                    Children have adequate, accessible storage space for clothing and personal belongings (dresser, closet space, shelving).
                  </RequirementItem>

                  <RequirementItem 
                    code="TAC §749.1003(b)(12), (14)" 
                    title="Adequate clothing for children" 
                    frequency="Monthly"
                    helpText="Children should have adequate, suitable, comparable, protective, and choice-driven clothing. Clothing should preserve dignity and allow children to fit in with peers."
                    detailedHelp={{
                      whatToCheck: [
                        "7-10 complete outfits appropriate to season",
                        "Sufficient underwear/socks for week",
                        "Appropriate sleepwear",
                        "School clothes (if school-age)",
                        "Play clothes/casual wear",
                        "At least one \"special occasion\" outfit",
                        "Weather-appropriate outerwear",
                        "Properly fitting shoes (at least 2 pairs)",
                        "Clothing visible in bedroom/closet",
                        "Condition of clothing (clean, good repair)"
                      ],
                      redFlags: [
                        "Very limited clothing visible",
                        "Clothing obviously too small or too large",
                        "Only \"hand-me-downs,\" no new items",
                        "Inappropriate for weather (no winter coat in winter)",
                        "Significant wear, stains, or damage",
                        "Child appears uncomfortable with clothing situation",
                        "Foster parent describes inability to afford clothing"
                      ],
                      questionsToAsk: [
                        "\"Does [child's name] have enough clothes?\"",
                        "\"How often do we shop for new clothes for [child]?\"",
                        "\"Does [child] get to choose their own clothes?\"",
                        "\"Do they have weather-appropriate items?\" (coat, boots, etc.)"
                      ],
                      commonIssues: [
                        {
                          issue: "Clothing inadequate due to financial constraints",
                          solution: "Connect family to DFPS Foster Care Clothing Allowance, community clothing banks, school uniform assistance programs, back-to-school events. Set timeline for improvement, follow up within 30 days."
                        },
                        {
                          issue: "Child only has hand-me-downs, nothing new",
                          solution: "Children need some new items appropriate to their age and preferences. Connect to resources. Remind that clothing allowance is available from DFPS."
                        }
                      ],
                      resources: [
                        {
                          title: "DFPS Foster Care Clothing Allowance",
                          url: "https://www.dfps.state.tx.us/Child_Protection/Foster_Care/clothing.asp"
                        }
                      ],
                      regulatoryLinks: [
                        {
                          code: "TAC §749.1003",
                          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=26&pt=1&ch=749&rl=1003"
                        }
                      ]
                    }}
                    quickHint="Check: Adequate (7-10 outfits), Suitable (age/size), Comparable (to peers), Protective (weather), Choice (child input)"
                  >
                    Children have adequate personal clothing suitable to age and size, comparable to clothing of other children in community; adequate protective clothing against weather; reasonable opportunity to select own clothing.
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

                  <RequirementItem code="TAC §749.3035(a)" title="Bathroom Ratios" frequency="Quarterly">
                    Home has one toilet, sink, and shower/tub for every eight household members.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3035(b)" title="Hot and Cold Water" frequency="Monthly">
                    All sinks and showers/tubs have hot and cold running water with safe temperature.
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

                  <RequirementItem code="TAC §749.2595" title="No Unauthorized Video Surveillance" frequency="Quarterly">
                    No video cameras or electronic monitoring used for child supervision unless specified in child's service plan; exception for infants and toddlers under one year.
                    <p className="mt-2">Cameras or monitoring devices are prohibited in:</p>
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

                  <RequirementItem code="TAC §749.3037" title="Indoor Activity Space" frequency="Quarterly">
                    Home has minimum 40 square feet per child of indoor activity space for children's recreational use (excluding bedrooms, bathrooms, hallways).
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1893(4)" title="Study/Homework Space" frequency="Monthly">
                    Children have quiet, well-lighted space designated for study/homework and regular scheduled time for homework completion.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Food Storage & Kitchen:</h3>

                  <RequirementItem code="TAC §749.3079(1), (2), (3), (4)" title="Food Storage Requirements" frequency="Monthly">
                    Food is covered and stored off floor on clean surfaces; protected from contamination; containers provide protection from insects and rodents.
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Food properly stored and protected from contamination</li>
                      <li>All food in sealed containers or original packaging</li>
                      <li>Food stored off floor (minimum 6 inches)</li>
                      <li>Separate storage for cleaning supplies</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3079(5), (6)" title="Refrigeration" frequency="Monthly">
                    Food requiring refrigeration is refrigerated immediately after use and after meals; stored in covered containers.
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Perishables refrigerated promptly</li>
                      <li>Refrigerator temperature 40°F or below</li>
                      <li>Freezer temperature 0°F or below</li>
                      <li>No expired food items</li>
                    </ul>
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3081(a)" title="Kitchen Cleanliness" frequency="Monthly">
                    Caregivers keep furniture, equipment, food contact surfaces, and food preparation/storage areas clean and in good repair.
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Food preparation areas clean and sanitized</li>
                      <li>Dishes washed and properly stored</li>
                      <li>Garbage disposed of regularly</li>
                      <li>No evidence of pests</li>
                    </ul>
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

                  <RequirementItem code="TAC §749.3039(a)" title="Outdoor Play Equipment Safety" frequency="Quarterly">
                    Outdoor play equipment does not have openings, angles, or protrusions that can entangle child's clothing or entrap child's body or body parts.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3039(b)" title="Equipment Anchoring" frequency="Quarterly">
                    Outdoor play equipment securely anchored to prevent collapsing, tipping, sliding, moving, or overturning.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3039(c)" title="Fall Surfaces" frequency="Quarterly">
                    Climbing equipment, swings, and slides not installed over asphalt or concrete; appropriate fall surface present.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3039(d)" title="Equipment Maintenance" frequency="Quarterly">
                    Outdoor equipment age-appropriate, cleaned regularly, maintained, and repaired as needed.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3039(e)" title="Trampoline Safety" frequency="Quarterly">
                    Trampolines (if present) used only if approved by agency management; meet safety requirements: comply with manufacturer capacity; shock-absorbing pads cover springs, hooks, frame; ladder removed when not in use; caregiver supervision provided during use.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3041(5)" title="Outdoor Drainage" frequency="Quarterly">
                    Outdoor play areas are well drained without standing water.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3041(4)" title="Outdoor Area Safety" frequency="Monthly">
                    Outdoor areas are safe for children, kept clean, and maintained in good repair.
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

      case "vehicles":
        return (
          <div className="space-y-6">
            <AlertBox type="info">
              <strong>Note:</strong> Vehicle requirements apply to any vehicle used to transport children in foster care.
            </AlertBox>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Safety Requirements
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RequirementItem code="TAC §749.3101(1), (2); TAC §749.3103" title="Vehicle Safety & Registration" frequency="Quarterly">
                  Vehicles used to transport children are safe, currently inspected, and registered; vehicles have current liability insurance; appropriate child passenger safety systems and seat belts for all occupants.
                </RequirementItem>

                <RequirementItem code="TAC §749.2967" title="Weapons in Vehicles" frequency="Quarterly">
                  Weapons, firearms, explosive materials, or projectiles in vehicles are unloaded and inaccessible to children.
                </RequirementItem>

                <TipBox>
                  <strong>Inspection Tip:</strong> Check vehicle registration and insurance cards. Verify car seats are age-appropriate and properly installed. Check for any safety recalls.
                </TipBox>
              </CardContent>
            </Card>
          </div>
        )

      case "swimming":
        return (
          <div className="space-y-6">
            <AlertBox type="info">
              <strong>Note:</strong> Mark "N/A" if home has no pool, spa, or wading pool. If present, all requirements must be met.
            </AlertBox>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5" />
                  Swimming Area Safety Requirements
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Pool Fencing & Barriers:</h3>

                  <RequirementItem code="TAC §749.3133(c), (d)" title="Pool Fence Requirements" frequency="Quarterly">
                    Pool has well-constructed fence or wall at least 4 feet high installed completely around pool area; no gaps or openings.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3133(e)" title="Fence Gates" frequency="Monthly">
                    Fence gates are self-closing, self-latching, and locked when pool not in use; keys not accessible to children under 16 years old or children receiving treatment services.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3133(f)" title="Door Access to Pool" frequency="Monthly">
                    Doors leading from home to pool area have lock that only adults or children over 10 years old can reach; OR door alarm installed if lock height not feasible due to fire code.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3133(g)" title="Fence Climbing Prevention" frequency="Quarterly">
                    Furniture, equipment, or large materials are not positioned to allow child to scale fence or release lock.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Safety Equipment:</h3>

                  <RequirementItem code="TAC §749.3133(h)" title="Life-Saving Devices" frequency="Monthly">
                    At least 2 life-saving devices available and accessible; one additional device for each 2,000 square feet of water surface.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3133(i)" title="Drain Grates" frequency="Quarterly">
                    Drain grates in place, in good repair, and capable of removal only with tools.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3133(j)" title="Supervision Visibility" frequency="Quarterly">
                    Caregivers able to clearly see all parts of swimming area when supervising children in area.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3133(k)" title="Water Clarity" frequency="Monthly">
                    Bottom of pool visible at all times; water clarity maintained.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3133(l)" title="Pool Covers" frequency="Monthly">
                    Pool covers completely removed prior to pool use; never partially covering pool during use.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3133(m)" title="Pump Control" frequency="Quarterly">
                    Adult present who can immediately turn off pump and filtering system when any child is in pool.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Pool Chemicals & Equipment:</h3>

                  <RequirementItem code="TAC §749.3133(n)" title="Chemical Storage" frequency="Monthly">
                    Pool chemicals and pumps inaccessible to children; stored in locked area.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3133(o)" title="Pool Machinery Rooms" frequency="Monthly">
                    Pool machinery rooms locked to prevent children's access.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3133(p)" title="Above-Ground Pools" frequency="Quarterly">
                    Above-ground pool has barrier preventing child's access; inaccessible to children when not in use; meets all other pool safety requirements.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Wading Pools & Hot Tubs:</h3>

                  <RequirementItem code="TAC §749.3145" title="Wading Pools" frequency="Weekly">
                    Wading pools stored out of children's reach; stored to prevent water accumulation; drained at least daily when in use.
                    <TipBox>Weekly monitoring applies during active use season.</TipBox>
                  </RequirementItem>

                  <RequirementItem code="TAC §749.3147" title="Hot Tubs" frequency="Monthly">
                    Hot tub has locking cover when not in use OR is enclosed meeting requirements of §749.3133.
                  </RequirementItem>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "infants":
        return (
          <div className="space-y-6">
            <AlertBox type="info">
              <strong>Note:</strong> Mark "N/A" if home has no infants or toddlers. These requirements apply specifically to children under 3 years old.
            </AlertBox>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5" />
                  Infants & Toddlers Safety Requirements
                  <Badge variant="destructive">REQUIRED</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Environment Safety:</h3>

                  <RequirementItem code="TAC §749.1803(c)" title="Safe Environment" frequency="Monthly">
                    Environment safe for infants/toddlers: free from choking hazards, electrical shock hazards, unstable or broken furniture.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1805(1)" title="Individual Cribs" frequency="Monthly">
                    Each infant has own crib (no crib sharing).
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1805(2)" title="Age-Appropriate Toys" frequency="Monthly">
                    Sufficient number of age-appropriate toys available for infant/toddler development.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Crib Safety Requirements:</h3>

                  <RequirementItem code="TAC §749.1807(a)(1)" title="Crib Mattress" frequency="Monthly">
                    Crib has firm, flat mattress that snugly fits sides of crib; mattress not supplemented with foam materials or pads.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1807(a)(2)" title="Crib Sheets" frequency="Monthly">
                    Crib sheets fit snugly; not an entanglement hazard.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1807(a)(3)" title="Mattress Protection" frequency="Monthly">
                    Crib mattress is waterproof or has washable mattress cover.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1807(a)(4)" title="Crib Hardware" frequency="Monthly">
                    Crib has secure mattress support hangers; no loose hardware, improperly installed parts, or damaged parts.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1807(a)(5)" title="Crib Slat Spacing" frequency="Quarterly">
                    Crib slats/poles have maximum spacing of 2⅜ inches between them.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1807(a)(6)" title="Corner Posts" frequency="Quarterly">
                    Crib corner posts no more than 1/16 inch above end panels.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1807(a)(7)" title="Crib Headboard/Footboard" frequency="Quarterly">
                    Crib has no cutout areas in headboard or footboard that would entrap child's head or body.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1807(a)(8)" title="Drop Rails" frequency="Monthly">
                    Crib drop rails (if present) fasten securely and cannot be opened by child.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1809(2)(A), (B)" title="Mesh Cribs/Play Yards" frequency="Monthly">
                    Mesh crib/play yard has mesh securely attached to top rail, side rail, and floor plate; if has folding sides, they securely latch into place when raised.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Equipment Safety:</h3>

                  <RequirementItem code="TAC §749.1811(a)" title="Safety Straps" frequency="Monthly">
                    High chair, swing, stroller, infant carrier, rocker, and bouncer seat have functional safety straps; used consistently.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1813(a)" title="Prohibited Items" frequency="Monthly">
                    Baby walker, baby bungee jumper, accordion-style safety gate, and toys small enough to swallow or create choking hazard NOT USED.
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1813(b)" title="Sleeping Surfaces" frequency="Monthly">
                    Infants do not sleep on bean bags, waterbeds, or foam pads.
                  </RequirementItem>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Safe Sleep Practices:</h3>

                  <AlertBox type="danger">
                    <strong>CRITICAL: Safe Sleep Requirements</strong>
                  </AlertBox>

                  <RequirementItem code="TAC §749.1813(b)" title="Bare Crib for Infants Under 12 Months" frequency="Monthly">
                    Crib is BARE for infant younger than twelve months (only tight-fitting sheet and mattress cover meeting TAC requirements; NO bumpers, blankets, pillows, stuffed animals, or other items).
                  </RequirementItem>

                  <RequirementItem code="TAC §749.1815" title="Safe Sleep Position & Environment" frequency="Monthly">
                    Infants not yet able to turn over independently placed on backs to sleep; infants NEVER sleep with sleeping adult (including in caregiver's bed, on couch, in recliner); nothing covering infant's head, face, or crib.
                  </RequirementItem>
                </div>

                <TipBox>
                  <strong>Important:</strong> Safe sleep practices are critical for preventing SIDS. Always verify compliance with these requirements during monthly visits when infants are present.
                </TipBox>
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
              <strong>⚠️ NOT FOR HOME LIAISONS:</strong> This section is for <strong>Direct Care Staff and Case Managers only</strong>.
              <br />
              <br />
              <strong>If you are ONLY a Home Visit Liaison:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>You should <strong>SKIP this entire section</strong></li>
                <li>You do <strong>NOT</strong> conduct individual child interviews</li>
                <li>You do <strong>NOT</strong> conduct ASQ suicide risk screenings</li>
                <li>You may make general observations about children's well-being during your visit, but formal interviews are outside your scope</li>
              </ul>
              <br />
              <strong>If you are Direct Care Staff or Case Manager:</strong> Continue with this section to conduct required child interviews and screenings.
            </AlertBox>

            <AlertBox type="info">
              <strong>For Direct Care Staff/Case Managers:</strong> You must conduct and document individual interviews for EACH child
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
                  <Badge variant="destructive">Direct Care Staff Only</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertBox type="warning">
                  <strong>⚠️ HOME LIAISONS: DO NOT CONDUCT THIS SCREENING</strong>
                  <br />
                  ASQ suicide risk screenings are the responsibility of direct care staff/case managers, NOT home liaisons.
                  If you are a home liaison, skip this section entirely.
                </AlertBox>

                <AlertBox type="danger">
                  <strong>For Direct Care Staff/Case Managers - MANDATORY REQUIREMENT:</strong>
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
            <AlertBox type="info">
              <strong>Home Liaison Focus:</strong> As a home liaison, your conversation with foster parents should focus on:
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Household compliance and safety observations</li>
                <li>General observations about children's well-being (not case-specific assessments)</li>
                <li>Environmental safety and maintenance</li>
                <li>Medication administration and storage</li>
                <li>Compliance with TAC requirements</li>
              </ul>
              <br />
              <strong>Direct Care Staff:</strong> May also discuss case-specific progress, therapeutic goals, and service planning.
            </AlertBox>

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

      case "packages":
        return (
          <div className="space-y-6">
            <AlertBox type="warning">
              <strong>Package-Specific Requirements:</strong> These requirements apply ONLY to homes credentialed for specific T3C specialized service packages. 
              Core requirements apply to ALL homes. Only assess package-specific requirements if the home is credentialed for that package.
            </AlertBox>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  ☑ Mental & Behavioral Health Support Services
                  <Badge variant="secondary">Package-Specific</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertBox type="info">
                  <strong>Apply ONLY to homes credentialed for Mental & Behavioral Health Support Services Package</strong>
                </AlertBox>

                <RequirementItem code="T3C Blueprint p.82; RCC Term 7" title="Crisis Safety Assessment" frequency="Monthly">
                  Home assessed for items that could be used for self-harm; all identified risk items (sharp objects, cords, medications, chemicals) secured or removed from accessible areas.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.82" title="Enhanced Medication Security" frequency="Monthly">
                  All psychotropic and controlled substance medications stored under enhanced double-lock system accessible only to designated caregivers; medication storage location not disclosed to youth with self-harm risk.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.82" title="Safe De-escalation Spaces" frequency="Quarterly">
                  Designated calm-down/regulation area available that is free from hazards, contains soft seating/cushions, provides visual privacy, and allows for caregiver monitoring.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.82" title="Sensory Regulation Tools" frequency="Quarterly">
                  Sensory regulation tools readily available including weighted blankets, fidget items, calming music options, and adjustable lighting capability in regulation spaces.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.82; RCC Term 7" title="Crisis Communication Systems" frequency="Quarterly">
                  Reliable phone and high-speed internet access verified functional for 24/7 crisis support line, teletherapy participation, psychiatric consultation, and emergency communication with case management.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.82" title="Crisis Intervention Protocols" frequency="Quarterly">
                  Posted crisis intervention protocols visible and current; emergency contact numbers for crisis team, on-call supervisor, and emergency services readily accessible; first aid kit stocked and accessible.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.78-93; RCC Term 7" title="Private Therapy Space" frequency="Quarterly">
                  Quiet, confidential space available for in-home therapy sessions or teletherapy participation; free from interruptions; adequate technology setup for virtual sessions.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.82" title="Behavioral Monitoring Tools" frequency="Quarterly">
                  Systems in place for tracking behavioral patterns (charts, apps, or logs); accessible to caregivers; used consistently.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.82" title="Secondary Trauma Prevention" frequency="Quarterly">
                  Evidence of caregiver self-care systems including respite care arrangements, support group participation, and stress management resources.
                </RequirementItem>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  ☑ Substance Use Support Services
                  <Badge variant="secondary">Package-Specific</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertBox type="info">
                  <strong>Apply ONLY to homes credentialed for Substance Use Support Services Package</strong>
                </AlertBox>

                <RequirementItem code="T3C Blueprint p.56-66; RCC Term 7" title="Substance-Free Environment" frequency="Monthly">
                  <strong>Substance-Free Environment:</strong> Home verified substance-free with no alcohol, illegal drugs, or non-prescribed controlled substances accessible to youth; prescription medications properly secured.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.56-66" title="Drug Testing Supplies Storage" frequency="Quarterly">
                  Secure, private storage location for drug screening supplies (if applicable); testing conducted with dignity and privacy.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.56-66; RCC Term 7" title="Recovery Support Environment" frequency="Quarterly">
                  Home environment supports recovery with minimal triggers; access to healthy recreational activities; structured routine supporting sobriety.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.56-66" title="Private Counseling Space" frequency="Quarterly">
                  Designated private, confidential space for substance use counseling sessions (in-home or teletherapy); appropriate technology for virtual sessions.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.56-66" title="Peer Support Resources" frequency="Quarterly">
                  Evidence of connection to recovery support resources; information about peer support groups accessible; caregiver knowledge of local recovery resources.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.56-66; RCC Term 7" title="Crisis Response Protocols" frequency="Quarterly">
                  Posted crisis response protocols for substance use emergencies including overdose response; naloxone (Narcan) available if prescribed; emergency contacts accessible.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.56-66" title="Medication Management for MAT" frequency="Monthly">
                  Enhanced security for Medication-Assisted Treatment medications; administration logs maintained; only designated caregivers administer. (If applicable)
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.56-66" title="Therapeutic Activities Access" frequency="Quarterly">
                  Resources supporting healthy coping strategies including exercise equipment, art supplies, journals, mindfulness tools.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.56-66" title="Caregiver Substance Abuse Awareness Training" frequency="Annually">
                  Documented completion of 4-hour Substance Abuse Awareness training; understanding of addiction, recovery, and relapse prevention.
                </RequirementItem>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  ☑ Short-Term Assessment Support Services (STASS)
                  <Badge variant="secondary">Package-Specific</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertBox type="info">
                  <strong>Apply ONLY to homes credentialed for Short-Term Assessment Support Services Package</strong>
                </AlertBox>

                <RequirementItem code="T3C Blueprint p.67-75; RCC Term 7" title="Assessment Environment" frequency="Quarterly">
                  Calm, structured environment conducive to behavioral observation and assessment; minimal overstimulation; predictable daily routines.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.67-75" title="Observation Documentation Space" frequency="Quarterly">
                  Designated quiet space for caregivers to complete detailed observation documentation; computer access for timely documentation entry.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.67-75" title="Multi-Purpose Assessment Areas" frequency="Quarterly">
                  Variety of environments to observe youth in different settings (structured activities, unstructured time, meal times, homework, recreational); appropriate materials for age-appropriate activities.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.67-75; RCC Term 7" title="Professional Meeting Space" frequency="Quarterly">
                  Private, professional space suitable for assessment team meetings, family meetings, and consultation with treatment professionals; technology for virtual meetings functional.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.67-75" title="Crisis Safety Preparedness" frequency="Monthly">
                  Enhanced crisis management readiness given short-term nature and assessment focus; de-escalation spaces available; crisis protocols posted; emergency communication systems functional.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.67-75" title="Comprehensive Documentation Systems" frequency="Quarterly">
                  Robust documentation infrastructure including behavioral tracking tools, daily observation logs, assessment forms; secure storage for assessment materials.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.67-75" title="Privacy and Confidentiality" frequency="Monthly">
                  Assessment materials, observation notes, and documentation stored securely; conversations about assessment private and confidential.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.67-75" title="Flexible Scheduling Accommodation" frequency="Quarterly">
                  Home environment supports flexible scheduling for assessments, evaluations, team meetings; caregivers available for intensive collaboration during assessment period.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.67-75" title="Short-Term Assessment Training" frequency="Annually">
                  Documented completion of 4-hour Short-Term Assessment Skills training; caregiver understanding of assessment process, observation techniques, documentation requirements.
                </RequirementItem>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  ☑ T3C Treatment Foster Family Care Support Services
                  <Badge variant="secondary">Package-Specific</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertBox type="info">
                  <strong>Apply ONLY to homes credentialed for T3C Treatment Foster Family Care Package</strong>
                </AlertBox>

                <RequirementItem code="T3C Blueprint p.135-147; TAC §749.863(c)" title="Enhanced Therapeutic Environment" frequency="Quarterly">
                  Home demonstrates highest level of therapeutic milieu with trauma-informed design throughout; calming colors; minimal clutter; organized spaces; sensory regulation tools readily available.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147; RCC Term 7" title="Intensive Treatment Support Space" frequency="Quarterly">
                  Dedicated, private space for intensive therapeutic activities and treatment team meetings; appropriate for both individual and small group sessions; soundproof or private location.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147" title="Advanced Crisis Management Capability" frequency="Monthly">
                  Enhanced crisis intervention infrastructure including multiple de-escalation spaces; comprehensive crisis response equipment; advanced safety protocols posted; 24/7 crisis support access verified.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147" title="Sophisticated Documentation Infrastructure" frequency="Quarterly">
                  Advanced documentation systems supporting intensive treatment model; multiple concurrent treatment plans manageable; technology supports real-time documentation; secure data management.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147; RCC Term 7" title="Enhanced Medication Management" frequency="Monthly">
                  Treatment-level medication administration systems; psychotropic medication monitoring protocols; medication administration logs current; only specially-trained caregivers administer complex regimens.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147" title="Multi-Modal Therapeutic Resources" frequency="Quarterly">
                  Variety of therapeutic modalities supported including art therapy supplies, play therapy materials, bibliotherapy resources, mindfulness tools, physical activity options.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147" title="Family Therapy Accommodation" frequency="Quarterly">
                  Spaces and scheduling flexibility to accommodate intensive family therapy sessions; private areas for family meetings; technology for virtual family sessions functional.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147" title="Professional Collaboration Infrastructure" frequency="Quarterly">
                  Home setup supports frequent professional collaboration including school liaison meetings, therapy coordination, psychiatrist consultations; technology supports multiple professional connections.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147; RCC Term 7" title="Intensive Behavioral Support Systems" frequency="Monthly">
                  Environmental modifications supporting intensive behavioral interventions; visual supports for behavior plans; data collection systems; positive reinforcement systems visible.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147; TAC §749.863(c)" title="Treatment Foster Care Training Completion" frequency="Annually">
                  Documented completion of 20 hours additional Treatment Foster Care training beyond basic requirements; demonstrated advanced therapeutic parenting competencies.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147" title="Enhanced Safety Infrastructure" frequency="Quarterly">
                  Highest level of safety modifications including advanced monitoring systems (when approved in service plan); multiple safety zones; emergency response equipment; backup communication systems.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.135-147" title="Respite Care Support System" frequency="Quarterly">
                  Established respite care relationships with treatment-trained respite providers; documented respite care plan; respite providers familiar with child's treatment needs.
                </RequirementItem>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  ☑ IDD/Autism Spectrum Disorder Support Services
                  <Badge variant="secondary">Package-Specific</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertBox type="info">
                  <strong>Apply ONLY to homes credentialed for IDD/Autism Spectrum Disorder Support Services Package</strong>
                </AlertBox>

                <RequirementItem code="T3C Blueprint p.123-135" title="Sensory-Friendly Spaces" frequency="Quarterly">
                  Designated quiet spaces available with adjustable/dimmable lighting options; sensory regulation tools accessible including weighted blankets, noise-canceling headphones, fidget tools, and other sensory items matched to child's needs.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.123-135; RCC Term 7" title="Wandering/Elopement Safety Systems" frequency="Monthly">
                  Door alarms installed and functional on all exterior doors; secure fencing around yard perimeter (minimum 4 feet high); window locks functional on all accessible windows; safety plan posted and current.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.123-135" title="Visual Supports System" frequency="Quarterly">
                  Visual schedules posted in common areas and child's bedroom; spaces clearly labeled with pictures and/or words; consistent organization maintained; predictable physical layout; transition warnings visible.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.123-135" title="Accessibility Features" frequency="Quarterly">
                  Wheelchair accessibility verified throughout home (if needed for placement); grab bars installed in bathrooms (if needed); ramps or lifts functional (if applicable); adequate space for mobility devices; doorways meet width requirements.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.123-135; RCC Term 7" title="Technology Readiness" frequency="Quarterly">
                  Reliable high-speed internet connection for teletherapy, educational technology, and virtual IEP/ARD meetings; designated charging stations for AAC (augmentative/alternative communication) devices; devices stored safely and accessibly; backup communication systems available.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.123-135" title="Specialized Medical Equipment Space" frequency="Monthly">
                  Adequate, clean, organized storage for feeding equipment (if applicable), positioning devices, adaptive equipment, or specialized medical supplies; equipment maintained in good working order.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.123-135" title="Structured Routine Environment" frequency="Quarterly">
                  Organized physical spaces supporting predictable daily routines; minimal clutter in common areas; consistent placement of frequently used items; labeled storage systems; designated spaces for specific activities.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.123-135" title="Communication Systems" frequency="Monthly">
                  Alternative communication systems (picture boards, PECS, AAC devices) present and functional; charged and accessible; backup systems available; visual supports for daily communication needs.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.123-135" title="Sensory Accommodations" frequency="Quarterly">
                  Environmental modifications in place based on child's sensory profile including appropriate lighting levels, noise reduction measures, tactile-friendly surfaces, temperature control, and designated sensory regulation areas.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.123-135" title="Educational Support Space" frequency="Quarterly">
                  Designated homework area with minimal distractions; adaptive learning tools available; organized materials for school activities; technology for educational supports functional.
                </RequirementItem>

                <RequirementItem code="T3C Blueprint p.123-135" title="Medical Management Systems" frequency="Monthly">
                  Medication administration system appropriate for complexity of regimen; specialized diet food storage (if applicable); medical equipment properly maintained; emergency medical protocols posted.
                </RequirementItem>
              </CardContent>
            </Card>

            <TipBox>
              <strong>Package Credentialing:</strong> Always verify which packages a home is credentialed for before assessing package-specific requirements. 
              Core requirements apply to ALL homes regardless of package credentials.
            </TipBox>
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
          <div className="bg-gradient-to-r from-refuge-purple to-refuge-magenta text-white rounded-xl p-8">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold mb-2">🏠 Home Visit Liaison Reference Guide</h1>
              <p className="text-lg opacity-95">Enhanced Digital Monitoring - TAC Chapter 749, RCC Contract & T3C Blueprint</p>
              <p className="text-sm opacity-90 mt-2">Version 3.0 - Enhanced with Package-Specific Requirements</p>
              <p className="text-xs opacity-80 mt-1">November 2025 - Revision 3.0</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center items-center mt-4 pt-4 border-t border-white/20">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const url = window.location.href
                  const subject = encodeURIComponent("Home Visit Liaison Reference Guide")
                  const body = encodeURIComponent(`Complete Home Visit Liaison Reference Guide\n\nAccess the guide online: ${url}`)
                  window.location.href = `mailto:?subject=${subject}&body=${body}`
                }}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Guide
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast({
                    title: "Link copied!",
                    description: "Share this guide with others",
                  })
                }}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
          
          {/* Interactive Features Help */}
          <Card className="mt-4 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Interactive Features - How to Use This Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>ℹ️ Info Icon:</strong> Click the info icon next to any requirement to see detailed help, checklists, red flags, questions to ask, and resources.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>🔗 External Link:</strong> Click the link icon next to TAC codes to view the full regulatory text.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>💡 Quick Tips:</strong> Hover over quick tip text to see expanded hints.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>📧 Share:</strong> Use "Copy Link" or "Send Reference" buttons in help dialogs to share specific sections with colleagues or foster parents.
                </div>
              </div>
            </CardContent>
          </Card>
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
