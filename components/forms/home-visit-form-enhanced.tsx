"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { 
  Calendar, Home, Users, FileText, CheckCircle, Shield, Heart, Briefcase, 
  AlertTriangle, BookOpen, Activity, Car, Droplets, Baby, Flame, Stethoscope,
  GraduationCap, ClipboardList, Brain, TrendingUp, ArrowLeft, ExternalLink,
  Info, ChevronDown, ChevronUp, Clock, History, Upload, Image, X, FileDown
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TextareaWithVoice } from "@/components/ui/textarea-with-voice"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import {
  FosterParentInterviewSection,
  QualityEnhancementSection,
  ObservationsSection,
  FollowUpItemsSection,
  CorrectiveActionsSection,
  VisitSummarySection,
  SignaturesSection,
  FilesSection,
} from "./home-visit-form-enhanced-sections"
import { QuarterlyReviewSection } from "./quarterly-review-section"

interface EnhancedHomeVisitFormProps {
  appointmentId?: string | null
  appointmentData?: any
  prepopulationData?: any
  existingFormData?: any
  onSave?: (formData: any, options?: { silent?: boolean }) => Promise<void>
  onSubmit?: (formData: any) => Promise<void>
  onCompleteVisit?: () => Promise<void>
}

const EnhancedHomeVisitForm = ({ 
  appointmentId,
  appointmentData, 
  prepopulationData,
  existingFormData,
  onSave,
  onSubmit,
  onCompleteVisit
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
      supervisor: "",
      agency: "Refuge House, Inc.",
    },
    fosterHome: {
      familyName: "",
      homeId: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      fullAddress: "", // Formatted single-line address
      phone: "",
      email: "",
      licenseType: "Full", // Full, Provisional, Kinship
      licenseNumber: "",
      licenseEffective: "", // Current license effective date (same as last updated)
      licenseExpiration: "",
      originallyLicensed: "", // Date first licensed
      totalCapacity: 0,
      fosterCareCapacity: 0,
      currentCensus: 0,
      serviceLevels: [], // basic, moderate, specialized, intense
      respiteOnly: false,
      placementHistory: [], // Raw placement history data for display
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
    // Section 10: Outdoor Space (If Applicable) - Quarterly only (single status)
    outdoorSpace: {
      applicable: true,
      items: [
        { code: "§749.3039(a-d)", requirement: "Outdoor equipment safe and maintained", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3039(e)", requirement: "Trampoline meets requirements (if approved)", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3041(4-5)", requirement: "Outdoor areas safe and well-drained", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
      ],
      combinedNotes: "",
    },
    // Section 11: Vehicles (If Used for Transport) - Quarterly only (single status)
    vehicles: {
      applicable: true,
      items: [
        { code: "§749.3101-3109", requirement: "Vehicles safe, registered, insured", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.2967", requirement: "Weapons in vehicles unloaded/inaccessible", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 3620", requirement: "Transportation provided for all required services", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
      ],
      combinedNotes: "",
    },
    // Section 12: Swimming Areas (If Applicable) - Quarterly only (single status)
    swimmingAreas: {
      applicable: false,
      items: [
        { code: "§749.3133(d-e)", requirement: "Fence ≥4 ft with self-closing gates", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3133(h)", requirement: "Life-saving devices available", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3133(n)", requirement: "Pool chemicals inaccessible", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.3147", requirement: "Hot tub has locking cover", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
      ],
      combinedNotes: "",
    },
    // Section 13: Infants (If Applicable) - Quarterly only (single status)
    infants: {
      applicable: false,
      items: [
        { code: "§749.1803(c)", requirement: "Environment safe for infants", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.1805(1)", requirement: "Each infant has own crib", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.1807", requirement: "Crib meets all safety standards", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.1813(b)", requirement: "Crib bare except fitted sheet (<12 months)", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "§749.1815", requirement: "Safe sleep practices followed", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        { code: "RCC 4810", requirement: "ECI services notification (within 3 days)", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
      ],
      combinedNotes: "",
    },
    // Section 14: Package-Specific Compliance Requirements
    packageCompliance: {
      credentialedPackages: [], // Array of package names: "substance-use", "stass", "t3c-treatment", "mental-behavioral", "idd-autism"
      // Substance Use Support Services
      substanceUse: {
        items: [
          { code: "T3C Blueprint p.56-66; RCC Term 7", requirement: "Substance-free environment verified (no alcohol, illegal drugs, or non-prescribed controlled substances accessible)", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.56-66", requirement: "Drug testing supplies stored securely with privacy and dignity", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.56-66; RCC Term 7", requirement: "Recovery support environment with minimal triggers and healthy recreational activities", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.56-66", requirement: "Private counseling space for substance use counseling (in-home or teletherapy)", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.56-66", requirement: "Peer support resources accessible; caregiver knowledge of local recovery resources", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.56-66", requirement: "Crisis response protocols posted for substance use emergencies; naloxone available if prescribed", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.56-66", requirement: "Enhanced security for Medication-Assisted Treatment medications (if applicable)", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.56-66", requirement: "Therapeutic activities access (exercise equipment, art supplies, journals, mindfulness tools)", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        ],
      },
      // Short-Term Assessment Support Services (STASS)
      stass: {
        items: [
          { code: "T3C Blueprint p.67-75; RCC Term 7", requirement: "Assessment environment: calm, structured, conducive to behavioral observation", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.67-75", requirement: "Observation documentation space: quiet space with computer access for timely documentation", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.67-75", requirement: "Multi-purpose assessment areas for observing youth in different settings", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.67-75; RCC Term 7", requirement: "Professional meeting space suitable for assessment team meetings and virtual consultations", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.67-75", requirement: "Crisis safety preparedness: de-escalation spaces, crisis protocols posted", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.67-75", requirement: "Comprehensive documentation systems: behavioral tracking tools, daily observation logs", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.67-75", requirement: "Privacy and confidentiality: assessment materials stored securely", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.67-75", requirement: "Flexible scheduling accommodation for assessments and team meetings", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        ],
      },
      // T3C Treatment Foster Family Care Support Services
      t3cTreatment: {
        items: [
          { code: "T3C Blueprint p.135-147; TAC §749.863(c)", requirement: "Enhanced therapeutic environment: trauma-informed design, calming colors, sensory regulation tools", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147; RCC Term 7", requirement: "Intensive treatment support space: private space for therapeutic activities and treatment team meetings", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147", requirement: "Advanced crisis management capability: multiple de-escalation spaces, comprehensive safety protocols", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147", requirement: "Sophisticated documentation infrastructure: advanced systems supporting intensive treatment model", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147; RCC Term 7", requirement: "Enhanced medication management: treatment-level administration systems, psychotropic monitoring protocols", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147", requirement: "Multi-modal therapeutic resources: art therapy, play therapy, bibliotherapy, mindfulness tools", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147", requirement: "Family therapy accommodation: spaces and scheduling flexibility for intensive family therapy sessions", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147", requirement: "Professional collaboration infrastructure: supports frequent coordination with multiple providers", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147; RCC Term 7", requirement: "Intensive behavioral support systems: visual supports, data collection systems, positive reinforcement", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147; TAC §749.863(c)", requirement: "Treatment Foster Care training: 20 hours additional training beyond basic requirements", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147", requirement: "Enhanced safety infrastructure: advanced monitoring systems (if approved), multiple safety zones", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.135-147", requirement: "Respite care support system: established relationships with treatment-trained respite providers", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        ],
      },
      // Mental & Behavioral Health Support Services
      mentalBehavioral: {
        items: [
          { code: "T3C Blueprint p.82; RCC Term 7", requirement: "Crisis safety assessment: items that could be used for self-harm secured or removed", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.82", requirement: "Enhanced medication security: psychotropic medications under enhanced double-lock system", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.82", requirement: "Safe de-escalation spaces: calm-down area free from hazards with soft seating and visual privacy", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.82", requirement: "Therapeutic environment: sensory regulation tools available (weighted blankets, fidget items, calming music)", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.82; RCC Term 7", requirement: "Crisis communication systems: reliable phone and high-speed internet for 24/7 crisis support", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.82", requirement: "Crisis intervention protocols posted; emergency contact numbers accessible; first aid kit stocked", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.78-93; RCC Term 7", requirement: "Private therapy space: quiet, confidential space for in-home therapy or teletherapy", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.82", requirement: "Behavioral monitoring tools: systems for tracking behavioral patterns accessible to caregivers", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.82", requirement: "Secondary trauma prevention: evidence of caregiver self-care systems and support resources", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        ],
      },
      // IDD/Autism Spectrum Disorder Support Services
      iddAutism: {
        items: [
          { code: "T3C Blueprint p.123-135", requirement: "Sensory-friendly spaces: quiet areas with adjustable lighting and sensory regulation tools", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.123-135; RCC Term 7", requirement: "Wandering/elopement safety: door alarms, secure fencing (4ft+), window locks functional", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.123-135", requirement: "Visual supports system: visual schedules posted, spaces labeled, consistent organization", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.123-135", requirement: "Accessibility features: wheelchair accessibility, grab bars, ramps/lifts (if needed)", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.123-135; RCC Term 7", requirement: "Technology readiness: high-speed internet for teletherapy, AAC device charging stations", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.123-135", requirement: "Specialized medical equipment space: adequate storage for feeding equipment, adaptive devices", allowNA: true, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.123-135", requirement: "Structured routine environment: organized spaces, minimal clutter, consistent item placement", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.123-135", requirement: "Communication systems: alternative communication (picture boards, PECS, AAC devices) present and functional", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.123-135", requirement: "Sensory accommodations: environmental modifications based on child's sensory profile", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.123-135", requirement: "Educational support space: designated homework area with minimal distractions", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
          { code: "T3C Blueprint p.123-135", requirement: "Medical management systems: medication administration, specialized diet storage, emergency protocols", allowNA: false, month1: { compliant: false, na: false, notes: "" }, month2: { compliant: false, na: false, notes: "" }, month3: { compliant: false, na: false, notes: "" } },
        ],
      },
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
    // Quarterly Review Items (TAC §749.2815)
    quarterlyReview: {
      // Household Composition Updates (§749.2815(c)(1))
      householdComposition: {
        currentMembers: [], // Array of { name: string, role: string, relationship: string }
        frequentVisitors: [], // Array of { name: string, relationship: string, frequency: string }
        backupCaregivers: [], // Array of { name: string, relationship: string, contactInfo: string }
        changesSinceLastQuarter: "",
        notes: "",
      },
      // Major Life Changes (§749.2815(c)(2))
      majorLifeChanges: {
        changes: [], // Array of { type: string, description: string, date: string, impact: string }
        // Types: marriage, divorce, birth, serious-illness, employment-change, extended-absence, other
        notes: "",
      },
      // Disaster and Emergency Planning Updates (§749.2815(c)(3))
      disasterEmergencyPlanning: {
        fireDrillDate: "",
        evacuationRoutesReviewed: false,
        severeWeatherPlanUpdated: false,
        contingencyContactsCurrent: false,
        planAccountsForAllMembers: false,
        lastReviewDate: "",
        nextReviewDue: "",
        changesSinceLastQuarter: "",
        notes: "",
      },
      // Family Stress and Well-Being Assessment (§749.2815(c)(4))
      familyStressWellbeing: {
        stressLevel: "", // low, moderate, high, critical
        financialPressures: "",
        healthPressures: "",
        emotionalPressures: "",
        methodsForChallengingBehaviors: "",
        stressAlleviationMethods: "",
        supportSystemsInPlace: "",
        additionalSupportNeeded: "",
        notes: "",
      },
      // Quarterly Visit Documentation Standards (§749.2815(d), (e))
      documentationStandards: {
        householdMembersPresent: [], // Array of names
        rulesStandardsReviewed: [], // Array of rule/standard codes reviewed
        evaluationResults: "",
        deficienciesIdentified: [],
        plannedCorrectiveActions: [],
        changesFromPriorScreening: "",
        explanationsForChanges: "",
        fosterParentSignatures: [], // Array of { name: string, signature: string, date: string }
        staffSignature: "",
        staffSignatureDate: "",
        notes: "",
      },
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
    // Attendance at Visit
    attendance: {
      fosterParents: [], // Array of { name: string, present: boolean }
      staff: [], // Array of { name: string, role: string, present: boolean }
      others: [], // Array of { name: string, role: string, present: boolean }
    },
    // Visit Summary
    visitSummary: {
      overallStatus: "", // fully-compliant, substantially-compliant, corrective-action, immediate-intervention
      overallAssessment: "", // Overall assessment text field
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
        combined: "", // Combined resources field for simplified entry
      },
      nextVisit: {
        visitType: "monthly",
        date: "",
        time: "",
        location: "",
      },
      aiGeneratedSummary: "", // AI-generated comprehensive summary
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
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
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
        fullAddress: (() => {
          const parts = [
            home?.address?.street,
            home?.address?.street2,
            home?.address?.city,
            home?.address?.state,
            home?.address?.zip
          ].filter(Boolean)
          return parts.join(', ') || ""
        })(),
        phone: home?.phone || "",
        email: home?.email || "",
        // CRITICAL: License info NEVER carried forward - always fresh from DB
        licenseNumber: home?.license?.id || "",
        licenseType: home?.license?.type || "",
        licenseEffective: home?.license?.effective ? (home.license.effective.split('T')[0] || home.license.effective) : "",
        licenseExpiration: home?.license?.expiration ? home.license.expiration.split('T')[0] : "",
        originallyLicensed: home?.license?.originallyLicensed || "",
        totalCapacity: home?.license?.capacity || 0,
        fosterCareCapacity: home?.license?.capacity || 0, // Using same value as default
        currentCensus: home?.license?.filledBeds || 0,
        serviceLevels: home?.serviceLevels || ['basic'], // Populate from API (Basic always included)
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
        attendance: attendees?.attendance || prev.attendance,
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
          // Pass silent: true to suppress toast notifications
          await onSave(formData, { silent: true })
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

  // Sections organized into three groups:
  // 1. Monthly Compliance Items (required every visit)
  // 2. T3C Readiness Items (development/preparation)
  // 3. Quarterly Review Items (required once per quarter per TAC §749.2815)
  
  const monthlyComplianceSections = [
    { id: "visit-info", title: "Visit Information", icon: Calendar, required: true, group: "compliance" },
    { id: "foster-home", title: "Foster Home Info", icon: Home, required: true, group: "compliance" },
    { id: "medication", title: "Section 1: Medication", icon: Activity, group: "compliance" },
    { id: "inspections", title: "Section 2A: Inspections", icon: Flame, group: "compliance" },
    { id: "health-safety", title: "Section 2B: Health & Safety", icon: Shield, group: "compliance" },
    { id: "childrens-rights", title: "Section 3: Children's Rights", icon: Heart, group: "compliance" },
    { id: "bedrooms", title: "Section 4: Bedrooms", icon: Home, group: "compliance" },
    { id: "education", title: "Section 5: Education", icon: GraduationCap, group: "compliance" },
    { id: "indoor-space", title: "Section 6: Indoor Space", icon: Home, group: "compliance" },
    // HIDDEN FOR V1: { id: "documentation", title: "Section 7: Documentation", icon: ClipboardList, group: "compliance" },
    // HIDDEN FOR V1: { id: "trauma-care", title: "Trauma-Informed Care & Training", icon: Brain, group: "compliance" },
    { id: "outdoor-space", title: "Section 10: Outdoor Space", icon: Home, optional: true, group: "compliance" },
    { id: "vehicles", title: "Section 11: Vehicles", icon: Car, optional: true, group: "compliance" },
    { id: "swimming", title: "Section 12: Swimming", icon: Droplets, optional: true, group: "compliance" },
    { id: "infants", title: "Section 13: Infants", icon: Baby, optional: true, group: "compliance" },
  ]

  const t3cReadinessSections = [
    { id: "package-compliance", title: "Section 14: Package-Specific Compliance", icon: Shield, optional: true, group: "t3c" },
    // HIDDEN FOR V1: { id: "quality-enhancement", title: "Quality Enhancement", icon: TrendingUp, optional: true, group: "t3c" },
  ]

  const quarterlyReviewSections = [
    // HIDDEN FOR V1: { id: "quarterly-review", title: "Quarterly Review Items", icon: ClipboardList, required: true, group: "quarterly", frequency: "quarterly" },
  ]

  const standardSections = [
    { id: "foster-parent-interview", title: "Foster Parent Interview", icon: Users, required: true, group: "standard" },
    { id: "observations", title: "Observations", icon: FileText, required: true, group: "standard" },
    { id: "follow-up", title: "Follow-Up Items", icon: CheckCircle, required: true, group: "standard" },
    // HIDDEN FOR V1: { id: "corrective-actions", title: "Corrective Actions", icon: AlertTriangle, optional: true, group: "standard" },
    { id: "visit-summary", title: "Visit Summary", icon: Briefcase, required: true, group: "standard" },
    // HIDDEN FOR V1: Files tab removed - functionality available in appointment detail page Files tab
    // HIDDEN FOR V1: { id: "files", title: "Files", icon: FileText, required: false, group: "standard" },
    { id: "signatures", title: "Signatures", icon: FileText, required: true, group: "standard" },
  ]

  // Combine all sections for rendering (excluding hidden sections)
  const sections = [
    ...monthlyComplianceSections,
    ...t3cReadinessSections,
    ...quarterlyReviewSections,
    ...standardSections,
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

  // Handle compliance item status change - updated for monthly tracking and old status format
  const handleComplianceChange = (section, index, month, field, value) => {
    setFormData((prev) => {
      // Handle nested paths like "packageCompliance.substanceUse"
      const sectionParts = section.split(".")
      let sectionData
      if (sectionParts.length > 1) {
        // Nested path - navigate through the object
        sectionData = prev[sectionParts[0]]
        for (let i = 1; i < sectionParts.length; i++) {
          sectionData = sectionData?.[sectionParts[i]]
        }
      } else {
        // Simple path
        sectionData = prev[section]
      }
      
      if (!sectionData || !sectionData.items) return prev
      
      // Update the nested structure
      const updatedItems = sectionData.items.map((item, idx) => {
        if (idx === index) {
          // Handle old format: when month === "status", update the status field directly
          if (month === "status") {
            return {
              ...item,
              status: value,
            }
          }
          
          // New format: update month data (month1, month2, month3)
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
      })
      
      // Build the update object for nested paths
      if (sectionParts.length > 1) {
        const update = {}
        let current = update
        for (let i = 0; i < sectionParts.length - 1; i++) {
          current[sectionParts[i]] = { ...prev[sectionParts[i]] }
          current = current[sectionParts[i]]
        }
        current[sectionParts[sectionParts.length - 1]] = {
          ...sectionData,
          items: updatedItems,
        }
        return {
          ...prev,
          ...update,
        }
      } else {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            items: updatedItems,
          },
        }
      }
    })
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
        return <VisitInfoSection formData={formData} onChange={handleChange} appointmentData={appointmentData} prepopulationData={prepopulationData} />
      case "foster-home":
        return <FosterHomeSection formData={formData} onChange={handleChange} appointmentData={appointmentData} />
      case "medication":
        return <ComplianceSection title="Medication" section="medication" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} />
      case "inspections":
        return <InspectionSection formData={formData} onChange={handleChange} onAddExtinguisher={addFireExtinguisher} existingFormData={existingFormData} />
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
        return <ComplianceSection title="Outdoor Space" section="outdoorSpace" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} onApplicableChange={handleChange} singleStatus={true} />
      case "vehicles":
        return <ComplianceSection title="Vehicles" section="vehicles" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} onApplicableChange={handleChange} singleStatus={true} />
      case "swimming":
        return <ComplianceSection title="Swimming Areas" section="swimmingAreas" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} onApplicableChange={handleChange} singleStatus={true} />
      case "infants":
        return <ComplianceSection title="Infants" section="infants" formData={formData} onChange={handleComplianceChange} onNotesChange={handleChange} onApplicableChange={handleChange} singleStatus={true} />
      case "package-compliance":
        return <PackageComplianceSection formData={formData} onChange={handleChange} onComplianceChange={handleComplianceChange} onNotesChange={handleChange} />
      case "quality-enhancement":
        return <QualityEnhancementSection formData={formData} onChange={handleChange} />
      case "quarterly-review":
        return <QuarterlyReviewSection formData={formData} onChange={handleChange} />
      case "observations":
        return <ObservationsSection formData={formData} onChange={handleChange} />
      case "follow-up":
        return <FollowUpItemsSection formData={formData} onChange={handleChange} onAdd={addFollowUpItem} />
      case "corrective-actions":
        return <CorrectiveActionsSection formData={formData} onChange={handleChange} onAdd={addCorrectiveAction} />
      case "visit-summary":
        return <VisitSummarySection formData={formData} onChange={handleChange} />
      case "files":
        return <FilesSection formData={formData} onChange={handleChange} appointmentId={appointmentId} existingFormData={existingFormData} />
      case "signatures":
        return <SignaturesSection formData={formData} onChange={handleChange} appointmentData={appointmentData} appointmentId={appointmentId} existingFormData={existingFormData} />
      default:
        return <div>Section not implemented</div>
    }
  }

  // Extract current section icon for JSX rendering
  const CurrentSectionIcon = sections[currentSection].icon

  return (
    <div className="min-h-screen bg-background p-1 sm:p-2 md:p-3">
      {/* Responsive Layout - Adapts to viewport */}
      <div className="w-full max-w-full mx-auto">
        {/* Dark Gradient Header - FORM STYLE */}
        <Card className="mb-1 bg-gradient-to-r from-refuge-purple to-refuge-magenta text-white rounded-xl shadow-md">
          <CardHeader className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Monthly Home Visit{formData.visitInfo.quarter ? ` - ${formData.visitInfo.quarter}` : ""}</CardTitle>
                <p className="text-xs text-white/90">{formData.visitInfo.visitNumberThisQuarter ? `Visit #${formData.visitInfo.visitNumberThisQuarter} of Quarter` : "Home Visit Form"}</p>
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
                {existingFormData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHistoryModalOpen(true)}
                    className="text-white hover:bg-white/20 h-8 px-2"
                    title="View document history"
                  >
                    <History className="h-4 w-4" />
                  </Button>
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
                  <p className="text-xs text-muted-foreground">Section {currentSection + 1} of {sections.length}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {sections[currentSection].optional && (
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="bg-secondary rounded-full h-1.5">
              <div
                className="bg-refuge-purple h-1.5 rounded-full transition-all"
                style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
              />
            </div>
            
            {/* Navigation Controls: Previous | Section Dropdown | Next | Save */}
            <div className="mt-2 flex items-center gap-2">
              {/* Navigation Group - Limited to half width */}
              <div className="flex items-center gap-2 w-1/2">
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
                    {/* Monthly Compliance Items */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      📋 Monthly Compliance Items
                    </div>
                    {monthlyComplianceSections.map((section, idx) => {
                      const sectionIndex = sections.findIndex(s => s.id === section.id)
                      return (
                        <SelectItem key={sectionIndex} value={sectionIndex.toString()} className="text-sm pl-4">
                          <span>{section.title}</span>
                        </SelectItem>
                      )
                    })}
                    
                    {/* T3C Readiness Items */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-2">
                      🔵 T3C Readiness Items
                    </div>
                    {t3cReadinessSections.map((section, idx) => {
                      const sectionIndex = sections.findIndex(s => s.id === section.id)
                      return (
                        <SelectItem key={sectionIndex} value={sectionIndex.toString()} className="text-sm pl-4">
                          <span>{section.title}</span>
                        </SelectItem>
                      )
                    })}
                    
                    {/* Quarterly Review Items */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-2">
                      🟢 Quarterly Review Items
                    </div>
                    {quarterlyReviewSections.map((section, idx) => {
                      const sectionIndex = sections.findIndex(s => s.id === section.id)
                      return (
                        <SelectItem key={sectionIndex} value={sectionIndex.toString()} className="text-sm pl-4">
                          <span>{section.title}</span>
                        </SelectItem>
                      )
                    })}
                    
                    {/* Standard Sections */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-2">
                      📝 Standard Sections
                    </div>
                    {standardSections.map((section, idx) => {
                      const sectionIndex = sections.findIndex(s => s.id === section.id)
                      return (
                        <SelectItem key={sectionIndex} value={sectionIndex.toString()} className="text-sm pl-4">
                          <span>{section.title}</span>
                        </SelectItem>
                      )
                    })}
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
              </div>
              
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
              
              {/* Visit Completed Button - allows completing visit without full form submission */}
              {appointmentId && onCompleteVisit && (
                <Button 
                  variant="outline" 
                  size="default" 
                  className="flex-shrink-0 font-semibold border-2 border-green-600 text-green-700 hover:bg-green-50 hover:border-green-700"
                  onClick={async () => {
                    console.log("✅ [FORM] Visit Completed button clicked")
                    
                    // Prompt for confirmation before completing visit
                    const confirmed = window.confirm(
                      "Are you sure you want to mark this visit as completed?\n\n" +
                      "This will update the appointment status to 'completed'.\n" +
                      "You can still edit and submit the form later if needed."
                    )
                    
                    if (!confirmed) {
                      console.log("✅ [FORM] Visit completion cancelled by user")
                      return
                    }
                    
                    if (onCompleteVisit) {
                      try {
                        console.log("✅ [FORM] Calling onCompleteVisit callback...")
                        await onCompleteVisit()
                        console.log("✅ [FORM] Visit marked as completed")
                      } catch (error) {
                        console.error("❌ [FORM] Error completing visit:", error)
                      }
                    }
                  }}
                >
                  Visit Completed
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Content - Reduced padding */}
        <Card className="mb-2 bg-card">
          <CardContent className="py-3 px-3">{renderSectionContent(sections[currentSection].id)}</CardContent>
        </Card>

        {/* Document History Modal */}
        {existingFormData && (
          <DocumentHistoryModal
            open={historyModalOpen}
            onOpenChange={setHistoryModalOpen}
            formData={existingFormData}
          />
        )}
      </div>
    </div>
  )
}

// Document History Modal Component
const DocumentHistoryModal = ({ open, onOpenChange, formData }: { open: boolean; onOpenChange: (open: boolean) => void; formData: any }) => {
  const createdBy = formData.created_by_name || formData.created_by_user_id || "Unknown"
  const createdDate = formData.created_at ? new Date(formData.created_at).toLocaleString() : "Unknown"
  
  const currentSession = {
    lastSave: formData.current_session_last_save ? new Date(formData.current_session_last_save).toLocaleString() : null,
    saveType: formData.current_session_save_type || "manual",
    userName: formData.current_session_user_name || formData.current_session_user_id || "Unknown",
  }
  
  const historyEntries = formData.save_history_json ? (typeof formData.save_history_json === 'string' ? JSON.parse(formData.save_history_json) : formData.save_history_json) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-refuge-purple" />
            Document History
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Created By Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Created</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created by:</span>
                <span className="font-medium">{createdBy}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created on:</span>
                <span className="font-medium">{createdDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Current Session */}
          {currentSession.lastSave && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last saved:</span>
                  <span className="font-medium">{currentSession.lastSave}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Save type:</span>
                  <Badge variant={currentSession.saveType === "auto" ? "secondary" : "default"}>
                    {currentSession.saveType === "auto" ? "Auto-save" : "Manual"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Saved by:</span>
                  <span className="font-medium">{currentSession.userName}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Previous Sessions History */}
          {historyEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Previous Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {historyEntries.map((entry: any, index: number) => (
                    <div key={index} className="border-l-2 border-refuge-purple/30 pl-4 py-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">
                          {entry.lastSave ? new Date(entry.lastSave).toLocaleString() : "Unknown date"}
                        </span>
                        <Badge variant={entry.saveType === "auto" ? "secondary" : "default"}>
                          {entry.saveType === "auto" ? "Auto-save" : "Manual"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Saved by: {entry.userName || entry.userId || "Unknown"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {historyEntries.length === 0 && !currentSession.lastSave && (
            <Alert>
              <AlertDescription className="text-sm text-muted-foreground">
                No save history available yet. History will appear after the form is saved.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Section Components
const VisitInfoSection = ({ formData, onChange, appointmentData, prepopulationData }) => {
  // Get staff name from appointment (whoever clicked start visit/drive)
  const staffName = appointmentData?.appointment?.assigned_to_name || ""
  
  // Get case manager from home data (check multiple possible locations)
  const caseManager = 
    appointmentData?.appointment?.CaseManager || 
    prepopulationData?.homeInfo?.contactPersonName || 
    prepopulationData?.familyInfo?.caseManager || 
    ""
  
  // Auto-populate fields if not already set
  useEffect(() => {
    // Auto-populate staff name
    if (staffName && (!formData.visitInfo.conductedBy || formData.visitInfo.conductedBy === "")) {
      onChange("visitInfo.conductedBy", staffName)
    }
    
    // Default title to "Home Visit Liaison"
    if (!formData.visitInfo.staffTitle || formData.visitInfo.staffTitle === "") {
      onChange("visitInfo.staffTitle", "Home Visit Liaison")
    }
    
    // Auto-populate supervisor (case manager)
    if (caseManager && (!formData.visitInfo.supervisor || formData.visitInfo.supervisor === "")) {
      onChange("visitInfo.supervisor", caseManager)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffName, caseManager]) // Only run when staffName or caseManager changes

  return (
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
          <Input id="quarter" value={formData.visitInfo.quarter} disabled className="bg-muted" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="conductedBy">Staff Name *</Label>
            <Input
              id="conductedBy"
              value={formData.visitInfo.conductedBy || staffName}
              onChange={(e) => onChange("visitInfo.conductedBy", e.target.value)}
              placeholder="Your name"
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="staffTitle">Title *</Label>
            <Input
              id="staffTitle"
              value={formData.visitInfo.staffTitle || "Home Visit Liaison"}
              onChange={(e) => onChange("visitInfo.staffTitle", e.target.value)}
              placeholder="Home Visit Liaison"
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="supervisor">Case Manager *</Label>
            <Input
              id="supervisor"
              value={formData.visitInfo.supervisor || caseManager}
              onChange={(e) => onChange("visitInfo.supervisor", e.target.value)}
              placeholder="Case Manager"
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="agency">Agency</Label>
            <Input id="agency" value={formData.visitInfo.agency || "Refuge House"} disabled className="bg-muted text-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

const FosterHomeSection = ({ formData, onChange, appointmentData }) => {
  const { user } = useUser()
  
  const providers = formData.household?.providers || []
  const biologicalChildren = formData.household?.biologicalChildren || []
  const otherMembers = formData.household?.otherMembers || []
  const placements = formData.placements?.children || []
  
  // Auto-check staff member on mount if they're not already checked
  useEffect(() => {
    if (appointmentData?.appointment?.assigned_to_name) {
      const staffName = appointmentData.appointment.assigned_to_name
      const staffRole = appointmentData.appointment.assigned_to_role || "Staff"
      const current = formData.attendance?.staff || []
      const existing = current.find(s => s.name === staffName)
      
      if (!existing || !existing.present) {
        const updated = existing 
          ? current.map(s => s.name === staffName ? { ...s, present: true } : s)
          : [...current, { name: staffName, role: staffRole, present: true }]
        onChange("attendance.staff", updated)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentData?.appointment?.assigned_to_name]) // Only run when staff name changes

  // Auto-populate placement history if not already loaded
  useEffect(() => {
    const homeGUID = formData.fosterHome?.homeId
    const existingHistory = formData.fosterHome?.placementHistory
    
    // Only fetch if we have a home GUID and no existing history
    if (!homeGUID || (existingHistory && existingHistory.length > 0)) {
      return
    }

    const fetchPlacementChanges = async () => {
      try {
        // Calculate date range: last 6 months
        const endDate = new Date()
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 6)

        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        const response = await fetch(
          `/api/placement-history?homeGUID=${encodeURIComponent(homeGUID)}&startDate=${startDateStr}&endDate=${endDateStr}`
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.warn("Failed to fetch placement changes:", response.status, errorText)
          return
        }

        const result = await response.json()
        
        if (!result.success || !result.data || result.data.length === 0) {
          // No placement changes found - set empty array
          onChange("fosterHome.placementHistory", [])
          return
        }

        // Store raw placement data for display in table
        onChange("fosterHome.placementHistory", result.data)
      } catch (error: any) {
        console.warn("Error fetching placement changes:", error)
      }
    }

    fetchPlacementChanges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fosterHome?.homeId]) // Only run when home GUID is available
  
  return (
    <div className="space-y-6">
      {/* SECTION 1: Home Composition with Attendance */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Home Composition & Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <AlertDescription className="text-sm text-foreground">
              <strong>Instructions:</strong> Check the box beside each person who is present during the home visit. Add any other persons present in the home during the visit.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Home Residents */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-foreground mb-2">Home Residents</h4>
              
              {/* Providers */}
              {providers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Foster Parents</Label>
                  <div className="space-y-2 pl-2">
                    {providers.map((provider, idx) => {
                      const attendanceKey = `fosterParent_${idx}`
                      const isPresent = formData.attendance?.fosterParents?.find(p => p.name === provider.name)?.present || false
                      
                      return (
                        <div key={idx} className="flex items-center space-x-2">
                          <Checkbox
                            id={attendanceKey}
                            checked={isPresent}
                            onCheckedChange={(checked) => {
                              const current = formData.attendance?.fosterParents || []
                              const existing = current.findIndex(p => p.name === provider.name)
                              
                              if (existing >= 0) {
                                const updated = [...current]
                                updated[existing].present = checked
                                onChange("attendance.fosterParents", updated)
                              } else {
                                onChange("attendance.fosterParents", [...current, { name: provider.name, present: checked }])
                              }
                            }}
                          />
                          <Label htmlFor={attendanceKey} className="cursor-pointer text-sm flex-1">
                            <span className="font-medium">{provider.name}</span>
                            {provider.relationship && <span className="text-muted-foreground ml-1">({provider.relationship})</span>}
                            {provider.age && <span className="text-muted-foreground ml-1">• Age {provider.age}</span>}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Biological Children */}
              {biologicalChildren.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Biological Children</Label>
                  <div className="space-y-1 pl-2">
                    {biologicalChildren.map((child, idx) => {
                      const attendanceKey = `bioChild_${idx}`
                      const isPresent = formData.attendance?.others?.find(o => o.name === child.name && o.role === "Biological Child")?.present || false
                      
                      return (
                        <div key={idx} className="flex items-center space-x-2">
                          <Checkbox
                            id={attendanceKey}
                            checked={isPresent}
                            onCheckedChange={(checked) => {
                              const current = formData.attendance?.others || []
                              const existing = current.findIndex(o => o.name === child.name && o.role === "Biological Child")
                              
                              if (existing >= 0) {
                                const updated = [...current]
                                updated[existing].present = checked
                                onChange("attendance.others", updated)
                              } else {
                                onChange("attendance.others", [...current, { name: child.name, role: "Biological Child", present: checked }])
                              }
                            }}
                          />
                          <Label htmlFor={attendanceKey} className="cursor-pointer text-sm">
                            <span className="font-medium">{child.name}</span>
                            {child.age && <span className="text-muted-foreground ml-1">• Age {child.age}</span>}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Other Household Members */}
              {otherMembers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Other Household Members</Label>
                  <div className="space-y-1 pl-2">
                    {otherMembers.map((member, idx) => {
                      const attendanceKey = `otherMember_${idx}`
                      const isPresent = formData.attendance?.others?.find(o => o.name === member.name && o.role === (member.relationship || "Resident"))?.present || false
                      
                      return (
                        <div key={idx} className="flex items-center space-x-2">
                          <Checkbox
                            id={attendanceKey}
                            checked={isPresent}
                            onCheckedChange={(checked) => {
                              const current = formData.attendance?.others || []
                              const existing = current.findIndex(o => o.name === member.name && o.role === (member.relationship || "Resident"))
                              
                              if (existing >= 0) {
                                const updated = [...current]
                                updated[existing].present = checked
                                onChange("attendance.others", updated)
                              } else {
                                onChange("attendance.others", [...current, { name: member.name, role: member.relationship || "Resident", present: checked }])
                              }
                            }}
                          />
                          <Label htmlFor={attendanceKey} className="cursor-pointer text-sm">
                            <span className="font-medium">{member.name}</span>
                            {member.relationship && <span className="text-muted-foreground ml-1">({member.relationship})</span>}
                            {member.age && <span className="text-muted-foreground ml-1">• Age {member.age}</span>}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Foster Children */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-foreground mb-2">Foster Children in Placement</h4>
              
              {placements.length > 0 ? (
                <div className="space-y-2">
                  {placements.map((child, idx) => {
                    const attendanceKey = `placement_${idx}`
                    const isPresent = formData.attendance?.others?.find(o => o.name === `${child.firstName} ${child.lastName}` && o.role === "Foster Child")?.present || false
                    
                    return (
                      <div key={idx} className="border-l-2 border-purple-300 pl-3 py-2 bg-purple-50/30 rounded-r">
                        <div className="flex items-center space-x-2 mb-1">
                          <Checkbox
                            id={attendanceKey}
                            checked={isPresent}
                            onCheckedChange={(checked) => {
                              const current = formData.attendance?.others || []
                              const childName = `${child.firstName} ${child.lastName}`
                              const existing = current.findIndex(o => o.name === childName && o.role === "Foster Child")
                              
                              if (existing >= 0) {
                                const updated = [...current]
                                updated[existing].present = checked
                                onChange("attendance.others", updated)
                              } else {
                                onChange("attendance.others", [...current, { name: childName, role: "Foster Child", present: checked }])
                              }
                            }}
                          />
                          <Label htmlFor={attendanceKey} className="cursor-pointer text-sm flex-1">
                            <span className="font-medium">{child.firstName} {child.lastName}</span>
                            {child.age && <span className="text-muted-foreground ml-1">• Age {child.age}</span>}
                          </Label>
                        </div>
                        <div className="text-xs text-muted-foreground pl-6">
                          {child.placementDate && <span>Placed: {new Date(child.placementDate).toLocaleDateString()}</span>}
                          {child.servicePackage && (
                            <Badge variant="secondary" className="text-xs ml-2">{child.servicePackage}</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No foster children currently in placement</p>
              )}
            </div>
          </div>

          {/* Staff and Other Attendees */}
          <div className="border-t pt-4 mt-4 space-y-3">
            {/* Staff Conducting Visit - Auto-checked */}
            {appointmentData?.appointment?.assigned_to_name && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="staff_conducting"
                  checked={formData.attendance?.staff?.find(s => s.name === appointmentData.appointment.assigned_to_name)?.present || true}
                  onCheckedChange={(checked) => {
                    const staffName = appointmentData.appointment.assigned_to_name
                    const staffRole = appointmentData.appointment.assigned_to_role || "Staff"
                    const current = formData.attendance?.staff || []
                    const existing = current.findIndex(s => s.name === staffName)
                    
                    if (existing >= 0) {
                      const updated = [...current]
                      updated[existing].present = checked
                      onChange("attendance.staff", updated)
                    } else {
                      onChange("attendance.staff", [...current, { name: staffName, role: staffRole, present: checked }])
                    }
                  }}
                />
                <Label htmlFor="staff_conducting" className="cursor-pointer text-sm">
                  <span className="font-medium">{appointmentData.appointment.assigned_to_name}</span>
                  {appointmentData.appointment.assigned_to_role && (
                    <span className="text-muted-foreground ml-1">({appointmentData.appointment.assigned_to_role})</span>
                  )}
                  <span className="text-muted-foreground ml-1">• Staff Conducting Visit</span>
                </Label>
              </div>
            )}

            {/* Add Other Attendee */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Add Other Attendee</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Name"
                  value={formData.attendance?.newOtherName || ""}
                  onChange={(e) => onChange("attendance.newOtherName", e.target.value)}
                  className="flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && formData.attendance?.newOtherName) {
                      const current = formData.attendance?.others || []
                      onChange("attendance.others", [...current, { 
                        name: formData.attendance.newOtherName, 
                        role: formData.attendance.newOtherRole || "Other",
                        present: true 
                      }])
                      onChange("attendance.newOtherName", "")
                      onChange("attendance.newOtherRole", "")
                    }
                  }}
                />
                <Input
                  placeholder="Role (optional)"
                  value={formData.attendance?.newOtherRole || ""}
                  onChange={(e) => onChange("attendance.newOtherRole", e.target.value)}
                  className="w-40 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && formData.attendance?.newOtherName) {
                      const current = formData.attendance?.others || []
                      onChange("attendance.others", [...current, { 
                        name: formData.attendance.newOtherName, 
                        role: formData.attendance.newOtherRole || "Other",
                        present: true 
                      }])
                      onChange("attendance.newOtherName", "")
                      onChange("attendance.newOtherRole", "")
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (formData.attendance?.newOtherName) {
                      const current = formData.attendance?.others || []
                      onChange("attendance.others", [...current, { 
                        name: formData.attendance.newOtherName, 
                        role: formData.attendance.newOtherRole || "Other",
                        present: true 
                      }])
                      onChange("attendance.newOtherName", "")
                      onChange("attendance.newOtherRole", "")
                    }
                  }}
                  disabled={!formData.attendance?.newOtherName}
                >
                  Add
                </Button>
              </div>
              
              {/* Show added "other" attendees that aren't household members */}
              {(formData.attendance?.others || []).filter(other => 
                !providers.some(p => p.name === other.name) &&
                !biologicalChildren.some(c => c.name === other.name) &&
                !otherMembers.some(m => m.name === other.name) &&
                !placements.some(p => `${p.firstName} ${p.lastName}` === other.name)
              ).map((other, idx) => (
                <div key={idx} className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id={`other_${idx}`}
                    checked={other.present}
                    onCheckedChange={(checked) => {
                      const current = formData.attendance?.others || []
                      const updated = [...current]
                      const otherIdx = current.findIndex(o => o.name === other.name && o.role === other.role)
                      if (otherIdx >= 0) {
                        updated[otherIdx].present = checked
                        onChange("attendance.others", updated)
                      }
                    }}
                  />
                  <Label htmlFor={`other_${idx}`} className="cursor-pointer text-sm flex-1">
                    {other.name}
                    {other.role && <span className="text-muted-foreground ml-1">({other.role})</span>}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    onClick={() => {
                      const current = formData.attendance?.others || []
                      onChange("attendance.others", current.filter((o, i) => 
                        !(o.name === other.name && o.role === other.role)
                      ))
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placement Changes (6 month history) */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Placement Changes (6 month history)
            <Badge variant="secondary" className="ml-2 text-xs">
              §749.2815(c)(1)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {formData.fosterHome?.placementHistory && formData.fosterHome.placementHistory.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Child Name</TableHead>
                    <TableHead>Change Type</TableHead>
                    <TableHead>Home Role</TableHead>
                    <TableHead>From Home</TableHead>
                    <TableHead>To Home</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.fosterHome.placementHistory.map((placement: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(placement.effectiveDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{placement.childName}</TableCell>
                      <TableCell>{placement.changeType}</TableCell>
                      <TableCell>
                        {placement.homeRole === 'to' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            Placed TO this home
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                            Moved FROM this home
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{placement.fromHome || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{placement.toHome || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Placement changes from the last 6 months will be automatically populated when available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: Home Logistics - Display Only */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Home className="h-5 w-5" />
            Home Logistics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-foreground font-medium">Family Name:</span>
              <span className="ml-2">{formData.fosterHome.familyName || "—"}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-gray-600 font-medium">Address:</span>
              <span className="ml-2">
                {formData.fosterHome.fullAddress || 
                 (() => {
                   const parts = [
                     formData.fosterHome.address,
                     formData.fosterHome.city,
                     formData.fosterHome.state,
                     formData.fosterHome.zip
                   ].filter(Boolean)
                   return parts.join(', ') || "—"
                 })()}
              </span>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Phone:</span>
              <span className="ml-2">{formData.fosterHome.phone || "—"}</span>
            </div>
            {formData.fosterHome.email && (
              <div>
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="ml-2">{formData.fosterHome.email}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: License & Regulatory Information - Display Only */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="bg-refuge-purple text-white rounded-t-lg pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            License & Regulatory Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 space-y-3">
          {/* License Information */}
          <div>
            <h4 className="font-medium text-sm text-foreground mb-2">License Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-foreground font-medium">License Type:</span>
                <span className="ml-2">{formData.fosterHome.licenseType || "—"}</span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">License Effective Date:</span>
                <span className="ml-2">
                  {formData.fosterHome.licenseEffective 
                    ? new Date(formData.fosterHome.licenseEffective).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              {formData.fosterHome.originallyLicensed && (
                <div>
                  <span className="text-gray-600 font-medium">Originally Licensed:</span>
                  <span className="ml-2">
                    {new Date(formData.fosterHome.originallyLicensed).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-600 font-medium">Respite Only:</span>
                <span className="ml-2">{formData.fosterHome.respiteOnly ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          {/* Capacity Information */}
          <div className="border-t pt-3">
            <h4 className="font-medium text-sm text-foreground mb-2">Capacity Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600 font-medium">Total Capacity:</span>
                <span className="ml-2">{formData.fosterHome.totalCapacity || "—"}</span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Foster Care Capacity:</span>
                <span className="ml-2">{formData.fosterHome.fosterCareCapacity || "—"}</span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Current Census:</span>
                <span className="ml-2">{formData.fosterHome.currentCensus || "—"}</span>
              </div>
            </div>
          </div>

          {/* Service Levels Approved */}
          <div className="border-t pt-3">
            <h4 className="font-medium text-sm text-foreground mb-2">Service Levels Approved</h4>
            <div className="flex flex-wrap gap-2">
              {formData.fosterHome.serviceLevels && formData.fosterHome.serviceLevels.length > 0 ? (
                formData.fosterHome.serviceLevels.map((level) => (
                  <Badge key={level} variant="secondary" className="text-xs capitalize">
                    {level}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">None specified</span>
              )}
            </div>
          </div>

          {/* Credentialed Packages - Stub */}
          <div className="border-t pt-3">
            <h4 className="font-medium text-sm text-foreground mb-2">Credentialed Packages</h4>
            <div className="bg-muted border border-border rounded-lg p-3">
              <p className="text-sm text-muted-foreground italic">
                Package credentialing information will be displayed here once the data structure is finalized.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

  </div>
  )
}

const ComplianceSection = ({ title, section, formData, onChange, onNotesChange, singleStatus = false, onApplicableChange }) => {
  const sectionData = formData[section]
  const [expandedRows, setExpandedRows] = useState(new Set())
  
  // Check if this section has an "applicable" field (for optional sections)
  const hasApplicable = sectionData && typeof sectionData.applicable === 'boolean'

  // Safety check
  if (!sectionData || !sectionData.items || sectionData.items.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
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
    
    // Map form sections to guide tabs
    const sectionToTabMap = {
      medication: "medication",
      healthSafety: "safety",
      childrensRights: "rights",
      bedrooms: "bedroom",
      education: "education",
      indoorSpace: "indoor",
      documentation: "documentation",
      outdoorSpace: "outdoor",
      vehicles: "vehicles",
      swimming: "swimming",
      infants: "infants",
      traumaCare: "safety", // Trauma care might be in safety or rights section
      packageCompliance: "packages",
    }
    
    // Get the appropriate guide tab
    const guideTab = sectionToTabMap[section] || "overview"
    
    // Clean the TAC code to create a specific item anchor
    // This matches the format used in RequirementItem component
    // Handle formats like "749.1521(6), (7), (8)" or "TAC §749.1521(6), (7), (8)"
    const cleanCode = code
      .replace(/§/g, '') // Remove section symbol
      .replace(/tac\s*/gi, '') // Remove "TAC" prefix if present
      .replace(/\s*,\s*/g, '-') // Replace commas and spaces with single dash
      .replace(/[()]/g, '-') // Replace parentheses with dashes
      .replace(/\./g, '-') // Replace dots with dashes
      .replace(/\s+/g, '-') // Replace remaining spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .toLowerCase()
    
    // Return link that opens in new tab to specific section with hash
    return `/guide?tab=${guideTab}#${cleanCode}`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <CheckCircle className="h-4 w-4 text-refuge-purple" />
          {title}
        </h2>
      </div>

      {/* Applicable Checkbox for Optional Sections */}
      {hasApplicable && (
        <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
          <Checkbox
            id={`${section}-applicable`}
            checked={sectionData.applicable}
            onCheckedChange={(checked) => onApplicableChange && onApplicableChange(`${section}.applicable`, checked)}
          />
          <Label htmlFor={`${section}-applicable`} className="cursor-pointer font-semibold text-sm">
            This section applies to this home
          </Label>
        </div>
      )}

      {/* Show N/A message if section is not applicable */}
      {hasApplicable && sectionData.applicable === false && (
        <Alert className="bg-muted border-border">
          <AlertDescription className="text-sm text-foreground">
            <strong>Not Applicable:</strong> This section does not apply to this home.
          </AlertDescription>
        </Alert>
      )}

      {/* Show content only if applicable (or if no applicable field) */}
      {(!hasApplicable || sectionData.applicable) && (
        <>
          {/* Compact Table Format */}
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        {/* Table Header */}
        <div className={`grid grid-cols-12 gap-1 bg-muted border-b p-2 text-sm font-semibold`}>
          <div className="col-span-2 text-foreground">Number</div>
          <div className={singleStatus ? "col-span-7 text-foreground" : "col-span-5 text-foreground"}>Minimum Standard</div>
          {singleStatus ? (
            <>
              <div className="col-span-1 text-center text-foreground">Status</div>
              <div className="col-span-2 text-center text-foreground">Notes</div>
            </>
          ) : (
            <>
              <div className="col-span-1 text-center text-foreground">Month 1</div>
              <div className="col-span-1 text-center text-foreground">Month 2</div>
              <div className="col-span-1 text-center text-foreground">Month 3</div>
              <div className="col-span-2 text-center text-foreground">Notes</div>
            </>
          )}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border">
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
              <div key={index} className="bg-card">
                {/* Main Row */}
                <div className="grid grid-cols-12 gap-1 p-2 items-center text-sm hover:bg-muted/50">
                  {/* Number Column */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className="font-mono text-xs text-muted-foreground">{item.code?.replace(/§/g, "") || ""}</span>
                    <a
                      href={getGuideLink(item.code || "", item.requirement || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      title="View detailed help in guide (opens in new tab)"
                    >
                      <Info className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Minimum Standard Column */}
                  <div className={singleStatus ? "col-span-7 text-foreground leading-tight text-sm" : "col-span-5 text-foreground leading-tight text-sm"}>
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
                                : "hover:bg-green-50 dark:hover:bg-green-950/20"
                            }`}
                            onClick={() => {
                              const newStatus = item.status === "compliant" ? null : "compliant"
                              onChange(section, index, "status", newStatus)
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
                      ) : hasNewFormat ? (
                        /* New format (month1/month2/month3) - use month1 for single status */
                        <>
                          <Button
                            size="sm"
                            variant={item.month1?.compliant ? "default" : "outline"}
                            className={`h-8 w-full text-xs px-2 font-medium ${
                              item.month1?.compliant
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "hover:bg-green-50 dark:hover:bg-green-950/20"
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
                        <span className="text-muted-foreground text-xs">-</span>
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
                                  : "hover:bg-green-50 dark:hover:bg-green-950/20"
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
                          <span className="text-muted-foreground text-xs">-</span>
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
                                  : "hover:bg-green-50 dark:hover:bg-green-950/20"
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
                          <span className="text-muted-foreground text-xs">-</span>
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
                                  : "hover:bg-green-50 dark:hover:bg-green-950/20"
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
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Notes Column - Always show expand button for notes */}
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 w-7 p-0 ${hasNotes ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
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
                  <div className="bg-muted border-t px-2 py-2 space-y-2">
                    {singleStatus ? (
                      /* Single notes field for single-status sections */
                      <div>
                        <Label className="text-xs text-foreground mb-1 block font-medium">Notes</Label>
                        <TextareaWithVoice
                          value={item.notes || ""}
                          onChange={(e) => onChange(section, index, "notes", e.target.value)}
                          placeholder="Optional..."
                          className="text-sm h-10 resize-none p-2"
                          rows={2}
                          showVoiceButton={true}
                        />
                      </div>
                    ) : hasNewFormat ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-foreground mb-1 block font-medium">Month 1 Notes</Label>
                          <TextareaWithVoice
                            value={item.month1?.notes || ""}
                            onChange={(e) => onChange(section, index, "month1", "notes", e.target.value)}
                            placeholder="Optional..."
                            className="text-sm h-10 resize-none p-2"
                            rows={2}
                            showVoiceButton={true}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-foreground mb-1 block font-medium">Month 2 Notes</Label>
                          <TextareaWithVoice
                            value={item.month2?.notes || ""}
                            onChange={(e) => onChange(section, index, "month2", "notes", e.target.value)}
                            placeholder="Optional..."
                            className="text-sm h-10 resize-none p-2"
                            rows={2}
                            showVoiceButton={true}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-foreground mb-1 block font-medium">Month 3 Notes</Label>
                          <TextareaWithVoice
                            value={item.month3?.notes || ""}
                            onChange={(e) => onChange(section, index, "month3", "notes", e.target.value)}
                            placeholder="Optional..."
                            className="text-sm h-10 resize-none p-2"
                            rows={2}
                            showVoiceButton={true}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs text-foreground mb-1 block font-medium">Notes</Label>
                        <TextareaWithVoice
                          value={item.notes || ""}
                          onChange={(e) => onChange(section, index, "notes", e.target.value)}
                          placeholder="Optional..."
                          className="text-sm h-10 resize-none p-2"
                          rows={2}
                          showVoiceButton={true}
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
        </>
      )}

      {/* Section Notes - Only show if applicable (or if no applicable field) */}
      {(!hasApplicable || sectionData.applicable) && (
        <div className="border-t pt-2 mt-2">
          <Label htmlFor={`${section}-combined-notes`} className="text-sm font-medium">Section Notes (Optional)</Label>
          <TextareaWithVoice
            id={`${section}-combined-notes`}
            value={sectionData.combinedNotes || ""}
            onChange={(e) => onNotesChange(`${section}.combinedNotes`, e.target.value)}
            placeholder="Additional observations for this section..."
            rows={2}
            className="mt-1 text-sm"
            showVoiceButton={true}
          />
        </div>
      )}
    </div>
  )
}

// Package-Specific Compliance Section Component
const PackageComplianceSection = ({ formData, onChange, onComplianceChange, onNotesChange }) => {
  const packageData = formData.packageCompliance || {}
  const credentialedPackages = packageData.credentialedPackages || []
  
  const packageOptions = [
    { id: "substance-use", label: "Substance Use Support Services", section: "substanceUse" },
    { id: "stass", label: "Short-Term Assessment Support Services (STASS)", section: "stass" },
    { id: "t3c-treatment", label: "T3C Treatment Foster Family Care", section: "t3cTreatment" },
    { id: "mental-behavioral", label: "Mental & Behavioral Health Support Services", section: "mentalBehavioral" },
    { id: "idd-autism", label: "IDD/Autism Spectrum Disorder Support Services", section: "iddAutism" },
  ]

  const handlePackageToggle = (packageId) => {
    const currentPackages = [...credentialedPackages]
    const index = currentPackages.indexOf(packageId)
    
    if (index > -1) {
      currentPackages.splice(index, 1)
    } else {
      currentPackages.push(packageId)
    }
    
    onChange("packageCompliance.credentialedPackages", currentPackages)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <CheckCircle className="h-4 w-4 text-refuge-purple" />
          Package-Specific Compliance Requirements
        </h2>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <AlertDescription className="text-sm">
          <strong>Instructions:</strong> Select the packages this home is credentialed for. Only compliance items for selected packages will be displayed below.
        </AlertDescription>
      </Alert>

      {/* Package Selection Checkboxes */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Credentialed Packages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {packageOptions.map((pkg) => (
              <div key={pkg.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`package-${pkg.id}`}
                  checked={credentialedPackages.includes(pkg.id)}
                  onCheckedChange={() => handlePackageToggle(pkg.id)}
                />
                <Label htmlFor={`package-${pkg.id}`} className="cursor-pointer text-sm">
                  {pkg.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display compliance sections for selected packages */}
      {credentialedPackages.length > 0 ? (
        <div className="space-y-6">
          {packageOptions
            .filter((pkg) => credentialedPackages.includes(pkg.id))
            .map((pkg) => {
              const sectionData = packageData[pkg.section]
              if (!sectionData || !sectionData.items || sectionData.items.length === 0) return null

              // Create a wrapper formData object with the nested section at the top level
              const wrappedFormData = {
                ...formData,
                [`packageCompliance_${pkg.section}`]: sectionData
              }

              return (
                <ComplianceSection
                  key={pkg.id}
                  title={pkg.label}
                  section={`packageCompliance_${pkg.section}`}
                  formData={wrappedFormData}
                  onChange={(section, index, month, field, value) => {
                    // ComplianceSection calls: onChange(section, index, month, field, value)
                    // Map to nested path: packageCompliance.{pkg.section}
                    onComplianceChange(`packageCompliance.${pkg.section}`, index, month, field, value)
                  }}
                  onNotesChange={(path, value) => {
                    // Extract the field name from the path
                    const fieldName = path.split('.').pop() || path.split('_').pop()
                    onNotesChange(`packageCompliance.${pkg.section}.${fieldName}`, value)
                  }}
                  singleStatus={true}
                />
              )
            })}
        </div>
      ) : (
        <Alert>
          <AlertDescription className="text-sm">
            No packages selected. Select one or more packages above to view their compliance requirements.
          </AlertDescription>
        </Alert>
      )}

      {/* Section Notes */}
      <div className="border-t pt-2 mt-2">
        <Label htmlFor="package-compliance-notes" className="text-sm font-medium">Section Notes (Optional)</Label>
        <TextareaWithVoice
          id="package-compliance-notes"
          value={packageData.combinedNotes || ""}
          onChange={(e) => onNotesChange("packageCompliance.combinedNotes", e.target.value)}
          placeholder="Additional observations for package-specific compliance..."
          rows={2}
          className="mt-1 text-sm"
          showVoiceButton={true}
        />
      </div>
    </div>
  )
}

const ConditionalComplianceSection = ({ title, section, formData, onChange, onNotesChange, onApplicableChange }) => {
  const sectionData = formData[section]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <CheckCircle className="h-6 w-6 text-refuge-purple" />
        {title}
      </h2>

      <div className="flex items-center space-x-2 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
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
                              : "hover:bg-green-50 dark:hover:bg-green-950/20"
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
                              : "hover:bg-red-50 dark:hover:bg-red-950/20"
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

const InspectionSection = ({ formData, onChange, onAddExtinguisher, existingFormData }) => {
  const inspections = formData.inspections
  const { user } = useUser()
  const { toast } = useToast()
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [attachments, setAttachments] = useState<Record<string, any[]>>({
    fire_certificate: [],
    health_certificate: [],
    fire_extinguisher_tag: []
  })
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const fireCertRef = useRef<HTMLInputElement>(null)
  const healthCertRef = useRef<HTMLInputElement>(null)
  const extinguisherTagRefs = useRef<Record<number, HTMLInputElement>>({})

  const visitFormId = existingFormData?.visit_form_id || null

  // Fetch attachments by type
  useEffect(() => {
    if (visitFormId) {
      fetchAttachmentsByType()
    }
  }, [visitFormId])

  const fetchAttachmentsByType = async () => {
    if (!visitFormId) return
    
    setLoadingAttachments(true)
    try {
      // Include file_data for thumbnail display
      const response = await fetch(`/api/visit-forms/${visitFormId}/attachments?includeData=true`)
      const data = await response.json()

      if (data.success) {
        const allAttachments = data.attachments || []
        setAttachments({
          fire_certificate: allAttachments.filter((a: any) => a.attachment_type === "fire_certificate"),
          health_certificate: allAttachments.filter((a: any) => a.attachment_type === "health_certificate"),
          fire_extinguisher_tag: allAttachments.filter((a: any) => a.attachment_type === "fire_extinguisher_tag")
        })
      }
    } catch (error) {
      console.error("Error fetching attachments:", error)
    } finally {
      setLoadingAttachments(false)
    }
  }

  const handleFileUpload = async (file: File, attachmentType: string, description: string) => {
    if (!visitFormId || !file) return

    const key = `${attachmentType}-${Date.now()}`
    setUploading(prev => ({ ...prev, [key]: true }))

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("description", description)
      formData.append("attachmentType", attachmentType)
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

      toast({
        title: "Photo Uploaded",
        description: `${description} uploaded successfully`,
      })

      // Refresh attachments
      await fetchAttachmentsByType()
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(prev => {
        const newState = { ...prev }
        delete newState[key]
        return newState
      })
    }
  }

  const handleDeleteAttachment = async (attachmentId: string, attachmentType: string) => {
    if (!visitFormId) return
    if (!confirm("Are you sure you want to delete this photo?")) return

    try {
      const response = await fetch(`/api/visit-forms/${visitFormId}/attachments/${attachmentId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete file")
      }

      toast({
        title: "Photo Deleted",
        description: "Photo has been successfully deleted",
      })

      // Refresh attachments
      await fetchAttachmentsByType()
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const createPDFFromImages = async (images: any[], title: string) => {
    if (images.length === 0) {
      toast({
        title: "No Images",
        description: "No images available to create PDF",
        variant: "destructive",
      })
      return
    }

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const maxWidth = pageWidth - 2 * margin
      const maxHeight = pageHeight - 2 * margin - 20 // Leave space for title

      // Add title on first page
      pdf.setFontSize(16)
      pdf.text(title, margin, margin + 10)

      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        if (!image.file_data) continue

        // Add new page for each image after the first
        if (i > 0) {
          pdf.addPage()
          pdf.setFontSize(16)
          pdf.text(title, margin, margin + 10)
        }

        try {
          // Convert base64 data URL to image
          const img = new Image()
          img.src = image.file_data

          await new Promise((resolve, reject) => {
            img.onload = () => {
              // Calculate dimensions to fit page while maintaining aspect ratio
              let imgWidth = img.width
              let imgHeight = img.height
              const aspectRatio = imgWidth / imgHeight

              let finalWidth = maxWidth
              let finalHeight = maxWidth / aspectRatio

              if (finalHeight > maxHeight) {
                finalHeight = maxHeight
                finalWidth = maxHeight * aspectRatio
              }

              // Center image on page
              const x = (pageWidth - finalWidth) / 2
              const y = margin + 20 + (maxHeight - finalHeight) / 2

              pdf.addImage(image.file_data, "JPEG", x, y, finalWidth, finalHeight)

              // Add description if available
              if (image.description) {
                pdf.setFontSize(10)
                pdf.text(image.description, margin, pageHeight - margin)
              }

              resolve(null)
            }
            img.onerror = reject
          })
        } catch (error) {
          console.error(`Error adding image ${i + 1} to PDF:`, error)
          // Continue with next image
        }
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `${title.replace(/\s+/g, "_")}_${timestamp}.pdf`

      pdf.save(filename)

      toast({
        title: "PDF Created",
        description: `PDF with ${images.length} image(s) has been downloaded`,
      })
    } catch (error: any) {
      console.error("Error creating PDF:", error)
      toast({
        title: "PDF Creation Failed",
        description: error.message || "Failed to create PDF",
        variant: "destructive",
      })
    }
  }

  const handleFireCertCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, "fire_certificate", `Fire Certificate - ${inspections.fire.certificateNumber || "No cert number"}`)
    }
    if (fireCertRef.current) fireCertRef.current.value = ""
  }

  const handleHealthCertCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, "health_certificate", `Health Certificate - ${inspections.health.certificateNumber || "No cert number"}`)
    }
    if (healthCertRef.current) healthCertRef.current.value = ""
  }

  const handleExtinguisherTagCapture = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const location = inspections.fireExtinguishers[index]?.location || `Location ${index + 1}`
      handleFileUpload(file, "fire_extinguisher_tag", `Fire Extinguisher Tag - ${location}`)
    }
    const ref = extinguisherTagRefs.current[index]
    if (ref) ref.value = ""
  }

  const getExpirationBadge = (days) => {
    if (days > 60) return <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Current</Badge>
    if (days > 30) return <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">Renewal Soon</Badge>
    if (days > 0) return <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">Expiring Soon</Badge>
    return <Badge variant="destructive">EXPIRED</Badge>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
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
        <Card className="bg-muted">
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
                  <Input value={inspections.fire.daysUntilExpiration} disabled className="bg-muted" />
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
                <input
                  ref={fireCertRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFireCertCapture}
                  className="hidden"
                  id="fire-cert-camera"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fireCertRef.current?.click()}
                  disabled={!visitFormId || uploading[Object.keys(uploading)[0] || ""]}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading[Object.keys(uploading).find(k => k.includes("fire_certificate")) || ""] 
                    ? "Uploading..." 
                    : "Take Photo of Fire Certificate"}
                </Button>
                
                {/* Fire Certificate Image Previews */}
                {attachments.fire_certificate.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">Captured Photos ({attachments.fire_certificate.length})</Label>
                      {attachments.fire_certificate.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => createPDFFromImages(attachments.fire_certificate, "Fire Certificate")}
                          className="h-7 text-xs"
                        >
                          <FileDown className="h-3 w-3 mr-1" />
                          Create PDF
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {attachments.fire_certificate.map((attachment) => (
                        <div key={attachment.attachment_id} className="relative group">
                          {attachment.file_data ? (
                            <img
                              src={attachment.file_data}
                              alt={attachment.description || "Fire Certificate"}
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                if (attachment.file_data) {
                                  // Create a new window with the image data URL
                                  const newWindow = window.open()
                                  if (newWindow) {
                                    newWindow.document.write(`<img src="${attachment.file_data}" style="max-width: 100%; height: auto;" />`)
                                  } else {
                                    // Fallback: try direct open
                                    window.open(attachment.file_data, "_blank")
                                  }
                                }
                              }}
                              onError={(e) => {
                                console.error("Image load error:", e)
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="w-full h-24 bg-muted rounded border flex items-center justify-center">
                              <Image className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteAttachment(attachment.attachment_id, "fire_certificate")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
        <Card className="bg-muted">
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
                  <Input value={inspections.health.daysUntilExpiration} disabled className="bg-muted" />
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
                <input
                  ref={healthCertRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleHealthCertCapture}
                  className="hidden"
                  id="health-cert-camera"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => healthCertRef.current?.click()}
                  disabled={!visitFormId || uploading[Object.keys(uploading).find(k => k.includes("health_certificate")) || ""]}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading[Object.keys(uploading).find(k => k.includes("health_certificate")) || ""] 
                    ? "Uploading..." 
                    : "Take Photo of Health Certificate"}
                </Button>
                
                {/* Health Certificate Image Previews */}
                {attachments.health_certificate.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">Captured Photos ({attachments.health_certificate.length})</Label>
                      {attachments.health_certificate.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => createPDFFromImages(attachments.health_certificate, "Health Certificate")}
                          className="h-7 text-xs"
                        >
                          <FileDown className="h-3 w-3 mr-1" />
                          Create PDF
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {attachments.health_certificate.map((attachment) => (
                        <div key={attachment.attachment_id} className="relative group">
                          {attachment.file_data ? (
                            <img
                              src={attachment.file_data}
                              alt={attachment.description || "Health Certificate"}
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                if (attachment.file_data) {
                                  // Create a new window with the image data URL
                                  const newWindow = window.open()
                                  if (newWindow) {
                                    newWindow.document.write(`<img src="${attachment.file_data}" style="max-width: 100%; height: auto;" />`)
                                  } else {
                                    // Fallback: try direct open
                                    window.open(attachment.file_data, "_blank")
                                  }
                                }
                              }}
                              onError={(e) => {
                                console.error("Image load error:", e)
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="w-full h-24 bg-muted rounded border flex items-center justify-center">
                              <Image className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteAttachment(attachment.attachment_id, "health_certificate")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

                    <div>
                      <input
                        ref={(el) => {
                          if (el) extinguisherTagRefs.current[index] = el
                        }}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleExtinguisherTagCapture(index)}
                        className="hidden"
                        id={`ext-tag-camera-${index}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => extinguisherTagRefs.current[index]?.click()}
                        disabled={!visitFormId || uploading[Object.keys(uploading).find(k => k.includes(`extinguisher-${index}`)) || ""]}
                        className="w-full"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        {uploading[Object.keys(uploading).find(k => k.includes(`extinguisher-${index}`)) || ""] 
                          ? "Uploading..." 
                          : "Photo Tag"}
                      </Button>
                      
                      {/* Fire Extinguisher Tag Image Previews */}
                      {(() => {
                        const locationAttachments = attachments.fire_extinguisher_tag.filter((a: any) => 
                          a.description?.includes(extinguisher.location || `Location ${index + 1}`)
                        )
                        return locationAttachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">{locationAttachments.length} photo(s)</span>
                              {locationAttachments.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => createPDFFromImages(locationAttachments, `Fire Extinguisher - ${extinguisher.location || `Location ${index + 1}`}`)}
                                  className="h-6 text-xs px-2"
                                >
                                  <FileDown className="h-3 w-3 mr-1" />
                                  PDF
                                </Button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {locationAttachments.map((attachment) => (
                                <div key={attachment.attachment_id} className="relative group">
                                  {attachment.file_data ? (
                                    <img
                                      src={attachment.file_data}
                                      alt={attachment.description || "Fire Extinguisher Tag"}
                                      className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => {
                                        if (attachment.file_data) {
                                          // Create a new window with the image data URL
                                          const newWindow = window.open()
                                          if (newWindow) {
                                            newWindow.document.write(`<img src="${attachment.file_data}" style="max-width: 100%; height: auto;" />`)
                                          } else {
                                            // Fallback: try direct open
                                            window.open(attachment.file_data, "_blank")
                                          }
                                        }
                                      }}
                                      onError={(e) => {
                                        console.error("Image load error:", e)
                                        // Fallback to placeholder if image fails to load
                                        e.currentTarget.style.display = "none"
                                      }}
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                                      <Image className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-0 right-0 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteAttachment(attachment.attachment_id, "fire_extinguisher_tag")}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
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
        <TextareaWithVoice
          id="inspections-combined-notes"
          value={inspections.combinedNotes}
          onChange={(e) => onChange("inspections.combinedNotes", e.target.value)}
          placeholder="Any additional observations or context for inspections..."
          rows={4}
          className="mt-2"
          showVoiceButton={true}
        />
      </div>
    </div>
  )
}

// COMPONENT CONTINUES... (Part 2 will follow due to length)

export default EnhancedHomeVisitForm

