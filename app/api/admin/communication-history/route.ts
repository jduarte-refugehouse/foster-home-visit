import { type NextRequest, NextResponse } from "next/server"
import { getCommunicationHistory, getCommunicationStats } from "@/lib/communication-logging"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters for filtering
    const filters = {
      communication_type: searchParams.get("type") || undefined,
      delivery_method: searchParams.get("method") || undefined,
      status: searchParams.get("status") || undefined,
      recipient_email: searchParams.get("email") || undefined,
      recipient_phone: searchParams.get("phone") || undefined,
      date_from: searchParams.get("date_from") ? new Date(searchParams.get("date_from")!) : undefined,
      date_to: searchParams.get("date_to") ? new Date(searchParams.get("date_to")!) : undefined,
      limit: searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 50,
      offset: searchParams.get("offset") ? Number.parseInt(searchParams.get("offset")!) : 0,
    }

    // Get communication history and stats
    const [history, stats] = await Promise.all([getCommunicationHistory(filters), getCommunicationStats()])

    return NextResponse.json({
      success: true,
      data: history,
      stats: stats,
      filters: filters,
    })
  } catch (error: any) {
    console.error("Communication History API Error:", error)
    return NextResponse.json({ error: "Failed to fetch communication history: " + error.message }, { status: 500 })
  }
}
