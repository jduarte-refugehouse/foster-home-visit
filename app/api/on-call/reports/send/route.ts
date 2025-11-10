import { NextRequest, NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"
import { logCommunication, updateCommunicationStatus, getMicroserviceId } from "@/lib/communication-logging"
import { format } from "date-fns"
import { generateOnCallICS } from "@/lib/ics-generator"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// POST - Send on-call report via SendGrid
export async function POST(request: NextRequest) {
  let logId: string | null = null

  try {
    const { reportType, recipientEmail, reportData, onCallType } = await request.json()

    // Validate required fields
    if (!reportType || !recipientEmail || !reportData) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: reportType, recipientEmail, reportData",
        },
        { status: 400 },
      )
    }

    // Validate environment variables
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

    // Generate subject and content based on report type
    let subject: string
    let htmlContent: string
    let textContent: string

    switch (reportType) {
      case "gap":
        subject = `On-Call Coverage Gap Report - ${onCallType}`
        htmlContent = generateGapReportHTML(reportData, onCallType)
        textContent = generateGapReportText(reportData, onCallType)
        break
      case "schedule":
        subject = `30-Day On-Call Schedule - ${onCallType}`
        htmlContent = generateScheduleReportHTML(reportData, onCallType)
        textContent = generateScheduleReportText(reportData, onCallType)
        break
      case "individual":
        subject = `Your On-Call Schedule - ${onCallType}`
        htmlContent = generateIndividualReportHTML(reportData, onCallType)
        textContent = generateIndividualReportText(reportData, onCallType)
        break
      default:
        return NextResponse.json(
          { success: false, error: "Invalid report type" },
          { status: 400 },
        )
    }

    // Prepare email with optional ICS attachment for individual reports
    const msg: any = {
      to: recipientEmail,
      from: {
        email: fromEmail,
        name: "Foster Home On-Call System",
      },
      subject: subject,
      text: textContent,
      html: htmlContent,
    }

    // Add calendar attachment for individual reports
    if (reportType === "individual" && reportData.schedules) {
      try {
        const icsContent = generateOnCallICS(
          reportData.schedules,
          reportData.assignee?.name || "Assignee",
          onCallType
        )
        
        msg.attachments = [
          {
            content: Buffer.from(icsContent).toString("base64"),
            filename: `on-call-schedule-${onCallType.toLowerCase().replace(/\s+/g, "-")}.ics`,
            type: "text/calendar",
            disposition: "attachment",
          },
        ]
        
        console.log("📅 ICS calendar file attached to email")
      } catch (icsError) {
        console.error("⚠️ Failed to generate ICS attachment:", icsError)
        // Continue sending email without attachment
      }
    }

    // Log communication
    try {
      const microserviceId = await getMicroserviceId()
      logId = await logCommunication({
        microservice_id: microserviceId,
        communication_type: `on_call_report_${reportType}`,
        delivery_method: "email",
        recipient_email: recipientEmail,
        recipient_name: recipientEmail,
        subject: subject,
        message_text: textContent,
        message_html: htmlContent,
        sender_email: fromEmail,
        sender_name: "Foster Home On-Call System",
        status: "pending",
        metadata: JSON.stringify({
          report_type: reportType,
          on_call_type: onCallType,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (logError) {
      console.error("Failed to log communication:", logError)
    }

    // Send the email
    const response = await sgMail.send(msg)

    // Update log status
    if (logId) {
      try {
        await updateCommunicationStatus(logId, "sent", undefined, response[0].headers["x-message-id"], "sendgrid")
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      messageId: response[0].headers["x-message-id"],
      message: "Report emailed successfully",
    })
  } catch (error: any) {
    console.error("Email Error:", error)

    // Handle SendGrid specific errors
    if (error.response) {
      const { message, code } = error.response.body.errors?.[0] || {}
      const errorMessage = `SendGrid Error: ${message || error.message}`

      if (logId) {
        try {
          await updateCommunicationStatus(logId, "failed", errorMessage)
        } catch (updateError) {
          console.error("Failed to update log status:", updateError)
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          code: code,
        },
        { status: error.code || 500 },
      )
    }

    if (logId) {
      try {
        await updateCommunicationStatus(logId, "failed", error.message)
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email: " + error.message,
      },
      { status: 500 },
    )
  }
}

// HTML generation functions
function generateGapReportHTML(reportData: any, onCallType: string): string {
  const { gaps, coveragePercentage, schedules = [] } = reportData
  
  // Combine schedules and gaps into chronological timeline
  const timelineEvents = [
    ...schedules.map((s: any) => ({
      type: 'assignment',
      start: new Date(s.start_datetime),
      end: new Date(s.end_datetime),
      data: s,
    })),
    ...gaps.map((g: any) => ({
      type: 'gap',
      start: new Date(g.gap_start),
      end: new Date(g.gap_end),
      data: g,
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime())
  
  const timelineHTML = timelineEvents.map((event) => {
    const hours = ((event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)).toFixed(1)
    
    if (event.type === 'assignment') {
      return `
        <div style="background: linear-gradient(to right, #f3e8ff, #ffffff); border-left: 4px solid #9333ea; border-radius: 8px; padding: 16px; margin: 12px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="color: #7c3aed; font-weight: 600; font-size: 16px;">👤 ${event.data.user_name}</span>
            <span style="margin-left: auto; background: #e9d5ff; color: #7c3aed; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${hours} hours</span>
          </div>
          <p style="margin: 4px 0; color: #374151; font-size: 14px;">
            <strong>From:</strong> ${format(event.start, "EEE, MMM d 'at' h:mm a")}<br>
            <strong>To:</strong> ${format(event.end, "EEE, MMM d 'at' h:mm a")}
          </p>
          ${event.data.user_phone ? `<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 13px;">📞 ${event.data.user_phone}</p>` : ''}
        </div>
      `
    } else {
      return `
        <div style="background: linear-gradient(to right, #fee2e2, #ffffff); border-left: 4px solid #dc2626; border-radius: 8px; padding: 16px; margin: 12px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="color: #dc2626; font-weight: 600; font-size: 16px;">⚠️ COVERAGE GAP: ${event.data.gap_hours.toFixed(1)} hours</span>
            <span style="margin-left: auto; background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${event.data.severity}</span>
          </div>
          <p style="margin: 4px 0; color: #374151; font-size: 14px;">
            <strong>From:</strong> ${format(event.start, "EEE, MMM d 'at' h:mm a")}<br>
            <strong>To:</strong> ${format(event.end, "EEE, MMM d 'at' h:mm a")}
          </p>
          ${event.data.message ? `<p style="margin-top: 8px; color: #6b7280; font-size: 14px;">${event.data.message}</p>` : ''}
        </div>
      `
    }
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">On-Call Coverage Gap Report</h1>
        <p style="color: #e0e7ff; margin: 8px 0 0 0;">${onCallType}</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="background: ${coveragePercentage === 100 ? '#d1fae5' : '#fef3c7'}; border: 1px solid ${coveragePercentage === 100 ? '#6ee7b7' : '#fcd34d'}; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Coverage Status</p>
          <p style="margin: 0; font-size: 36px; font-weight: bold; color: ${coveragePercentage === 100 ? '#059669' : '#d97706'};">${coveragePercentage}%</p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">${gaps.length} gap(s) detected</p>
        </div>

        <h2 style="color: #111827; font-size: 18px; margin: 24px 0 12px 0;">Coverage Timeline</h2>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">Purple = Scheduled Coverage | Red = Gaps</p>
        ${timelineEvents.length === 0 
          ? '<p style="text-align: center; color: #6b7280; padding: 40px 0;">No events to display</p>'
          : timelineHTML
        }

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This report was generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
          <p>Foster Home On-Call System - Refuge House</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateGapReportText(reportData: any, onCallType: string): string {
  const { gaps, coveragePercentage, schedules = [] } = reportData
  
  // Combine schedules and gaps into chronological timeline
  const timelineEvents = [
    ...schedules.map((s: any) => ({
      type: 'assignment',
      start: new Date(s.start_datetime),
      end: new Date(s.end_datetime),
      data: s,
    })),
    ...gaps.map((g: any) => ({
      type: 'gap',
      start: new Date(g.gap_start),
      end: new Date(g.gap_end),
      data: g,
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime())
  
  const timelineText = timelineEvents.map((event, index) => {
    const hours = ((event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)).toFixed(1)
    
    if (event.type === 'assignment') {
      return `
[${index + 1}] ✓ SCHEDULED: ${event.data.user_name} (${hours} hours)
From: ${format(event.start, "EEE, MMM d 'at' h:mm a")}
To:   ${format(event.end, "EEE, MMM d 'at' h:mm a")}
${event.data.user_phone ? `Phone: ${event.data.user_phone}` : ''}
      `.trim()
    } else {
      return `
[${index + 1}] ⚠️ COVERAGE GAP: ${event.data.gap_hours.toFixed(1)} hours (${event.data.severity})
From: ${format(event.start, "EEE, MMM d 'at' h:mm a")}
To:   ${format(event.end, "EEE, MMM d 'at' h:mm a")}
${event.data.message ? `Note: ${event.data.message}` : ''}
      `.trim()
    }
  }).join('\n\n')

  return `
ON-CALL COVERAGE GAP REPORT
${onCallType}

COVERAGE STATUS: ${coveragePercentage}%
Gaps Detected: ${gaps.length}

COVERAGE TIMELINE (Chronological):
✓ = Scheduled Coverage | ⚠️ = Gap

${timelineEvents.length === 0 
  ? 'No events to display'
  : timelineText
}

---
Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
Foster Home On-Call System - Refuge House
  `.trim()
}

function generateScheduleReportHTML(reportData: any, onCallType: string): string {
  const { schedules, coverage } = reportData
  const schedulesList = schedules.map((schedule: any) => {
    const start = new Date(schedule.start_datetime)
    const end = new Date(schedule.end_datetime)
    return `
      <div style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 12px 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: 600; font-size: 16px; color: #111827;">${schedule.user_name}</span>
          ${schedule.priority_level === 'high' ? '<span style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">High Priority</span>' : ''}
        </div>
        <p style="margin: 4px 0; color: #374151; font-size: 14px;">
          📅 ${format(start, "EEEE, MMMM d, yyyy")}<br>
          🕐 ${format(start, "h:mm a")} - ${format(end, "h:mm a")}
        </p>
        ${schedule.user_phone ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">📞 ${schedule.user_phone}</p>` : ''}
        ${schedule.notes ? `<p style="margin-top: 8px; color: #6b7280; font-size: 14px; font-style: italic;">${schedule.notes}</p>` : ''}
      </div>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">30-Day On-Call Schedule</h1>
        <p style="color: #e0e7ff; margin: 8px 0 0 0;">${onCallType}</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Total Assignments</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #111827;">${schedules.length}</p>
          </div>
          <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Coverage</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #111827;">${coverage?.covered_percentage || 0}%</p>
          </div>
          <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Assignees</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #111827;">${new Set(schedules.map((s: any) => s.user_id)).size}</p>
          </div>
        </div>

        <h2 style="color: #111827; font-size: 18px; margin: 24px 0 12px 0;">Assignments</h2>
        ${schedulesList}

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This report was generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
          <p>Foster Home On-Call System - Refuge House</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateScheduleReportText(reportData: any, onCallType: string): string {
  const { schedules, coverage } = reportData
  const schedulesList = schedules.map((schedule: any, index: number) => {
    const start = new Date(schedule.start_datetime)
    const end = new Date(schedule.end_datetime)
    return `
${index + 1}. ${schedule.user_name}${schedule.priority_level === 'high' ? ' (HIGH PRIORITY)' : ''}
   Date: ${format(start, "EEEE, MMMM d, yyyy")}
   Time: ${format(start, "h:mm a")} - ${format(end, "h:mm a")}
   ${schedule.user_phone ? `Phone: ${schedule.user_phone}` : ''}
   ${schedule.notes ? `Notes: ${schedule.notes}` : ''}
    `.trim()
  }).join('\n\n')

  return `
30-DAY ON-CALL SCHEDULE
${onCallType}

SUMMARY:
- Total Assignments: ${schedules.length}
- Coverage: ${coverage?.covered_percentage || 0}%
- Unique Assignees: ${new Set(schedules.map((s: any) => s.user_id)).size}

ASSIGNMENTS:

${schedulesList}

---
Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
Foster Home On-Call System - Refuge House
  `.trim()
}

function generateIndividualReportHTML(reportData: any, onCallType: string): string {
  const { assignee, schedules, totalHours } = reportData
  const schedulesList = schedules.map((schedule: any, index: number) => {
    const start = new Date(schedule.start_datetime)
    const end = new Date(schedule.end_datetime)
    const hours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1)
    return `
      <div style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 12px 0;">
        <div style="display: flex; align-items: center; justify-between; margin-bottom: 8px;">
          <span style="font-weight: 600; font-size: 16px; color: #111827;">Shift ${index + 1}</span>
          <span style="background: #e0e7ff; color: #4c51bf; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${hours} hours</span>
        </div>
        <p style="margin: 4px 0; color: #374151; font-size: 14px;">
          📅 ${format(start, "EEEE, MMMM d, yyyy")}<br>
          🕐 ${format(start, "h:mm a")} - ${format(end, "h:mm a")}
        </p>
        ${schedule.notes ? `<p style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">${schedule.notes}</p>` : ''}
      </div>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your On-Call Schedule</h1>
        <p style="color: #e0e7ff; margin: 8px 0 0 0;">${onCallType}</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="background: #ede9fe; border: 1px solid #c4b5fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Assignee</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #5b21b6;">${assignee.name}</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${assignee.email}</p>
          <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px solid #c4b5fd;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Total Shifts</p>
              <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold; color: #5b21b6;">${schedules.length}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Total Hours</p>
              <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold; color: #5b21b6;">${totalHours}</p>
            </div>
          </div>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">📅 Calendar Attachment Included</p>
          <p style="margin: 8px 0 0 0; color: #047857; font-size: 13px;">
            A calendar file (.ics) is attached to this email. You can open it to automatically add these shifts to Outlook, Google Calendar, or Apple Calendar.
          </p>
        </div>

        <h2 style="color: #111827; font-size: 18px; margin: 24px 0 12px 0;">Your Shifts</h2>
        ${schedulesList}

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This report was generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
          <p>Foster Home On-Call System - Refuge House</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateIndividualReportText(reportData: any, onCallType: string): string {
  const { assignee, schedules, totalHours } = reportData
  const schedulesList = schedules.map((schedule: any, index: number) => {
    const start = new Date(schedule.start_datetime)
    const end = new Date(schedule.end_datetime)
    const hours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1)
    return `
Shift ${index + 1}: ${hours} hours
Date: ${format(start, "EEEE, MMMM d, yyyy")}
Time: ${format(start, "h:mm a")} - ${format(end, "h:mm a")}
${schedule.notes ? `Notes: ${schedule.notes}` : ''}
    `.trim()
  }).join('\n\n')

  return `
YOUR ON-CALL SCHEDULE
${onCallType}

ASSIGNEE: ${assignee.name}
Email: ${assignee.email}
Total Shifts: ${schedules.length}
Total Hours: ${totalHours}

📅 CALENDAR ATTACHMENT INCLUDED
A calendar file (.ics) is attached to this email. Open it to automatically 
add these shifts to Outlook, Google Calendar, or Apple Calendar.

YOUR SHIFTS:

${schedulesList}

---
Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
Foster Home On-Call System - Refuge House
  `.trim()
}

