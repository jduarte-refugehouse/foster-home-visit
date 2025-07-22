import { query } from "./db"

export interface Home {
  id: number
  name: string
  address: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  website?: string
  capacity?: number
  current_residents?: number
  status: string
  created_at: Date
  updated_at: Date
}

export interface HomeStats {
  totalHomes: number
  activeHomes: number
  totalCapacity: number
  currentResidents: number
  occupancyRate: number
}

export async function getHomesForMap(): Promise<Home[]> {
  try {
    console.log("🗺️ Fetching homes for map display...")
    const homes = await query<Home>(`
      SELECT 
        id,
        name,
        address,
        latitude,
        longitude,
        phone,
        email,
        website,
        capacity,
        current_residents,
        status,
        created_at,
        updated_at
      FROM homes 
      WHERE status = 'active' 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
      ORDER BY name
    `)
    console.log(`✅ Retrieved ${homes.length} homes for map`)
    return homes
  } catch (error) {
    console.error("❌ Error fetching homes for map:", error)
    throw new Error(`Failed to fetch homes for map: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getHomeStats(): Promise<HomeStats> {
  try {
    console.log("📊 Fetching home statistics...")
    const stats = await query<{
      total_homes: number
      active_homes: number
      total_capacity: number
      current_residents: number
    }>(`
      SELECT 
        COUNT(*) as total_homes,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_homes,
        SUM(ISNULL(capacity, 0)) as total_capacity,
        SUM(ISNULL(current_residents, 0)) as current_residents
      FROM homes
    `)

    if (stats.length === 0) {
      throw new Error("No statistics data returned")
    }

    const result = stats[0]
    const occupancyRate = result.total_capacity > 0 ? (result.current_residents / result.total_capacity) * 100 : 0

    const homeStats: HomeStats = {
      totalHomes: result.total_homes,
      activeHomes: result.active_homes,
      totalCapacity: result.total_capacity,
      currentResidents: result.current_residents,
      occupancyRate: Math.round(occupancyRate * 100) / 100, // Round to 2 decimal places
    }

    console.log("✅ Home statistics retrieved:", homeStats)
    return homeStats
  } catch (error) {
    console.error("❌ Error fetching home statistics:", error)
    throw new Error(`Failed to fetch home statistics: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getAllHomes(): Promise<Home[]> {
  try {
    console.log("🏠 Fetching all homes...")
    const homes = await query<Home>(`
      SELECT 
        id,
        name,
        address,
        latitude,
        longitude,
        phone,
        email,
        website,
        capacity,
        current_residents,
        status,
        created_at,
        updated_at
      FROM homes 
      ORDER BY name
    `)
    console.log(`✅ Retrieved ${homes.length} homes`)
    return homes
  } catch (error) {
    console.error("❌ Error fetching all homes:", error)
    throw new Error(`Failed to fetch homes: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
