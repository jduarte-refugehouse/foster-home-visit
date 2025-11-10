import { type NextRequest, NextResponse } from "next/server"
import { enhanceResponse } from "@/lib/anthropic-helper"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST - Enhance a brief response to be more professional and complete
 * 
 * Body:
 * {
 *   originalText: string
 *   fieldType: string (e.g., "behaviors", "school", "medical")
 *   context?: {
 *     childName?: string
 *     regulatoryRequirement?: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user - use headers only (no Clerk middleware)
    const headerAuth = getClerkUserIdFromRequest(request)
    
    if (!headerAuth.clerkUserId && !headerAuth.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { originalText, fieldType, context, model } = body

    if (!originalText || !fieldType) {
      return NextResponse.json(
        { error: "originalText and fieldType are required" },
        { status: 400 }
      )
    }

    console.log("🤖 [AI-ENHANCE] Enhancing response for:", fieldType, "using model:", model || "default")
    console.log("🤖 [AI-ENHANCE] Original text length:", originalText.length)

    // Check if API key is configured before attempting enhancement
    const apiKey = process.env.home_visit_general_key
    if (!apiKey) {
      console.error("❌ [AI-ENHANCE] API key not configured")
      return NextResponse.json(
        {
          success: false,
          error: "AI enhancement is not configured. Please contact your administrator.",
          details: "Anthropic API key (home_visit_general_key) is not set.",
        },
        { status: 503 }
      )
    }

    const enhanced = await enhanceResponse(originalText, fieldType, context, model)

    console.log("✅ [AI-ENHANCE] Enhancement successful. Enhanced text length:", enhanced.length)

    return NextResponse.json({
      success: true,
      originalText,
      enhancedText: enhanced,
    })
  } catch (error) {
    console.error("❌ [AI-ENHANCE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to enhance response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

