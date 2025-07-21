import { query } from "./db"

// Types for database extensions
export interface RawHomeData {
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

export interface ProcessedHomeData extends RawHomeData {
  hasCoordinates: boolean
  coordinateDisplay: string
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
}

export interface HomesForMapFilters {
  unit?: string
  caseManager?: string
}

// Extension functions that use the locked database connection
export async function getHomesList(): Promise<RawHomeData[]> {
  console.log("🏠 [Extension] Fetching homes list from database...")

  const homes = await query(`
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

  console.log(`✅ [Extension] Retrieved ${homes.length} homes from database`)
  return homes
}

export function processHomesForDisplay(homes: RawHomeData[]): ProcessedHomeData[] {
  console.log("🔄 [Extension] Processing homes for display...")

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

export async function getHomesForMap(filters: HomesForMapFilters = {}): Promise<MapHome[]> {
  console.log("🗺️ [Extension] Fetching homes for map with filters:", filters)

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
  if (filters.caseManager) {
    whereClause += ` AND CaseManager = '${filters.caseManager.replace("'", "''")}'` // Escape single quotes
  }

  const homes = await query(`
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

  // Validate coordinates
  const validHomes = homes.filter((home: any) => {
    const lat = Number(home.latitude)
    const lng = Number(home.longitude)

    const isValidLat = !isNaN(lat) && lat !== 0 && lat >= -90 && lat <= 90
    const isValidLng = !isNaN(lng) && lng !== 0 && lng >= -180 && lng <= 180

    if (!isValidLat || !isValidLng) {
      console.warn(`❌ [Extension] Invalid coordinates for ${home.name}: lat=${lat}, lng=${lng}`)
      return false
    }

    return true
  })

  console.log(`✅ [Extension] Processed ${validHomes.length} valid homes for map`)
  return validHomes
}

export async function getCaseManagers(): Promise<string[]> {
  console.log("👤 [Extension] Fetching case managers...")

  const result = await query(`
    SELECT DISTINCT CaseManager
    FROM SyncActiveHomes 
    WHERE CaseManager IS NOT NULL 
    AND CaseManager != ''
    AND HomeName IS NOT NULL
    ORDER BY CaseManager
  `)

  const caseManagers = result.map((row: any) => row.CaseManager).filter(Boolean)
  console.log(`✅ [Extension] Found ${caseManagers.length} case managers`)
  return caseManagers
}

export function groupHomesByUnit(homes: MapHome[]): Record<string, number> {
  console.log("📊 [Extension] Grouping homes by unit...")

  const summary = homes.reduce((acc: Record<string, number>, home) => {
    const unit = home.Unit || "UNKNOWN"
    acc[unit] = (acc[unit] || 0) + 1
    return acc
  }, {})

  console.log("✅ [Extension] Unit summary:", summary)
  return summary
}

export async function getHomesStats(): Promise<{
  total: number
  withCoordinates: number
  byUnit: Record<string, number>
  byCaseManager: Record<string, number>
}> {
  console.log("📈 [Extension] Calculating homes statistics...")

  const homes = await getHomesList()
  const processedHomes = processHomesForDisplay(homes)

  const stats = {
    total: homes.length,
    withCoordinates: processedHomes.filter((h) => h.hasCoordinates).length,
    byUnit: homes.reduce((acc: Record<string, number>, home) => {
      const unit = home.Unit || "UNKNOWN"
      acc[unit] = (acc[unit] || 0) + 1
      return acc
    }, {}),
    byCaseManager: homes.reduce((acc: Record<string, number>, home) => {
      const manager = home.CaseManager || "Unassigned"
      acc[manager] = (acc[manager] || 0) + 1
      return acc
    }, {}),
  }

  console.log("✅ [Extension] Statistics calculated:", stats)
  return stats
}
