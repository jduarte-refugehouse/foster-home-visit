# Phased Monorepo Migration Plan

## Strategy: Incremental, Testable Phases

Each phase will be:
- ✅ Independently testable
- ✅ Committed separately
- ✅ Non-breaking (or minimal breaking)
- ✅ Can be deployed and verified

---

## Phase 1: Structure Setup (No Breaking Changes)
**Goal**: Create monorepo structure without changing any imports
- ✅ Create `packages/shared-core/` directory structure
- ✅ Create root `package.json` with workspaces
- ✅ Create `packages/shared-core/package.json`
- ✅ Update `tsconfig.json` to support shared-core paths
- ✅ Copy shared files to shared-core (keep originals)
- **Test**: Verify current code still works, no import changes yet

---

## Phase 2: Extract System Admin Check (Single Module)
**Goal**: Move one small module and update its imports
- Move `lib/system-admin-check.ts` to shared-core
- Update imports in files that use it (2-3 files)
- Remove original file
- **Test**: Verify system admin functionality works

---

## Phase 3: Extract Auth Utilities (Small Module)
**Goal**: Move auth utilities
- Move `lib/clerk-auth-helper.ts` to shared-core
- Update imports (5-10 files)
- Remove original
- **Test**: Verify authentication works

---

## Phase 4: Extract Permissions Middleware
**Goal**: Move permissions system
- Move `lib/permissions-middleware.ts` to shared-core
- Update imports (10-20 files)
- Remove original
- **Test**: Verify permission checks work

---

## Phase 5: Extract User Management
**Goal**: Move user management
- Move `lib/user-management.ts`, `lib/user-access-check.ts` to shared-core
- Update imports (15-25 files)
- Remove originals
- **Test**: Verify user management works

---

## Phase 6: Extract Database & Core Libs
**Goal**: Move database and remaining core libraries
- Move `lib/db.ts`, `lib/impersonation.ts`, `lib/communication-logging.ts`, `lib/continuum-logger.ts`
- Update imports (20-30 files)
- Remove originals
- **Test**: Verify database connections and logging work

---

## Phase 7: Extract Access Guard Component
**Goal**: Move access guard
- Move `components/access-guard.tsx` to shared-core
- Update imports (2-3 files)
- Remove original
- **Test**: Verify access control works

---

## Phase 8: Extract UI Components
**Goal**: Move shared UI components
- Move `components/ui/*` to shared-core
- Update imports (50+ files - this is the big one)
- Remove originals
- **Test**: Verify UI components render correctly

---

## Phase 9: Extract Hooks
**Goal**: Move shared hooks
- Move `hooks/use-permissions.ts`, `hooks/use-safe-user.ts` to shared-core
- Update imports (10-15 files)
- Remove originals
- **Test**: Verify hooks work

---

## Phase 10: Extract API Routes
**Goal**: Move shared API routes
- Move `app/api/auth/check-access/route.ts` to shared-core
- Move `app/api/access-requests/route.ts` to shared-core
- Update route references
- Remove originals
- **Test**: Verify API routes work

---

## Phase 11: Final Cleanup
**Goal**: Clean up and verify
- Remove any duplicate files
- Update documentation
- Verify all imports use shared-core
- **Test**: Full application test

---

## Current Status: Phase 1 - In Progress

