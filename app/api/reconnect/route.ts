import { NextResponse } from "next/server"
import { forceReconnect } from "@/lib/db"

export async function GET() {
  try {
    await forceReconnect()
    return NextResponse.json({ success: true, message: "Database connection forcefully reconnected." })
  } catch (error: any) {
    console.error("API Reconnect Error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to forcefully reconnect database." },
      { status: 500 },
    )
  }
}
