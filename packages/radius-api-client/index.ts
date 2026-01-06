/**
 * @refugehouse/radius-api-client
 * 
 * Type-safe API client for accessing RadiusBifrost data via the centralized API hub
 * 
 * This package allows microservices to access RadiusBifrost data without requiring
 * their own static IP addresses. All requests go through admin.refugehouse.app
 * which has the static IPs configured.
 * 
 * @example
 * ```typescript
 * import { radiusApiClient } from '@refugehouse/radius-api-client'
 * 
 * // Get homes
 * const homes = await radiusApiClient.getHomes({ unit: 'RAD' })
 * 
 * // Get appointments
 * const appointments = await radiusApiClient.getAppointments({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * })
 * 
 * // Get visit forms
 * const forms = await radiusApiClient.getVisitForms({ appointmentId: '...' })
 * 
 * // Get users
 * const users = await radiusApiClient.getUsers({ microserviceCode: 'home-visits' })
 * 
 * // Auth: Look up or create user
 * const userResult = await radiusApiClient.lookupUser({ 
 *   clerkUserId: 'user_123', 
 *   microserviceCode: 'home-visits' 
 * })
 * 
 * // Permissions: Get user permissions
 * const permissions = await radiusApiClient.getPermissions({
 *   userId: 'user-guid',
 *   microserviceCode: 'home-visits'
 * })
 * 
 * // Navigation: Get filtered navigation items
 * const nav = await radiusApiClient.getNavigation({
 *   userId: 'user-guid',
 *   microserviceCode: 'home-visits'
 * })
 * ```
 */

export { radiusApiClient } from "./client"
export type {
  // Data types
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
  NavigationItem,
  NavigationGroup,
  NavigationOptions,
  NavigationMetadata,
  NavigationResponse,
} from "./types"

