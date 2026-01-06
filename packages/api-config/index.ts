/**
 * @refugehouse/api-config
 * 
 * Centralized API endpoint definitions and configuration
 * 
 * This package provides the single source of truth for all API endpoints
 * available through the Radius API Hub. Used for:
 * - Auto-generating API documentation
 * - Type safety across microservices
 * - API catalog dashboard
 * 
 * @example
 * ```typescript
 * import { API_ENDPOINTS, getEndpointsByCategory } from '@refugehouse/api-config'
 * 
 * // Get all endpoints
 * const allEndpoints = API_ENDPOINTS
 * 
 * // Get endpoints grouped by category
 * const categories = getEndpointsByCategory()
 * 
 * // Find specific endpoint
 * const homesEndpoint = getEndpointByPath('/api/radius/homes')
 * ```
 */

export { API_ENDPOINTS, getEndpointsByCategory, getEndpointByPath, getCategories } from "./endpoints"
export type { ApiEndpoint, ApiParameter, ApiCategory } from "./types"

