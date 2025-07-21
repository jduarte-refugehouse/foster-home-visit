/**
 * DATABASE EXTENSIONS
 *
 * This file extends the functionality of the locked database connection
 * WITHOUT modifying the core db.ts file.
 *
 * ✅ SAFE TO MODIFY - This file can be changed without breaking the connection
 * 🔒 IMPORTS FROM LOCKED FILES - Uses the protected connection from lib/db.ts
 *
 * Purpose: Provide additional database utilities while keeping core connection untouched
 */

import { query } from "./db"

// Type definitions for our data structures
export interface HomeRecord {
  Guid: string
  HomeName: string
  Street: string
  City: string
  State: string
  Zip: string
  Unit: string
  HomePhone: string
  CaseManager: string
  CaseManagerEmail: string
  CaseManagerPhone: string
  Latitude: number
  Longitude: number
  LastSync: string
  Xref: string
}

export interface MapHome {
  id: string
  name: string
  address: string
  City: string
  State: string
  zipCode: string
  Unit: string
  latitude: number
  longitude: number
  phoneNumber: string
  contactPersonName: string
  email: string
  contactPhone: string
  Xref: string
}

export interface FilterOptions {
  unit?: string
  caseManager?: string
}

/**
 * Get all homes for the list view
 * Uses the locked connection from lib/db.ts
 */
export async function getHomesList(): Promise<HomeRecord[]> {
  console.log("📋 [DB-EXT] Fetching homes list...")

  const homes = await query<HomeRecord>(`
    SELECT 
      Guid,
      HomeName,
      Street,
      City,
      State,
      Zip,
      Unit,
      HomePhone,
      CaseManager,
      CaseManagerEmail,
      CaseManagerPhone,
      CAST([Latitude] AS FLOAT) AS Latitude,
      CAST([Longitude] AS FLOAT) AS Longitude,
      LastSync,
      Xref
    FROM SyncActiveHomes 
    WHERE HomeName IS NOT NULL
    ORDER BY Unit, HomeName
  `)

  console.log(`📊 [DB-EXT] Retrieved ${homes.length} homes`)
  return homes
}

/**
 * Get homes for map display with filtering
 * Uses the locked connection from lib/db.ts
 */
export async function getHomesForMap(filters: FilterOptions = {}): Promise<MapHome[]> {
  console.log("🗺️ [DB-EXT] Fetching homes for map...")
  console.log(`🔍 [DB-EXT] Filters:`, filters)

  let whereClause = `
    WHERE HomeName IS NOT NULL
    AND Latitude IS NOT NULL 
    AND Longitude IS NOT NULL
    AND CAST([Latitude] AS FLOAT) != 0
    AND CAST([Longitude] AS FLOAT) != 0
  `

  // Add unit filtering if specified
  if (filters.unit && (filters.unit === "DAL" || filters.unit === "SAN")) {
    whereClause += ` AND Unit = '${filters.unit}'`
  }

  // Add case manager filtering if specified
  if (filters.caseManager && filters.caseManager !== "ALL") {
    whereClause += ` AND CaseManager = '${filters.caseManager.replace("'", "''")}'`
  }

  const homes = await query<any>(`
    SELECT 
      Guid as id,
      HomeName as name,
      Street as address,
      City,
      State,
      Zip as zipCode,
      Unit,
      CAST([Latitude] AS FLOAT) AS latitude,
      CAST([Longitude] AS FLOAT) AS longitude,
      HomePhone as phoneNumber,
      CaseManager as contactPersonName,
      CaseManagerEmail as email,
      CaseManagerPhone as contactPhone,
      Xref
    FROM SyncActiveHomes 
    ${whereClause}
    ORDER BY Unit, HomeName
  `)

  console.log(`📊 [DB-EXT] Raw query returned ${homes.length} homes`)

  // Validate coordinates
  const validHomes = homes.filter((home: any) => {
    const lat = Number(home.latitude)
    const lng = Number(home.longitude)

    const isValidLat = !isNaN(lat) && lat !== 0 && lat >= -90 && lat <= 90
    const isValidLng = !isNaN(lng) && lng !== 0 && lng >= -180 && lng <= 180

    if (!isValidLat || !isValidLng) {
      console.warn(`❌ [DB-EXT] Invalid coordinates for ${home.name}: lat=${lat}, lng=${lng}`)
      return false
    }

    return true
  })

  console.log(`✅ [DB-EXT] Filtered to ${validHomes.length} homes with valid coordinates`)
  return validHomes
}

/**
 * Get unique case managers for filter dropdown
 * Uses the locked connection from lib/db.ts
 */
export async function getCaseManagers(): Promise<string[]> {
  console.log("👤 [DB-EXT] Fetching case managers...")

  const result = await query<{ CaseManager: string }>(`
    SELECT DISTINCT CaseManager
    FROM SyncActiveHomes 
    WHERE CaseManager IS NOT NULL 
    AND CaseManager != ''
    AND HomeName IS NOT NULL
    ORDER BY CaseManager
  `)

  const caseManagers = result.map((r) => r.CaseManager).filter(Boolean)
  console.log(`👥 [DB-EXT] Found ${caseManagers.length} case managers`)
  return caseManagers
}

/**
 * Get summary statistics
 * Uses the locked connection from lib/db.ts
 */
export async function getHomesStatistics() {
  console.log("📊 [DB-EXT] Calculating statistics...")

  const stats = await query<any>(`
    SELECT 
      COUNT(*) as totalHomes,
      COUNT(CASE WHEN Unit = 'DAL' THEN 1 END) as dalHomes,
      COUNT(CASE WHEN Unit = 'SAN' THEN 1 END) as sanHomes,
      COUNT(CASE WHEN Latitude IS NOT NULL AND Longitude IS NOT NULL 
                 AND CAST([Latitude] AS FLOAT) != 0 
                 AND CAST([Longitude] AS FLOAT) != 0 THEN 1 END) as homesWithCoordinates,
      COUNT(DISTINCT CaseManager) as uniqueCaseManagers
    FROM SyncActiveHomes 
    WHERE HomeName IS NOT NULL
  `)

  return stats[0] || {}
}

/**
 * Utility function to process homes for display
 */
export function processHomesForDisplay(homes: HomeRecord[]) {
  return homes.map((home) => {
    const lat = Number(home.Latitude)
    const lng = Number(home.Longitude)

    const hasValidCoordinates =
      !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180

    return {
      ...home,
      hasCoordinates: hasValidCoordinates,
      coordinateDisplay: hasValidCoordinates ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "No coordinates",
    }
  })
}

/**
 * Utility function to group homes by unit
 */
export function groupHomesByUnit(homes: MapHome[]) {
  return homes.reduce((acc: Record<string, number>, home) => {
    const unit = home.Unit || "UNKNOWN"
    acc[unit] = (acc[unit] || 0) + 1
    return acc
  }, {})
}
