# Lessons Learned: API Hub Migration & Direct Database Access Removal

**Date**: January 5-6, 2026  
**Scope**: Migration from direct database access to API Hub pattern for visit.refugehouse.app

---

## Executive Summary

Successfully migrated the visit service from direct database access to an API Hub pattern, where `admin.refugehouse.app` serves as the central data access point. This enables removal of static IP requirements and improves security, scalability, and maintainability.

---

## Key Architectural Decisions

### 1. API Hub Pattern
**Decision**: Use `admin.refugehouse.app` as the single source of truth for all database operations.

**Rationale**:
- Centralized data access control
- Single point for database connection management
- Enables removal of static IPs from non-admin microservices
- Simplifies security auditing

**Implementation**:
- Admin service: Direct database access allowed
- Visit service: Must use API client for all data operations
- Authentication: API key-based server-to-server communication

---

## Critical Lessons Learned

### Lesson 1: Never Mix Direct DB and API Client Code Paths

**Problem**: Initially, endpoints had fallback logic:
```typescript
if (useApiClient) {
  // Call API Hub
} else {
  // Direct database query
}
```

**Issue**: After removing static IPs, the `else` block would execute and fail silently or with confusing errors.

**Solution**: 
- Remove ALL fallback logic from non-admin services
- Use `throwIfDirectDbNotAllowed(endpointName)` to explicitly prevent direct DB access
- Return clear error messages when API Hub is unavailable

**Code Example**:
```typescript
// ❌ BAD - Has fallback
if (useApiClient) {
  return await apiClient.getData()
} else {
  return await query("SELECT...") // Will fail without static IP!
}

// ✅ GOOD - API only
throwIfDirectDbNotAllowed("endpoint name")
return await apiClient.getData()
```

---

### Lesson 2: Column Name Mismatches Are Silent Killers

**Problem**: Queries failed with "Invalid column name" errors because:
- `Address1`/`Address2` don't exist (correct: `Street`)
- `County` doesn't exist in `SyncActiveHomes`
- `RespiteOnly` doesn't exist in `syncLicenseCurrent`

**Root Cause**: Assumed column names instead of verifying against actual schema.

**Solution**:
- Always check existing working queries for correct column names
- Use schema documentation or `SELECT TOP 1` to verify columns
- Test queries in SSMS before deploying

**Prevention**:
```typescript
// Document expected columns
const homeQuery = `
  SELECT 
    HomeName,      -- Correct: HomeName (not Name)
    Street,        -- Correct: Street (not Address1)
    City, State, Zip  -- No County column exists
  FROM SyncActiveHomes
`
```

---

### Lesson 3: Safeguards Need Careful Placement

**Problem**: `throwIfDirectDbNotAllowed()` was called unconditionally at function start, blocking endpoints that only used API client.

**Issue**: Function threw error before any API calls could be made.

**Solution**:
- Only call `throwIfDirectDbNotAllowed()` when attempting direct database access
- For API-only endpoints, the safeguard isn't needed (no `query()` calls to protect against)

**Example**:
```typescript
// ❌ BAD - Blocks even API client usage
export async function GET() {
  throwIfDirectDbNotAllowed("endpoint") // Throws immediately!
  return await apiClient.getData() // Never reached
}

// ✅ GOOD - Only protect actual DB access
export async function GET() {
  // No safeguard needed - we never call query()
  return await apiClient.getData()
}
```

---

### Lesson 4: HomeFolio Is the Source of Truth for License Data

**Problem**: Querying `syncLicenseCurrent` returned outdated Radius data, not current T3C credentials.

**Root Cause**: `syncLicenseCurrent` is synced FROM Radius, which doesn't have T3C data. Current license info is maintained in `HomeFolio.folioJSON`.

**Solution**:
```sql
-- Query HomeFolio (current record only)
SELECT folioJSON FROM HomeFolio 
WHERE homeGUID = @guid AND isCurrent = 1
```

**Data Extraction Logic**:
1. Parse `folioData.license` (main home study)
2. Check `folioData.addenda` for updates (most recent overrides main)
3. Filter out T3C addenda when looking for license updates
4. Extract T3C credentials separately from T3C addenda
5. Combine into final license object with proper status

**Key Fields**:
- `license.verification` → "Full" or "Pending"
- `license.foster` → If false, home is respite-only
- `license.levels` → Service levels approved
- `license.totalCapacity` / `license.placementCapacity` → Capacity

---

### Lesson 5: Clerk Is ONLY for Identity Verification

**Problem**: Attempted to use Clerk middleware for permissions and user data.

**Issue**: Clerk doesn't store permissions - that's in `app_users` table.

