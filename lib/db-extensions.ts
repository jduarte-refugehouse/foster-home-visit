import { query } from "./db"

export interface Home {
  HomeID: number
  HomeName: string
  Address: string
  City: string
  State: string
  ZipCode: string
  Latitude?: number
  Longitude?: number
  CaseManager?: string
  Unit?: string
  Status: string
  LastVisit?: Date
  NextVisit?: Date
}

export interface HomeStats {
  totalHomes: number
  activeHomes: number
  pendingVisits: number
  overdue: number
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  permissions: string[]
  createdAt: Date
  lastLogin?: Date
}

export async function getHomesForMap(): Promise<Home[]> {
  const queryText = `
    SELECT 
      HomeID,
      HomeName,
      Address,
      City,
      State,
      ZipCode,
      Latitude,
      Longitude,
      CaseManager,
      Unit,
      Status
    FROM SyncActiveHomes 
    WHERE Latitude IS NOT NULL 
      AND Longitude IS NOT NULL
      AND Status = 'Active'
  `
  return await query<Home>(queryText)
}

export async function getAllHomes(): Promise<Home[]> {
  const queryText = `
    SELECT 
      HomeID,
      HomeName,
      Address,
      City,
      State,
      ZipCode,
      Latitude,
      Longitude,
      CaseManager,
      Unit,
      Status,
      LastVisit,
      NextVisit
    FROM SyncActiveHomes 
    ORDER BY HomeName
  `
  return await query<Home>(queryText)
}

export async function getActiveHomes(): Promise<Home[]> {
  const queryText = `
    SELECT 
      HomeID,
      HomeName,
      Address,
      City,
      State,
      ZipCode,
      Latitude,
      Longitude,
      CaseManager,
      Unit,
      Status,
      LastVisit,
      NextVisit
    FROM SyncActiveHomes 
    WHERE Status = 'Active'
    ORDER BY HomeName
  `
  return await query<Home>(queryText)
}

export async function getHomeStats(): Promise<HomeStats> {
  const queryText = `
    SELECT 
      COUNT(*) as totalHomes,
      SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) as activeHomes,
      SUM(CASE WHEN NextVisit IS NOT NULL AND NextVisit <= GETDATE() + 7 THEN 1 ELSE 0 END) as pendingVisits,
      SUM(CASE WHEN NextVisit IS NOT NULL AND NextVisit < GETDATE() THEN 1 ELSE 0 END) as overdue
    FROM SyncActiveHomes
  `
  const result = await query<HomeStats>(queryText)
  return result[0] || { totalHomes: 0, activeHomes: 0, pendingVisits: 0, overdue: 0 }
}

export async function getUnits(): Promise<string[]> {
  const queryText = `
    SELECT DISTINCT Unit
    FROM SyncActiveHomes 
    WHERE Unit IS NOT NULL 
      AND Unit != ''
    ORDER BY Unit
  `
  const result = await query<{ Unit: string }>(queryText)
  return result.map((row) => row.Unit)
}

export async function getCaseManagers(): Promise<string[]> {
  const queryText = `
    SELECT DISTINCT CaseManager
    FROM SyncActiveHomes 
    WHERE CaseManager IS NOT NULL 
      AND CaseManager != ''
    ORDER BY CaseManager
  `
  const result = await query<{ CaseManager: string }>(queryText)
  return result.map((row) => row.CaseManager)
}

export async function getHomeById(homeId: number): Promise<Home | null> {
  const queryText = `
    SELECT 
      HomeID,
      HomeName,
      Address,
      City,
      State,
      ZipCode,
      Latitude,
      Longitude,
      CaseManager,
      Unit,
      Status,
      LastVisit,
      NextVisit
    FROM SyncActiveHomes 
    WHERE HomeID = @param0
  `
  const result = await query<Home>(queryText, [homeId])
  return result[0] || null
}

export async function updateHomeCoordinates(homeId: number, latitude: number, longitude: number): Promise<boolean> {
  try {
    const queryText = `
      UPDATE SyncActiveHomes 
      SET Latitude = @param0, Longitude = @param1
      WHERE HomeID = @param2
    `
    await query(queryText, [latitude, longitude, homeId])
    return true
  } catch (error) {
    console.error("Error updating home coordinates:", error)
    return false
  }
}

// User management functions
export async function createUser(userData: Partial<User>): Promise<User> {
  const queryText = `
    INSERT INTO Users (id, email, firstName, lastName, role, permissions, createdAt)
    OUTPUT INSERTED.*
    VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6)
  `
  const result = await query<User>(queryText, [
    userData.id,
    userData.email,
    userData.firstName,
    userData.lastName,
    userData.role || "user",
    JSON.stringify(userData.permissions || []),
    new Date(),
  ])
  return result[0]
}

export async function getUserById(userId: string): Promise<User | null> {
  const queryText = `
    SELECT id, email, firstName, lastName, role, permissions, createdAt, lastLogin
    FROM Users 
    WHERE id = @param0
  `
  const result = await query<User>(queryText, [userId])
  if (result[0]) {
    result[0].permissions = JSON.parse(result[0].permissions as any)
  }
  return result[0] || null
}

export async function getAllUsers(): Promise<User[]> {
  const queryText = `
    SELECT id, email, firstName, lastName, role, permissions, createdAt, lastLogin
    FROM Users 
    ORDER BY createdAt DESC
  `
  const result = await query<User>(queryText)
  return result.map((user) => ({
    ...user,
    permissions: JSON.parse(user.permissions as any),
  }))
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  try {
    const queryText = `
      UPDATE Users 
      SET role = @param0
      WHERE id = @param1
    `
    await query(queryText, [role, userId])
    return true
  } catch (error) {
    console.error("Error updating user role:", error)
    return false
  }
}

export async function updateUserPermissions(userId: string, permissions: string[]): Promise<boolean> {
  try {
    const queryText = `
      UPDATE Users 
      SET permissions = @param0
      WHERE id = @param1
    `
    await query(queryText, [JSON.stringify(permissions), userId])
    return true
  } catch (error) {
    console.error("Error updating user permissions:", error)
    return false
  }
}

export async function updateUserLastLogin(userId: string): Promise<boolean> {
  try {
    const queryText = `
      UPDATE Users 
      SET lastLogin = @param0
      WHERE id = @param1
    `
    await query(queryText, [new Date(), userId])
    return true
  } catch (error) {
    console.error("Error updating user last login:", error)
    return false
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const queryText = `
      DELETE FROM Users 
      WHERE id = @param0
    `
    await query(queryText, [userId])
    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}
