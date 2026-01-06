# Production Deployment Guide

**Last Updated**: January 6, 2026  
**Version**: 1.0.0  
**Status**: Ready for Production

---

## Quick Start

### Prerequisites
✅ All endpoints tested in staging  
✅ API keys verified in production  
✅ Database migrations complete  
✅ Static IPs removed from visit service  
✅ HomeFolio license integration complete

### Deploy to Production

```bash
# 1. Merge and deploy admin service
cd /path/to/service-domain-admin
git checkout main
git merge service-domain-admin-test-deployment
git push origin main

# 2. Merge and deploy visit service
cd /path/to/foster-home-visit
git checkout main
git merge visit-test-deployment
git push origin main

# 3. Verify deployments
# Visit: https://visit.refugehouse.app
# Admin: https://admin.refugehouse.app
```

---

## Deployment Sequence

### Step 1: Deploy Admin Service First (CRITICAL)
The admin service MUST be deployed before the visit service because:
- Visit service depends on admin service API Hub
- Without admin service, visit service will fail all data operations

```bash
cd service-domain-admin
git checkout main
git pull origin main
git merge service-domain-admin-test-deployment --no-ff
git push origin main
```

**Verify**: Visit https://admin.refugehouse.app/api/radius/visits with API key

---

### Step 2: Verify Admin Service Deployment

**Test API Hub Connectivity**:
```bash
# Test visits endpoint (replace YOUR_API_KEY)
curl -X GET "https://admin.refugehouse.app/api/radius/visits" \
  -H "x-api-key: YOUR_API_KEY"

# Expected: 200 OK with empty or populated visits array
# NOT Expected: 401 Unauthorized, 404 Not Found, 500 Error
```

**Test HomeFolio Integration**:
```bash
# Test prepopulation endpoint with known home GUID
curl -X GET "https://admin.refugehouse.app/api/radius/homes/YOUR_HOME_GUID/prepopulate" \
  -H "x-api-key: YOUR_API_KEY"

# Expected: 200 OK with home, license, household, placements data
```

**Check Deployment Logs**:
- Vercel Dashboard → admin-refugehouse-app → Deployments
- View latest deployment logs
- Verify no build errors
- Confirm all routes deployed

---

### Step 3: Deploy Visit Service

Only proceed if admin service is verified working.

```bash
cd foster-home-visit
git checkout main
git pull origin main
git merge visit-test-deployment --no-ff
git push origin main
```

**Verify**: Visit https://visit.refugehouse.app and test login

---

### Step 4: Verify Visit Service Deployment

**Test Login Flow**:
1. Navigate to https://visit.refugehouse.app
2. Click "Sign In"
3. Authenticate with Clerk
4. Verify dashboard loads (not stuck on "Checking access...")
5. Confirm navigation loads

**Test Key Workflows**:
1. **View Calendar**: Appointments should display
2. **Create Appointment**: Select home, create appointment
3. **View Appointment**: Click appointment, verify form loads
4. **Save Visit Form**: Enter data, click save
5. **Complete Visit**: Mark visit as completed
6. **View Map**: Homes should display on map

**Check Browser Console**:
- Should see: `✅ [VISIT-SERVICE]` logs
- Should NOT see: `❌ DIRECT DATABASE ACCESS NOT ALLOWED`
- Should NOT see: 500 errors on API calls

---

### Step 5: Remove Static IPs (If Not Already Removed)

**ONLY AFTER** both services are verified working:

1. **Vercel Dashboard** → visit-refugehouse-app
2. **Settings** → **General**
3. Scroll to **Deployment Protection**
4. Find **IP Access Rules**
5. Remove static IP entries
6. Save

**Note**: This is permanent. Visit service will no longer have database access.

---

## Environment Variables Checklist

### Admin Service (admin.refugehouse.app)
```env
# Required
DATABASE_SERVER=radius-bifrost-server.database.windows.net
DATABASE_NAME=radiusbifrost
DATABASE_USER=admin-service
DATABASE_PASSWORD_ENCRYPTED=<from Azure Key Vault>
AZURE_KEY_VAULT_NAME=refugehouse-keys
RADIUS_API_KEY=rh_...

# Optional
ADMIN_SERVICE_URL=https://admin.refugehouse.app
VISIT_SERVICE_URL=https://visit.refugehouse.app
NEXT_PUBLIC_ADMIN_SERVICE_URL=https://admin.refugehouse.app
```

