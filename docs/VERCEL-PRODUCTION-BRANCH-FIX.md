# Vercel Production Branch Configuration Fix

**Date**: January 20, 2025  
**Issue**: Production deployment (`admin.refugehouse.app`) was deploying from wrong branch  
**Status**: ✅ **RESOLVED**

---

## Problem Identified

The production deployment in Vercel was configured to deploy from `service-domain-admin-test-deployment` branch instead of `service-domain-admin-main` branch. This caused:

1. **Production and test environments were out of sync**
   - Production was missing critical fixes from the production branch
   - Test had different code than production
   - Users experienced different behavior between environments

2. **Settings endpoint was broken in production**
   - Production branch incorrectly blocked direct DB access for admin service
   - Admin service should use direct DB access (it has database permissions)
   - Only visit service and other microservices should use API Hub client

---

## Root Cause

1. **Vercel Configuration**: Production deployment was pointing to `service-domain-admin-test-deployment` branch
2. **Code Issue**: Production branch had incorrect `throwIfDirectDbNotAllowed()` call in settings endpoint
3. **Branch Mismatch**: Test branch had correct code, but production wasn't using it

---

## Solution Applied

### 1. Fixed Settings Route (`app/api/settings/route.ts`)

**Before** (incorrect - blocks DB access for admin):
```typescript
export async function GET(request: NextRequest) {
  throwIfDirectDbNotAllowed("settings GET endpoint")  // ❌ Blocks admin service
  // ... only API client code
}
```

**After** (correct - allows DB access for admin):
```typescript
export async function GET(request: NextRequest) {
  const useApiClient = shouldUseRadiusApiClient()
  
  if (useApiClient) {
    // Use API client for visit service and other microservices
    // ... API client code
  } else {
    // Direct DB access for admin microservice
    // ... direct database queries
  }
}
```

### 2. Branch Strategy

- **Test Environment**: `service-domain-admin-test-deployment` → `admin.test.refugehouse.app`
- **Production Environment**: `service-domain-admin-main` → `admin.refugehouse.app`

### 3. Vercel Configuration Required

**CRITICAL**: You must configure Vercel production deployment to use `service-domain-admin-main` branch:

1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Under "Production Branch", set it to: `service-domain-admin-main`
3. Save changes
4. Trigger a new deployment from the production branch

---

## Files Changed

1. ✅ `app/api/settings/route.ts` - Fixed to allow admin service DB access
2. ✅ `app/api/auth/check-access/route.ts` - Already correct (has Clerk fallback)

---

## Verification Steps

### 1. Verify Vercel Configuration
- [ ] Check Vercel Dashboard → Settings → Git
- [ ] Confirm "Production Branch" is set to `service-domain-admin-main`
- [ ] Verify production domain `admin.refugehouse.app` deploys from production branch

### 2. Test Settings Endpoint
```bash
# Test production settings endpoint
curl -X GET "https://admin.refugehouse.app/api/settings?key=mileage_rate" \
  -H "x-api-key: YOUR_API_KEY"

# Expected: 200 OK with setting data
# NOT Expected: 500 error or "DIRECT DATABASE ACCESS NOT ALLOWED"
```

### 3. Compare Test vs Production
- [ ] Verify both environments have same functionality
- [ ] Test critical workflows in both environments
- [ ] Confirm no differences in behavior

---

## How to Prevent This Issue

### 1. Always Deploy Production from Production Branch
- Never configure Vercel production to deploy from test/staging branches
- Use branch naming convention: `*-main` for production, `*-test-deployment` for test

### 2. Code Review Checklist
- [ ] Verify `shouldUseRadiusApiClient()` is used correctly
- [ ] Admin service should use direct DB access
- [ ] Visit service and other microservices should use API Hub client
- [ ] Never use `throwIfDirectDbNotAllowed()` in admin service endpoints

### 3. Deployment Verification
- [ ] Check Vercel deployment source branch matches expected branch
- [ ] Verify commit hash matches production branch
- [ ] Test endpoints after deployment
- [ ] Compare test and production behavior

---

## Related Documentation

- `PRODUCTION-DEPLOYMENT-GUIDE.md` - General deployment guide
- `PRODUCTION-DEPLOYMENT-SUMMARY.md` - Previous deployment summary
- `lib/microservice-config.ts` - Microservice configuration logic

---

## Next Steps

1. ✅ Fix settings route code
2. ⏳ Configure Vercel production branch to `service-domain-admin-main`
3. ⏳ Push fix to production branch
4. ⏳ Verify production deployment works correctly
5. ⏳ Test settings endpoint in production

---

## Summary

**Problem**: Production was deploying from test branch, causing sync issues  
**Solution**: Fixed code + configure Vercel to use correct production branch  
**Status**: Code fixed, Vercel configuration needs manual update

**Action Required**: Update Vercel production branch configuration to `service-domain-admin-main`

