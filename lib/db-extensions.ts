import { query } from "./db"

// Types for database entities
export interface Home {
  id: number
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude?: number
  longitude?: number
  unit?: string
  caseManager?: string
  status: string
  capacity: number
  currentOccupancy: number
  lastUpdated: Date
}

export interface HomeForMap {
  id: number
  name: string
  address: string
  city: string
  state: string
  latitude: number
  longitude: number
  unit: string
  caseManager: string
  status: string
  capacity: number
  currentOccupancy: number
}

export interface HomeStats {
  totalHomes: number
  activeHomes: number
  totalCapacity: number
  currentOccupancy: number
  occupancyRate: number
  unitCounts: { unit: string; count: number }[]
  caseManagerCounts: { caseManager: string; count: number }[]
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  permissions: string[]
  createdAt: Date
  lastLogin?: Date
  isActive: boolean
}

// Home-related functions
export async function getHomesForMap(): Promise<HomeForMap[]> {
  const homes = await query<HomeForMap>(`
    SELECT 
      id,
      name,
      address,
      city,
      state,
      latitude,
      longitude,
      unit,
      caseManager,
      status,
      capacity,
      currentOccupancy
    FROM SyncActiveHomes 
    WHERE latitude IS NOT NULL 
      AND longitude IS NOT NULL
      AND status = 'Active'
    ORDER BY name
  `)

  return homes
}

export async function getAllHomes(): Promise<Home[]> {
  const homes = await query<Home>(`
    SELECT 
      id,
      name,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      unit,
      caseManager,
      status,
      capacity,
      currentOccupancy,
      lastUpdated
    FROM SyncActiveHomes 
    ORDER BY name
  `)

  return homes
}

export async function getActiveHomes(): Promise<Home[]> {
  const homes = await query<Home>(`
    SELECT 
      id,
      name,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      unit,
      caseManager,
      status,
      capacity,
      currentOccupancy,
      lastUpdated
    FROM SyncActiveHomes 
    WHERE status = 'Active'
    ORDER BY name
  `)

  return homes
}

export async function getHomeStats(): Promise<HomeStats> {
  // Get basic stats
  const basicStats = await query<{
    totalHomes: number
    activeHomes: number
    totalCapacity: number
    currentOccupancy: number
  }>(`
    SELECT 
      COUNT(*) as totalHomes,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as activeHomes,
      SUM(capacity) as totalCapacity,
      SUM(currentOccupancy) as currentOccupancy
    FROM SyncActiveHomes
  `)

  // Get unit counts
  const unitCounts = await query<{ unit: string; count: number }>(`
    SELECT 
      unit,
      COUNT(*) as count
    FROM SyncActiveHomes 
    WHERE unit IS NOT NULL AND unit != ''
    GROUP BY unit
    ORDER BY count DESC
  `)

  // Get case manager counts
  const caseManagerCounts = await query<{ caseManager: string; count: number }>(`
    SELECT 
      caseManager,
      COUNT(*) as count
    FROM SyncActiveHomes 
    WHERE caseManager IS NOT NULL AND caseManager != ''
    GROUP BY caseManager
    ORDER BY count DESC
  `)

  const stats = basicStats[0]
  const occupancyRate = stats.totalCapacity > 0 ? (stats.currentOccupancy / stats.totalCapacity) * 100 : 0

  return {
    totalHomes: stats.totalHomes,
    activeHomes: stats.activeHomes,
    totalCapacity: stats.totalCapacity,
    currentOccupancy: stats.currentOccupancy,
    occupancyRate: Math.round(occupancyRate * 100) / 100,
    unitCounts,
    caseManagerCounts,
  }
}

export async function getUnits(): Promise<string[]> {
  const units = await query<{ unit: string }>(`
    SELECT DISTINCT unit
    FROM SyncActiveHomes 
    WHERE unit IS NOT NULL AND unit != ''
    ORDER BY unit
  `)

  return units.map((u) => u.unit)
}

export async function getCaseManagers(): Promise<string[]> {
  const caseManagers = await query<{ caseManager: string }>(`
    SELECT DISTINCT caseManager
    FROM SyncActiveHomes 
    WHERE caseManager IS NOT NULL AND caseManager != ''
    ORDER BY caseManager
  `)

  return caseManagers.map((cm) => cm.caseManager)
}

// User management functions
export async function getAllUsers(): Promise<User[]> {
  const users = await query<User>(`
    SELECT 
      id,
      email,
      firstName,
      lastName,
      role,
      permissions,
      createdAt,
      lastLogin,
      isActive
    FROM Users 
    ORDER BY lastName, firstName
  `)

  return users.map((user) => ({
    ...user,
    permissions: typeof user.permissions === "string" ? JSON.parse(user.permissions) : user.permissions,
  }))
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await query<User>(
    `
    SELECT 
      id,
      email,
      firstName,
      lastName,
      role,
      permissions,
      createdAt,
      lastLogin,
      isActive
    FROM Users 
    WHERE id = ?
  `,
    [id],
  )

  if (users.length === 0) return null

  const user = users[0]
  return {
    ...user,
    permissions: typeof user.permissions === "string" ? JSON.parse(user.permissions) : user.permissions,
  }
}

export async function createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
  const id = crypto.randomUUID()
  const now = new Date()

  await query(
    `
    INSERT INTO Users (id, email, firstName, lastName, role, permissions, createdAt, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      userData.email,
      userData.firstName,
      userData.lastName,
      userData.role,
      JSON.stringify(userData.permissions),
      now,
      userData.isActive,
    ],
  )

  return {
    id,
    ...userData,
    createdAt: now,
  }
}

export async function updateUser(id: string, userData: Partial<Omit<User, "id" | "createdAt">>): Promise<User | null> {
  const existingUser = await getUserById(id)
  if (!existingUser) return null

  const updates: string[] = []
  const values: any[] = []

  if (userData.email !== undefined) {
    updates.push("email = ?")
    values.push(userData.email)
  }
  if (userData.firstName !== undefined) {
    updates.push("firstName = ?")
    values.push(userData.firstName)
  }
  if (userData.lastName !== undefined) {
    updates.push("lastName = ?")
    values.push(userData.lastName)
  }
  if (userData.role !== undefined) {
    updates.push("role = ?")
    values.push(userData.role)
  }
  if (userData.permissions !== undefined) {
    updates.push("permissions = ?")
    values.push(JSON.stringify(userData.permissions))
  }
  if (userData.isActive !== undefined) {
    updates.push("isActive = ?")
    values.push(userData.isActive)
  }
  if (userData.lastLogin !== undefined) {
    updates.push("lastLogin = ?")
    values.push(userData.lastLogin)
  }

  if (updates.length === 0) return existingUser

  values.push(id)

  await query(
    `
    UPDATE Users 
    SET ${updates.join(", ")}
    WHERE id = ?
  `,
    values,
  )

  return await getUserById(id)
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await query(
    `
    DELETE FROM Users 
    WHERE id = ?
  `,
    [id],
  )

  return result.length > 0
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await getUserById(userId)
  return user?.permissions || []
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions.includes(permission) || permissions.includes("admin")
}
