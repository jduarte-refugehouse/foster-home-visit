# Guide: Creating a New Microservice Domain

This guide walks you through creating a new microservice domain in the Refuge House multi-microservice platform.

## Overview

The platform uses a **monorepo structure** with:
- **Shared Core** (`packages/shared-core/`): All reusable foundational code
- **Service-Specific Code**: Routes, components, and business logic in `app/`
- **Environment-Based Configuration**: Each microservice is configured via environment variables

## Prerequisites

- Existing microservice infrastructure is set up
- Database tables are configured (`microservice_apps`, `navigation_items`, `permissions`, etc.)
- Clerk authentication is configured
- Vercel deployment is set up

## Step 1: Database Setup

### 1.1 Register the Microservice

Add a new record to the `microservice_apps` table:

```sql
INSERT INTO microservice_apps (
    id,
    app_code,
    app_name,
    description,
    is_active,
    created_at
)
VALUES (
    NEWID(),
    'service-plan',  -- Unique code (lowercase, hyphenated)
    'Service Plans',  -- Display name
    'Service planning and management microservice',
    1,
    GETDATE()
)
```

### 1.2 Create Navigation Items

Add navigation items for your microservice:

```sql
-- Get the microservice ID
DECLARE @microserviceId UNIQUEIDENTIFIER = (
    SELECT id FROM microservice_apps WHERE app_code = 'service-plan'
)

-- Add navigation items
INSERT INTO navigation_items (
    id,
    microservice_id,
    code,
    title,
    url,
    icon,
    category,
    order_index,
    permission_required,
    is_active,
    created_at
)
VALUES
    (NEWID(), @microserviceId, 'dashboard', 'Dashboard', '/dashboard', 'LayoutDashboard', 'Main', 1, NULL, 1, GETDATE()),
    (NEWID(), @microserviceId, 'plans', 'Service Plans', '/plans', 'FileText', 'Main', 2, NULL, 1, GETDATE()),
    (NEWID(), @microserviceId, 'admin', 'Administration', '/admin', 'Settings', 'Admin', 1, 'admin', 1, GETDATE())
```

### 1.3 Create Permissions (if needed)

```sql
-- Get the microservice ID
DECLARE @microserviceId UNIQUEIDENTIFIER = (
    SELECT id FROM microservice_apps WHERE app_code = 'service-plan'
)

-- Add permissions
INSERT INTO permissions (
    id,
    microservice_id,
    permission_code,
    permission_name,
    description,
    is_active,
    created_at
)
VALUES
    (NEWID(), @microserviceId, 'plan.create', 'Create Service Plans', 'Allows creating new service plans', 1, GETDATE()),
    (NEWID(), @microserviceId, 'plan.edit', 'Edit Service Plans', 'Allows editing existing service plans', 1, GETDATE()),
    (NEWID(), @microserviceId, 'plan.view', 'View Service Plans', 'Allows viewing service plans', 1, GETDATE())
```

## Step 2: Vercel Configuration

### 2.1 Create New Vercel Project

