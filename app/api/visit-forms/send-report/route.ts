import { type NextRequest, NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"
import { requireClerkAuth } from "@/lib/clerk-auth-helper"
import { query } from "@/lib/db"
import { getUserByClerkId } from "@/lib/user-management"
import { format } from "date-fns"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user - handle case where headers might not be set
    let currentClerkUserId: string
    let currentUserEmail: string | null = null
    
    try {
      const auth = requireClerkAuth(request)
      currentClerkUserId = auth.clerkUserId
      currentUserEmail = auth.email
    } catch (authError) {
      console.error("❌ [API] Auth error in send-report:", authError)
      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
          details: authError instanceof Error ? authError.message : "Missing authentication headers",
        },
        { status: 401 },
      )
    }

    const { appointmentId, formData, recipientType } = await request.json()

    if (!appointmentId || !formData) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: appointmentId, formData",
        },
        { status: 400 },
      )
    }

    // recipientType: "me" | "case-manager" | undefined (defaults to "case-manager")
    const sendTo = recipientType || "case-manager"

    // Debug: Log the formData structure to see what we're receiving
    console.log("📋 [API] FormData keys:", Object.keys(formData))
    console.log("📋 [API] ComplianceReview keys:", formData.complianceReview ? Object.keys(formData.complianceReview) : "No complianceReview")
    console.log("📋 [API] ComplianceReview sections:", formData.complianceReview ? Object.keys(formData.complianceReview).filter(k => formData.complianceReview[k] !== null) : [])
    console.log("📋 [API] Signatures:", formData.signatures)
    console.log("📋 [API] Observations:", formData.observations)
    console.log("📋 [API] FamilyInfo:", formData.familyInfo)

    // Get current user's email for CC (use from auth if available, otherwise lookup)
    let ccEmail = currentUserEmail
    if (!ccEmail) {
      const currentUser = await getUserByClerkId(currentClerkUserId)
      if (!currentUser) {
        return NextResponse.json({ error: "Current user not found" }, { status: 404 })
      }
      ccEmail = currentUser.email
    }

    // Get appointment details to find case manager email
    const appointmentResult = await query<{
      home_xref: string
      assigned_to_name: string
      CaseManagerEmail: string
      CaseManager: string
      sync_home_name: string
    }>(
      `
      SELECT 
        a.home_xref,
        a.assigned_to_name,
        h.CaseManagerEmail,
        h.CaseManager,
        h.HomeName as sync_home_name
      FROM appointments a
      LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
      WHERE a.appointment_id = @param0
    `,
      [appointmentId],
    )

    if (appointmentResult.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const appointment = appointmentResult[0]
    const caseManagerEmail = appointment.CaseManagerEmail
    const familyName = appointment.sync_home_name || formData.familyInfo?.fosterHome?.familyName || "Foster Family"

    // Only require case manager email if sending to case manager
    if (sendTo === "case-manager" && !caseManagerEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Case manager email not found for this appointment",
        },
        { status: 400 },
      )
    }

    // Validate SendGrid configuration
    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "SendGrid API key not configured. Please contact system administrator.",
        },
        { status: 500 },
      )
    }

    // Set SendGrid API key
    sgMail.setApiKey(apiKey)

    // Generate report content
    const visitDate = formData.visitInfo?.date
      ? format(new Date(formData.visitInfo.date), "MMMM d, yyyy")
      : "N/A"
    const visitTime = formData.visitInfo?.time || "N/A"

    const subject = `Foster Home Visit Report - ${familyName} - ${visitDate}`

    const htmlContent = generateCompleteReportHTML(formData, appointmentId, visitDate, visitTime, familyName)
    const textContent = generateCompleteReportText(formData, appointmentId, visitDate, visitTime, familyName)

    // Determine recipient based on recipientType
    let toEmail: string
    let ccEmailList: string | null = null
    let recipientDescription: string

    if (sendTo === "me") {
      // Send to current user only, CC case manager (if available)
      toEmail = ccEmail
      if (caseManagerEmail) {
        ccEmailList = caseManagerEmail
      }
      recipientDescription = "you"
    } else {
      // Send to case manager, CC current user (default behavior)
      toEmail = caseManagerEmail
      ccEmailList = ccEmail
      recipientDescription = "case manager"
    }

    // Prepare email with CC
    const msg: any = {
      to: toEmail,
      from: {
        email: fromEmail,
        name: "Foster Home Visit System",
      },
      subject: subject,
      text: textContent,
      html: htmlContent,
    }

    // Add CC if specified
    if (ccEmailList) {
      msg.cc = ccEmailList
    }

    // Send the email
    const response = await sgMail.send(msg)

    return NextResponse.json({
      success: true,
      messageId: response[0].headers["x-message-id"],
      message: `Report sent successfully to ${recipientDescription}`,
      recipient: toEmail,
      cc: ccEmailList,
    })
  } catch (error: any) {
    console.error("❌ [API] Error sending report:", error)

    // Handle SendGrid specific errors
    if (error.response) {
      const { message, code } = error.response.body.errors?.[0] || {}
      return NextResponse.json(
        {
          success: false,
          error: `SendGrid Error: ${message || error.message}`,
          code: code,
        },
        { status: error.code || 500 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send report: " + (error.message || "Unknown error"),
      },
      { status: 500 },
    )
  }
}

