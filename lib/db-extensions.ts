import { query } from "./db"

export interface HomeForMap {
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

export interface HomeForList {
  id: string
  name: string
  address: string
  City: string
  State: string
  zipCode: string
  Unit: string
  phoneNumber: string
  contactPersonName: string
  email: string
  contactPhone: string
  latitude: number
  longitude: number
  lastSync: string
}

export interface FilterOptions {
  unit?: string
  caseManager?: string
}

export async function fetchHomesForMap(filters: FilterOptions = {}): Promise<HomeForMap[]> {
  console.log("🏠 [Extension] Fetching homes for map from database...")

  let whereClause = "WHERE CAST([Latitude] AS FLOAT) IS NOT NULL AND CAST([Longitude] AS FLOAT) IS NOT NULL"
  const conditions: string[] = []

  if (filters.unit) {
    conditions.push(`[Unit] = '${filters.unit}'`)
  }

  if (filters.caseManager) {
    conditions.push(`[CaseManager] = '${filters.caseManager}'`)
  }

  if (conditions.length > 0) {
    whereClause += " AND " + conditions.join(" AND ")
  }

  const sqlQuery = `
    SELECT 
      [Guid] AS id,
      [HomeName] AS name,
      [Street] AS address,
      [City],
      [State], 
      [Zip] AS zipCode,
      [Unit],
      CAST([Latitude] AS FLOAT) AS latitude,
      CAST([Longitude] AS FLOAT) AS longitude,
      [HomePhone] AS phoneNumber,
      [CaseManager] AS contactPersonName,
      [CaseManagerEmail] AS email,
      [CaseManagerPhone] AS contactPhone
    FROM [SyncActiveHomes]
    ${whereClause}
    ORDER BY [HomeName]
  `

  const results = await query<any>(sqlQuery)

  const homes: HomeForMap[] = results.map((row) => ({
    id: row.id || "",
    name: row.name || "",
    address: row.address || "",
    City: row.City || "",
    State: row.State || "",
    zipCode: row.zipCode || "",
    Unit: row.Unit || "",
    latitude: Number.parseFloat(row.latitude) || 0,
    longitude: Number.parseFloat(row.longitude) || 0,
    phoneNumber: row.phoneNumber || "",
    contactPersonName: row.contactPersonName || "~unassigned~",
    email: row.email || "",
    contactPhone: row.contactPhone || "",
  }))

  console.log(`✅ [Extension] Retrieved ${homes.length} homes for map`)
  return homes
}

export async function fetchHomesForList(filters: FilterOptions = {}): Promise<HomeForList[]> {
  console.log("🏠 [Extension] Fetching homes list from database...")

  let whereClause = "WHERE 1=1"
  const conditions: string[] = []

  if (filters.unit) {
    conditions.push(`[Unit] = '${filters.unit}'`)
  }

  if (filters.caseManager) {
    conditions.push(`[CaseManager] = '${filters.caseManager}'`)
  }

  if (conditions.length > 0) {
    whereClause += " AND " + conditions.join(" AND ")
  }

  const sqlQuery = `
    SELECT 
      [Guid] AS id,
      [HomeName] AS name,
      [Street] AS address,
      [City],
      [State],
      [Zip] AS zipCode,
      [Unit],
      [HomePhone] AS phoneNumber,
      [CaseManager] AS contactPersonName,
      [CaseManagerEmail] AS email,
      [CaseManagerPhone] AS contactPhone,
      CAST([Latitude] AS FLOAT) AS latitude,
      CAST([Longitude] AS FLOAT) AS longitude,
      [LastSync] AS lastSync
    FROM [SyncActiveHomes]
    ${whereClause}
    ORDER BY [HomeName]
  `

  const results = await query<any>(sqlQuery)

  const homes: HomeForList[] = results.map((row) => ({
    id: row.id || "",
    name: row.name || "",
    address: row.address || "",
    City: row.City || "",
    State: row.State || "",
    zipCode: row.zipCode || "",
    Unit: row.Unit || "",
    phoneNumber: row.phoneNumber || "",
    contactPersonName: row.contactPersonName || "~unassigned~",
    email: row.email || "",
    contactPhone: row.contactPhone || "",
    latitude: Number.parseFloat(row.latitude) || 0,
    longitude: Number.parseFloat(row.longitude) || 0,
    lastSync: row.lastSync || "",
  }))

  console.log(`✅ [Extension] Retrieved ${homes.length} homes for list`)
  return homes
}

export async function getUniqueCaseManagers(): Promise<string[]> {
  console.log("👥 [Extension] Fetching unique case managers...")

  const sqlQuery = `
    SELECT DISTINCT [CaseManager]
    FROM [SyncActiveHomes]
    WHERE [CaseManager] IS NOT NULL AND [CaseManager] != ''
    ORDER BY [CaseManager]
  `

  const results = await query<{ CaseManager: string }>(sqlQuery)
  const caseManagers = results.map((row) => row.CaseManager).filter(Boolean)

  console.log(`✅ [Extension] Retrieved ${caseManagers.length} unique case managers`)
  return caseManagers
}

export function groupHomesByUnit(homes: HomeForMap[]): Record<string, number> {
  return homes.reduce(
    (acc, home) => {
      acc[home.Unit] = (acc[home.Unit] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}

export async function getHomesStatistics() {
  console.log("📈 [Extension] Calculating homes statistics...")

  const homes = await fetchHomesForList()

  const stats = {
    total: homes.length,
    withCoordinates: homes.filter((h) => h.latitude && h.longitude).length,
    byUnit: groupHomesByUnit(homes as any),
    byCaseManager: homes.reduce(
      (acc, home) => {
        const manager = home.contactPersonName || "~unassigned~"
        acc[manager] = (acc[manager] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  }

  console.log("✅ [Extension] Statistics calculated:", stats)
  return stats
}
