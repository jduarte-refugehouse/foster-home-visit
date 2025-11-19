# Shared-Core Audit: What Should Be Moved

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

## ❌ Still in Root (Should Be Moved)

### 1. **SMS/Communication Utilities** ⚠️ HIGH PRIORITY
   - **Current State**: SMS functionality is scattered across API routes
   - **Should Create**: `packages/shared-core/lib/sms-helper.ts`
   - **Functions to Extract**:
     - Twilio client initialization
     - SMS sending with logging
     - Phone number validation
   - **Files Using**: Multiple API routes (send-link, signature-tokens, bulk-sms, etc.)

### 2. **Email Utilities** ⚠️ HIGH PRIORITY
   - **Current State**: Email functionality is scattered across API routes
   - **Should Create**: `packages/shared-core/lib/email-helper.ts`
   - **Functions to Extract**:
     - SendGrid client initialization
     - Email sending with logging
     - Email template generation
   - **Files Using**: Multiple API routes (visit-forms/email, send-report, etc.)

### 3. **GPS/Geolocation Utilities** ⚠️ MEDIUM PRIORITY
   - **Current State**: GPS capture is inline in components
   - **Should Create**: `packages/shared-core/lib/geolocation-helper.ts`
   - **Functions to Extract**:
     - `captureLocation()` - Browser geolocation wrapper
     - Location validation
     - Error handling for GPS
   - **Files Using**: `app/(protected)/appointment/[id]/page.tsx`, `app/(protected)/mobile/appointment/[id]/page.tsx`

### 4. **Route Calculator** ⚠️ MEDIUM PRIORITY
   - **Current State**: `lib/route-calculator.ts` - Google Maps route calculation
   - **Should Move**: `packages/shared-core/lib/route-calculator.ts`
   - **Used By**: Travel legs, mileage calculation
   - **Note**: Uses Google Maps API - shared functionality

### 5. **ICS Generator** ⚠️ LOW PRIORITY
   - **Current State**: `lib/ics-generator.ts` - Calendar file generation
   - **Should Move**: `packages/shared-core/lib/ics-generator.ts`
   - **Used By**: On-call schedule exports
   - **Note**: Generic calendar functionality

### 6. **Utils** ⚠️ LOW PRIORITY
   - **Current State**: `lib/utils.ts` - `cn()` function (Tailwind class merging)
   - **Should Move**: `packages/shared-core/lib/utils.ts`
   - **Used By**: Many components
   - **Note**: Very common utility

### 7. **Navigation API** ⚠️ HIGH PRIORITY
   - **Current State**: `app/api/navigation/route.ts` - Loads navigation from database
   - **Should Move**: `packages/shared-core/app/api/navigation/route.ts`
   - **Note**: This is core functionality used by all microservices
   - **Dependencies**: Uses shared-core modules already

### 8. **Navigation Management API** ⚠️ MEDIUM PRIORITY
   - **Current State**: `app/api/admin/navigation-items/route.ts` - CRUD for navigation
   - **Should Move**: `packages/shared-core/app/api/admin/navigation-items/route.ts`
   - **Note**: Admin functionality for managing navigation

---

## 🔄 Service-Specific (Should Stay in Root)

1. **`lib/microservice-config.ts`** - Service-specific configuration
2. **`lib/db-extensions.ts`** - Service-specific database queries
3. **`lib/anthropic-helper.ts`** - AI/LLM helpers (may be service-specific)
4. **`lib/deepgram-streaming.ts`** - Speech-to-text (may be service-specific)
5. **`lib/google-speech-helper.ts`** - Speech-to-text (may be service-specific)
6. **`lib/speech-utils.ts`** - Speech utilities (may be service-specific)
7. **`lib/environment.ts`** - Environment checks (v0 preview detection - service-specific)

---

## 📋 Recommended Next Steps

### Phase 12: Extract Communication Utilities
1. Create `packages/shared-core/lib/sms-helper.ts`
2. Create `packages/shared-core/lib/email-helper.ts`
3. Update all API routes to use shared helpers
4. Test SMS and email functionality

### Phase 13: Extract Location & Route Utilities
1. Create `packages/shared-core/lib/geolocation-helper.ts`
2. Move `lib/route-calculator.ts` to shared-core
3. Update components to use shared helpers
4. Test GPS capture and route calculation

### Phase 14: Extract Navigation API
1. Move `app/api/navigation/route.ts` to shared-core
2. Move `app/api/admin/navigation-items/route.ts` to shared-core
3. Update route references
4. Test navigation functionality

### Phase 15: Extract Remaining Utilities
1. Move `lib/ics-generator.ts` to shared-core
2. Move `lib/utils.ts` to shared-core
3. Update all imports
4. Final testing

---

## 🎯 Priority Order

1. **HIGH**: SMS helper, Email helper, Navigation API
2. **MEDIUM**: GPS helper, Route calculator, Navigation management API
3. **LOW**: ICS generator, Utils

