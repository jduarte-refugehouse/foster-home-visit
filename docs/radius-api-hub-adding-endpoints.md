# Adding New Endpoints to Radius API Hub

This guide walks you through adding a new endpoint to the Radius API Hub. Follow these steps in order.

## Quick Checklist

- [ ] Create query function in `lib/db-extensions.ts`
- [ ] Create API endpoint in `app/api/radius/[endpoint-name]/route.ts`
- [ ] Add TypeScript types in `packages/radius-api-client/types.ts`
- [ ] Add client method in `packages/radius-api-client/client.ts`
- [ ] Export types from `packages/radius-api-client/index.ts`
- [ ] Update API config in `packages/api-config/endpoints.ts` (optional)
- [ ] Test the endpoint

## Step-by-Step Guide

### Step 1: Create Query Function

**File**: `lib/db-extensions.ts`

Add your query function following this pattern:

```typescript
export interface YourDataType {
  id: string
  name: string
  // ... other fields
}

export async function fetchYourData(filters?: {
  // Define filter options
  search?: string
  status?: string
}): Promise<YourDataType[]> {
  console.log("🔵 [Extension] Fetching your data from database...")

  let whereClause = "WHERE 1=1"
  const params: any[] = []

  // Add filters
  if (filters?.search) {
    whereClause += ` AND [ColumnName] LIKE @param${params.length}`
    params.push(`%${filters.search}%`)
  }

  if (filters?.status) {
    whereClause += ` AND [StatusColumn] = @param${params.length}`
    params.push(filters.status)
  }

  const queryText = `
    SELECT 
      [ID] as id,
      [Name] as name,
      -- Add other columns
    FROM YourTableName
    ${whereClause}
    ORDER BY [Name]
  `

  try {
    const results = await query<any>(queryText, params)
    console.log(`✅ [Extension] Retrieved ${results.length} records`)

    // Process and validate results
    return results.map((item) => ({
      id: item.id || "",
      name: item.name || "",
      // Map other fields
    }))
  } catch (error) {
    console.error("❌ [Extension] Error fetching data:", error)
    throw error
  }
}
```

**Best Practices:**
- Always use parameterized queries (`@param0`, `@param1`, etc.)
- Validate and sanitize input
- Handle null/undefined values
- Add console logging for debugging
- Return typed interfaces

### Step 2: Create API Endpoint

**File**: `app/api/radius/[endpoint-name]/route.ts`

Copy the template from `docs/templates/radius-api-endpoint-template.ts` and customize:

**Key sections to customize:**
1. Import your query function
2. Update query parameter parsing
3. Update response structure
4. Update error messages

**Example structure:**
```typescript
import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { fetchYourData, type YourDataType } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

/**
 * GET /api/radius/your-endpoint-name
 * 
 * Description of what this endpoint does
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - search: Search term (optional)
 * - status: Filter by status (optional)
 * 
 * Returns: { success: boolean, count: number, data: YourDataType[], timestamp: string }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  // Log that the endpoint was called
  console.log(`🔵 [RADIUS-API] /api/radius/your-endpoint-name endpoint called`)

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    console.log(
      `✅ [RADIUS-API] Authenticated request from microservice: ${validation.key?.microservice_code}`
    )

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters: {
      search?: string
      status?: string
    } = {}

    if (searchParams.get("search")) {
      filters.search = searchParams.get("search")!
    }
    if (searchParams.get("status")) {
      filters.status = searchParams.get("status")!
    }

    // 3. Query RadiusBifrost directly
    console.log(`🔵 [RADIUS-API] Fetching data with filters:`, filters)
    const data = await fetchYourData(filters)

    const duration = Date.now() - startTime
    console.log(
      `✅ [RADIUS-API] Successfully retrieved ${data.length} records in ${duration}ms`
    )

    // 4. Return response
    return NextResponse.json({
      success: true,
      count: data.length,
      data, // or use a more specific name like "items", "records", etc.
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}
```

### Step 3: Add TypeScript Types

**File**: `packages/radius-api-client/types.ts`

Add your data type and options interface:

```typescript
export interface YourDataType {
  id: string
  name: string
  // ... other fields matching your query function interface
}

export interface YourDataOptions {
  search?: string
  status?: string
  // ... other filter options
}
```

### Step 4: Add Client Method

**File**: `packages/radius-api-client/client.ts`

Add a method to the `radiusApiClient` object:

```typescript
export const radiusApiClient = {
  // ... existing methods ...

  /**
   * Get your data with optional filters
   */
  async getYourData(options?: YourDataOptions): Promise<YourDataType[]> {
    const params = new URLSearchParams()
    if (options?.search) params.append("search", options.search)
    if (options?.status) params.append("status", options.status)

    const queryString = params.toString()
    const endpoint = queryString ? `your-endpoint-name?${queryString}` : "your-endpoint-name"

    const response = await apiRequest<any>(endpoint)
    // Extract the data array from response
    // Response structure: { success: true, count: number, data: YourDataType[] }
    return response.data || response.items || response.records || []
  },
}
```

