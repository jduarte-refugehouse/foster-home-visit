# API Key Testing Guide

## Quick Start: Testing API Hub Endpoints

### Step 1: Get or Create an API Key

You have **two options** to get an API key:

#### Option A: Use the Admin UI (Easiest)

1. Go to: `https://admin.test.refugehouse.app/admin/apis/keys` (or your admin service URL)
2. Log in with your admin account
3. Click "Create New API Key"
4. Select microservice: `home-visits` (or any microservice code)
5. Add a description (e.g., "Test API Key for ContinuumMark endpoints")
6. Click "Create"
7. **IMPORTANT**: Copy the API key immediately - it's only shown once!
   - Format: `rh_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (starts with `rh_`)

#### Option B: Use the API Endpoint

If you already have an API key or admin access, you can create one via API:

```bash
# Create an API key for the visit service
curl -X POST https://admin.test.refugehouse.app/api/admin/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_COOKIE" \
  -d '{
    "microserviceCode": "home-visits",
    "description": "Test API Key for ContinuumMark endpoints"
  }'
```

**Note**: This requires authentication (Clerk session cookie).

---

### Step 2: Test the Visits Endpoint (GET)

Test that the endpoint is accessible:

```bash
# Replace YOUR_API_KEY with the key you got from Step 1
curl -X GET "https://admin.test.refugehouse.app/api/radius/visits" \
  -H "x-api-key: YOUR_API_KEY"
```

**Expected Response:**
```json
{
  "success": true,
  "visits": [],
  "count": 0,
  "timestamp": "2026-01-03T...",
  "duration_ms": 123
}
```

**If you get "Unauthorized":**
- Check that the API key is correct (starts with `rh_`)
- Make sure there are no extra spaces in the API key
- Verify the API key is active in the database

---

### Step 3: Test the Visits Endpoint (POST)

Create a test visit mark:

```bash
# Replace YOUR_API_KEY with your actual API key
curl -X POST "https://admin.test.refugehouse.app/api/radius/visits" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "markDate": "2026-01-03T10:00:00",
    "markType": "HOME_VISIT",
    "fosterHomeGuid": "00000000-0000-0000-0000-000000000001",
    "fosterHomeName": "Test Home",
    "fosterHomeXref": 123,
    "unit": "DAL",
    "sourceSystem": "VisitService",
    "actorClerkId": "user_test123",
    "actorName": "Test User",
    "actorEmail": "test@example.com",
    "actorUserType": "staff",
    "actorPid": 0,
    "notes": "Test visit mark"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "markId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "message": "Visit mark created successfully",
  "timestamp": "2026-01-03T...",
  "duration_ms": 456
}
```

---

### Step 4: Test the Trips Endpoint (POST)

Create a test trip:

```bash
curl -X POST "https://admin.test.refugehouse.app/api/radius/trips" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "tripDate": "2026-01-03",
    "staffClerkId": "user_test123",
    "staffEmail": "staff@example.com",
    "staffName": "Test Staff",
    "tripPurpose": "Home Visit",
    "originType": "office",
    "originAddress": "123 Main St",
    "destinationType": "foster_home",
    "destinationAddress": "456 Oak Ave",
    "costCenterUnit": "DAL",
    "milesEstimated": 15.5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "tripId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "message": "Trip created successfully",
  "timestamp": "2026-01-03T...",
  "duration_ms": 234
}
```

---

## Using Postman or Similar Tools

### Postman Setup

1. **Create a new request**
   - Method: `GET` or `POST`
   - URL: `https://admin.test.refugehouse.app/api/radius/visits`

2. **Add Headers**
   - Key: `x-api-key`
   - Value: `YOUR_API_KEY` (the full key starting with `rh_`)

3. **For POST requests, add Body**
   - Select: `raw`
   - Format: `JSON`
   - Paste the JSON from the examples above

---

## Troubleshooting

### Error: "Unauthorized"

