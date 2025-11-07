/**
 * Anthropic API Helper
 * Provides functions for AI-powered features in the home visit form
 */

/**
 * Available Anthropic Claude Model Identifiers
 * 
 * Main Supported Model IDs (as of November 2025):
 * - claude-opus-4-1
 * - claude-opus-4
 * - claude-opus-4-20250514 (currently used - matches VB.NET implementation)
 * - claude-sonnet-4
 * - claude-3-7-sonnet-latest
 * - claude-3-5-sonnet-latest
 * - claude-3-5-haiku-latest
 * - claude-3-haiku
 * 
 * Note: Model availability may vary based on API key tier and account access.
 * The current default (claude-opus-4-20250514) matches the working VB.NET implementation.
 */
export const ANTHROPIC_MODELS = {
  OPUS_4_1: "claude-opus-4-1",
  OPUS_4: "claude-opus-4",
  OPUS_4_20250514: "claude-opus-4-20250514", // Currently used - matches VB.NET
  SONNET_4: "claude-sonnet-4",
  SONNET_3_7_LATEST: "claude-3-7-sonnet-latest",
  SONNET_3_5_LATEST: "claude-3-5-sonnet-latest",
  HAIKU_3_5_LATEST: "claude-3-5-haiku-latest",
  HAIKU_3: "claude-3-haiku",
} as const

export interface AnthropicMessage {
  role: "user" | "assistant"
  content: string
}

export interface AnthropicResponse {
  content: string
  error?: string
}

/**
 * Get information about a specific Anthropic model
 * Uses the Models API endpoint: GET /v1/models/{model_id}
 * 
 * @param modelId - The model identifier or alias (e.g., "claude-opus-4-20250514")
 * @returns Model information including id, display_name, created_at, type
 */
export async function getModelInfo(modelId: string): Promise<{
  id: string
  display_name: string
  created_at: string
  type: string
} | null> {
  try {
    const apiKey = process.env.home_visit_general_key

    if (!apiKey) {
      console.error("❌ [ANTHROPIC] API key not configured")
      return null
    }

    const url = `https://api.anthropic.com/v1/models/${modelId}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    })

    if (!response.ok) {
      console.error(`❌ [ANTHROPIC] Failed to get model info: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("❌ [ANTHROPIC] Error getting model info:", error)
    return null
  }
}

/**
 * Call Anthropic API with a prompt
 * Uses the home_visit_general_key environment variable
 */
