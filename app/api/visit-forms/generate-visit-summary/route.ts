import { NextRequest, NextResponse } from "next/server"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"
import { callAnthropicAPI } from "@/lib/anthropic-helper"
import { ANTHROPIC_MODELS } from "@/lib/anthropic-helper"

export const dynamic = "force-dynamic"

/**
 * POST - Generate comprehensive visit summary from form data
 * 
 * Body:
 * {
 *   formData: {
 *     visitInfo: {...},
 *     fosterHome: {...},
 *     children: [...],
 *     complianceReview: {...},
 *     observations: {...},
 *     visitSummary: {...},
 *     ...
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const headerAuth = getClerkUserIdFromRequest(request)
    
    if (!headerAuth.clerkUserId && !headerAuth.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { formData } = body

    if (!formData) {
      return NextResponse.json(
        { error: "formData is required" },
        { status: 400 }
      )
    }

    console.log("🤖 [VISIT-SUMMARY] Generating comprehensive visit summary...")

    // Extract relevant information from form data
    const visitData = {
      visitInfo: formData.visitInfo || {},
      fosterHome: formData.fosterHome || {},
      children: formData.children || [],
      placements: formData.placements || {},
      household: formData.household || {},
      complianceReview: formData.complianceReview || {},
      observations: formData.observations || {},
      visitSummary: formData.visitSummary || {},
      medication: formData.medication || {},
      inspections: formData.inspections || {},
      traumaCare: formData.traumaInformedCare || {},
      documentation: formData.documentation || {},
    }

    // Build prompt for AI - comprehensive summary
    const systemPrompt = `You are a clinical documentation assistant for foster care home visits. 
Generate a comprehensive, well-formatted summary of the entire home visit that captures all key aspects of the visit.

The summary should include:
1. **Visit Overview**: Date, type, who conducted it, and basic visit context
2. **Home Information**: Family name, license details, capacity, service levels
3. **Significant Dates**: Birthdays, placement dates, license dates, inspection expirations, upcoming deadlines
4. **Compliance Status**: Overall compliance assessment and key compliance items
5. **Observations**: Key observations about the home environment, children, and family dynamics
6. **Strengths & Concerns**: Documented strengths and areas of concern
7. **Action Items**: Follow-up items, corrective actions, and priorities for next visit
8. **Resources Provided**: Training materials, contacts, templates, and other resources shared
9. **Next Steps**: Scheduled next visit and priority areas

Format the summary with clear sections using markdown headers and bullet points.
Use a professional, clinical tone suitable for official documentation.
Be comprehensive but concise, highlighting the most important information.
Calculate ages from birth dates, time until expirations, and highlight urgent items.`

    const userPrompt = `Generate a comprehensive visit summary from this foster home visit data:

VISIT INFORMATION:
- Date: ${visitData.visitInfo.date || 'Not provided'}
- Time: ${visitData.visitInfo.time || 'Not provided'}
- Quarter: ${visitData.visitInfo.quarter || 'Not provided'}
- Visit Number: ${visitData.visitInfo.visitNumberThisQuarter || 1}
- Visit Type: ${visitData.visitInfo.visitType || 'Not provided'}
- Conducted By: ${visitData.visitInfo.conductedBy || 'Not provided'}
- Staff Title: ${visitData.visitInfo.staffTitle || 'Not provided'}

FOSTER HOME INFORMATION:
- Family Name: ${visitData.fosterHome.familyName || 'Not provided'}
- Home ID: ${visitData.fosterHome.homeId || 'Not provided'}
- Address: ${visitData.fosterHome.fullAddress || visitData.fosterHome.address || 'Not provided'}
- License Type: ${visitData.fosterHome.licenseType || 'Not provided'}
- License Effective Date: ${visitData.fosterHome.licenseEffective || 'Not provided'}
- Originally Licensed: ${visitData.fosterHome.originallyLicensed || 'Not provided'}
- Total Capacity: ${visitData.fosterHome.totalCapacity || 0}
- Current Census: ${visitData.fosterHome.currentCensus || 0}
- Service Levels: ${(visitData.fosterHome.serviceLevels || []).join(', ') || 'Not provided'}

CHILDREN IN PLACEMENT:
${(visitData.children || []).map((child: any, idx: number) => `
Child ${idx + 1}:
- Name: ${child.name || 'Not provided'}
- Date of Birth: ${child.dateOfBirth || 'Not provided'}
- Age: ${child.age || 'Not provided'}
- Placement Date: ${child.placementDate || 'Not provided'}
`).join('\n') || 'No children in placement'}

COMPLIANCE REVIEW:
- Overall Status: ${visitData.visitSummary?.overallStatus || visitData.complianceReview?.overallStatus || 'Not provided'}
${visitData.complianceReview?.items ? `
Compliance Items:
${visitData.complianceReview.items.map((item: any) => `- ${item.requirement || item.code || 'Item'}: ${item.status || 'Not assessed'}`).join('\n')}
` : ''}

OBSERVATIONS:
${visitData.observations?.general ? `General: ${visitData.observations.general}` : ''}
${visitData.observations?.homeEnvironment ? `Home Environment: ${visitData.observations.homeEnvironment}` : ''}
${visitData.observations?.children ? `Children: ${visitData.observations.children}` : ''}

VISIT SUMMARY DETAILS:
- Key Strengths: ${(visitData.visitSummary?.keyStrengths || []).filter((s: string) => s).join('; ') || 'None documented'}
- Priority Areas: ${(visitData.visitSummary?.priorityAreas || []).map((p: any) => `${p.priority || ''}: ${p.description || ''}`).filter((s: string) => s).join('; ') || 'None documented'}
- Resources Provided: ${visitData.visitSummary?.resourcesProvided ? JSON.stringify(visitData.visitSummary.resourcesProvided) : 'None documented'}

FOLLOW-UP ITEMS:
${(visitData.observations?.followUpItems || []).map((item: any) => `- ${item.description || 'Item'}: Due ${item.dueDate || 'Not specified'}`).join('\n') || 'No follow-up items'}

CORRECTIVE ACTIONS:
${(visitData.observations?.correctiveActions || []).map((action: any) => `- ${action.description || 'Action'}: ${action.status || 'Pending'}`).join('\n') || 'No corrective actions'}

Generate a comprehensive summary that:
1. Provides a complete overview of the visit
2. Highlights all significant dates and deadlines
3. Summarizes compliance status and key findings
4. Documents observations and concerns
5. Outlines action items and next steps
6. Is suitable for official documentation and review

Format as markdown with clear sections and use professional clinical language.`

    const messages = [
      {
        role: "user" as const,
        content: userPrompt,
      },
    ]

    const response = await callAnthropicAPI(
      messages,
      systemPrompt,
      ANTHROPIC_MODELS.OPUS_4_20250514
    )

    if (response.wasError || !response.content) {
      console.error("❌ [VISIT-SUMMARY] AI generation failed:", response.error)
      return NextResponse.json(
        {
          success: false,
          error: response.error || "Failed to generate summary",
        },
        { status: 500 }
      )
    }

    console.log("✅ [VISIT-SUMMARY] Summary generated successfully")

    return NextResponse.json({
      success: true,
      summary: response.content,
    })
  } catch (error) {
    console.error("❌ [VISIT-SUMMARY] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate visit summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