**Possible causes:**
1. **Missing API key**: Make sure you're sending the `x-api-key` header
2. **Invalid API key**: Check that the key is correct (no typos, no extra spaces)
3. **Inactive key**: The key might be revoked (`is_active = 0`)
4. **Expired key**: The key might have an expiration date that passed

**How to check:**
- Go to `https://admin.test.refugehouse.app/admin/apis/keys`
- Find your API key in the list
- Check that `is_active` is `true`
- Check that `expires_at` is in the future (or `null`)

### Error: "Invalid API key (hash mismatch)"

This means the API key prefix matches but the hash doesn't. This usually means:
- The key was copied incorrectly
- The key was modified
- There's a database issue

**Solution**: Create a new API key and try again.

### Error: "API key is required"

This means the `x-api-key` header is missing or empty.

**Solution**: Make sure you're sending the header:
```bash
-H "x-api-key: YOUR_API_KEY"
```

---

## Finding Your API Key

### If you forgot your API key:

1. **API keys are hashed** - the full key is never stored in the database
2. **You can only see it once** - when it's first created
3. **If you lost it**: You need to create a new one

### To create a new API key:

1. Go to: `https://admin.test.refugehouse.app/admin/apis/keys`
2. Click "Create New API Key"
3. Fill in the form and create
4. **Copy it immediately!**

---

## Example: Complete Test Script

Save this as `test-api-endpoints.sh`:

```bash
#!/bin/bash

# Set your API key here
API_KEY="rh_YOUR_API_KEY_HERE"

# Test GET visits
echo "Testing GET /api/radius/visits..."
curl -X GET "https://admin.test.refugehouse.app/api/radius/visits" \
  -H "x-api-key: $API_KEY" \
  -w "\n\nStatus: %{http_code}\n"

# Test POST visit
echo -e "\n\nTesting POST /api/radius/visits..."
curl -X POST "https://admin.test.refugehouse.app/api/radius/visits" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "markDate": "2026-01-03T10:00:00",
    "markType": "HOME_VISIT",
    "fosterHomeGuid": "00000000-0000-0000-0000-000000000001",
    "fosterHomeName": "Test Home",
    "unit": "DAL",
    "actorClerkId": "user_test123",
    "actorName": "Test User",
    "actorUserType": "staff",
    "actorPid": 0
  }' \
  -w "\n\nStatus: %{http_code}\n"

# Test POST trip
echo -e "\n\nTesting POST /api/radius/trips..."
curl -X POST "https://admin.test.refugehouse.app/api/radius/trips" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "tripDate": "2026-01-03",
    "staffClerkId": "user_test123",
    "staffEmail": "staff@example.com",
    "staffName": "Test Staff",
    "tripPurpose": "Home Visit",
    "originType": "office",
    "destinationType": "foster_home",
    "costCenterUnit": "DAL"
  }' \
  -w "\n\nStatus: %{http_code}\n"
```

**To use:**
1. Edit the script and set `API_KEY` to your actual key
2. Make it executable: `chmod +x test-api-endpoints.sh`
3. Run it: `./test-api-endpoints.sh`

---

## Quick Reference

### Required Header
```
x-api-key: rh_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/radius/visits` | List visits (with optional filters) |
| POST | `/api/radius/visits` | Create a visit mark |
| GET | `/api/radius/trips` | List trips (with optional filters) |
| POST | `/api/radius/trips` | Create a trip |

### Query Parameters (for GET requests)

**Visits:**
- `homeGuid` - Filter by foster home GUID
- `staffGuid` - Filter by staff member GUID
- `startDate` - Filter by start date (ISO format)
- `endDate` - Filter by end date (ISO format)

**Trips:**
- `staffGuid` - Filter by staff member GUID
- `staffClerkId` - Filter by staff Clerk ID
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `relatedMarkId` - Filter by related ContinuumMark ID

---

## Next Steps

Once you've verified the endpoints work:

1. ✅ Test with real data (actual foster home GUIDs, staff GUIDs)
2. ✅ Test from the visit service using the API client
3. ✅ Verify records are created in the database
4. ✅ Check that actor fields are populated correctly

