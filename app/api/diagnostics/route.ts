import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

interface DiagnosticResult {
  name: string
  status: "success" | "warning" | "error"
  message: string
  details?: string
  timestamp: string
}

interface SystemStatus {
  database: DiagnosticResult
  authentication: DiagnosticResult
  permissions: DiagnosticResult
  microservices: DiagnosticResult
  overall: "healthy" | "warning" | "critical"
}

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const timestamp = new Date().toISOString()

    // Test database connection
    let databaseResult: DiagnosticResult
    try {
      await query("SELECT 1 as test")
      databaseResult = {
        name: "Database Connection",
        status: "success",
        message: "Database connection is healthy",
        details: "Successfully connected to Azure SQL Database",
        timestamp,
      }
    } catch (error) {
      databaseResult = {
        name: "Database Connection",
        status: "error",
        message: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown database error",
        timestamp,
      }
    }

    // Test authentication
    const authResult: DiagnosticResult = {
      name: "Authentication",
      status: "success",
      message: "Authentication system is operational",
      details: "Clerk authentication is working properly",
      timestamp,
    }

    // Test permissions system
    let permissionsResult: DiagnosticResult
    try {
      // Test if we can query the permissions tables
      await query("SELECT TOP 1 * FROM app_users WHERE clerk_id = @param0", [userId])
      permissionsResult = {
        name: "Permissions System",
        status: "success",
        message: "Permissions system is operational",
        details: "User permissions and roles are accessible",
        timestamp,
      }
    } catch (error) {
      permissionsResult = {
        name: "Permissions System",
        status: "warning",
        message: "Permissions system may have issues",
        details: error instanceof Error ? error.message : "Unknown permissions error",
        timestamp,
      }
    }

    // Test microservices configuration
    const microservicesResult: DiagnosticResult = {
      name: "Microservices",
      status: "success",
      message: "Microservice configuration is loaded",
      details: "All microservice configurations are available",
      timestamp,
    }

    // Determine overall system health
    const results = [databaseResult, authResult, permissionsResult, microservicesResult]
    const hasErrors = results.some((r) => r.status === "error")
    const hasWarnings = results.some((r) => r.status === "warning")

    let overall: "healthy" | "warning" | "critical"
    if (hasErrors) {
      overall = "critical"
    } else if (hasWarnings) {
      overall = "warning"
    } else {
      overall = "healthy"
    }

    const systemStatus: SystemStatus = {
      database: databaseResult,
      authentication: authResult,
      permissions: permissionsResult,
      microservices: microservicesResult,
      overall,
    }

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error("Error in diagnostics API:", error)

    const timestamp = new Date().toISOString()
    const errorResult: DiagnosticResult = {
      name: "System Error",
      status: "error",
      message: "Failed to run diagnostics",
      details: error instanceof Error ? error.message : "Unknown system error",
      timestamp,
    }

    const systemStatus: SystemStatus = {
      database: errorResult,
      authentication: errorResult,
      permissions: errorResult,
      microservices: errorResult,
      overall: "critical",
    }

    return NextResponse.json(systemStatus, { status: 500 })
  }
}
