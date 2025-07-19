import { executeQuery } from "../database"

export interface User {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const query = `
    SELECT id, clerkId, email, firstName, lastName, role, createdAt, updatedAt
    FROM users 
    WHERE clerkId = @param0
  `
  const users = await executeQuery<User>(query, [clerkId])
  return users[0] || null
}

export async function createUser(userData: {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
}): Promise<User> {
  const query = `
    INSERT INTO users (clerkId, email, firstName, lastName, role)
    OUTPUT INSERTED.*
    VALUES (@param0, @param1, @param2, @param3, @param4)
  `
  const users = await executeQuery<User>(query, [
    userData.clerkId,
    userData.email,
    userData.firstName || null,
    userData.lastName || null,
    userData.role || "caseworker",
  ])
  return users[0]
}

export async function updateUser(clerkId: string, userData: Partial<User>): Promise<User> {
  const query = `
    UPDATE users 
    SET email = COALESCE(@param1, email),
        firstName = COALESCE(@param2, firstName),
        lastName = COALESCE(@param3, lastName),
        updatedAt = GETDATE()
    OUTPUT INSERTED.*
    WHERE clerkId = @param0
  `
  const users = await executeQuery<User>(query, [clerkId, userData.email, userData.firstName, userData.lastName])
  return users[0]
}
