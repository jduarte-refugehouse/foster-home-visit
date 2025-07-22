import { query } from "./db"

export interface Home {
  id: number
  address: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
  status: string
  created_at: Date
  updated_at: Date
}

export interface HomeStats {
  total: number
  active: number
  inactive: number
  pending: number
}

export async function getHomesForMap(): Promise<Home[]> {
  try {
    const homes = await query<Home>(`
      SELECT 
        id,
        address,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        status,
        created_at,
        updated_at
      FROM homes 
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND status = 'active'
      ORDER BY created_at DESC
    `)
    return homes
  } catch (error) {
    console.error("Error fetching homes for map:", error)
    throw new Error("Failed to fetch homes for map")
  }
}

export async function getHomesList(): Promise<Home[]> {
  try {
    const homes = await query<Home>(`
      SELECT 
        id,
        address,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        status,
        created_at,
        updated_at
      FROM homes 
      ORDER BY created_at DESC
    `)
    return homes
  } catch (error) {
    console.error("Error fetching homes list:", error)
    throw new Error("Failed to fetch homes list")
  }
}

export async function getHomeStats(): Promise<HomeStats> {
  try {
    const stats = await query<{ status: string; count: number }>(`
      SELECT 
        status,
        COUNT(*) as count
      FROM homes 
      GROUP BY status
    `)

    const result: HomeStats = {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
    }

    stats.forEach((stat) => {
      result.total += stat.count
      switch (stat.status.toLowerCase()) {
        case "active":
          result.active = stat.count
          break
        case "inactive":
          result.inactive = stat.count
          break
        case "pending":
          result.pending = stat.count
          break
      }
    })

    return result
  } catch (error) {
    console.error("Error fetching home stats:", error)
    throw new Error("Failed to fetch home stats")
  }
}
