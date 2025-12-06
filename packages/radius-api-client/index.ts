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
 * ```
 */

export { radiusApiClient } from "./client"
export type {
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

