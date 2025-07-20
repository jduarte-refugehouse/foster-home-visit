import { NextResponse } from "next/server"
import { query, healthCheck } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
  try {
    const isHealthy = await healthCheck()
    if (!isHealthy) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection unhealthy",
        },
        { status: 503 },
      )
    }

    // Fetch address components instead of coordinates
    const homesData = await query(
      "SELECT TOP 50 Guid, HomeName, Address1, City, State, Zip FROM dbo.SyncActiveHomes WHERE Address1 IS NOT NULL AND City IS NOT NULL",
    )

    // Helper function to generate mock coordinates within Texas
    const generateMockCoordinates = (seed: string) => {
      // A simple hash function to create a pseudo-random number from a string
      let hash = 0
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash |= 0 // Convert to 32bit integer
      }

      const random = (s: number) => {
        const x = Math.sin(s) * 10000
        return x - Math.floor(x)
      }

      const latMin = 28.0,
        latMax = 34.0 // Latitude range for Texas
      const lonMin = -103.0,
        lonMax = -95.0 // Longitude range for Texas

      const latitude = latMin + random(hash) * (latMax - latMin)
      const longitude = lonMin + random(hash * 2) * (lonMax - lonMin)

      return { latitude, longitude }
    }

    const homes = homesData.map((home) => {
      const { latitude, longitude } = generateMockCoordinates(home.Guid)
      return {
        Guid: home.Guid,
        HomeName: home.HomeName,
        Latitude: latitude,
        Longitude: longitude,
      }
    })

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("=== Homes for map query failed ===", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes for map",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
