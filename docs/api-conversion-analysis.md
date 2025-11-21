# API Conversion Analysis: Visit Microservice Database Operations

**Date**: November 20, 2025  
**Status**: Analysis Complete - Ready for Review  
**Purpose**: Identify all database operations that need conversion to Radius API Hub

## Executive Summary

This document catalogs **all database operations** in the visit microservice (`visit.refugehouse.app`) that currently use direct database connections and need to be converted to use the centralized **Radius API Hub** at `admin.refugehouse.app`.

### Key Findings

- **Total Operations Identified**: 100+ database operations across 7 categories
- **High Priority Operations**: 15 operations (Authentication & Navigation)
- **Medium Priority Operations**: 45 operations (Appointments, Visit Forms, Homes)
- **Low Priority Operations**: 40+ operations (Admin, Travel, On-Call, Continuum, etc.)

### Critical Insight: Authentication Initialization

**Authentication initialization is the highest priority** because:
1. Every microservice requires it to function
2. Called on every page load
3. Foundation for all other operations
4. Used by multiple components (sidebar, dashboard, permissions, navigation)
5. Currently involves 8+ separate database queries that could be batched

### Current Architecture

- **Admin Microservice** (`admin.refugehouse.app`): Has static IPs, direct database access, provides API Hub
- **Visit Microservice** (`visit.refugehouse.app`): Currently uses direct database connections (needs conversion)
- **API Hub**: Fully implemented with API key authentication, available endpoints for Homes, Appointments, Visit Forms, Users

---

## Category 1: Authentication Initialization (HIGH PRIORITY)

**Priority**: HIGHEST  
**Impact**: Critical - Every microservice needs this  
**Frequency**: On every page load, on user login  
**Conversion Strategy**: Batch multiple queries into single `/api/radius/users/profile` endpoint

### Operation 1: getUserProfile

- **Location**: `packages/shared-core/lib/user-management.ts:394`
- **Purpose**: Fetches complete user profile including roles and permissions across all microservices
- **Database Tables**: 
  - `app_users` (SELECT)
  - `user_roles` (SELECT with JOIN to `microservice_apps`)
  - `user_permissions` (SELECT with JOIN to `permissions` and `microservice_apps`)
- **Query Type**: SELECT (3 separate queries)
- **Parameters**: `userId` (string)
- **Return Data**: 
  ```typescript
  {
    user: AppUser,
    roles: UserRole[],
    permissions: Permission[],
    microservices: string[]
  }
  ```
- **Used By**: 
  - `app/api/permissions/route.ts`
  - `packages/shared-core/hooks/use-permissions.ts` (via permissions API)
- **Frequency**: On every page load, on user login
- **Priority**: HIGH
- **API Hub Endpoint Needed**: `/api/radius/users/profile?userId={userId}`
- **Notes**: This is the most critical operation - combines user, roles, and permissions in one call

### Operation 2: getUserByClerkId

- **Location**: `packages/shared-core/lib/user-management.ts:741`
- **Purpose**: Lookup user by Clerk user ID (primary identifier)
- **Database Tables**: `app_users` (SELECT)
- **Query Type**: SELECT
- **Parameters**: `clerkUserId` (string)
- **Return Data**: `AppUser | null`
- **Used By**: 
  - `app/api/auth/check-access/route.ts`
  - `app/api/admin/users/[userId]/roles/route.ts`
  - `packages/shared-core/lib/impersonation.ts`
  - Multiple other routes for user lookup
- **Frequency**: On every authenticated request, user lookup operations
- **Priority**: HIGH
- **API Hub Endpoint Needed**: `/api/radius/users/by-clerk-id?clerkUserId={clerkUserId}` or include in profile endpoint
- **Notes**: Often called before getUserProfile - could be combined

### Operation 3: getUserRolesForMicroservice

- **Location**: `packages/shared-core/lib/user-management.ts:112`
- **Purpose**: Fetches user roles for a specific microservice
- **Database Tables**: 
  - `user_roles` (SELECT with JOIN to `microservice_apps`)
- **Query Type**: SELECT
- **Parameters**: `userId` (string), `microserviceCode` (string)
- **Return Data**: `UserRole[]` (with computed fields: role_display_name, role_level)
- **Used By**: 
  - `app/api/auth/check-access/route.ts`
  - `app/api/navigation/route.ts` (indirectly via permissions)
- **Frequency**: On every page load (for access checks)
- **Priority**: HIGH
- **API Hub Endpoint Needed**: Include in `/api/radius/users/profile` endpoint
- **Notes**: Should be batched with getUserProfile

### Operation 4: getUserPermissionsForMicroservice

- **Location**: `packages/shared-core/lib/user-management.ts:140`
- **Purpose**: Fetches user permissions for a specific microservice
- **Database Tables**: 
  - `user_permissions` (SELECT with JOIN to `permissions` and `microservice_apps`)
- **Query Type**: SELECT
- **Parameters**: `userId` (string), `microserviceCode` (string)
- **Return Data**: `Permission[]`
- **Used By**: 
  - `app/api/auth/check-access/route.ts`
  - `app/api/navigation/route.ts` (for permission-based filtering)
