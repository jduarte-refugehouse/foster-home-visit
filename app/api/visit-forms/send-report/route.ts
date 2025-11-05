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

    const { appointmentId, formData } = await request.json()

    if (!appointmentId || !formData) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: appointmentId, formData",
        },
        { status: 400 },
      )
    }

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

    if (!caseManagerEmail) {
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

    // Prepare email with CC
    const msg = {
      to: caseManagerEmail,
      cc: ccEmail,
      from: {
        email: fromEmail,
        name: "Foster Home Visit System",
      },
      subject: subject,
      text: textContent,
      html: htmlContent,
    }

    // Send the email
    const response = await sgMail.send(msg)

    return NextResponse.json({
      success: true,
      messageId: response[0].headers["x-message-id"],
      message: "Report sent successfully to case manager",
      recipient: caseManagerEmail,
      cc: ccEmail,
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
  // Helper to format compliance sections
  const formatComplianceSection = (sectionData: any, sectionName: string) => {
    if (!sectionData || !sectionData.items || sectionData.items.length === 0) return ""

    const items = sectionData.items
      .filter((item: any) => item.status) // Only show items with status
      .map((item: any) => {
        const statusBadge = {
          compliant: '<span style="color: #16a34a; font-weight: bold;">✓ Compliant</span>',
          "non-compliant": '<span style="color: #dc2626; font-weight: bold;">✗ Non-Compliant</span>',
          na: '<span style="color: #6b7280;">N/A</span>',
        }[item.status] || item.status

        const notes = item.notes ? ` - <em>${item.notes}</em>` : ""
        return `<li>${item.code || ""}: ${item.requirement || ""} - ${statusBadge}${notes}</li>`
      })
      .join("")

    if (!items) return ""

    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">${sectionName}</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${items}
        </ul>
        ${sectionData.combinedNotes ? `<p style="margin-top: 10px; font-style: italic;">${sectionData.combinedNotes}</p>` : ""}
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

  // Helper to format trauma-informed care section
  const formatTraumaInformedCare = (traumaCare: any) => {
    if (!traumaCare || !traumaCare.items || traumaCare.items.length === 0) return ""
    
    const items = traumaCare.items
      .filter((item: any) => item.status)
      .map((item: any) => {
        const statusBadge = {
          compliant: '<span style="color: #16a34a; font-weight: bold;">✓ Compliant</span>',
          "non-compliant": '<span style="color: #dc2626; font-weight: bold;">✗ Non-Compliant</span>',
          na: '<span style="color: #6b7280;">N/A</span>',
        }[item.status] || item.status
        const notes = item.notes ? ` - <em>${item.notes}</em>` : ""
        return `<li>${item.code || ""}: ${item.requirement || ""} - ${statusBadge}${notes}</li>`
      })
      .join("")
    
    if (!items) return ""
    
    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Trauma-Informed Care & Training</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${items}
        </ul>
        ${traumaCare.combinedNotes ? `<p style="margin-top: 10px; font-style: italic;">${traumaCare.combinedNotes}</p>` : ""}
      </div>
    `
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

      <!-- Children Present -->
      ${formData.attendees?.childrenPresent && formData.attendees.childrenPresent.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Children Present During Visit</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          ${formData.attendees.childrenPresent.map((child: any) => `<p style="margin: 3px 0;">${child.name || child}${child.age ? ` (Age: ${child.age})` : ""}</p>`).join("")}
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
      ${formData.complianceReview ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Compliance Review</h2>
        ${formatComplianceSection(formData.complianceReview.medication, "1. Medication")}
        ${formatInspectionsSection(formData.complianceReview.inspections)}
        ${formatComplianceSection(formData.complianceReview.healthSafety, "2. Health & Safety")}
        ${formatComplianceSection(formData.complianceReview.childrensRights, "3. Children's Rights & Well-Being")}
        ${formatComplianceSection(formData.complianceReview.bedrooms, "4. Bedrooms and Belongings")}
        ${formatComplianceSection(formData.complianceReview.education, "5. Education & Life Skills")}
        ${formatComplianceSection(formData.complianceReview.indoorSpace, "6. Indoor Space")}
        ${formatComplianceSection(formData.complianceReview.documentation, "7. Documentation")}
        ${formatTraumaInformedCare(formData.complianceReview.traumaInformedCare)}
        ${formatComplianceSection(formData.complianceReview.outdoorSpace, "8. Outdoor Space")}
        ${formatComplianceSection(formData.complianceReview.vehicles, "9. Vehicles")}
        ${formatComplianceSection(formData.complianceReview.swimming, "10. Swimming Areas")}
        ${formatComplianceSection(formData.complianceReview.infants, "11. Infants")}
        ${formatQualityEnhancement(formData.complianceReview.qualityEnhancement)}
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
          <p style="white-space: pre-wrap;">${formData.parentInterviews.fosterParentInterview}</p>
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
          <p style="white-space: pre-wrap;">${formData.recommendations.visitSummary}</p>
        </div>
      </div>
      ` : ""}

      <!-- Observations -->
      ${formData.observations?.observations ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">General Observations</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          <p style="white-space: pre-wrap;">${formData.observations.observations}</p>
        </div>
      </div>
      ` : ""}

      <!-- Signatures -->
      ${formData.signatures ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Signatures</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${formData.signatures.visitor ? `<div><p style="margin: 5px 0;"><strong>Visitor Signature:</strong> ${formData.signatures.visitor}</p></div>` : ""}
          ${formData.signatures.parent1 ? `<div><p style="margin: 5px 0;"><strong>Foster Parent 1:</strong> ${formData.signatures.parent1}</p></div>` : ""}
          ${formData.signatures.parent2 ? `<div><p style="margin: 5px 0;"><strong>Foster Parent 2:</strong> ${formData.signatures.parent2}</p></div>` : ""}
          ${formData.signatures.supervisor ? `<div><p style="margin: 5px 0;"><strong>Supervisor:</strong> ${formData.signatures.supervisor}</p></div>` : ""}
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

  if (formData.attendees?.childrenPresent && formData.attendees.childrenPresent.length > 0) {
    content += `CHILDREN PRESENT DURING VISIT\n`
    formData.attendees.childrenPresent.forEach((child: any) => {
      content += `  - ${child.name || child}${child.age ? ` (Age: ${child.age})` : ""}\n`
    })
    content += `\n`
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
        const itemsWithStatus = section.items.filter((item: any) => item.status)
        if (itemsWithStatus.length > 0) {
          content += `${name}:\n`
          itemsWithStatus.forEach((item: any) => {
            content += `  - ${item.code || ""}: ${item.requirement || ""} - ${item.status}${item.notes ? ` (${item.notes})` : ""}\n`
          })
          if (section.combinedNotes) {
            content += `  Notes: ${section.combinedNotes}\n`
          }
          content += `\n`
        }
      }
    })
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
    content += `${formData.parentInterviews.fosterParentInterview}\n\n`
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
    content += `${formData.recommendations.visitSummary}\n\n`
  }

  if (formData.observations?.observations) {
    content += `GENERAL OBSERVATIONS\n`
    content += `${formData.observations.observations}\n\n`
  }

  if (formData.signatures) {
    content += `SIGNATURES\n`
    if (formData.signatures.visitor) content += `Visitor: ${formData.signatures.visitor}\n`
    if (formData.signatures.parent1) content += `Foster Parent 1: ${formData.signatures.parent1}\n`
    if (formData.signatures.parent2) content += `Foster Parent 2: ${formData.signatures.parent2}\n`
    if (formData.signatures.supervisor) content += `Supervisor: ${formData.signatures.supervisor}\n`
    content += `\n`
  }

  content += `---\n`
  content += `Foster Home Visit Report - Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}\n`
  content += `This document contains confidential information and should be handled according to agency policies.`

  return content
}
