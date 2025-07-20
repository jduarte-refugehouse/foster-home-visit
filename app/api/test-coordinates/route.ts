import { NextResponse } from "next/server"
import { query, healthCheck } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("=== 🧪 Testing coordinate column access ===")

    const isHealthy = await healthCheck()
    if (!isHealthy) {
      return NextResponse.json({ success: false, error: "Database unhealthy" }, { status: 503 })
    }

    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: {},
    }

    // Test 1: Check what columns we can actually see
    try {
      console.log("Test 1: Checking available columns...")
      const columnInfo = await query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'SyncActiveHomes' 
        ORDER BY ORDINAL_POSITION
      `)
      results.tests.availableColumns = {
        success: true,
        data: columnInfo,
        count: columnInfo.length,
      }
      console.log(`Found ${columnInfo.length} columns`)
    } catch (error) {
      results.tests.availableColumns = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 2: Try to select ONLY the coordinate columns
    try {
      console.log("Test 2: Selecting only coordinate columns...")
      const coordOnly = await query(`
        SELECT TOP 3 [Latitude], [Longitude] 
        FROM SyncActiveHomes
      `)
      results.tests.coordinatesOnly = {
        success: true,
        data: coordOnly,
        count: coordOnly.length,
      }
      console.log("Coordinate-only query result:", coordOnly)
    } catch (error) {
      results.tests.coordinatesOnly = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      console.error("Coordinate-only query failed:", error)
    }

    // Test 3: Try with explicit schema
    try {
      console.log("Test 3: Using explicit schema...")
      const schemaQuery = await query(`
        SELECT TOP 3 dbo.SyncActiveHomes.[Latitude], dbo.SyncActiveHomes.[Longitude]
        FROM dbo.SyncActiveHomes
      `)
      results.tests.explicitSchema = {
        success: true,
        data: schemaQuery,
        count: schemaQuery.length,
      }
    } catch (error) {
      results.tests.explicitSchema = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 4: Check user permissions on the table
    try {
      console.log("Test 4: Checking user permissions...")
      const permissions = await query(`
        SELECT 
          p.permission_name,
          p.state_desc,
          pr.name as principal_name
        FROM sys.database_permissions p
        LEFT JOIN sys.objects o ON p.major_id = o.object_id
        LEFT JOIN sys.database_principals pr ON p.grantee_principal_id = pr.principal_id
        WHERE o.name = 'SyncActiveHomes'
      `)
      results.tests.permissions = {
        success: true,
        data: permissions,
        count: permissions.length,
      }
    } catch (error) {
      results.tests.permissions = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 5: Try a basic select with HomeName and coordinates
    try {
      console.log("Test 5: Basic select with HomeName and coordinates...")
      const basicSelect = await query(`
        SELECT TOP 3 
          [HomeName],
          [Latitude],
          [Longitude]
        FROM SyncActiveHomes 
        WHERE [HomeName] IS NOT NULL
      `)
      results.tests.basicSelect = {
        success: true,
        data: basicSelect,
        count: basicSelect.length,
      }
      console.log("Basic select result:", basicSelect)
    } catch (error) {
      results.tests.basicSelect = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      console.error("Basic select failed:", error)
    }

    // Test 6: Check current user and database context
    try {
      console.log("Test 6: Checking user context...")
      const userContext = await query(`
        SELECT 
          SUSER_SNAME() as login_name,
          USER_NAME() as user_name,
          DB_NAME() as database_name,
          SCHEMA_NAME() as default_schema
      `)
      results.tests.userContext = {
        success: true,
        data: userContext,
      }
    } catch (error) {
      results.tests.userContext = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Coordinate test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