- **Frequency**: On every page load (for access checks)
- **Priority**: HIGH
- **API Hub Endpoint Needed**: Include in `/api/radius/users/profile` endpoint
- **Notes**: Should be batched with getUserProfile

### Operation 5: checkUserAccess

- **Location**: `packages/shared-core/lib/user-access-check.ts:12`
- **Purpose**: Validates if user has access to platform (checks app_users and invited_users)
- **Database Tables**: 
  - `app_users` (SELECT)
  - `invited_users` (SELECT)
  - `communication_logs` (SELECT - for deduplication)
- **Query Type**: SELECT (3 queries)
- **Parameters**: `clerkUserId` (string), `email` (string), `firstName?` (string), `lastName?` (string)
- **Return Data**: 
  ```typescript
  {
    hasAccess: boolean,
    requiresInvitation: boolean,
    isNewUser: boolean,
    userExists: boolean,
    hasInvitation: boolean
  }
  ```
- **Used By**: 
  - `app/api/auth/check-access/route.ts`
- **Frequency**: On user login, access validation
- **Priority**: HIGH
- **API Hub Endpoint Needed**: `/api/radius/users/check-access?clerkUserId={id}&email={email}`
- **Notes**: Critical for access control - sends email notifications for new users

### Operation 6: Navigation Route - User Lookup

- **Location**: `app/api/navigation/route.ts:29-142`
- **Purpose**: Looks up user by Clerk ID or email (with impersonation support)
- **Database Tables**: `app_users` (SELECT)
- **Query Type**: SELECT (conditional based on impersonation and environment)
- **Parameters**: 
  - `clerkUserId` or `email` (from headers)
  - `impersonatedUserId` (from cookies, optional)
  - `deploymentEnv` (for service-domain-admin, optional)
- **Return Data**: User record with id, email, first_name, last_name, is_active, clerk_user_id, user_type, environment
- **Used By**: 
  - `components/app-sidebar.tsx` (via navigation API)
  - `app/(protected)/dashboard/page.tsx`
- **Frequency**: On every page load (for navigation)
- **Priority**: HIGH
- **API Hub Endpoint Needed**: Use `/api/radius/users/profile` or `/api/radius/users/by-clerk-id`
- **Notes**: Complex query with environment filtering - needs careful API design

### Operation 7: Navigation Route - User Permissions Query

- **Location**: `app/api/navigation/route.ts:153-174`
- **Purpose**: Fetches user permissions for microservice (for navigation filtering)
- **Database Tables**: 
  - `user_permissions` (SELECT with JOIN to `permissions` and `microservice_apps`)
- **Query Type**: SELECT
- **Parameters**: `userId` (string), `microserviceCode` (string)
- **Return Data**: Array of `permission_code` strings
- **Used By**: 
  - `app/api/navigation/route.ts` (for filtering navigation items)
- **Frequency**: On every page load (for navigation)
- **Priority**: HIGH
- **API Hub Endpoint Needed**: Include in `/api/radius/users/profile` endpoint
- **Notes**: Duplicates getUserPermissionsForMicroservice - should use same endpoint

### Operation 8: Permissions Route - User Lookup

- **Location**: `app/api/permissions/route.ts:52-117`
- **Purpose**: Looks up user by Clerk ID or email (with impersonation and environment support)
- **Database Tables**: `app_users` (SELECT)
- **Query Type**: SELECT (conditional based on impersonation and environment)
- **Parameters**: 
  - `clerkUserId` or `email` (from headers)
  - `impersonatedUserId` (from cookies, optional)
  - `deploymentEnv` (for service-domain-admin, optional)
- **Return Data**: User record
- **Used By**: 
  - `app/api/permissions/route.ts` (for fetching user profile)
  - `packages/shared-core/hooks/use-permissions.ts` (client-side hook)
- **Frequency**: On every page load (for permissions hook)
- **Priority**: HIGH
- **API Hub Endpoint Needed**: Use `/api/radius/users/profile` or `/api/radius/users/by-clerk-id`
- **Notes**: Duplicates navigation route user lookup - should use same endpoint

### Operation 9: Permissions Route - getUserProfile Call

- **Location**: `app/api/permissions/route.ts:126`
- **Purpose**: Calls getUserProfile to get complete user data with roles and permissions
- **Database Tables**: See Operation 1 (getUserProfile)
- **Query Type**: SELECT (via getUserProfile function)
- **Parameters**: `appUser.id` (string)
- **Return Data**: Complete user profile with roles and permissions
- **Used By**: 
  - `app/api/permissions/route.ts` (returns to client)
  - `packages/shared-core/hooks/use-permissions.ts` (client-side hook)
- **Frequency**: On every page load (for permissions hook)
- **Priority**: HIGH
- **API Hub Endpoint Needed**: Use `/api/radius/users/profile?userId={userId}`
- **Notes**: This is the main endpoint used by the frontend permissions hook

### Operation 10: hasPermission

- **Location**: `packages/shared-core/lib/user-management.ts:162`
- **Purpose**: Checks if user has a specific permission
- **Database Tables**: 
  - `user_permissions` (SELECT with JOIN to `permissions` and `microservice_apps`)
- **Query Type**: SELECT (COUNT query)
- **Parameters**: `userId` (string), `permissionCode` (string), `microserviceCode` (string), `context?` (object)
- **Return Data**: `boolean`
- **Used By**: 
  - `app/api/admin/users/[userId]/roles/route.ts` (permission checks)
  - Various permission checking operations
