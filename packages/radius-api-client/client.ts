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
}

