import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"

export async function GET() {
  try {
    const connectionTest = await testConnection()

    const diagnostics = {
      timestamp: new Date().toISOString(),
      proxy: {
        enabled: !!process.env.FIXIE_SOCKS_HOST,
        url: process.env.FIXIE_SOCKS_HOST
          ? process.env.FIXIE_SOCKS_HOST.replace(/\/\/[^:]+:[^@]+@/, "//+++++++@")
          : "Not configured",
      },
      database: connectionTest,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || "local",
      },
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("Diagnostics error:", error)
    return NextResponse.json(
      {
        error: "Failed to run diagnostics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
