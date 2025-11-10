import { type NextRequest, NextResponse } from "next/server"
import { getModelInfo } from "@/lib/anthropic-helper"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET - Validate a model ID and get model information
 * 
 * Query params:
 *   modelId: string (e.g., "claude-opus-4-20250514")
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user - use headers only (no Clerk middleware)
    const headerAuth = getClerkUserIdFromRequest(request)
    
    if (!headerAuth.clerkUserId && !headerAuth.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get("modelId")

    if (!modelId) {
      return NextResponse.json(
        { error: "modelId query parameter is required" },
        { status: 400 }
      )
    }

    console.log("🔍 [VALIDATE-MODEL] Validating model:", modelId)

    const modelInfo = await getModelInfo(modelId)

    if (!modelInfo) {
      return NextResponse.json({
        success: false,
        error: "Model not found or invalid",
      })
    }

    return NextResponse.json({
      success: true,
      modelInfo,
    })
  } catch (error) {
    console.error("❌ [VALIDATE-MODEL] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate model",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

