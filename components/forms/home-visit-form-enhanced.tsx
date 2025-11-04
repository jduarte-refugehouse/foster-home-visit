"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, Home, Users, FileText, CheckCircle, Shield, Heart, Briefcase, 
  AlertTriangle, BookOpen, Activity, Car, Droplets, Baby, Flame, Stethoscope,
  GraduationCap, ClipboardList, Brain, TrendingUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TraumaInformedCareSection,
  FosterParentInterviewSection,
  QualityEnhancementSection,
  ChildrenPresentSection,
  ObservationsSection,
  FollowUpItemsSection,
  CorrectiveActionsSection,
  VisitSummarySection,
  SignaturesSection,
} from "./home-visit-form-enhanced-sections"

interface EnhancedHomeVisitFormProps {
  appointmentId?: string | null
  appointmentData?: any
  prepopulationData?: any
  onSave?: (formData: any) => Promise<void>
  onSubmit?: (formData: any) => Promise<void>
}

const EnhancedHomeVisitForm = ({ 
  appointmentId,
  appointmentData, 
  prepopulationData,
  onSave,
  onSubmit 
}: EnhancedHomeVisitFormProps) => {
  // Enhanced state management with all new sections
  const [formData, setFormData] = useState({
    visitInfo: {
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      quarter: "",
      visitNumberThisQuarter: 1, // Track 1st, 2nd, or 3rd visit of quarter
      visitType: "announced",
      mode: "in-home",
      conductedBy: "",
      staffTitle: "",
      licenseNumber: "",
      supervisor: "",
      agency: "Refuge House, Inc.",
      region: "",
    },
    fosterHome: {
      familyName: "",
      homeId: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      email: "",
      licenseType: "Full", // Full, Provisional, Kinship
      licenseNumber: "",
      licenseExpiration: "",
      totalCapacity: 0,
      fosterCareCapacity: 0,
      currentCensus: 0,
      serviceLevels: [], // basic, moderate, specialized, intense
      respiteOnly: false,
    },
    // Section 1: Medication
    medication: {
      items: [
        { code: "§749.1463(b)(2)", requirement: "Medications stored in original containers", status: "", notes: "" },
        { code: "§749.1521(1-3)", requirement: "All medications under double lock", status: "", notes: "" },
        { code: "§749.1521", requirement: '"External use only" medications stored separately', status: "", notes: "" },
        { code: "§749.1521(4)", requirement: "Refrigerated medications securely stored", status: "", notes: "" },
        { code: "§749.1521(5)", requirement: "Medication storage area clean and orderly", status: "", notes: "" },
        { code: "§749.1521", requirement: "Expired/discontinued meds removed & properly stored for disposal (within 30 days)", status: "", notes: "" },
        { code: "RCC 5420", requirement: "Medication Administration Record (MAR) current & accurate", status: "", notes: "" },
        { code: "RCC 5420", requirement: "Psychotropic medication documentation (Form 4526 submitted within 5 days)", status: "", notes: "" },
        { code: "T3C-Dev", requirement: "PRN usage documented with specific behaviors/symptoms (preparing for T3C)", status: "developing", notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 2A: Inspection Documentation
    inspections: {
      fire: {
        currentInspectionDate: "",
        expirationDate: "",
        daysUntilExpiration: 0,
        inspectorAgency: "",
        certificateNumber: "",
        copyOnFile: false,
        actionNeeded: "none", // none, schedule, expired
        notes: "",
      },
      health: {
        currentInspectionDate: "",
        expirationDate: "",
        daysUntilExpiration: 0,
        inspectorAgency: "",
        certificateNumber: "",
        copyOnFile: false,
        actionNeeded: "none",
        notes: "",
      },
      fireExtinguishers: [
        { location: "Kitchen", lastInspection: "", nextDue: "", tagPresent: false, gaugeGreen: false, notes: "" },
        { location: "Level 2", lastInspection: "", nextDue: "", tagPresent: false, gaugeGreen: false, notes: "" },
        { location: "Level 3", lastInspection: "", nextDue: "", tagPresent: false, gaugeGreen: false, notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 2B: General Health and Safety
    healthSafety: {
      items: [
        { code: "§749.2907 / RCC 1600", requirement: "Written disaster and emergency plan on file", status: "", notes: "" },
        { code: "§749.2908 / RCC 1610", requirement: "Annual disaster drill practiced and documented", status: "", notes: "" },
        { code: "§749.2909", requirement: "Smoke detectors in hallways/outside bedrooms & each level", status: "", notes: "" },
        { code: "§749.2913", requirement: "Fire extinguishers in kitchen & each level (inspected)", status: "", notes: "" },
        { code: "§749.2915", requirement: "Tools and dangerous equipment stored appropriately", status: "", notes: "" },
        { code: "§749.2917", requirement: "Animals vaccinated and free of disease", status: "", notes: "" },
        { code: "§749.2961", requirement: "Weapons/firearms stored per requirements (trigger lock w/ammo OK per 2021)", status: "", notes: "" },
        { code: "§749.3041(1-2)", requirement: "Indoor areas clean, safe, in good repair", status: "", notes: "" },
        { code: "§749.3041(3)", requirement: "Exits not blocked by furniture", status: "", notes: "" },
        { code: "§749.3041(6)", requirement: "Windows/doors for ventilation screened", status: "", notes: "" },
        { code: "§749.3041(7)", requirement: "Hazardous substances out of reach", status: "", notes: "" },
        { code: "§749.3041(8)", requirement: "Home free of rodents and insects", status: "", notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 3: Children's Rights & Well-Being
    childrensRights: {
      items: [
        { code: "§749.1003(7)(b) / RCC 1110", requirement: "Rights posters visible (English & Spanish)", status: "", notes: "" },
        { code: "RCC 1540", requirement: "Rights reviewed with child (Form 2530 signed)", status: "", notes: "" },
        { code: "RCC 1110", requirement: "DFPS Statewide Intake number displayed (1-800-252-5400)", status: "", notes: "" },
        { code: "RCC 1110", requirement: "Foster Care Ombudsman poster displayed", status: "", notes: "" },
        { code: "§749.2601-2605 / RCC 4410", requirement: "Normalcy activities supported", status: "", notes: "" },
        { code: "RCC 3600", requirement: "Maintaining child's connections documented", status: "", notes: "" },
        { code: "RCC 3610", requirement: "Sibling visits occurring (monthly if within 100 miles)", status: "", notes: "" },
        { code: "T3C-Dev", requirement: "CANS assessment incorporated in planning (when applicable)", status: "developing", notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 4: Bedrooms and Belongings
    bedrooms: {
      items: [
        { code: "§749.3021", requirement: "Single child ≥80 sq ft; Multiple ≥40 sq ft per child (max 4)", status: "", notes: "" },
        { code: "§749.3023(a)", requirement: "Bedroom adequate for rest with door for privacy", status: "", notes: "" },
        { code: "§749.3023(b)", requirement: "Natural light source present", status: "", notes: "" },
        { code: "§749.3023(c)", requirement: "Not a passageway room", status: "", notes: "" },
        { code: "§749.3025", requirement: "Adult/child sharing appropriately approved", status: "", notes: "" },
        { code: "§749.3027", requirement: "Caregiver/child sharing per standards", status: "", notes: "" },
        { code: "§749.3029", requirement: "Age/gender appropriate arrangements", status: "", notes: "" },
        { code: "§749.3031", requirement: "Each child has clean bed with mattress protection", status: "", notes: "" },
        { code: "§749.3033", requirement: "Accessible storage space", status: "", notes: "" },
        { code: "§749.1003(3)(f)", requirement: "Adequate hygiene/grooming supplies", status: "", notes: "" },
        { code: "§749.1003(3)(g-h) / RCC 4620", requirement: "Adequate, appropriate clothing", status: "", notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 5: Education & Life Skills
    education: {
      items: [
        { code: "§749.1893 / RCC 6700", requirement: "Education Portfolio maintained", status: "", notes: "" },
        { code: "§749.1893(4)", requirement: "Quiet study space & homework time", status: "", notes: "" },
        { code: "RCC 6100", requirement: "School enrollment current", status: "", notes: "" },
        { code: "RCC 4500", requirement: "Basic life skills training provided (2+ activities/month)", status: "", notes: "" },
        { code: "RCC 4120", requirement: "Casey Life Skills Assessment (age 14+)", status: "", notes: "" },
        { code: "RCC 1433", requirement: "PAL enrollment (age 14+)", status: "", notes: "" },
        { code: "T3C-Dev", requirement: "Experiential learning opportunities documented", status: "developing", notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 6: Other Indoor Space
    indoorSpace: {
      items: [
        { code: "§749.2595", requirement: "No unauthorized video surveillance", status: "", notes: "" },
        { code: "§749.3037", requirement: "40 sq ft indoor activity space per child", status: "", notes: "" },
        { code: "§749.3035(a)", requirement: "One toilet/sink/tub per 8 household members", status: "", notes: "" },
        { code: "§749.3035(b)", requirement: "Hot and cold running water", status: "", notes: "" },
        { code: "§749.3079(1-4)", requirement: "Food properly stored and protected", status: "", notes: "" },
        { code: "§749.3079(5-6)", requirement: "Perishables refrigerated promptly", status: "", notes: "" },
        { code: "§749.3081(a)", requirement: "Food areas clean and maintained", status: "", notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 7: Documentation & Service Planning
    documentation: {
      items: [
        { code: "RCC 1510", requirement: "Placement authorization (Form 2085FC)", status: "", notes: "" },
        { code: "RCC 1560", requirement: "Medical consenter designated (Form 2085-B)", status: "", notes: "" },
        { code: "RCC 4200", requirement: "Service plan current (Form 3300)", status: "", notes: "" },
        { code: "RCC 1420", requirement: "Placement summary with sexual history (Form K-908-2279)", status: "", notes: "" },
        { code: "RCC 5100", requirement: "3-Day Medical Exam completed", status: "", notes: "" },
        { code: "RCC 5100", requirement: "Texas Health Steps checkups current", status: "", notes: "" },
        { code: "RCC 5200", requirement: "Dental checkups current (6 months)", status: "", notes: "" },
        { code: "RCC 5330", requirement: "CANS assessment current (annual for ages 3-17)", status: "", notes: "" },
        { code: "RCC 1732", requirement: "Health Passport access appropriate", status: "", notes: "" },
        { code: "T3C-Dev", requirement: "Electronic documentation system developing", status: "developing", notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 8: Trauma-Informed Care & Training
    traumaInformedCare: {
      items: [
        { code: "RCC 5510", requirement: "Pre-service trauma-informed care training completed", status: "", notes: "" },
        { code: "RCC 5520", requirement: "Annual trauma-informed care refresher current", status: "", notes: "" },
        { code: "RCC 5430", requirement: "Psychotropic medication training current", status: "", notes: "" },
        { code: "RCC 5600", requirement: "Sexual abuse caregiver training (if applicable)", status: "", notes: "" },
        { code: "RCC 1561", requirement: "Medical consent training (Form 2759)", status: "", notes: "" },
        { code: "DFPS Policy", requirement: "Suicide prevention training (1 hr pre-service, biennial)", status: "", notes: "" },
      ],
      tbriStrategies: {
        connecting: { status: "developing", notes: "" },
        empowering: { status: "developing", notes: "" },
        correcting: { status: "developing", notes: "" },
      },
      combinedNotes: "",
    },
    // Section 9: Foster Parent Interview Summary
    fosterParentInterview: {
      childrenDiscussed: [],
      supportNeeds: {
        training: { needIdentified: "", supportOffered: "", followUpRequired: false, notes: "" },
        respite: { needIdentified: "", supportOffered: "", followUpRequired: false, notes: "" },
        resources: { needIdentified: "", supportOffered: "", followUpRequired: false, notes: "" },
        behavioralSupport: { needIdentified: "", supportOffered: "", followUpRequired: false, notes: "" },
        other: { needIdentified: "", supportOffered: "", followUpRequired: false, notes: "" },
      },
      combinedNotes: "",
    },
    // Section 10: Outdoor Space (If Applicable)
    outdoorSpace: {
      applicable: true,
      items: [
        { code: "§749.3039(a-d)", requirement: "Outdoor equipment safe and maintained", status: "", notes: "" },
        { code: "§749.3039(e)", requirement: "Trampoline meets requirements (if approved)", status: "", notes: "" },
        { code: "§749.3041(4-5)", requirement: "Outdoor areas safe and well-drained", status: "", notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 11: Vehicles (If Used for Transport)
    vehicles: {
      applicable: true,
      items: [
        { code: "§749.3101-3109", requirement: "Vehicles safe, registered, insured", status: "", notes: "" },
        { code: "§749.2967", requirement: "Weapons in vehicles unloaded/inaccessible", status: "", notes: "" },
        { code: "RCC 3620", requirement: "Transportation provided for all required services", status: "", notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 12: Swimming Areas (If Applicable)
    swimmingAreas: {
      applicable: false,
      items: [
        { code: "§749.3133(d-e)", requirement: "Fence ≥4 ft with self-closing gates", status: "", notes: "" },
        { code: "§749.3133(h)", requirement: "Life-saving devices available", status: "", notes: "" },
        { code: "§749.3133(n)", requirement: "Pool chemicals inaccessible", status: "", notes: "" },
        { code: "§749.3147", requirement: "Hot tub has locking cover", status: "", notes: "" },
      ],
      combinedNotes: "",
    },
    // Section 13: Infants (If Applicable)
    infants: {
      applicable: false,
      items: [
        { code: "§749.1803(c)", requirement: "Environment safe for infants", status: "", notes: "" },
        { code: "§749.1805(1)", requirement: "Each infant has own crib", status: "", notes: "" },
        { code: "§749.1807", requirement: "Crib meets all safety standards", status: "", notes: "" },
        { code: "§749.1813(b)", requirement: "Crib bare except fitted sheet (<12 months)", status: "", notes: "" },
        { code: "§749.1815", requirement: "Safe sleep practices followed", status: "", notes: "" },
        { code: "RCC 4810", requirement: "ECI services notification (within 3 days)", status: "", notes: "" },
      ],
      combinedNotes: "",
    },
    // Quality Enhancement Discussion (T3C Preparation)
    qualityEnhancement: {
      traumaInformedPractices: [
        { practice: "Proactive strategies for behavior management", status: "", notes: "" },
        { practice: "Co-regulation techniques used", status: "", notes: "" },
        { practice: "Sensory needs accommodated", status: "", notes: "" },
        { practice: "Voice and choice given to children", status: "", notes: "" },
        { practice: "Playful engagement observed", status: "", notes: "" },
      ],
      combinedNotes: "",
    },
    // Follow-up Items from Previous Visit
    followUpItems: [],
    // Corrective Actions Required
    correctiveActions: [],
    // Additional Observations
    observations: {
      environmental: "",
      familyDynamics: "",
      childInteractions: "",
      complianceConcerns: "",
      recommendations: "",
      other: "",
      combinedNotes: "",
    },
    // Children Present (Simplified for Liaisons)
    childrenPresent: [],
    // Visit Summary
    visitSummary: {
      overallStatus: "", // fully-compliant, substantially-compliant, corrective-action, immediate-intervention
      keyStrengths: ["", "", ""],
      priorityAreas: [
        { priority: "", description: "", actionPlanned: "" },
        { priority: "", description: "", actionPlanned: "" },
        { priority: "", description: "", actionPlanned: "" },
      ],
      resourcesProvided: {
        trainingMaterials: "",
        contactInformation: "",
        templatesForms: "",
        other: "",
      },
      nextVisit: {
        visitType: "monthly",
        date: "",
        time: "",
        location: "",
      },
    },
    // Signatures
    signatures: {
      visitor: "",
      visitorDate: "",
      parent1: "",
      parent1Date: "",
      parent2: "",
      parent2Date: "",
      supervisor: "",
      supervisorDate: "",
    },
  })

  const [currentSection, setCurrentSection] = useState(0)
  const [errors, setErrors] = useState({})

  // Pre-populate form with data from database
  useEffect(() => {
    if (!prepopulationData) return

    console.log("📋 [FORM] Pre-populating form with data:", prepopulationData)

    const { home, household, placements, previousVisit } = prepopulationData

    setFormData(prev => ({
      ...prev,
      fosterHome: {
        ...prev.fosterHome,
        familyName: home?.name || "",
        homeId: home?.guid || "",
        address: home?.address?.street || "",
        city: home?.address?.city || "",
        state: home?.address?.state || "",
        zip: home?.address?.zip || "",
        phone: home?.phone || "",
        email: home?.email || "",
        // CRITICAL: License info NEVER carried forward - always fresh from DB
        licenseNumber: home?.license?.id || "",
        licenseType: home?.license?.type || "",
        licenseExpiration: home?.license?.expiration ? home.license.expiration.split('T')[0] : "",
        totalCapacity: home?.license?.capacity || 0,
        fosterCareCapacity: home?.license?.capacity || 0, // Using same value as default
        currentCensus: home?.license?.filledBeds || 0,
      },
      household: {
        ...prev.household,
        providers: household?.providers?.map(p => ({
          name: p.name,
          age: p.age,
          relationship: p.relationship,
        })) || [],
        biologicalChildren: household?.biologicalChildren?.map(c => ({
          name: c.name,
          age: c.age,
        })) || [],
        otherMembers: household?.otherHouseholdMembers?.map(m => ({
          name: m.name,
          age: m.age,
          relationship: m.relationship,
        })) || [],
      },
      placements: {
        ...prev.placements,
        children: placements?.map(child => ({
          firstName: child.firstName,
          lastName: child.lastName,
          age: child.age,
          dateOfBirth: child.dateOfBirth,
          placementDate: child.placementDate,
          contract: child.contract,
          servicePackage: child.servicePackage,
          nextCourtDate: child.nextCourtDate,
          medicalCheckups: child.nextAnnualMedical,
          dentalCheckups: child.nextDental,
          safetyPlan: child.hasActiveSafetyPlan ? "Yes" : "No",
        })) || [],
      },
    }))

    console.log("✅ [FORM] Form pre-populated successfully")
  }, [prepopulationData])

  // Determine quarter based on date
  useEffect(() => {
    const month = new Date(formData.visitInfo.date).getMonth() + 1
    let quarter = ""
    if (month <= 3) quarter = "Q1"
    else if (month <= 6) quarter = "Q2"
    else if (month <= 9) quarter = "Q3"
    else quarter = "Q4"

    setFormData((prev) => ({
      ...prev,
      visitInfo: { ...prev.visitInfo, quarter },
    }))
  }, [formData.visitInfo.date])

  // Calculate days until expiration for inspections
  useEffect(() => {
    const calculateDays = (expirationDate) => {
      if (!expirationDate) return 0
      const exp = new Date(expirationDate)
      const today = new Date()
      const diffTime = exp - today
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    setFormData((prev) => ({
      ...prev,
      inspections: {
        ...prev.inspections,
        fire: {
          ...prev.inspections.fire,
          daysUntilExpiration: calculateDays(prev.inspections.fire.expirationDate),
        },
        health: {
          ...prev.inspections.health,
          daysUntilExpiration: calculateDays(prev.inspections.health.expirationDate),
        },
      },
    }))
  }, [formData.inspections.fire.expirationDate, formData.inspections.health.expirationDate])

  // ALL sections shown on EVERY monthly visit
  // Liaisons can complete quarterly items across 3 visits or all at once
  const sections = [
    { id: "visit-info", title: "Visit Information", icon: Calendar, required: true },
    { id: "foster-home", title: "Foster Home Info", icon: Home, required: true },
    { id: "medication", title: "Section 1: Medication", icon: Activity, quarterly: true },
    { id: "inspections", title: "Section 2A: Inspections", icon: Flame, quarterly: true },
    { id: "health-safety", title: "Section 2B: Health & Safety", icon: Shield, quarterly: true },
    { id: "childrens-rights", title: "Section 3: Children's Rights", icon: Heart, quarterly: true },
    { id: "bedrooms", title: "Section 4: Bedrooms", icon: Home, quarterly: true },
    { id: "education", title: "Section 5: Education", icon: GraduationCap, quarterly: true },
    { id: "indoor-space", title: "Section 6: Indoor Space", icon: Home, quarterly: true },
    { id: "documentation", title: "Section 7: Documentation", icon: ClipboardList, quarterly: true },
    { id: "trauma-care", title: "Section 8: Trauma Care", icon: Brain, quarterly: true },
    { id: "foster-parent-interview", title: "Section 9: Foster Parent Interview", icon: Users, required: true },
    { id: "outdoor-space", title: "Section 10: Outdoor Space", icon: Home, optional: true },
    { id: "vehicles", title: "Section 11: Vehicles", icon: Car, optional: true },
    { id: "swimming", title: "Section 12: Swimming", icon: Droplets, optional: true },
    { id: "infants", title: "Section 13: Infants", icon: Baby, optional: true },
    { id: "quality-enhancement", title: "Quality Enhancement", icon: TrendingUp, optional: true },
    { id: "children-present", title: "Children Present", icon: Users, required: true },
    { id: "observations", title: "Observations", icon: FileText, required: true },
    { id: "follow-up", title: "Follow-Up Items", icon: CheckCircle, required: true },
    { id: "corrective-actions", title: "Corrective Actions", icon: AlertTriangle, optional: true },
    { id: "visit-summary", title: "Visit Summary", icon: Briefcase, required: true },
    { id: "signatures", title: "Signatures", icon: FileText, required: true },
  ]

  // Handle input changes
  const handleChange = (path, value) => {
    const keys = path.split(".")
    setFormData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev))
      let current = newData
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  // Handle compliance item status change
  const handleComplianceChange = (section, index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: prev[section].items.map((item, idx) =>
          idx === index ? { ...item, [field]: value } : item
        ),
      },
    }))
  }

  // Add child to children present list
  const addChild = () => {
    setFormData((prev) => ({
      ...prev,
      childrenPresent: [
        ...prev.childrenPresent,
        {
          name: "",
          age: "",
          present: true,
          behaviorNotes: "",
          schoolNotes: "",
          medicalTherapyNotes: "",
          asqScreeningDue: false,
          asqCompleted: false,
        },
      ],
    }))
  }

  // Add follow-up item
  const addFollowUpItem = () => {
    setFormData((prev) => ({
      ...prev,
      followUpItems: [
        ...prev.followUpItems,
        { previousIssue: "", currentStatus: "in-progress", resolutionDetails: "", notes: "" },
      ],
    }))
  }

  // Add corrective action
  const addCorrectiveAction = () => {
    setFormData((prev) => ({
      ...prev,
      correctiveActions: [
        ...prev.correctiveActions,
        { issue: "", standardRequirement: "", actionRequired: "", dueDate: "", notes: "" },
      ],
    }))
  }

  // Add fire extinguisher
  const addFireExtinguisher = () => {
    setFormData((prev) => ({
      ...prev,
      inspections: {
        ...prev.inspections,
        fireExtinguishers: [
          ...prev.inspections.fireExtinguishers,
          { location: "", lastInspection: "", nextDue: "", tagPresent: false, gaugeGreen: false, notes: "" },
        ],
      },
    }))
  }

  // Render section content
  const renderSectionContent = (sectionId) => {
    switch (sectionId) {
      case "visit-info":
        return <VisitInfoSection formData={formData} onChange={handleChange} />
      case "foster-home":
        return <FosterHomeSection formData={formData} onChange={handleChange} />
      case "medication":
        return <ComplianceSection title="Medication" section="medication" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} />
      case "inspections":
        return <InspectionSection formData={formData} onChange={handleChange} onAddExtinguisher={addFireExtinguisher} />
      case "health-safety":
        return <ComplianceSection title="General Health and Safety" section="healthSafety" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} />
      case "childrens-rights":
        return <ComplianceSection title="Children's Rights & Well-Being" section="childrensRights" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} />
      case "bedrooms":
        return <ComplianceSection title="Bedrooms and Belongings" section="bedrooms" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} />
      case "education":
        return <ComplianceSection title="Education & Life Skills" section="education" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} />
      case "indoor-space":
        return <ComplianceSection title="Other Indoor Space" section="indoorSpace" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} />
      case "documentation":
        return <ComplianceSection title="Documentation & Service Planning" section="documentation" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} />
      case "trauma-care":
        return <TraumaInformedCareSection formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} />
      case "foster-parent-interview":
        return <FosterParentInterviewSection formData={formData} onChange={handleChange} />
      case "outdoor-space":
        return <ConditionalComplianceSection title="Outdoor Space" section="outdoorSpace" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} onApplicableChange={handleChange} />
      case "vehicles":
        return <ConditionalComplianceSection title="Vehicles" section="vehicles" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} onApplicableChange={handleChange} />
      case "swimming":
        return <ConditionalComplianceSection title="Swimming Areas" section="swimmingAreas" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} onApplicableChange={handleChange} />
      case "infants":
        return <ConditionalComplianceSection title="Infants" section="infants" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} onApplicableChange={handleChange} />
      case "quality-enhancement":
        return <QualityEnhancementSection formData={formData} onChange={handleChange} />
      case "children-present":
        return <ChildrenPresentSection formData={formData} onChange={handleChange} onAddChild={addChild} />
      case "observations":
        return <ObservationsSection formData={formData} onChange={handleChange} />
      case "follow-up":
        return <FollowUpItemsSection formData={formData} onChange={handleChange} onAdd={addFollowUpItem} />
      case "corrective-actions":
        return <CorrectiveActionsSection formData={formData} onChange={handleChange} onAdd={addCorrectiveAction} />
      case "visit-summary":
        return <VisitSummarySection formData={formData} onChange={handleChange} />
      case "signatures":
        return <SignaturesSection formData={formData} onChange={handleChange} />
      default:
        return <div>Section not implemented</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      {/* Optimized for iPad 11-inch (834x1194px) */}
      <div className="max-w-full mx-auto">
        {/* Compact Header */}
        <Card className="mb-2 bg-gradient-to-r from-refuge-purple to-refuge-magenta text-white">
          <CardHeader className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Monthly Home Visit - {formData.visitInfo.quarter}</CardTitle>
                <p className="text-xs text-white/90">Visit #{formData.visitInfo.visitNumberThisQuarter} of Quarter</p>
              </div>
              <div className="text-right">
                <Badge className="bg-white text-refuge-purple text-xs">
                  {formData.visitInfo.visitType === "announced" ? "Announced" : "Unannounced"}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Compact Section Navigation */}
        <Card className="mb-2">
          <CardContent className="py-2 px-3">
            {/* Current Section Display */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <sections[currentSection].icon className="w-5 h-5 text-refuge-purple" />
                <div>
                  <p className="font-semibold text-sm">{sections[currentSection].title}</p>
                  <p className="text-xs text-gray-500">Section {currentSection + 1} of {sections.length}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {sections[currentSection].quarterly && (
                  <Badge variant="secondary" className="text-xs">Quarterly</Badge>
                )}
                {sections[currentSection].optional && (
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-refuge-purple h-1.5 rounded-full transition-all"
                style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
              />
            </div>
            
            {/* Section Jumper Dropdown */}
            <div className="mt-2">
              <Select 
                value={currentSection.toString()} 
                onValueChange={(value) => setCurrentSection(parseInt(value))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Jump to section..." />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section, idx) => (
                    <SelectItem key={idx} value={idx.toString()} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{section.title}</span>
                        {section.quarterly && <Badge variant="secondary" className="text-xs py-0">Q</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Form Content - Reduced padding */}
        <Card className="mb-2">
          <CardContent className="py-3 px-3">{renderSectionContent(sections[currentSection].id)}</CardContent>
        </Card>

        {/* Navigation - Compact buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            variant="outline"
            size="default"
            className="flex-1"
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="default" 
            className="px-4"
            onClick={() => onSave?.(formData)}
          >
            Save
          </Button>
          {currentSection === sections.length - 1 ? (
            <Button 
              size="default"
              className="flex-1 bg-refuge-purple hover:bg-refuge-magenta"
              onClick={() => onSubmit?.(formData)}
            >
              Submit
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
              size="default"
              className="flex-1 bg-refuge-purple hover:bg-refuge-magenta"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Section Components
const VisitInfoSection = ({ formData, onChange }) => (
  <div className="space-y-3">
    <Alert className="py-2">
      <AlertDescription className="text-xs">
        <strong>Monthly Visit:</strong> Items marked "Quarterly" can be completed across any of the 3 visits or all at once.
      </AlertDescription>
    </Alert>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

      <div>
        <Label htmlFor="visitType">Visit Type *</Label>
        <Select value={formData.visitInfo.visitType} onValueChange={(value) => onChange("visitInfo.visitType", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="announced">Announced</SelectItem>
            <SelectItem value="unannounced">Unannounced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="visitDate">Visit Date *</Label>
        <Input
          id="visitDate"
          type="date"
          value={formData.visitInfo.date}
          onChange={(e) => onChange("visitInfo.date", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="visitTime">Visit Time *</Label>
        <Input
          id="visitTime"
          type="time"
          value={formData.visitInfo.time}
          onChange={(e) => onChange("visitInfo.time", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="quarter">Quarter (Auto-calculated)</Label>
        <Input id="quarter" value={formData.visitInfo.quarter} disabled className="bg-gray-100" />
      </div>

      <div>
        <Label htmlFor="visitNumber">Visit Number This Quarter *</Label>
        <Select
          value={formData.visitInfo.visitNumberThisQuarter.toString()}
          onValueChange={(value) => onChange("visitInfo.visitNumberThisQuarter", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1st</SelectItem>
            <SelectItem value="2">2nd</SelectItem>
            <SelectItem value="3">3rd</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="border-t pt-6">
      <h3 className="font-semibold text-lg mb-4">Staff Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="conductedBy">Staff Name *</Label>
          <Input
            id="conductedBy"
            value={formData.visitInfo.conductedBy}
            onChange={(e) => onChange("visitInfo.conductedBy", e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div>
          <Label htmlFor="staffTitle">Title *</Label>
          <Input
            id="staffTitle"
            value={formData.visitInfo.staffTitle}
            onChange={(e) => onChange("visitInfo.staffTitle", e.target.value)}
            placeholder="e.g., Home Visit Liaison"
          />
        </div>

        <div>
          <Label htmlFor="licenseNumber">License # *</Label>
          <Input
            id="licenseNumber"
            value={formData.visitInfo.licenseNumber}
            onChange={(e) => onChange("visitInfo.licenseNumber", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="supervisor">Supervisor *</Label>
          <Input
            id="supervisor"
            value={formData.visitInfo.supervisor}
            onChange={(e) => onChange("visitInfo.supervisor", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="agency">Agency</Label>
          <Input id="agency" value={formData.visitInfo.agency} disabled className="bg-gray-100" />
        </div>

        <div>
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            value={formData.visitInfo.region}
            onChange={(e) => onChange("visitInfo.region", e.target.value)}
          />
        </div>
      </div>
    </div>
  </div>
)

const FosterHomeSection = ({ formData, onChange }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <Label htmlFor="familyName">Foster Family Name *</Label>
        <Input
          id="familyName"
          value={formData.fosterHome.familyName}
          onChange={(e) => onChange("fosterHome.familyName", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="homeId">Home ID *</Label>
        <Input
          id="homeId"
          value={formData.fosterHome.homeId}
          onChange={(e) => onChange("fosterHome.homeId", e.target.value)}
        />
      </div>

      <div className="md:col-span-3">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.fosterHome.address}
          onChange={(e) => onChange("fosterHome.address", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="city">City *</Label>
        <Input
          id="city"
          value={formData.fosterHome.city}
          onChange={(e) => onChange("fosterHome.city", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="state">State *</Label>
        <Input
          id="state"
          value={formData.fosterHome.state}
          onChange={(e) => onChange("fosterHome.state", e.target.value)}
          placeholder="TX"
        />
      </div>

      <div>
        <Label htmlFor="zip">ZIP *</Label>
        <Input
          id="zip"
          value={formData.fosterHome.zip}
          onChange={(e) => onChange("fosterHome.zip", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.fosterHome.phone}
          onChange={(e) => onChange("fosterHome.phone", e.target.value)}
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.fosterHome.email}
          onChange={(e) => onChange("fosterHome.email", e.target.value)}
        />
      </div>
    </div>

    <div className="border-t pt-3">
      <h3 className="font-semibold text-sm mb-2">License Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="licenseType">License Type *</Label>
          <Select
            value={formData.fosterHome.licenseType}
            onValueChange={(value) => onChange("fosterHome.licenseType", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Full">Full</SelectItem>
              <SelectItem value="Provisional">Provisional</SelectItem>
              <SelectItem value="Kinship">Kinship</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="licenseNumber">License # *</Label>
          <Input
            id="licenseNumber"
            value={formData.fosterHome.licenseNumber}
            onChange={(e) => onChange("fosterHome.licenseNumber", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="licenseExpiration">License Expiration *</Label>
          <Input
            id="licenseExpiration"
            type="date"
            value={formData.fosterHome.licenseExpiration}
            onChange={(e) => onChange("fosterHome.licenseExpiration", e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="respiteOnly"
            checked={formData.fosterHome.respiteOnly}
            onCheckedChange={(checked) => onChange("fosterHome.respiteOnly", checked)}
          />
          <Label htmlFor="respiteOnly" className="cursor-pointer">
            Respite Only
          </Label>
        </div>
      </div>
    </div>

    <div className="border-t pt-3">
      <h3 className="font-semibold text-sm mb-2">Capacity Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="totalCapacity">Total Capacity *</Label>
          <Input
            id="totalCapacity"
            type="number"
            value={formData.fosterHome.totalCapacity}
            onChange={(e) => onChange("fosterHome.totalCapacity", parseInt(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label htmlFor="fosterCareCapacity">Foster Care Capacity *</Label>
          <Input
            id="fosterCareCapacity"
            type="number"
            value={formData.fosterHome.fosterCareCapacity}
            onChange={(e) => onChange("fosterHome.fosterCareCapacity", parseInt(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label htmlFor="currentCensus">Current Census *</Label>
          <Input
            id="currentCensus"
            type="number"
            value={formData.fosterHome.currentCensus}
            onChange={(e) => onChange("fosterHome.currentCensus", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="mt-3">
        <Label className="text-sm">Service Levels Approved</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {["basic", "moderate", "specialized", "intense"].map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <Checkbox
                id={level}
                checked={formData.fosterHome.serviceLevels.includes(level)}
                onCheckedChange={(checked) => {
                  const current = formData.fosterHome.serviceLevels
                  onChange(
                    "fosterHome.serviceLevels",
                    checked ? [...current, level] : current.filter((l) => l !== level)
                  )
                }}
              />
              <Label htmlFor={level} className="capitalize cursor-pointer">
                {level}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

const ComplianceSection = ({ title, section, formData, onChange, onNotesChange }) => {
  const sectionData = formData[section]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <CheckCircle className="h-6 w-6 text-refuge-purple" />
        {title}
      </h2>

      <Alert>
        <AlertDescription>
          Check "Compliant" for items meeting requirements, "Non-Compliant" for deficiencies, or "N/A" if not applicable.
          Add notes for any item that needs additional documentation.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {sectionData.items.map((item, index) => (
          <Card key={index} className={item.code.includes("T3C") ? "border-blue-200 bg-blue-50/30" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {item.code}
                    </Badge>
                    {item.code.includes("T3C") && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        T3C Development
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">{item.requirement}</p>
                </div>
                <div className="flex flex-col gap-2 min-w-[300px]">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={item.status === "compliant" ? "default" : "outline"}
                      className={
                        item.status === "compliant"
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                      onClick={() => onChange(section, index, "status", item.status === "compliant" ? "" : "compliant")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Compliant
                    </Button>
                    <Button
                      size="sm"
                      variant={item.status === "non-compliant" ? "default" : "outline"}
                      className={
                        item.status === "non-compliant"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                      }
                      onClick={() =>
                        onChange(section, index, "status", item.status === "non-compliant" ? "" : "non-compliant")
                      }
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Non-Compliant
                    </Button>
                    <Button
                      size="sm"
                      variant={item.status === "na" ? "default" : "outline"}
                      onClick={() => onChange(section, index, "status", item.status === "na" ? "" : "na")}
                    >
                      N/A
                    </Button>
                  </div>
                  {item.status && (
                    <Textarea
                      placeholder="Notes (if needed)..."
                      value={item.notes}
                      onChange={(e) => onChange(section, index, "notes", e.target.value)}
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

      <div className="border-t pt-6">
        <Label htmlFor={`${section}-combined-notes`}>Combined Notes for {title}</Label>
        <Textarea
          id={`${section}-combined-notes`}
          value={sectionData.combinedNotes}
          onChange={(e) => onNotesChange(`${section}.combinedNotes`, e.target.value)}
          placeholder="Any additional observations or context for this section..."
          rows={4}
          className="mt-2"
        />
      </div>
    </div>
  )
}

const ConditionalComplianceSection = ({ title, section, formData, onChange, onNotesChange, onApplicableChange }) => {
  const sectionData = formData[section]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <CheckCircle className="h-6 w-6 text-refuge-purple" />
        {title}
      </h2>

      <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Checkbox
          id={`${section}-applicable`}
          checked={sectionData.applicable}
          onCheckedChange={(checked) => onApplicableChange(`${section}.applicable`, checked)}
        />
        <Label htmlFor={`${section}-applicable`} className="cursor-pointer font-semibold">
          This section applies to this home
        </Label>
      </div>

      {sectionData.applicable && (
        <>
          <Alert>
            <AlertDescription>
              Check "Compliant" for items meeting requirements, "Non-Compliant" for deficiencies, or "N/A" if not
              applicable. Add notes for any item that needs additional documentation.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {sectionData.items.map((item, index) => (
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
                          className={
                            item.status === "compliant"
                              ? "bg-green-600 hover:bg-green-700"
                              : ""
                          }
                          onClick={() =>
                            onChange(section, index, "status", item.status === "compliant" ? "" : "compliant")
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Compliant
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "non-compliant" ? "default" : "outline"}
                          className={
                            item.status === "non-compliant"
                              ? "bg-red-600 hover:bg-red-700"
                              : ""
                          }
                          onClick={() =>
                            onChange(section, index, "status", item.status === "non-compliant" ? "" : "non-compliant")
                          }
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Non-Compliant
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "na" ? "default" : "outline"}
                          onClick={() => onChange(section, index, "status", item.status === "na" ? "" : "na")}
                        >
                          N/A
                        </Button>
                      </div>
                      {item.status && (
                        <Textarea
                          placeholder="Notes (if needed)..."
                          value={item.notes}
                          onChange={(e) => onChange(section, index, "notes", e.target.value)}
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

          <div className="border-t pt-6">
            <Label htmlFor={`${section}-combined-notes`}>Combined Notes for {title}</Label>
            <Textarea
              id={`${section}-combined-notes`}
              value={sectionData.combinedNotes}
              onChange={(e) => onNotesChange(`${section}.combinedNotes`, e.target.value)}
              placeholder="Any additional observations or context for this section..."
              rows={4}
              className="mt-2"
            />
          </div>
        </>
      )}

      {!sectionData.applicable && (
        <Alert>
          <AlertDescription>This section has been marked as not applicable to this home.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

const InspectionSection = ({ formData, onChange, onAddExtinguisher }) => {
  const inspections = formData.inspections

  const getExpirationBadge = (days) => {
    if (days > 60) return <Badge className="bg-green-100 text-green-800">Current</Badge>
    if (days > 30) return <Badge className="bg-yellow-100 text-yellow-800">Renewal Soon</Badge>
    if (days > 0) return <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>
    return <Badge variant="destructive">EXPIRED</Badge>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <Flame className="h-6 w-6 text-refuge-purple" />
        Inspection Documentation
      </h2>

      <Alert>
        <AlertDescription>
          <strong>Annual Requirements (§749.2905):</strong> Fire and health inspections must be current. Document all
          fire extinguisher inspections.
        </AlertDescription>
      </Alert>

      {/* Fire Inspection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-600" />
            Fire Inspection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fireCurrentDate">Current Inspection Date *</Label>
              <Input
                id="fireCurrentDate"
                type="date"
                value={inspections.fire.currentInspectionDate}
                onChange={(e) => onChange("inspections.fire.currentInspectionDate", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="fireExpirationDate">Expiration Date *</Label>
              <Input
                id="fireExpirationDate"
                type="date"
                value={inspections.fire.expirationDate}
                onChange={(e) => onChange("inspections.fire.expirationDate", e.target.value)}
              />
            </div>

            <div>
              <Label>Days Until Expiration</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input value={inspections.fire.daysUntilExpiration} disabled className="bg-gray-100" />
                {getExpirationBadge(inspections.fire.daysUntilExpiration)}
              </div>
            </div>

            <div>
              <Label htmlFor="fireInspectorAgency">Inspector/Agency</Label>
              <Input
                id="fireInspectorAgency"
                value={inspections.fire.inspectorAgency}
                onChange={(e) => onChange("inspections.fire.inspectorAgency", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="fireCertificateNumber">Certificate Number</Label>
              <Input
                id="fireCertificateNumber"
                value={inspections.fire.certificateNumber}
                onChange={(e) => onChange("inspections.fire.certificateNumber", e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="fireCopyOnFile"
                checked={inspections.fire.copyOnFile}
                onCheckedChange={(checked) => onChange("inspections.fire.copyOnFile", checked)}
              />
              <Label htmlFor="fireCopyOnFile" className="cursor-pointer">
                Copy on File
              </Label>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="fireNotes">Notes</Label>
              <Textarea
                id="fireNotes"
                value={inspections.fire.notes}
                onChange={(e) => onChange("inspections.fire.notes", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Inspection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600" />
            Health Inspection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="healthCurrentDate">Current Inspection Date *</Label>
              <Input
                id="healthCurrentDate"
                type="date"
                value={inspections.health.currentInspectionDate}
                onChange={(e) => onChange("inspections.health.currentInspectionDate", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="healthExpirationDate">Expiration Date *</Label>
              <Input
                id="healthExpirationDate"
                type="date"
                value={inspections.health.expirationDate}
                onChange={(e) => onChange("inspections.health.expirationDate", e.target.value)}
              />
            </div>

            <div>
              <Label>Days Until Expiration</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input value={inspections.health.daysUntilExpiration} disabled className="bg-gray-100" />
                {getExpirationBadge(inspections.health.daysUntilExpiration)}
              </div>
            </div>

            <div>
              <Label htmlFor="healthInspectorAgency">Inspector/Agency</Label>
              <Input
                id="healthInspectorAgency"
                value={inspections.health.inspectorAgency}
                onChange={(e) => onChange("inspections.health.inspectorAgency", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="healthCertificateNumber">Certificate Number</Label>
              <Input
                id="healthCertificateNumber"
                value={inspections.health.certificateNumber}
                onChange={(e) => onChange("inspections.health.certificateNumber", e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="healthCopyOnFile"
                checked={inspections.health.copyOnFile}
                onCheckedChange={(checked) => onChange("inspections.health.copyOnFile", checked)}
              />
              <Label htmlFor="healthCopyOnFile" className="cursor-pointer">
                Copy on File
              </Label>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="healthNotes">Notes</Label>
              <Textarea
                id="healthNotes"
                value={inspections.health.notes}
                onChange={(e) => onChange("inspections.health.notes", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fire Extinguishers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-600" />
              Fire Extinguisher Inspections
            </span>
            <Button size="sm" variant="outline" onClick={onAddExtinguisher}>
              Add Location
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inspections.fireExtinguishers.map((extinguisher, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                    <div>
                      <Label htmlFor={`ext-location-${index}`}>Location</Label>
                      <Input
                        id={`ext-location-${index}`}
                        value={extinguisher.location}
                        onChange={(e) => {
                          const newExtinguishers = [...inspections.fireExtinguishers]
                          newExtinguishers[index].location = e.target.value
                          onChange("inspections.fireExtinguishers", newExtinguishers)
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`ext-last-${index}`}>Last Inspection</Label>
                      <Input
                        id={`ext-last-${index}`}
                        type="date"
                        value={extinguisher.lastInspection}
                        onChange={(e) => {
                          const newExtinguishers = [...inspections.fireExtinguishers]
                          newExtinguishers[index].lastInspection = e.target.value
                          onChange("inspections.fireExtinguishers", newExtinguishers)
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`ext-next-${index}`}>Next Due</Label>
                      <Input
                        id={`ext-next-${index}`}
                        type="date"
                        value={extinguisher.nextDue}
                        onChange={(e) => {
                          const newExtinguishers = [...inspections.fireExtinguishers]
                          newExtinguishers[index].nextDue = e.target.value
                          onChange("inspections.fireExtinguishers", newExtinguishers)
                        }}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`ext-tag-${index}`}
                        checked={extinguisher.tagPresent}
                        onCheckedChange={(checked) => {
                          const newExtinguishers = [...inspections.fireExtinguishers]
                          newExtinguishers[index].tagPresent = checked
                          onChange("inspections.fireExtinguishers", newExtinguishers)
                        }}
                      />
                      <Label htmlFor={`ext-tag-${index}`} className="cursor-pointer">
                        Tag Present
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`ext-gauge-${index}`}
                        checked={extinguisher.gaugeGreen}
                        onCheckedChange={(checked) => {
                          const newExtinguishers = [...inspections.fireExtinguishers]
                          newExtinguishers[index].gaugeGreen = checked
                          onChange("inspections.fireExtinguishers", newExtinguishers)
                        }}
                      />
                      <Label htmlFor={`ext-gauge-${index}`} className="cursor-pointer">
                        Gauge Green
                      </Label>
                    </div>

                    <div>
                      <Input
                        placeholder="Notes..."
                        value={extinguisher.notes}
                        onChange={(e) => {
                          const newExtinguishers = [...inspections.fireExtinguishers]
                          newExtinguishers[index].notes = e.target.value
                          onChange("inspections.fireExtinguishers", newExtinguishers)
                        }}
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
        <Label htmlFor="inspections-combined-notes">Combined Notes for Inspection Documentation</Label>
        <Textarea
          id="inspections-combined-notes"
          value={inspections.combinedNotes}
          onChange={(e) => onChange("inspections.combinedNotes", e.target.value)}
          placeholder="Any additional observations or context for inspections..."
          rows={4}
          className="mt-2"
        />
      </div>
    </div>
  )
}

// COMPONENT CONTINUES... (Part 2 will follow due to length)

export default EnhancedHomeVisitForm