- **Frequency**: On permission checks (varies)
- **Priority**: HIGH
- **API Hub Endpoint Needed**: `/api/radius/users/check-permission?userId={id}&permissionCode={code}&microserviceCode={code}`
- **Notes**: Could be optimized by caching permissions from profile endpoint

### Operation 11: getEffectiveUser (Impersonation)

- **Location**: `packages/shared-core/lib/impersonation.ts:76`
- **Purpose**: Gets effective user (impersonated if active, otherwise real user)
- **Database Tables**: `app_users` (SELECT)
- **Query Type**: SELECT
- **Parameters**: `realClerkUserId` (string), `request?` (NextRequest for cookie access)
- **Return Data**: `AppUser | null`
- **Used By**: 
  - `app/api/auth/check-access/route.ts`
  - Various routes that need to respect impersonation
- **Frequency**: On authenticated requests when impersonation is active
- **Priority**: HIGH
- **API Hub Endpoint Needed**: Use `/api/radius/users/by-clerk-id` or `/api/radius/users/by-id` (for impersonation)
- **Notes**: Needs to support impersonation cookie handling

### Operation 12: createOrUpdateAppUser

- **Location**: `packages/shared-core/lib/user-management.ts:229`
- **Purpose**: Creates or updates app user from Clerk user data
- **Database Tables**: 
  - `app_users` (SELECT, INSERT, UPDATE)
  - `microservice_apps` (SELECT - for role assignment)
- **Query Type**: SELECT, INSERT, UPDATE (multiple queries)
- **Parameters**: `clerkUser` (Clerk user object)
- **Return Data**: `AppUser`
- **Used By**: 
  - Clerk webhook handlers
  - User creation flows
- **Frequency**: On user sign-up, webhook events
- **Priority**: MEDIUM (write operation, less frequent)
- **API Hub Endpoint Needed**: `/api/radius/users/create-or-update` (POST)
- **Notes**: Write operation - may need special handling in API Hub

---

## Category 2: Navigation (HIGH PRIORITY)

**Priority**: HIGH  
**Impact**: Critical - Used on every page load  
**Frequency**: On every page load  
**Conversion Strategy**: Single endpoint for navigation items with permission filtering

### Operation 13: Navigation Route - Microservice Lookup

- **Location**: `app/api/navigation/route.ts:238-250`
- **Purpose**: Looks up microservice by app_code
- **Database Tables**: `microservice_apps` (SELECT)
- **Query Type**: SELECT
- **Parameters**: `microserviceCode` (string)
- **Return Data**: Microservice record with id
- **Used By**: 
  - `app/api/navigation/route.ts` (to get microservice ID for navigation items)
- **Frequency**: On every page load (for navigation)
- **Priority**: HIGH
- **API Hub Endpoint Needed**: `/api/radius/microservices/by-code?code={code}` or include in navigation endpoint
- **Notes**: Simple lookup - could be cached or included in navigation response

### Operation 14: Navigation Route - Navigation Items Query

- **Location**: `app/api/navigation/route.ts:270-294`
- **Purpose**: Fetches navigation items for microservice with permission filtering
- **Database Tables**: 
  - `navigation_items` (SELECT with JOIN to `microservice_apps`)
- **Query Type**: SELECT
- **Parameters**: `microserviceId` (string)
- **Return Data**: Array of navigation items with code, title, url, icon, permission_required, category, order_index
- **Used By**: 
  - `app/api/navigation/route.ts` (returns to client)
  - `components/app-sidebar.tsx` (renders navigation)
- **Frequency**: On every page load (for navigation)
- **Priority**: HIGH
- **API Hub Endpoint Needed**: `/api/radius/navigation?microserviceCode={code}&userPermissions={permissions}`
- **Notes**: Should filter by permissions on server side - client sends permissions array

---

## Category 3: Appointments (MEDIUM PRIORITY)

**Priority**: MEDIUM  
**Impact**: High - Core functionality  
**Frequency**: On appointment views, calendar loads, CRUD operations  
**Conversion Strategy**: Use existing `/api/radius/appointments` endpoint (already available)

### Operation 15: Appointments Route - GET (List)

- **Location**: `app/api/appointments/route.ts:64`
- **Purpose**: Fetches appointments with optional filtering
- **Database Tables**: 
  - `appointments` (SELECT with JOIN to `SyncActiveHomes`)
- **Query Type**: SELECT
- **Parameters**: `startDate?`, `endDate?`, `assignedTo?`, `status?`, `appointmentType?`
- **Return Data**: Array of appointments with home details
- **Used By**: 
  - `app/(protected)/visits-calendar/page.tsx`
  - `app/(protected)/visits-list/page.tsx`
  - Appointment components
- **Frequency**: On calendar/list page loads, filtering operations
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/appointments` (already exists)
- **Notes**: Endpoint already available in API Hub - needs conversion

### Operation 16: Appointments Route - POST (Create)

- **Location**: `app/api/appointments/route.ts:271`
- **Purpose**: Creates new appointment
- **Database Tables**: 
  - `appointments` (INSERT)
  - `SyncActiveHomes` (SELECT - for validation)
- **Query Type**: INSERT, SELECT (validation)
- **Parameters**: Appointment data (title, dates, home, assigned user, etc.)
- **Return Data**: Created appointment with ID
- **Used By**: 
  - `components/appointments/create-appointment-dialog.tsx`
- **Frequency**: On appointment creation
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/appointments` (POST - needs to be added)
- **Notes**: Write operation - API Hub needs POST support

