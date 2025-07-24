# Refuge House Microservice Template - Development Instructions

This is a **Refuge House-specific** microservice template designed for internal foster care operations. It comes pre-loaded with working foster home data, mapping capabilities, and admin infrastructure.

## 🏠 Template Philosophy

This template is **NOT** a generic framework. It's specifically designed for Refuge House operations and includes:

- **Pre-loaded Foster Home Data**: Working homes list and interactive map
- **Refuge House Branding**: All @refugehouse.org domain logic and branding
- **Standard Admin Kit**: User management, permissions, diagnostics
- **Foster Care Context**: Terminology and workflows specific to foster care operations

## 🚀 Creating a New Microservice

### Step 1: Configure Your Microservice Identity

Edit `lib/microservice-config.ts`:

\`\`\`typescript
export const MICROSERVICE_CONFIG = {
  code: "your-microservice-code",        // MUST match database app_code
  name: "Your Microservice Name",        // Display name in UI
  description: "Brief description",      // Shown on dashboard
  version: "1.0.0",
  
  // Define your business-specific roles
  roles: {
    MANAGER: "manager",
    COORDINATOR: "coordinator", 
    VIEWER: "viewer",
    // Add your roles here
  },
  
  // Define your business-specific permissions
  permissions: {
    VIEW_DATA: "view_data",
    MANAGE_CASES: "manage_cases",
    // Add your permissions here
  },
}
\`\`\`

### Step 2: Database Setup

1. Add your microservice to the database:
\`\`\`sql
INSERT INTO microservice_apps (app_code, app_name, app_url, description, is_active)
VALUES ('your-microservice-code', 'Your Microservice Name', '/your-url', 'Description', 1)
\`\`\`

2. Run the setup scripts:
- `scripts/create-navigation-table.sql`
- `scripts/setup-user-permissions.sql`

### Step 3: What You Get Out of the Box

✅ **Working Foster Home Data**: Immediate access to homes list and map
✅ **Admin Interface**: User management, roles, permissions
✅ **Authentication**: Clerk integration with @refugehouse.org logic
✅ **Diagnostics**: Database connection testing and system status
✅ **Responsive UI**: shadcn/ui components with Refuge House styling

### Step 4: Build Your Business Logic

Focus on your specific business requirements. The foundation is already solid:

- Add your pages to `app/(protected)/your-feature/`
- Create your API routes in `app/api/your-endpoints/`
- Extend the navigation in `components/app-sidebar.tsx`
- Add your database queries to `lib/db-extensions.ts`

## 🔒 What NOT to Change

**Keep These As-Is:**
- All Refuge House references and branding
- @refugehouse.org domain logic
- jduarte@refugehouse.org admin assignments
- Foster care terminology (homes, case managers, etc.)
- Core admin and diagnostic infrastructure
- Database connection patterns

**Customize These:**
- Microservice name and description
- Business-specific roles and permissions
- Your feature pages and API endpoints
- Navigation items (while keeping homes/map/admin)

## 🛠️ Development Workflow

1. **Clone this template**
2. **Update microservice config** (Step 1 above)
3. **Set up database entry** (Step 2 above)
4. **Build your features** using the standard kit
5. **Deploy** - everything works together

## 📋 Standard Kit Components

Every microservice includes:

- **Homes List & Map**: `/homes-list` and `/homes-map`
- **Dashboard**: Configurable overview page
- **Admin Panel**: `/admin` with user management
- **Diagnostics**: `/diagnostics` for system health
- **Reports**: `/reports` framework ready to extend

## 🎯 Best Practices

- Use the permission system for access control
- Extend `lib/db-extensions.ts` for data queries
- Follow the established API patterns
- Keep Refuge House context and terminology
- Build on the existing admin infrastructure

This template gives you a production-ready foundation with working foster care data from day one. Focus on your business logic, not infrastructure.
