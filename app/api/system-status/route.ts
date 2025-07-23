import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get system status information
    const systemStatus = {
      database: "Connected",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      uptime: getUptime(),
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error("Error fetching system status:", error)
    return NextResponse.json({ error: "Failed to fetch system status" }, { status: 500 })
  }
}

function getUptime(): string {
  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  return `${hours}h ${minutes}m`
}
