import { NextResponse } from "next/server"
import { getDeploymentEnvironment, getMicroserviceCode } from "@/lib/microservice-config"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const deploymentEnv = getDeploymentEnvironment()
    const microserviceCode = getMicroserviceCode()
    const vercelEnv = process.env.VERCEL_ENV || "unknown"
    const branch = process.env.VERCEL_GIT_COMMIT_REF || undefined
    const url = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || undefined

    return NextResponse.json({
      branch,
      environment: vercelEnv,
      deploymentEnvironment: deploymentEnv,
      microserviceCode,
      url,
    })
  } catch (error) {
    console.error("Error getting deployment info:", error)
    return NextResponse.json(
      { error: "Failed to get deployment info" },
      { status: 500 }
    )
  }
}

