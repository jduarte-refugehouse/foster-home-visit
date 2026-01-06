# Visit Service Upgrade - Deployment Checklist

**Date:** 2026-01-03  
**Status:** Ready for Testing

---

## ✅ What's Already Done

1. ✅ Database schema updated (migrations already applied)
2. ✅ `lib/identity-resolver.ts` created
3. ✅ API Hub endpoints created (`/api/radius/visits`, `/api/radius/trips`)
4. ✅ Radius API client updated with new methods

---

## 🚀 Deployment Steps

### Step 1: Deploy Admin Service (admin.test.refugehouse.app)

**Files to deploy:**
- `app/api/radius/visits/route.ts` (NEW)
- `app/api/radius/trips/route.ts` (NEW)

**What this does:**
- Creates API Hub endpoints that other microservices call
- These endpoints create ContinuumMark records in RadiusBifrost
- Requires API key authentication

**Deployment:**
```bash
# In admin service repository
git add app/api/radius/visits/route.ts
git add app/api/radius/trips/route.ts
git commit -m "Add visits and trips API Hub endpoints"
git push origin main  # or your test branch
```

**Verify after deployment:**
- Check that endpoints are accessible at:
  - `https://admin.test.refugehouse.app/api/radius/visits`
  - `https://admin.test.refugehouse.app/api/radius/trips`
- Test with API key authentication

---

### Step 2: Deploy Visit Service (visit.test.refugehouse.app)

**Files to deploy:**
- `lib/identity-resolver.ts` (NEW)
- `packages/radius-api-client/client.ts` (UPDATED)
- `packages/radius-api-client/types.ts` (UPDATED)

**What this does:**
- Adds identity resolution for dual-source actor pattern
- Adds API client methods to call the admin service endpoints
- **Does NOT break existing functionality** - all changes are additive

**Deployment:**
```bash
# In visit service repository
git add lib/identity-resolver.ts
git add packages/radius-api-client/client.ts
git add packages/radius-api-client/types.ts
git commit -m "Add identity resolver and ContinuumMark API client methods"
git push origin main  # or your test branch
```

**Verify after deployment:**
- Check that identity resolver can be imported
- Check that API client methods are available

---

## 🧪 Testing Steps

### Test 1: Identity Resolver

Create a test endpoint or use existing code to test:

```typescript
import { resolveUserIdentity, getActorFields } from "@/lib/identity-resolver"

// Test with a real Clerk user ID
const identity = await resolveUserIdentity("user_xxxxx")
console.log("Identity:", identity)
console.log("Actor fields:", getActorFields(identity))
```

**Expected results:**
- Staff users: `radiusGuid` populated, `pid` and `unit` set
- Foster parents: `radiusGuid` = `entityGuid` (same value)
- Third-party: `entityGuid` populated via `commBridgeId`

---

### Test 2: API Hub Endpoints (from Admin Service)

Test the new endpoints directly:

```bash
# Test POST /api/radius/visits
curl -X POST https://admin.test.refugehouse.app/api/radius/visits \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "markDate": "2026-01-03T10:00:00",
    "markType": "HOME_VISIT",
    "fosterHomeGuid": "some-guid",
    "fosterHomeName": "Test Home",
    "unit": "DAL",
    "actorClerkId": "user_xxxxx",
    "actorName": "Test User",
    "actorUserType": "staff"
  }'
```

**Expected result:** Returns `{ success: true, markId: "..." }`

---

### Test 3: API Client (from Visit Service)

Test that the visit service can call the admin service:

```typescript
import { radiusApiClient } from "@refugehouse/radius-api-client"
import { resolveUserIdentity, getActorFields } from "@/lib/identity-resolver"

// Resolve user identity
const identity = await resolveUserIdentity("user_xxxxx")
const actorFields = getActorFields(identity)

// Create visit via API Hub
const result = await radiusApiClient.createVisit({
  markDate: "2026-01-03T10:00:00",
  markType: "HOME_VISIT",
  fosterHomeGuid: "some-guid",
  fosterHomeName: "Test Home",
  unit: identity.unit || "DAL",
  ...actorFields
})

console.log("Created mark:", result.markId)
```