export async function callAnthropicAPI(
  messages: AnthropicMessage[],
  systemPrompt?: string,
  model?: string
): Promise<AnthropicResponse> {
  try {
    const apiKey = process.env.home_visit_general_key

    if (!apiKey) {
      console.error("❌ [ANTHROPIC] API key not configured. Please set home_visit_general_key environment variable.")
      return {
        content: "",
        error: "Anthropic API key not configured",
      }
    }

    const url = "https://api.anthropic.com/v1/messages"
    
    // Use provided model or default to OPUS_4_20250514
    const modelToUse = model || ANTHROPIC_MODELS.OPUS_4_20250514
    
    const requestBody: any = {
      model: modelToUse,
      max_tokens: 4096,
      messages,
    }

    if (systemPrompt) {
      requestBody.system = systemPrompt
    }

    console.log("🤖 [ANTHROPIC] Calling API with model:", modelToUse)
    console.log("🤖 [ANTHROPIC] API Key present:", !!apiKey, "Length:", apiKey?.length || 0)
    console.log("🤖 [ANTHROPIC] Request URL:", url)
    console.log("🤖 [ANTHROPIC] Request body (first 500 chars):", JSON.stringify(requestBody).substring(0, 500))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("🤖 [ANTHROPIC] Response status:", response.status)
    console.log("🤖 [ANTHROPIC] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("❌ [ANTHROPIC] API error:", response.status, errorData)
      return {
        content: "",
        error: `Anthropic API error: ${response.status} - ${errorData.error?.message || response.statusText}`,
      }
    }

    const data = await response.json()
    console.log("🤖 [ANTHROPIC] Response data structure:", JSON.stringify(data, null, 2).substring(0, 500))
    
    // Extract text content from response
    const content = data.content
      ?.filter((block: any) => block.type === "text")
      ?.map((block: any) => block.text)
      ?.join("\n") || ""

    console.log("✅ [ANTHROPIC] Extracted content length:", content.length)
    if (content.length === 0) {
      console.warn("⚠️ [ANTHROPIC] No content extracted from response")
    }
    
    return {
      content,
    }
  } catch (error) {
    console.error("❌ [ANTHROPIC] Error calling API:", error)
    return {
      content: "",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Generate context-aware questions for a specific field based on visit context
 */
export async function generateContextualQuestions(
  fieldType: string,
  context: {
    childName?: string
    childAge?: number
    placementDuration?: number
    previousVisitNotes?: string
    complianceStatus?: string
    visitNumber?: number
    quarter?: string
  },
  model?: string
): Promise<string[]> {
  const systemPrompt = `You are an assistant helping home visit liaisons conduct thorough, regulatory-compliant foster home visits. 
Generate specific, actionable questions that help gather required information for ${fieldType} documentation.
Focus on questions that:
1. Align with Chapter 749 and RCC requirements
2. Are appropriate for the child's age and situation
3. Help identify concerns or positive developments
4. Support service planning and placement stability

Keep questions concise, professional, and objective.`

  const contextDescription = `
Field Type: ${fieldType}
${context.childName ? `Child: ${context.childName}` : ""}
${context.childAge ? `Age: ${context.childAge}` : ""}
${context.placementDuration ? `Placement Duration: ${context.placementDuration} months` : ""}
${context.previousVisitNotes ? `Previous Visit Notes: ${context.previousVisitNotes.substring(0, 200)}...` : ""}
${context.complianceStatus ? `Compliance Status: ${context.complianceStatus}` : ""}
${context.visitNumber ? `Visit Number: ${context.visitNumber}` : ""}
${context.quarter ? `Quarter: ${context.quarter}` : ""}
`

  const messages: AnthropicMessage[] = [
    {
      role: "user",
      content: `Generate 3-5 specific questions for gathering ${fieldType} information given this context:\n\n${contextDescription}\n\nReturn only the questions, one per line, without numbering or bullets.`,
    },
  ]

  const response = await callAnthropicAPI(messages, systemPrompt)
  
  if (response.error) {
    console.error("❌ [AI-QUESTIONS] Error from Anthropic:", response.error)
    return []
  }

  if (!response.content || response.content.trim().length === 0) {
    console.error("❌ [AI-QUESTIONS] Empty response from Anthropic")
    return []
  }

  console.log("📝 [AI-QUESTIONS] Raw response:", response.content.substring(0, 200))

  // Parse questions from response (one per line)
  const questions = response.content
    .split("\n")
    .map((q) => q.trim())
    .filter((q) => q.length > 0 && !q.match(/^\d+[\.\)]/)) // Remove numbering if present
    .slice(0, 5) // Limit to 5 questions

  console.log("📝 [AI-QUESTIONS] Parsed questions:", questions.length)

  return questions
}

/**
 * Enhance a brief response to be more professional, objective, and complete
 */
export async function enhanceResponse(
  originalText: string,
  fieldType: string,
  context?: {
    childName?: string
    regulatoryRequirement?: string
  },
  model?: string
): Promise<string> {
  const systemPrompt = `You are an assistant helping home visit liaisons improve their documentation quality.
Enhance the provided response to be:
1. Professional and objective (avoid assumptions or judgments)
2. Complete with relevant details
3. Aligned with Chapter 749 and RCC documentation standards
4. Actionable for service planning

Maintain the original meaning and facts. Only expand and improve clarity, objectivity, and completeness.
Do not add information that wasn't implied or stated in the original.`

  const contextInfo = context?.regulatoryRequirement
    ? `\nRegulatory Requirement: ${context.regulatoryRequirement}`
    : ""

  const messages: AnthropicMessage[] = [
    {
      role: "user",
      content: `Enhance this ${fieldType} response to be more professional and complete:\n\n"${originalText}"${contextInfo}\n\nReturn only the enhanced response, without quotes or additional commentary.`,
    },
  ]

  const response = await callAnthropicAPI(messages, systemPrompt, model)
  
  if (response.error) {
    console.error("❌ [AI-ENHANCE] Error from Anthropic:", response.error)
    return originalText // Return original if enhancement fails
  }

  if (!response.content || response.content.trim().length === 0) {
    console.error("❌ [AI-ENHANCE] Empty response from Anthropic")
    return originalText
  }

  const enhanced = response.content.trim()
  console.log("📝 [AI-ENHANCE] Enhanced text length:", enhanced.length)
  console.log("📝 [AI-ENHANCE] Enhanced preview:", enhanced.substring(0, 200))

  return enhanced
}

