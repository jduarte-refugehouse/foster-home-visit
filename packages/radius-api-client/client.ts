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
  // Auth types
  AppUser,
  UserRole,
  Permission,
  UserLookupOptions,
  UserLookupResponse,
  UserCreateData,
  UserCreateResponse,
  // Permissions types
  PermissionsOptions,
  PermissionsResponse,
  // Navigation types
  NavigationOptions,
  NavigationResponse,
  // Continuum types
  ContinuumMark,
  MarkSubject,
  MarkParty,
  Trip,
  UserIdentity,
  CreateVisitParams,
  GetVisitsParams,
  CreateTripParams,
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
    cache: 'no-store', // Disable fetch caching
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    // Try to get the response body as text first, then parse as JSON
    let errorData: any = {}
    let responseText = ""
    
    try {
      responseText = await response.text()
      if (responseText) {
        try {
          errorData = JSON.parse(responseText)
        } catch (parseError) {
          // If JSON parsing fails, use the raw text
          errorData = { rawResponse: responseText }
        }
      }
    } catch (textError) {
      console.error("❌ [RADIUS-API-CLIENT] Failed to read response body:", textError)
    }
    
    const errorMessage = `API request failed: ${response.statusText}. ${errorData.error || ""} ${errorData.details || ""}`
    
    // Log detailed error information for debugging
    const isDevelopment = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview"
    console.error("❌ [RADIUS-API-CLIENT] Request failed:", {
      status: response.status,
      statusText: response.statusText,
      url,
      errorData,
      responseText: responseText.substring(0, 500), // First 500 chars of response
      apiKeyPrefix: API_KEY?.substring(0, 12),
      apiKeyLength: API_KEY?.length,
      // Show full API key in development/preview
      apiKey: isDevelopment ? API_KEY : undefined,
      headers: {
        'x-api-key': API_KEY ? `${API_KEY.substring(0, 12)}...` : 'MISSING',
      },
    })
    
    // Include full error data in the error message for debugging
    const enhancedError = new Error(errorMessage)
    ;(enhancedError as any).responseData = errorData
    ;(enhancedError as any).responseText = responseText
    ;(enhancedError as any).status = response.status
    throw enhancedError
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
    
    // Add cache-busting timestamp to prevent edge/CDN caching
    params.append("_t", Date.now().toString())

    const queryString = params.toString()
    const endpoint = queryString ? `homes?${queryString}` : `homes?_t=${Date.now()}`

    const response = await apiRequest<any>(endpoint)
    return response.homes || response.data || []
  },

  /**
   * Look up a home by xref and return GUID
   */
  async lookupHomeByXref(xref: number | string): Promise<{ guid: string; name: string; xref: number }> {
    const params = new URLSearchParams()
    params.append("xref", xref.toString())

    const response = await apiRequest<{ success: boolean; guid: string; name: string; xref: number; timestamp?: string; duration_ms?: number }>(`homes/lookup?${params.toString()}`)
    // Extract only the fields we need (API Hub returns additional metadata)
    return {
      guid: response.guid,
      name: response.name,
      xref: response.xref,
    }
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

  // ============================================
  // Auth Methods
  // ============================================

  /**
   * Look up a user by clerk_user_id or email
   * Returns user with roles and permissions for the specified microservice
   */
  async lookupUser(options: UserLookupOptions): Promise<UserLookupResponse> {
    const params = new URLSearchParams()
    if (options.clerkUserId) params.append("clerkUserId", options.clerkUserId)
    if (options.email) params.append("email", options.email)
    if (options.microserviceCode) params.append("microserviceCode", options.microserviceCode)

    const queryString = params.toString()
    const endpoint = `auth/user-lookup?${queryString}`

    return await apiRequest<UserLookupResponse>(endpoint)
  },

  /**
   * Create a new user with default roles for the microservice
   * If user already exists, updates their information
   */
  async createUser(data: UserCreateData): Promise<UserCreateResponse> {
    return await apiRequest<UserCreateResponse>("auth/user-create", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Check if a user has access to the platform
   * - refugehouse.org users: always allowed
   * - External users: must have app_user record OR invitation
   */
  async checkUserAccess(params: {
    clerkUserId: string
    email: string
    firstName?: string
    lastName?: string
  }): Promise<{
    success: boolean
    hasAccess: boolean
    requiresInvitation: boolean
    isNewUser: boolean
    userExists: boolean
    hasInvitation: boolean
  }> {
    return await apiRequest("auth/check-access", {
      method: "POST",
      body: JSON.stringify(params),
    })
  },

  /**
   * Look up user and create if not found
   * Convenience method that combines lookupUser and createUser
   */
  async getOrCreateUser(options: UserCreateData): Promise<UserLookupResponse | UserCreateResponse> {
    // First try to look up the user
    const lookupResult = await this.lookupUser({
      clerkUserId: options.clerkUserId,
      email: options.email,
      microserviceCode: options.microserviceCode,
    })

    if (lookupResult.found && lookupResult.user) {
      return lookupResult
    }

    // User not found, create them
    return await this.createUser(options)
  },

  // ============================================
  // Permissions Methods
  // ============================================

  /**
   * Get user permissions and roles for a microservice
   */
  async getPermissions(options: PermissionsOptions): Promise<PermissionsResponse> {
    const params = new URLSearchParams()
    params.append("userId", options.userId)
    if (options.microserviceCode) params.append("microserviceCode", options.microserviceCode)

    const queryString = params.toString()
    const endpoint = `permissions?${queryString}`

    return await apiRequest<PermissionsResponse>(endpoint)
  },

  /**
   * Check if a user has a specific permission
   * Convenience method that fetches permissions and checks
   */
  async hasPermission(userId: string, permissionCode: string, microserviceCode?: string): Promise<boolean> {
    try {
      const permissions = await this.getPermissions({ userId, microserviceCode })
      return permissions.permissionCodes.includes(permissionCode)
    } catch (error) {
      console.error("Error checking permission:", error)
      return false
    }
  },

  // ============================================
  // Navigation Methods
  // ============================================

  /**
   * Get navigation items for a microservice, filtered by user permissions
   */
  async getNavigation(options: NavigationOptions): Promise<NavigationResponse> {
    const params = new URLSearchParams()
    if (options.userId) params.append("userId", options.userId)
    if (options.microserviceCode) params.append("microserviceCode", options.microserviceCode)
    if (options.userPermissions) params.append("userPermissions", JSON.stringify(options.userPermissions))

    const queryString = params.toString()
    const endpoint = `navigation?${queryString}`

    return await apiRequest<NavigationResponse>(endpoint)
  },

  // ============================================
  // Continuum / Visits Methods
  // ============================================

  /**
   * Create a visit (ContinuumMark + MarkSubject + MarkParty)
   * Creates a ContinuumMark record with linked subjects and parties
   */
  async createVisit(params: CreateVisitParams): Promise<{ markId: string }> {
    return await apiRequest<{ markId: string }>("visits", {
      method: "POST",
      body: JSON.stringify(params),
    })
  },

  /**
   * Get visits with optional filtering
   * Returns ContinuumMark records with optional filters
   */
  async getVisits(params?: GetVisitsParams): Promise<ContinuumMark[]> {
    const queryParams = new URLSearchParams()
    if (params?.homeGuid) queryParams.append("homeGuid", params.homeGuid)
    if (params?.staffGuid) queryParams.append("staffGuid", params.staffGuid)
    if (params?.startDate) queryParams.append("startDate", params.startDate)
    if (params?.endDate) queryParams.append("endDate", params.endDate)

    const queryString = queryParams.toString()
    const endpoint = queryString ? `visits?${queryString}` : "visits"

    const result = await apiRequest<{ visits: ContinuumMark[] }>(endpoint)
    return result.visits || []
  },

  /**
   * Create a trip linked to a visit
   * Creates a trip record that can be linked to a ContinuumMark via RelatedMarkID
   */
  async createTrip(params: CreateTripParams): Promise<{ tripId: string }> {
    return await apiRequest<{ tripId: string }>("trips", {
      method: "POST",
      body: JSON.stringify(params),
    })
  },

  // ============================================
  // Visit Forms Methods
  // ============================================

  /**
   * Create or update a visit form
   * If a form exists for the appointment, it will be updated; otherwise, a new form is created
   */
  async createVisitForm(data: any): Promise<{ visitFormId: string; message: string; isAutoSave?: boolean }> {
    return await apiRequest<{ visitFormId: string; message: string; isAutoSave?: boolean }>("visit-forms", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Update an existing visit form by ID
   */
  async updateVisitForm(
    visitFormId: string,
    data: any
  ): Promise<{ visitFormId: string; message: string; isAutoSave?: boolean }> {
    return await apiRequest<{ visitFormId: string; message: string; isAutoSave?: boolean }>(`visit-forms/${visitFormId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  /**
   * Get a specific visit form by ID
   */
  async getVisitForm(visitFormId: string): Promise<VisitForm> {
    const response = await apiRequest<{ visitForm: VisitForm }>(`visit-forms/${visitFormId}`)
    return response.visitForm
  },

  /**
   * Delete (soft delete) a visit form by ID
   */
  async deleteVisitForm(
    visitFormId: string,
    deletedByUserId?: string,
    deletedByName?: string
  ): Promise<{ visitFormId: string; message: string }> {
    return await apiRequest<{ visitFormId: string; message: string }>(`visit-forms/${visitFormId}`, {
      method: "DELETE",
      body: JSON.stringify({
        deletedByUserId,
        deletedByName,
      }),
    })
  },

  // ============================================
  // Appointments Methods
  // ============================================

  /**
   * Create a new appointment
   */
  async createAppointment(data: any): Promise<{ appointmentId: string; message: string }> {
    return await apiRequest<{ appointmentId: string; message: string }>("appointments", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Update an existing appointment by ID
   */
  async updateAppointment(
    appointmentId: string,
    data: any
  ): Promise<{ appointmentId: string; message: string }> {
    return await apiRequest<{ appointmentId: string; message: string }>(`appointments/${appointmentId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  /**
   * Get a specific appointment by ID
   */
  async getAppointment(appointmentId: string): Promise<Appointment> {
    const response = await apiRequest<{ appointment: Appointment }>(`appointments/${appointmentId}`)
    return response.appointment
  },

  /**
   * Delete (soft delete) an appointment by ID
   */
  async deleteAppointment(
    appointmentId: string,
    deletedByUserId?: string,
    deletedByName?: string
  ): Promise<{ appointmentId: string; message: string; deletedVisitForms?: number }> {
    return await apiRequest<{ appointmentId: string; message: string; deletedVisitForms?: number }>(`appointments/${appointmentId}`, {
      method: "DELETE",
      body: JSON.stringify({
        deletedByUserId,
        deletedByName,
      }),
    })
  },

  // ============================================
  // Dashboard Methods
  // ============================================

  /**
   * Get dashboard data for home liaison users
   */
  async getDashboardHomeLiaison(userEmail: string): Promise<any> {
    const params = new URLSearchParams()
    params.append("userEmail", userEmail)

    const response = await apiRequest<{ data: any }>(`dashboard/home-liaison?${params.toString()}`)
    return response.data
  },

  // ============================================
  // Travel Legs Methods
  // ============================================

  /**
   * Get travel legs with optional filters
   */
  async getTravelLegs(filters?: {
    staffUserId?: string
    date?: string
    journeyId?: string
    status?: string
    appointmentId?: string
    includeDeleted?: boolean
  }): Promise<any[]> {
    const params = new URLSearchParams()
    if (filters?.staffUserId) params.append("staffUserId", filters.staffUserId)
    if (filters?.date) params.append("date", filters.date)
    if (filters?.journeyId) params.append("journeyId", filters.journeyId)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.appointmentId) params.append("appointmentId", filters.appointmentId)
    if (filters?.includeDeleted) params.append("includeDeleted", "true")

    const queryString = params.toString()
    const endpoint = queryString ? `travel-legs?${queryString}` : "travel-legs"

    const response = await apiRequest<{ legs: any[] }>(endpoint)
    return response.legs || []
  },

  /**
   * Create a new travel leg
   */
  async createTravelLeg(data: any): Promise<{ leg_id: string; journey_id: string; leg_sequence: number; created_at: Date }> {
    return await apiRequest<{ leg_id: string; journey_id: string; leg_sequence: number; created_at: Date }>("travel-legs", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Complete a travel leg (add end point and calculate mileage)
   */
  async completeTravelLeg(
    legId: string,
    data: any
  ): Promise<{ calculated_mileage: number; estimated_toll_cost: number | null; duration_minutes: number | null }> {
    return await apiRequest<{ calculated_mileage: number; estimated_toll_cost: number | null; duration_minutes: number | null }>(`travel-legs/${legId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  /**
   * Cancel a travel leg
   */
  async cancelTravelLeg(legId: string, updatedByUserId?: string): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>(`travel-legs/${legId}`, {
      method: "DELETE",
      body: JSON.stringify({
        updated_by_user_id: updatedByUserId,
      }),
    })
  },

  // ============================================
  // On-Call Methods
  // ============================================

  /**
   * Get on-call schedules with optional filters
   */
  async getOnCallSchedules(filters?: {
    startDate?: string
    endDate?: string
    userId?: string
    type?: string
    includeDeleted?: boolean
  }): Promise<any[]> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append("startDate", filters.startDate)
    if (filters?.endDate) params.append("endDate", filters.endDate)
    if (filters?.userId) params.append("userId", filters.userId)
    if (filters?.type) params.append("type", filters.type)
    if (filters?.includeDeleted) params.append("includeDeleted", "true")

    const queryString = params.toString()
    const endpoint = queryString ? `on-call?${queryString}` : "on-call"

    const response = await apiRequest<{ schedules: any[] }>(endpoint)
    return response.schedules || []
  },

  /**
   * Create a new on-call schedule assignment
   */
  async createOnCallSchedule(data: any): Promise<{ id: string; created_at: Date }> {
    return await apiRequest<{ id: string; created_at: Date }>("on-call", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Get a specific on-call schedule by ID
   */
  async getOnCallSchedule(scheduleId: string): Promise<any> {
    const response = await apiRequest<{ schedule: any }>(`on-call/${scheduleId}`)
    return response.schedule
  },

  /**
   * Update an existing on-call schedule
   */
  async updateOnCallSchedule(scheduleId: string, data: any): Promise<{ id: string; message: string }> {
    return await apiRequest<{ id: string; message: string }>(`on-call/${scheduleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete (soft delete) an on-call schedule
   */
  async deleteOnCallSchedule(
    scheduleId: string,
    deletedByUserId?: string,
    deletedByName?: string
  ): Promise<{ id: string; message: string }> {
    return await apiRequest<{ id: string; message: string }>(`on-call/${scheduleId}`, {
      method: "DELETE",
      body: JSON.stringify({
        deletedByUserId,
        deletedByName,
      }),
    })
  },

  // ============================================
  // Settings Methods
  // ============================================

  /**
   * Get a specific setting by key
   */
  async getSetting(key: string): Promise<any> {
    const params = new URLSearchParams()
    params.append("key", key)
    const response = await apiRequest<any>(`settings?${params.toString()}`)
    return response.setting
  },

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<any[]> {
    const response = await apiRequest<{ settings: any[] }>("settings")
    return response.settings || []
  },

  /**
   * Update a setting
   */
  async updateSetting(key: string, value: string, description?: string, modifiedBy?: string): Promise<{ success: boolean; message: string }> {
    return await apiRequest<{ success: boolean; message: string }>("settings", {
      method: "PUT",
      body: JSON.stringify({ key, value, description, modifiedBy }),
    })
  },

  // ============================================
  // Home Prepopulation Methods
  // ============================================

  /**
   * Get home prepopulation data for visit forms
   */
  async getHomePrepopulationData(homeGuid: string): Promise<any> {
    const response = await apiRequest<{ success: boolean; [key: string]: any }>(`homes/${homeGuid}/prepopulate`)
    // Return the entire response (it contains home, household, placements, etc.)
    return response
  },
}

