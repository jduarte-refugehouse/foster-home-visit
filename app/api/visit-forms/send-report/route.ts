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

      <!-- Compliance Review -->
      ${formData.complianceReview ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Compliance Review</h2>
        ${formatComplianceSection(formData.complianceReview.medication, "Medication")}
        ${formatComplianceSection(formData.complianceReview.healthSafety, "Health & Safety")}
        ${formatComplianceSection(formData.complianceReview.childrensRights, "Children's Rights & Well-Being")}
        ${formatComplianceSection(formData.complianceReview.bedrooms, "Bedrooms and Belongings")}
        ${formatComplianceSection(formData.complianceReview.education, "Education & Life Skills")}
        ${formatComplianceSection(formData.complianceReview.indoorSpace, "Indoor Space")}
        ${formatComplianceSection(formData.complianceReview.documentation, "Documentation")}
        ${formatComplianceSection(formData.complianceReview.outdoorSpace, "Outdoor Space")}
        ${formatComplianceSection(formData.complianceReview.vehicles, "Vehicles")}
        ${formatComplianceSection(formData.complianceReview.swimming, "Swimming Areas")}
        ${formatComplianceSection(formData.complianceReview.infants, "Infants")}
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
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Observations</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          <p style="white-space: pre-wrap;">${formData.observations.observations}</p>
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
  content += `Visit Number: ${formData.visitInfo?.visitNumberThisQuarter || "N/A"}\n\n`

  content += `FAMILY & HOME INFORMATION\n`
  content += `Family Name: ${familyName}\n`
  content += `Address: ${formData.familyInfo?.fosterHome?.address || "N/A"}\n`
  content += `City: ${formData.familyInfo?.fosterHome?.city || "N/A"}\n`
  content += `State: ${formData.familyInfo?.fosterHome?.state || "N/A"}\n`
  content += `ZIP: ${formData.familyInfo?.fosterHome?.zip || "N/A"}\n`
  content += `Phone: ${formData.familyInfo?.fosterHome?.phone || "N/A"}\n`
  content += `Email: ${formData.familyInfo?.fosterHome?.email || "N/A"}\n\n`

  if (formData.recommendations?.visitSummary) {
    content += `VISIT SUMMARY\n`
    content += `${formData.recommendations.visitSummary}\n\n`
  }

  if (formData.observations?.observations) {
    content += `OBSERVATIONS\n`
    content += `${formData.observations.observations}\n\n`
  }

  content += `---\n`
  content += `Foster Home Visit Report - Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}\n`
  content += `This document contains confidential information and should be handled according to agency policies.`

  return content
}