---

## 📋 What Happens Next (Optional - Not Required for Initial Deployment)

These are **future enhancements** - you don't need to do them now:

### Phase 2: Update Visit Forms Endpoint (Optional)

Update `app/api/visit-forms/route.ts` to:
1. Use identity resolver when creating visit forms
2. Optionally create ContinuumMark records via API Hub
3. Store actor GUID fields in `visit_forms` table

**This is optional** - existing visit forms will continue to work without this.

### Phase 3: Update Appointments Endpoint (Optional)

Update `app/api/appointments/route.ts` to:
1. Use identity resolver
2. Store `actor_radius_guid`, `actor_entity_guid`, `actor_user_type` in appointments table
3. Store `assigned_to_radius_guid` instead of `assigned_to_user_id`

**This is optional** - existing appointments will continue to work.

### Phase 4: Migrate Continuum Entries (Optional)

Update `app/api/continuum/entries/route.ts` to:
1. Use ContinuumMark table instead of local `continuum_entries` table
2. Route through API Hub

**This is optional** - existing continuum entries will continue to work.

---

## ❓ FAQ

### Q: Do I need to convert existing data?

**A: No.** The new columns are nullable, so:
- Existing records continue to work
- New records will populate the new fields
- You can backfill old records later if needed (separate script)

### Q: Will existing functionality break?

**A: No.** All changes are:
- Additive (new files, new methods)
- Backward-compatible (nullable columns)
- Optional (you can use new features when ready)

### Q: What if I only deploy one service?

**A:**
- If you only deploy admin service: New API endpoints will be available, but visit service won't use them yet
- If you only deploy visit service: Identity resolver will be available, but API client calls will fail until admin service is deployed

**Recommendation:** Deploy both services together for full functionality.

### Q: How do I know if it's working?

**A:** Check:
1. ✅ Identity resolver returns correct GUIDs for test users
2. ✅ API Hub endpoints respond with 201 (created) or 200 (success)
3. ✅ API client methods don't throw errors
4. ✅ New ContinuumMark records appear in database with correct actor fields

---

## 🔍 Verification Queries

After deployment, run these SQL queries to verify:

```sql
-- Check that new ContinuumMark records have actor fields
SELECT TOP 10
  MarkID, MarkDate, MarkType, SourceSystem,
  ActorClerkId, ActorRadiusGuid, ActorEntityGuid, ActorName, ActorUserType,
  ActorPID
FROM ContinuumMark
WHERE SourceSystem = 'VisitService'
ORDER BY CreatedAt DESC

-- Check that MarkSubject records are created
SELECT TOP 10
  ms.MarkSubjectID, ms.MarkID, ms.EntityGUID, ms.EntityType, ms.SubjectRole,
  cm.MarkDate, cm.ActorName
FROM MarkSubject ms
INNER JOIN ContinuumMark cm ON ms.MarkID = cm.MarkID
WHERE cm.SourceSystem = 'VisitService'
ORDER BY cm.CreatedAt DESC

-- Check that Trips records are created
SELECT TOP 10
  TripID, TripDate, StaffClerkId, StaffRadiusGuid, StaffName,
  RelatedMarkID
FROM Trips
WHERE IsDeleted = 0
ORDER BY TripDate DESC
```

---

## 📝 Notes

- **Database schema is already updated** - no migrations needed
- **All new code is backward-compatible** - existing functionality continues to work
- **You can deploy incrementally** - test each piece separately
- **No data conversion required** - existing records work as-is

---

## 🆘 Troubleshooting

### Error: "API key is required"
- Make sure `RADIUS_API_KEY` environment variable is set in visit service
- Verify API key exists in `api_keys` table in database

### Error: "User not found in app_users"
- Make sure the Clerk user ID exists in `app_users` table
- Check that `is_active = 1` for the user

### Error: "ActorPID is NOT NULL"
- The code should handle this by setting `ActorPID = 0` for web-only users
- If you see this error, check that the code is using `actorPid || 0`

### API calls failing
- Check that admin service is deployed and accessible
- Verify API key is correct
- Check network connectivity between services

