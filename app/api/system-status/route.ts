import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const { userId: clerkId } = auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Test database connection
    let databaseStatus = "connected"
    try {
      await query("SELECT 1 as test")
    } catch (error) {
      databaseStatus = "error"
    }

    const systemStatus = {
      database: databaseStatus,
      uptime: "Active",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error("Error fetching system status:", error)
    return NextResponse.json({ error: "Failed to fetch system status" }, { status: 500 })
  }
}
