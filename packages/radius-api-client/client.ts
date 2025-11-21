import type {
  ListHome,
  HomeFilters,
  Appointment,
  AppointmentOptions,
  VisitForm,
  VisitFormOptions,
  User,
  UserOptions,
  ApiResponse,
} from "./types"

const API_BASE_URL =
  process.env.RADIUS_API_HUB_URL || "https://admin.refugehouse.app"

/**
 * Make an authenticated API request to the Radius API Hub
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Read the API key at runtime, not at module load time
  // This ensures environment variables are available when the function executes
  const API_KEY = process.env.RADIUS_API_KEY?.trim()
  
  if (!API_KEY) {
    throw new Error(
      "RADIUS_API_KEY environment variable is required. Please configure it in your Vercel project settings."
    )
  }

  const url = `${API_BASE_URL}/api/radius/${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = `API request failed: ${response.statusText}. ${errorData.error || ""} ${errorData.details || ""}`
    
    // Log detailed error information for debugging
    console.error("❌ [RADIUS-API-CLIENT] Request failed:", {
      status: response.status,
      statusText: response.statusText,
      url,
      errorData,
      apiKeyPrefix: API_KEY?.substring(0, 12),
      apiKeyLength: API_KEY?.length,
      headers: {
        'x-api-key': API_KEY ? `${API_KEY.substring(0, 12)}...` : 'MISSING',
      },
    })
    
    throw new Error(errorMessage)
  }

  return response.json()
}

/**
 * Radius API Client
 * 
 * Provides type-safe methods to access RadiusBifrost data via the API hub
 * 
 * Usage:
 * ```typescript
 * import { radiusApiClient } from '@refugehouse/radius-api-client'
 * 
 * const homes = await radiusApiClient.getHomes({ unit: 'RAD' })
 * const appointments = await radiusApiClient.getAppointments({ startDate: '2024-01-01' })
 * ```
 */
export const radiusApiClient = {
  /**
   * Get homes list with optional filters
   */
  async getHomes(filters?: HomeFilters): Promise<ListHome[]> {
    const params = new URLSearchParams()
    if (filters?.unit) params.append("unit", filters.unit)
    if (filters?.caseManager) params.append("caseManager", filters.caseManager)
    if (filters?.search) params.append("search", filters.search)

    const queryString = params.toString()
    const endpoint = queryString ? `homes?${queryString}` : "homes"

    const response = await apiRequest<any>(endpoint)
    return response.homes || response.data || []
  },

  /**
   * Get appointments with optional filters
   */
  async getAppointments(options?: AppointmentOptions): Promise<Appointment[]> {
    const params = new URLSearchParams()
    if (options?.startDate) params.append("startDate", options.startDate)
    if (options?.endDate) params.append("endDate", options.endDate)
    if (options?.assignedTo) params.append("assignedTo", options.assignedTo)
    if (options?.status) params.append("status", options.status)
    if (options?.type) params.append("type", options.type)

    const queryString = params.toString()
    const endpoint = queryString ? `appointments?${queryString}` : "appointments"

    const response = await apiRequest<any>(endpoint)
    return response.appointments || response.data || []
  },

  /**
   * Get visit forms with optional filters
   */
  async getVisitForms(options?: VisitFormOptions): Promise<VisitForm[]> {
    const params = new URLSearchParams()
    if (options?.appointmentId)
      params.append("appointmentId", options.appointmentId)
    if (options?.status) params.append("status", options.status)
    if (options?.userId) params.append("userId", options.userId)

    const queryString = params.toString()
    const endpoint = queryString ? `visit-forms?${queryString}` : "visit-forms"

    const response = await apiRequest<any>(endpoint)
    return response.visitForms || response.data || []
  },

  /**
   * Get users with optional filters
   */
  async getUsers(options?: UserOptions): Promise<User[]> {
    const params = new URLSearchParams()
    if (options?.microserviceCode)
      params.append("microserviceCode", options.microserviceCode)
    if (options?.isActive !== undefined)
      params.append("isActive", options.isActive.toString())

    const queryString = params.toString()
    const endpoint = queryString ? `users?${queryString}` : "users"

    const response = await apiRequest<any>(endpoint)
    return response.users || response.data || []
  },
}

