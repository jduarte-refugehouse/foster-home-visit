# Quick Reference: Adding New API Endpoint

## Files to Create/Modify

1. ✅ **Query Function** → `lib/db-extensions.ts`
2. ✅ **API Endpoint** → `app/api/radius/[endpoint-name]/route.ts`
3. ✅ **Types** → `packages/radius-api-client/types.ts`
4. ✅ **Client Method** → `packages/radius-api-client/client.ts`
5. ✅ **Export Types** → `packages/radius-api-client/index.ts`
6. ✅ **API Config** (optional) → `packages/api-config/endpoints.ts`

## Copy-Paste Checklist

### Step 1: Query Function
- [ ] Copy `docs/templates/radius-api-query-function-template.ts`
- [ ] Paste into `lib/db-extensions.ts`
- [ ] Update interface name and fields
- [ ] Update function name
- [ ] Update SQL query
- [ ] Update filter parameters

### Step 2: API Endpoint
- [ ] Create folder: `app/api/radius/[your-endpoint-name]/`
- [ ] Copy `docs/templates/radius-api-endpoint-template.ts`
- [ ] Save as `route.ts` in the folder
- [ ] Update imports (query function, types)
- [ ] Update endpoint path in comments
- [ ] Update query parameter parsing
- [ ] Update response field name (data/items/records)

### Step 3: Types
- [ ] Add interface to `packages/radius-api-client/types.ts`
- [ ] Add options interface (for filters)
- [ ] Match field names from query function

### Step 4: Client Method
- [ ] Copy `docs/templates/radius-api-client-method-template.ts`
- [ ] Paste into `radiusApiClient` object in `packages/radius-api-client/client.ts`
- [ ] Update method name
- [ ] Update endpoint path
- [ ] Update query parameter building
- [ ] Update response field extraction (match endpoint response)

### Step 5: Export Types
- [ ] Add types to exports in `packages/radius-api-client/index.ts`

## Testing

```bash
# Test from admin microservice
curl -H "x-api-key: rh_your_key" \
  "https://admin.test.refugehouse.app/api/radius/your-endpoint-name"

# Test from another microservice
import { radiusApiClient } from '@refugehouse/radius-api-client'
const data = await radiusApiClient.getYourData()
```

## Common Mistakes to Avoid

❌ **Don't**: Pass raw SQL through API  
✅ **Do**: Create specific endpoints with parameterized queries

❌ **Don't**: Forget to validate API key  
✅ **Do**: Always call `validateApiKey()` first

❌ **Don't**: Use string concatenation in SQL  
✅ **Do**: Use parameterized queries (`@param0`, `@param1`)

❌ **Don't**: Forget to export types  
✅ **Do**: Add to `index.ts` exports

❌ **Don't**: Mismatch response field names  
✅ **Do**: Check endpoint response structure matches client extraction

## Response Structure

All endpoints return:
```typescript
{
  success: boolean
  count: number
  data: YourType[]  // or specific name
  timestamp: string
  duration_ms: number
}
```

## Need Help?

See full guide: `docs/radius-api-hub-adding-endpoints.md`