**Important**: Match the response field name from your endpoint. Common names:
- `data` (most common)
- `items`
- `records`
- `homes`, `appointments`, etc. (specific to the endpoint)

### Step 5: Export Types

**File**: `packages/radius-api-client/index.ts`

Add your types to the exports:

```typescript
export type {
  // ... existing types ...
  YourDataType,
  YourDataOptions,
} from "./types"
```

### Step 6: Update API Config (Optional)

**File**: `packages/api-config/endpoints.ts`

Add your endpoint to the configuration for documentation:

```typescript
export const API_ENDPOINTS = {
  radius: {
    // ... existing endpoints ...
    yourEndpointName: {
      path: "/api/radius/your-endpoint-name",
      method: "GET",
      category: "Your Category",
      description: "Description of what this endpoint does",
      params: {
        search: { type: "string", required: false, description: "Search term" },
        status: { type: "string", required: false, description: "Filter by status" },
      },
      response: {
        success: "boolean",
        count: "number",
        data: "YourDataType[]",
        timestamp: "string",
        duration_ms: "number",
      },
    },
  },
}
```

## Testing Your Endpoint

### 1. Test from Admin Microservice

```bash
curl -H "x-api-key: rh_your_test_key" \
  "https://admin.test.refugehouse.app/api/radius/your-endpoint-name?search=test"
```

### 2. Test from Another Microservice

```typescript
import { radiusApiClient } from '@refugehouse/radius-api-client'

const data = await radiusApiClient.getYourData({ search: "test" })
console.log(data)
```

### 3. Test via Test Endpoint

Add to `/api/test-api-hub/route.ts`:

```typescript
// Test your new endpoint
const yourData = await radiusApiClient.getYourData()
console.log(`✅ [TEST] Retrieved ${yourData.length} records`)
```

## Naming Conventions

- **Endpoint paths**: Use kebab-case (`your-endpoint-name`)
- **Function names**: Use camelCase (`fetchYourData`, `getYourData`)
- **Type names**: Use PascalCase (`YourDataType`, `YourDataOptions`)
- **File names**: Use kebab-case (`your-endpoint-name/route.ts`)

## Response Structure

All endpoints should follow this structure:

```typescript
{
  success: boolean
  count: number
  data: YourDataType[]  // or specific name like "homes", "appointments"
  timestamp: string     // ISO 8601 format
  duration_ms: number   // Request duration in milliseconds
}
```

Error responses:

```typescript
{
  success: false
  count: 0
  data: []
  error: string
  timestamp: string
  duration_ms: number
}
```

## Security Checklist

- [ ] API key validation is implemented
- [ ] SQL queries use parameterized statements
- [ ] Input validation is performed
- [ ] Error messages don't expose sensitive information
- [ ] Rate limiting is considered (if needed)

## Common Patterns

### Pattern 1: Simple List Endpoint

```typescript
// Query function
export async function fetchItems(): Promise<Item[]> {
  const queryText = `SELECT * FROM Items ORDER BY Name`
  return await query<Item>(queryText, [])
}

// Endpoint
export async function GET(request: NextRequest) {
  // Validate API key
  // Call fetchItems()
  // Return results
}
```

### Pattern 2: Filtered List Endpoint

```typescript
// Query function with filters
export async function fetchItems(filters?: { status?: string }): Promise<Item[]> {
  let whereClause = "WHERE 1=1"
  const params: any[] = []
  
  if (filters?.status) {
    whereClause += ` AND Status = @param${params.length}`
    params.push(filters.status)
  }
  
  const queryText = `SELECT * FROM Items ${whereClause} ORDER BY Name`
  return await query<Item>(queryText, params)
}
```

### Pattern 3: Single Item by ID

```typescript
// Query function
export async function fetchItemById(id: string): Promise<Item | null> {
  const queryText = `SELECT * FROM Items WHERE ID = @param0`
  const results = await query<Item>(queryText, [id])
  return results[0] || null
}

// Endpoint uses path parameter
// app/api/radius/items/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await fetchItemById(params.id)
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ success: true, item })
}
```

## Troubleshooting

### Issue: Endpoint returns 401 Unauthorized

**Solution**: Check that:
- API key is being sent in `x-api-key` header
- API key exists in database and is active
- Vercel deployment protection is disabled for API routes

### Issue: Endpoint returns empty array

**Solution**: Check that:
- Query function is returning data correctly
- Filters are not too restrictive
- Database connection is working

### Issue: Type errors in client

**Solution**: Check that:
- Types are exported from `index.ts`
- Types match between query function and client
- Response field name matches in client method

## Next Steps

After creating your endpoint:

1. **Document it** in `docs/radius-api-hub.md`
2. **Add examples** to the documentation
3. **Update API health dashboard** if needed
4. **Notify team** of the new endpoint availability

## Template Files

See `docs/templates/` for ready-to-use templates:
- `radius-api-endpoint-template.ts` - API endpoint template
- `radius-api-client-method-template.ts` - Client method template
- `radius-api-query-function-template.ts` - Query function template

