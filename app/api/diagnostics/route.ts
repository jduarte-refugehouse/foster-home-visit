import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Test basic connection
    const result = await query("SELECT 1 as test")

    // Get client IP as seen by SQL Server
    const ipResult = await query("SELECT CONNECTIONPROPERTY('client_net_address') as client_ip")

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
      testResult: result,
      clientIP: ipResult[0]?.client_ip || "Unknown",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
