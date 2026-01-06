# Admin Service Deployment - Missing API Hub Endpoints

## Issue

**Current Problem:** Users can SAVE visit forms but cannot LOAD prepopulation data.

The visit service is getting 404/500 errors when calling:
- `/api/radius/settings?key=mileage_rate` - Needed for mileage rate and other settings
- `/api/radius/homes/[homeGuid]/prepopulate` - **CRITICAL**: Needed to load home data, household members, children in placement, and previous visit data into the form

**Why saving works but loading doesn't:**
- ✅ **SAVE works** - Saving doesn't require prepopulation data, users can manually enter data
- ❌ **LOAD fails** - Loading requires prepopulation data to populate form fields with home information

These endpoints exist in the visit service codebase but **must be deployed to the admin service** for them to work.

## Required Files for Admin Service Deployment

Copy these files from the visit service to the admin service:

1. **`app/api/radius/settings/route.ts`**
   - Handles GET (fetch settings) and PUT (update settings)
   - Requires API key authentication

2. **`app/api/radius/homes/[homeGuid]/prepopulate/route.ts`**
   - Handles GET (fetch home prepopulation data)
   - Requires API key authentication

## Deployment Steps

1. **Copy the files to admin service repository:**
   ```bash
   # In admin service repository
   # Copy from visit service:
   # - app/api/radius/settings/route.ts
   # - app/api/radius/homes/[homeGuid]/prepopulate/route.ts
   ```

2. **Verify dependencies:**
   - Ensure `@/lib/api-auth` exists (for `validateApiKey`)
   - Ensure `@refugehouse/shared-core/db` is available (for `query`)

3. **Deploy to admin service:**
   ```bash
   git add app/api/radius/settings/route.ts
   git add app/api/radius/homes/\[homeGuid\]/prepopulate/route.ts
   git commit -m "Add settings and home prepopulation API Hub endpoints"
   git push origin [your-test-branch]
   ```

4. **Verify deployment:**
   - Test with API key:
     ```bash
     curl -X GET "https://admin.test.refugehouse.app/api/radius/settings?key=mileage_rate" \
       -H "x-api-key: YOUR_API_KEY"
     
     curl -X GET "https://admin.test.refugehouse.app/api/radius/homes/13C47EAE-8631-47E3-8179-E3C4D02D306E/prepopulate" \
       -H "x-api-key: YOUR_API_KEY"
     ```

## Current Status

- ✅ Endpoints created in visit service codebase (`app/api/radius/` directory)
- ❌ Endpoints NOT yet deployed to admin service
- ❌ Visit service calls failing with 404/500 errors
- ⚠️ **Users can save forms but cannot load prepopulation data**

## Next Steps

1. Deploy these endpoints to admin service
2. Verify they work with API key authentication
3. Visit service should then work correctly

