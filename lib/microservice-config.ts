// MICROSERVICE CONFIGURATION
// This file defines the identity and configuration for this specific microservice
// within the Refuge House ecosystem.

// ⚠️ CRITICAL: The 'code' field MUST match the 'app_code' in the database table 'microservice_apps'
// This ensures proper database connectivity and user permissions mapping.
// Current database entry: app_code = 'home-visits'

export const MICROSERVICE_CONFIG = {
  // Database identifier - MUST match microservice_apps.app_code
  code: "home-visits",

  // Display name used throughout the application UI
  name: "Home Visits Application",

  // Brief description for dashboard and admin interfaces
  description: "Manage and track foster home visits and inspections",

  // Version for tracking deployments
  version: "1.0.0",

  // Microservice-specific roles (these get stored in user_roles table)
  roles: {
    QA_DIRECTOR: "qa_director",
    SCHEDULING_ADMIN: "scheduling_admin",
    HOME_VISIT_LIAISON: "home_visit_liaison",
    CASE_MANAGER: "case_manager",
    VIEWER: "viewer",
    FOSTER_PARENT: "foster_parent",
  },

  // Microservice-specific permissions (these get stored in permissions table)
  permissions: {
    VIEW_HOMES: "view_homes",
    MANAGE_VISITS: "manage_visits",
    VIEW_REPORTS: "view_reports",
    ADMIN_ACCESS: "admin_access",
    USER_MANAGE: "user_manage",
    SYSTEM_ADMIN: "system_admin",
  },
}

// Standard Refuge House domain for internal user identification
export const INTERNAL_DOMAIN = "refugehouse.org"

// Helper function to determine if user is internal Refuge House staff
export function isInternalUser(email: string): boolean {
  return email.toLowerCase().endsWith(`@${INTERNAL_DOMAIN}`)
}

// Template guidance for new microservices:
// 1. Update the 'code' field to match your database entry
// 2. Update 'name' and 'description' for your microservice
// 3. Define your business-specific roles and permissions
// 4. Keep INTERNAL_DOMAIN and isInternalUser as-is
// 5. All Refuge House branding and foster care context stays the same