**Solution**:
- Clerk: Get `userId` from session (identity verification only)
- API Hub: Lookup user in `app_users` for permissions, roles, navigation
- Never call Clerk APIs in middleware
- Use `currentUser()` from `@clerk/nextjs/server` (reads session cookies)

**Flow**:
```typescript
// 1. Get Clerk user ID from session
const user = await currentUser()
const clerkUserId = user.id

// 2. Lookup user via API Hub
const userData = await apiClient.lookupUser(clerkUserId)

// 3. Use userData for permissions (NOT Clerk)
```

---

### Lesson 6: External Service Integration Requires Careful Environment Handling

**Problem**: Placement history from Pulse app required proper environment detection.

**Solution**:
- Use `PULSE_ENVIRONMENT_URL` env var to point to correct Pulse instance
- Use `PULSE_APP_API_KEY` for authentication
- Allow server-to-server calls via `x-internal-service` header
- Verify API keys in Azure Portal → App Service → Configuration

**Server-to-Server Pattern**:
```typescript
// Admin service calling visit service
const response = await fetch(visitServiceUrl + endpoint, {
  headers: {
    'x-api-key': process.env.RADIUS_API_KEY,
    'x-internal-service': 'admin-service',
    'Content-Type': 'application/json'
  }
})
```

---

### Lesson 7: API Client Timeouts Are Essential

**Problem**: Endpoints hung indefinitely when API Hub was slow or unresponsive.

**Solution**: Add 30-second timeout to all API requests:
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30000)

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ... other options
  })
  clearTimeout(timeoutId)
} catch (error) {
  clearTimeout(timeoutId)
  if (error.name === 'AbortError') {
    throw new Error('API request timed out after 30 seconds')
  }
  throw error
}
```

Also set `maxDuration` in API routes:
```typescript
export const maxDuration = 60 // Vercel function timeout
```

---

### Lesson 8: Error Messages Must Be Actionable

**Problem**: Generic "500 Internal Server Error" messages didn't help diagnose issues.

**Solution**: Return structured error responses with:
- Exact endpoint called
- Request parameters
- Error type and message
- Troubleshooting suggestions
- Raw response (truncated)

**Example**:
```typescript
return NextResponse.json({
  success: false,
  error: "Failed to fetch prepopulation data",
  details: error.message,
  endpoint: fullUrl,
  homeGuid: homeGuid,
  troubleshooting: {
    step: "Step 4: Fetch prepopulation data",
    endpointCalled: fullUrl,
    suggestions: [
      "Verify admin service is deployed",
      "Check API key is valid",
      "Verify homeGuid exists in database"
    ]
  }
}, { status: 500 })
```

---

### Lesson 9: Logging Is Your Best Friend

**Problem**: Couldn't diagnose issues without visibility into request flow.

**Solution**: Add comprehensive logging at each layer:
```typescript
// Visit service endpoint
console.log(`🔍 [VISIT-SERVICE] Calling API Hub: ${url}`)

// API client
console.log(`🌐 [API-CLIENT] Request: ${method} ${endpoint}`)

// Admin service endpoint
console.log(`📋 [ADMIN-SERVICE] Query: ${query}`)
```

**Logging Standards**:
- Use emojis for visual scanning
- Include service identifier in every log
- Log request start, success, and errors
- Never log secrets (API keys, passwords)

---

### Lesson 10: Test Pages Are Invaluable for Debugging

**Problem**: Hard to diagnose multi-step API flows from production errors.

**Solution**: Create diagnostic test pages (e.g., `/test-prepopulation`) that:
- Show each step visually
- Display success/failure for each step
- Show request details and responses
- Provide actionable error messages

**Benefits**:
- Quickly identify which step fails
- See exact data being passed
- Verify API connectivity
- Debug in real-time

---

## Migration Checklist (For Future Migrations)

### Phase 1: Preparation
- [ ] Identify all direct database queries in target service
- [ ] Document all database tables and columns used
- [ ] Verify column names against actual schema
- [ ] Create API Hub endpoints in admin service
- [ ] Add methods to API client package
- [ ] Add comprehensive logging

### Phase 2: Implementation
- [ ] Update microservice endpoints to use API client
- [ ] Remove ALL fallback logic to direct database
- [ ] Add `throwIfDirectDbNotAllowed()` guards (if needed)
- [ ] Update error messages with troubleshooting info
- [ ] Add timeouts to API requests
- [ ] Test with API keys in development

### Phase 3: Testing
- [ ] Create test pages for complex flows
- [ ] Test all endpoints with API Hub
- [ ] Verify error handling
- [ ] Test with invalid API keys
- [ ] Test with slow/unavailable API Hub
- [ ] Load test if needed

### Phase 4: Deployment
- [ ] Deploy admin service with API Hub endpoints
- [ ] Deploy microservice with API client integration
- [ ] Verify API keys in production environment
- [ ] Remove static IPs from microservice
- [ ] Monitor logs for errors
- [ ] Have rollback plan ready

---

## API Hub Pattern: Best Practices

### 1. Endpoint Design
```typescript
// ✅ GOOD: RESTful, descriptive
GET  /api/radius/homes/:guid/prepopulate
POST /api/radius/visits
GET  /api/radius/appointments?startDate=...

