import { NextRequest, NextResponse } from "next/server"
import { getClerkUserIdFromRequest } from "@refugehouse/shared-core/auth"
import { callAnthropicAPI, ANTHROPIC_MODELS } from "@refugehouse/shared-core/anthropic"

export const dynamic = "force-dynamic"

/**
 * POST - Generate significant dates summary from form data
 * 
 * Body:
 * {
 *   formData: {
 *     fosterHome: {...},
 *     children: [...],
 *     inspections: {...},
 *     medication: {...},
 *     documentation: {...},
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

    console.log("🤖 [DATES-SUMMARY] Generating significant dates summary...")

    // Extract relevant date information from form data
    const dateInfo = {
      fosterHome: formData.fosterHome || {},
      children: formData.children || [],
      inspections: formData.inspections || {},
      medication: formData.medication || {},
      documentation: formData.documentation || {},
      traumaCare: formData.traumaCare || {},
      visitInfo: formData.visitInfo || {},
    }

    // Build prompt for AI
    const systemPrompt = `You are a clinical documentation assistant for foster care home visits. 
Generate a comprehensive, well-formatted summary of significant dates from the provided home visit data.
Focus on dates that are important for compliance, planning, and child welfare.

Format the summary with clear sections using emojis and markdown:
- 🎂 Birthdays & Ages
- 🏠 Placement Dates
- 📅 License & Certification Dates
- 🔥 Inspection Expiration Dates
- 💊 Medication Review Dates
- 📚 Training & Certification Expiration
- 📋 Documentation Due Dates
- ⚠️ Upcoming Deadlines (highlight items expiring in next 30/60/90 days)

Be specific with dates, calculate ages, time until expiration, and highlight any urgent items.
Use a professional but readable tone suitable for clinical documentation.`

    const userPrompt = `Generate a significant dates summary from this foster home visit data:

FOSTER HOME INFORMATION:
- Family Name: ${dateInfo.fosterHome.familyName || 'Not provided'}
- License Number: ${dateInfo.fosterHome.licenseNumber || 'Not provided'}
- License Expiration: ${dateInfo.fosterHome.licenseExpiration || 'Not provided'}
- License Type: ${dateInfo.fosterHome.licenseType || 'Not provided'}
- Total Capacity: ${dateInfo.fosterHome.totalCapacity || 0}
- Current Census: ${dateInfo.fosterHome.currentCensus || 0}

CHILDREN IN PLACEMENT:
${dateInfo.children.map((child: any, idx: number) => `
Child ${idx + 1}:
- Name: ${child.name || 'Not provided'}
- Date of Birth: ${child.dateOfBirth || 'Not provided'}
- Placement Date: ${child.placementDate || 'Not provided'}
- Age: ${child.age || 'Not provided'}
`).join('\n')}

INSPECTIONS:
- Fire Inspection Date: ${dateInfo.inspections.fire?.currentInspectionDate || 'Not provided'}
- Fire Inspection Expiration: ${dateInfo.inspections.fire?.expirationDate || 'Not provided'}
- Health Inspection Date: ${dateInfo.inspections.health?.currentInspectionDate || 'Not provided'}
- Health Inspection Expiration: ${dateInfo.inspections.health?.expirationDate || 'Not provided'}
- Fire Extinguisher Locations: ${JSON.stringify(dateInfo.inspections.fireExtinguishers || [])}

TRAINING & CERTIFICATIONS:
${dateInfo.traumaCare?.trainingRecords?.map((record: any) => `
- ${record.type || 'Training'}: Completed ${record.completionDate || 'Not provided'}, Expires ${record.expirationDate || 'N/A'}
`).join('\n') || 'No training records provided'}

DOCUMENTATION:
- Service Plans: ${dateInfo.documentation?.servicePlans?.map((sp: any) => `Plan dated ${sp.date || 'Not provided'}`).join(', ') || 'Not provided'}
- Medical Consenter: ${dateInfo.documentation?.medicalConsenter?.date || 'Not provided'}

VISIT INFORMATION:
- Visit Date: ${dateInfo.visitInfo.date || 'Not provided'}
- Quarter: ${dateInfo.visitInfo.quarter || 'Not provided'}
- Visit Number This Quarter: ${dateInfo.visitInfo.visitNumberThisQuarter || 1}

Generate a comprehensive summary that:
1. Lists all significant dates with context
2. Calculates ages from birth dates
3. Highlights upcoming expirations (next 30/60/90 days)
4. Identifies any missing critical dates
5. Provides actionable reminders for compliance

Format as markdown with clear sections and use emojis for visual organization.`

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
      console.error("❌ [DATES-SUMMARY] AI generation failed:", response.error)
      return NextResponse.json(
        {
          success: false,
          error: response.error || "Failed to generate summary",
        },
        { status: 500 }
      )
    }

    console.log("✅ [DATES-SUMMARY] Summary generated successfully")

    return NextResponse.json({
      success: true,
      summary: response.content,
    })
  } catch (error) {
    console.error("❌ [DATES-SUMMARY] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate dates summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

