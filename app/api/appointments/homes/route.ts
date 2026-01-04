import { NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { shouldUseRadiusApiClient } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"
import { addNoCacheHeaders, DYNAMIC_ROUTE_CONFIG } from "@/lib/api-cache-utils"

export const dynamic = DYNAMIC_ROUTE_CONFIG.dynamic
export const revalidate = DYNAMIC_ROUTE_CONFIG.revalidate
export const fetchCache = DYNAMIC_ROUTE_CONFIG.fetchCache
export const runtime = "nodejs"

// GET - Fetch homes for appointment assignment
export async function GET() {
  try {
    console.log("🏠 [API] Fetching homes for appointment assignment")

    const useApiClient = shouldUseRadiusApiClient()

    let homes: any[]

    if (useApiClient) {
      // Use Radius API client for non-admin microservices
      console.log(`✅ [API] Using API client for homes (appointment assignment)`)
      
      const apiHomes = await radiusApiClient.getHomes()
      
      // Filter out homes without names and transform to expected format
      homes = apiHomes
        .filter((home) => home.name && home.name.trim() !== '')
        .map((home) => ({
          xref: home.id,
          name: home.name,
          address: home.address || "",
          fullAddress: {
            street: home.address?.split(',')[0] || "",
            city: home.City || "",
            state: home.State || "",
            zip: home.zipCode || "",
          },
          unit: home.Unit || "",
          caseManager: home.contactPersonName || "",
          phone: home.phoneNumber || "",
          caseManagerEmail: home.email || "",
          caseManagerPhone: home.contactPhone || "",
          coordinates:
            home.latitude && home.longitude && home.latitude !== 0 && home.longitude !== 0
              ? {
                  lat: Number.parseFloat(home.latitude.toString()),
                  lng: Number.parseFloat(home.longitude.toString()),
                }
              : null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    } else {
      // Direct database access for admin microservice
      console.log(`⚠️ [API] Using direct DB access for homes (admin microservice)`)
      
      homes = await query(`
        SELECT 
          Xref,
          HomeName,
          Street,
          City,
          State,
          Zip,
          Unit,
          CaseManager,
          HomePhone,
          CaseManagerEmail,
          CaseManagerPhone,
          Latitude,
          Longitude
        FROM SyncActiveHomes
        WHERE HomeName IS NOT NULL AND HomeName != ''
        ORDER BY HomeName
      `)

      homes = homes.map((home) => ({
        xref: home.Xref,
        name: home.HomeName,
        address: `${home.Street || ""}, ${home.City || ""}, ${home.State || ""} ${home.Zip || ""}`
          .trim()
          .replace(/^,\s*/, ""),
        fullAddress: {
          street: home.Street,
          city: home.City,
          state: home.State,
          zip: home.Zip,
        },
        unit: home.Unit,
        caseManager: home.CaseManager,
        phone: home.HomePhone,
        caseManagerEmail: home.CaseManagerEmail,
        caseManagerPhone: home.CaseManagerPhone,
        coordinates:
          home.Latitude && home.Longitude
            ? {
                lat: Number.parseFloat(home.Latitude),
                lng: Number.parseFloat(home.Longitude),
              }
            : null,
      }))
    }

    console.log(`✅ [API] Retrieved ${homes.length} homes`)

    const response = NextResponse.json({
      success: true,
      count: homes.length,
      homes,
      timestamp: new Date().toISOString(),
    })
    return addNoCacheHeaders(response)
  } catch (error) {
    console.error("❌ [API] Error fetching homes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
