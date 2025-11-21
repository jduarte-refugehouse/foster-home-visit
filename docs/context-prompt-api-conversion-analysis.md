# Context Prompt: API Conversion Analysis for Visit Microservice

## Project Overview
You are working on a **multi-microservice platform** for Refuge House, built with Next.js, TypeScript, React, and SQL Server. The platform uses a centralized **Radius API Hub** (`admin.refugehouse.app`) to provide access to RadiusBifrost database data for all microservices, eliminating the need for each microservice to have its own static IP addresses.

## Current State

### Radius API Hub Status
- ✅ **Fully Implemented**: Centralized API hub at `admin.refugehouse.app`
- ✅ **API Key Authentication**: Database-driven API key system with usage tracking
- ✅ **Available Endpoints**: Homes, Appointments, Visit Forms, Users
- ✅ **Type-Safe Client**: `@refugehouse/radius-api-client` package available
- ✅ **Enhanced Catalog**: Comprehensive API catalog with explainer sections at `/admin/apis`
- ✅ **Documentation**: Complete guides and templates for adding endpoints

### Current Architecture
- **Admin Microservice** (`admin.refugehouse.app`): Has static IPs, direct database access, provides API Hub
- **Visit Microservice** (`visit.refugehouse.app`): Currently uses direct database connections (needs conversion)
- **Other Microservices**: Will be created in the future, will use API Hub

## Objective

**DO NOT BEGIN THE WORK** - This is an analysis and strategy session only.

Review the complete visit microservice functionality to identify **all database operations** that need to be converted to use the new Radius API Hub. Focus particularly on **authentication initialization** since this is something every single microservice will need in order to function.

## Task: List All Database Operations for API Conversion

### Primary Focus: Authentication Initialization

Authentication initialization is critical because:
1. Every microservice needs it to function
2. It's called on every page load
3. It's the foundation for all other operations
4. It's used by multiple components (sidebar, dashboard, permissions, navigation)

### What to Identify

For each database operation found, document:

1. **Function/API Route Name**: The exact function or route that performs the operation
2. **Purpose**: What the operation does (e.g., "Fetches user profile with roles and permissions")
3. **Database Tables Queried**: Which tables are accessed (e.g., `app_users`, `user_roles`, `permissions`)
4. **Query Type**: SELECT, INSERT, UPDATE, DELETE
5. **Parameters**: What parameters are passed (e.g., `clerkUserId`, `microserviceCode`)
6. **Return Data**: What data is returned (e.g., user object, roles array, permissions array)
7. **Used By**: Which components/pages use this operation
8. **Frequency**: How often it's called (e.g., "on every page load", "on user login", "on demand")
9. **Priority**: High/Medium/Low for conversion (authentication = HIGH)

### Key Areas to Review

#### 1. Authentication & User Management
- User profile fetching (`getUserProfile`)
- User lookup by Clerk ID (`getUserByClerkId`, `getCurrentAppUser`)
- User creation/update (`createOrUpdateUser`)
- Role assignment (`assignUserRolesAndPermissions`)
- Permission checking (`checkPermission`, `canUserPerformAction`)
- User roles fetching (`getUserRoles`)
- User permissions fetching (`getUserPermissions`)

**Files to Review:**
- `packages/shared-core/lib/user-management.ts`
- `app/api/auth/check-access/route.ts`
- `app/api/auth-test/user-info/route.ts`
- `app/api/permissions/route.ts`
- `packages/shared-core/hooks/use-permissions.ts`

#### 2. Navigation & Menu System
- Navigation items fetching (database-driven navigation)
- Menu item permissions checking
- Microservice detection

**Files to Review:**
- `app/api/navigation/route.ts`
- `components/app-sidebar.tsx`
- `app/(protected)/dashboard/page.tsx`

#### 3. Appointments
- Appointment fetching
- Appointment creation/updates
- Appointment filtering/searching

**Files to Review:**
- `app/api/appointments/route.ts`
- `app/api/appointments/[appointmentId]/route.ts`
- Any appointment-related queries

#### 4. Visit Forms
- Visit form fetching
- Visit form creation/updates
- Visit form templates

**Files to Review:**
- `app/api/visit-forms/route.ts`
- `app/api/visit-forms/[id]/route.ts`
- `app/api/visit-forms/templates/route.ts`

#### 5. Homes
- Home data fetching
- Home filtering/searching

**Files to Review:**
- Any home-related API routes
- Components that fetch home data

