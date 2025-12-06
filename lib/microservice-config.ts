// Microservice Configuration for Refuge House Template
// This file defines the microservice-specific settings that can be customized for each app

export interface NavigationItem {
  code: string
  title: string
  url: string
  icon: string
  permission?: string
  order: number
}

export interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export interface MicroserviceConfig {
  code: string
  name: string
  description: string
  url: string
  organizationDomain: string
  roles: Record<string, string>
  permissions: Record<string, string>
  defaultNavigation: NavigationSection[]
}

// Current microservice configuration
export const MICROSERVICE_CONFIG: MicroserviceConfig = {
  code: "home-visits",
  name: "Home Visits Application",
  description: "Foster care home visit scheduling and management",
  url: "/home-visits",
  organizationDomain: "refugehouse.org",

  // Define microservice-specific roles
  roles: {
    MANAGER: "visit_manager",
    COORDINATOR: "visit_coordinator",
    WORKER: "visit_worker",
    VIEWER: "visit_viewer",
  },

  // Define microservice-specific permissions
  permissions: {
    VIEW_VISITS: "view_visits",
    CREATE_VISITS: "create_visits",
    EDIT_VISITS: "edit_visits",
    DELETE_VISITS: "delete_visits",
    GENERATE_REPORTS: "generate_reports",
    VIEW_DIAGNOSTICS: "view_diagnostics",
    USER_MANAGEMENT: "user_management",
    SYSTEM_CONFIG: "system_config",
  },

  // Default navigation structure (used as fallback when database is unavailable)
  defaultNavigation: [
    {
      title: "Navigation",
      items: [
        { code: "dashboard", title: "Dashboard", url: "/dashboard", icon: "Home", order: 1 },
        {
          code: "visits_calendar",
          title: "Visits Calendar",
          url: "/visits-calendar",
          icon: "Calendar",
          permission: "view_visits",
          order: 2,
        },
        {
          code: "on_call_schedule",
          title: "On-Call Schedule",
          url: "/on-call-schedule",
          icon: "Shield",
          permission: "view_visits",
          order: 3,
        },
        {
          code: "visit_forms",
          title: "Visit Forms",
          url: "/visit-forms",
          icon: "FileText",
          permission: "view_visits",
          order: 4,
        },
        {
          code: "reports",
          title: "Reports",
          url: "/reports",
          icon: "BarChart3",
          permission: "generate_reports",
          order: 5,
        },
        { code: "homes_map", title: "Homes Map", url: "/homes-map", icon: "Map", order: 6 },
        { code: "homes_list", title: "Homes List", url: "/homes-list", icon: "List", order: 7 },
      ],
    },
    {
      title: "Administration",
      items: [
        // NOTE: User admin and system admin items removed - centralized in service-domain-admin microservice
        // Only microservice-specific admin items should remain here
        {
          code: "diagnostics",
          title: "Diagnostics",
          url: "/diagnostics",
          icon: "Database",
          permission: "view_diagnostics",
          order: 1,
        },
        {
          code: "feature_development",
          title: "Feature Development",
          url: "/admin/feature-development",
          icon: "Plus",
          permission: "system_config",
          order: 2,
        },
      ],
    },
  ],
}

/**
 * @shared-core
 * This function should be moved to packages/shared-core/lib/microservice-config.ts
 * Gets the microservice code using tiered detection strategy:
 * 1. Environment variable (explicit override - highest priority)
 * 2. Branch name detection (for Vercel preview deployments)
 * 3. Fall back to config (default)
 */
export function getMicroserviceCode(): string {
  // Tier 1: Environment variable (explicit override - highest priority)
  // This is set in Vercel project settings and takes precedence
  if (process.env.MICROSERVICE_CODE) {
    return process.env.MICROSERVICE_CODE
  }

  // Tier 2: Branch name detection (for Vercel preview deployments)
  // Vercel automatically sets VERCEL_BRANCH environment variable
  if (process.env.VERCEL_BRANCH) {
    const branch = process.env.VERCEL_BRANCH.toLowerCase()
    
    // Match branch names to microservice codes
    // Pattern: branch names containing microservice identifier
    if (branch.includes('visits') || branch.includes('home-visit')) {
      return 'home-visits'
    }
    if (branch.includes('case-management') || branch.includes('case-management')) {
      return 'case-management'
    }
    if (branch.includes('service-domain-admin') || branch.includes('global-admin') || branch.includes('domain-admin')) {
      return 'service-domain-admin'
    }
    if (branch.includes('admin') && !branch.includes('case-management') && !branch.includes('service-domain')) {
      return 'admin'
    }
    if (branch.includes('training')) {
      return 'training'
    }
    if (branch.includes('placements')) {
      return 'placements'
    }
    if (branch.includes('service-plan') || branch.includes('service-plans')) {
      return 'service-plans'
    }
    if (branch.includes('myhouse')) {
      return 'myhouse-portal'
    }
    // Add more microservice branch patterns as needed
  }

  // Tier 3: Fall back to config (default for local dev or when no detection works)
  return MICROSERVICE_CONFIG.code
}