### Operation 17: Appointments Route - PUT (Update)

- **Location**: `app/api/appointments/route.ts:457`
- **Purpose**: Updates existing appointment
- **Database Tables**: 
  - `appointments` (SELECT, UPDATE)
  - `SyncActiveHomes` (SELECT - for validation)
- **Query Type**: SELECT, UPDATE
- **Parameters**: `appointmentId`, appointment data
- **Return Data**: Updated appointment
- **Used By**: 
  - Appointment editing components
- **Frequency**: On appointment updates
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/appointments/{id}` (PUT - needs to be added)
- **Notes**: Write operation - API Hub needs PUT support

### Operation 18: Appointment by ID - GET

- **Location**: `app/api/appointments/[appointmentId]/route.ts:15`
- **Purpose**: Fetches single appointment with details
- **Database Tables**: 
  - `appointments` (SELECT with JOIN to `SyncActiveHomes`)
  - `travel_legs` (SELECT - for travel data)
- **Query Type**: SELECT
- **Parameters**: `appointmentId` (string)
- **Return Data**: Single appointment with travel leg data
- **Used By**: 
  - Appointment detail pages
  - Appointment editing
- **Frequency**: On appointment detail view
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/appointments/{id}` (GET - needs to be added)
- **Notes**: Should include travel leg data in response

### Operation 19: Appointment Homes - GET

- **Location**: `app/api/appointments/homes/route.ts:12`
- **Purpose**: Fetches homes for appointment assignment dropdown
- **Database Tables**: `SyncActiveHomes` (SELECT)
- **Query Type**: SELECT
- **Parameters**: None
- **Return Data**: Array of homes with basic info
- **Used By**: 
  - `components/appointments/create-appointment-dialog.tsx`
- **Frequency**: On appointment creation form load
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/homes` (already exists)
- **Notes**: Endpoint already available - needs conversion

### Operation 20-25: Additional Appointment Operations

- **Appointment Mileage**: `app/api/appointments/[appointmentId]/mileage/route.ts` - Multiple queries for travel tracking
- **Appointment Send Link**: `app/api/appointments/[appointmentId]/send-link/route.ts` - User lookups, appointment queries
- **Appointment Training Summary**: `app/api/appointments/[appointmentId]/training-summary/route.ts` - Appointment and training queries
- **Appointment Next Appointment**: `app/api/appointments/[appointmentId]/next-appointment/route.ts` - Appointment queries
- **Appointment Staff**: `app/api/appointments/staff/route.ts` - Staff user queries
- **Dashboard Appointments**: `app/api/dashboard/home-liaison/route.ts` - Multiple appointment queries with filters

**Priority**: MEDIUM  
**API Hub Endpoint Needed**: Extend `/api/radius/appointments` with additional endpoints

---

## Category 4: Visit Forms (MEDIUM PRIORITY)

**Priority**: MEDIUM  
**Impact**: High - Core functionality  
**Frequency**: On visit form views, saves, loads  
**Conversion Strategy**: Use existing `/api/radius/visit-forms` endpoint (already available)

### Operation 26: Visit Forms Route - GET (List)

- **Location**: `app/api/visit-forms/route.ts:43`
- **Purpose**: Fetches visit forms with optional filtering
- **Database Tables**: 
  - `visit_forms` (SELECT with JOIN to `appointments`)
- **Query Type**: SELECT
- **Parameters**: `appointmentId?`, `status?`, `userId?`
- **Return Data**: Array of visit forms with parsed JSON fields
- **Used By**: 
  - Visit form list pages
  - Visit form components
- **Frequency**: On visit form list loads
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/visit-forms` (already exists)
- **Notes**: Endpoint already available - needs conversion

### Operation 27: Visit Forms Route - POST (Create/Update)

- **Location**: `app/api/visit-forms/route.ts:277` (update), `358` (create)
- **Purpose**: Creates or updates visit form (with auto-save support)
- **Database Tables**: 
  - `visit_forms` (SELECT, INSERT, UPDATE)
  - `appointments` (SELECT - for validation)
- **Query Type**: SELECT, INSERT, UPDATE
- **Parameters**: Complete visit form data (JSON fields serialized)
- **Return Data**: Created/updated visit form with ID
- **Used By**: 
  - Visit form save operations
  - Auto-save functionality
- **Frequency**: On form saves (manual and auto-save)
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/visit-forms` (POST/PUT - needs to be added)
- **Notes**: Write operation - complex with session tracking and auto-save

### Operation 28: Visit Form by ID - GET

- **Location**: `app/api/visit-forms/[id]/route.ts:13`
- **Purpose**: Fetches single visit form
- **Database Tables**: `visit_forms` (SELECT)
- **Query Type**: SELECT
- **Parameters**: `id` (string)
- **Return Data**: Single visit form with parsed JSON fields
- **Used By**: 
  - Visit form detail/edit pages
- **Frequency**: On visit form load
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/visit-forms/{id}` (GET - needs to be added)
- **Notes**: Should parse JSON fields in API Hub response

