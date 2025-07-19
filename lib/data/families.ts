import { executeQuery, executeScalar } from "../database"

export interface Family {
  id: string
  radiusId?: string
  familyName: string
  address?: string
  phone?: string
  email?: string
  caseNumber?: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface FamilyWithPlacements extends Family {
  placements: Placement[]
  visitCount: number
}

export interface Placement {
  id: string
  radiusId?: string
  familyId: string
  childName: string
  childAge?: number
  placementDate: Date
  placementType: string
  specialNeeds?: string
  medicationInfo?: string
  schoolInfo?: string
  emergencyContact?: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export async function getAllFamilies(): Promise<FamilyWithPlacements[]> {
  const query = `
    SELECT 
      f.id, f.radiusId, f.familyName, f.address, f.phone, f.email, 
      f.caseNumber, f.status, f.createdAt, f.updatedAt,
      p.id as placementId, p.childName, p.childAge, p.placementType,
      p.placementDate, p.specialNeeds, p.medicationInfo, p.schoolInfo,
      p.emergencyContact, p.status as placementStatus,
      (SELECT COUNT(*) FROM visits v WHERE v.familyId = f.id) as visitCount
    FROM families f
    LEFT JOIN placements p ON f.id = p.familyId AND p.status = 'active'
    WHERE f.status = 'active'
    ORDER BY f.familyName
  `

  const results = await executeQuery(query)

  // Group placements by family
  const familiesMap = new Map<string, FamilyWithPlacements>()

  results.forEach((row: any) => {
    if (!familiesMap.has(row.id)) {
      familiesMap.set(row.id, {
        id: row.id,
        radiusId: row.radiusId,
        familyName: row.familyName,
        address: row.address,
        phone: row.phone,
        email: row.email,
        caseNumber: row.caseNumber,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        placements: [],
        visitCount: row.visitCount || 0,
      })
    }

    if (row.placementId) {
      familiesMap.get(row.id)!.placements.push({
        id: row.placementId,
        familyId: row.id,
        childName: row.childName,
        childAge: row.childAge,
        placementType: row.placementType,
        placementDate: row.placementDate,
        specialNeeds: row.specialNeeds,
        medicationInfo: row.medicationInfo,
        schoolInfo: row.schoolInfo,
        emergencyContact: row.emergencyContact,
        status: row.placementStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      } as Placement)
    }
  })

  return Array.from(familiesMap.values())
}

export async function getFamilyById(id: string): Promise<FamilyWithPlacements | null> {
  const query = `
    SELECT 
      f.id, f.radiusId, f.familyName, f.address, f.phone, f.email, 
      f.caseNumber, f.status, f.createdAt, f.updatedAt,
      p.id as placementId, p.childName, p.childAge, p.placementType,
      p.placementDate, p.specialNeeds, p.medicationInfo, p.schoolInfo,
      p.emergencyContact, p.status as placementStatus,
      (SELECT COUNT(*) FROM visits v WHERE v.familyId = f.id) as visitCount
    FROM families f
    LEFT JOIN placements p ON f.id = p.familyId AND p.status = 'active'
    WHERE f.id = @param0
  `

  const results = await executeQuery(query, [id])
  if (results.length === 0) return null

  const family: FamilyWithPlacements = {
    id: results[0].id,
    radiusId: results[0].radiusId,
    familyName: results[0].familyName,
    address: results[0].address,
    phone: results[0].phone,
    email: results[0].email,
    caseNumber: results[0].caseNumber,
    status: results[0].status,
    createdAt: results[0].createdAt,
    updatedAt: results[0].updatedAt,
    placements: [],
    visitCount: results[0].visitCount || 0,
  }

  results.forEach((row: any) => {
    if (row.placementId) {
      family.placements.push({
        id: row.placementId,
        familyId: row.id,
        childName: row.childName,
        childAge: row.childAge,
        placementType: row.placementType,
        placementDate: row.placementDate,
        specialNeeds: row.specialNeeds,
        medicationInfo: row.medicationInfo,
        schoolInfo: row.schoolInfo,
        emergencyContact: row.emergencyContact,
        status: row.placementStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      } as Placement)
    }
  })

  return family
}

export async function createFamily(familyData: Omit<Family, "id" | "createdAt" | "updatedAt">): Promise<Family> {
  const query = `
    INSERT INTO families (radiusId, familyName, address, phone, email, caseNumber, status)
    OUTPUT INSERTED.*
    VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6)
  `
  const families = await executeQuery<Family>(query, [
    familyData.radiusId,
    familyData.familyName,
    familyData.address,
    familyData.phone,
    familyData.email,
    familyData.caseNumber,
    familyData.status,
  ])
  return families[0]
}

export async function getDashboardStats(): Promise<{
  totalFamilies: number
  totalPlacements: number
}> {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM families WHERE status = 'active') as totalFamilies,
      (SELECT COUNT(*) FROM placements WHERE status = 'active') as totalPlacements
  `
  const result = await executeScalar(query)
  return {
    totalFamilies: result.totalFamilies || 0,
    totalPlacements: result.totalPlacements || 0,
  }
}