// Helper functions
export function isInternalUser(email: string): boolean {
  return email.endsWith(`@${MICROSERVICE_CONFIG.organizationDomain}`)
}

/**
 * Get the deployment environment (test or production)
 * Uses VERCEL_ENV or domain/branch detection
 * @returns 'test' | 'production'
 */
export function getDeploymentEnvironment(): 'test' | 'production' {
  // Tier 1: Explicit environment variable (highest priority)
  if (process.env.DEPLOYMENT_ENVIRONMENT) {
    const env = process.env.DEPLOYMENT_ENVIRONMENT.toLowerCase()
    if (env === 'test' || env === 'production') {
      return env as 'test' | 'production'
    }
  }

  // Tier 2: Vercel environment detection
  // VERCEL_ENV can be: "production", "preview", or "development"
  if (process.env.VERCEL_ENV) {
    if (process.env.VERCEL_ENV === 'production') {
      return 'production'
    }
    // Preview and development are considered "test"
    if (process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development') {
      return 'test'
    }
  }

  // Tier 3: Branch name detection (for preview/test branches)
  if (process.env.VERCEL_BRANCH) {
    const branch = process.env.VERCEL_BRANCH.toLowerCase()
    // Test branches typically have "test" in the name
    if (branch.includes('test') || branch.includes('preview') || branch.includes('staging')) {
      return 'test'
    }
    // Production branches
    if (branch.includes('main') || branch.includes('master') || branch.includes('production')) {
      return 'production'
    }
  }

  // Tier 4: Domain detection (if available in request context)
  // This would need to be passed from the request, so we'll default to production for safety
  // In API routes, you can check request.headers.get('host')

  // Default: production (safer default)
  return 'production'
}

/**
 * Get the full deployment URL for the current environment
 * This is critical for distributed service domain model where URLs need to be
 * environment-aware (admin.test.refugehouse.app vs admin.refugehouse.app)
 * 
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (explicit override - highest priority)
 * 2. VERCEL_URL (automatically set by Vercel)
 * 3. Request origin header (from incoming request)
 * 4. Request host header (from incoming request)
 * 5. Environment-based fallback (test vs production)
 * 
 * @param request Optional NextRequest to extract origin/host from
 * @returns Full URL with protocol (e.g., https://admin.test.refugehouse.app)
 */
export function getDeploymentUrl(request?: { headers: { get: (name: string) => string | null } }): string {
  // Tier 1: Explicit environment variable (highest priority)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    let url = process.env.NEXT_PUBLIC_APP_URL.trim()
    // Ensure protocol is included
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }
    return url
  }

  // Tier 2: Vercel URL (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Tier 3: Request origin header (if available)
  if (request) {
    const origin = request.headers.get('origin')
    if (origin) {
      return origin
    }

    // Tier 4: Request host header (if available)
    const host = request.headers.get('host')
    if (host) {
      // Determine protocol based on host
      const protocol = host.includes('vercel.app') || host.includes('refugehouse.app') ? 'https' : 'http'
      return `${protocol}://${host}`
    }
  }

  // Tier 5: Environment-based fallback
  const environment = getDeploymentEnvironment()
  const microserviceCode = getMicroserviceCode()

  // Map microservice codes to domain patterns
  const domainMap: Record<string, { test: string; production: string }> = {
    'home-visits': {
      test: 'visit.test.refugehouse.app',
      production: 'visit.refugehouse.app',
    },
    'service-domain-admin': {
      test: 'admin.test.refugehouse.app',
      production: 'admin.refugehouse.app',
    },
    'case-management': {
      test: 'case-management.test.refugehouse.app',
      production: 'case-management.refugehouse.app',
    },
    'myhouse-portal': {
      test: 'myhouse.staging.refugehouse.app',
      production: 'myhouse.refugehouse.app',
    },
    // Add more microservices as needed
  }

  const domain = domainMap[microserviceCode]?.[environment] || 
                 (environment === 'test' ? `${microserviceCode}.test.refugehouse.app` : `${microserviceCode}.refugehouse.app`)

  return `https://${domain}`
}

