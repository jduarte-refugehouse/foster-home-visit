import { executeQuery, executeScalar } from "../database"

export interface Visit {
  id: string
  familyId: string
  placementId?: string
  userId: string
  visitType: string
  visitDate: Date
  startTime?: Date
  endTime?: Date
  status: string
  purpose?: string
  location?: string
  notes?: string
  tacCompliant: boolean
  rccCompliant: boolean
  createdAt: Date
  updatedAt: Date
}

export interface VisitWithDetails extends Visit {
  family: {
    id: string
    familyName: string
  }
  placement?: {
    id: string
    childName: string
  }
  visitDetails?: VisitDetail[]
}

export interface VisitDetail {
  id: string
  visitId: string
  homeConditions?: string
  childSafety?: string
  childWellbeing?: string
  caregiverInteraction?: string
  educationalNeeds?: string
  medicalNeeds?: string
  behavioralConcerns?: string
  serviceDelivery?: string
  goalProgress?: string
  familyStrengths?: string
  challengesIdentified?: string
  recommendedActions?: string
  followUpRequired: boolean
  followUpDate?: Date
  supervisorReview: boolean
  supervisorNotes?: string
  createdAt: Date
  updatedAt: Date
}

export async function getVisitsByUserId(userId: string): Promise<VisitWithDetails[]> {
  const query = `
    SELECT 
      v.id, v.familyId, v.placementId, v.userId, v.visitType, v.visitDate,
      v.startTime, v.endTime, v.status, v.purpose, v.location, v.notes,
      v.tacCompliant, v.rccCompliant, v.createdAt, v.updatedAt,
      f.familyName,
      p.childName
    FROM visits v
    INNER JOIN families f ON v.familyId = f.id
    LEFT JOIN placements p ON v.placementId = p.id
    WHERE v.userId = @param0
    ORDER BY v.visitDate DESC
  `

  const results = await executeQuery(query, [userId])

  return results.map((row: any) => ({
    id: row.id,
    familyId: row.familyId,
    placementId: row.placementId,
    userId: row.userId,
    visitType: row.visitType,
    visitDate: row.visitDate,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status,
    purpose: row.purpose,
    location: row.location,
    notes: row.notes,
    tacCompliant: row.tacCompliant,
    rccCompliant: row.rccCompliant,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    family: {
      id: row.familyId,
      familyName: row.familyName,
    },
    placement: row.childName
      ? {
          id: row.placementId,
          childName: row.childName,
        }
      : undefined,
  }))
}

export async function getUpcomingVisitsByUserId(userId: string): Promise<VisitWithDetails[]> {
  const query = `
    SELECT 
      v.id, v.familyId, v.placementId, v.userId, v.visitType, v.visitDate,
      v.startTime, v.endTime, v.status, v.purpose, v.location, v.notes,
      v.tacCompliant, v.rccCompliant, v.createdAt, v.updatedAt,
      f.familyName,
      p.childName
    FROM visits v
    INNER JOIN families f ON v.familyId = f.id
    LEFT JOIN placements p ON v.placementId = p.id
    WHERE v.userId = @param0 AND v.visitDate >= CAST(GETDATE() AS DATE)
    ORDER BY v.visitDate ASC
  `

  const results = await executeQuery(query, [userId])

  return results.map((row: any) => ({
    id: row.id,
    familyId: row.familyId,
    placementId: row.placementId,
    userId: row.userId,
    visitType: row.visitType,
    visitDate: row.visitDate,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status,
    purpose: row.purpose,
    location: row.location,
    notes: row.notes,
    tacCompliant: row.tacCompliant,
    rccCompliant: row.rccCompliant,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    family: {
      id: row.familyId,
      familyName: row.familyName,
    },
    placement: row.childName
      ? {
          id: row.placementId,
          childName: row.childName,
        }
      : undefined,
  }))
}

export async function createVisit(visitData: Omit<Visit, "id" | "createdAt" | "updatedAt">): Promise<Visit> {
  const query = `
    INSERT INTO visits (familyId, placementId, userId, visitType, visitDate, startTime, purpose, location, notes, status)
    OUTPUT INSERTED.*
    VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9)
  `
  const visits = await executeQuery<Visit>(query, [
    visitData.familyId,
    visitData.placementId || null,
    visitData.userId,
    visitData.visitType,
    visitData.visitDate,
    visitData.startTime || null,
    visitData.purpose,
    visitData.location,
    visitData.notes,
    visitData.status || "scheduled",
  ])
  return visits[0]
}

export async function getVisitStats(userId: string): Promise<{
  totalVisits: number
  upcomingVisits: number
  overdueVisits: number
}> {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM visits WHERE userId = @param0) as totalVisits,
      (SELECT COUNT(*) FROM visits WHERE userId = @param0 AND visitDate >= CAST(GETDATE() AS DATE) AND status = 'scheduled') as upcomingVisits,
      (SELECT COUNT(*) FROM visits WHERE userId = @param0 AND visitDate < CAST(GETDATE() AS DATE) AND status = 'scheduled') as overdueVisits
  `
  const result = await executeScalar(query, [userId])
  return {
    totalVisits: result.totalVisits || 0,
    upcomingVisits: result.upcomingVisits || 0,
    overdueVisits: result.overdueVisits || 0,
  }
}
