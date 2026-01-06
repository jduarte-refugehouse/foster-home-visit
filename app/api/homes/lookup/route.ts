import { NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const xref = searchParams.get("xref")

    if (!xref) {
      return NextResponse.json(
        { success: false, error: "Missing xref parameter" },
        { status: 400 }
      )
    }

    console.log(`🔍 [API] Looking up home GUID for xref: ${xref} (type: ${typeof xref})`)

    const useApiClient = shouldUseRadiusApiClient()

    // NO DB FALLBACK - must use API client
    // NOTE: This endpoint was previously using direct DB to get GUID, but now must use API Hub
    if (!useApiClient) {
      throwIfDirectDbNotAllowed("homes/lookup endpoint")
    }

    // Use API client to lookup home
    console.log(`✅ [API] Using API client for home lookup (xref: ${xref})`)
    try {
      const result = await radiusApiClient.lookupHomeByXref(xref)
      console.log(`✅ [API] Found home via API Hub: ${result.name} (${result.guid})`)
      return NextResponse.json({
        success: true,
        guid: result.guid,
        name: result.name,
        xref: result.xref,
      })
    } catch (apiError: any) {
      console.error("❌ [API] Error from API client:", apiError)
      console.error("❌ [API] API error details:", {
        message: apiError?.message,
        status: apiError?.status,
        statusText: apiError?.statusText,
        response: apiError?.response,
      })
      throw apiError // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    console.error("❌ [API] Error looking up home GUID:", error)
    console.error("❌ [API] Error stack:", error?.stack)
    console.error("❌ [API] Error details:", {
      message: error?.message,
      status: error?.status,
      statusText: error?.statusText,
      response: error?.response,
      name: error?.name,
      constructor: error?.constructor?.name,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Failed to lookup home GUID",
        details: error?.message || "Unknown error",
        status: error?.status,
        statusText: error?.statusText,
      },
      { status: error?.status || 500 }
    )
  }
}