function generateCompleteReportHTML(
  formData: any,
  appointmentId: string,
  visitDate: string,
  visitTime: string,
  familyName: string,
): string {
  // Helper to format signature field with image
  const formatSignatureField = (label: string, name: string, signature: string, date: string) => {
    if (!name && !signature) return ""
    
    const nameDisplay = name || "Not provided"
    const dateDisplay = date || "Not provided"
    const signatureImg = signature && typeof signature === 'string' && (signature.startsWith('data:image') || signature.startsWith('data:image/png') || signature.length > 100)
      ? `<div style="margin-top: 8px;"><img src="${signature}" alt="${label} signature" style="max-width: 300px; border: 1px solid #d1d5db; border-radius: 4px;" /></div>`
      : signature && typeof signature === 'string'
        ? `<div style="margin-top: 8px; color: #6b7280; font-size: 12px;">Signature data present</div>`
        : ""
    
    return `
      <div style="margin-bottom: 15px;">
        <p style="margin: 3px 0;"><strong>${label}:</strong> ${nameDisplay}</p>
        ${signatureImg}
        <p style="margin: 3px 0; font-size: 12px; color: #6b7280;">Date: ${dateDisplay}</p>
      </div>
    `
  }

  // Helper to format visit summary object
  const formatVisitSummaryObject = (summary: any) => {
    if (typeof summary === 'string') return `<p style="white-space: pre-wrap;">${summary}</p>`
    if (!summary || typeof summary !== 'object') return ""
    
    let html = ""
    if (summary.overallStatus) {
      html += `<p style="margin: 5px 0;"><strong>Overall Status:</strong> ${summary.overallStatus}</p>`
    }
    if (summary.keyStrengths && Array.isArray(summary.keyStrengths)) {
      const strengths = summary.keyStrengths.filter((s: string) => s && s.trim())
      if (strengths.length > 0) {
        html += `<p style="margin: 5px 0;"><strong>Key Strengths:</strong></p><ul style="margin: 5px 0; padding-left: 20px;">${strengths.map((s: string) => `<li>${s}</li>`).join("")}</ul>`
      }
    }
    if (summary.priorityAreas && Array.isArray(summary.priorityAreas)) {
      const areas = summary.priorityAreas.filter((a: any) => a && (a.priority || a.description))
      if (areas.length > 0) {
        html += `<p style="margin: 5px 0;"><strong>Priority Areas:</strong></p><ul style="margin: 5px 0; padding-left: 20px;">${areas.map((a: any) => `<li>${a.priority || ""}: ${a.description || ""}</li>`).join("")}</ul>`
      }
    }
    if (summary.resourcesProvided && typeof summary.resourcesProvided === 'object') {
      const resources = Object.entries(summary.resourcesProvided).filter(([k, v]: [string, any]) => v && String(v).trim())
      if (resources.length > 0) {
        html += `<p style="margin: 5px 0;"><strong>Resources Provided:</strong></p><ul style="margin: 5px 0; padding-left: 20px;">${resources.map(([k, v]: [string, any]) => `<li>${k}: ${v}</li>`).join("")}</ul>`
      }
    }
    if (summary.nextVisit && typeof summary.nextVisit === 'object') {
      const nextVisit = summary.nextVisit
      if (nextVisit.date || nextVisit.time || nextVisit.location) {
        html += `<p style="margin: 5px 0;"><strong>Next Visit:</strong> ${nextVisit.visitType || ""} ${nextVisit.date || ""} ${nextVisit.time || ""} ${nextVisit.location || ""}</p>`
      }
    }
    return html || `<p style="white-space: pre-wrap;">${JSON.stringify(summary, null, 2)}</p>`
  }
  // Helper to format monthly compliance status
  const formatMonthlyStatus = (monthData: any) => {
    if (!monthData) return ""
    if (monthData.na) return '<span style="color: #6b7280;">N/A</span>'
    if (monthData.compliant) return '<span style="color: #16a34a; font-weight: bold;">✓ Compliant</span>'
    return '<span style="color: #9ca3af; font-style: italic;">Not answered</span>'
  }

  // Helper to format compliance sections - show ALL items with monthly tracking
  const formatComplianceSection = (sectionData: any, sectionName: string, showMonthly = true) => {
    if (!sectionData) return ""
    
    // Handle case where sectionData might be an object with items, or just items array
    const items = sectionData.items || (Array.isArray(sectionData) ? sectionData : [])
    
    // Show ALL items, regardless of whether they have status or not
    if (!items || items.length === 0) {
      // Still show section if there are combined notes
      if (sectionData.combinedNotes) {
        return `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">${sectionName}</h3>
            <p style="font-style: italic; white-space: pre-wrap;">${sectionData.combinedNotes}</p>
          </div>
        `
      }
      return ""
    }

    // Check if this section uses monthly tracking (has month1, month2, month3)
    const hasMonthlyTracking = items.some((item: any) => item.month1 || item.month2 || item.month3)
    
    // Show ALL items - answered and unanswered
    const itemsList = items
      .map((item: any) => {
        let statusText = ""
        
        if (hasMonthlyTracking && showMonthly) {
          // Monthly tracking format
          const m1 = formatMonthlyStatus(item.month1)
          const m2 = formatMonthlyStatus(item.month2)
          const m3 = formatMonthlyStatus(item.month3)
          statusText = ` - Month 1: ${m1}, Month 2: ${m2}, Month 3: ${m3}`
        } else if (item.status) {
          // Old single status format
          const statusBadge = {
            compliant: '<span style="color: #16a34a; font-weight: bold;">✓ Compliant</span>',
            "non-compliant": '<span style="color: #dc2626; font-weight: bold;">✗ Non-Compliant</span>',
            na: '<span style="color: #6b7280;">N/A</span>',
          }[item.status] || `<span style="color: #6b7280;">${item.status}</span>`
          statusText = ` - ${statusBadge}`
        } else if (item.month1) {
          // Single status mode (singleStatus sections)
          statusText = ` - ${formatMonthlyStatus(item.month1)}`
        } else {
          statusText = ' - <span style="color: #9ca3af; font-style: italic;">Not answered</span>'
        }
        
        // Collect notes from all months if monthly tracking
        let notes = ""
        if (hasMonthlyTracking && showMonthly) {
          const allNotes = [
            item.month1?.notes,
            item.month2?.notes,
            item.month3?.notes,
          ].filter(n => n && n.trim())
          if (allNotes.length > 0) {
            notes = ` - <em>Notes: ${allNotes.join("; ")}</em>`
          }
        } else {
          notes = item.notes ? ` - <em>${item.notes}</em>` : ""
        }
        
        const requirement = item.requirement || ""
        const code = item.code || ""
        return `<li>${code}${requirement && code ? ": " : ""}${requirement}${statusText}${notes}</li>`
      })
      .join("")

    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">${sectionName}</h3>
        ${itemsList ? `<ul style="margin: 0; padding-left: 20px;">${itemsList}</ul>` : ""}
        ${sectionData.combinedNotes ? `<p style="margin-top: 10px; font-style: italic; white-space: pre-wrap;">${sectionData.combinedNotes}</p>` : ""}
      </div>
    `
  }

  // Helper to format special sections (inspections, trauma-informed care, etc.)
  const formatInspectionsSection = (inspections: any) => {
    if (!inspections) return ""
    
    let content = ""
    
    if (inspections.fire) {
      const fire = inspections.fire
      if (fire.currentInspectionDate || fire.expirationDate || fire.actionNeeded !== "none") {
        content += `
          <div style="margin-bottom: 15px;">
            <h4 style="color: #374151; font-size: 14px; margin-bottom: 8px;">Fire Inspection</h4>
            <p style="margin: 3px 0;"><strong>Current Inspection Date:</strong> ${fire.currentInspectionDate || "N/A"}</p>
            <p style="margin: 3px 0;"><strong>Expiration Date:</strong> ${fire.expirationDate || "N/A"}</p>
            <p style="margin: 3px 0;"><strong>Inspector Agency:</strong> ${fire.inspectorAgency || "N/A"}</p>
            <p style="margin: 3px 0;"><strong>Certificate Number:</strong> ${fire.certificateNumber || "N/A"}</p>
            <p style="margin: 3px 0;"><strong>Copy on File:</strong> ${fire.copyOnFile ? "Yes" : "No"}</p>
            <p style="margin: 3px 0;"><strong>Action Needed:</strong> ${fire.actionNeeded || "none"}</p>
            ${fire.notes ? `<p style="margin: 3px 0;"><em>${fire.notes}</em></p>` : ""}
          </div>
        `
      }
    }
    
    if (inspections.health) {
      const health = inspections.health
      if (health.currentInspectionDate || health.expirationDate || health.actionNeeded !== "none") {
        content += `
          <div style="margin-bottom: 15px;">
            <h4 style="color: #374151; font-size: 14px; margin-bottom: 8px;">Health Inspection</h4>
            <p style="margin: 3px 0;"><strong>Current Inspection Date:</strong> ${health.currentInspectionDate || "N/A"}</p>
            <p style="margin: 3px 0;"><strong>Expiration Date:</strong> ${health.expirationDate || "N/A"}</p>
            <p style="margin: 3px 0;"><strong>Inspector Agency:</strong> ${health.inspectorAgency || "N/A"}</p>
            <p style="margin: 3px 0;"><strong>Certificate Number:</strong> ${health.certificateNumber || "N/A"}</p>
            <p style="margin: 3px 0;"><strong>Copy on File:</strong> ${health.copyOnFile ? "Yes" : "No"}</p>
            <p style="margin: 3px 0;"><strong>Action Needed:</strong> ${health.actionNeeded || "none"}</p>
            ${health.notes ? `<p style="margin: 3px 0;"><em>${health.notes}</em></p>` : ""}
          </div>
        `
      }
    }
    
    if (inspections.fireExtinguishers && inspections.fireExtinguishers.length > 0) {
      const extinguishers = inspections.fireExtinguishers.filter((fe: any) => fe.lastInspection || fe.nextDue)
      if (extinguishers.length > 0) {
        content += `
          <div style="margin-bottom: 15px;">
            <h4 style="color: #374151; font-size: 14px; margin-bottom: 8px;">Fire Extinguishers</h4>
            ${extinguishers.map((fe: any) => `
              <p style="margin: 3px 0;"><strong>${fe.location}:</strong> Last Inspection: ${fe.lastInspection || "N/A"}, Next Due: ${fe.nextDue || "N/A"}, Tag Present: ${fe.tagPresent ? "Yes" : "No"}, Gauge Green: ${fe.gaugeGreen ? "Yes" : "No"}</p>
            `).join("")}
          </div>
        `
      }
    }
    
    if (inspections.combinedNotes) {
      content += `<p style="margin-top: 10px; font-style: italic;">${inspections.combinedNotes}</p>`
    }
    
    return content ? `<div style="margin-bottom: 20px;"><h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Inspection Documentation</h3>${content}</div>` : ""
  }

  // Helper to format trauma-informed care section - show ALL items
  const formatTraumaInformedCare = (traumaCare: any) => {
    if (!traumaCare || !traumaCare.items || traumaCare.items.length === 0) {
      if (traumaCare.combinedNotes) {
        return `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Trauma-Informed Care & Training</h3>
            <p style="font-style: italic; white-space: pre-wrap;">${traumaCare.combinedNotes}</p>
          </div>
        `
      }
      return ""
    }
    
    // Show ALL items, not just those with status
    const items = traumaCare.items
      .map((item: any) => {
        const statusBadge = item.status ? {
          compliant: '<span style="color: #16a34a; font-weight: bold;">✓ Compliant</span>',
          "non-compliant": '<span style="color: #dc2626; font-weight: bold;">✗ Non-Compliant</span>',
          na: '<span style="color: #6b7280;">N/A</span>',
        }[item.status] || `<span style="color: #6b7280;">${item.status}</span>` : '<span style="color: #9ca3af; font-style: italic;">Not answered</span>'
        const notes = item.notes ? ` - <em>${item.notes}</em>` : ""
        return `<li>${item.code || ""}: ${item.requirement || ""} - ${statusBadge}${notes}</li>`
      })
      .join("")
    
    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Trauma-Informed Care & Training</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${items}
        </ul>
        ${traumaCare.combinedNotes ? `<p style="margin-top: 10px; font-style: italic; white-space: pre-wrap;">${traumaCare.combinedNotes}</p>` : ""}
      </div>
    `
  }

  // Helper to format package-specific compliance section
  const formatPackageComplianceSection = (packageCompliance: any) => {
    if (!packageCompliance) return ""
    
    const credentialedPackages = packageCompliance.credentialedPackages || []
    if (credentialedPackages.length === 0) return ""
    
    const packageNames: Record<string, string> = {
      "substance-use": "Substance Use Treatment",
      "stass": "STASS (Sexual Trauma and Abuse Support Services)",
      "t3c-treatment": "T3C Treatment",
      "mental-behavioral": "Mental/Behavioral Health",
      "idd-autism": "IDD/Autism",
    }
    
    let content = ""
    
    // Format each selected package
    credentialedPackages.forEach((pkgId: string) => {
      const pkgName = packageNames[pkgId] || pkgId
      const sectionData = packageCompliance[pkgId]
      
      if (sectionData && sectionData.items && sectionData.items.length > 0) {
        content += formatComplianceSection(sectionData, pkgName, true)
      }
    })
    
    if (packageCompliance.combinedNotes) {
      content += `<p style="margin-top: 10px; font-style: italic; white-space: pre-wrap;">${packageCompliance.combinedNotes}</p>`
    }
    
    return content ? `<div style="margin-bottom: 20px;"><h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">14. Package-Specific Compliance</h3>${content}</div>` : ""
  }

  // Helper to format quality enhancement section
  const formatQualityEnhancement = (quality: any) => {
    if (!quality) return ""
    
    let content = ""
    
    if (quality.activities && quality.activities.length > 0) {
      content += `<p style="margin: 5px 0;"><strong>Activities:</strong> ${quality.activities.join(", ")}</p>`
    }
    
    if (quality.notes) {
      content += `<p style="margin: 5px 0; white-space: pre-wrap;">${quality.notes}</p>`
    }
    
    return content ? `<div style="margin-bottom: 20px;"><h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Quality Enhancement</h3><div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">${content}</div></div>` : ""
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #5E3989; padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
        <h1 style="color: #5E3989; margin: 0; font-size: 24px; font-weight: bold;">FOSTER HOME VISIT REPORT</h1>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; text-align: left;">
          <div>
            <p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p style="margin: 5px 0;"><strong>Visit Date:</strong> ${visitDate}</p>
            <p style="margin: 5px 0;"><strong>Visit Time:</strong> ${visitTime}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Quarter:</strong> ${formData.visitInfo?.quarter || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Visit Number:</strong> ${formData.visitInfo?.visitNumberThisQuarter || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Visit Type:</strong> ${formData.visitInfo?.visitType || "N/A"}</p>
          </div>
        </div>
      </div>

      <!-- Family Information -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Family & Home Information</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="margin: 5px 0;"><strong>Family Name:</strong> ${familyName}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${formData.familyInfo?.fosterHome?.address || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>City:</strong> ${formData.familyInfo?.fosterHome?.city || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>State:</strong> ${formData.familyInfo?.fosterHome?.state || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>ZIP:</strong> ${formData.familyInfo?.fosterHome?.zip || "N/A"}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${formData.familyInfo?.fosterHome?.phone || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${formData.familyInfo?.fosterHome?.email || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>License Type:</strong> ${formData.familyInfo?.fosterHome?.licenseType || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>License Number:</strong> ${formData.familyInfo?.fosterHome?.licenseNumber || "N/A"}</p>
          </div>
        </div>
      </div>

      <!-- Visit Information -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Visit Information</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="margin: 5px 0;"><strong>Conducted By:</strong> ${formData.visitInfo?.conductedBy || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Staff Title:</strong> ${formData.visitInfo?.staffTitle || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>License Number:</strong> ${formData.visitInfo?.licenseNumber || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Supervisor:</strong> ${formData.visitInfo?.supervisor || "N/A"}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Visit Type:</strong> ${formData.visitInfo?.visitType || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Mode:</strong> ${formData.visitInfo?.mode || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Agency:</strong> ${formData.visitInfo?.agency || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Region:</strong> ${formData.visitInfo?.region || "N/A"}</p>
          </div>
        </div>
      </div>

      <!-- Household Information -->
      ${formData.familyInfo?.household ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Household Members</h2>
        ${formData.familyInfo.household.providers && formData.familyInfo.household.providers.length > 0 ? `
          <div style="margin-bottom: 15px;">
            <h4 style="font-size: 14px; margin-bottom: 8px;">Foster Parents/Providers:</h4>
            ${formData.familyInfo.household.providers.map((p: any) => `<p style="margin: 3px 0;">${p.name}${p.age ? ` (Age: ${p.age})` : ""}${p.relationship ? ` - ${p.relationship}` : ""}</p>`).join("")}
          </div>
        ` : ""}
        ${formData.familyInfo.household.biologicalChildren && formData.familyInfo.household.biologicalChildren.length > 0 ? `
          <div style="margin-bottom: 15px;">
            <h4 style="font-size: 14px; margin-bottom: 8px;">Biological Children:</h4>
            ${formData.familyInfo.household.biologicalChildren.map((c: any) => `<p style="margin: 3px 0;">${c.name}${c.age ? ` (Age: ${c.age})` : ""}</p>`).join("")}
          </div>
        ` : ""}
        ${formData.familyInfo.household.otherMembers && formData.familyInfo.household.otherMembers.length > 0 ? `
          <div style="margin-bottom: 15px;">
            <h4 style="font-size: 14px; margin-bottom: 8px;">Other Household Members:</h4>
            ${formData.familyInfo.household.otherMembers.map((m: any) => `<p style="margin: 3px 0;">${m.name}${m.age ? ` (Age: ${m.age})` : ""}${m.relationship ? ` - ${m.relationship}` : ""}</p>`).join("")}
          </div>
        ` : ""}
      </div>
      ` : ""}

      <!-- Attendance -->
      ${formData.attendees?.attendance ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Attendance</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          ${Object.entries(formData.attendees.attendance)
            .filter(([_, present]: [string, any]) => present === true)
            .map(([name, _]: [string, any]) => `<p style="margin: 3px 0;">✓ ${name}</p>`)
            .join("")}
          ${Object.entries(formData.attendees.attendance).filter(([_, present]: [string, any]) => present === true).length === 0 
            ? '<p style="margin: 3px 0; font-style: italic; color: #6b7280;">No attendance recorded</p>' 
            : ""}
        </div>
      </div>
      ` : ""}

      <!-- Home Condition -->
      ${formData.homeEnvironment?.homeCondition ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Home Condition</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          <p style="white-space: pre-wrap;">${formData.homeEnvironment.homeCondition}</p>
        </div>
      </div>
      ` : ""}

      <!-- Compliance Review -->
      ${formData.complianceReview && Object.keys(formData.complianceReview).length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Compliance Review</h2>
        ${formData.complianceReview.medication ? formatComplianceSection(formData.complianceReview.medication, "1. Medication") : ""}
        ${formData.complianceReview.inspections ? formatInspectionsSection(formData.complianceReview.inspections) : ""}
        ${formData.complianceReview.healthSafety ? formatComplianceSection(formData.complianceReview.healthSafety, "2. Health & Safety") : ""}
        ${formData.complianceReview.childrensRights ? formatComplianceSection(formData.complianceReview.childrensRights, "3. Children's Rights & Well-Being") : ""}
        ${formData.complianceReview.bedrooms ? formatComplianceSection(formData.complianceReview.bedrooms, "4. Bedrooms and Belongings") : ""}
        ${formData.complianceReview.education ? formatComplianceSection(formData.complianceReview.education, "5. Education & Life Skills") : ""}
        ${formData.complianceReview.indoorSpace ? formatComplianceSection(formData.complianceReview.indoorSpace, "6. Indoor Space") : ""}
        ${formData.complianceReview.documentation ? formatComplianceSection(formData.complianceReview.documentation, "7. Documentation") : ""}
        ${formData.complianceReview.traumaInformedCare ? formatTraumaInformedCare(formData.complianceReview.traumaInformedCare) : ""}
        ${formData.complianceReview.outdoorSpace ? formatComplianceSection(formData.complianceReview.outdoorSpace, "8. Outdoor Space", false) : ""}
        ${formData.complianceReview.vehicles ? formatComplianceSection(formData.complianceReview.vehicles, "9. Vehicles", false) : ""}
        ${formData.complianceReview.swimming ? formatComplianceSection(formData.complianceReview.swimming, "10. Swimming Areas", false) : ""}
        ${formData.complianceReview.infants ? formatComplianceSection(formData.complianceReview.infants, "11. Infants", false) : ""}
        ${formData.complianceReview.packageCompliance ? formatPackageComplianceSection(formData.complianceReview.packageCompliance) : ""}
        ${formData.complianceReview.qualityEnhancement ? formatQualityEnhancement(formData.complianceReview.qualityEnhancement) : ""}
      </div>
      ` : formData.medication || formData.healthSafety || formData.childrensRights ? `
      <!-- Compliance Review (from formData root) -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Compliance Review</h2>
        ${formData.medication ? formatComplianceSection(formData.medication, "1. Medication") : ""}
        ${formData.inspections ? formatInspectionsSection(formData.inspections) : ""}
        ${formData.healthSafety ? formatComplianceSection(formData.healthSafety, "2. Health & Safety") : ""}
        ${formData.childrensRights ? formatComplianceSection(formData.childrensRights, "3. Children's Rights & Well-Being") : ""}
        ${formData.bedrooms ? formatComplianceSection(formData.bedrooms, "4. Bedrooms and Belongings") : ""}
        ${formData.education ? formatComplianceSection(formData.education, "5. Education & Life Skills") : ""}
        ${formData.indoorSpace ? formatComplianceSection(formData.indoorSpace, "6. Indoor Space") : ""}
        ${formData.documentation ? formatComplianceSection(formData.documentation, "7. Documentation") : ""}
        ${formData.traumaInformedCare ? formatTraumaInformedCare(formData.traumaInformedCare) : ""}
        ${formData.outdoorSpaceCompliance || formData.outdoorSpace ? formatComplianceSection(formData.outdoorSpaceCompliance || formData.outdoorSpace, "8. Outdoor Space", false) : ""}
        ${formData.vehicles ? formatComplianceSection(formData.vehicles, "9. Vehicles", false) : ""}
        ${formData.swimming ? formatComplianceSection(formData.swimming, "10. Swimming Areas", false) : ""}
        ${formData.infants ? formatComplianceSection(formData.infants, "11. Infants", false) : ""}
        ${formData.packageCompliance ? formatPackageComplianceSection(formData.packageCompliance) : ""}
        ${formData.qualityEnhancement ? formatQualityEnhancement(formData.qualityEnhancement) : ""}
      </div>
      ` : ""}

      <!-- Child Interviews -->
      ${formData.childInterviews?.placements && formData.childInterviews.placements.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Child Interviews</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          ${formData.childInterviews.placements.map((placement: any) => `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 3px 0;"><strong>Child:</strong> ${placement.childName || "N/A"}</p>
              ${placement.interviewDate ? `<p style="margin: 3px 0;"><strong>Interview Date:</strong> ${placement.interviewDate}</p>` : ""}
              ${placement.interviewNotes ? `<p style="margin: 3px 0; white-space: pre-wrap;">${placement.interviewNotes}</p>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
      ` : ""}

      <!-- Parent Interviews -->
      ${formData.parentInterviews?.fosterParentInterview ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Foster Parent Interview</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          <p style="white-space: pre-wrap;">${typeof formData.parentInterviews.fosterParentInterview === 'string' ? formData.parentInterviews.fosterParentInterview : JSON.stringify(formData.parentInterviews.fosterParentInterview, null, 2)}</p>
        </div>
      </div>
      ` : ""}

      <!-- Follow-up Items -->
      ${formData.observations?.followUpItems && formData.observations.followUpItems.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Follow-up Items</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px;">
            ${formData.observations.followUpItems.map((item: any) => `<li style="margin: 5px 0;">${typeof item === 'string' ? item : item.description || item}</li>`).join("")}
          </ul>
        </div>
      </div>
      ` : ""}

      <!-- Corrective Actions -->
      ${formData.observations?.correctiveActions && formData.observations.correctiveActions.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Corrective Actions Required</h2>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <ul style="margin: 0; padding-left: 20px;">
            ${formData.observations.correctiveActions.map((action: any) => `<li style="margin: 5px 0;">${typeof action === 'string' ? action : action.description || action}</li>`).join("")}
          </ul>
        </div>
      </div>
      ` : ""}

      <!-- Visit Summary -->
      ${formData.recommendations?.visitSummary ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Visit Summary</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          ${typeof formData.recommendations.visitSummary === 'string' 
            ? `<p style="white-space: pre-wrap;">${formData.recommendations.visitSummary}</p>`
            : typeof formData.recommendations.visitSummary === 'object'
              ? `<div>${formatVisitSummaryObject(formData.recommendations.visitSummary)}</div>`
              : `<p>${String(formData.recommendations.visitSummary)}</p>`
          }
        </div>
      </div>
      ` : ""}

      <!-- Observations -->
      ${formData.observations?.observations ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">General Observations</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          <p style="white-space: pre-wrap;">${typeof formData.observations.observations === 'string' ? formData.observations.observations : JSON.stringify(formData.observations.observations, null, 2)}</p>
        </div>
      </div>
      ` : ""}

      <!-- Signatures -->
      ${formData.signatures ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Signatures</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${(() => {
            let signatureHtml = ""
            
            // Foster parent signatures (from household.providers)
            if (formData.familyInfo?.household?.providers) {
              formData.familyInfo.household.providers.forEach((provider: any, index: number) => {
                const sigKey = `parent${index + 1}` as keyof typeof formData.signatures
                const sigData = formData.signatures[sigKey] || {}
                signatureHtml += formatSignatureField(
                  provider.name || `Foster Parent ${index + 1}`,
                  sigData.name || provider.name || "",
                  sigData.signature || "",
                  sigData.date || ""
                )
              })
            } else {
              // Fallback to old format
              signatureHtml += formatSignatureField("Foster Parent 1", formData.signatures.parent1?.name || formData.signatures.parent1 || "", formData.signatures.parent1?.signature || formData.signatures.parent1Signature || "", formData.signatures.parent1?.date || formData.signatures.parent1Date || "")
              signatureHtml += formatSignatureField("Foster Parent 2", formData.signatures.parent2?.name || formData.signatures.parent2 || "", formData.signatures.parent2?.signature || formData.signatures.parent2Signature || "", formData.signatures.parent2?.date || formData.signatures.parent2Date || "")
            }
            
            // Staff signature
            if (formData.signatures.staff) {
              signatureHtml += formatSignatureField(
                formData.signatures.staff.name || formData.visitInfo?.conductedBy || "Staff",
                formData.signatures.staff.name || formData.visitInfo?.conductedBy || "",
                formData.signatures.staff.signature || "",
                formData.signatures.staff.date || ""
              )
            }
            
            // Supervisor signature
            if (formData.signatures.supervisor) {
              signatureHtml += formatSignatureField(
                formData.signatures.supervisor.name || "Supervisor",
                formData.signatures.supervisor.name || formData.signatures.supervisor || "",
                formData.signatures.supervisor.signature || formData.signatures.supervisorSignature || "",
                formData.signatures.supervisor.date || formData.signatures.supervisorDate || ""
              )
            }
            
            return signatureHtml
          })()}
        </div>
      </div>
      ` : ""}

      <!-- Footer -->
      <div style="border-top: 3px solid #5E3989; padding-top: 20px; margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 5px 0;">Foster Home Visit Report - Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        <p style="margin: 5px 0;">This document contains confidential information and should be handled according to agency policies.</p>
      </div>
    </div>
  `
}

function generateCompleteReportText(
  formData: any,
  appointmentId: string,
  visitDate: string,
  visitTime: string,
  familyName: string,
): string {
  let content = `FOSTER HOME VISIT REPORT\n\n`
  content += `Appointment ID: ${appointmentId}\n`
  content += `Visit Date: ${visitDate}\n`
  content += `Visit Time: ${visitTime}\n`
  content += `Quarter: ${formData.visitInfo?.quarter || "N/A"}\n`
  content += `Visit Number: ${formData.visitInfo?.visitNumberThisQuarter || "N/A"}\n`
  content += `Visit Type: ${formData.visitInfo?.visitType || "N/A"}\n`
  content += `Mode: ${formData.visitInfo?.mode || "N/A"}\n`
  content += `Conducted By: ${formData.visitInfo?.conductedBy || "N/A"}\n\n`

  content += `FAMILY & HOME INFORMATION\n`
  content += `Family Name: ${familyName}\n`
  content += `Address: ${formData.familyInfo?.fosterHome?.address || "N/A"}\n`
  content += `City: ${formData.familyInfo?.fosterHome?.city || "N/A"}\n`
  content += `State: ${formData.familyInfo?.fosterHome?.state || "N/A"}\n`
  content += `ZIP: ${formData.familyInfo?.fosterHome?.zip || "N/A"}\n`
  content += `Phone: ${formData.familyInfo?.fosterHome?.phone || "N/A"}\n`
  content += `Email: ${formData.familyInfo?.fosterHome?.email || "N/A"}\n`
  content += `License Type: ${formData.familyInfo?.fosterHome?.licenseType || "N/A"}\n`
  content += `License Number: ${formData.familyInfo?.fosterHome?.licenseNumber || "N/A"}\n\n`

  if (formData.familyInfo?.household) {
    content += `HOUSEHOLD MEMBERS\n`
    if (formData.familyInfo.household.providers && formData.familyInfo.household.providers.length > 0) {
      content += `Foster Parents/Providers:\n`
      formData.familyInfo.household.providers.forEach((p: any) => {
        content += `  - ${p.name}${p.age ? ` (Age: ${p.age})` : ""}${p.relationship ? ` - ${p.relationship}` : ""}\n`
      })
    }
    if (formData.familyInfo.household.biologicalChildren && formData.familyInfo.household.biologicalChildren.length > 0) {
      content += `Biological Children:\n`
      formData.familyInfo.household.biologicalChildren.forEach((c: any) => {
        content += `  - ${c.name}${c.age ? ` (Age: ${c.age})` : ""}\n`
      })
    }
    content += `\n`
  }

  if (formData.attendees?.attendance) {
    const present = Object.entries(formData.attendees.attendance)
      .filter(([_, present]: [string, any]) => present === true)
      .map(([name, _]: [string, any]) => name)
    if (present.length > 0) {
      content += `ATTENDANCE\n`
      present.forEach((name: string) => {
        content += `  - ✓ ${name}\n`
      })
      content += `\n`
    }
  }

  if (formData.homeEnvironment?.homeCondition) {
    content += `HOME CONDITION\n`
    content += `${formData.homeEnvironment.homeCondition}\n\n`
  }

  if (formData.complianceReview) {
    content += `COMPLIANCE REVIEW\n`
    const sections = [
      { key: "medication", name: "1. Medication" },
      { key: "healthSafety", name: "2. Health & Safety" },
      { key: "childrensRights", name: "3. Children's Rights & Well-Being" },
      { key: "bedrooms", name: "4. Bedrooms and Belongings" },
      { key: "education", name: "5. Education & Life Skills" },
      { key: "indoorSpace", name: "6. Indoor Space" },
      { key: "documentation", name: "7. Documentation" },
      { key: "outdoorSpace", name: "8. Outdoor Space" },
      { key: "vehicles", name: "9. Vehicles" },
      { key: "swimming", name: "10. Swimming Areas" },
      { key: "infants", name: "11. Infants" },
    ]
    
    sections.forEach(({ key, name }) => {
      const section = formData.complianceReview[key]
      if (section && section.items && section.items.length > 0) {
        // Check if this section uses monthly tracking
        const hasMonthlyTracking = section.items.some((item: any) => item.month1 || item.month2 || item.month3)
        
        content += `${name}:\n`
        section.items.forEach((item: any) => {
          if (hasMonthlyTracking) {
            const m1 = item.month1?.na ? "N/A" : item.month1?.compliant ? "Compliant" : "Not answered"
            const m2 = item.month2?.na ? "N/A" : item.month2?.compliant ? "Compliant" : "Not answered"
            const m3 = item.month3?.na ? "N/A" : item.month3?.compliant ? "Compliant" : "Not answered"
            const allNotes = [
              item.month1?.notes,
              item.month2?.notes,
              item.month3?.notes,
            ].filter(n => n && n.trim())
            content += `  - ${item.code || ""}: ${item.requirement || ""} - Month 1: ${m1}, Month 2: ${m2}, Month 3: ${m3}${allNotes.length > 0 ? ` (Notes: ${allNotes.join("; ")})` : ""}\n`
          } else if (item.month1) {
            // Single status mode
            const status = item.month1.na ? "N/A" : item.month1.compliant ? "Compliant" : "Not answered"
            content += `  - ${item.code || ""}: ${item.requirement || ""} - ${status}${item.month1.notes ? ` (${item.month1.notes})` : ""}\n`
          } else {
            // Old format
            const status = item.status || "Not answered"
            content += `  - ${item.code || ""}: ${item.requirement || ""} - ${status}${item.notes ? ` (${item.notes})` : ""}\n`
          }
        })
        if (section.combinedNotes) {
          content += `  Notes: ${section.combinedNotes}\n`
        }
        content += `\n`
      }
    })
    
    // Trauma-Informed Care
    if (formData.complianceReview.traumaInformedCare && formData.complianceReview.traumaInformedCare.items) {
      content += `Trauma-Informed Care & Training:\n`
      formData.complianceReview.traumaInformedCare.items.forEach((item: any) => {
        const status = item.status || "Not answered"
        content += `  - ${item.code || ""}: ${item.requirement || ""} - ${status}${item.notes ? ` (${item.notes})` : ""}\n`
      })
      if (formData.complianceReview.traumaInformedCare.combinedNotes) {
        content += `  Notes: ${formData.complianceReview.traumaInformedCare.combinedNotes}\n`
      }
      content += `\n`
    }
    
    // Package-Specific Compliance
    if (formData.complianceReview.packageCompliance) {
      const pkgCompliance = formData.complianceReview.packageCompliance
      const credentialedPackages = pkgCompliance.credentialedPackages || []
      if (credentialedPackages.length > 0) {
        content += `14. Package-Specific Compliance:\n`
        const packageNames: Record<string, string> = {
          "substance-use": "Substance Use Treatment",
          "stass": "STASS",
          "t3c-treatment": "T3C Treatment",
          "mental-behavioral": "Mental/Behavioral Health",
          "idd-autism": "IDD/Autism",
        }
        credentialedPackages.forEach((pkgId: string) => {
          const pkgName = packageNames[pkgId] || pkgId
          const sectionData = pkgCompliance[pkgId]
          if (sectionData && sectionData.items && sectionData.items.length > 0) {
            content += `  ${pkgName}:\n`
            sectionData.items.forEach((item: any) => {
              const hasMonthlyTracking = item.month1 && item.month2 && item.month3
              if (hasMonthlyTracking) {
                const m1 = item.month1?.na ? "N/A" : item.month1?.compliant ? "Compliant" : "Not answered"
                const m2 = item.month2?.na ? "N/A" : item.month2?.compliant ? "Compliant" : "Not answered"
                const m3 = item.month3?.na ? "N/A" : item.month3?.compliant ? "Compliant" : "Not answered"
                content += `    - ${item.code || ""}: ${item.requirement || ""} - Month 1: ${m1}, Month 2: ${m2}, Month 3: ${m3}\n`
              } else if (item.month1) {
                const status = item.month1.na ? "N/A" : item.month1.compliant ? "Compliant" : "Not answered"
                content += `    - ${item.code || ""}: ${item.requirement || ""} - ${status}\n`
              } else {
                const status = item.status || "Not answered"
                content += `    - ${item.code || ""}: ${item.requirement || ""} - ${status}\n`
              }
            })
          }
        })
        if (pkgCompliance.combinedNotes) {
          content += `  Notes: ${pkgCompliance.combinedNotes}\n`
        }
        content += `\n`
      }
    }
    
    // Quality Enhancement
    if (formData.complianceReview.qualityEnhancement) {
      content += `Quality Enhancement:\n`
      if (formData.complianceReview.qualityEnhancement.activities && Array.isArray(formData.complianceReview.qualityEnhancement.activities)) {
        content += `  Activities: ${formData.complianceReview.qualityEnhancement.activities.join(", ")}\n`
      }
      if (formData.complianceReview.qualityEnhancement.notes) {
        content += `  Notes: ${formData.complianceReview.qualityEnhancement.notes}\n`
      }
      content += `\n`
    }
  }

  if (formData.childInterviews?.placements && formData.childInterviews.placements.length > 0) {
    content += `CHILD INTERVIEWS\n`
    formData.childInterviews.placements.forEach((placement: any) => {
      content += `Child: ${placement.childName || "N/A"}\n`
      if (placement.interviewDate) content += `Interview Date: ${placement.interviewDate}\n`
      if (placement.interviewNotes) content += `Notes: ${placement.interviewNotes}\n`
      content += `\n`
    })
  }

  if (formData.parentInterviews?.fosterParentInterview) {
    content += `FOSTER PARENT INTERVIEW\n`
    const interview = formData.parentInterviews.fosterParentInterview
    content += `${typeof interview === 'string' ? interview : JSON.stringify(interview, null, 2)}\n\n`
  }

  if (formData.observations?.followUpItems && formData.observations.followUpItems.length > 0) {
    content += `FOLLOW-UP ITEMS\n`
    formData.observations.followUpItems.forEach((item: any) => {
      content += `  - ${typeof item === 'string' ? item : item.description || item}\n`
    })
    content += `\n`
  }

  if (formData.observations?.correctiveActions && formData.observations.correctiveActions.length > 0) {
    content += `CORRECTIVE ACTIONS REQUIRED\n`
    formData.observations.correctiveActions.forEach((action: any) => {
      content += `  - ${typeof action === 'string' ? action : action.description || action}\n`
    })
    content += `\n`
  }

  if (formData.recommendations?.visitSummary) {
    content += `VISIT SUMMARY\n`
    const summary = formData.recommendations.visitSummary
    if (typeof summary === 'string') {
      content += `${summary}\n\n`
    } else if (typeof summary === 'object') {
      if (summary.overallStatus) content += `Overall Status: ${summary.overallStatus}\n`
      if (summary.keyStrengths && Array.isArray(summary.keyStrengths)) {
        const strengths = summary.keyStrengths.filter((s: string) => s && s.trim())
        if (strengths.length > 0) {
          content += `Key Strengths:\n`
          strengths.forEach((s: string) => content += `  - ${s}\n`)
        }
      }
      if (summary.priorityAreas && Array.isArray(summary.priorityAreas)) {
        const areas = summary.priorityAreas.filter((a: any) => a && (a.priority || a.description))
        if (areas.length > 0) {
          content += `Priority Areas:\n`
          areas.forEach((a: any) => content += `  - ${a.priority || ""}: ${a.description || ""}\n`)
        }
      }
      if (summary.resourcesProvided && typeof summary.resourcesProvided === 'object') {
        const resources = Object.entries(summary.resourcesProvided).filter(([k, v]: [string, any]) => v && String(v).trim())
        if (resources.length > 0) {
          content += `Resources Provided:\n`
          resources.forEach(([k, v]: [string, any]) => content += `  - ${k}: ${v}\n`)
        }
      }
      if (summary.nextVisit && typeof summary.nextVisit === 'object') {
        const nextVisit = summary.nextVisit
        if (nextVisit.date || nextVisit.time || nextVisit.location) {
          content += `Next Visit: ${nextVisit.visitType || ""} ${nextVisit.date || ""} ${nextVisit.time || ""} ${nextVisit.location || ""}\n`
        }
      }
      content += `\n`
    } else {
      content += `${String(summary)}\n\n`
    }
  }

  if (formData.observations?.observations) {
    content += `GENERAL OBSERVATIONS\n`
    const observations = formData.observations.observations
    content += `${typeof observations === 'string' ? observations : JSON.stringify(observations, null, 2)}\n\n`
  }

  if (formData.signatures) {
    content += `SIGNATURES\n`
    
    // Foster parent signatures (from household.providers)
    if (formData.familyInfo?.household?.providers) {
      formData.familyInfo.household.providers.forEach((provider: any, index: number) => {
        const sigKey = `parent${index + 1}` as keyof typeof formData.signatures
        const sigData = formData.signatures[sigKey] || {}
        const name = sigData.name || provider.name || `Foster Parent ${index + 1}`
        const date = sigData.date || ""
        const signature = sigData.signature || ""
        content += `${name}:`
        if (date) content += ` (Date: ${date})`
        if (signature) content += ` [Signature: ${signature.length > 100 ? 'Image data present' : signature}]`
        content += `\n`
      })
    } else {
      // Fallback to old format
      if (formData.signatures.parent1?.name || formData.signatures.parent1) {
        const name = formData.signatures.parent1?.name || formData.signatures.parent1 || ""
        const date = formData.signatures.parent1?.date || formData.signatures.parent1Date || ""
        const signature = formData.signatures.parent1?.signature || formData.signatures.parent1Signature || ""
        content += `Foster Parent 1: ${name}`
        if (date) content += ` (Date: ${date})`
        if (signature) content += ` [Signature: ${signature.length > 100 ? 'Image data present' : signature}]`
        content += `\n`
      }
      if (formData.signatures.parent2?.name || formData.signatures.parent2) {
        const name = formData.signatures.parent2?.name || formData.signatures.parent2 || ""
        const date = formData.signatures.parent2?.date || formData.signatures.parent2Date || ""
        const signature = formData.signatures.parent2?.signature || formData.signatures.parent2Signature || ""
        content += `Foster Parent 2: ${name}`
        if (date) content += ` (Date: ${date})`
        if (signature) content += ` [Signature: ${signature.length > 100 ? 'Image data present' : signature}]`
        content += `\n`
      }
    }
    
    // Staff signature
    if (formData.signatures.staff) {
      const name = formData.signatures.staff.name || formData.visitInfo?.conductedBy || "Staff"
      const date = formData.signatures.staff.date || ""
      const signature = formData.signatures.staff.signature || ""
      content += `${name}:`
      if (date) content += ` (Date: ${date})`
      if (signature) content += ` [Signature: ${signature.length > 100 ? 'Image data present' : signature}]`
      content += `\n`
    }
    
    // Supervisor signature
    if (formData.signatures.supervisor) {
      const name = formData.signatures.supervisor.name || formData.signatures.supervisor || "Supervisor"
      const date = formData.signatures.supervisor.date || formData.signatures.supervisorDate || ""
      const signature = formData.signatures.supervisor.signature || formData.signatures.supervisorSignature || ""
      content += `${name}:`
      if (date) content += ` (Date: ${date})`
      if (signature) content += ` [Signature: ${signature.length > 100 ? 'Image data present' : signature}]`
      content += `\n`
    }
    
    content += `\n`
  }

  content += `---\n`
  content += `Foster Home Visit Report - Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}\n`
  content += `This document contains confidential information and should be handled according to agency policies.`

  return content
}
