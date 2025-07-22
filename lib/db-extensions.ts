import { query, getConnection } from "./db"

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
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND latitude != 0 
        AND longitude != 0
      ORDER BY name
    `)
    console.log(`✅ Retrieved ${homes.length} homes with coordinates for map`)
    return homes
  } catch (error) {
    console.error("❌ Error fetching homes for map:", error)
    throw new Error(`Failed to fetch homes for map: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getHomeStats(): Promise<HomeStats> {
  try {
    console.log("📊 Fetching home statistics...")
    const connection = await getConnection()
    const request = connection.request()

    const result = await request.query(`
      SELECT 
        COUNT(*) as totalHomes,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeHomes,
        SUM(ISNULL(capacity, 0)) as totalCapacity,
        SUM(ISNULL(current_residents, 0)) as currentResidents
      FROM homes
    `)

    const stats = result.recordset[0]
    console.log("✅ Home statistics retrieved:", stats)

    const occupancyRate = stats.totalCapacity > 0 ? (stats.currentResidents / stats.totalCapacity) * 100 : 0

    return {
      totalHomes: stats.totalHomes || 0,
      activeHomes: stats.activeHomes || 0,
      totalCapacity: stats.totalCapacity || 0,
      currentResidents: stats.currentResidents || 0,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    }
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
