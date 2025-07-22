import { getConnection, sql } from "./db"

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

export async function getAllHomes(): Promise<Home[]> {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT 
        id, name, address, city, state, zip, phone, email,
        capacity, current_residents, license_number, license_expiry,
        status, latitude, longitude, last_visit, next_visit,
        created_at, updated_at
      FROM homes 
      ORDER BY name
    `)
    return result.recordset
  } catch (error) {
    console.error("Error fetching homes:", error)
    throw error
  }
}

export async function getActiveHomes(): Promise<Home[]> {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT 
        id, name, address, city, state, zip, phone, email,
        capacity, current_residents, license_number, license_expiry,
        status, latitude, longitude, last_visit, next_visit,
        created_at, updated_at
      FROM homes 
      WHERE status = 'active'
      ORDER BY name
    `)
    return result.recordset
  } catch (error) {
    console.error("Error fetching active homes:", error)
    throw error
  }
}

export async function getHomesForMap(): Promise<Home[]> {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT 
        id, name, address, city, state, zip,
        latitude, longitude, status, capacity, current_residents
      FROM homes 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY name
    `)
    return result.recordset
  } catch (error) {
    console.error("Error fetching homes for map:", error)
    throw error
  }
}

export async function getUnits(): Promise<any[]> {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT 
        id, home_id, unit_number, capacity, current_residents,
        status, created_at, updated_at
      FROM units 
      ORDER BY home_id, unit_number
    `)
    return result.recordset
  } catch (error) {
    console.error("Error fetching units:", error)
    return []
  }
}

export async function getCaseManagers(): Promise<any[]> {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT 
        id, first_name, last_name, email, phone,
        status, created_at, updated_at
      FROM case_managers 
      WHERE status = 'active'
      ORDER BY last_name, first_name
    `)
    return result.recordset
  } catch (error) {
    console.error("Error fetching case managers:", error)
    return []
  }
}

export async function getHomeStats(): Promise<{
  total: number
  active: number
  inactive: number
  pending: number
  totalCapacity: number
  totalResidents: number
}> {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(capacity) as totalCapacity,
        SUM(current_residents) as totalResidents
      FROM homes
    `)
    return result.recordset[0]
  } catch (error) {
    console.error("Error fetching home stats:", error)
    return {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      totalCapacity: 0,
      totalResidents: 0,
    }
  }
}

export async function getHomeById(id: number): Promise<Home | null> {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          id, name, address, city, state, zip, phone, email,
          capacity, current_residents, license_number, license_expiry,
          status, latitude, longitude, last_visit, next_visit,
          created_at, updated_at
        FROM homes 
        WHERE id = @id
      `)
    return result.recordset[0] || null
  } catch (error) {
    console.error("Error fetching home by ID:", error)
    throw error
  }
}

export async function getHomesStats(): Promise<{
  total: number
  active: number
  inactive: number
  pending: number
  totalCapacity: number
  totalResidents: number
}> {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(capacity) as totalCapacity,
        SUM(current_residents) as totalResidents
      FROM homes
    `)
    return result.recordset[0]
  } catch (error) {
    console.error("Error fetching homes stats:", error)
    throw error
  }
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input("clerkId", sql.VarChar, clerkId)
      .query(`
        SELECT 
          id, email, first_name, last_name, role, permissions,
          created_at, updated_at
        FROM users 
        WHERE id = @clerkId
      `)
    return result.recordset[0] || null
  } catch (error) {
    console.error("Error fetching user by Clerk ID:", error)
    throw error
  }
}

export async function createUser(userData: {
  id: string
  email: string
  first_name: string
  last_name: string
  role?: string
}): Promise<User> {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.VarChar, userData.id)
      .input("email", sql.VarChar, userData.email)
      .input("first_name", sql.VarChar, userData.first_name)
      .input("last_name", sql.VarChar, userData.last_name)
      .input("role", sql.VarChar, userData.role || "user")
      .input("permissions", sql.VarChar, JSON.stringify(["read"]))
      .query(`
        INSERT INTO users (id, email, first_name, last_name, role, permissions, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@id, @email, @first_name, @last_name, @role, @permissions, GETDATE(), GETDATE())
      `)
    return result.recordset[0]
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input("id", sql.VarChar, id)
      .input("email", sql.VarChar, userData.email)
      .input("first_name", sql.VarChar, userData.first_name)
      .input("last_name", sql.VarChar, userData.last_name)
      .input("role", sql.VarChar, userData.role)
      .input("permissions", sql.VarChar, userData.permissions ? JSON.stringify(userData.permissions) : null)
      .query(`
        UPDATE users 
        SET 
          email = COALESCE(@email, email),
          first_name = COALESCE(@first_name, first_name),
          last_name = COALESCE(@last_name, last_name),
          role = COALESCE(@role, role),
          permissions = COALESCE(@permissions, permissions),
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `)
    return result.recordset[0] || null
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT 
        id, email, first_name, last_name, role, permissions,
        created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `)
    return result.recordset
  } catch (error) {
    console.error("Error fetching all users:", error)
    throw error
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const pool = await getConnection()
    await pool.request().query("SELECT 1 as test")
    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}
