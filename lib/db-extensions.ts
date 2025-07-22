import { query } from "./db"

// ✅ SAFE EXTENSION FUNCTIONS - These extend functionality without modifying core connection
// These functions use the locked db.ts connection but don't modify it

export interface ListHome {
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
  lastSync: string // Added lastSync field
}

export interface MapHome extends ListHome {
  // Same interface for consistency
}

export interface HomeStats {
  total: number
  withCoordinates: number
  byUnit: Record<string, number>
  byCaseManager: Record<string, number>
}

/**
 * Fetch homes list with proper coordinate casting and LastSync data
 * Uses the locked database connection safely
 */
export async function fetchHomesList(filters?: {
  unit?: string
  caseManager?: string
  search?: string
}): Promise<ListHome[]> {
  console.log("🏠 [Extension] Fetching homes list from database...")

  let whereClause = "WHERE 1=1"
  const params: any[] = []

  if (filters?.unit && filters.unit !== "ALL") {
    whereClause += ` AND [Unit] = @param${params.length}`
    params.push(filters.unit)
  }

  if (filters?.caseManager && filters.caseManager !== "ALL") {
    whereClause += ` AND [CaseManager] = @param${params.length}`
    params.push(filters.caseManager)
  }

  if (filters?.search) {
    whereClause += ` AND ([HomeName] LIKE @param${params.length} OR [Street] LIKE @param${params.length + 1} OR [CaseManager] LIKE @param${params.length + 2})`
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`)
  }

  const queryText = `
    SELECT 
     [Xref] as id,
     [HomeName] as name,
     [Street] as address,
     [City],
     [State], 
     [Zip] as zipCode,
     [Unit],
     CAST([Latitude] AS FLOAT) as latitude,
     CAST([Longitude] AS FLOAT) as longitude,
     [HomePhone] as phoneNumber,
     [CaseManager] as contactPersonName,
     [CaseManagerEmail] as email,
     [CaseManagerPhone] as contactPhone,
     [LastSync] as lastSync
    FROM SyncActiveHomes 
    ${whereClause}
    ORDER BY [HomeName]
  `

  try {
    const results = await query<any>(queryText, params)
    console.log(`✅ [Extension] Retrieved ${results.length} homes from database`)

    // Process and validate results
    const processedHomes: ListHome[] = results.map((home) => ({
      id: home.id || "",
      name: home.name || "",
      address: home.address || "",
      City: home.City || "",
      State: home.State || "",
      zipCode: home.zipCode || "",
      Unit: home.Unit || "",
      latitude: typeof home.latitude === "number" && !isNaN(home.latitude) ? home.latitude : 0,
      longitude: typeof home.longitude === "number" && !isNaN(home.longitude) ? home.longitude : 0,
      phoneNumber: home.phoneNumber || "",
      contactPersonName: home.contactPersonName || "~unassigned~",
      email: home.email || "",
      contactPhone: home.contactPhone || "",
      lastSync: home.lastSync || "",
    }))

    console.log("🔄 [Extension] Processing homes for display...")
    return processedHomes
  } catch (error) {
    console.error("❌ [Extension] Error fetching homes list:", error)
    throw error
  }
}

/**
 * Fetch homes for map display with coordinate validation
 * Uses the locked database connection safely
 */
export async function getHomesForMap(filters?: {
  unit?: string
  caseManager?: string
}): Promise<MapHome[]> {
  console.log("🗺️ [Extension] Fetching homes for map display...")

  let whereClause = "WHERE [Latitude] IS NOT NULL AND [Longitude] IS NOT NULL"
  const params: any[] = []

  if (filters?.unit && filters.unit !== "ALL") {
    whereClause += ` AND [Unit] = @param${params.length}`
    params.push(filters.unit)
  }

  if (filters?.caseManager && filters.caseManager !== "ALL") {
    whereClause += ` AND [CaseManager] = @param${params.length}`
    params.push(filters.caseManager)
  }

  const queryText = `
    SELECT 
     [Xref] as id,
     [HomeName] as name,
     [Street] as address,
     [City],
     [State], 
     [Zip] as zipCode,
     [Unit],
     CAST([Latitude] AS FLOAT) as latitude,
     CAST([Longitude] AS FLOAT) as longitude,
     [HomePhone] as phoneNumber,
     [CaseManager] as contactPersonName,
     [CaseManagerEmail] as email,
     [CaseManagerPhone] as contactPhone,
     [LastSync] as lastSync
    FROM SyncActiveHomes 
    ${whereClause}
    ORDER BY [HomeName]
  `

  try {
    const results = await query<any>(queryText, params)
    console.log(`✅ [Extension] Retrieved ${results.length} homes for map`)

    // Filter out homes with invalid coordinates
    const validHomes = results
      .filter((home) => {
        const lat = typeof home.latitude === "number" ? home.latitude : Number.parseFloat(String(home.latitude))
        const lng = typeof home.longitude === "number" ? home.longitude : Number.parseFloat(String(home.longitude))

        const isValidLat = !isNaN(lat) && lat >= -90 && lat <= 90
        const isValidLng = !isNaN(lng) && lng >= -180 && lng <= 180

        if (!isValidLat || !isValidLng) {
          console.log(`⚠️ [Extension] Invalid coordinates for ${home.name}: ${lat}, ${lng}`)
          return false
        }
        return true
      })
      .map((home) => ({
        id: home.id || "",
        name: home.name || "",
        address: home.address || "",
        City: home.City || "",
        State: home.State || "",
        zipCode: home.zipCode || "",
        Unit: home.Unit || "",
        latitude: typeof home.latitude === "number" ? home.latitude : Number.parseFloat(String(home.latitude)),
        longitude: typeof home.longitude === "number" ? home.longitude : Number.parseFloat(String(home.longitude)),
        phoneNumber: home.phoneNumber || "",
        contactPersonName: home.contactPersonName || "~unassigned~",
        email: home.email || "",
        contactPhone: home.contactPhone || "",
        lastSync: home.lastSync || "",
      }))

    console.log(`🔄 [Extension] Processed ${validHomes.length} valid homes for map`)
    return validHomes
  } catch (error) {
    console.error("❌ [Extension] Error fetching homes for map:", error)
    throw error
  }
}

/**
 * Calculate statistics about homes
 * Uses the locked database connection safely
 */
export async function getHomeStats(): Promise<HomeStats> {
  console.log("📈 [Extension] Calculating homes statistics...")

  const homes = await fetchHomesList()

  const stats: HomeStats = {
    total: homes.length,
    withCoordinates: homes.filter((h) => h.latitude !== 0 && h.longitude !== 0).length,
    byUnit: {},
    byCaseManager: {},
  }

  // Calculate unit distribution
  homes.forEach((home) => {
    stats.byUnit[home.Unit] = (stats.byUnit[home.Unit] || 0) + 1
  })

  // Calculate case manager distribution
  homes.forEach((home) => {
    const manager = home.contactPersonName || "~unassigned~"
    stats.byCaseManager[manager] = (stats.byCaseManager[manager] || 0) + 1
  })

  console.log("✅ [Extension] Statistics calculated:", stats)
  return stats
}

/**
 * Get unique case managers for filtering
 * Uses the locked database connection safely
 */
export async function getUniqueCaseManagers(): Promise<string[]> {
  console.log("👥 [Extension] Fetching unique case managers...")

  const queryText = `
    SELECT DISTINCT [CaseManager] as manager
    FROM SyncActiveHomes 
    WHERE [CaseManager] IS NOT NULL
    ORDER BY [CaseManager]
  `

  try {
    const results = await query<{ manager: string }>(queryText)
    const managers = results.map((r) => r.manager || "~unassigned~").filter((m) => m.trim() !== "")
    console.log(`✅ [Extension] Found ${managers.length} unique case managers`)
    return managers
  } catch (error) {
    console.error("❌ [Extension] Error fetching case managers:", error)
    return []
  }
}

// Legacy compatibility exports
export const calculateHomesStats = getHomeStats
export const getHomesStatistics = getHomeStats
export const fetchHomesForMap = getHomesForMap

// Original interface exports for backward compatibility
export interface Home {
  id: number
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  capacity: number
  current_residents: number
  license_number: string
  license_expiry: Date
  status: string
  latitude?: number
  longitude?: number
  last_visit?: Date
  next_visit?: Date
  created_at: Date
  updated_at: Date
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  permissions: string[]
  created_at: Date
  updated_at: Date
}

export interface Visit {
  id: number
  home_id: number
  user_id: string
  visit_date: Date
  visit_type: string
  status: string
  notes: string
  created_at: Date
  updated_at: Date
}

// Legacy functions for backward compatibility
export async function getAllHomes(): Promise<Home[]> {
  try {
    const homes = await fetchHomesList()
    return homes.map((home) => ({
      id: Number.parseInt(home.id) || 0,
      name: home.name,
      address: home.address,
      city: home.City,
      state: home.State,
      zip: home.zipCode,
      phone: home.phoneNumber,
      email: home.email,
      capacity: 0,
      current_residents: 0,
      license_number: "",
      license_expiry: new Date(),
      status: "active",
      latitude: home.latitude,
      longitude: home.longitude,
      last_visit: undefined,
      next_visit: undefined,
      created_at: new Date(),
      updated_at: new Date(),
    }))
  } catch (error) {
    console.error("Error in getAllHomes:", error)
    return []
  }
}

export async function getActiveHomes(): Promise<Home[]> {
  return getAllHomes()
}

export async function testConnection(): Promise<boolean> {
  try {
    await fetchHomesList()
    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}
