import { type NextRequest, NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { query } from "@/lib/db"
import { getUserByClerkId } from "@/lib/user-management"
import { format } from "date-fns"
import PDFDocument from "pdfkit"

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
    console.log("📋 [API] ComplianceReview sections:", formData.complianceReview ? Object.keys(formData.complianceReview).filter(k => formData.complianceReview[k] !== null && formData.complianceReview[k] !== undefined) : [])
    
    // Debug: Log each compliance section to see what's there
    if (formData.complianceReview) {
      Object.entries(formData.complianceReview).forEach(([key, value]: [string, any]) => {
        if (value && typeof value === 'object') {
          const items = value.items || (Array.isArray(value) ? value : [])
          console.log(`📋 [API] Compliance section "${key}":`, {
            hasItems: !!items,
            itemsCount: Array.isArray(items) ? items.length : 0,
            hasCombinedNotes: !!value.combinedNotes,
            firstItemSample: Array.isArray(items) && items.length > 0 ? items[0] : null
          })
        }
      })
    }
    
    console.log("📋 [API] Signatures:", formData.signatures ? Object.keys(formData.signatures) : "No signatures")
    console.log("📋 [API] Observations keys:", formData.observations ? Object.keys(formData.observations) : "No observations")
    console.log("📋 [API] FosterParentInterview:", formData.fosterParentInterview ? "exists" : formData.parentInterviews?.fosterParentInterview ? "exists in parentInterviews" : "not found")
    console.log("📋 [API] VisitSummary:", formData.visitSummary ? Object.keys(formData.visitSummary) : "No visitSummary")

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

    // Get visit form ID from appointment to fetch attachments
    let visitFormId: string | null = null
    let attachments: any[] = []
    try {
      const visitFormResult = await query<{ visit_form_id: string }>(
        `SELECT TOP 1 visit_form_id FROM dbo.visit_forms WHERE appointment_id = @param0 AND is_deleted = 0 ORDER BY created_at DESC`,
        [appointmentId]
      )
      if (visitFormResult.length > 0) {
        visitFormId = visitFormResult[0].visit_form_id
        console.log(`📸 [REPORT] Found visit form ID: ${visitFormId}`)
        
        // Fetch attachments
        try {
          attachments = await query(
            `SELECT 
              attachment_id, file_name, file_path, file_size, mime_type,
              attachment_type, description, file_data, created_at, created_by_name
            FROM dbo.visit_form_attachments
            WHERE visit_form_id = @param0 AND (is_deleted = 0 OR is_deleted IS NULL)
            ORDER BY created_at DESC`,
            [visitFormId]
          )
          console.log(`📸 [REPORT] Found ${attachments.length} attachments`)
        } catch (attachError: any) {
          if (attachError?.message?.includes("Invalid column name")) {
            // Try without is_deleted column
            attachments = await query(
              `SELECT 
                attachment_id, file_name, file_path, file_size, mime_type,
                attachment_type, description, file_data, created_at, created_by_name
              FROM dbo.visit_form_attachments
              WHERE visit_form_id = @param0
              ORDER BY created_at DESC`,
              [visitFormId]
            )
            console.log(`📸 [REPORT] Found ${attachments.length} attachments (without is_deleted check)`)
          } else {
            console.error(`❌ [REPORT] Error fetching attachments:`, attachError)
          }
        }
      } else {
        console.log(`⚠️ [REPORT] No visit form found for appointment ${appointmentId}`)
      }
    } catch (error) {
      console.error(`❌ [REPORT] Error fetching visit form/attachments:`, error)
      // Continue without attachments
    }

    // Generate report content
    const visitDate = formData.visitInfo?.date
      ? format(new Date(formData.visitInfo.date), "MMMM d, yyyy")
      : "N/A"
    const visitTime = formData.visitInfo?.time || "N/A"

    const subject = `Foster Home Visit Report - ${familyName} - ${visitDate}`

    const htmlContent = generateCompleteReportHTML(formData, appointmentId, visitDate, visitTime, familyName, appointment, attachments)
    const textContent = generateCompleteReportText(formData, appointmentId, visitDate, visitTime, familyName, appointment)

    // Determine recipient based on recipientType
    let toEmail: string
    let ccEmailList: string | null = null
    let recipientDescription: string

    if (sendTo === "me") {
      // Send to current user only, NO CC
      toEmail = ccEmail
      ccEmailList = null
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

    // Generate PDF from images and attach if there are images
    const imageAttachments = attachments.filter((att: any) => att.file_data && att.mime_type?.startsWith('image/'))
    if (imageAttachments.length > 0) {
      try {
        console.log(`📄 [REPORT] Generating PDF from ${imageAttachments.length} images`)
        
        // Create PDF document
        const doc = new PDFDocument({ margin: 50 })
        const chunks: Buffer[] = []
        
        doc.on('data', (chunk: Buffer) => chunks.push(chunk))
        doc.on('end', () => {})
        
        // Add title
        doc.fontSize(16).text(`Foster Home Visit Attachments - ${familyName}`, { align: 'center' })
        doc.fontSize(12).text(`Visit Date: ${visitDate}`, { align: 'center' })
        doc.moveDown()
        
        // Add each image to PDF
        for (let i = 0; i < imageAttachments.length; i++) {
          const attachment = imageAttachments[i]
          if (i > 0) {
            doc.addPage()
          }
          
          // Extract base64 data
          const base64Data = attachment.file_data.replace(/^data:image\/\w+;base64,/, '')
          const imageBuffer = Buffer.from(base64Data, 'base64')
          
          // Add image description
          doc.fontSize(12).text(attachment.description || attachment.file_name || `Attachment ${i + 1}`, { align: 'left' })
          doc.moveDown(0.5)
          
          // Calculate image dimensions to fit page
          const pageWidth = doc.page.width - 100 // margins
          const pageHeight = doc.page.height - 200 // leave space for title/description
          
          // Get image dimensions (approximate - pdfkit will handle scaling)
          doc.image(imageBuffer, {
            fit: [pageWidth, pageHeight],
            align: 'center',
            valign: 'center'
          })
          
          // Add metadata
          doc.moveDown()
          doc.fontSize(8).fillColor('gray')
          if (attachment.created_at) {
            doc.text(`Uploaded: ${format(new Date(attachment.created_at), "MMM d, yyyy h:mm a")}`, { align: 'left' })
          }
          if (attachment.created_by_name) {
            doc.text(`By: ${attachment.created_by_name}`, { align: 'left' })
          }
          doc.fillColor('black')
        }
        
        doc.end()
        
        // Wait for PDF to finish generating
        await new Promise<void>((resolve) => {
          doc.on('end', () => resolve())
        })
        
        // Combine chunks into single buffer
        const pdfBuffer = Buffer.concat(chunks)
        
        // Attach PDF to email
        msg.attachments = [
          {
            content: pdfBuffer.toString('base64'),
            filename: `visit-attachments-${familyName.replace(/\s+/g, '-')}-${visitDate.replace(/\s+/g, '-')}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment',
          }
        ]
        
        console.log(`✅ [REPORT] PDF generated successfully (${pdfBuffer.length} bytes)`)
      } catch (pdfError) {
        console.error(`❌ [REPORT] Error generating PDF:`, pdfError)
        // Continue without PDF attachment - images are still inline in HTML
      }
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
  appointment?: any,
  attachments: any[] = [],
): string {
  // Helper to format signature field with image (handles flat structure: parent1, parent1Signature, parent1Date)
  const formatSignatureField = (label: string, name: string, signature: any, date: string) => {
    if (!name && !signature) return ""
    
    const nameDisplay = name || "Not provided"
    // Format date if it exists, otherwise show "Not provided"
    let dateDisplay = "Not provided"
    if (date && date.trim()) {
      try {
        // Handle YYYY-MM-DD format (HTML date input format)
        let dateObj: Date | null = null
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
          // Parse YYYY-MM-DD format
          const [year, month, day] = date.trim().split('-').map(Number)
          dateObj = new Date(year, month - 1, day)
        } else {
          // Try standard Date parsing
          dateObj = new Date(date)
        }
        
        if (dateObj && !isNaN(dateObj.getTime())) {
          dateDisplay = format(dateObj, "MMMM d, yyyy")
        } else {
          // If it's already formatted, use as-is
          dateDisplay = date.trim()
        }
      } catch (e) {
        // If formatting fails, use the date as-is
        console.log(`⚠️ [REPORT] Date formatting error for ${label}:`, date, e)
        dateDisplay = date.trim()
      }
    }
    
    // Handle signature - could be string (base64 data URL) or object
    let signatureImg = ""
    if (signature) {
      let sigString = ""
      if (typeof signature === 'string') {
        sigString = signature
      } else if (typeof signature === 'object' && signature !== null) {
        // If it's an object, try to extract the image data
        sigString = signature.data || signature.image || signature.signature || JSON.stringify(signature)
      }
      
      if (sigString && typeof sigString === 'string') {
        // Check if it's a base64 image data URL
        if (sigString.startsWith('data:image') || sigString.startsWith('data:image/png') || sigString.startsWith('data:image/jpeg') || sigString.length > 100) {
          signatureImg = `<div style="margin-top: 8px;"><img src="${sigString}" alt="${label} signature" style="max-width: 300px; max-height: 150px; border: 1px solid #d1d5db; border-radius: 4px;" /></div>`
        } else if (sigString.trim().length > 0) {
          signatureImg = `<div style="margin-top: 8px; color: #6b7280; font-size: 12px;">Signature data present</div>`
        }
      }
    }
    
    return `
      <div style="margin-bottom: 15px;">
        <p style="margin: 3px 0;"><strong>${label}:</strong> ${nameDisplay}</p>
        ${signatureImg}
        <p style="margin: 3px 0; font-size: 12px; color: #6b7280;"><strong>Date:</strong> ${dateDisplay}</p>
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

  // Helper to format compliance sections - ALWAYS show sections for compliance validation
  const formatComplianceSection = (sectionData: any, sectionName: string, showMonthly = true, isQuarterly = true) => {
    // For compliance, always show the section even if empty
    // This ensures case managers can validate all sections were reviewed
    
    // If sectionData is null/undefined, show empty section
    if (!sectionData) {
      return `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">${sectionName}${isQuarterly ? ' <span style="font-size: 12px; color: #6b7280; font-weight: normal;">(Quarterly)</span>' : ''}</h3>
          <p style="color: #9ca3af; font-style: italic; padding: 15px; background-color: #f9fafb; border-radius: 4px;">No items reviewed for this section.</p>
        </div>
      `
    }
    
    // Handle case where sectionData might be an object with items, or just items array
    const items = sectionData?.items || (Array.isArray(sectionData) ? sectionData : [])
    
    // Ensure items is an array
    if (!Array.isArray(items)) {
      // If section exists but has no items, show empty section
      if (sectionData && typeof sectionData === 'object') {
        return `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">${sectionName}${isQuarterly ? ' <span style="font-size: 12px; color: #6b7280; font-weight: normal;">(Quarterly)</span>' : ''}</h3>
            <p style="color: #9ca3af; font-style: italic; padding: 15px; background-color: #f9fafb; border-radius: 4px;">No items reviewed for this section.</p>
            ${sectionData.combinedNotes ? `<p style="margin-top: 10px; font-style: italic; white-space: pre-wrap;">${sectionData.combinedNotes}</p>` : ""}
          </div>
        `
      }
      // Show empty section for compliance validation
      return `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">${sectionName}${isQuarterly ? ' <span style="font-size: 12px; color: #6b7280; font-weight: normal;">(Quarterly)</span>' : ''}</h3>
          <p style="color: #9ca3af; font-style: italic; padding: 15px; background-color: #f9fafb; border-radius: 4px;">No items reviewed for this section.</p>
        </div>
      `
    }
    
    // If no items but has combined notes, show section with notes
    if (items.length === 0) {
      if (sectionData?.combinedNotes) {
        return `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">${sectionName}${isQuarterly ? ' <span style="font-size: 12px; color: #6b7280; font-weight: normal;">(Quarterly)</span>' : ''}</h3>
            <p style="font-style: italic; white-space: pre-wrap;">${sectionData.combinedNotes}</p>
          </div>
        `
      }
      // Show empty section for compliance validation
      return `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">${sectionName}${isQuarterly ? ' <span style="font-size: 12px; color: #6b7280; font-weight: normal;">(Quarterly)</span>' : ''}</h3>
          <p style="color: #9ca3af; font-style: italic; padding: 15px; background-color: #f9fafb; border-radius: 4px;">No items reviewed for this section.</p>
        </div>
      `
    }

    // Check if this section uses monthly tracking (has month1, month2, month3)
    const hasMonthlyTracking = items.some((item: any) => item.month1 || item.month2 || item.month3)
    
    // Build table rows
    const tableRows = items
      .map((item: any) => {
        const code = item.code || ""
        const requirement = item.requirement || ""
        
        let m1Cell = ""
        let m2Cell = ""
        let m3Cell = ""
        let notesCell = ""
        
        if (hasMonthlyTracking && showMonthly) {
          // Monthly tracking format
          m1Cell = formatMonthlyStatus(item.month1)
          m2Cell = formatMonthlyStatus(item.month2)
          m3Cell = formatMonthlyStatus(item.month3)
          
          // Collect notes from all months
          const allNotes = [
            item.month1?.notes ? `Month 1: ${item.month1.notes}` : "",
            item.month2?.notes ? `Month 2: ${item.month2.notes}` : "",
            item.month3?.notes ? `Month 3: ${item.month3.notes}` : "",
          ].filter(n => n && n.trim())
          if (allNotes.length > 0) {
            notesCell = `<em>${allNotes.join("; ")}</em>`
          }
        } else if (item.status) {
          // Old single status format - show in Month 1 column
          const statusBadge = {
            compliant: '<span style="color: #16a34a; font-weight: bold;">✓ Compliant</span>',
            "non-compliant": '<span style="color: #dc2626; font-weight: bold;">✗ Non-Compliant</span>',
            na: '<span style="color: #6b7280;">N/A</span>',
          }[item.status] || `<span style="color: #6b7280;">${item.status}</span>`
          m1Cell = statusBadge
          m2Cell = '<span style="color: #9ca3af;">—</span>'
          m3Cell = '<span style="color: #9ca3af;">—</span>'
          notesCell = item.notes ? `<em>${item.notes}</em>` : ""
        } else if (item.month1) {
          // Single status mode (singleStatus sections)
          m1Cell = formatMonthlyStatus(item.month1)
          m2Cell = '<span style="color: #9ca3af;">—</span>'
          m3Cell = '<span style="color: #9ca3af;">—</span>'
          notesCell = item.month1?.notes ? `<em>${item.month1.notes}</em>` : ""
        } else {
          m1Cell = '<span style="color: #9ca3af; font-style: italic;">Not answered</span>'
          m2Cell = '<span style="color: #9ca3af;">—</span>'
          m3Cell = '<span style="color: #9ca3af;">—</span>'
        }
        
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px; font-family: monospace; font-size: 12px; color: #6b7280;">${code}</td>
            <td style="padding: 8px;">${requirement}</td>
            <td style="padding: 8px; text-align: center;">${m1Cell}</td>
            <td style="padding: 8px; text-align: center;">${m2Cell}</td>
            <td style="padding: 8px; text-align: center;">${m3Cell}</td>
            <td style="padding: 8px; font-size: 12px; color: #6b7280;">${notesCell || '<span style="color: #9ca3af;">—</span>'}</td>
          </tr>
        `
      })
      .join("")

    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">${sectionName}${isQuarterly ? ' <span style="font-size: 12px; color: #6b7280; font-weight: normal;">(Quarterly)</span>' : ''}</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; background-color: white;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151; width: 15%;">Code</th>
                <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151; width: 30%;">Requirement</th>
                <th style="padding: 10px; text-align: center; font-weight: 600; font-size: 12px; color: #374151; width: 12%;">Month 1</th>
                <th style="padding: 10px; text-align: center; font-weight: 600; font-size: 12px; color: #374151; width: 12%;">Month 2</th>
                <th style="padding: 10px; text-align: center; font-weight: 600; font-size: 12px; color: #374151; width: 12%;">Month 3</th>
                <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151; width: 19%;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
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

  // Helper to format trauma-informed care section - show ALL items in table format
  const formatTraumaInformedCare = (traumaCare: any) => {
    if (!traumaCare || !traumaCare.items || traumaCare.items.length === 0) {
      if (traumaCare && traumaCare.combinedNotes) {
        return `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Trauma-Informed Care & Training <span style="font-size: 12px; color: #6b7280; font-weight: normal;">(Quarterly)</span></h3>
            <p style="font-style: italic; white-space: pre-wrap;">${traumaCare.combinedNotes}</p>
          </div>
        `
      }
      return ""
    }
    
    // Build table rows
    const tableRows = traumaCare.items
      .map((item: any) => {
        const code = item.code || ""
        const requirement = item.requirement || ""
        
        let statusCell = '<span style="color: #9ca3af; font-style: italic;">Not answered</span>'
        
        // Check if using month1 format (single status mode)
        if (item.month1) {
          statusCell = formatMonthlyStatus(item.month1)
        } else if (item.status) {
          // Handle string status
          const statusStr = typeof item.status === 'string' ? item.status : String(item.status)
          statusCell = {
            compliant: '<span style="color: #16a34a; font-weight: bold;">✓ Compliant</span>',
            "non-compliant": '<span style="color: #dc2626; font-weight: bold;">✗ Non-Compliant</span>',
            na: '<span style="color: #6b7280;">N/A</span>',
          }[statusStr] || (statusStr && statusStr.trim() ? `<span style="color: #6b7280;">${statusStr}</span>` : '<span style="color: #9ca3af; font-style: italic;">Not answered</span>')
        }
        
        const notes = item.notes ? `<em>${item.notes}</em>` : ""
        
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px; font-family: monospace; font-size: 12px; color: #6b7280;">${code}</td>
            <td style="padding: 8px;">${requirement}</td>
            <td style="padding: 8px; text-align: center;">${statusCell}</td>
            <td style="padding: 8px; font-size: 12px; color: #6b7280;">${notes || '<span style="color: #9ca3af;">—</span>'}</td>
          </tr>
        `
      })
      .join("")
    
    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Trauma-Informed Care & Training <span style="font-size: 12px; color: #6b7280; font-weight: normal;">(Quarterly)</span></h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; background-color: white;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151; width: 20%;">Code</th>
                <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151; width: 50%;">Requirement</th>
                <th style="padding: 10px; text-align: center; font-weight: 600; font-size: 12px; color: #374151; width: 15%;">Status</th>
                <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151; width: 15%;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
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
            <p style="margin: 5px 0;"><strong>Case Manager:</strong> ${formData.visitInfo?.supervisor || "N/A"}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Visit Type:</strong> ${formData.visitInfo?.visitType || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Mode:</strong> ${formData.visitInfo?.mode || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Agency:</strong> ${formData.visitInfo?.agency || "N/A"}</p>
            <p style="margin: 5px 0;"><strong>Region:</strong> ${formData.visitInfo?.region || "N/A"}</p>
          </div>
        </div>
      </div>

      <!-- Household Information with Integrated Attendance -->
      ${formData.familyInfo?.household || formData.placements?.children ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Household Members & Attendance</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <!-- Left Column: Home Residents -->
          <div>
            ${formData.familyInfo?.household?.providers && formData.familyInfo.household.providers.length > 0 ? `
              <div style="margin-bottom: 15px;">
                <h4 style="font-size: 14px; margin-bottom: 8px;">Foster Parents/Providers:</h4>
                ${formData.familyInfo.household.providers.map((p: any) => {
                  // Check both attendees.attendance and direct attendance
                  const attendance = formData.attendees?.attendance || formData.attendance || {}
                  const isPresent = typeof attendance === 'object' 
                    ? (attendance[p.name] === true || attendance[`fosterParent_${p.name}`] === true || 
                       (Array.isArray(attendance.fosterParents) && attendance.fosterParents.some((fp: any) => fp.name === p.name && fp.present === true)))
                    : false
                  return `<p style="margin: 3px 0;">${isPresent ? '<span style="color: #16a34a; font-weight: bold;">✓ Present</span> ' : '<span style="color: #9ca3af;">○</span> '}${p.name}${p.age ? ` (Age: ${p.age})` : ""}${p.relationship ? ` - ${p.relationship}` : ""}</p>`
                }).join("")}
              </div>
            ` : ""}
            ${formData.familyInfo?.household?.biologicalChildren && formData.familyInfo.household.biologicalChildren.length > 0 ? `
              <div style="margin-bottom: 15px;">
                <h4 style="font-size: 14px; margin-bottom: 8px;">Biological Children:</h4>
                ${formData.familyInfo.household.biologicalChildren.map((c: any) => {
                  const attendance = formData.attendees?.attendance || formData.attendance || {}
                  const isPresent = typeof attendance === 'object' && !Array.isArray(attendance)
                    ? attendance[c.name] === true
                    : false
                  return `<p style="margin: 3px 0;">${isPresent ? '<span style="color: #16a34a; font-weight: bold;">✓ Present</span> ' : '<span style="color: #9ca3af;">○</span> '}${c.name}${c.age ? ` (Age: ${c.age})` : ""}</p>`
                }).join("")}
              </div>
            ` : ""}
            ${formData.familyInfo?.household?.otherMembers && formData.familyInfo.household.otherMembers.length > 0 ? `
              <div style="margin-bottom: 15px;">
                <h4 style="font-size: 14px; margin-bottom: 8px;">Other Household Members:</h4>
                ${formData.familyInfo.household.otherMembers.map((m: any) => {
                  const attendance = formData.attendees?.attendance || formData.attendance || {}
                  const isPresent = typeof attendance === 'object' && !Array.isArray(attendance)
                    ? attendance[m.name] === true
                    : false
                  return `<p style="margin: 3px 0;">${isPresent ? '<span style="color: #16a34a; font-weight: bold;">✓ Present</span> ' : '<span style="color: #9ca3af;">○</span> '}${m.name}${m.age ? ` (Age: ${m.age})` : ""}${m.relationship ? ` - ${m.relationship}` : ""}</p>`
                }).join("")}
              </div>
            ` : ""}
          </div>
          <!-- Right Column: Foster Children -->
          <div>
            ${formData.placements?.children && formData.placements.children.length > 0 ? `
              <div style="margin-bottom: 15px;">
                <h4 style="font-size: 14px; margin-bottom: 8px;">Foster Children:</h4>
                ${formData.placements.children.map((child: any) => {
                  const childName = `${child.firstName || ""} ${child.lastName || ""}`.trim() || "Unknown"
                  const attendance = formData.attendees?.attendance || formData.attendance || {}
                  const isPresent = typeof attendance === 'object' && !Array.isArray(attendance)
                    ? attendance[childName] === true
                    : false
                  return `<p style="margin: 3px 0;">${isPresent ? '<span style="color: #16a34a; font-weight: bold;">✓ Present</span> ' : '<span style="color: #9ca3af;">○</span> '}${childName}${child.age ? ` (Age: ${child.age})` : ""}</p>`
                }).join("")}
              </div>
            ` : ""}
            ${(() => {
              const attendance = formData.attendees?.attendance || formData.attendance || {}
              if (typeof attendance === 'object' && !Array.isArray(attendance)) {
                // Show any additional attendees not in household or placements
                const allKnownNames = new Set([
                  ...(formData.familyInfo?.household?.providers || []).map((p: any) => p.name),
                  ...(formData.familyInfo?.household?.biologicalChildren || []).map((c: any) => c.name),
                  ...(formData.familyInfo?.household?.otherMembers || []).map((m: any) => m.name),
                  ...(formData.placements?.children || []).map((c: any) => `${c.firstName || ""} ${c.lastName || ""}`.trim()),
                ])
                const additionalAttendees = Object.entries(attendance)
                  .filter(([name, present]: [string, any]) => present === true && !allKnownNames.has(name))
                  .map(([name, _]: [string, any]) => name)
                
                if (additionalAttendees.length > 0) {
                  return `
                    <div style="margin-bottom: 15px;">
                      <h4 style="font-size: 14px; margin-bottom: 8px;">Additional Attendees:</h4>
                      ${additionalAttendees.map((name: string) => `<p style="margin: 3px 0;"><span style="color: #16a34a; font-weight: bold;">✓ Present</span> ${name}</p>`).join("")}
                    </div>
                  `
                }
              }
              return ""
            })()}
          </div>
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
      ${(() => {
        // Check for complianceReview first, then legacy format
        const complianceReview = formData.complianceReview
        if (!complianceReview || (typeof complianceReview === 'object' && Object.keys(complianceReview).length === 0)) {
          // Check legacy format
          if (formData.medication || formData.healthSafety || formData.childrensRights || formData.traumaInformedCare) {
            return "" // Will be handled by legacy section below
          }
          // For compliance validation, show empty compliance review section
          return `
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Compliance Review</h2>
              <p style="color: #9ca3af; font-style: italic; padding: 15px; background-color: #f9fafb; border-radius: 4px;">No compliance sections were reviewed for this visit.</p>
            </div>
          `
        }
        
        // Build list of all compliance sections - ALWAYS show all expected sections for compliance validation
        const sections: string[] = []
        
        // Define all expected compliance sections
        const expectedSections = [
          { key: "medication", name: "1. Medication", showMonthly: true, isQuarterly: true },
          { key: "healthSafety", name: "2. Health & Safety", showMonthly: true, isQuarterly: true },
          { key: "childrensRights", name: "3. Children's Rights & Well-Being", showMonthly: true, isQuarterly: true },
          { key: "bedrooms", name: "4. Bedrooms and Belongings", showMonthly: true, isQuarterly: true },
          { key: "education", name: "5. Education & Life Skills", showMonthly: true, isQuarterly: true },
          { key: "indoorSpace", name: "6. Indoor Space", showMonthly: true, isQuarterly: true },
          { key: "outdoorSpace", name: "8. Outdoor Space", showMonthly: false, isQuarterly: false },
          { key: "vehicles", name: "9. Vehicles", showMonthly: false, isQuarterly: false },
          { key: "swimming", name: "10. Swimming Areas", showMonthly: false, isQuarterly: false },
          { key: "infants", name: "11. Infants", showMonthly: false, isQuarterly: false },
        ]
        
        // Always show inspections if it exists
        if (complianceReview.inspections) {
          sections.push(formatInspectionsSection(complianceReview.inspections))
        }
        
        // Show all expected sections (even if empty) for compliance validation
        expectedSections.forEach(({ key, name, showMonthly, isQuarterly }) => {
          if (complianceReview[key]) {
            sections.push(formatComplianceSection(complianceReview[key], name, showMonthly, isQuarterly))
          } else {
            // Show empty section for compliance validation
            sections.push(formatComplianceSection(null, name, showMonthly, isQuarterly))
          }
        })
        
        // Package compliance (optional)
        if (complianceReview.packageCompliance) {
          sections.push(formatPackageComplianceSection(complianceReview.packageCompliance))
        }
        
        // Filter out empty strings
        const validSections = sections.filter(s => s && s.trim())
        
        if (validSections.length === 0) {
          return `
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Compliance Review</h2>
              <p style="color: #9ca3af; font-style: italic; padding: 15px; background-color: #f9fafb; border-radius: 4px;">No compliance sections were reviewed for this visit.</p>
            </div>
          `
        }
        
        return `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Compliance Review</h2>
            ${validSections.join("")}
          </div>
        `
      })()}
      ${formData.medication || formData.healthSafety || formData.childrensRights || formData.traumaInformedCare ? `
      <!-- Compliance Review (from formData root - legacy format) -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Compliance Review</h2>
        ${formData.medication ? formatComplianceSection(formData.medication, "1. Medication") : ""}
        ${formData.healthSafety ? formatComplianceSection(formData.healthSafety, "2. Health & Safety") : ""}
        ${formData.inspections ? formatInspectionsSection(formData.inspections) : ""}
        ${formData.childrensRights ? formatComplianceSection(formData.childrensRights, "3. Children's Rights & Well-Being") : ""}
        ${formData.bedrooms ? formatComplianceSection(formData.bedrooms, "4. Bedrooms and Belongings") : ""}
        ${formData.education ? formatComplianceSection(formData.education, "5. Education & Life Skills") : ""}
        ${formData.indoorSpace ? formatComplianceSection(formData.indoorSpace, "6. Indoor Space") : ""}
        <!-- HIDDEN FOR V1: ${formData.documentation ? formatComplianceSection(formData.documentation, "7. Documentation") : ""} -->
        ${formData.outdoorSpaceCompliance || formData.outdoorSpace ? formatComplianceSection(formData.outdoorSpaceCompliance || formData.outdoorSpace, "8. Outdoor Space", false) : ""}
        <!-- HIDDEN FOR V1: ${formData.traumaInformedCare ? formatTraumaInformedCare(formData.traumaInformedCare) : ""} -->
        ${formData.vehicles ? formatComplianceSection(formData.vehicles, "9. Vehicles", false) : ""}
        ${formData.swimming ? formatComplianceSection(formData.swimming, "10. Swimming Areas", false) : ""}
        ${formData.infants ? formatComplianceSection(formData.infants, "11. Infants", false) : ""}
        ${formData.packageCompliance ? formatPackageComplianceSection(formData.packageCompliance) : ""}
        <!-- HIDDEN FOR V1: ${formData.qualityEnhancement ? formatQualityEnhancement(formData.qualityEnhancement) : ""} -->
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

      <!-- Follow-up Items -->
      ${formData.observations?.followUpItems && formData.observations.followUpItems.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Follow-up Items</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px;">
            ${formData.observations.followUpItems.map((item: any) => {
              let itemText = ""
              if (typeof item === 'string') {
                itemText = item
              } else if (typeof item === 'object' && item !== null) {
                // Handle object format
                itemText = item.description || item.text || item.item || item.name || JSON.stringify(item)
              } else {
                itemText = String(item)
              }
              return `<li style="margin: 5px 0;">${itemText}</li>`
            }).join("")}
          </ul>
        </div>
      </div>
      ` : formData.followUpItems && Array.isArray(formData.followUpItems) && formData.followUpItems.length > 0 ? `
      <!-- Follow-up Items (from formData root) -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Follow-up Items</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px;">
            ${formData.followUpItems.map((item: any) => {
              let itemText = ""
              if (typeof item === 'string') {
                itemText = item
              } else if (typeof item === 'object' && item !== null) {
                itemText = item.description || item.text || item.item || item.name || JSON.stringify(item)
              } else {
                itemText = String(item)
              }
              return `<li style="margin: 5px 0;">${itemText}</li>`
            }).join("")}
          </ul>
        </div>
      </div>
      ` : ""}

      <!-- HIDDEN FOR V1: Corrective Actions -->
      <!-- ${formData.observations?.correctiveActions && formData.observations.correctiveActions.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Corrective Actions Required</h2>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <ul style="margin: 0; padding-left: 20px;">
            ${formData.observations.correctiveActions.map((action: any) => `<li style="margin: 5px 0;">${typeof action === 'string' ? action : action.description || action}</li>`).join("")}
          </ul>
        </div>
      </div>
      ` : ""} -->

      <!-- Visit Summary -->
      ${formData.visitSummary ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Visit Summary</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          ${(() => {
            const summary = formData.visitSummary
            let html = ""
            
            // Overall Compliance Status
            if (summary.overallStatus) {
              const statusLabels: Record<string, string> = {
                "fully-compliant": "Fully Compliant",
                "substantially-compliant": "Substantially Compliant with Minor Issues",
                "corrective-action": "Corrective Action Required",
                "immediate-intervention": "Immediate Intervention Needed"
              }
              const statusColor: Record<string, string> = {
                "fully-compliant": "#16a34a",
                "substantially-compliant": "#eab308",
                "corrective-action": "#f97316",
                "immediate-intervention": "#dc2626"
              }
              html += `<p style="margin: 5px 0;"><strong>Overall Compliance Status:</strong> <span style="color: ${statusColor[summary.overallStatus] || '#374151'}; font-weight: bold;">${statusLabels[summary.overallStatus] || summary.overallStatus}</span></p>`
            }
            
            // Overall Assessment
            if (summary.overallAssessment) {
              html += `
                <div style="margin-top: 15px;">
                  <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Overall Assessment</h4>
                  <p style="white-space: pre-wrap;">${summary.overallAssessment}</p>
                </div>
              `
            }
            
            // Key Strengths
            if (summary.keyStrengths && Array.isArray(summary.keyStrengths)) {
              const strengths = summary.keyStrengths.filter((s: string) => s && s.trim())
              if (strengths.length > 0) {
                html += `
                  <div style="margin-top: 15px;">
                    <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Key Strengths Observed</h4>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                      ${strengths.map((s: string) => `<li style="margin: 3px 0;">${s}</li>`).join("")}
                    </ul>
                  </div>
                `
              }
            }
            
            // Priority Areas
            if (summary.priorityAreas && Array.isArray(summary.priorityAreas)) {
              const areas = summary.priorityAreas.filter((a: any) => a && (a.priority || a.description))
              if (areas.length > 0) {
                html += `
                  <div style="margin-top: 15px;">
                    <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Priority Areas for Next Visit</h4>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                      ${areas.map((a: any) => `<li style="margin: 3px 0;"><strong>${a.priority || "Priority"}:</strong> ${a.description || ""}</li>`).join("")}
                    </ul>
                  </div>
                `
              }
            }
            
            // Resources Provided
            if (summary.resourcesProvided) {
              if (summary.resourcesProvided.combined) {
                html += `
                  <div style="margin-top: 15px;">
                    <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Resources Provided</h4>
                    <p style="white-space: pre-wrap;">${summary.resourcesProvided.combined}</p>
                  </div>
                `
              } else {
                const resources = Object.entries(summary.resourcesProvided).filter(([k, v]: [string, any]) => v && String(v).trim() && k !== 'combined')
                if (resources.length > 0) {
                  html += `
                    <div style="margin-top: 15px;">
                      <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Resources Provided</h4>
                      <ul style="margin: 5px 0; padding-left: 20px;">
                        ${resources.map(([k, v]: [string, any]) => `<li style="margin: 3px 0;"><strong>${k.replace(/([A-Z])/g, " $1").trim()}:</strong> ${v}</li>`).join("")}
                      </ul>
                    </div>
                  `
                }
              }
            }
            
            // Next Scheduled Visit
            if (summary.nextVisit && (summary.nextVisit.date || summary.nextVisit.time || summary.nextVisit.location)) {
              html += `
                <div style="margin-top: 15px;">
                  <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Next Scheduled Visit</h4>
                  <p style="margin: 3px 0;"><strong>Type:</strong> ${summary.nextVisit.visitType || "N/A"}</p>
                  ${summary.nextVisit.date ? `<p style="margin: 3px 0;"><strong>Date:</strong> ${summary.nextVisit.date}</p>` : ""}
                  ${summary.nextVisit.time ? `<p style="margin: 3px 0;"><strong>Time:</strong> ${summary.nextVisit.time}</p>` : ""}
                  ${summary.nextVisit.location ? `<p style="margin: 3px 0;"><strong>Location:</strong> ${summary.nextVisit.location}</p>` : ""}
                </div>
              `
            }
            
            // AI Generated Summary
            if (summary.aiGeneratedSummary) {
              html += `
                <div style="margin-top: 15px; border-top: 1px solid #d1d5db; padding-top: 15px;">
                  <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">AI-Generated Summary</h4>
                  <div style="white-space: pre-wrap; font-size: 12px; background-color: white; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px;">${summary.aiGeneratedSummary}</div>
                </div>
              `
            }
            
            return html || ""
          })()}
        </div>
      </div>
      ` : formData.recommendations?.visitSummary ? `
      <!-- Legacy format -->
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

      <!-- Foster Parent Interview Section -->
      ${(() => {
        // Check both possible data structures
        const interview = formData.fosterParentInterview || formData.parentInterviews?.fosterParentInterview
        if (!interview) return ""
        
        // If it's a string, just display it
        if (typeof interview === 'string') {
          return `
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Foster Parent Interview Summary</h2>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="white-space: pre-wrap;">${interview}</p>
              </div>
            </div>
          `
        }
        
        // If it's an object, format it properly
        if (typeof interview === 'object' && interview !== null) {
          let html = `
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Foster Parent Interview Summary</h2>
          `
          
          // Children Discussed
          if (interview.childrenDiscussed && Array.isArray(interview.childrenDiscussed) && interview.childrenDiscussed.length > 0) {
            html += `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Children Discussed</h3>
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; background-color: white;">
                    <thead>
                      <tr style="background-color: #f9fafb; border-bottom: 2px solid #d1d5db;">
                        <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151;">Child Name</th>
                        <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151;">Behaviors Noted</th>
                        <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151;">Medical/Therapy</th>
                        <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151;">School Performance</th>
                        <th style="padding: 10px; text-align: left; font-weight: 600; font-size: 12px; color: #374151;">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${interview.childrenDiscussed.map((child: any) => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 8px;">${child.childName || "—"}</td>
                          <td style="padding: 8px; white-space: pre-wrap; font-size: 12px;">${child.behaviorsNoted || "—"}</td>
                          <td style="padding: 8px; white-space: pre-wrap; font-size: 12px;">${child.medicalTherapy || "—"}</td>
                          <td style="padding: 8px; white-space: pre-wrap; font-size: 12px;">${child.schoolPerformance || "—"}</td>
                          <td style="padding: 8px; white-space: pre-wrap; font-size: 12px;">${child.notes || "—"}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            `
          }
          
          // Support Needs - check for both "-" values and actual content
          if (interview.supportNeeds && typeof interview.supportNeeds === 'object') {
            const supportNeeds = interview.supportNeeds
            const needsEntries = Object.entries(supportNeeds).filter(([key, data]: [string, any]) => {
              if (!data || typeof data !== 'object') return false
              // Include if there's actual content (not just "-" or empty)
              const hasNeed = data.needIdentified && data.needIdentified.trim() && data.needIdentified !== "-"
              const hasSupport = data.supportOffered && data.supportOffered.trim() && data.supportOffered !== "-"
              return hasNeed || hasSupport || data.followUpRequired
            })
            
            if (needsEntries.length > 0) {
              html += `
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Support Needs</h3>
                  ${needsEntries.map(([area, data]: [string, any]) => {
                    const areaLabel = area.replace(/([A-Z])/g, " $1").trim()
                    return `
                      <div style="margin-bottom: 15px; padding: 10px; background-color: #f9fafb; border-radius: 4px;">
                        <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">${areaLabel}</h4>
                        ${data.needIdentified && data.needIdentified.trim() && data.needIdentified !== "-" ? `<p style="margin: 3px 0;"><strong>Need Identified:</strong> ${data.needIdentified}</p>` : ""}
                        ${data.supportOffered && data.supportOffered.trim() && data.supportOffered !== "-" ? `<p style="margin: 3px 0;"><strong>Support Offered:</strong> ${data.supportOffered}</p>` : ""}
                        ${data.followUpRequired ? `<p style="margin: 3px 0;"><strong>Follow-up Required:</strong> Yes</p>` : ""}
                      </div>
                    `
                  }).join("")}
                </div>
              `
            }
          }
          
          // Combined Notes
          if (interview.combinedNotes && interview.combinedNotes.trim()) {
            html += `
              <div style="margin-top: 15px;">
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Combined Notes</h4>
                <p style="white-space: pre-wrap; background-color: #f9fafb; padding: 10px; border-radius: 4px;">${interview.combinedNotes}</p>
              </div>
            `
          }
          
          html += `</div>`
          return html
        }
        
        return ""
      })()}

      <!-- Observations Section -->
      ${formData.observations ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Additional Observations & Comments</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          ${formData.observations.environmental ? `
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Environmental Observations</h4>
              <p style="white-space: pre-wrap; font-size: 12px;">${formData.observations.environmental}</p>
            </div>
          ` : ""}
          ${formData.observations.familyDynamics ? `
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Family Dynamics</h4>
              <p style="white-space: pre-wrap; font-size: 12px;">${formData.observations.familyDynamics}</p>
            </div>
          ` : ""}
          ${formData.observations.childInteractions ? `
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Child Interactions</h4>
              <p style="white-space: pre-wrap; font-size: 12px;">${formData.observations.childInteractions}</p>
            </div>
          ` : ""}
          ${formData.observations.complianceConcerns ? `
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Compliance Concerns</h4>
              <p style="white-space: pre-wrap; font-size: 12px;">${formData.observations.complianceConcerns}</p>
            </div>
          ` : ""}
          ${formData.observations.recommendations ? `
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Recommendations</h4>
              <p style="white-space: pre-wrap; font-size: 12px;">${formData.observations.recommendations}</p>
            </div>
          ` : ""}
          ${formData.observations.other ? `
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Other Observations</h4>
              <p style="white-space: pre-wrap; font-size: 12px;">${formData.observations.other}</p>
            </div>
          ` : ""}
        </div>
        ${formData.observations.combinedNotes ? `
          <div style="margin-top: 15px; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
            <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Combined General Observations</h4>
            <p style="white-space: pre-wrap;">${formData.observations.combinedNotes}</p>
          </div>
        ` : ""}
        ${formData.observations.observations && typeof formData.observations.observations === 'string' ? `
          <div style="margin-top: 15px; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
            <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">General Observations</h4>
            <p style="white-space: pre-wrap;">${formData.observations.observations}</p>
          </div>
        ` : ""}
      </div>
      ` : ""}

      <!-- Signatures -->
      ${formData.signatures ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Signatures</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${(() => {
            let signatureHtml = ""
            
            // Foster parent signatures (from household.providers) - handle flat structure
            if (formData.familyInfo?.household?.providers) {
              formData.familyInfo.household.providers.forEach((provider: any, index: number) => {
                const sigKey = `parent${index + 1}`
                // Handle flat structure: parent1, parent1Signature, parent1Date
                const name = formData.signatures?.[sigKey] || provider.name || `Foster Parent ${index + 1}`
                const signature = formData.signatures?.[`${sigKey}Signature`] || ""
                // Check multiple possible date field formats
                const date = formData.signatures?.[`${sigKey}Date`] || 
                            formData.signatures?.[`${sigKey}_date`] || 
                            formData.signatures?.[`${sigKey.toLowerCase()}Date`] || ""
                
                console.log(`📋 [REPORT] Foster Parent ${index + 1} signature data:`, {
                  sigKey,
                  name,
                  hasSignature: !!signature,
                  date,
                  allSignatureKeys: formData.signatures ? Object.keys(formData.signatures).filter(k => k.includes(sigKey)) : []
                })
                
                signatureHtml += formatSignatureField(
                  provider.name || `Foster Parent ${index + 1}`,
                  name,
                  signature,
                  date
                )
              })
            } else {
              // Fallback to old format (flat structure)
              const parent1Name = formData.signatures?.parent1 || ""
              const parent1Sig = formData.signatures?.parent1Signature || ""
              const parent1Date = formData.signatures?.parent1Date || ""
              
              console.log("📋 [REPORT] Parent1 signature data:", {
                name: parent1Name,
                hasSignature: !!parent1Sig,
                date: parent1Date,
                allKeys: formData.signatures ? Object.keys(formData.signatures).filter(k => k.toLowerCase().includes('parent1')) : []
              })
              
              if (parent1Name || parent1Sig) {
                signatureHtml += formatSignatureField("Foster Parent 1", parent1Name, parent1Sig, parent1Date)
              }
              
              const parent2Name = formData.signatures?.parent2 || ""
              const parent2Sig = formData.signatures?.parent2Signature || ""
              const parent2Date = formData.signatures?.parent2Date || ""
              
              console.log("📋 [REPORT] Parent2 signature data:", {
                name: parent2Name,
                hasSignature: !!parent2Sig,
                date: parent2Date,
                allKeys: formData.signatures ? Object.keys(formData.signatures).filter(k => k.toLowerCase().includes('parent2')) : []
              })
              
              if (parent2Name || parent2Sig) {
                signatureHtml += formatSignatureField("Foster Parent 2", parent2Name, parent2Sig, parent2Date)
              }
            }
            
            // Staff signature (flat structure: staff, staffSignature, staffDate)
            const staffName = formData.signatures?.staff || formData.visitInfo?.conductedBy || ""
            const staffSig = formData.signatures?.staffSignature || ""
            const staffDate = formData.signatures?.staffDate || ""
            
            console.log("📋 [REPORT] Staff signature data:", {
              name: staffName,
              hasSignature: !!staffSig,
              date: staffDate,
              allKeys: formData.signatures ? Object.keys(formData.signatures).filter(k => k.toLowerCase().includes('staff')) : []
            })
            
            if (staffName || staffSig) {
              signatureHtml += formatSignatureField(
                formData.visitInfo?.conductedBy || "Staff",
                staffName,
                staffSig,
                staffDate
              )
            }
            
            // Case Manager signature (flat structure: caseManager, caseManagerSignature, caseManagerDate)
            const caseManagerName = formData.signatures?.caseManager || formData.visitInfo?.supervisor || appointment.CaseManager || ""
            const caseManagerSig = formData.signatures?.caseManagerSignature || ""
            const caseManagerDate = formData.signatures?.caseManagerDate || ""
            
            console.log("📋 [REPORT] Case Manager signature data:", {
              name: caseManagerName,
              hasSignature: !!caseManagerSig,
              date: caseManagerDate,
              allKeys: formData.signatures ? Object.keys(formData.signatures).filter(k => k.toLowerCase().includes('casemanager')) : []
            })
            
            if (caseManagerName || caseManagerSig) {
              signatureHtml += formatSignatureField(
                "Case Manager",
                caseManagerName,
                caseManagerSig,
                caseManagerDate
              )
              
              // If case manager signature is missing, add a signature link note
              if (!caseManagerSig && appointment?.CaseManagerEmail && appointmentId) {
                // Note: Signature link will be sent separately via the signature token system
                const signatureLinkNote = `<p style="margin: 5px 0; color: #5E3989; font-weight: bold;">📝 Signature link will be sent separately to ${appointment.CaseManagerEmail}</p>`
                signatureHtml += signatureLinkNote
              }
            }
            
            return signatureHtml
          })()}
        </div>
      </div>
      ` : ""}

      <!-- Attachments -->
      ${attachments && attachments.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Attachments</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
          ${attachments.filter((att: any) => att.file_data && att.mime_type?.startsWith('image/')).map((attachment: any) => {
            const attachmentTypeLabel = attachment.attachment_type ? attachment.attachment_type.replace(/([A-Z])/g, " $1").trim() : "Photo"
            const createdDate = attachment.created_at ? format(new Date(attachment.created_at), "MMM d, yyyy h:mm a") : ""
            return `
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">${attachment.description || attachment.file_name || attachmentTypeLabel}</h4>
                ${attachment.file_data ? `
                  <div style="margin-bottom: 10px;">
                    <img src="${attachment.file_data}" alt="${attachment.description || attachment.file_name || 'Attachment'}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px;" />
                  </div>
                ` : ""}
                <p style="font-size: 11px; color: #6b7280; margin: 5px 0;">
                  ${attachmentTypeLabel}${createdDate ? ` • ${createdDate}` : ""}
                  ${attachment.created_by_name ? ` • ${attachment.created_by_name}` : ""}
                </p>
              </div>
            `
          }).join("")}
        </div>
        ${attachments.filter((att: any) => !att.file_data || !att.mime_type?.startsWith('image/')).length > 0 ? `
          <div style="margin-top: 15px;">
            <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Other Attachments</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${attachments.filter((att: any) => !att.file_data || !att.mime_type?.startsWith('image/')).map((attachment: any) => {
                const createdDate = attachment.created_at ? format(new Date(attachment.created_at), "MMM d, yyyy h:mm a") : ""
                return `<li style="margin: 5px 0;">${attachment.file_name || attachment.description || 'Attachment'}${createdDate ? ` (${createdDate})` : ""}</li>`
              }).join("")}
            </ul>
          </div>
        ` : ""}
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
  appointment?: any,
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

  if (formData.familyInfo?.household || formData.placements?.children) {
    content += `HOUSEHOLD MEMBERS & ATTENDANCE\n`
    
    // Home Residents (Left Column)
    if (formData.familyInfo?.household?.providers && formData.familyInfo.household.providers.length > 0) {
      content += `Foster Parents/Providers:\n`
      formData.familyInfo.household.providers.forEach((p: any) => {
        const isPresent = formData.attendees?.attendance && typeof formData.attendees.attendance === 'object'
          ? (formData.attendees.attendance[p.name] === true || formData.attendees.attendance[`fosterParent_${p.name}`] === true)
          : false
        content += `  ${isPresent ? "✓ " : ""}${p.name}${p.age ? ` (Age: ${p.age})` : ""}${p.relationship ? ` - ${p.relationship}` : ""}\n`
      })
    }
    if (formData.familyInfo?.household?.biologicalChildren && formData.familyInfo.household.biologicalChildren.length > 0) {
      content += `Biological Children:\n`
      formData.familyInfo.household.biologicalChildren.forEach((c: any) => {
        const isPresent = formData.attendees?.attendance && typeof formData.attendees.attendance === 'object'
          ? formData.attendees.attendance[c.name] === true
          : false
        content += `  ${isPresent ? "✓ " : ""}${c.name}${c.age ? ` (Age: ${c.age})` : ""}\n`
      })
    }
    if (formData.familyInfo?.household?.otherMembers && formData.familyInfo.household.otherMembers.length > 0) {
      content += `Other Household Members:\n`
      formData.familyInfo.household.otherMembers.forEach((m: any) => {
        const isPresent = formData.attendees?.attendance && typeof formData.attendees.attendance === 'object'
          ? formData.attendees.attendance[m.name] === true
          : false
        content += `  ${isPresent ? "✓ " : ""}${m.name}${m.age ? ` (Age: ${m.age})` : ""}${m.relationship ? ` - ${m.relationship}` : ""}\n`
      })
    }
    
    // Foster Children (Right Column)
    if (formData.placements?.children && formData.placements.children.length > 0) {
      content += `Foster Children:\n`
      formData.placements.children.forEach((child: any) => {
        const childName = `${child.firstName || ""} ${child.lastName || ""}`.trim() || "Unknown"
        const isPresent = formData.attendees?.attendance && typeof formData.attendees.attendance === 'object'
          ? formData.attendees.attendance[childName] === true
          : false
        content += `  ${isPresent ? "✓ " : ""}${childName}${child.age ? ` (Age: ${child.age})` : ""}\n`
      })
    }
    
    // Additional Attendees
    if (formData.attendees?.attendance && typeof formData.attendees.attendance === 'object') {
      const allKnownNames = new Set([
        ...(formData.familyInfo?.household?.providers || []).map((p: any) => p.name),
        ...(formData.familyInfo?.household?.biologicalChildren || []).map((c: any) => c.name),
        ...(formData.familyInfo?.household?.otherMembers || []).map((m: any) => m.name),
        ...(formData.placements?.children || []).map((c: any) => `${c.firstName || ""} ${c.lastName || ""}`.trim()),
      ])
      const additionalAttendees = Object.entries(formData.attendees.attendance)
        .filter(([name, present]: [string, any]) => present === true && !allKnownNames.has(name))
        .map(([name, _]: [string, any]) => name)
      
      if (additionalAttendees.length > 0) {
        content += `Additional Attendees:\n`
        additionalAttendees.forEach((name: string) => {
          content += `  ✓ ${name}\n`
        })
      }
    }
    
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
        let status = "Not answered"
        if (item.month1) {
          // Single status mode
          status = item.month1.na ? "N/A" : item.month1.compliant ? "Compliant" : "Not answered"
        } else if (item.status) {
          const statusStr = typeof item.status === 'string' ? item.status : String(item.status)
          status = statusStr || "Not answered"
        }
        content += `  - ${item.code || ""}${item.code && item.requirement ? ": " : ""}${item.requirement || ""} - ${status}${item.notes ? ` (${item.notes})` : ""}\n`
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
    
    // HIDDEN FOR V1: Quality Enhancement
    // if (formData.complianceReview.qualityEnhancement) {
    //   content += `Quality Enhancement:\n`
    //   if (formData.complianceReview.qualityEnhancement.activities && Array.isArray(formData.complianceReview.qualityEnhancement.activities)) {
    //     content += `  Activities: ${formData.complianceReview.qualityEnhancement.activities.join(", ")}\n`
    //   }
    //   if (formData.complianceReview.qualityEnhancement.notes) {
    //     content += `  Notes: ${formData.complianceReview.qualityEnhancement.notes}\n`
    //   }
    //   content += `\n`
    // }
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

  // Foster Parent Interview Section
  if (formData.fosterParentInterview) {
    const interview = formData.fosterParentInterview
    content += `FOSTER PARENT INTERVIEW SUMMARY\n\n`
    
    // Children Discussed
    if (interview.childrenDiscussed && Array.isArray(interview.childrenDiscussed) && interview.childrenDiscussed.length > 0) {
      content += `Children Discussed:\n`
      interview.childrenDiscussed.forEach((child: any) => {
        content += `  ${child.childName || "—"}\n`
        if (child.behaviorsNoted) content += `    Behaviors Noted: ${child.behaviorsNoted}\n`
        if (child.medicalTherapy) content += `    Medical/Therapy: ${child.medicalTherapy}\n`
        if (child.schoolPerformance) content += `    School Performance: ${child.schoolPerformance}\n`
        if (child.notes) content += `    Notes: ${child.notes}\n`
        content += `\n`
      })
    }
    
    // Support Needs
    if (interview.supportNeeds && typeof interview.supportNeeds === 'object') {
      const needsEntries = Object.entries(interview.supportNeeds).filter(([key, data]: [string, any]) => 
        data && (data.needIdentified || data.supportOffered || data.followUpRequired)
      )
      if (needsEntries.length > 0) {
        content += `Support Needs:\n`
        needsEntries.forEach(([area, data]: [string, any]) => {
          const areaLabel = area.replace(/([A-Z])/g, " $1").trim()
          content += `  ${areaLabel}:\n`
          if (data.needIdentified) content += `    Need Identified: ${data.needIdentified}\n`
          if (data.supportOffered) content += `    Support Offered: ${data.supportOffered}\n`
          if (data.followUpRequired) content += `    Follow-up Required: Yes\n`
          content += `\n`
        })
      }
    }
    
    if (interview.combinedNotes) {
      content += `Combined Notes: ${interview.combinedNotes}\n\n`
    }
  } else if (formData.parentInterviews?.fosterParentInterview) {
    content += `FOSTER PARENT INTERVIEW\n`
    const interview = formData.parentInterviews.fosterParentInterview
    content += `${typeof interview === 'string' ? interview : JSON.stringify(interview, null, 2)}\n\n`
  }

  // Observations Section
  if (formData.observations) {
    const hasObservations = formData.observations.environmental || formData.observations.familyDynamics || 
                          formData.observations.childInteractions || formData.observations.complianceConcerns ||
                          formData.observations.recommendations || formData.observations.other || 
                          formData.observations.combinedNotes
    if (hasObservations) {
      content += `ADDITIONAL OBSERVATIONS & COMMENTS\n\n`
      if (formData.observations.environmental) {
        content += `Environmental Observations: ${formData.observations.environmental}\n\n`
      }
      if (formData.observations.familyDynamics) {
        content += `Family Dynamics: ${formData.observations.familyDynamics}\n\n`
      }
      if (formData.observations.childInteractions) {
        content += `Child Interactions: ${formData.observations.childInteractions}\n\n`
      }
      if (formData.observations.complianceConcerns) {
        content += `Compliance Concerns: ${formData.observations.complianceConcerns}\n\n`
      }
      if (formData.observations.recommendations) {
        content += `Recommendations: ${formData.observations.recommendations}\n\n`
      }
      if (formData.observations.other) {
        content += `Other Observations: ${formData.observations.other}\n\n`
      }
      if (formData.observations.combinedNotes) {
        content += `Combined General Observations: ${formData.observations.combinedNotes}\n\n`
      }
    }
  }

  if (formData.observations?.followUpItems && formData.observations.followUpItems.length > 0) {
    content += `FOLLOW-UP ITEMS\n`
    formData.observations.followUpItems.forEach((item: any) => {
      content += `  - ${typeof item === 'string' ? item : item.description || item}\n`
    })
    content += `\n`
  }

  // HIDDEN FOR V1: Corrective Actions
  // if (formData.observations?.correctiveActions && formData.observations.correctiveActions.length > 0) {
  //   content += `CORRECTIVE ACTIONS REQUIRED\n`
  //   formData.observations.correctiveActions.forEach((action: any) => {
  //     content += `  - ${typeof action === 'string' ? action : action.description || action}\n`
  //   })
  //   content += `\n`
  // }

  // Visit Summary Section
  if (formData.visitSummary) {
    const summary = formData.visitSummary
    content += `VISIT SUMMARY\n\n`
    
    if (summary.overallStatus) {
      const statusLabels: Record<string, string> = {
        "fully-compliant": "Fully Compliant",
        "substantially-compliant": "Substantially Compliant with Minor Issues",
        "corrective-action": "Corrective Action Required",
        "immediate-intervention": "Immediate Intervention Needed"
      }
      content += `Overall Compliance Status: ${statusLabels[summary.overallStatus] || summary.overallStatus}\n\n`
    }
    
    if (summary.overallAssessment) {
      content += `Overall Assessment: ${summary.overallAssessment}\n\n`
    }
    
    if (summary.keyStrengths && Array.isArray(summary.keyStrengths)) {
      const strengths = summary.keyStrengths.filter((s: string) => s && s.trim())
      if (strengths.length > 0) {
        content += `Key Strengths Observed:\n`
        strengths.forEach((s: string) => content += `  - ${s}\n`)
        content += `\n`
      }
    }
    
    if (summary.priorityAreas && Array.isArray(summary.priorityAreas)) {
      const areas = summary.priorityAreas.filter((a: any) => a && (a.priority || a.description))
      if (areas.length > 0) {
        content += `Priority Areas for Next Visit:\n`
        areas.forEach((a: any) => content += `  - ${a.priority || "Priority"}: ${a.description || ""}\n`)
        content += `\n`
      }
    }
    
    if (summary.resourcesProvided) {
      if (summary.resourcesProvided.combined) {
        content += `Resources Provided: ${summary.resourcesProvided.combined}\n\n`
      } else {
        const resources = Object.entries(summary.resourcesProvided).filter(([k, v]: [string, any]) => v && String(v).trim() && k !== 'combined')
        if (resources.length > 0) {
          content += `Resources Provided:\n`
          resources.forEach(([k, v]: [string, any]) => {
            const keyLabel = k.replace(/([A-Z])/g, " $1").trim()
            content += `  - ${keyLabel}: ${v}\n`
          })
          content += `\n`
        }
      }
    }
    
    if (summary.nextVisit && (summary.nextVisit.date || summary.nextVisit.time || summary.nextVisit.location)) {
      content += `Next Scheduled Visit:\n`
      content += `  Type: ${summary.nextVisit.visitType || "N/A"}\n`
      if (summary.nextVisit.date) content += `  Date: ${summary.nextVisit.date}\n`
      if (summary.nextVisit.time) content += `  Time: ${summary.nextVisit.time}\n`
      if (summary.nextVisit.location) content += `  Location: ${summary.nextVisit.location}\n`
      content += `\n`
    }
    
    if (summary.aiGeneratedSummary) {
      content += `AI-Generated Summary:\n${summary.aiGeneratedSummary}\n\n`
    }
  } else if (formData.recommendations?.visitSummary) {
    // Legacy format
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

  if (formData.observations?.observations && typeof formData.observations.observations === 'string') {
    content += `GENERAL OBSERVATIONS\n`
    content += `${formData.observations.observations}\n\n`
  }

  if (formData.signatures) {
    content += `SIGNATURES\n`
    
    // Foster parent signatures (from household.providers) - handle flat structure
    if (formData.familyInfo?.household?.providers) {
      formData.familyInfo.household.providers.forEach((provider: any, index: number) => {
        const sigKey = `parent${index + 1}`
        // Handle flat structure: parent1, parent1Signature, parent1Date
        const name = formData.signatures[sigKey] || provider.name || `Foster Parent ${index + 1}`
        const signature = formData.signatures[`${sigKey}Signature`] || ""
        const date = formData.signatures[`${sigKey}Date`] || ""
        content += `${name}:`
        if (date) content += ` (Date: ${date})`
        if (signature) content += ` [Signature: ${signature.length > 100 ? 'Image data present' : signature}]`
        content += `\n`
      })
    } else {
      // Fallback to old format (flat structure)
      const parent1Name = formData.signatures.parent1 || ""
      const parent1Sig = formData.signatures.parent1Signature || ""
      const parent1Date = formData.signatures.parent1Date || ""
      if (parent1Name || parent1Sig) {
        content += `Foster Parent 1: ${parent1Name}`
        if (parent1Date) content += ` (Date: ${parent1Date})`
        if (parent1Sig) content += ` [Signature: ${parent1Sig.length > 100 ? 'Image data present' : parent1Sig}]`
        content += `\n`
      }
      
      const parent2Name = formData.signatures.parent2 || ""
      const parent2Sig = formData.signatures.parent2Signature || ""
      const parent2Date = formData.signatures.parent2Date || ""
      if (parent2Name || parent2Sig) {
        content += `Foster Parent 2: ${parent2Name}`
        if (parent2Date) content += ` (Date: ${parent2Date})`
        if (parent2Sig) content += ` [Signature: ${parent2Sig.length > 100 ? 'Image data present' : parent2Sig}]`
        content += `\n`
      }
    }
    
    // Staff signature (flat structure: staff, staffSignature, staffDate)
    const staffName = formData.signatures.staff || formData.visitInfo?.conductedBy || ""
    const staffSig = formData.signatures.staffSignature || ""
    const staffDate = formData.signatures.staffDate || ""
    if (staffName || staffSig) {
      content += `${staffName}:`
      if (staffDate) content += ` (Date: ${staffDate})`
      if (staffSig) content += ` [Signature: ${staffSig.length > 100 ? 'Image data present' : staffSig}]`
      content += `\n`
    }
    
    // Case Manager signature (flat structure: caseManager, caseManagerSignature, caseManagerDate)
    const caseManagerName = formData.signatures.caseManager || formData.visitInfo?.supervisor || appointment.CaseManager || ""
    const caseManagerSig = formData.signatures.caseManagerSignature || ""
    const caseManagerDate = formData.signatures.caseManagerDate || ""
    if (caseManagerName || caseManagerSig) {
      content += `${caseManagerName || "Case Manager"}:`
      if (caseManagerDate) content += ` (Date: ${caseManagerDate})`
      if (caseManagerSig) content += ` [Signature: ${caseManagerSig.length > 100 ? 'Image data present' : caseManagerSig}]`
      if (!caseManagerSig && appointment?.CaseManagerEmail) {
        content += ` [Signature link will be sent separately to ${appointment.CaseManagerEmail}]`
      }
      content += `\n`
    }
    
    content += `\n`
  }

  content += `---\n`
  content += `Foster Home Visit Report - Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}\n`
  content += `This document contains confidential information and should be handled according to agency policies.`

  return content
}
