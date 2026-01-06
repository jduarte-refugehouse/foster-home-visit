import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@refugehouse/shared-core/db"
import { getMicroserviceCode, getDeploymentEnvironment, MICROSERVICE_CONFIG, shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60 // Increase timeout to 60 seconds

/**
 * TEMPORARY: Helper function to generate readable SQL for debugging
 * This substitutes parameters into the query for SSMS testing
 * WARNING: This is for debugging only - never use this for actual queries (SQL injection risk)
 */
function generateReadableSQL(query: string, params: Record<string, any>): string {
  let readableSQL = query
  // Replace @param0, @param1, etc. with actual values
  Object.entries(params).forEach(([key, value]) => {
    const paramName = key.startsWith('param') ? `@${key}` : key
    // Escape single quotes in string values
    const escapedValue = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value
    readableSQL = readableSQL.replace(new RegExp(`@${key}\\b`, 'g'), String(escapedValue))
  })
  return readableSQL
}

export async function GET(request: NextRequest) {
  console.log("🔍 Navigation API called")

  try {
    // Get user identity from request headers (set by the client-side auth)
    const userEmail = request.headers.get("x-user-email")
    const userClerkId = request.headers.get("x-user-clerk-id")
    const userName = request.headers.get("x-user-name")

    console.log("👤 User identity from headers:")
    console.log("- Email:", userEmail)
    console.log("- Clerk ID:", userClerkId)
    console.log("- Name:", userName)

    let userPermissions: string[] = []
    let userInfo = null

    // Get microservice code and check if we should use API client
    const microserviceCode = getMicroserviceCode()
    const useApiClient = shouldUseRadiusApiClient()
    
    console.log(`🌍 [NAV] Microservice: ${microserviceCode}, useApiClient: ${useApiClient}`)
    console.log(`🌍 [NAV] User headers - Email: ${userEmail}, ClerkId: ${userClerkId}, Name: ${userName}`)

    if (userClerkId || userEmail) {
      console.log(`👤 [NAV] User identified: ${userEmail} (${userClerkId})`)
      console.log(`👤 [NAV] User name from headers: ${userName}`)

      // NO DB FALLBACK - must use API client for non-admin microservices
      if (useApiClient) {
        console.log(`✅ [NAV] Using API client to lookup user (microservice: ${microserviceCode})`)
        try {
          // Use API client to lookup user and get permissions
          const lookupResult = await radiusApiClient.lookupUser({
            clerkUserId: userClerkId || undefined,
            email: userEmail || undefined,
            microserviceCode: microserviceCode,
          })

          if (lookupResult.found && lookupResult.user) {
            userInfo = {
              id: lookupResult.user.id,
              email: lookupResult.user.email,
              first_name: lookupResult.user.first_name || "",
              last_name: lookupResult.user.last_name || "",
              is_active: lookupResult.user.is_active,
              clerk_user_id: lookupResult.user.clerk_user_id,
            }
            userPermissions = (lookupResult.permissions || []).map((p: any) => p.permission_code || p.code)
            console.log(`✅ [NAV] Found user via API: ${userInfo.email} (${userInfo.first_name} ${userInfo.last_name})`)
            console.log(`🔑 [NAV] User permissions:`, userPermissions)
          } else {
            console.log("⚠️ [NAV] User not found via API client")
            userInfo = null
            userPermissions = []
          }
        } catch (userError) {
          console.error("❌ [NAV] Error loading user via API client:", userError)
          userInfo = null
          userPermissions = []
        }
      } else {
        // Admin microservice: use direct DB access (existing code)
        // SECURITY: Only allow direct DB access for admin microservice
        // Note: Don't throw here - this IS the admin microservice, direct DB is allowed
        console.log(`✅ [NAV] Using direct DB access (admin microservice: ${microserviceCode})`)
        try {
          // Get user permissions from database
          const connection = await getConnection()

          // First, get the app user record using either clerk_user_id or email
          let userQuery = ""
          let queryParam = ""

          // Check for impersonation first
          const impersonatedUserId = request.cookies.get("impersonate_user_id")?.value
          const isServiceDomainAdmin = microserviceCode === 'service-domain-admin'
          const deploymentEnv = isServiceDomainAdmin ? getDeploymentEnvironment() : null
          
          if (impersonatedUserId) {
            // For admin service, don't filter by environment - users should work in both test and production
            if (isServiceDomainAdmin) {
              userQuery = `SELECT id, email, first_name, last_name, is_active, clerk_user_id, user_type, environment FROM app_users WHERE id = @param0 AND (user_type = 'global_admin' OR user_type IS NULL) AND is_active = 1`
            } else {
              userQuery = `SELECT id, email, first_name, last_name, is_active, clerk_user_id, user_type, environment FROM app_users WHERE id = @param0 AND is_active = 1`
            }
            queryParam = impersonatedUserId
          } else if (userClerkId) {
            // For admin service, don't filter by environment - users should work in both test and production
            // Only filter by user_type for global_admin access
            if (isServiceDomainAdmin) {
              userQuery = `SELECT id, email, first_name, last_name, is_active, clerk_user_id, user_type, environment FROM app_users WHERE clerk_user_id = @param0 AND (user_type = 'global_admin' OR user_type IS NULL) AND is_active = 1`
            } else {
              userQuery = `SELECT id, email, first_name, last_name, is_active, clerk_user_id, user_type, environment FROM app_users WHERE clerk_user_id = @param0 AND is_active = 1`
            }
            queryParam = userClerkId
          } else if (userEmail) {
            // For admin service, don't filter by environment - users should work in both test and production
            // Only filter by user_type for global_admin access
            if (isServiceDomainAdmin) {
              userQuery = `SELECT id, email, first_name, last_name, is_active, clerk_user_id, user_type, environment FROM app_users WHERE email = @param0 AND (user_type = 'global_admin' OR user_type IS NULL) AND is_active = 1`
            } else {
              userQuery = `SELECT id, email, first_name, last_name, is_active, clerk_user_id, user_type, environment FROM app_users WHERE email = @param0 AND is_active = 1`
            }
            queryParam = userEmail
          }

          console.log(`🔍 [NAV] Executing user query:`)
          console.log(`   Query: ${userQuery}`)
          console.log(`   Parameter: ${queryParam}`)
          console.log(`   IsServiceDomainAdmin: ${isServiceDomainAdmin}`)
          console.log(`   DeploymentEnv: ${deploymentEnv}`)
          
          const userRequest = connection.request().input("param0", queryParam)
          // Removed environment filter - users should work in both test and production
          const userResult = await userRequest.query(userQuery)

          console.log(`📊 [NAV] Query result: ${userResult.recordset.length} rows found`)
          if (userResult.recordset.length > 0) {
            console.log(`📊 [NAV] First row:`, JSON.stringify(userResult.recordset[0], null, 2))
          } else {
            console.log(`⚠️ [NAV] No user found with query: ${userQuery}`)
            console.log(`⚠️ [NAV] Query parameter was: ${queryParam}`)
            // Try a simpler query to see if user exists at all
            const simpleQuery = `SELECT id, email, first_name, last_name, is_active, clerk_user_id, user_type, environment FROM app_users WHERE email = @param0 OR clerk_user_id = @param1`
            const simpleResult = await connection.request()
              .input("param0", userEmail || "")
              .input("param1", userClerkId || "")
              .query(simpleQuery)
            console.log(`🔍 [NAV] Simple query (no filters) found ${simpleResult.recordset.length} rows`)
            if (simpleResult.recordset.length > 0) {
              console.log(`📊 [NAV] Simple query results:`, JSON.stringify(simpleResult.recordset, null, 2))
            }
          }

          if (userResult.recordset.length > 0) {
            userInfo = userResult.recordset[0]
            console.log(`✅ Found app user: ${userInfo.email} (${userInfo.first_name} ${userInfo.last_name})`)

            // Get user permissions for this microservice
            const permissionsQuery = `SELECT DISTINCT p.permission_code FROM user_permissions up INNER JOIN permissions p ON up.permission_id = p.id INNER JOIN microservice_apps ma ON p.microservice_id = ma.id WHERE up.user_id = @param0 AND ma.app_code = @param1 AND up.is_active = 1 AND (up.expires_at IS NULL OR up.expires_at > GETDATE())`
            
            const permissionsResult = await connection
              .request()
              .input("param0", userInfo.id)
              .input("param1", microserviceCode)
              .query(permissionsQuery)

            userPermissions = permissionsResult.recordset.map((row: any) => row.permission_code)
            console.log("🔑 User permissions:", userPermissions)
          } else {
            console.log("⚠️ No app user record found for:", queryParam)
          }
        } catch (userError) {
          console.error("❌ Error loading user permissions:", userError)
        }
      }
    } else {
      console.log("👤 No user identity found in request headers")
      // SECURITY: If no user identity, return empty navigation (fail securely)
      console.log("🔒 SECURITY: No user identity - returning empty navigation")
      return NextResponse.json({
        navigation: [],
        metadata: {
          source: "auth_required",
          totalItems: 0,
          visibleItems: 0,
          microservice: {
            code: getMicroserviceCode(),
            name: MICROSERVICE_CONFIG.name,
            description: MICROSERVICE_CONFIG.description,
          },
          timestamp: new Date().toISOString(),
          error: "User identity required",
          userPermissions: [],
          userInfo: null,
        },
      })
    }

    // SECURITY: If user lookup failed (userInfo is null), return empty navigation
    if (!userInfo) {
      console.log("🔒 SECURITY: User not found in database - returning empty navigation")
      return NextResponse.json({
        navigation: [],
        metadata: {
          source: "user_not_found",
          totalItems: 0,
          visibleItems: 0,
          microservice: {
            code: getMicroserviceCode(),
            name: MICROSERVICE_CONFIG.name,
            description: MICROSERVICE_CONFIG.description,
          },
          timestamp: new Date().toISOString(),
          error: "User not found in system",
          userPermissions: [],
          userInfo: null,
        },
      })
    }

    console.log(`🔍 Attempting to load navigation for microservice: ${microserviceCode}`)
    console.log(`🔍 [NAV] useApiClient check result: ${useApiClient} (microservice: ${microserviceCode})`)

    // Use API client for non-admin microservices, direct DB for admin
    if (useApiClient) {
      console.log(`✅ [NAV] Using API client path for microservice: ${microserviceCode}`)
      try {
        if (!userInfo || !userInfo.id) {
          console.error("❌ [NAV] User info not available for navigation lookup")
          return NextResponse.json({
            navigation: [],
            metadata: {
              source: "user_not_found",
              totalItems: 0,
              visibleItems: 0,
              microservice: {
                code: microserviceCode,
                name: MICROSERVICE_CONFIG.name,
                description: MICROSERVICE_CONFIG.description,
              },
              timestamp: new Date().toISOString(),
              error: "User not found in system",
              userPermissions: [],
              userInfo: null,
            },
          })
        }

        // Get navigation from API Hub (permissions already loaded from user lookup)
        const navigationResponse = await radiusApiClient.getNavigation({
          userId: userInfo.id,
          microserviceCode: microserviceCode,
          userPermissions: userPermissions,
        })

        // Transform API response to match expected format
        const response = {
          navigation: navigationResponse.navigation,
          collapsibleItems: navigationResponse.collapsibleItems || [],
          metadata: {
            ...navigationResponse.metadata,
            userInfo: {
              id: userInfo.id,
              email: userInfo.email || "",
              first_name: userInfo.first_name || "",
              last_name: userInfo.last_name || "",
            },
          },
        }

        console.log(`✅ [NAV] Navigation loaded from API Hub: ${navigationResponse.metadata.visibleItems} items`)
        return NextResponse.json(response)
      } catch (apiError) {
        console.error("❌ [NAV] Error fetching navigation from Radius API Hub:", apiError)
        console.error("❌ [NAV] Error details:", apiError instanceof Error ? apiError.stack : apiError)
        // Fall back to config if API fails (don't fall back to DB - that defeats the purpose)
        return createFallbackResponse(
          "api_error",
          apiError instanceof Error ? apiError.message : "Unknown API error",
          userPermissions,
          userInfo,
        )
      }
    } else {
      console.log(`⚠️ [NAV] Using direct DB access (admin microservice or useApiClient=false)`)
      // Admin microservice: use direct DB access (existing code)
      // SECURITY: Prevent direct DB access for non-admin microservices
      throwIfDirectDbNotAllowed("navigation endpoint - navigation items")
      // Try to load from database first
      try {
        const connection = await getConnection()

      // First, get the microservice ID
      const microserviceQuery = `
        SELECT id FROM microservice_apps 
        WHERE app_code = @param0 AND is_active = 1
      `

      console.log("📝 EXECUTING MICROSERVICE QUERY:")
      console.log("Query:", microserviceQuery)
      console.log("Parameter @param0:", microserviceCode)
      
      // TEMPORARY: Generate readable SQL for SSMS testing
      const readableMicroserviceSQL = generateReadableSQL(microserviceQuery, {
        param0: microserviceCode
      })
      console.log("═══════════════════════════════════════════════════════════")
      console.log("📋 READABLE SQL FOR SSMS TESTING (MICROSERVICE QUERY):")
      console.log("═══════════════════════════════════════════════════════════")
      console.log(readableMicroserviceSQL)
      console.log("═══════════════════════════════════════════════════════════")

      const microserviceResult = await connection
        .request()
        .input("param0", microserviceCode)
        .query(microserviceQuery)

      console.log("📊 MICROSERVICE QUERY RESULT:")
      console.log("Recordset length:", microserviceResult.recordset.length)
      console.log("Records:", JSON.stringify(microserviceResult.recordset, null, 2))

      if (microserviceResult.recordset.length === 0) {
        console.log(`⚠️ Microservice '${microserviceCode}' not found in database`)
        // SECURITY: Only return fallback if user is authenticated
        if (!userInfo) {
          console.log("🔒 SECURITY: User not authenticated - returning empty navigation")
          return NextResponse.json({
            navigation: [],
            metadata: {
              source: "auth_required",
              totalItems: 0,
              visibleItems: 0,
              microservice: {
                code: microserviceCode,
                name: MICROSERVICE_CONFIG.name,
                description: MICROSERVICE_CONFIG.description,
              },
              timestamp: new Date().toISOString(),
              error: "Microservice not registered and user not authenticated",
              userPermissions: [],
              userInfo: null,
            },
          })
        }
        return createFallbackResponse(
          "config_fallback",
          "Microservice not registered in database",
          userPermissions,
          userInfo,
        )
      }

      const microserviceId = microserviceResult.recordset[0].id
      console.log(`✅ Found microservice ID: ${microserviceId}`)

      // Get navigation items from database (with is_collapsible support)
      const navigationQuery = `
        SELECT 
          ni.id,
          ni.code,
          ni.title,
          ni.url,
          ni.icon,
          ni.permission_required,
          ni.category,
          ni.subcategory,
          ni.order_index,
          ISNULL(ni.is_collapsible, 0) as is_collapsible,
          ISNULL(ni.item_type, 'domain') as item_type,
          ma.app_name,
          ma.app_code,
          ma.description
        FROM navigation_items ni
        INNER JOIN microservice_apps ma ON ni.microservice_id = ma.id
        WHERE ni.microservice_id = @param0 
          AND ni.is_active = 1
          AND ma.is_active = 1
        ORDER BY 
          ni.is_collapsible,
          ni.category, 
          ni.order_index, 
          ni.subcategory
      `

      console.log("📝 EXECUTING NAVIGATION QUERY:")
      console.log("Query:", navigationQuery)
      console.log("Parameter @param0 (microservice_id):", microserviceId)
      
      // TEMPORARY: Generate readable SQL for SSMS testing
      const readableNavigationSQL = generateReadableSQL(navigationQuery, {
        param0: microserviceId
      })
      console.log("═══════════════════════════════════════════════════════════")
      console.log("📋 READABLE SQL FOR SSMS TESTING (NAVIGATION QUERY):")
      console.log("═══════════════════════════════════════════════════════════")
      console.log(readableNavigationSQL)
      console.log("═══════════════════════════════════════════════════════════")

      const navigationResult = await connection.request().input("param0", microserviceId).query(navigationQuery)

      console.log("📊 NAVIGATION QUERY RESULT:")
      console.log("Recordset length:", navigationResult.recordset.length)
      console.log("Records:", JSON.stringify(navigationResult.recordset, null, 2))

      const dbItems = navigationResult.recordset
      console.log(`📊 Found ${dbItems.length} navigation items in database`)

      if (dbItems.length === 0) {
        console.log("⚠️ No navigation items found in database")
        // SECURITY: Only return fallback if user is authenticated
        if (!userInfo) {
          console.log("🔒 SECURITY: User not authenticated - returning empty navigation")
          return NextResponse.json({
            navigation: [],
            metadata: {
              source: "auth_required",
              totalItems: 0,
              visibleItems: 0,
              microservice: {
                code: microserviceCode,
                name: MICROSERVICE_CONFIG.name,
                description: MICROSERVICE_CONFIG.description,
              },
              timestamp: new Date().toISOString(),
              error: "No navigation items and user not authenticated",
              userPermissions: [],
              userInfo: null,
            },
          })
        }
        return createFallbackResponse("config_fallback", "No navigation items in database", userPermissions, userInfo)
      }

      // Separate items into fixed and collapsible based on is_collapsible flag
      const fixedItems: any[] = []
      const collapsibleItems: any[] = []
      let visibleItemCount = 0
      let filteredItemCount = 0

      console.log("🔍 PROCESSING NAVIGATION ITEMS:")
      console.log(`User has permissions: [${userPermissions.join(", ")}]`)

      // Helper function to check permissions
      const checkPermission = (item: any): boolean => {
        if (!item.permission_required || item.permission_required.trim() === "") {
          return true // No permission required
        }

        const hasPermission = userPermissions.some((userPerm) => {
          // Direct match
          if (userPerm === item.permission_required) return true

          // Check for admin permissions that should grant access
          if (item.permission_required === "admin" && userPerm === "system_admin") return true
          if (
            item.permission_required === "user_manage" &&
            (userPerm === "manage_users" || userPerm === "system_admin")
          )
            return true
          if (
            item.permission_required === "admin.view" &&
            (userPerm === "system_admin" || userPerm === "manage_users")
          )
            return true
          if (item.permission_required === "system_config" && userPerm === "system_admin") return true
          if (item.permission_required === "system_admin_access" && userPerm === "system_admin_access") return true

          return false
        })

        return hasPermission
      }

      // Process all items and separate by is_collapsible flag
      dbItems.forEach((item: any) => {
        if (!checkPermission(item)) {
          console.log(`🔒 FILTERING OUT '${item.title}' - requires permission: '${item.permission_required}'`)
          filteredItemCount++
          return
        }

        const navItem = {
          code: item.code,
          title: item.title,
          url: item.url,
          icon: item.icon,
          order: item.order_index,
          category: item.category || "Administration",
          item_type: item.item_type || "domain",
        }

        // Separate based on is_collapsible flag
        if (item.is_collapsible === 1 || item.is_collapsible === true) {
          collapsibleItems.push(navItem)
          console.log(`✅ INCLUDING collapsible item '${item.title}' in category '${item.category}'`)
        } else {
          fixedItems.push(navItem)
          console.log(`✅ INCLUDING fixed item '${item.title}' in category '${item.category}'`)
        }

        visibleItemCount++
      })

      // Sort items within each group
      fixedItems.sort((a, b) => a.order - b.order)
      collapsibleItems.sort((a, b) => a.order - b.order)

      console.log(`\n📊 FILTERING SUMMARY:`)
      console.log(`Total items from DB: ${dbItems.length}`)
      console.log(`Items filtered out: ${filteredItemCount}`)
      console.log(`Fixed items included: ${fixedItems.length}`)
      console.log(`Collapsible items included: ${collapsibleItems.length}`)
      console.log(`Total items included: ${visibleItemCount}`)

      // Group fixed items by category for backward compatibility
      const fixedByCategory: { [category: string]: any[] } = {}
      fixedItems.forEach((item) => {
        if (!fixedByCategory[item.category]) {
          fixedByCategory[item.category] = []
        }
        fixedByCategory[item.category].push(item)
      })

      // Convert to array format
      const navigation = Object.entries(fixedByCategory).map(([category, items]) => ({
        title: category,
        items: items.sort((a, b) => a.order - b.order),
      }))

      console.log(`✅ Successfully loaded ${visibleItemCount} visible navigation items from database`)
      console.log(`   - Fixed items: ${fixedItems.length}`)
      console.log(`   - Collapsible items: ${collapsibleItems.length}`)
      console.log("🗄️ Navigation loaded from: database")
      console.log("📋 Final navigation structure:", JSON.stringify(navigation, null, 2))

      const microservice = dbItems[0]
        ? {
            code: dbItems[0].app_code,
            name: dbItems[0].app_name,
            description: dbItems[0].description,
          }
        : MICROSERVICE_CONFIG

      return NextResponse.json({
        navigation,
        collapsibleItems: collapsibleItems.length > 0 ? collapsibleItems : undefined,
        metadata: {
          source: "database",
          totalItems: dbItems.length,
          visibleItems: visibleItemCount,
          fixedItems: fixedItems.length,
          collapsibleItems: collapsibleItems.length,
          filteredItems: filteredItemCount,
          microservice,
          timestamp: new Date().toISOString(),
          dbError: null,
          userPermissions,
          userInfo,
        },
      })
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : "Unknown database error"
      console.error("❌ Database navigation query failed:", errorMessage)
      console.error("❌ Full error object:", dbError)

      // Check if it's a permission error
      if (
        errorMessage.includes("permission") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("Invalid object name")
      ) {
        console.log("🔑 Database permission or table issue detected, using config fallback")
        return createFallbackResponse(
          "config_fallback",
          `Database access issue: ${errorMessage}`,
          userPermissions,
          userInfo,
        )
      }

      console.log("⚠️ Database error, falling back to config")
      return createFallbackResponse("config_fallback", errorMessage, userPermissions, userInfo)
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("❌ Navigation API error:", errorMessage)
    console.error("❌ Full error object:", error)
    return createFallbackResponse("error_fallback", errorMessage, [], null)
  }
}

function createFallbackResponse(source: string, error: string, userPermissions: string[] = [], userInfo: any = null) {
  console.log(`📋 Using ${source} navigation`)

  // SECURITY: If user is not authenticated/found, return empty navigation (fail securely)
  if (!userInfo) {
    console.log("🔒 SECURITY: No user info in fallback - returning empty navigation")
    return NextResponse.json({
      navigation: [],
      metadata: {
        source: "auth_required",
        totalItems: 0,
        visibleItems: 0,
        microservice: {
          code: getMicroserviceCode(),
          name: MICROSERVICE_CONFIG.name,
          description: MICROSERVICE_CONFIG.description,
        },
        timestamp: new Date().toISOString(),
        dbError: error,
        userPermissions: [],
        userInfo: null,
      },
    })
  }

  // Get the actual detected microservice code (not the hardcoded config)
  const actualMicroserviceCode = getMicroserviceCode()
  console.log(`🔍 Fallback using microservice code: ${actualMicroserviceCode}`)

  // Only show fallback navigation if user IS authenticated (userInfo exists)
  // Filter navigation items by permissions
  const filteredNavigation = MICROSERVICE_CONFIG.defaultNavigation
    .map((section) => ({
      title: section.title,
      items: section.items
        .filter((item) => {
          // For now, show all items since we don't have permission checking implemented
          // In a real app, you'd check: !item.permission || userPermissions.includes(item.permission)
          console.log(`✅ Including fallback item: ${item.title}`)
          return true
        })
        .sort((a, b) => a.order - b.order),
    }))
    .filter((section) => section.items.length > 0)

  const totalItems = filteredNavigation.reduce((sum, section) => sum + section.items.length, 0)

  console.log(`✅ Loaded ${totalItems} items from ${source}`)
  console.log(`📋 Navigation loaded from: ${source}`)
  console.log("📋 Fallback navigation structure:", JSON.stringify(filteredNavigation, null, 2))

  return NextResponse.json({
    navigation: filteredNavigation,
    metadata: {
      source,
      totalItems,
      visibleItems: totalItems,
      microservice: {
        code: actualMicroserviceCode, // Use detected microservice code instead of hardcoded config
        name: MICROSERVICE_CONFIG.name,
        description: MICROSERVICE_CONFIG.description,
      },
      timestamp: new Date().toISOString(),
      dbError: error,
      userPermissions,
      userInfo,
    },
  })
}
