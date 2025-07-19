import { NextResponse } from "next/server"
import { checkDatabaseHealth } from "@/lib/database"
import { AzureDatabaseService } from "@/lib/azure/database-service"

export async function GET() {
  try {
    const isHealthy = await checkDatabaseHealth()

    if (!isHealthy) {
      return NextResponse.json({ status: "unhealthy", message: "Database connection failed" }, { status: 503 })
    }

    // Optional: Get additional Azure database metrics
    try {
      const azureService = new AzureDatabaseService()
      const metrics = await azureService.getDatabaseMetrics()

      return NextResponse.json({
        status: "healthy",
        message: "Database connection successful",
        metrics: metrics.slice(0, 5), // Return first 5 metrics
        timestamp: new Date().toISOString(),
      })
    } catch (metricsError) {
      // If metrics fail, still return healthy status for basic connection
      return NextResponse.json({
        status: "healthy",
        message: "Database connection successful (metrics unavailable)",
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Database health check failed:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        message: "Database health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    )
  }
}
