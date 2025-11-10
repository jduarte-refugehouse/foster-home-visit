# Pulse App API Key Setup Instructions

## For the Home Visit App (This App)

### Environment Variable
Add to Vercel environment variables:
- **Name**: `PULSE_APP_API_KEY`
- **Value**: `d13e847077a93ac18de609a9456178cbafa3596a04b31f9ed0dc218c2577fdf0`
- **Apply to**: Production, Preview, Development (as needed)

### API Key Generation (if you need a new one)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## For the Pulse App (Other App)

Copy and paste the following into your `/api/placement-history` route file:

### Step 1: Add API Key Verification Function

Add this function at the top of your route file (after imports):

```typescript
/**
 * Check if the API key is valid
 * Verifies the x-api-key or Authorization header matches PULSE_APP_API_KEY
 */
function isValidApiKey(request: Request): boolean {
  const expectedKey = process.env.PULSE_APP_API_KEY
  
  // If no API key is configured, allow requests (for development)
  if (!expectedKey) {
    console.warn("⚠️ [API] PULSE_APP_API_KEY not configured - allowing all requests")
    return true
  }
  
  // Check for API key in x-api-key header or Authorization header
  const apiKey = request.headers.get("x-api-key") || 
                 request.headers.get("authorization")?.replace("Bearer ", "")
  
  if (!apiKey) {
    return false
  }
  
  return apiKey === expectedKey
}
```

### Step 2: Add API Key Check in GET Handler

Update your `GET` function to check the API key at the beginning:

```typescript
export async function GET(request: Request) {
  try {
    // Security check: Verify API key
    if (!isValidApiKey(request)) {
      console.warn(`🚫 [API] Invalid API key attempt`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid API key",
        },
        { status: 401 }
      )
    }

    // ... rest of your existing GET handler code ...
  } catch (error: any) {
    // ... your existing error handling ...
  }
}
```

### Step 3: Add API Key Check in POST Handler

Update your `POST` function to check the API key at the beginning:

```typescript
export async function POST(request: Request) {
  try {
    // Security check: Verify API key
    if (!isValidApiKey(request)) {
      console.warn(`🚫 [API] Invalid API key attempt`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid API key",
        },
        { status: 401 }
      )
    }

    // ... rest of your existing POST handler code ...
  } catch (error: any) {
    // ... your existing error handling ...
  }
}
```

### Step 4: Add Environment Variable

Add to your Pulse app's environment variables (Vercel, or wherever you deploy):
- **Name**: `PULSE_APP_API_KEY`
- **Value**: `d13e847077a93ac18de609a9456178cbafa3596a04b31f9ed0dc218c2577fdf0`
- **Apply to**: Production, Preview, Development (as needed)

### Step 5: Update Home Visit App to Send API Key

The Home Visit app will automatically send the API key when calling your endpoint. Update the fetch call in `app/api/placement-history/route.ts` to include the API key header:

```typescript
// In the GET handler, update the fetch call:
const response = await fetch(fullUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.PULSE_APP_API_KEY || '', // Add this line
  },
})

// In the POST handler, update the fetch call:
const response = await await fetch(`${apiUrl}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.PULSE_APP_API_KEY || '', // Add this line
  },
  body: JSON.stringify({
    homeGUID,
    startDate,
    endDate,
  }),
})
```

---

## Complete Example for Pulse App

Here's a complete example of what your `/api/placement-history/route.ts` should look like:

```typescript
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Check if the API key is valid
 */
function isValidApiKey(request: Request): boolean {
  const expectedKey = process.env.PULSE_APP_API_KEY
  
  if (!expectedKey) {
    console.warn("⚠️ [API] PULSE_APP_API_KEY not configured - allowing all requests")
    return true
  }
  
  const apiKey = request.headers.get("x-api-key") || 
                 request.headers.get("authorization")?.replace("Bearer ", "")
  
  if (!apiKey) {
    return false
  }
  
  return apiKey === expectedKey
}

export async function GET(request: Request) {
  try {
    // Security check: Verify API key
    if (!isValidApiKey(request)) {
      console.warn(`🚫 [API] Invalid API key attempt`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid API key",
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const homeGUID = searchParams.get("homeGUID")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // ... rest of your existing code ...
    
  } catch (error: any) {
    // ... your error handling ...
  }
}

export async function POST(request: Request) {
  try {
    // Security check: Verify API key
    if (!isValidApiKey(request)) {
      console.warn(`🚫 [API] Invalid API key attempt`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid API key",
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { homeGUID, startDate, endDate } = body

    // ... rest of your existing code ...
    
  } catch (error: any) {
    // ... your error handling ...
  }
}
```

---

## Testing

1. **Without API key**: Requests should be allowed (if `PULSE_APP_API_KEY` is not set)
2. **With invalid API key**: Should return 401 Unauthorized
3. **With valid API key**: Should work normally

## Notes

- The API key check is optional - if `PULSE_APP_API_KEY` is not configured, all requests are allowed
- The API key can be sent in either the `x-api-key` header or `Authorization: Bearer <key>` header
- Invalid API key attempts are logged for security monitoring

