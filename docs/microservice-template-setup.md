# Refuge House Microservice Template Setup Guide

This template provides a complete foundation for creating new Refuge House microservices with shared authentication, database connectivity, and user management.

## Quick Start

### 1. Clone and Configure

\`\`\`bash
# Clone this repository
git clone [your-repo-url] my-new-microservice
cd my-new-microservice

# Install dependencies
npm install
\`\`\`

### 2. Configure Your Microservice

Edit `lib/microservice-config.ts`:

\`\`\`typescript
export const MICROSERVICE_CONFIG: MicroserviceConfig = {
  code: "your-microservice-code", // CHANGE: Unique identifier
  name: "Your Microservice Name", // CHANGE: Display name
  description: "Your microservice description", // CHANGE: Description
  url: "/your-microservice", // CHANGE: Base URL path
  organizationDomain: "refugehouse.org", // KEEP: Organization domain
  
  // CHANGE: Define your roles
  roles: {
    MANAGER: "manager",
    WORKER: "worker", 
    VIEWER: "viewer",
  },
  
  // CHANGE: Define your permissions
  permissions: {
    CREATE_RECORDS: "create_records",
    EDIT_RECORDS: "edit_records",
    VIEW_RECORDS: "view_records",
    DASHBOARD_VIEW: "dashboard_view",
  },
  
  // CHANGE: Define your navigation
  defaultNavigation: [
    {
      title: "Your Domain",
      items: [
        { code: "dashboard", title: "Dashboard", url: "/dashboard", icon: "Home", order: 1 },
        { code: "your_feature", title: "Your Feature", url: "/your-feature", icon: "FileText", permission: "view_records", order: 2 },
        // Keep these for connection validation:
        { code: "homes_map", title: "Homes Map", url: "/homes-map", icon: "Map", order: 8 },
        { code: "homes_list", title: "Homes List", url: "/homes-list", icon: "List", order: 9 },
      ],
    },
    // KEEP: Administration section (consistent across microservices)
    {
      title: "Administration",
      items: [
        { code: "user_invitations", title: "User Invitations", url: "/admin/invitations", icon: "Users", permission: "user_manage", order: 1 },
        { code: "user_management", title: "User Management", url: "/admin/users", icon: "UserCog", permission: "user_manage", order: 2 },
        { code: "system_admin", title: "System Admin", url: "/system-admin", icon: "Settings", permission: "system_config", order: 3 },
        { code: "diagnostics", title: "Diagnostics", url: "/diagnostics", icon: "Database", permission: "system_config", order: 4 },
      ],
    },
  ],
}
\`\`\`

### 3. Environment Variables

Copy the environment variables from the original project. All Refuge House microservices use the same database connection:

\`\`\`bash
# Copy .env.local from the original home-visits project
# These stay the same across all microservices:
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_ID=...
AZURE_KEY_VAULT_NAME=...
PROXY_URL=...
FIXIE_SOCKS_HOST=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
\`\`\`

### 4. Database Registration

Register your new microservice in the shared database:

\`\`\`sql
-- Run this once to register your microservice
INSERT INTO microservice_apps (id, app_code, app_name, app_url, description, is_active)
VALUES (NEWID(), 'your-microservice-code', 'Your Microservice Name', '/your-microservice', 'Your microservice description', 1);
\`\`\`

### 5. Create Navigation Table

Run the navigation table creation script:

\`\`\`bash
# This creates the navigation_items table if it doesn't exist
# Run the SQL script in scripts/create-navigation-table.sql
\`\`\`

### 6. Test Connection

\`\`\`bash
npm run dev
\`\`\`

Visit these pages to verify everything works:
- `/diagnostics` - Database connection and system status
- `/homes-map` - Confirms database connectivity 
- `/homes-list` - Confirms API routes work
- `/dashboard` - Confirms authentication works

### 7. Customize Your Pages

Replace the domain-specific pages in `app/(protected)/`:

**Keep These (Consistent Across Microservices):**
- `dashboard/page.tsx` - Main dashboard
- `admin/*` - All admin pages
- `diagnostics/page.tsx` - System diagnostics
- `system-admin/page.tsx` - System administration
- `homes-list/page.tsx` - Connection validation
- `homes-map/page.tsx` - Connection validation

**Replace These (Domain-Specific):**
- `visits-calendar/page.tsx` → Your domain pages
- `reports/page.tsx` → Your domain pages

**Create New Pages:**
Add your microservice-specific pages in `app/(protected)/your-feature/`

## Key Features

### ✅ What's Already Working
- **Shared Authentication**: All Refuge House users (`@refugehouse.org`) can access
- **Database Connection**: Robust Azure SQL connectivity with proxy support
- **Permission System**: Database-driven, microservice-specific permissions
- **Navigation**: Configurable, database-driven with config fallbacks
- **Admin Functions**: User management, invitations, system admin
- **Connection Validation**: Homes map/list confirm database connectivity
- **Debug Tools**: Diagnostics, proxy testing, IP management

### ✅ What Stays Consistent (Don't Change)
- Database connection parameters and logic
- User authentication system (Clerk)
- Admin pages structure and functionality
- User management and permissions framework
- Homes map/list pages (for connection testing)
- Debug APIs and diagnostic tools

### ✅ What You Customize
- Microservice name, code, and description
- Domain-specific roles and permissions
- Navigation items and categories
- Business logic pages and components
- API routes for your domain

## Navigation System

### How It Works
1. **Database-First**: Navigation loads from `navigation_items` table
2. **Config Fallback**: If database is empty, uses `defaultNavigation` from config
3. **Permission-Filtered**: Only shows items user has permission to access
4. **Category-Grouped**: Items are grouped by category in the sidebar

### Adding Navigation Items

**Via Database** (Recommended for production):
\`\`\`sql
INSERT INTO navigation_items (microservice_id, code, title, url, icon, permission_required, category, order_index)
VALUES (@microservice_id, 'my_feature', 'My Feature', '/my-feature', 'FileText', 'view_records', 'Main', 1);
\`\`\`

**Via Config** (Good for development):
\`\`\`typescript
// In defaultNavigation array
{ code: "my_feature", title: "My Feature", url: "/my-feature", icon: "FileText", permission: "view_records", order: 1 }
\`\`\`

### Available Icons
Uses Lucide React icons. Common ones include:
- `Home`, `FileText`, `Users`, `Calendar`, `BarChart3`
- `Map`, `List`, `Settings`, `Database`, `UserCog`
- `Plus`, `Edit`, `Trash`, `Search`, `Filter`

## Permission System

### Role Assignment
Users automatically get roles based on their email address:

\`\`\`typescript
// In lib/user-management.ts - assignDefaultMicroserviceRoles()
if (email === "specific@refugehouse.org") {
  await assignUserToRole(userId, "manager", CURRENT_MICROSERVICE, "system")
} else if (coreRole === CORE_ROLES.STAFF) {
  await assignUserToRole(userId, "viewer", CURRENT_MICROSERVICE, "system")
}
\`\`\`

### Permission Checking

**In Components:**
\`\`\`typescript
import { usePermissions } from "@/hooks/use-permissions"

const { permissions } = usePermissions()
const canEdit = permissions.includes("edit_records")

if (canEdit) {
  // Show edit button
}
\`\`\`

**In API Routes:**
\`\`\`typescript
import { checkPermission } from "@/lib/permissions-middleware"

const authCheck = await checkPermission(request, "edit_records")
if (!authCheck.authorized) {
  return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
}
\`\`\`

## Debugging Tools

### Keep These APIs (Useful for All Microservices)
- `/api/diagnostics` - System health and connection status
- `/api/proxy-test` - Test proxy connectivity to external services
- `/api/add-current-ip` - Add Vercel IPs to Azure firewall
- `/api/test-db` - Test database connectivity
- `/api/connection-debug` - Debug connection issues

### Debug Pages
- `/diagnostics` - Visual system health dashboard
- `/system-admin` - Admin tools and system information

## Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy

### Post-Deployment Steps
1. Run database registration SQL
2. Run navigation table creation script
3. Test all functionality via `/diagnostics`
4. Add any Vercel IPs to Azure firewall if needed

## Common Issues & Solutions

### Connection Issues
1. **Check diagnostics**: Visit `/diagnostics` for system status
2. **IP whitelist**: Use `/api/add-current-ip` to add Vercel IPs
3. **Proxy test**: Use `/api/proxy-test` to verify proxy connectivity
4. **Environment vars**: Verify all Azure/Clerk variables are set

### Permission Issues
1. **Check user roles**: Visit `/admin/users` to see user assignments
2. **Verify microservice registration**: Check `microservice_apps` table
3. **Permission assignment**: Verify roles have correct permissions

### Navigation Issues
1. **Database fallback**: Navigation automatically falls back to config
2. **Check API**: Test `/api/navigation` endpoint directly
3. **Table exists**: Verify `navigation_items` table was created
4. **Permissions**: Ensure user has permissions for navigation items

## Template Maintenance

When updating this template:
1. **Preserve functionality**: Don't break existing working features
2. **Extend, don't replace**: Add new features alongside existing ones
3. **Update documentation**: Keep this guide current
4. **Test thoroughly**: Verify all microservices still work
5. **Backward compatibility**: Ensure existing deployments aren't affected

## Support

### For Connection Issues
- Check Azure Key Vault access
- Verify proxy configuration
- Test database connectivity
- Review firewall settings

### For Permission Issues  
- Verify user roles in database
- Check microservice registration
- Review permission assignments
- Test with different user accounts

### For Development Issues
- Check Next.js logs
- Verify Clerk configuration
- Test API endpoints individually
- Review environment variables

---

**This template is specifically designed for Refuge House microservices with shared database and federated user management. All microservices share the same users, database, and core functionality while allowing domain-specific customization.**
\`\`\`

Now let me remove the contact page that shouldn't be in the template:

\`\`\`typescriptreact file="app/contact/page.tsx" isDeleted="true"
...deleted...
