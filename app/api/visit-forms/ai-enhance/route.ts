import { type NextRequest, NextResponse } from "next/server"
import { enhanceResponse } from "@/lib/anthropic-helper"
import { currentUser } from "@clerk/nextjs/server"
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
    // Authenticate user - try headers first, then session cookies
    const clerkUserId = getClerkUserIdFromRequest(request)
    const user = clerkUserId ? null : await currentUser()
    
    if (!clerkUserId && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { originalText, fieldType, context } = body

    if (!originalText || !fieldType) {
      return NextResponse.json(
        { error: "originalText and fieldType are required" },
        { status: 400 }
      )
    }

    console.log("🤖 [AI-ENHANCE] Enhancing response for:", fieldType)

    const enhanced = await enhanceResponse(originalText, fieldType, context)

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

