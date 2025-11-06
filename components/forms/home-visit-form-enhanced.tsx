"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Calendar, Home, Users, FileText, CheckCircle, Shield, Heart, Briefcase, 
  AlertTriangle, BookOpen, Activity, Car, Droplets, Baby, Flame, Stethoscope,
  GraduationCap, ClipboardList, Brain, TrendingUp, ArrowLeft, ExternalLink,
  Info, ChevronDown, ChevronUp
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
  existingFormData?: any
  onSave?: (formData: any) => Promise<void>
  onSubmit?: (formData: any) => Promise<void>
}

const EnhancedHomeVisitForm = ({ 
  appointmentId,
  appointmentData, 
  prepopulationData,
  existingFormData,
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
    // Section 1: Medication - Quarterly tracking with Month 1, 2, 3
    medication: {
      items: [
        { 
          code: "749.1463(b)(2)", 
          requirement: "Medications stored in original containers", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.1521(1), (2), (3)", 
          requirement: "All medications locked; Schedule II double-locked", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.1521", 
          requirement: '"External use only" medications stored separately', 
          allowNA: true, // Can be N/A if no external use medications
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.1521(4)", 
          requirement: "Refrigerated medications properly stored", 
          allowNA: true, // Can be N/A if no refrigerated medications
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.1521(5)", 
          requirement: "Medication storage areas clean and orderly", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.1521(6), (7), (8)", 
          requirement: "Expired/discontinued medications properly managed", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "RCC 5420", 
          requirement: "Medication Administration Record (MAR) current & accurate", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "RCC 5420", 
          requirement: "Psychotropic medication documentation (Form 4526 submitted within 5 days)", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
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
    // Section 2B: General Health and Safety - Quarterly tracking
    healthSafety: {
      items: [
        { 
          code: "749.2902, 2903, 2905", 
          requirement: "Fire and health inspections current", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.2909", 
          requirement: "Smoke detectors properly installed and functional", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.2913", 
          requirement: "Fire extinguishers present and current", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.2915", 
          requirement: "Tools and dangerous equipment stored appropriately", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.2917", 
          requirement: "Animals vaccinated and disease-free", 
          allowNA: true,
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.2961", 
          requirement: "Weapons stored per requirements", 
          allowNA: true,
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.3041(1), (2)", 
          requirement: "Indoor areas safe, clean, in good repair", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.3041(3)", 
          requirement: "Exit access clear", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.3041(6)", 
          requirement: "Ventilation screens in place", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.3041(7)", 
          requirement: "Hazardous substances stored appropriately", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
        { 
          code: "749.3041(8)", 
          requirement: "Home free of rodents and insects", 
          month1: { compliant: false, na: false, notes: "" },
          month2: { compliant: false, na: false, notes: "" },
          month3: { compliant: false, na: false, notes: "" },
        },
      ],
      combinedNotes: "",
    },
    // Section 3: Children's Rights & Well-Being
    childrensRights: {
      items: [
        { code: "§749.1003(7)(b) / RCC 1110", requirement: "Rights posters visible (English & Spanish)", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 1540", requirement: "Rights reviewed with child (Form 2530 signed)", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 1110", requirement: "DFPS Statewide Intake number displayed (1-800-252-5400)", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 1110", requirement: "Foster Care Ombudsman poster displayed", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.2601-2605 / RCC 4410", requirement: "Normalcy activities supported", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 3600", requirement: "Maintaining child's connections documented", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 3610", requirement: "Sibling visits occurring (monthly if within 100 miles)", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "T3C-Dev", requirement: "CANS assessment incorporated in planning (when applicable)", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
      ],
      combinedNotes: "",
    },
    // Section 4: Bedrooms and Belongings
    bedrooms: {
      items: [
        { code: "§749.3021", requirement: "Single child ≥80 sq ft; Multiple ≥40 sq ft per child (max 4)", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3023(a)", requirement: "Bedroom adequate for rest with door for privacy", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3023(b)", requirement: "Natural light source present", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3023(c)", requirement: "Not a passageway room", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3025", requirement: "Adult/child sharing appropriately approved", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3027", requirement: "Caregiver/child sharing per standards", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3029", requirement: "Age/gender appropriate arrangements", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3031", requirement: "Each child has clean bed with mattress protection", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3033", requirement: "Accessible storage space", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.1003(3)(f)", requirement: "Adequate hygiene/grooming supplies", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.1003(3)(g-h) / RCC 4620", requirement: "Adequate, appropriate clothing", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
      ],
      combinedNotes: "",
    },
    // Section 5: Education & Life Skills
    education: {
      items: [
        { code: "§749.1893 / RCC 6700", requirement: "Education Portfolio maintained", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.1893(4)", requirement: "Quiet study space & homework time", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 6100", requirement: "School enrollment current", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 4500", requirement: "Basic life skills training provided (2+ activities/month)", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 4120", requirement: "Casey Life Skills Assessment (age 14+)", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 1433", requirement: "PAL enrollment (age 14+)", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "T3C-Dev", requirement: "Experiential learning opportunities documented", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
      ],
      combinedNotes: "",
    },
    // Section 6: Other Indoor Space
    indoorSpace: {
      items: [
        { code: "§749.2595", requirement: "No unauthorized video surveillance", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3037", requirement: "40 sq ft indoor activity space per child", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3035(a)", requirement: "One toilet/sink/tub per 8 household members", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3035(b)", requirement: "Hot and cold running water", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3079(1-4)", requirement: "Food properly stored and protected", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3079(5-6)", requirement: "Perishables refrigerated promptly", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3081(a)", requirement: "Food areas clean and maintained", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
      ],
      combinedNotes: "",
    },
    // Section 7: Documentation & Service Planning
    documentation: {
      items: [
        { code: "RCC 1510", requirement: "Placement authorization (Form 2085FC)", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 1560", requirement: "Medical consenter designated (Form 2085-B)", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 4200", requirement: "Service plan current (Form 3300)", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 1420", requirement: "Placement summary with sexual history (Form K-908-2279)", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 5100", requirement: "3-Day Medical Exam completed", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 5100", requirement: "Texas Health Steps checkups current", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 5200", requirement: "Dental checkups current (6 months)", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 5330", requirement: "CANS assessment current (annual for ages 3-17)", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 1732", requirement: "Health Passport access appropriate", month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "T3C-Dev", requirement: "Electronic documentation system developing", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
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
      visitorSignature: "",
      visitorDate: "",
      parent1: "",
      parent1Signature: "",
      parent1Date: "",
      parent2: "",
      parent2Signature: "",
      parent2Date: "",
      supervisor: "",
      supervisorSignature: "",
      supervisorDate: "",
    },
  })

  const [currentSection, setCurrentSection] = useState(0)
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const previousSectionRef = useRef<number | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Load existing form data if available (takes precedence over prepopulation)
  useEffect(() => {
    if (!existingFormData) {
      console.log("📝 [FORM] No existing form data provided")
      return
    }

    console.log("📝 [FORM] Loading existing form data:", existingFormData)
    console.log("📝 [FORM] Existing form data keys:", Object.keys(existingFormData))

    try {
      // Helper to parse JSON strings if needed
      const parseIfString = (value: any) => {
        if (typeof value === 'string') {
          try {
            return JSON.parse(value)
          } catch (e) {
            console.warn("📝 [FORM] Failed to parse JSON string:", value)
            return value
          }
        }
        return value
      }

      // Parse JSON fields - API should already parse them, but handle both cases
      const visitInfo = parseIfString(existingFormData.visit_info)
      const familyInfo = parseIfString(existingFormData.family_info)
      const attendees = parseIfString(existingFormData.attendees)
      const observations = parseIfString(existingFormData.observations)
      const recommendations = parseIfString(existingFormData.recommendations)
      const signatures = parseIfString(existingFormData.signatures)
      const homeEnvironment = parseIfString(existingFormData.home_environment)
      const childInterviews = parseIfString(existingFormData.child_interviews)
      const parentInterviews = parseIfString(existingFormData.parent_interviews)
      const complianceReview = parseIfString(existingFormData.compliance_review)

      console.log("📝 [FORM] Parsed visit_info:", visitInfo)
      console.log("📝 [FORM] Parsed compliance_review:", complianceReview)

      // Merge existing data with current formData to preserve all fields
      setFormData(prev => ({
        ...prev,
        // Visit info - merge with existing to preserve structure
        visitInfo: visitInfo ? {
          ...prev.visitInfo,
          ...visitInfo,
          // Ensure date/time are set correctly
          date: visitInfo.date || existingFormData.visit_date || prev.visitInfo.date,
          time: visitInfo.time || existingFormData.visit_time || prev.visitInfo.time,
          quarter: visitInfo.quarter || existingFormData.quarter || prev.visitInfo.quarter,
          visitNumberThisQuarter: visitInfo.visitNumberThisQuarter || existingFormData.visit_number || prev.visitInfo.visitNumberThisQuarter,
        } : prev.visitInfo,
        // Family info
        fosterHome: familyInfo?.fosterHome ? {
          ...prev.fosterHome,
          ...familyInfo.fosterHome
        } : prev.fosterHome,
        household: familyInfo?.household ? {
          ...prev.household,
          ...familyInfo.household
        } : prev.household,
        // Attendees
        childrenPresent: attendees?.childrenPresent || prev.childrenPresent,
        // Home environment
        homeCondition: homeEnvironment?.homeCondition || prev.homeCondition,
        outdoorSpace: homeEnvironment?.outdoorSpace || prev.outdoorSpace,
        // Observations
        observations: observations?.observations || prev.observations,
        followUpItems: observations?.followUpItems || prev.followUpItems,
        correctiveActions: observations?.correctiveActions || prev.correctiveActions,
        // Recommendations
        visitSummary: recommendations?.visitSummary || prev.visitSummary,
        // Signatures
        signatures: signatures ? {
          ...prev.signatures,
          ...signatures
        } : prev.signatures,
        // Child interviews
        placements: childInterviews?.placements || prev.placements,
        // Parent interviews
        fosterParentInterview: parentInterviews?.fosterParentInterview || prev.fosterParentInterview,
        // Compliance sections - merge to preserve structure
        medication: complianceReview?.medication ? {
          ...prev.medication,
          ...complianceReview.medication
        } : prev.medication,
        inspections: complianceReview?.inspections ? {
          ...prev.inspections,
          ...complianceReview.inspections
        } : prev.inspections,
        healthSafety: complianceReview?.healthSafety ? {
          ...prev.healthSafety,
          ...complianceReview.healthSafety
        } : prev.healthSafety,
        childrensRights: complianceReview?.childrensRights ? {
          ...prev.childrensRights,
          ...complianceReview.childrensRights
        } : prev.childrensRights,
        bedrooms: complianceReview?.bedrooms ? {
          ...prev.bedrooms,
          ...complianceReview.bedrooms
        } : prev.bedrooms,
        education: complianceReview?.education ? {
          ...prev.education,
          ...complianceReview.education
        } : prev.education,
        indoorSpace: complianceReview?.indoorSpace ? {
          ...prev.indoorSpace,
          ...complianceReview.indoorSpace
        } : prev.indoorSpace,
        documentation: complianceReview?.documentation ? {
          ...prev.documentation,
          ...complianceReview.documentation
        } : prev.documentation,
        traumaInformedCare: complianceReview?.traumaInformedCare ? {
          ...prev.traumaInformedCare,
          ...complianceReview.traumaInformedCare
        } : prev.traumaInformedCare,
        outdoorSpaceCompliance: complianceReview?.outdoorSpace ? {
          ...prev.outdoorSpaceCompliance,
          ...complianceReview.outdoorSpace
        } : prev.outdoorSpaceCompliance,
        vehicles: complianceReview?.vehicles ? {
          ...prev.vehicles,
          ...complianceReview.vehicles
        } : prev.vehicles,
        swimming: complianceReview?.swimming ? {
          ...prev.swimming,
          ...complianceReview.swimming
        } : prev.swimming,
        infants: complianceReview?.infants ? {
          ...prev.infants,
          ...complianceReview.infants
        } : prev.infants,
        qualityEnhancement: complianceReview?.qualityEnhancement ? {
          ...prev.qualityEnhancement,
          ...complianceReview.qualityEnhancement
        } : prev.qualityEnhancement,
      }))
      console.log("✅ [FORM] Existing form data loaded successfully")
    } catch (error) {
      console.error("❌ [FORM] Error loading existing form data:", error)
      console.error("❌ [FORM] Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  }, [existingFormData])

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

  // Auto-save when navigating between sections
  useEffect(() => {
    // Skip auto-save on initial mount or if we haven't moved sections yet
    if (previousSectionRef.current === null) {
      previousSectionRef.current = currentSection
      return
    }

    // Only auto-save if we've actually changed sections
    if (previousSectionRef.current !== currentSection && onSave) {
      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Debounce the save slightly to avoid saving too quickly
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true)
          setSaveStatus("saving")
          // Use the latest formData by accessing it from state
          await onSave(formData)
          setSaveStatus("saved")
          
          // Clear the "saved" status after 2 seconds
          setTimeout(() => {
            setSaveStatus("idle")
          }, 2000)
        } catch (error) {
          console.error("Auto-save failed:", error)
          setSaveStatus("error")
          setTimeout(() => {
            setSaveStatus("idle")
          }, 3000)
        } finally {
          setIsSaving(false)
        }
      }, 300) // 300ms debounce
    }

    previousSectionRef.current = currentSection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, onSave]) // Only depend on currentSection and onSave

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

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

  // Handle compliance item status change - updated for monthly tracking
  const handleComplianceChange = (section, index, month, field, value) => {
    setFormData((prev) => {
      const sectionData = prev[section]
      if (!sectionData || !sectionData.items) return prev
      
      return {
        ...prev,
        [section]: {
          ...sectionData,
          items: sectionData.items.map((item, idx) => {
            if (idx === index) {
              const monthData = item[month] || { compliant: false, na: false, notes: "" }
              
              // If setting compliant to true, clear na. If setting na to true, clear compliant.
              if (field === "compliant" && value === true) {
                monthData.na = false
                monthData.compliant = true
              } else if (field === "na" && value === true) {
                monthData.compliant = false
                monthData.na = true
              } else {
                monthData[field] = value
              }
              
              return {
                ...item,
                [month]: monthData,
              }
            }
            return item
          }),
        },
      }
    })
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
        return <ComplianceSection title="Trauma-Informed Care & Training" section="traumaInformedCare" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} singleStatus={true} />
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
        return <ChildrenPresentSection formData={formData} onChange={handleChange} onAddChild={addChild} prepopulationData={prepopulationData} />
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

  // Extract current section icon for JSX rendering
  const CurrentSectionIcon = sections[currentSection].icon

  return (
    <div className="min-h-screen bg-gray-100 p-1">
      {/* Optimized for iPad 11-inch (834x1194px) - Compact Layout */}
      <div className="max-w-full mx-auto">
        {/* Dark Gradient Header - FORM STYLE */}
        <Card className="mb-1 bg-gradient-to-r from-refuge-purple to-refuge-magenta text-white rounded-xl shadow-md">
          <CardHeader className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Monthly Home Visit - {formData.visitInfo.quarter}</CardTitle>
                <p className="text-xs text-white/90">Visit #{formData.visitInfo.visitNumberThisQuarter} of Quarter</p>
              </div>
              <div className="text-right flex items-center gap-2">
                {saveStatus === "saving" && (
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs">
                    <span className="animate-pulse">Saving...</span>
                  </Badge>
                )}
                {saveStatus === "saved" && (
                  <Badge variant="outline" className="bg-green-500/20 text-white border-green-300/30 text-xs">
                    ✓ Saved
                  </Badge>
                )}
                {saveStatus === "error" && (
                  <Badge variant="outline" className="bg-red-500/20 text-white border-red-300/30 text-xs">
                    Save failed
                  </Badge>
                )}
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
                <CurrentSectionIcon className="w-5 h-5 text-refuge-purple" />
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
            
            {/* Navigation Controls: Previous | Section Dropdown | Next | Save */}
            <div className="mt-2 flex items-center gap-2">
              {/* Previous Button */}
              <Button
                onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                disabled={currentSection === 0}
                variant="outline"
                size="default"
                className="flex-shrink-0"
              >
                Previous
              </Button>
              
              {/* Section Dropdown */}
              <Select 
                value={currentSection.toString()} 
                onValueChange={(value) => setCurrentSection(parseInt(value))}
                className="flex-1"
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Jump to section..." />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section, idx) => (
                    <SelectItem key={idx} value={idx.toString()} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span>{section.title}</span>
                        {section.quarterly && <Badge variant="secondary" className="text-xs py-0">Q</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Next Button */}
              {currentSection === sections.length - 1 ? (
                <Button 
                  size="default"
                  className="flex-shrink-0 bg-refuge-purple hover:bg-refuge-magenta"
                  onClick={() => onSubmit?.(formData)}
                >
                  Submit
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                  size="default"
                  className="flex-shrink-0 bg-refuge-purple hover:bg-refuge-magenta"
                >
                  Next
                </Button>
              )}
              
              {/* Spacer */}
              <div className="flex-1" />
              
              {/* Save Button - clearly separated */}
              <Button 
                variant="outline" 
                size="default" 
                className="flex-shrink-0 font-semibold border-2 border-refuge-purple text-refuge-purple hover:bg-refuge-purple hover:text-white"
                onClick={async () => {
                  console.log("💾 [FORM] Save button clicked")
                  console.log("💾 [FORM] onSave prop:", onSave)
                  console.log("💾 [FORM] formData:", formData)
                  if (onSave) {
                    try {
                      console.log("💾 [FORM] Calling onSave callback...")
                      await onSave(formData)
                      console.log("💾 [FORM] onSave callback completed")
                    } catch (error) {
                      console.error("❌ [FORM] Error in onSave callback:", error)
                    }
                  } else {
                    console.error("❌ [FORM] onSave prop is not defined!")
                  }
                }}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Content - Reduced padding */}
        <Card className="mb-2 bg-gray-50">
          <CardContent className="py-3 px-3">{renderSectionContent(sections[currentSection].id)}</CardContent>
        </Card>
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
          value={(formData.visitInfo.visitNumberThisQuarter || 1).toString()}
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

const FosterHomeSection = ({ formData, onChange }) => {
  const providers = formData.household?.providers || []
  const biologicalChildren = formData.household?.biologicalChildren || []
  const otherMembers = formData.household?.otherMembers || []
  const placements = formData.placements?.children || []
  
  return (
    <div className="space-y-3">
      {/* Home Composition Display */}
      {(providers.length > 0 || placements.length > 0) && (
        <Alert className="bg-blue-50 border-blue-200 py-2">
          <AlertDescription className="text-xs">
            <strong>Home Composition:</strong> {providers.length} provider{providers.length !== 1 ? 's' : ''}, {biologicalChildren.length} biological child{biologicalChildren.length !== 1 ? 'ren' : ''}, {otherMembers.length} other member{otherMembers.length !== 1 ? 's' : ''}, {placements.length} foster placement{placements.length !== 1 ? 's' : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* Providers */}
      {providers.length > 0 && (
        <Card className="bg-green-50/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-green-700" />
              Providers ({providers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-1">
              {providers.map((provider, idx) => (
                <div key={idx} className="text-xs flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{provider.relationship || 'Provider'}</Badge>
                  <span className="font-medium">{provider.name}</span>
                  {provider.age && <span className="text-gray-500">Age {provider.age}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Foster Placements */}
      {placements.length > 0 && (
        <Card className="bg-purple-50/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-purple-700" />
              Foster Placements ({placements.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              {placements.map((child, idx) => (
                <div key={idx} className="text-xs border-l-2 border-purple-300 pl-2">
                  <div className="font-medium">{child.firstName} {child.lastName}</div>
                  <div className="flex gap-2 text-gray-600">
                    {child.age && <span>Age {child.age}</span>}
                    {child.placementDate && <span>• Placed: {new Date(child.placementDate).toLocaleDateString()}</span>}
                  </div>
                  {child.servicePackage && (
                    <Badge variant="secondary" className="text-xs mt-1">{child.servicePackage}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biological Children */}
      {biologicalChildren.length > 0 && (
        <Card className="bg-blue-50/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-700" />
              Biological Children ({biologicalChildren.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-1">
              {biologicalChildren.map((child, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-medium">{child.name}</span>
                  {child.age && <span className="text-gray-500"> (Age {child.age})</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Household Members */}
      {otherMembers.length > 0 && (
        <Card className="bg-gray-50/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-700" />
              Other Household Members ({otherMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-1">
              {otherMembers.map((member, idx) => (
                <div key={idx} className="text-xs flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{member.relationship || 'Resident'}</Badge>
                  <span className="font-medium">{member.name}</span>
                  {member.age && <span className="text-gray-500">Age {member.age}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
}

const ComplianceSection = ({ title, section, formData, onChange, onNotesChange, singleStatus = false }) => {
  const sectionData = formData[section]
  const [expandedRows, setExpandedRows] = useState(new Set())

  // Safety check
  if (!sectionData || !sectionData.items || sectionData.items.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-refuge-purple" />
            {title}
          </h2>
        </div>
        <Alert>
          <AlertDescription>No items found for this section.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const toggleRowExpansion = (index) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // Helper to get guide link for a requirement code
  // Maps to specific sections in the Interactive Home Monitoring Form Reference Guide
  const getGuideLink = (code, requirement) => {
    if (!code) return "/guide"
    
    // Map section names to guide anchor links from the reference guide
    const sectionAnchorMap = {
      medication: "medication-section",
      healthSafety: "health-and-safety-section",
      childrensRights: "rights", // May need adjustment based on actual guide structure
      bedrooms: "bedrooms-section",
      education: "education", // May need adjustment
      indoorSpace: "indoor-space-section",
      documentation: "documentation", // May need adjustment
    }
    
    // Get the section anchor
    const sectionAnchor = sectionAnchorMap[section] || "overview"
    
    // Clean the TAC code to create a specific item anchor
    // Format: tac-749-1463-b-2 for "TAC §749.1463(b)(2)"
    const cleanCode = code
      .replace(/§/g, "")
      .replace(/[()]/g, "-")
      .replace(/\./g, "-")
      .replace(/\s+/g, "-")
      .toLowerCase()
    
    // Link to guide with section tab and specific item anchor
    const guideSection = {
      medication: "medication",
      healthSafety: "safety",
      childrensRights: "rights",
      bedrooms: "bedroom",
      education: "education",
      indoorSpace: "indoor",
      documentation: "documentation",
    }[section] || "overview"
    
    // Return link that opens in new tab to specific section
    return `/guide?tab=${guideSection}#${sectionAnchor}-${cleanCode}`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-refuge-purple" />
          {title}
        </h2>
        <Badge variant="secondary" className="text-xs">Quarterly</Badge>
      </div>

      {/* Compact Table Format */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        {/* Table Header */}
        <div className={`grid grid-cols-12 gap-1 bg-gray-100 border-b p-2 text-sm font-semibold`}>
          <div className="col-span-2 text-gray-700">Number</div>
          <div className={singleStatus ? "col-span-7 text-gray-700" : "col-span-5 text-gray-700"}>Minimum Standard</div>
          {singleStatus ? (
            <>
              <div className="col-span-1 text-center text-gray-700">Status</div>
              <div className="col-span-2 text-center text-gray-700">Notes</div>
            </>
          ) : (
            <>
              <div className="col-span-1 text-center text-gray-700">Month 1</div>
              <div className="col-span-1 text-center text-gray-700">Month 2</div>
              <div className="col-span-1 text-center text-gray-700">Month 3</div>
              <div className="col-span-2 text-center text-gray-700">Notes</div>
            </>
          )}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {sectionData.items.map((item, index) => {
            const isExpanded = expandedRows.has(index)
            // Support both new format (month1/month2/month3) and old format (status/notes) for backward compatibility
            const hasNewFormat = item.month1 !== undefined || item.month2 !== undefined || item.month3 !== undefined
            const hasNotes = singleStatus
              ? item.notes
              : hasNewFormat 
                ? (item.month1?.notes || item.month2?.notes || item.month3?.notes)
                : item.notes
            const showExpandButton = hasNotes || item.requirement.length > 60

            return (
              <div key={index} className="bg-white">
                {/* Main Row */}
                <div className="grid grid-cols-12 gap-1 p-2 items-center text-sm hover:bg-gray-50">
                  {/* Number Column */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className="font-mono text-xs text-gray-600">{item.code?.replace(/§/g, "") || ""}</span>
                    <a
                      href={getGuideLink(item.code || "", item.requirement || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      title="View detailed help in guide (opens in new tab)"
                    >
                      <Info className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Minimum Standard Column */}
                  <div className={singleStatus ? "col-span-7 text-gray-900 leading-tight text-sm" : "col-span-5 text-gray-900 leading-tight text-sm"}>
                    {item.requirement}
                  </div>

                  {singleStatus ? (
                    /* Single Status Column - For quarterly sections without monthly tracking */
                    <div className="col-span-1 flex flex-col gap-0.5 justify-center items-center">
                      {/* Support old format (status/notes) for Trauma Informed Care */}
                      {item.status !== undefined ? (
                        <>
                          <Button
                            size="sm"
                            variant={item.status === "compliant" ? "default" : "outline"}
                            className={`h-8 w-full text-xs px-2 font-medium ${
                              item.status === "compliant"
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "hover:bg-green-50"
                            }`}
                            onClick={() => {
                              onChange(section, index, "status", item.status === "compliant" ? "" : "compliant")
                            }}
                          >
                            {item.status === "compliant" ? "✓" : "Compliant"}
                          </Button>
                          {item.allowNA && (
                            <Button
                              size="sm"
                              variant={item.status === "na" ? "default" : "outline"}
                              className={`h-6 w-full text-xs px-1 ${
                                item.status === "na"
                                  ? "bg-slate-600 hover:bg-slate-700 text-white"
                                  : "hover:bg-slate-50"
                              }`}
                              onClick={() => {
                                onChange(section, index, "status", item.status === "na" ? "" : "na")
                              }}
                            >
                              N/A
                            </Button>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Month 1 - Compliant/N/A Buttons */}
                      <div className="col-span-1 flex flex-col gap-0.5 justify-center items-center">
                        {hasNewFormat ? (
                          <>
                            <Button
                              size="sm"
                              variant={item.month1?.compliant ? "default" : "outline"}
                              className={`h-8 w-full text-xs px-2 font-medium ${
                                item.month1?.compliant
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "hover:bg-green-50"
                              }`}
                              onClick={() => {
                                onChange(section, index, "month1", "compliant", !item.month1?.compliant)
                              }}
                            >
                              {item.month1?.compliant ? "✓" : "Compliant"}
                            </Button>
                            {item.allowNA && (
                              <Button
                                size="sm"
                                variant={item.month1?.na ? "default" : "outline"}
                                className={`h-6 w-full text-xs px-1 ${
                                  item.month1?.na
                                    ? "bg-slate-600 hover:bg-slate-700 text-white"
                                    : "hover:bg-slate-50"
                                }`}
                                onClick={() => {
                                  onChange(section, index, "month1", "na", !item.month1?.na)
                                }}
                              >
                                N/A
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>

                      {/* Month 2 - Compliant/N/A Buttons */}
                      <div className="col-span-1 flex flex-col gap-0.5 justify-center items-center">
                        {hasNewFormat ? (
                          <>
                            <Button
                              size="sm"
                              variant={item.month2?.compliant ? "default" : "outline"}
                              className={`h-8 w-full text-xs px-2 font-medium ${
                                item.month2?.compliant
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "hover:bg-green-50"
                              }`}
                              onClick={() => {
                                onChange(section, index, "month2", "compliant", !item.month2?.compliant)
                              }}
                            >
                              {item.month2?.compliant ? "✓" : "Compliant"}
                            </Button>
                            {item.allowNA && (
                              <Button
                                size="sm"
                                variant={item.month2?.na ? "default" : "outline"}
                                className={`h-6 w-full text-xs px-1 ${
                                  item.month2?.na
                                    ? "bg-slate-600 hover:bg-slate-700 text-white"
                                    : "hover:bg-slate-50"
                                }`}
                                onClick={() => {
                                  onChange(section, index, "month2", "na", !item.month2?.na)
                                }}
                              >
                                N/A
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>

                      {/* Month 3 - Compliant/N/A Buttons */}
                      <div className="col-span-1 flex flex-col gap-0.5 justify-center items-center">
                        {hasNewFormat ? (
                          <>
                            <Button
                              size="sm"
                              variant={item.month3?.compliant ? "default" : "outline"}
                              className={`h-8 w-full text-xs px-2 font-medium ${
                                item.month3?.compliant
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "hover:bg-green-50"
                              }`}
                              onClick={() => {
                                onChange(section, index, "month3", "compliant", !item.month3?.compliant)
                              }}
                            >
                              {item.month3?.compliant ? "✓" : "Compliant"}
                            </Button>
                            {item.allowNA && (
                              <Button
                                size="sm"
                                variant={item.month3?.na ? "default" : "outline"}
                                className={`h-6 w-full text-xs px-1 ${
                                  item.month3?.na
                                    ? "bg-slate-600 hover:bg-slate-700 text-white"
                                    : "hover:bg-slate-50"
                                }`}
                                onClick={() => {
                                  onChange(section, index, "month3", "na", !item.month3?.na)
                                }}
                              >
                                N/A
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Notes Column - Always show expand button for notes */}
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 w-7 p-0 ${hasNotes ? "text-blue-600" : "text-gray-400"}`}
                      onClick={() => toggleRowExpansion(index)}
                      title={isExpanded ? "Hide notes" : "Add/edit notes"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Notes Row */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t px-2 py-2 space-y-2">
                    {singleStatus ? (
                      /* Single notes field for single-status sections */
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block font-medium">Notes</Label>
                        <Textarea
                          value={item.notes || ""}
                          onChange={(e) => onChange(section, index, "notes", e.target.value)}
                          placeholder="Optional..."
                          className="text-sm h-10 resize-none p-2"
                          rows={2}
                        />
                      </div>
                    ) : hasNewFormat ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block font-medium">Month 1 Notes</Label>
                          <Textarea
                            value={item.month1?.notes || ""}
                            onChange={(e) => onChange(section, index, "month1", "notes", e.target.value)}
                            placeholder="Optional..."
                            className="text-sm h-10 resize-none p-2"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block font-medium">Month 2 Notes</Label>
                          <Textarea
                            value={item.month2?.notes || ""}
                            onChange={(e) => onChange(section, index, "month2", "notes", e.target.value)}
                            placeholder="Optional..."
                            className="text-sm h-10 resize-none p-2"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block font-medium">Month 3 Notes</Label>
                          <Textarea
                            value={item.month3?.notes || ""}
                            onChange={(e) => onChange(section, index, "month3", "notes", e.target.value)}
                            placeholder="Optional..."
                            className="text-sm h-10 resize-none p-2"
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block font-medium">Notes</Label>
                        <Textarea
                          value={item.notes || ""}
                          onChange={(e) => onChange(section, index, "notes", e.target.value)}
                          placeholder="Optional..."
                          className="text-sm h-10 resize-none p-2"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Section Notes */}
      <div className="border-t pt-2 mt-2">
        <Label htmlFor={`${section}-combined-notes`} className="text-sm font-medium">Section Notes (Optional)</Label>
        <Textarea
          id={`${section}-combined-notes`}
          value={sectionData.combinedNotes || ""}
          onChange={(e) => onNotesChange(`${section}.combinedNotes`, e.target.value)}
          placeholder="Additional observations for this section..."
          rows={2}
          className="mt-1 text-sm"
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
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {/* Requirement Text and Code */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {item.code}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium leading-snug">{item.requirement}</p>
                    </div>
                    {/* Compact Status Buttons and Notes - Side by Side */}
                    <div className="flex gap-2">
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
                            onChange(section, index, "status", item.status === "compliant" ? "" : "compliant")
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
                            onChange(section, index, "status", item.status === "non-compliant" ? "" : "non-compliant")
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
                          onClick={() => onChange(section, index, "status", item.status === "na" ? "" : "na")}
                        >
                          <span className="text-xs font-semibold">N/A</span>
                        </Button>
                      </div>

                      {/* Notes Field - 1/2 width, required only for non-compliant */}
                      <div className={`w-1/2 transition-opacity duration-200 ${item.status ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                        <Textarea
                          placeholder={item.status === "non-compliant" ? "Notes required..." : item.status ? "Add notes if needed..." : ""}
                          value={item.notes || ""}
                          onChange={(e) => onChange(section, index, "notes", e.target.value)}
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

      {/* Fire and Health Inspections - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fire Inspection */}
        <Card className="bg-gray-50">
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
        <Card className="bg-gray-50">
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
      </div>

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