#### 6. Users (Staff/Team)
- User list fetching
- User filtering by microservice
- User role/permission management

**Files to Review:**
- `app/api/admin/users/route.ts`
- `app/api/admin/users/[userId]/roles/route.ts`

#### 7. Other Database Operations
- Any other direct database queries
- Any `query()` calls from `@refugehouse/shared-core/db`
- Any SQL operations in API routes

## Expected Output Format

Create a comprehensive list organized by category:

### Category: Authentication Initialization (HIGH PRIORITY)

#### Operation 1: getUserProfile
- **Location**: `packages/shared-core/lib/user-management.ts:394`
- **Purpose**: Fetches complete user profile including roles and permissions
- **Database Tables**: `app_users`, `user_roles`, `permissions`, `user_permissions`, `microservice_apps`
- **Query Type**: SELECT (multiple queries)
- **Parameters**: `userId` (string)
- **Return Data**: `{ user: AppUser, roles: UserRole[], permissions: Permission[], microservices: string[] }`
- **Used By**: 
  - `app/api/permissions/route.ts`
  - `app/api/navigation/route.ts`
  - `packages/shared-core/hooks/use-permissions.ts`
- **Frequency**: On every page load, on user login
- **Priority**: HIGH
- **API Hub Endpoint Needed**: `/api/radius/users/profile?userId={userId}` or similar
- **Notes**: This is the most critical operation - every microservice needs this

#### Operation 2: [Continue listing...]

### Category: Navigation (HIGH PRIORITY)

#### Operation 1: [Navigation operations...]

### Category: Appointments (MEDIUM PRIORITY)

#### Operation 1: [Appointment operations...]

[Continue for all categories...]

## Important Notes

1. **DO NOT START CONVERSION**: This is analysis only. List the functions, don't modify them.

2. **Focus on Authentication First**: Authentication initialization is the highest priority because:
   - It's required for every microservice
   - It's called frequently
   - It's foundational for all other operations
   - It's used by multiple components

3. **Look for Direct Database Calls**: Search for:
   - `query()` calls from `@refugehouse/shared-core/db`
   - Direct SQL queries in API routes
   - Database operations in shared-core utilities
   - Any `getConnection()` or direct database access

4. **Consider Dependencies**: When listing operations, note:
   - Which operations depend on others
   - Which operations are called together
   - Which operations could be batched into a single API call

5. **Identify Patterns**: Look for:
   - Repeated query patterns
   - Similar operations that could share an API endpoint
   - Operations that could be optimized when converted

6. **Document Current Usage**: For each operation, document:
   - Where it's called from (components, pages, API routes)
   - How often it's called
   - What data it needs
   - What data it returns

## Files to Search

Use these patterns to find database operations:

```bash
# Find all query() calls
grep -r "query(" app/ packages/shared-core/

# Find all SQL queries
grep -r "SELECT\|INSERT\|UPDATE\|DELETE" app/ packages/shared-core/

# Find all database connection usage
grep -r "getConnection\|getDbConnection" app/ packages/shared-core/

# Find all user management functions
grep -r "getUser\|checkPermission\|getRole" app/ packages/shared-core/
```

## Related Documentation

- `docs/radius-api-hub.md` - Main API Hub documentation
- `docs/radius-api-hub-adding-endpoints.md` - Guide for adding new endpoints
- `docs/daily-summaries/daily-activity-summary-2025-11-20.md` - Recent API catalog enhancements
- `packages/radius-api-client/` - Type-safe API client package
- `packages/api-config/` - API endpoint configuration

## Current API Hub Endpoints

Available endpoints (for reference):
- `GET /api/radius/homes` - Home data
- `GET /api/radius/appointments` - Appointment data
- `GET /api/radius/visit-forms` - Visit form data
- `GET /api/radius/users` - User data

**Note**: Authentication/profile endpoints may need to be added to the API Hub.

## Expected Deliverable

A comprehensive markdown document listing:
1. All database operations organized by category
2. Detailed information for each operation (as specified above)
3. Priority ranking (HIGH/MEDIUM/LOW)
4. Dependencies between operations
5. Recommendations for API endpoint design
6. Strategy for conversion (which operations to convert first, which can be batched, etc.)

**Focus especially on authentication initialization operations** - these are the most critical and should be converted first.

---

**Last Updated**: November 20, 2025  
**Status**: Analysis Request - DO NOT BEGIN WORK

