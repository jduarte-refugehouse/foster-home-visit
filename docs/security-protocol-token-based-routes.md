# Security Protocol: Token-Based Authentication Routes

## Overview

This document clarifies that the database access check protocol **DOES NOT APPLY** to token-based authentication routes. Token-based routes carry identity with them and do not require database lookup.

## Token-Based Routes (Excluded from Database Check)

### Public Signature Routes

**Location:** `app/signature/[token]/page.tsx`

- **NOT in `(protected)` folder** - Publicly accessible
- **Uses token-based authentication** - Identity is embedded in the token
- **No Clerk authentication required**
- **No database user lookup required**
- **Middleware exclusion:** `/signature` routes are explicitly excluded from protection

### Public API Routes

**Location:** `app/api/public/signature-tokens/[token]/route.ts`

- **Public API endpoint** - No authentication headers required
- **Token-based** - Token contains all necessary identity information
- **No database user lookup** - Token validation is sufficient

## Pages Modified with Database Access Check

The following pages were updated to use the database access check protocol:

1. ✅ `app/(protected)/globaladmin/page.tsx` - Clerk-protected, requires database access
2. ✅ `app/(protected)/dashboard/page.tsx` - Clerk-protected, requires database access

**These are NOT token-based routes** - they use Clerk authentication and require database user lookup.

## Verification

### Token-Based Routes (Should NOT have database check):

- ✅ `app/signature/[token]/page.tsx` - No `useDatabaseAccess` hook
- ✅ `app/api/public/signature-tokens/[token]/route.ts` - Public API, no auth required

### Clerk-Protected Routes (Should have database check):

- ✅ `app/(protected)/globaladmin/page.tsx` - Uses `useDatabaseAccess`
- ✅ `app/(protected)/dashboard/page.tsx` - Uses `useDatabaseAccess`

## Middleware Configuration

The middleware explicitly excludes token-based routes:

```typescript
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|signature|sign-in|sign-up).*)",
  ],
}
```

The `/signature` path is excluded, ensuring token-based routes are not affected by protected route checks.

## Security Principle

**Token-based authentication routes:**
- ✅ Identity is embedded in the token
- ✅ No database user lookup required
- ✅ Token validation is sufficient
- ✅ Should NOT use `useDatabaseAccess` hook
- ✅ Should NOT use `AccountRegistrationRequired` component

**Clerk-protected routes:**
- ✅ Require Clerk authentication
- ✅ Require database user lookup
- ✅ Should use `useDatabaseAccess` hook
- ✅ Should show `AccountRegistrationRequired` if user not found

## Testing

To verify token-based routes are not affected:

1. Access a signature token URL: `/signature/[valid-token]`
2. Verify the page loads without requiring Clerk authentication
3. Verify no database access check is performed
4. Verify the signature form is functional

## Related Documentation

- [Security Protocol: Unauthenticated Users](./security-protocol-unauthenticated-users.md) - For Clerk-protected routes
- [Testing Public Signature Routes](./testing-public-signature-routes.md) - For token-based routes

