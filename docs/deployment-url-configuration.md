# Deployment URL Configuration

## Overview

In a distributed service domain model, each microservice needs to know its own deployment URL to generate links, send notifications, and reference resources. This is critical because the same codebase deploys to different domains:

- **Test Environment**: `admin.test.refugehouse.app`
- **Production Environment**: `admin.refugehouse.app`

## The Problem

When generating links (e.g., signature tokens, appointment links, email notifications), the application needs to know:
- Which environment it's running in (test vs production)
- What the full deployment URL is
- How to construct URLs that work in the current environment

## Solution: `getDeploymentUrl()` Function

The `getDeploymentUrl()` function in `lib/microservice-config.ts` provides a tiered approach to determine the deployment URL:

### Priority Order

1. **`NEXT_PUBLIC_APP_URL`** (Explicit override - highest priority)
   - Set this in Vercel environment variables
   - Format: `https://admin.test.refugehouse.app` or `https://admin.refugehouse.app`
   - Use this when you need explicit control

2. **`VERCEL_URL`** (Automatically set by Vercel)
   - Vercel automatically sets this for each deployment
   - Format: `your-project-git-branch.vercel.app`
   - Works automatically but may not match your custom domain

3. **Request Origin Header** (From incoming HTTP request)
   - Extracted from `request.headers.get('origin')`
   - Most reliable for API routes that receive requests

4. **Request Host Header** (From incoming HTTP request)
   - Extracted from `request.headers.get('host')`
   - Fallback if origin is not available

5. **Environment-Based Fallback** (Automatic detection)
   - Uses `getDeploymentEnvironment()` to determine test vs production
   - Uses `getMicroserviceCode()` to determine microservice
   - Maps to domain pattern: `{microservice}.{test|production}.refugehouse.app`

## Required Environment Variables

### For Explicit Control (Recommended)

Set `NEXT_PUBLIC_APP_URL` in Vercel for each environment:

**Test/Preview Environment:**
- `NEXT_PUBLIC_APP_URL=https://admin.test.refugehouse.app`

**Production Environment:**
- `NEXT_PUBLIC_APP_URL=https://admin.refugehouse.app`

### Automatic Detection (Fallback)

If `NEXT_PUBLIC_APP_URL` is not set, the function will:
- Use `VERCEL_URL` (automatically set by Vercel)
- Or extract from request headers
- Or use environment-based domain mapping

## Usage Examples

### In API Routes

```typescript
import { getDeploymentUrl } from "@/lib/microservice-config"

export async function POST(request: NextRequest) {
  // Get deployment URL from request context
  const baseUrl = getDeploymentUrl(request)
  
  // Generate a link
  const signatureUrl = `${baseUrl}/signature/${token}`
  
  // Send via SMS or email
  await sendSMS(phoneNumber, `Please sign: ${signatureUrl}`)
}
```

### In Server Components

```typescript
import { getDeploymentUrl } from "@/lib/microservice-config"

// Without request context (uses environment-based fallback)
const baseUrl = getDeploymentUrl()

// Generate link
const appointmentLink = `${baseUrl}/mobile/appointments/${appointmentId}`
```

### In Client Components

```typescript
// Client components can use window.location.origin
const baseUrl = typeof window !== 'undefined' 
  ? window.location.origin 
  : getDeploymentUrl()
```

## Domain Mapping

The function includes a domain mapping for known microservices:

```typescript
const domainMap = {
  'home-visits': {
    test: 'visit.test.refugehouse.app',
    production: 'visit.refugehouse.app',
  },
  'service-domain-admin': {
    test: 'admin.test.refugehouse.app',
    production: 'admin.refugehouse.app',
  },
  'case-management': {
    test: 'case-management.test.refugehouse.app',
    production: 'case-management.refugehouse.app',
  },
}
```

### Adding New Microservices

When adding a new microservice, update the `domainMap` in `getDeploymentUrl()`:

```typescript
const domainMap: Record<string, { test: string; production: string }> = {
  // ... existing entries ...
  'your-microservice': {
    test: 'your-microservice.test.refugehouse.app',
    production: 'your-microservice.refugehouse.app',
  },
}
```

## Complete Environment Variables List

For a complete distributed service domain setup, configure these in Vercel:

### Required for All Microservices

1. **`MICROSERVICE_CODE`** - Microservice identifier (e.g., `service-domain-admin`)
2. **`DEPLOYMENT_ENVIRONMENT`** - Environment type (`test` or `production`)
3. **`NEXT_PUBLIC_APP_URL`** - Full deployment URL (recommended for explicit control)

### Optional (Auto-detected if not set)

- `VERCEL_URL` - Automatically set by Vercel
- `VERCEL_ENV` - Automatically set by Vercel (`production`, `preview`, `development`)
- `VERCEL_BRANCH` - Automatically set by Vercel

### Other Required Variables

- Clerk authentication keys
- Azure Key Vault credentials
- Database connection strings
- External API keys (SendGrid, Twilio, etc.)

## Best Practices

1. **Set `NEXT_PUBLIC_APP_URL` explicitly** for production deployments
2. **Use `getDeploymentUrl(request)` in API routes** to get the most accurate URL
3. **Update domain mapping** when adding new microservices
4. **Test URL generation** in both test and production environments
5. **Use environment-specific URLs** for external integrations (SMS, email)

## Troubleshooting

### Issue: URLs point to wrong environment

**Solution**: Set `NEXT_PUBLIC_APP_URL` explicitly in Vercel environment variables

### Issue: URLs use Vercel preview domain instead of custom domain

**Solution**: Set `NEXT_PUBLIC_APP_URL` to your custom domain, or ensure request headers are available

### Issue: Client-side code can't access deployment URL

**Solution**: Use `window.location.origin` in client components, or ensure `NEXT_PUBLIC_APP_URL` is set (it's available to client-side code)

## Summary

- ✅ Use `getDeploymentUrl(request)` in API routes for accurate URLs
- ✅ Set `NEXT_PUBLIC_APP_URL` in Vercel for explicit control
- ✅ Update domain mapping when adding new microservices
- ✅ Test URL generation in both test and production environments

