import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// POST - Generate 30-day schedule report (PDF/CSV)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { onCallType, schedules, coverage } = body

    console.log("📄 Generating 30-day schedule report for:", onCallType, "- Assignments:", schedules?.length)

    // Format schedule data for report
    const scheduleData = schedules.map((schedule: any) => {
      const start = new Date(schedule.start_datetime)
      const end = new Date(schedule.end_datetime)
      return {
        assignee: schedule.user_name,
        phone: schedule.user_phone || 'N/A',
        email: schedule.user_email || 'N/A',
        startDate: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        startTime: start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        endDate: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        endTime: end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        duration: ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1) + ' hours',
        notes: schedule.notes || '',
        priority: schedule.priority_level || 'normal',
      }
    })

    // Generate CSV format (simpler than PDF, easier to implement)
    const csvHeaders = ['Assignee', 'Phone', 'Email', 'Start Date', 'Start Time', 'End Date', 'End Time', 'Duration', 'Priority', 'Notes']
    const csvRows = scheduleData.map((row: any) => [
      row.assignee,
      row.phone,
      row.email,
      row.startDate,
      row.startTime,
      row.endDate,
      row.endTime,
      row.duration,
      row.priority,
      row.notes,
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: string[]) => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // Add summary header
    const summaryHeader = [
      `On-Call Schedule Report - ${onCallType}`,
      `Generated: ${new Date().toLocaleString('en-US')}`,
      `Coverage: ${coverage?.covered_percentage || 0}% (${schedules.length} assignments)`,
      ``,
      ``,
    ].join('\n')

    const fullReport = summaryHeader + csvContent

    // TODO: For PDF generation, integrate a library like puppeteer or pdfkit
    // For now, return CSV which can be opened in Excel/Google Sheets
    
    console.log("📄 Schedule report generated:", scheduleData.length, "assignments")

    return new NextResponse(fullReport, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="on-call-schedule-${onCallType}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("❌ Error generating schedule report:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate schedule report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

