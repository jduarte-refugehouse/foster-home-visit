# Shared-Core Audit: What Should Be Moved

> **Status**: ✅ **COMPLETE** - All foundational utilities have been moved to shared-core.
> 
> See `docs/monorepo-completion-status.md` for full migration status.
> See `docs/shared-core-reference.md` for complete API documentation.

## ✅ Already Moved to Shared-Core

1. **Authentication & Authorization**
   - ✅ `system-admin-check.ts` - System admin email checking
   - ✅ `clerk-auth-helper.ts` - Clerk authentication helpers
   - ✅ `auth-utils.ts` - Auth utilities
   - ✅ `permissions-middleware.ts` - Permission checking
   - ✅ `user-access-check.ts` - User access validation
   - ✅ `user-management.ts` - User management functions

2. **Database & Core**
   - ✅ `db.ts` - Database connection
   - ✅ `impersonation.ts` - User impersonation
   - ✅ `communication-logging.ts` - Communication logging
   - ✅ `continuum-logger.ts` - Continuum logging

3. **Components**
   - ✅ `access-guard.tsx` - Access control component
   - ✅ `ui/*` - All UI components

4. **Hooks**
   - ✅ `use-permissions.ts` - Permissions hook
   - ✅ `use-safe-user.ts` - Safe user hook

5. **API Routes** (using shared-core imports)
   - ✅ `app/api/auth/check-access/route.ts`
   - ✅ `app/api/access-requests/route.ts`

---

## ✅ All High-Priority Items Completed

### 1. **SMS/Communication Utilities** ✅ COMPLETE
   - ✅ Created: `packages/shared-core/lib/sms-helper.ts`
   - ✅ Twilio client initialization
   - ✅ SMS sending with logging
   - ✅ All API routes updated

### 2. **Email Utilities** ✅ COMPLETE
   - ✅ Created: `packages/shared-core/lib/email-helper.ts`
   - ✅ SendGrid client initialization
   - ✅ Email sending with logging
   - ✅ All API routes updated

### 3. **GPS/Geolocation Utilities** ✅ COMPLETE
   - ✅ Created: `packages/shared-core/lib/geolocation-helper.ts`
   - ✅ `captureLocation()` function
   - ✅ Location validation and error handling
   - ✅ All components updated

### 4. **Route Calculator** ✅ COMPLETE
   - ✅ Moved: `packages/shared-core/lib/route-calculator.ts`
   - ✅ Google Maps route calculation
   - ✅ All imports updated

### 5. **ICS Generator** ✅ COMPLETE
   - ✅ Moved: `packages/shared-core/lib/ics-generator.ts`
   - ✅ Calendar file generation
   - ✅ All imports updated

### 6. **Utils** ✅ COMPLETE
   - ✅ Moved: `packages/shared-core/lib/utils.ts`
   - ✅ `cn()` function (Tailwind class merging)
   - ✅ All components updated (60+ files)

### 7. **Navigation API** ✅ COMPLETE
   - ✅ Updated: `app/api/navigation/route.ts` to use shared-core
   - ✅ Reference copy: `packages/shared-core/app/api/navigation/route.ts`
   - ✅ Uses `getMicroserviceCode()` for dynamic detection

---

## 🔄 Service-Specific (Should Stay in Root)

1. **`lib/microservice-config.ts`** - Service-specific configuration (will be refactored in future phase)
2. **`lib/db-connection-lock.ts`** - Database connection locking (may stay in root)
3. **`lib/db-extensions.ts`** - Service-specific database queries (may stay in root)

**Note**: AI/Speech utilities (`anthropic-helper.ts`, `deepgram-streaming.ts`, `google-speech-helper.ts`, `speech-utils.ts`, `environment.ts`) have been moved to shared-core as they are reusable across microservices.

---

## ✅ All Phases Complete

### Phase 12: Extract Communication Utilities ✅
- ✅ Created `packages/shared-core/lib/sms-helper.ts`
- ✅ Created `packages/shared-core/lib/email-helper.ts`
- ✅ Updated all API routes
- ✅ Tested and verified

### Phase 13: Extract AI & Speech Utilities ✅
- ✅ Moved `lib/anthropic-helper.ts` to shared-core
- ✅ Moved `lib/deepgram-streaming.ts` to shared-core
- ✅ Moved `lib/google-speech-helper.ts` to shared-core
- ✅ Moved `lib/speech-utils.ts` to shared-core
- ✅ Moved `lib/environment.ts` to shared-core
- ✅ Updated all imports

### Phase 14: Extract Location & Route Utilities ✅
- ✅ Created `packages/shared-core/lib/geolocation-helper.ts`
- ✅ Moved `lib/route-calculator.ts` to shared-core
- ✅ Updated all components
- ✅ Tested and verified

### Phase 15: Extract Remaining Utilities ✅
- ✅ Moved `lib/ics-generator.ts` to shared-core
- ✅ Moved `lib/utils.ts` to shared-core
- ✅ Updated all imports (60+ files)
- ✅ Final testing complete

### Phase 16: Navigation API & Final Cleanup ✅
- ✅ Updated `app/api/navigation/route.ts` to use shared-core
- ✅ Created reference copy in shared-core
- ✅ Fixed all remaining imports
- ✅ All build errors resolved

---

## 🎯 Status: COMPLETE

All high, medium, and low priority items have been completed. The monorepo structure is production-ready.