### Visit Service (visit.refugehouse.app)
```env
# Required
RADIUS_API_KEY=rh_...
RADIUS_API_HUB_URL=https://admin.refugehouse.app
PULSE_APP_API_KEY=<pulse-api-key>
PULSE_ENVIRONMENT_URL=https://pulse.refugehouse.org

# Clerk (Identity Only)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Optional
NEXT_PUBLIC_ADMIN_SERVICE_URL=https://admin.refugehouse.app
```

### Verify Environment Variables
```bash
# In Vercel Dashboard for each project:
# Settings → Environment Variables
# Confirm all required variables are set for Production environment
```

---

## Post-Deployment Verification

### Critical Path Testing (30 minutes)

#### Test 1: Authentication ✅
1. Visit https://visit.refugehouse.app
2. Sign in with Clerk
3. Verify dashboard loads with your name
4. Check navigation displays correctly

**Expected**: Login successful, dashboard displays  
**If Failed**: Check `/api/auth/check-access` and `/api/navigation` logs

---

#### Test 2: Appointment Creation ✅
1. Navigate to calendar
2. Click "Schedule Appointment"
3. Select home from dropdown
4. Fill in details
5. Save appointment

**Expected**: Appointment created, appears on calendar  
**If Failed**: Check `/api/appointments` logs in visit service

---

#### Test 3: Home Prepopulation ✅
1. Click on appointment
2. Verify home information displays
3. Check "Home Logistics" section
4. Check "License & Regulatory Information" section
5. Check household members display

**Expected**: All sections populate with data  
**If Failed**: Check `/api/homes/:guid/prepopulate` in visit service and admin service

---

#### Test 4: Visit Form Save ✅
1. Enter data in visit form
2. Click "Save Draft"
3. Reload page
4. Verify data persists

**Expected**: Data saves and reloads correctly  
**If Failed**: Check `/api/visit-forms` logs

---

#### Test 5: Visit Completion ✅
1. Complete all required fields
2. Click "Mark Visit as Completed"
3. Verify status changes
4. Check ContinuumMark was created

**Expected**: Visit marked complete, ContinuumMark created  
**If Failed**: Check `/api/visit-forms/:id` and `/api/radius/visits` logs

---

#### Test 6: Settings Load ✅
1. Navigate to settings (if accessible)
2. Verify mileage rate displays
3. Try updating a setting

**Expected**: Settings load and update correctly  
**If Failed**: Check `/api/settings` logs

---

### Full Regression Testing (2 hours)

See **TESTING-CHECKLIST.md** for comprehensive test suite.

---

## Monitoring & Logging

### Where to Check Logs

**Vercel Dashboard**:
1. Go to project (admin or visit)
2. Click "Logs" tab
3. Filter by environment: Production
4. Search for errors

**Key Log Patterns**:
```
✅ [SERVICE-NAME] - Success logs
❌ [SERVICE-NAME] - Error logs
⚠️ [SERVICE-NAME] - Warning logs
🔍 [SERVICE-NAME] - Debug logs
```

### Important Logs to Monitor

**Visit Service**:
- `[VISIT-SERVICE] Calling API Hub` - API client requests
- `[VISIT-SERVICE] ERROR` - Error conditions
- `DIRECT DATABASE ACCESS NOT ALLOWED` - Should NEVER appear

**Admin Service**:
- `[ADMIN-SERVICE] Prepopulation Endpoint Called` - Prepopulation requests
- `[ADMIN-SERVICE] Query` - Database queries
- `[ADMIN-SERVICE] ERROR` - Error conditions

**API Client**:
- `[API-CLIENT] Request:` - Outgoing API requests
- `[API-CLIENT] Response:` - API responses
- `[API-CLIENT] API REQUEST FAILED` - Failed requests

---

## Rollback Plan

If production deployment fails:

### Step 1: Identify Failing Service
- Visit service failing? Rollback visit service
- Admin service failing? Rollback both (visit depends on admin)

### Step 2: Rollback Git Commits

```bash
# Rollback admin service
cd service-domain-admin
git checkout main
git revert HEAD  # Or git reset --hard <previous-commit>
git push origin main

# Rollback visit service
cd foster-home-visit
git checkout main
git revert HEAD
git push origin main
```

