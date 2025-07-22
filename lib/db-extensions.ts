import { query } from "./db"

export interface HomeData {
  id: number
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  contactPerson: string
  latitude: number | null
  longitude: number | null
  lastSync: Date
  unit: string
  caseManager: string
  status: string
}

export interface MapHomeData {
  id: number
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
  unit: string
  caseManager: string
  lastSync: Date
  phone: string
  email: string
  contactPerson: string
}

export async function getActiveHomes(filters?: {
  unit?: string
  caseManager?: string
  search?: string
}): Promise<HomeData[]> {
  try {
    let whereClause = "WHERE 1=1"
    const params: any[] = []

    if (filters?.unit && filters.unit !== "all") {
      whereClause += ` AND Unit = @param${params.length}`
      params.push(filters.unit)
    }

    if (filters?.caseManager && filters.caseManager !== "all") {
      whereClause += ` AND CaseManager = @param${params.length}`
      params.push(filters.caseManager)
    }

    if (filters?.search) {
      whereClause += ` AND (Name LIKE @param${params.length} OR Address LIKE @param${params.length + 1} OR ContactPerson LIKE @param${params.length + 2})`
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`)
    }

    const queryText = `
      SELECT 
        ID as id,
        Name as name,
        Address as address,
        City as city,
        State as state,
        ZipCode as zipCode,
        Phone as phone,
        Email as email,
        ContactPerson as contactPerson,
        CAST(Latitude AS FLOAT) as latitude,
        CAST(Longitude AS FLOAT) as longitude,
        LastSync as lastSync,
        Unit as unit,
        CaseManager as caseManager,
        Status as status
      FROM SyncActiveHomes 
      ${whereClause}
      ORDER BY Name
    `

    const results = await query<HomeData>(queryText, params)
    return results
  } catch (error) {
    console.error("Error fetching active homes:", error)
    throw error
  }
}

export async function getHomesForMap(): Promise<MapHomeData[]> {
  try {
    const queryText = `
      SELECT 
        ID as id,
        Name as name,
        Address as address,
        City as city,
        State as state,
        ZipCode as zipCode,
        CAST(Latitude AS FLOAT) as latitude,
        CAST(Longitude AS FLOAT) as longitude,
        Unit as unit,
        CaseManager as caseManager,
        LastSync as lastSync,
        Phone as phone,
        Email as email,
        ContactPerson as contactPerson
      FROM SyncActiveHomes 
      WHERE Latitude IS NOT NULL 
        AND Longitude IS NOT NULL 
        AND Latitude != 0 
        AND Longitude != 0
        AND Status = 'Active'
      ORDER BY Name
    `

    const results = await query<MapHomeData>(queryText)
    return results
  } catch (error) {
    console.error("Error fetching homes for map:", error)
    throw error
  }
}

export async function getHomeStats(): Promise<{
  totalHomes: number
  activeHomes: number
  homesWithCoordinates: number
  recentlyUpdated: number
}> {
  try {
    const queryText = `
      SELECT 
        COUNT(*) as totalHomes,
        SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) as activeHomes,
        SUM(CASE WHEN Latitude IS NOT NULL AND Longitude IS NOT NULL AND Latitude != 0 AND Longitude != 0 THEN 1 ELSE 0 END) as homesWithCoordinates,
        SUM(CASE WHEN LastSync >= DATEADD(day, -7, GETDATE()) THEN 1 ELSE 0 END) as recentlyUpdated
      FROM SyncActiveHomes
    `

    const results = await query(queryText)
    return (
      results[0] || {
        totalHomes: 0,
        activeHomes: 0,
        homesWithCoordinates: 0,
        recentlyUpdated: 0,
      }
    )
  } catch (error) {
    console.error("Error fetching home stats:", error)
    throw error
  }
}

export async function getUnits(): Promise<string[]> {
  try {
    const queryText = `
      SELECT DISTINCT Unit 
      FROM SyncActiveHomes 
      WHERE Unit IS NOT NULL AND Unit != ''
      ORDER BY Unit
    `

    const results = await query<{ Unit: string }>(queryText)
    return results.map((r) => r.Unit)
  } catch (error) {
    console.error("Error fetching units:", error)
    throw error
  }
}

export async function getCaseManagers(): Promise<string[]> {
  try {
    const queryText = `
      SELECT DISTINCT CaseManager 
      FROM SyncActiveHomes 
      WHERE CaseManager IS NOT NULL AND CaseManager != ''
      ORDER BY CaseManager
    `

    const results = await query<{ CaseManager: string }>(queryText)
    return results.map((r) => r.CaseManager)
  } catch (error) {
    console.error("Error fetching case managers:", error)
    throw error
  }
}