1. Go to Vercel Dashboard
2. Create a new project from the same GitHub repository
3. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (root of monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.2 Set Environment Variables

In Vercel project settings, add these environment variables:

```bash
# Microservice Configuration
MICROSERVICE_CODE=service-plan

# Database (shared across all microservices)
DATABASE_SERVER=your-server.database.windows.net
DATABASE_NAME=RadiusBifrost
DATABASE_USER=your-user
DATABASE_PASSWORD=your-password

# Clerk Authentication (shared)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Other shared services
GOOGLE_MAPS_API_KEY=...
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
# ... etc
```

### 2.3 Configure Domain

1. In Vercel project settings → Domains
2. Add custom domain: `serviceplan.refugehouse.app`
3. Configure DNS records as instructed by Vercel

## Step 3: Code Structure

### 3.1 Microservice-Specific Routes

Create routes in `app/(protected)/` for your microservice:

```
app/
  (protected)/
    dashboard/
      page.tsx          # Main dashboard
    plans/
      page.tsx          # List of service plans
      [id]/
        page.tsx        # Individual plan view
    admin/
      page.tsx          # Admin panel
```

### 3.2 Using Shared-Core

All foundational utilities are available via `@refugehouse/shared-core/*`:

```typescript
// Database
import { query, getConnection } from '@refugehouse/shared-core/db'

// Authentication
import { getAuth, getCurrentUser } from '@refugehouse/shared-core/auth'

// Permissions
import { checkPermission, checkRole } from '@refugehouse/shared-core/permissions'
import { usePermissions } from '@refugehouse/shared-core/hooks/use-permissions'

// Communication
import { sendSMS } from '@refugehouse/shared-core/sms'
import { sendEmail } from '@refugehouse/shared-core/email'

// Utilities
import { cn } from '@refugehouse/shared-core/utils'
import { captureLocation } from '@refugehouse/shared-core/geolocation'
import { calculateDrivingDistance } from '@refugehouse/shared-core/route-calculator'

// UI Components
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Card } from '@refugehouse/shared-core/components/ui/card'
```

### 3.3 Access Control

Use the `AccessGuard` component to protect routes:

```typescript
import { AccessGuard } from '@refugehouse/shared-core/components/access-guard'

export default function DashboardPage() {
  return (
    <AccessGuard>
      <div>Protected content here</div>
    </AccessGuard>
  )
}
```

### 3.4 Permission Checks

In API routes:

```typescript
import { checkPermission } from '@refugehouse/shared-core/permissions'
import { getAuth } from '@refugehouse/shared-core/auth'

export async function POST(request: NextRequest) {
  const { userId } = await getAuth(request)
  
  // Check permission
  const hasPermission = await checkPermission(userId, 'plan.create')
  if (!hasPermission) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // ... your logic
}
```

In React components:

```typescript
import { usePermissions } from '@refugehouse/shared-core/hooks/use-permissions'

export function PlanList() {
  const { hasPermission } = usePermissions()
  
  return (
    <div>
      {hasPermission('plan.create') && (
        <Button>Create New Plan</Button>
      )}
    </div>
  )
}
```

## Step 4: Microservice Configuration

### 4.1 Update `lib/microservice-config.ts`

Add your microservice to the configuration (for local development):

```typescript
export const MICROSERVICE_CONFIGS: Record<string, MicroserviceConfig> = {
  'home-visits': {
    code: 'home-visits',
    name: 'Home Visits',
    description: 'Foster home visit management',
    // ... navigation, etc.
  },
  'service-plan': {
    code: 'service-plan',
    name: 'Service Plans',
    description: 'Service planning and management',
    defaultNavigation: [
      {
        title: 'Main',
        items: [
          { code: 'dashboard', title: 'Dashboard', url: '/dashboard', icon: 'LayoutDashboard', order: 1 },
          { code: 'plans', title: 'Service Plans', url: '/plans', icon: 'FileText', order: 2 },
        ],
      },
    ],
  },
}
```

**Note:** In production, `MICROSERVICE_CODE` environment variable takes precedence.

## Step 5: Testing

### 5.1 Local Development

1. Set environment variable:
   ```bash
   export MICROSERVICE_CODE=service-plan
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Access at `http://localhost:3000`

### 5.2 Production Testing

1. Deploy to Vercel
2. Access via `https://serviceplan.refugehouse.app`
3. Test authentication and permissions
4. Verify navigation loads correctly

## Step 6: User Access Management

### 6.1 Grant Access to Users

Users with `@refugehouse.org` emails automatically have platform access but need microservice-specific permissions.

Grant permissions via database:

```sql
-- Get user and microservice IDs
DECLARE @userId UNIQUEIDENTIFIER = (SELECT id FROM app_users WHERE email = 'user@refugehouse.org')
DECLARE @microserviceId UNIQUEIDENTIFIER = (SELECT id FROM microservice_apps WHERE app_code = 'service-plan')
DECLARE @permissionId UNIQUEIDENTIFIER = (SELECT id FROM permissions WHERE permission_code = 'plan.view' AND microservice_id = @microserviceId)

-- Grant permission
INSERT INTO user_permissions (id, user_id, permission_id, is_active, created_at)
VALUES (NEWID(), @userId, @permissionId, 1, GETDATE())
```

### 6.2 Access Request Flow

Users without access will see an "Access Denied" page with a "Request Access" button. This sends a notification to system administrators.

## Best Practices

### 1. Use Shared-Core for All Reusable Code

- ✅ Database operations → `@refugehouse/shared-core/db`
- ✅ Authentication → `@refugehouse/shared-core/auth`
- ✅ Permissions → `@refugehouse/shared-core/permissions`
- ✅ Communication → `@refugehouse/shared-core/sms`, `@refugehouse/shared-core/email`
- ✅ UI Components → `@refugehouse/shared-core/components/ui/*`

### 2. Keep Microservice-Specific Code Separate

- Business logic specific to your microservice stays in `app/`
- Don't add microservice-specific code to `packages/shared-core/`
- Use environment variables for configuration differences

### 3. Follow Permission Patterns

- Always check permissions in API routes
- Use `AccessGuard` for page-level protection
- Use `usePermissions` hook for component-level checks

### 4. Database Considerations

- All microservices share the same database (`RadiusBifrost`)
- Use `microservice_id` to filter data when needed
- Follow existing table patterns for consistency

### 5. Navigation Management

- Navigation items are stored in the database
- Use the Navigation API (`/api/navigation`) to load menu items
- Navigation is automatically filtered by user permissions

## Troubleshooting

### Issue: "Access Denied" page shows for all users

**Solution:** 
1. Check that the microservice is registered in `microservice_apps` table
2. Verify `MICROSERVICE_CODE` environment variable is set correctly
3. Check that navigation items exist in `navigation_items` table

### Issue: Navigation doesn't load

**Solution:**
1. Check database connection
2. Verify `MICROSERVICE_CODE` matches `app_code` in database
3. Check browser console for API errors
4. Verify user has at least one permission or role for the microservice

### Issue: Permissions not working

**Solution:**
1. Verify user has permissions in `user_permissions` table
2. Check that permissions are linked to the correct `microservice_id`
3. Verify `permission_code` matches what you're checking in code
4. Check that `is_active = 1` for both permission and user_permission records

## Next Steps

After creating your microservice:

1. **Documentation**: Document your microservice-specific features
2. **Testing**: Set up comprehensive tests
3. **Monitoring**: Configure error tracking and monitoring
4. **User Training**: Create user guides for your microservice
5. **Iteration**: Gather feedback and iterate on features

## Reference

- **Shared-Core Package**: `packages/shared-core/`
- **Microservice Config**: `lib/microservice-config.ts`
- **Database Schema**: `docs/bifrost-schema.sql`
- **Architecture Plan**: `docs/multi-microservice-architecture-plan.md`