### Step 3: Re-enable Static IPs (If Needed)

If visit service needs emergency database access:
1. Vercel Dashboard → visit-refugehouse-app
2. Settings → Deployment Protection
3. Add static IPs back
4. Deploy with database credentials

---

## Troubleshooting Common Issues

### Issue: "Account Registration Required"

**Symptoms**: User can't access app after Clerk login  
**Cause**: User not in `app_users` table or API Hub unreachable

**Fix**:
1. Check `/api/auth/check-access` logs
2. Verify API Hub is responding
3. Verify API key is correct
4. Check user exists in `app_users` table

---

### Issue: Dashboard Stuck on "Checking access..."

**Symptoms**: Dashboard never loads, spinner forever  
**Cause**: `/api/navigation` request hanging or failing

**Fix**:
1. Check browser console for errors
2. Check `/api/navigation` logs
3. Verify API Hub is responding
4. Check for timeout errors (should timeout after 30s)

---

### Issue: 500 Errors on All API Calls

**Symptoms**: All data operations fail with 500  
**Cause**: Admin service down or API key invalid

**Fix**:
1. Verify admin service is deployed and running
2. Test API Hub directly with `curl`
3. Verify `RADIUS_API_KEY` matches in both services
4. Check admin service logs for errors

---

### Issue: Prepopulation Data Missing

**Symptoms**: Home information doesn't load, license blank  
**Cause**: HomeFolio query failing or no current record

**Fix**:
1. Check `/api/radius/homes/:guid/prepopulate` logs in admin service
2. Verify home has HomeFolio record with `isCurrent = 1`
3. Check JSON parsing errors
4. Verify home GUID is correct

---

### Issue: Placement History Empty

**Symptoms**: "Missing 1 field(s): Placement History"  
**Cause**: Pulse app API not returning records or query filter too restrictive

**Fix**:
1. Verify `PULSE_ENVIRONMENT_URL` points to correct Pulse instance
2. Verify `PULSE_APP_API_KEY` is valid
3. Check Pulse app logs for `/api/placement-history` requests
4. Verify date range logic (last 6 months)

---

## Success Criteria

✅ **Authentication**: Users can log in without errors  
✅ **Navigation**: Menu loads correctly  
✅ **Appointments**: Can create, view, edit appointments  
✅ **Visit Forms**: Can save and complete visits  
✅ **ContinuumMarks**: Created on visit completion  
✅ **Prepopulation**: Home data loads correctly  
✅ **License Data**: Displays from HomeFolio (not syncLicenseCurrent)  
✅ **T3C Credentials**: Shows when applicable  
✅ **No Database Errors**: No "DIRECT DATABASE ACCESS" errors  
✅ **Performance**: Pages load in <3 seconds  

---

## Post-Deployment Tasks

### Immediate (Today)
- [ ] Monitor logs for errors (first 2 hours)
- [ ] Test critical paths with real users
- [ ] Verify no performance degradation
- [ ] Check error rates in Vercel dashboard

### Next 24 Hours
- [ ] Full regression testing
- [ ] Monitor API Hub load
- [ ] Check for any edge cases
- [ ] Verify all workflows
- [ ] Document any issues

### Next Week
- [ ] Analyze API usage patterns
- [ ] Identify optimization opportunities
- [ ] Plan performance improvements
- [ ] Review error logs for patterns

---

## Support Contacts

**For Production Issues**:
- Email: tech@refugehouse.org
- Slack: #tech-support

**For Deployment Issues**:
- Check Vercel dashboard first
- Review this guide
- Check logs for specific errors
- Reference LESSONS-LEARNED-API-MIGRATION.md

---

## Related Documentation

- **LESSONS-LEARNED-API-MIGRATION.md** - Detailed lessons from migration
- **DAILY-SUMMARY-2026-01-05-06.md** - Complete summary of changes
- **API-KEY-TESTING-GUIDE.md** - How to test with API keys
- **DEPLOYMENT-CHECKLIST.md** - Original deployment checklist
- **USER-IDENTITY-ARCHITECTURE.md** - User authentication architecture

---

## Version History

**v1.0.0** (2026-01-06)
- Initial production deployment guide
- Includes HomeFolio integration
- Complete API Hub migration
- Static IP removal process

---

**Status**: ✅ Ready for Production Deployment

This guide will be updated after production deployment with any lessons learned.

