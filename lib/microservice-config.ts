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
        { code: "guide", title: "Home Visit Guide", url: "/guide", icon: "BookOpen", order: 2 },
        {
          code: "visits_calendar",
          title: "Visits Calendar",
          url: "/visits-calendar",
          icon: "Calendar",
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
        {
          code: "user_invitations",
          title: "User Invitations",
          url: "/admin/invitations",
          icon: "Users",
          permission: "user_management",
          order: 1,
        },
        {
          code: "user_management",
          title: "User Management",
          url: "/admin/users",
          icon: "UserCog",
          permission: "user_management",
          order: 2,
        },
        {
          code: "system_admin",
          title: "System Admin",
          url: "/system-admin",
          icon: "Settings",
          permission: "system_config",
          order: 3,
        },
        {
          code: "diagnostics",
          title: "Diagnostics",
          url: "/diagnostics",
          icon: "Database",
          permission: "view_diagnostics",
          order: 4,
        },
        {
          code: "feature_development",
          title: "Feature Development",
          url: "/admin/feature-development",
          icon: "Plus",
          permission: "system_config",
          order: 5,
        },
      ],
    },
  ],
}

// Helper functions
export function isInternalUser(email: string): boolean {
  return email.endsWith(`@${MICROSERVICE_CONFIG.organizationDomain}`)
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
    // KEEP: Administration section (consistent across microservices)
    {
      title: "Administration",
      items: [
        { code: "user_invitations", title: "User Invitations", url: "/admin/invitations", icon: "Users", permission: "user_management", order: 1 },
        { code: "user_management", title: "User Management", url: "/admin/users", icon: "UserCog", permission: "user_management", order: 2 },
        { code: "system_admin", title: "System Admin", url: "/system-admin", icon: "Settings", permission: "system_config", order: 3 },
        { code: "diagnostics", title: "Diagnostics", url: "/diagnostics", icon: "Database", permission: "view_diagnostics", order: 4 },
      ],
    },
  ],
}
*/
