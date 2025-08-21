"use client"

import { useState, useEffect } from "react"
import { Calendar, Home, Users, FileText, CheckCircle, Shield, Heart, Briefcase } from "lucide-react"

const HomeVisitForm = () => {
  // Core state management
  const [formData, setFormData] = useState({
    visitInfo: {
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      quarter: "",
      visitNumber: 1,
      type: "announced",
      mode: "in-home",
      conductedBy: "",
      role: "liaison", // 'liaison' or 'case-manager'
    },
    family: {
      familyName: "",
      homeId: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      email: "",
      licenseNumber: "",
      licenseType: "Full",
      capacity: 0,
    },
    attendees: [],
    placements: [],
    homeEnvironment: {
      generalSafety: {},
      medications: {},
      bedrooms: {},
      outdoorSpace: {},
      vehicles: {},
      swimmingArea: { applicable: false },
      infantArea: { applicable: false },
    },
    observations: {
      childBehaviors: [],
      familyDynamics: "",
      homeAtmosphere: "",
      concerns: [],
    },
    childInterviews: [],
    parentInterviews: [],
    compliance: {
      documentsVerified: {},
      trainingsReviewed: {},
      nonCompliances: [],
      correctiveActions: [],
    },
    recommendations: "",
    nextSteps: [],
    signatures: {
      visitor: "",
      parent1: "",
      parent2: "",
      supervisor: "",
    },
  })

  const [currentSection, setCurrentSection] = useState(0)
  const [visitVariant, setVisitVariant] = useState(1)
  const [errors, setErrors] = useState({})

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

  // Determine visit variant based on quarter and visit number
  useEffect(() => {
    const visitNum = formData.visitInfo.visitNumber
    setVisitVariant(((visitNum - 1) % 3) + 1)
  }, [formData.visitInfo.visitNumber])

  // Form sections configuration
  const sections = [
    { title: "Visit Information", icon: Calendar },
    { title: "Family & Home", icon: Home },
    { title: "Attendees & Placements", icon: Users },
    { title: "Home Environment", icon: Shield },
    { title: "Child Interviews", icon: Heart },
    { title: "Parent Interviews", icon: Users },
    { title: "Observations", icon: FileText },
    { title: "Compliance Review", icon: CheckCircle },
    { title: "Recommendations", icon: Briefcase },
    { title: "Signatures", icon: FileText },
  ]

  // Role-based section visibility
  const getSectionsForRole = () => {
    if (formData.visitInfo.role === "liaison") {
      // Liaisons don't see service plan sections
      return sections.filter((s) => !["Service Plans", "Permanency Goals"].includes(s.title))
    }
    // Case managers see all sections plus additional ones
    return [
      ...sections.slice(0, 7),
      { title: "Service Plans", icon: FileText },
      { title: "Permanency Goals", icon: Heart },
      ...sections.slice(7),
    ]
  }

  // Variant-specific questions
  const getVariantQuestions = (variant, section) => {
    const variantConfig = {
      1: {
        // First visit of quarter - comprehensive
        childQuestions: [
          "How have things been going this month?",
          "What makes you happy? What makes you upset?",
          "Tell me about school - your favorite and least favorite parts.",
          "What activities do you enjoy doing with your foster family?",
          "Do you feel safe and comfortable in this home?",
          "Is there anything you need that you're not getting?",
          "How are visits with your biological family going?",
        ],
        parentQuestions: [
          "Describe any behavioral incidents this month.",
          "What positive changes have you observed?",
          "How are the children adjusting to routines?",
          "What activities has the family done together?",
          "Any medical, dental, or therapy appointments?",
          "How are medications working?",
          "What support do you need from the agency?",
        ],
        focusAreas: ["comprehensive", "baseline", "relationships"],
      },
      2: {
        // Second visit - behavioral/educational focus
        childQuestions: [
          "How is school going? Any challenges or successes?",
          "Tell me about your friends and social activities.",
          "What's been the best part of this month?",
          "Have you tried any new activities or hobbies?",
          "How do you handle it when you get upset?",
          "What helps you feel better when you're having a hard day?",
        ],
        parentQuestions: [
          "Describe the children's school performance and behavior.",
          "How do they interact with peers?",
          "What behavioral strategies are working well?",
          "Any changes in medication or therapy?",
          "How are you managing challenging behaviors?",
          "What recreational activities have been successful?",
        ],
        focusAreas: ["education", "behavior", "social"],
      },
      3: {
        // Third visit - health/development focus
        childQuestions: [
          "How are you feeling physically and emotionally?",
          "What new things have you learned recently?",
          "Tell me about your daily routines.",
          "What goals are you working on?",
          "How is therapy going? Is it helpful?",
          "What would you like to do more of?",
        ],
        parentQuestions: [
          "Update on medical/dental/vision appointments.",
          "Any developmental concerns or milestones?",
          "How are the children's sleeping and eating patterns?",
          "Progress on treatment goals?",
          "Life skills being taught?",
          "Planning for the next quarter?",
        ],
        focusAreas: ["health", "development", "planning"],
      },
    }

    return variantConfig[variant] || variantConfig[1]
  }

  // TAC 749 Compliance Checklist
  const complianceChecklist = {
    medications: [
      { code: "749.1463(b)(2)", description: "Medications stored in original containers" },
      { code: "749.1521(1-4)", description: "All medications under double lock" },
      { code: "749.1521(3)", description: "External use medications stored separately" },
      { code: "749.1521(5)", description: "Refrigerated medications securely stored" },
      { code: "749.1521(6)", description: "Medication storage area clean and orderly" },
    ],
    safety: [
      { code: "749.2905", description: "Fire and health inspections current" },
      { code: "749.2909", description: "Smoke detectors properly located" },
      { code: "749.2913", description: "Fire extinguishers in kitchen and each level" },
      { code: "749.2915", description: "Tools and dangerous equipment stored appropriately" },
      { code: "749.2961", description: "Weapons/firearms stored as required" },
    ],
    environment: [
      { code: "749.3021", description: "Bedroom size requirements met" },
      { code: "749.3023", description: "Bedroom adequate for rest with privacy" },
      { code: "749.3031", description: "Each child has own bed with clean linens" },
      { code: "749.3033", description: "Children have accessible storage space" },
      { code: "749.3041", description: "Indoor/outdoor areas safe and clean" },
    ],
  }

  // Input change handler
  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  // Add child interview
  const addChildInterview = () => {
    const questions = getVariantQuestions(visitVariant, "child").childQuestions
    setFormData((prev) => ({
      ...prev,
      childInterviews: [
        ...prev.childInterviews,
        {
          childName: "",
          age: "",
          responses: questions.map((q) => ({ question: q, answer: "" })),
          suicideScreening: null,
          privateInterview: false,
        },
      ],
    }))
  }

  // Render current section
  const renderSection = () => {
    const activeSections = getSectionsForRole()
    const section = activeSections[currentSection]

    switch (section.title) {
      case "Visit Information":
        return <VisitInfoSection formData={formData} onChange={handleInputChange} />
      case "Family & Home":
        return <FamilyHomeSection formData={formData} onChange={handleInputChange} />
      case "Attendees & Placements":
        return <AttendeesSection formData={formData} onChange={handleInputChange} />
      case "Home Environment":
        return (
          <HomeEnvironmentSection formData={formData} onChange={handleInputChange} checklist={complianceChecklist} />
        )
      case "Child Interviews":
        return (
          <ChildInterviewSection
            formData={formData}
            onChange={handleInputChange}
            variant={visitVariant}
            questions={getVariantQuestions(visitVariant).childQuestions}
          />
        )
      case "Parent Interviews":
        return (
          <ParentInterviewSection
            formData={formData}
            onChange={handleInputChange}
            variant={visitVariant}
            questions={getVariantQuestions(visitVariant).parentQuestions}
          />
        )
      case "Service Plans":
        return <ServicePlanSection formData={formData} onChange={handleInputChange} />
      case "Permanency Goals":
        return <PermanencySection formData={formData} onChange={handleInputChange} />
      case "Observations":
        return <ObservationsSection formData={formData} onChange={handleInputChange} />
      case "Compliance Review":
        return <ComplianceSection formData={formData} onChange={handleInputChange} />
      case "Recommendations":
        return <RecommendationsSection formData={formData} onChange={handleInputChange} />
      case "Signatures":
        return <SignatureSection formData={formData} onChange={handleInputChange} />
      default:
        return null
    }
  }

  const activeSections = getSectionsForRole()

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Foster Home Visit Form</h1>
              <p className="text-gray-600 mt-2">
                {formData.visitInfo.quarter} - Visit {formData.visitInfo.visitNumber}
                (Variant {visitVariant}: {getVariantQuestions(visitVariant).focusAreas.join(", ")})
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Role: {formData.visitInfo.role === "liaison" ? "Home Visit Liaison" : "Case Manager"}
              </p>
              <p className="text-sm text-gray-500">{formData.visitInfo.date}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            {activeSections.map((section, idx) => (
              <div
                key={idx}
                className={`flex items-center cursor-pointer ${idx === currentSection ? "text-blue-600" : "text-gray-400"}`}
                onClick={() => setCurrentSection(idx)}
              >
                <section.icon className="w-5 h-5" />
                <span className="ml-2 text-sm hidden md:inline">{section.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentSection + 1) / activeSections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">{renderSection()}</div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentSection(Math.min(activeSections.length - 1, currentSection + 1))}
            disabled={currentSection === activeSections.length - 1}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {currentSection === activeSections.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Section Components
const VisitInfoSection = ({ formData, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold mb-4">Visit Information</h2>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={formData.visitInfo.date}
          onChange={(e) => onChange("visitInfo", "date", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
        <input
          type="time"
          value={formData.visitInfo.time}
          onChange={(e) => onChange("visitInfo", "time", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
        <select
          value={formData.visitInfo.type}
          onChange={(e) => onChange("visitInfo", "type", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="announced">Announced</option>
          <option value="unannounced">Unannounced</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visit Mode</label>
        <select
          value={formData.visitInfo.mode}
          onChange={(e) => onChange("visitInfo", "mode", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="in-home">In-Home</option>
          <option value="virtual">Virtual</option>
          <option value="phone">Phone</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Conducted By</label>
        <input
          type="text"
          value={formData.visitInfo.conductedBy}
          onChange={(e) => onChange("visitInfo", "conductedBy", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
        <select
          value={formData.visitInfo.role}
          onChange={(e) => onChange("visitInfo", "role", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="liaison">Home Visit Liaison</option>
          <option value="case-manager">Case Manager</option>
        </select>
      </div>
    </div>
  </div>
)

const FamilyHomeSection = ({ formData, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold mb-4">Family & Home Information</h2>

    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Family Name</label>
        <input
          type="text"
          value={formData.family.familyName}
          onChange={(e) => onChange("family", "familyName", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          value={formData.family.address}
          onChange={(e) => onChange("family", "address", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input
          type="text"
          value={formData.family.city}
          onChange={(e) => onChange("family", "city", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
        <input
          type="text"
          value={formData.family.state}
          onChange={(e) => onChange("family", "state", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
        <input
          type="text"
          value={formData.family.zip}
          onChange={(e) => onChange("family", "zip", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="tel"
          value={formData.family.phone}
          onChange={(e) => onChange("family", "phone", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={formData.family.email}
          onChange={(e) => onChange("family", "email", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>
    </div>
  </div>
)

const AttendeesSection = ({ formData, onChange }) => {
  const [attendees, setAttendees] = useState([])
  const [newAttendee, setNewAttendee] = useState({ name: "", role: "", present: true })

  const addAttendee = () => {
    if (newAttendee.name) {
      setAttendees([...attendees, newAttendee])
      setNewAttendee({ name: "", role: "", present: true })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Visit Attendees</h2>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Add Attendee</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Name"
            value={newAttendee.name}
            onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
            className="flex-1 border rounded px-3 py-2"
          />
          <select
            value={newAttendee.role}
            onChange={(e) => setNewAttendee({ ...newAttendee, role: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">Select Role</option>
            <option value="foster-parent">Foster Parent</option>
            <option value="foster-child">Foster Child</option>
            <option value="bio-child">Biological Child</option>
            <option value="relative">Relative</option>
            <option value="visitor">Visitor</option>
          </select>
          <button onClick={addAttendee} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {attendees.map((attendee, idx) => (
          <div key={idx} className="flex items-center justify-between border rounded p-2">
            <span>
              {attendee.name} - {attendee.role}
            </span>
            <input
              type="checkbox"
              checked={attendee.present}
              onChange={(e) => {
                const updated = [...attendees]
                updated[idx].present = e.target.checked
                setAttendees(updated)
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
