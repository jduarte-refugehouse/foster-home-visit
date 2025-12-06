import { NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// POST - Send gap report via email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { onCallType, gaps, coveragePercentage } = body

    console.log("📧 Generating gap report for:", onCallType, "- Coverage:", coveragePercentage, "% - Gaps:", gaps?.length)

    // Get managers/admins to send report to
    const recipients = await query(`
      SELECT DISTINCT 
        u.email,
        u.first_name,
        u.last_name
      FROM app_users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.role_name IN ('Administrator', 'Manager')
        AND u.is_active = 1
        AND u.email IS NOT NULL
    `)

    if (recipients.length === 0) {
      console.log("⚠️ No recipients found for gap report")
      return NextResponse.json({
        success: false,
        message: "No managers or administrators found to send report to",
      }, { status: 400 })
    }

    // Format gaps for email
    const gapDetails = gaps.map((gap: any) => {
      const start = new Date(gap.gap_start)
      const end = new Date(gap.gap_end)
      return {
        start: start.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true 
        }),
        end: end.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true 
        }),
        hours: gap.gap_hours.toFixed(1),
        severity: gap.severity,
        message: gap.message,
      }
    })

    // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll log the report and return success
    
    console.log("📧 Gap Report Details:")
    console.log("Type:", onCallType)
    console.log("Coverage:", coveragePercentage, "%")
    console.log("Gaps:", JSON.stringify(gapDetails, null, 2))
    console.log("Recipients:", recipients.map(r => r.email).join(", "))

    // Simulate email sending
    // In production, replace this with actual email service call:
    /*
    await sendEmail({
      to: recipients.map(r => r.email),
      subject: `On-Call Coverage Gap Alert: ${onCallType}`,
      html: generateGapReportHTML(onCallType, coveragePercentage, gapDetails),
    })
    */

    return NextResponse.json({
      success: true,
      message: "Gap report generated successfully",
      recipients: recipients.length,
      gaps: gaps.length,
      // In development, return the data so you can see what would be emailed
      reportData: {
        onCallType,
        coveragePercentage,
        gaps: gapDetails,
        recipients: recipients.map(r => ({ email: r.email, name: `${r.first_name} ${r.last_name}` })),
      },
    })
  } catch (error) {
    console.error("❌ Error generating gap report:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate gap report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

