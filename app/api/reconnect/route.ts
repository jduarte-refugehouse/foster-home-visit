import { NextResponse } from "next/server"
import { forceReconnect, testConnection } from "@/lib/db"

// Force Node.js runtime (not Edge)
export const runtime = "nodejs"

export async function POST() {
  try {
    console.log("=== 🔄 Force reconnect requested ===")

    await forceReconnect()

    // Test the new connection
    const testResult = await testConnection()

    return NextResponse.json({
      success: testResult.success,
      message: testResult.success ? "Force reconnect successful" : "Force reconnect failed",
      testResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Force reconnect failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Force reconnect failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
