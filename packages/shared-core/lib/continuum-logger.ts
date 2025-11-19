/**
 * Continuum Logger Utility
 * 
 * Provides easy-to-use functions for logging activities to the continuum system.
 * Supports multi-dimensional tracking per the continuum concept.
 */

export interface LogActivityParams {
  appointmentId?: string
  activityType: 'drive_start' | 'drive_end' | 'visit_start' | 'visit_end' | string
  activityStatus?: 'active' | 'complete' | 'cancelled'
  timestamp?: string // ISO string, defaults to now
  durationMinutes?: number
  staffUserId?: string
  staffName?: string
  homeGuid?: string
  homeXref?: number
  homeName?: string
  entityGuids?: string[] // Array of related entity GUIDs (children, household members, etc.)
  activityDescription?: string
  metadata?: Record<string, any> // Additional activity-specific data
  locationLatitude?: number
  locationLongitude?: number
  locationAddress?: string
  contextNotes?: string
  outcome?: string
  triggeredByEntryId?: string
  createdByUserId?: string
}

/**
 * Log an activity to the continuum system
 */
export async function logActivity(params: LogActivityParams): Promise<{ success: boolean; entryId?: string; error?: string }> {
  try {
    const timestamp = params.timestamp || new Date().toISOString()

    const response = await fetch('/api/continuum/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        timestamp,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ [CONTINUUM] Failed to log activity:', errorData)
      return {
        success: false,
        error: errorData.error || 'Failed to log activity',
      }
    }

    const data = await response.json()
    console.log('✅ [CONTINUUM] Activity logged:', data.entryId)
    
    return {
      success: true,
      entryId: data.entryId,
    }
  } catch (error: any) {
    console.error('❌ [CONTINUUM] Error logging activity:', error)
    return {
      success: false,
      error: error.message || 'Failed to log activity',
    }
  }
}

/**
 * Helper function to log drive start
 */
export async function logDriveStart(params: {
  appointmentId: string
  staffUserId?: string
  staffName?: string
  locationLatitude?: number
  locationLongitude?: number
  locationAddress?: string
  createdByUserId?: string
}): Promise<{ success: boolean; entryId?: string; error?: string }> {
  return logActivity({
    ...params,
    activityType: 'drive_start',
    activityStatus: 'active',
  })
}

/**
 * Helper function to log drive end
 */
export async function logDriveEnd(params: {
  appointmentId: string
  staffUserId?: string
  staffName?: string
  durationMinutes?: number
  locationLatitude?: number
  locationLongitude?: number
  locationAddress?: string
  nextAppointmentId?: string // If going to another home, this becomes part of that visit
  createdByUserId?: string
}): Promise<{ success: boolean; entryId?: string; error?: string }> {
  return logActivity({
    ...params,
    activityType: 'drive_end',
    activityStatus: 'complete',
    metadata: params.nextAppointmentId ? { nextAppointmentId: params.nextAppointmentId } : undefined,
  })
}

/**
 * Helper function to log visit start
 */
export async function logVisitStart(params: {
  appointmentId: string
  staffUserId?: string
  staffName?: string
  homeGuid: string
  homeXref?: number
  homeName?: string
  entityGuids?: string[] // Children in placement, household members, etc.
  locationLatitude?: number
  locationLongitude?: number
  locationAddress?: string
  createdByUserId?: string
}): Promise<{ success: boolean; entryId?: string; error?: string }> {
  return logActivity({
    ...params,
    activityType: 'visit_start',
    activityStatus: 'active',
    activityDescription: `Visit started at ${params.homeName || 'home'}`,
  })
}

/**
 * Helper function to log visit end
 */
export async function logVisitEnd(params: {
  appointmentId: string
  staffUserId?: string
  staffName?: string
  homeGuid: string
  homeXref?: number
  homeName?: string
  durationMinutes?: number
  outcome?: string
  contextNotes?: string
  createdByUserId?: string
}): Promise<{ success: boolean; entryId?: string; error?: string }> {
  return logActivity({
    ...params,
    activityType: 'visit_end',
    activityStatus: 'complete',
    activityDescription: `Visit completed at ${params.homeName || 'home'}`,
  })
}

