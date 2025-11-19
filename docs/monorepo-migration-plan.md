# Monorepo Migration Plan

## Strategy: Incremental Migration

To minimize risk and keep the existing service working, we'll use a **hybrid approach**:

1. **Phase 1**: Extract shared code to `packages/shared-core` (current phase)
2. **Phase 2**: Keep visit-service at root, import from shared-core
3. **Phase 3**: When ready, move visit-service to `packages/visit-service`

## Files to Extract to `packages/shared-core/`

### Core Libraries (lib/)
- `db.ts` - Database connection
- `clerk-auth-helper.ts` - Clerk authentication
- `auth-utils.ts` - Auth utilities
- `permissions-middleware.ts` - Permission checking
- `system-admin-check.ts` - System admin check
- `user-access-check.ts` - User access checking
- `user-management.ts` - User management
- `impersonation.ts` - Impersonation logic
- `communication-logging.ts` - Communication logging
- `continuum-logger.ts` - Continuum logging

### Components
- `components/access-guard.tsx` - Access guard component
- `components/ui/*` - All UI components (shared across services)

### Hooks
- `hooks/use-permissions.ts` - Permissions hook
- `hooks/use-safe-user.ts` - Safe user hook

### API Routes
- `app/api/auth/check-access/route.ts` - Access check API
- `app/api/access-requests/route.ts` - Access requests API

### Scripts
- `scripts/create-access-requests-table.sql` - Access requests table

## Files to Keep in Visit Service (root)

### Visit-Specific
- `lib/microservice-config.ts` - Visit service config
- All visit-specific routes in `app/(protected)/`
- Visit-specific components
- Visit-specific API routes

### Configuration
- `next.config.mjs` - Next.js config
- `tailwind.config.ts` - Tailwind config
- `tsconfig.json` - TypeScript config
- `postcss.config.mjs` - PostCSS config

## Migration Steps

1. ✅ Create workspace structure
2. ⏳ Extract shared files to `packages/shared-core/`
3. ⏳ Update imports in visit service to use `@refugehouse/shared-core`
4. ⏳ Test that everything still works
5. ⏳ Update Vercel configuration

## Import Path Changes

**Before:**
```typescript
import { checkPermission } from "@/lib/permissions-middleware"
```

**After:**
```typescript
import { checkPermission } from "@refugehouse/shared-core/permissions"
```

