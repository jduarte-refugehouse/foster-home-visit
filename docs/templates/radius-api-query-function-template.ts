import { query } from "@refugehouse/shared-core/db"

/**
 * TypeScript interface for your data type
 * Match the structure of your database table
 */
export interface YourDataType {
  id: string
  name: string
  // Add other fields from your database table
  // Use camelCase for field names
  // Example: birthDate, homeId, etc.
}

/**
 * Fetch your data from RadiusBifrost
 * Uses the locked database connection safely
 * 
 * @param filters - Optional filters for the query
 * @returns Promise<YourDataType[]> - Array of data records
 */
export async function fetchYourData(filters?: {
  // Define your filter options here
  search?: string
  status?: string
  // Add other filter options as needed
}): Promise<YourDataType[]> {
  console.log("🔵 [Extension] Fetching your data from database...")

  // Build WHERE clause dynamically based on filters
  let whereClause = "WHERE 1=1"
  const params: any[] = []

  // Add filters to WHERE clause
  if (filters?.search) {
    whereClause += ` AND [ColumnName] LIKE @param${params.length}`
    params.push(`%${filters.search}%`)
  }

  if (filters?.status) {
    whereClause += ` AND [StatusColumn] = @param${params.length}`
    params.push(filters.status)
  }

  // Build your SQL query
  // IMPORTANT: Always use parameterized queries (@param0, @param1, etc.)
  // NEVER concatenate user input directly into SQL
  const queryText = `
    SELECT 
      [ID] as id,
      [Name] as name,
      -- Add other columns from your table
      -- Use aliases to match your TypeScript interface (camelCase)
    FROM YourTableName
    ${whereClause}
    ORDER BY [Name]
  `

  try {
    const results = await query<any>(queryText, params)
    console.log(`✅ [Extension] Retrieved ${results.length} records from database`)

    // Process and validate results
    // Map database column names to your TypeScript interface
    const processedData: YourDataType[] = results.map((item) => ({
      id: item.id || "",
      name: item.name || "",
      // Map other fields, handling null/undefined values
      // Example: birthDate: item.birthDate || "",
    }))

    return processedData
  } catch (error) {
    console.error("❌ [Extension] Error fetching your data:", error)
    throw error
  }
}

