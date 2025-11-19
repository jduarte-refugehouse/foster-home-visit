import { type NextRequest, NextResponse } from "next/server"
import { generateContextualQuestions } from "@/lib/anthropic-helper"
import { getClerkUserIdFromRequest } from "@refugehouse/shared-core/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST - Generate context-aware questions for a specific field
 * 
 * Body:
 * {
 *   fieldType: string (e.g., "behaviors", "school", "medical")
 *   context: {
 *     childName?: string
 *     childAge?: number
 *     placementDuration?: number
 *     previousVisitNotes?: string
 *     complianceStatus?: string
 *     visitNumber?: number
 *     quarter?: string
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
    const { fieldType, context, model } = body

    if (!fieldType) {
      return NextResponse.json(
        { error: "fieldType is required" },
        { status: 400 }
      )
    }

    console.log("🤖 [AI-QUESTIONS] Generating questions for:", fieldType, context, "using model:", model || "default")

    const questions = await generateContextualQuestions(fieldType, context || {}, model)

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate questions" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      questions,
    })
  } catch (error) {
    console.error("❌ [AI-QUESTIONS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate questions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

