/**
 * Add this method to packages/radius-api-client/client.ts
 * Inside the radiusApiClient object
 */

/**
 * Get your data with optional filters
 * 
 * @param options - Filter options for the query
 * @returns Promise<YourDataType[]> - Array of data records
 * 
 * @example
 * ```typescript
 * // Get all data
 * const allData = await radiusApiClient.getYourData()
 * 
 * // Get filtered data
 * const filtered = await radiusApiClient.getYourData({ 
 *   search: "test",
 *   status: "active"
 * })
 * ```
 */
async getYourData(options?: YourDataOptions): Promise<YourDataType[]> {
  const params = new URLSearchParams()
  
  // Add query parameters if provided
  if (options?.search) {
    params.append("search", options.search)
  }
  if (options?.status) {
    params.append("status", options.status)
  }
  // Add other parameters as needed

  // Build endpoint URL with query string
  const queryString = params.toString()
  const endpoint = queryString 
    ? `your-endpoint-name?${queryString}` 
    : "your-endpoint-name"

  // Make API request
  const response = await apiRequest<any>(endpoint)
  
  // Extract data from response
  // IMPORTANT: Match the field name from your endpoint response
  // Common names: data, items, records, or specific names like "homes", "appointments"
  // Check your endpoint's response structure to use the correct field name
  return response.data || response.items || response.records || []
}

