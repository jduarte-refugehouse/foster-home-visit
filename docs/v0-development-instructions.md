# Refuge House Microservice Template - Development Instructions

## Overview

This is the **Refuge House Microservice Template** - a standardized foundation for building internal applications at Refuge House. This template is specifically designed for Refuge House's foster care operations and comes pre-loaded with essential components.

## Template Philosophy

### What's Pre-Loaded (Standard Kit)
- **Foster Homes Data Integration** - Working homes list and interactive map
- **Refuge House Branding** - Logo, colors, and organizational identity
- **Admin Infrastructure** - User management, permissions, diagnostics
- **@refugehouse.org Domain Logic** - Automatic access for internal users
- **jduarte@refugehouse.org Admin** - Default system administrator

### What's Configurable
- **Microservice Identity** - Name, description, and business purpose
- **Business-Specific Roles** - Tailored to each application's workflow
- **Business-Specific Permissions** - Granular access control
- **Custom Navigation** - Application-specific menu items (homes/map/admin always included)

## Creating a New Microservice

### Step 1: Database Setup
1. Add your microservice to the `microservice_apps` table:
\`\`\`sql
INSERT INTO microservice_apps (app_code, app_name, app_url, description, is_active)
VALUES ('your-app-code', 'Your App Name', '/your-app', 'Your app description', 1)
\`\`\`

### Step 2: Configure Microservice Identity
Edit `lib/microservice-config.ts`:

\`\`\`typescript
export const MICROSERVICE_CONFIG: MicroserviceConfig = {
  code: "your-app-code", // MUST match database entry
  name: "Your Application Name",
  description: "Your application description",
  url: "/your-app",
  organizationDomain: "refugehouse.org", // Keep as-is
  
  // Define your business-specific roles
  roles: {
    MANAGER: "your_manager",
    WORKER: "your_worker", 
    VIEWER: "your_viewer",
  },
  
  // Define your business-specific permissions
  permissions: {
    VIEW_DATA: "view_your_data",
    CREATE_DATA: "create_your_data",
    EDIT_DATA: "edit_your_data",
    DELETE_DATA: "delete_your_data",
    // Keep these standard ones:
    GENERATE_REPORTS: "generate_reports",
    VIEW_DIAGNOSTICS: "view_diagnostics",
    USER_MANAGEMENT: "user_management",
    SYSTEM_CONFIG: "system_config",
  },
  
  // Define your navigation (homes/map/admin will be included automatically)
  defaultNavigation: [
    {
      title: "Navigation",
      items: [
        { code: "dashboard", title: "Dashboard", url: "/dashboard", icon: "Home", order: 1 },
        { code: "your_feature", title: "Your Feature", url: "/your-feature", icon: "FileText", permission: "view_your_data", order: 2 },
        // Standard items - keep these:
        { code: "homes_map", title: "Homes Map", url: "/homes-map", icon: "Map", order: 8 },
        { code: "homes_list", title: "Homes List", url: "/homes-list", icon: "List", order: 9 },
      ],
    },
    // Administration section - keep as-is
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
\`\`\`

### Step 3: Update User Role Assignments
Edit `lib/user-management.ts` in the `assignDefaultMicroserviceRoles` function to assign appropriate roles for your microservice.

### Step 4: Create Your Business Logic
- Add your application-specific pages in `app/(protected)/`
- Create your API routes in `app/api/`
- Build your components in `components/`

## What You Get Out of the Box

### Standard Components (Don't Modify)
- **Foster Homes List** (`/homes-list`) - Complete homes management interface
- **Interactive Map** (`/homes-map`) - Geographic visualization of homes
- **User Management** (`/admin/users`) - Role and permission management
- **System Diagnostics** (`/diagnostics`) - Database and system health
- **Authentication** - Clerk integration with Refuge House domain logic

### Template Infrastructure (Don't Modify)
- Database connection management with Azure Key Vault
- Permission middleware and role-based access control
- Sidebar navigation with automatic fallbacks
- Refuge House branding and styling
- Development vs production environment handling

## Environment Variables Required

\`\`\`env
# Database (Azure SQL)
DATABASE_SERVER=your-server.database.windows.net
DATABASE_NAME=your-database
DATABASE_USER=your-user
DATABASE_PORT=1433

# Azure Key Vault
AZURE_KEY_VAULT_NAME=your-keyvault
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
CLERK_SECRET_KEY=your-clerk-secret
CLERK_WEBHOOK_SECRET=your-webhook-secret

# Proxy (if needed)
FIXIE_SOCKS_HOST=your-proxy-host
\`\`\`

## Development Workflow

1. **Clone this template** for your new microservice
2. **Update microservice config** with your application details
3. **Create database entry** for your microservice
4. **Build your business logic** on top of the foundation
5. **Test with standard components** (homes, map, admin work automatically)
6. **Deploy** - all infrastructure is ready

## Key Principles

- **Refuge House Specific** - This is internal tooling, not generic software
- **Foster Care Context** - All applications support foster care operations
- **Pre-loaded Data** - New microservices get working homes data immediately
- **Consistent Admin** - jduarte@refugehouse.org is always system admin
- **Standard Navigation** - Homes and admin sections are consistent across apps

## Support

For questions about this template or creating new microservices, contact the development team or check the diagnostics page for system health information.
