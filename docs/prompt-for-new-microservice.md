# Prompt for Creating a New Microservice Domain

Use this prompt in a new chat session to create a new microservice domain:

---

## Prompt Text

```
I need to create a new microservice domain in our Refuge House multi-microservice platform. 

**Context:**
- We have a monorepo structure with `packages/shared-core/` containing all foundational utilities
- The existing "home-visits" microservice is the reference implementation
- All shared functionality (auth, db, permissions, components, etc.) is in `@refugehouse/shared-core/*`
- Each microservice is configured via `lib/microservice-config.ts` and environment variables
- Access control uses microservice-specific roles and permissions stored in the database

**New Microservice Details:**
- Microservice Code: [YOUR_MICROSERVICE_CODE] (e.g., "case-management", "service-plan", "training")
- Display Name: [YOUR_DISPLAY_NAME] (e.g., "Case Management System", "Service Plans", "Training Management")
- Description: [YOUR_DESCRIPTION]
- Base URL Path: [YOUR_BASE_PATH] (e.g., "/case-management", "/service-plans", "/training")

**Required Features:**
- [List your specific features/requirements here]
- Example: Dashboard, CRUD operations for [entity], reporting, etc.

**Roles Needed:**
- [List roles, e.g., "case_manager", "case_worker", "case_viewer"]
- Or use standard roles: manager, coordinator, worker, viewer

**Permissions Needed:**
- [List permissions, e.g., "view_cases", "create_cases", "edit_cases", "delete_cases"]
- Or use standard permissions: view, create, edit, delete, generate_reports, etc.

**Navigation Structure:**
- [List navigation items with URLs, icons, and order]
- Example:
  - Dashboard (/dashboard) - Home icon
  - Cases (/cases) - FileText icon
  - Reports (/reports) - BarChart3 icon
  - Admin (/admin) - Settings icon

**Please:**
1. Review the existing microservice structure in `lib/microservice-config.ts` and the home-visits implementation
2. Review the microservice creation guide at `docs/microservice-creation-guide.md`
3. Review the shared-core reference at `docs/shared-core-reference.md`
4. Create the microservice configuration following the established patterns
5. Set up the initial database SQL scripts (microservice registration, navigation items, permissions)
6. Create the basic page structure and routes
7. Ensure all imports use `@refugehouse/shared-core/*` aliases
8. Use `AccessGuard` component for route protection
9. Follow the same patterns as the home-visits microservice for consistency

**Key Files to Reference:**
- `lib/microservice-config.ts` - Microservice configuration pattern
- `app/(protected)/layout.tsx` - Layout with AccessGuard
- `app/(protected)/dashboard/page.tsx` - Dashboard example
- `packages/shared-core/components/access-guard.tsx` - Access control component
- `packages/shared-core/lib/user-management.ts` - User and permission management
- `docs/microservice-creation-guide.md` - Complete creation guide
- `docs/shared-core-reference.md` - Shared utilities reference

**Important:**
- All database operations must use `@refugehouse/shared-core/db`
- All authentication must use `@refugehouse/shared-core/auth`
- All permission checks must use `@refugehouse/shared-core/permissions`
- All UI components should use `@refugehouse/shared-core/components/ui/*`
- Navigation should be loaded from database via `@refugehouse/shared-core/app/api/navigation/route.ts`
- Follow the same file structure and naming conventions as home-visits

Please create this microservice following our established patterns and best practices.
```

---

## Customization Instructions

Before using this prompt, replace the placeholders:

1. **[YOUR_MICROSERVICE_CODE]** - A unique, lowercase, hyphenated identifier (e.g., `case-management`, `service-plan`, `training-management`)

2. **[YOUR_DISPLAY_NAME]** - The human-readable name (e.g., `Case Management System`, `Service Plans`, `Training Management`)

3. **[YOUR_DESCRIPTION]** - Brief description of what the microservice does

4. **[YOUR_BASE_PATH]** - The URL path prefix (e.g., `/case-management`, `/service-plans`, `/training`)

5. **Required Features** - List the specific features/functionality you need

6. **Roles Needed** - List the roles specific to this microservice (or use standard ones)

7. **Permissions Needed** - List the permissions specific to this microservice (or use standard ones)

8. **Navigation Structure** - List the navigation items with their URLs, icons, and order

---

## Example: Case Management Microservice

Here's a filled-in example:

```
I need to create a new microservice domain in our Refuge House multi-microservice platform. 

**Context:**
[Same as above]

**New Microservice Details:**
- Microservice Code: case-management
- Display Name: Case Management System
- Description: Child welfare case management and tracking
- Base URL Path: /case-management

**Required Features:**
- Dashboard with case statistics and recent activity
- Case list view with filtering and search
- Case detail view with full case information
- Create new case functionality
- Edit existing cases
- Case notes and timeline
- Document attachments
- Reporting and analytics

**Roles Needed:**
- case_manager (full access)
- case_worker (create/edit cases)
- case_viewer (read-only access)

**Permissions Needed:**
- view_cases
- create_cases
- edit_cases
- delete_cases
- manage_case_notes
- attach_documents
- generate_case_reports

**Navigation Structure:**
- Dashboard (/dashboard) - Home icon, order 1
- Active Cases (/cases/active) - FileText icon, order 2
- All Cases (/cases) - List icon, order 3
- Reports (/reports) - BarChart3 icon, order 4
- Homes Map (/homes-map) - Map icon, order 5 (shared)
- Homes List (/homes-list) - List icon, order 6 (shared)
- Administration (/admin) - Settings icon, order 7

**Please:**
[Same as above]
```

---

## Additional Notes

- The AI will reference the existing documentation and code patterns
- All shared functionality is already in `packages/shared-core/`
- The microservice will be configured via `lib/microservice-config.ts`
- Database setup scripts will be created in `scripts/`
- The microservice will follow the same structure as home-visits
- Access control will be handled automatically via `AccessGuard`

---

## After Microservice Creation

Once the microservice is created, you'll need to:

1. **Run Database Scripts**
   - Execute the SQL scripts to register the microservice
   - Create navigation items
   - Create permissions

2. **Configure Environment Variables**
   - Set `MICROSERVICE_CODE` in Vercel environment variables
   - Configure any service-specific environment variables

3. **Grant User Access**
   - Use SQL scripts or admin interface to grant roles/permissions to users
   - Reference `scripts/grant-home-liaison-access.sql` as a template

4. **Test Access Control**
   - Verify users with roles can access the microservice
   - Verify users without roles see "Request Access" page
   - Test permission-based feature access

5. **Deploy**
   - Deploy to Vercel with the new environment variable
   - Verify navigation loads correctly
   - Test all functionality

---

## Related Documentation

- `docs/microservice-creation-guide.md` - Complete step-by-step guide
- `docs/shared-core-reference.md` - All available shared utilities
- `docs/monorepo-completion-status.md` - Migration status and structure
- `docs/authentication-permissions-methodology.md` - Access control methodology
- `lib/microservice-config.ts` - Configuration pattern reference