// ❌ BAD: Generic, unclear
GET  /api/data?type=home&action=prepop
POST /api/create
```

### 2. Authentication
```typescript
// ✅ GOOD: API key in header
headers: { 'x-api-key': API_KEY }

// ❌ BAD: API key in URL
fetch(`/api/data?apiKey=${KEY}`) // Logs, URL history
```

### 3. Error Handling
```typescript
// ✅ GOOD: Structured, actionable
{
  success: false,
  error: "Home not found",
  details: "No record with GUID abc-123",
  troubleshooting: ["Verify GUID", "Check if home is active"]
}

// ❌ BAD: Generic, unhelpful
{ error: "Internal server error" }
```

### 4. API Client Design
```typescript
// ✅ GOOD: Type-safe, error handling
async getHome(guid: string): Promise<Home> {
  return this.apiRequest<Home>(`homes/${guid}`)
}

// ❌ BAD: Untyped, no error handling
async getHome(guid) {
  return fetch(url).then(r => r.json())
}
```

---

## Common Pitfalls to Avoid

### 1. Assuming Database Schema
**Don't**: Write queries from memory  
**Do**: Check existing queries or schema docs

### 2. Mixing Direct DB and API Calls
**Don't**: Have `if/else` fallback logic  
**Do**: Use API client exclusively in non-admin services

### 3. Generic Error Messages
**Don't**: Return "500 Internal Server Error"  
**Do**: Include endpoint, parameters, and troubleshooting steps

### 4. Missing Timeouts
**Don't**: Let requests hang indefinitely  
**Do**: Add AbortController with 30-second timeout

### 5. Hardcoding URLs
**Don't**: `const url = "https://admin.test.refugehouse.app"`  
**Do**: Use environment variables

### 6. Insufficient Logging
**Don't**: Only log errors  
**Do**: Log request start, success, and detailed errors

### 7. Testing in Production
**Don't**: Deploy without testing  
**Do**: Create test pages and verify in staging

### 8. Forgetting API Keys
**Don't**: Deploy and wonder why it doesn't work  
**Do**: Verify API keys in deployment environment

---

## Performance Considerations

### API Client Caching
- API responses are not cached by default (`cache: 'no-store'`)
- Consider caching for:
  - User permissions (cache per session)
  - Navigation items (cache per user)
  - System settings (cache globally with TTL)

### Batch Operations
- Avoid N+1 queries through API Hub
- Design endpoints to return related data in single call
- Example: `/prepopulate` returns home + license + household + placements + history

### Connection Pooling
- Admin service maintains database connection pool
- Microservices reuse API connections via keep-alive
- Set appropriate pool sizes based on load

---

## Security Improvements

### Before (Direct Database Access)
- ❌ Every microservice has database credentials
- ❌ Static IPs required for database access
- ❌ No audit trail of which service accessed what
- ❌ Difficult to rotate credentials
- ❌ Wide attack surface

### After (API Hub Pattern)
- ✅ Only admin service has database credentials
- ✅ No static IPs needed
- ✅ API Hub logs all access attempts
- ✅ API keys can be rotated per service
- ✅ Single point of security control

---

## Future Enhancements

### Short Term
- [ ] Add rate limiting to API Hub
- [ ] Implement request/response caching
- [ ] Add API versioning (e.g., `/api/v1/radius/...`)
- [ ] Create API usage dashboard
- [ ] Add automated API documentation (OpenAPI/Swagger)

### Long Term
- [ ] Consider GraphQL for complex queries
- [ ] Implement webhook system for real-time updates
- [ ] Add API analytics and monitoring
- [ ] Consider API gateway (Kong, AWS API Gateway)
- [ ] Implement distributed tracing (OpenTelemetry)

---

## Conclusion

The migration from direct database access to the API Hub pattern was complex but successful. Key takeaways:

1. **Plan thoroughly** - Document all database access before starting
2. **Test extensively** - Create diagnostic tools and test pages
3. **Log comprehensively** - Logs are essential for debugging
4. **Remove fallbacks** - Don't leave direct DB code paths
5. **Verify schema** - Column names matter
6. **Handle errors well** - Provide actionable error messages
7. **Use timeouts** - Don't let requests hang
8. **Verify in production** - Test after deployment

This pattern significantly improves security, maintainability, and scalability of the microservices architecture.