### Operation 29: Visit Form Templates - GET

- **Location**: `app/api/visit-forms/templates/route.ts:34`
- **Purpose**: Fetches visit form templates
- **Database Tables**: `visit_form_templates` (SELECT)
- **Query Type**: SELECT
- **Parameters**: `type?` (string, default: "home_visit")
- **Return Data**: Array of templates with parsed JSON data
- **Used By**: 
  - Visit form template selection
- **Frequency**: On template selection
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/visit-forms/templates?type={type}`
- **Notes**: Read-only operation

### Operation 30: Visit Form Templates - POST

- **Location**: `app/api/visit-forms/templates/route.ts:78`
- **Purpose**: Creates new visit form template
- **Database Tables**: `visit_form_templates` (INSERT)
- **Query Type**: INSERT
- **Parameters**: `templateName`, `templateType`, `templateData`
- **Return Data**: Created template with ID
- **Used By**: 
  - Template creation (admin)
- **Frequency**: On template creation
- **Priority**: LOW
- **API Hub Endpoint Needed**: `/api/radius/visit-forms/templates` (POST)
- **Notes**: Write operation - admin only

### Operation 31: Visit Form Prepopulate - GET

- **Location**: `app/api/visit-forms/prepopulate/route.ts:43`
- **Purpose**: Fetches data to prepopulate visit form
- **Database Tables**: 
  - `appointments` (SELECT)
  - `SyncActiveHomes` (SELECT)
  - `visit_forms` (SELECT - for previous visits)
- **Query Type**: SELECT (3 queries)
- **Parameters**: `appointmentId` (string)
- **Return Data**: Appointment, home, and previous visit data
- **Used By**: 
  - Visit form creation/editing
- **Frequency**: On visit form load
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/visit-forms/prepopulate?appointmentId={id}`
- **Notes**: Combines multiple data sources - good candidate for batching

### Operation 32-35: Additional Visit Form Operations

- **Visit Form Attachments**: `app/api/visit-forms/[id]/attachments/route.ts` - Multiple queries for attachment management
- **Visit Form Signature Tokens**: `app/api/visit-forms/signature-tokens/route.ts` - Token and form queries
- **Visit Form Send Report**: `app/api/visit-forms/send-report/route.ts` - Form and attachment queries
- **Visit Form by ID - PUT**: `app/api/visit-forms/[id]/route.ts:145` - Update operations

**Priority**: MEDIUM  
**API Hub Endpoint Needed**: Extend `/api/radius/visit-forms` with additional endpoints

---

## Category 5: Homes (MEDIUM PRIORITY)

**Priority**: MEDIUM  
**Impact**: High - Used for appointment assignment, visit forms  
**Frequency**: On home selection, lookup operations  
**Conversion Strategy**: Use existing `/api/radius/homes` endpoint (already available)

### Operation 36: Homes List - GET

- **Location**: `lib/db-extensions.ts:38` (fetchHomesList)
- **Purpose**: Fetches homes list with filtering
- **Database Tables**: `SyncActiveHomes` (SELECT)
- **Query Type**: SELECT
- **Parameters**: `unit?`, `caseManager?`, `search?`
- **Return Data**: Array of homes with coordinates, contact info
- **Used By**: 
  - Home selection components
  - Map displays
  - Filtering operations
- **Frequency**: On home list loads, filtering
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/homes` (already exists)
- **Notes**: Endpoint already available - needs conversion

### Operation 37: Homes for Map - GET

- **Location**: `lib/db-extensions.ts:118` (fetchHomesForMap)
- **Purpose**: Fetches homes with coordinates for map display
- **Database Tables**: `SyncActiveHomes` (SELECT)
- **Query Type**: SELECT
- **Parameters**: `unit?`, `caseManager?`
- **Return Data**: Array of homes with validated coordinates
- **Used By**: 
  - Map components
- **Frequency**: On map loads
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/homes?forMap=true` (extend existing)
- **Notes**: Similar to homes list but filtered for coordinates

### Operation 38: Home Lookup by Xref - GET

- **Location**: `app/api/homes/lookup/route.ts:21`
- **Purpose**: Looks up home GUID by Xref
- **Database Tables**: `syncActiveHomes` (SELECT)
- **Query Type**: SELECT
- **Parameters**: `xref` (string)
- **Return Data**: Home GUID, name, xref
- **Used By**: 
  - Home lookup operations