export function getRoleDisplayName(roleCode: string): string {
  const roleMap: Record<string, string> = {
    [MICROSERVICE_CONFIG.roles.MANAGER]: "Visit Manager",
    [MICROSERVICE_CONFIG.roles.COORDINATOR]: "Visit Coordinator",
    [MICROSERVICE_CONFIG.roles.WORKER]: "Visit Worker",
    [MICROSERVICE_CONFIG.roles.VIEWER]: "Visit Viewer",
  }
  return roleMap[roleCode] || roleCode
}

export function getPermissionDisplayName(permissionCode: string): string {
  const permissionMap: Record<string, string> = {
    [MICROSERVICE_CONFIG.permissions.VIEW_VISITS]: "View Visits",
    [MICROSERVICE_CONFIG.permissions.CREATE_VISITS]: "Create Visits",
    [MICROSERVICE_CONFIG.permissions.EDIT_VISITS]: "Edit Visits",
    [MICROSERVICE_CONFIG.permissions.DELETE_VISITS]: "Delete Visits",
    [MICROSERVICE_CONFIG.permissions.GENERATE_REPORTS]: "Generate Reports",
    [MICROSERVICE_CONFIG.permissions.VIEW_DIAGNOSTICS]: "View Diagnostics",
    [MICROSERVICE_CONFIG.permissions.USER_MANAGEMENT]: "User Management",
    [MICROSERVICE_CONFIG.permissions.SYSTEM_CONFIG]: "System Configuration",
  }
  return permissionMap[permissionCode] || permissionCode
}

// ============================================================================
// MyHouse Portal Microservice Configuration
// ============================================================================
export const MYHOUSE_PORTAL_CONFIG: MicroserviceConfig = {
  code: "myhouse-portal",
  name: "MyHouse Portal",
  description: "Foster parent information sharing and communication portal",
  url: "/dashboard",
  organizationDomain: "refugehouse.org",
  
  // Define microservice-specific roles
  roles: {
    FOSTER_PARENT: "foster_parent",
    VIEWER: "viewer",
  },
  
  // Define microservice-specific permissions
  permissions: {
    VIEW_DASHBOARD: "view_dashboard",
    VIEW_DOCUMENTS: "view_documents",
    SEND_MESSAGES: "send_messages",
  },
  
  // Default navigation structure (used as fallback when database is unavailable)
  defaultNavigation: [
    {
      title: "Main",
      items: [
        { code: "dashboard", title: "Dashboard", url: "/dashboard", icon: "Home", order: 1 },
      ],
    },
  ],
}

// Template example for new microservices:
/*
export const MICROSERVICE_CONFIG: MicroserviceConfig = {
  code: "case-management", // CHANGE: Unique identifier
  name: "Case Management System", // CHANGE: Display name
  description: "Child welfare case management and tracking", // CHANGE: Description
  url: "/case-management", // CHANGE: Base URL path
  organizationDomain: "refugehouse.org", // KEEP: Organization domain
  
  // CHANGE: Define your roles
  roles: {
    MANAGER: "case_manager",
    WORKER: "case_worker", 
    VIEWER: "case_viewer",
  },
  
  // CHANGE: Define your permissions
  permissions: {
    VIEW_CASES: "view_cases",
    CREATE_CASES: "create_cases",
    EDIT_CASES: "edit_cases",
    CLOSE_CASES: "close_cases",
  },
  
  // CHANGE: Define your navigation
  defaultNavigation: [
    {
      title: "Case Management",
      items: [
        { code: "dashboard", title: "Dashboard", url: "/dashboard", icon: "Home", order: 1 },
        { code: "active_cases", title: "Active Cases", url: "/cases/active", icon: "FileText", permission: "view_cases", order: 2 },
        // Keep these for connection validation:
        { code: "homes_map", title: "Homes Map", url: "/homes-map", icon: "Map", order: 8 },
        { code: "homes_list", title: "Homes List", url: "/homes-list", icon: "List", order: 9 },
      ],
    },
    // NOTE: User admin and system admin items removed - centralized in service-domain-admin microservice
    // Only microservice-specific admin items should remain here
    {
      title: "Administration",
      items: [
        { code: "diagnostics", title: "Diagnostics", url: "/diagnostics", icon: "Database", permission: "view_diagnostics", order: 1 },
      ],
    },
  ],
}
*/