- **Frequency**: On home lookups
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/homes/by-xref?xref={xref}`
- **Notes**: Simple lookup operation

### Operation 39: Home Prepopulate - GET

- **Location**: `app/api/homes/[homeGuid]/prepopulate/route.ts:41`
- **Purpose**: Fetches comprehensive home data for form prepopulation
- **Database Tables**: 
  - `syncLicenseCurrent` (SELECT with JOIN to `syncActiveHomes`)
  - `syncCurrentFosterFacility` (SELECT - household members)
  - `syncChildrenInPlacement` (SELECT - children)
  - `visit_forms` (SELECT with JOIN to `appointments` and `SyncActiveHomes` - previous visits)
- **Query Type**: SELECT (4 queries)
- **Parameters**: `homeGuid` (string)
- **Return Data**: Complete home data including license, household, children, previous visits
- **Used By**: 
  - Visit form prepopulation
- **Frequency**: On visit form creation for specific home
- **Priority**: MEDIUM
- **API Hub Endpoint Needed**: `/api/radius/homes/{guid}/prepopulate`
- **Notes**: Complex operation combining multiple data sources - good candidate for batching

---

## Category 6: Admin Operations (LOW PRIORITY)

**Priority**: LOW  
**Impact**: Medium - Admin functionality  
**Frequency**: On admin page loads, user management operations  
**Conversion Strategy**: Create admin-specific endpoints

### Operation 40: Admin Users - GET

- **Location**: `app/api/admin/users/route.ts:14`
- **Purpose**: Fetches all users with roles and permissions
- **Database Tables**: 
  - `app_users` (SELECT)
  - `user_roles` (SELECT with JOIN to `microservice_apps`)
  - `user_permissions` (SELECT with JOIN to `permissions` and `microservice_apps`)
  - `permissions` (SELECT with JOIN to `microservice_apps`)
  - `microservice_apps` (SELECT)
- **Query Type**: SELECT (5 queries)
- **Parameters**: None (filtered by microservice code)
- **Return Data**: Users with roles and permissions
- **Used By**: 
  - Admin user management pages
- **Frequency**: On admin page loads
- **Priority**: LOW
- **API Hub Endpoint Needed**: `/api/radius/admin/users?microserviceCode={code}`
- **Notes**: Admin-only operation

### Operation 41: Admin Users - POST

- **Location**: `app/api/admin/users/route.ts:167`
- **Purpose**: Creates new user
- **Database Tables**: `app_users` (INSERT)
- **Query Type**: INSERT
- **Parameters**: `email`, `firstName`, `lastName`
- **Return Data**: Created user
- **Used By**: 
  - Admin user creation
- **Frequency**: On user creation
- **Priority**: LOW
- **API Hub Endpoint Needed**: `/api/radius/admin/users` (POST)
- **Notes**: Write operation - admin only

### Operation 42: Admin User Roles - PUT

- **Location**: `app/api/admin/users/[userId]/roles/route.ts:40`
- **Purpose**: Updates user roles for microservice
- **Database Tables**: 
  - `microservice_apps` (SELECT)
  - `user_roles` (SELECT, UPDATE, INSERT)
- **Query Type**: SELECT, UPDATE, INSERT (via updateUserRoles function)
- **Parameters**: `userId`, `roles` (array), `microserviceCode`
- **Return Data**: Success message
- **Used By**: 
  - Admin role management
- **Frequency**: On role updates
- **Priority**: LOW
- **API Hub Endpoint Needed**: `/api/radius/admin/users/{userId}/roles` (PUT)
- **Notes**: Write operation - uses updateUserRoles which has complex transaction logic

### Operation 43-45: Additional Admin Operations

- **Admin Permissions**: `app/api/admin/permissions/route.ts` - Permission queries
- **Admin Navigation Items**: `app/api/admin/navigation-items/[id]/route.ts` - Navigation item CRUD
- **Admin Invitations**: `app/api/admin/invitations/route.ts` - Invitation queries

**Priority**: LOW  
**API Hub Endpoint Needed**: `/api/radius/admin/*` endpoints

---

## Category 7: Other Operations (LOW PRIORITY)

**Priority**: LOW  
**Impact**: Varies - Supporting functionality  
**Frequency**: Varies  
**Conversion Strategy**: Create endpoints as needed

### Operation 46-55: Travel Legs Operations

- **Location**: `app/api/travel-legs/**/*.ts`
- **Purpose**: Travel tracking for appointments
- **Database Tables**: 
  - `travel_legs` (SELECT, INSERT, UPDATE, DELETE)
  - `appointments` (SELECT - for validation)
- **Query Type**: SELECT, INSERT, UPDATE, DELETE
- **Priority**: LOW
- **API Hub Endpoint Needed**: `/api/radius/travel-legs/*`
- **Notes**: Supporting feature - can be converted later

### Operation 56-65: On-Call Operations

- **Location**: `app/api/on-call/**/*.ts`
- **Purpose**: On-call schedule management
- **Database Tables**: 
  - `on_call_schedules` (SELECT, INSERT, UPDATE, DELETE)
  - `app_users` (SELECT - for user lookups)
- **Query Type**: SELECT, INSERT, UPDATE, DELETE
- **Priority**: LOW
- **API Hub Endpoint Needed**: `/api/radius/on-call/*`
- **Notes**: Supporting feature - can be converted later

### Operation 66-68: Continuum Operations

- **Location**: `app/api/continuum/entries/route.ts`
- **Purpose**: Activity logging
- **Database Tables**: 
  - `continuum_entries` (SELECT, INSERT)
- **Query Type**: SELECT, INSERT
- **Priority**: LOW
- **API Hub Endpoint Needed**: `/api/radius/continuum/entries`
- **Notes**: Supporting feature - can be converted later

### Operation 69-75: Signature Token Operations

- **Location**: `app/api/signature-tokens/**/*.ts`, `app/api/visit-forms/**/signature-tokens/route.ts`
- **Purpose**: Signature token management
- **Database Tables**: 
  - `signature_tokens` (SELECT, INSERT, UPDATE)
  - `visit_forms` (SELECT)
  - `app_users` (SELECT)
- **Query Type**: SELECT, INSERT, UPDATE
- **Priority**: LOW
- **API Hub Endpoint Needed**: `/api/radius/signature-tokens/*`
- **Notes**: Supporting feature - can be converted later

### Operation 76-80: Dashboard Operations

- **Location**: `app/api/dashboard/home-liaison/route.ts`
- **Purpose**: Dashboard data aggregation
- **Database Tables**: 
  - `appointments` (SELECT - multiple queries)
  - `on_call_schedules` (SELECT)
  - `visit_forms` (SELECT)
- **Query Type**: SELECT (multiple queries)
- **Priority**: LOW
- **API Hub Endpoint Needed**: `/api/radius/dashboard/home-liaison`
- **Notes**: Aggregates data from multiple sources - good candidate for batching

---

## Dependencies and Relationships

### Authentication Dependency Chain

1. **User Lookup** → **getUserProfile** → **Roles/Permissions** → **Navigation Filtering**
   - Navigation depends on user permissions
   - Permissions depend on user profile
   - User profile depends on user lookup

2. **checkUserAccess** → **createOrUpdateAppUser** → **getUserProfile**
   - Access check may trigger user creation
   - User creation triggers profile fetch

### Data Flow Patterns

1. **Page Load Flow**:
   - Navigation API → User lookup → Permissions → Navigation items
   - Permissions API → User lookup → getUserProfile → Roles/Permissions

2. **Form Prepopulation Flow**:
   - Appointment → Home lookup → Home prepopulate → Previous visits

3. **CRUD Flow**:
   - List → Detail → Edit → Save → Validation queries

### Batching Opportunities

1. **Authentication Initialization**: Combine user lookup, roles, permissions into single `/api/radius/users/profile` call
2. **Home Prepopulation**: Combine license, household, children, previous visits into single call
3. **Visit Form Prepopulation**: Combine appointment, home, previous visits into single call
4. **Dashboard**: Combine multiple appointment queries into single aggregated call

---

## API Endpoint Design Recommendations

### 1. Authentication Endpoints (HIGH PRIORITY)

```
GET /api/radius/users/profile?userId={userId}
  - Returns: { user, roles, permissions, microservices }
  - Combines: getUserProfile, getUserRolesForMicroservice, getUserPermissionsForMicroservice

GET /api/radius/users/by-clerk-id?clerkUserId={id}
  - Returns: AppUser
  - Alternative: Include in profile endpoint

GET /api/radius/users/check-access?clerkUserId={id}&email={email}
  - Returns: { hasAccess, requiresInvitation, isNewUser, userExists, hasInvitation }
  - Combines: checkUserAccess queries

POST /api/radius/users/create-or-update
  - Body: Clerk user object
  - Returns: AppUser
  - Combines: createOrUpdateAppUser operations
```

### 2. Navigation Endpoints (HIGH PRIORITY)

```
GET /api/radius/navigation?microserviceCode={code}&userPermissions={permissions}
  - Returns: Filtered navigation items
  - Combines: Microservice lookup + Navigation items query
  - Filters by permissions on server side
```

### 3. Appointments Endpoints (MEDIUM PRIORITY)

```
GET /api/radius/appointments
  - Already exists
  - Query params: startDate, endDate, assignedTo, status, type

POST /api/radius/appointments
  - Needs to be added
  - Body: Appointment data

GET /api/radius/appointments/{id}
  - Needs to be added
  - Returns: Single appointment with travel legs

PUT /api/radius/appointments/{id}
  - Needs to be added
  - Body: Updated appointment data
```

### 4. Visit Forms Endpoints (MEDIUM PRIORITY)

```
GET /api/radius/visit-forms
  - Already exists
  - Query params: appointmentId, status, userId

POST /api/radius/visit-forms
  - Needs to be added
  - Body: Visit form data (with auto-save support)

GET /api/radius/visit-forms/{id}
  - Needs to be added
  - Returns: Single visit form with parsed JSON

PUT /api/radius/visit-forms/{id}
  - Needs to be added
  - Body: Updated visit form data

GET /api/radius/visit-forms/prepopulate?appointmentId={id}
  - Needs to be added
  - Returns: Appointment + Home + Previous visits
  - Combines multiple queries
```

### 5. Homes Endpoints (MEDIUM PRIORITY)

```
GET /api/radius/homes
  - Already exists
  - Query params: unit, caseManager, search, forMap

GET /api/radius/homes/by-xref?xref={xref}
  - Needs to be added
  - Returns: Home GUID lookup

GET /api/radius/homes/{guid}/prepopulate
  - Needs to be added
  - Returns: License + Household + Children + Previous visits
  - Combines multiple queries
```

### 6. Admin Endpoints (LOW PRIORITY)

```
GET /api/radius/admin/users?microserviceCode={code}
  - Needs to be added
  - Returns: Users with roles and permissions

POST /api/radius/admin/users
  - Needs to be added
  - Body: User data

PUT /api/radius/admin/users/{userId}/roles
  - Needs to be added
  - Body: Roles array
```

---

## Conversion Strategy

### Phase 1: Authentication Initialization (WEEK 1)

**Goal**: Enable microservice to function without direct database access

1. **Add `/api/radius/users/profile` endpoint to API Hub**
   - Combines: getUserProfile, getUserRolesForMicroservice, getUserPermissionsForMicroservice
   - Returns complete user profile with roles and permissions
   - Supports microservice filtering

2. **Add `/api/radius/users/by-clerk-id` endpoint**
   - Simple user lookup
   - Supports impersonation

3. **Add `/api/radius/users/check-access` endpoint**
   - Access validation
   - Email notification support

4. **Convert authentication operations**:
   - `app/api/permissions/route.ts` → Use `/api/radius/users/profile`
   - `app/api/navigation/route.ts` → Use `/api/radius/users/profile` and `/api/radius/users/by-clerk-id`
   - `app/api/auth/check-access/route.ts` → Use `/api/radius/users/check-access`
   - `packages/shared-core/lib/user-management.ts` → Update functions to use API Hub client

5. **Test**: Verify all authentication flows work

### Phase 2: Navigation (WEEK 1-2)

**Goal**: Enable navigation without direct database access

1. **Add `/api/radius/navigation` endpoint to API Hub**
   - Fetches navigation items for microservice
   - Filters by permissions on server side
   - Includes microservice metadata

2. **Convert navigation operations**:
   - `app/api/navigation/route.ts` → Use `/api/radius/navigation`
   - Remove direct database queries

3. **Test**: Verify navigation loads and filters correctly

### Phase 3: Core Data Operations (WEEK 2-3)

**Goal**: Convert appointments and visit forms

1. **Extend `/api/radius/appointments` endpoint**
   - Add POST, PUT, GET by ID
   - Add travel leg support

2. **Extend `/api/radius/visit-forms` endpoint**
   - Add POST, PUT, GET by ID
   - Add prepopulate endpoint
   - Add template endpoints

3. **Convert operations**:
   - `app/api/appointments/**/*.ts` → Use API Hub client
   - `app/api/visit-forms/**/*.ts` → Use API Hub client

4. **Test**: Verify CRUD operations work

### Phase 4: Homes and Prepopulation (WEEK 3)

**Goal**: Convert home operations and prepopulation

1. **Extend `/api/radius/homes` endpoint**
   - Add by-xref lookup
   - Add prepopulate endpoint

2. **Convert operations**:
   - `app/api/homes/**/*.ts` → Use API Hub client
   - `lib/db-extensions.ts` → Use API Hub client

3. **Test**: Verify home lookups and prepopulation work

### Phase 5: Supporting Features (WEEK 4+)

**Goal**: Convert remaining operations

1. **Add admin endpoints** (if needed)
2. **Add travel legs endpoints** (if needed)
3. **Add on-call endpoints** (if needed)
4. **Add continuum endpoints** (if needed)
5. **Add signature token endpoints** (if needed)

### Testing Strategy

1. **Unit Tests**: Test API Hub client functions
2. **Integration Tests**: Test converted API routes
3. **E2E Tests**: Test full user flows
4. **Performance Tests**: Verify API Hub performance vs direct DB
5. **Rollback Plan**: Keep direct DB access as fallback during transition

### Migration Checklist

- [ ] Phase 1: Authentication endpoints added to API Hub
- [ ] Phase 1: Authentication operations converted
- [ ] Phase 1: Authentication tests passing
- [ ] Phase 2: Navigation endpoint added to API Hub
- [ ] Phase 2: Navigation operations converted
- [ ] Phase 2: Navigation tests passing
- [ ] Phase 3: Appointments endpoints extended
- [ ] Phase 3: Appointments operations converted
- [ ] Phase 3: Visit forms endpoints extended
- [ ] Phase 3: Visit forms operations converted
- [ ] Phase 3: Core data tests passing
- [ ] Phase 4: Homes endpoints extended
- [ ] Phase 4: Homes operations converted
- [ ] Phase 4: Homes tests passing
- [ ] Phase 5: Supporting features converted (optional)
- [ ] Final: Remove all direct database connections
- [ ] Final: Update documentation

---

## Summary

### Critical Operations (Must Convert First)

1. **getUserProfile** - Foundation for all authentication
2. **getUserByClerkId** - User lookup (most common)
3. **getUserRolesForMicroservice** - Role checking
4. **getUserPermissionsForMicroservice** - Permission checking
5. **Navigation queries** - Required for page loads
6. **checkUserAccess** - Access validation

### High-Value Batching Opportunities

1. **Authentication**: Combine user + roles + permissions into single call
2. **Home Prepopulation**: Combine license + household + children + previous visits
3. **Visit Form Prepopulation**: Combine appointment + home + previous visits
4. **Dashboard**: Aggregate multiple appointment queries

### Estimated Conversion Effort

- **Phase 1 (Auth)**: 3-5 days
- **Phase 2 (Navigation)**: 1-2 days
- **Phase 3 (Core Data)**: 5-7 days
- **Phase 4 (Homes)**: 2-3 days
- **Phase 5 (Supporting)**: 5-10 days (optional)

**Total**: 16-27 days for core functionality (Phases 1-4)

---

**Document Status**: Complete  
**Next Steps**: Review with team, prioritize phases, begin Phase 1 implementation

