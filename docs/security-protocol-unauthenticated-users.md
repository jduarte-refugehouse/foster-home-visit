# Security Protocol: Handling Unauthenticated Users

## Overview

This document defines the security protocol for handling users who are authenticated with Clerk but **not found in the application database**. This is a critical security requirement to prevent unauthorized access to protected content.

## Security Principle

**If a user is authenticated with Clerk but NOT found in the database, they must see ONLY an "Account Registration Required" screen. NO protected content, navigation links, or dashboard cards should be visible.**

## Implementation

### 1. Reusable Components

#### `AccountRegistrationRequired` Component
**Location:** `packages/shared-core/components/account-registration-required.tsx`

A standardized component that displays when a user is authenticated with Clerk but not found in the database.

**Usage:**
```tsx
import { AccountRegistrationRequired } from "@refugehouse/shared-core/components/account-registration-required"

// In your protected page component
if (user && !hasDatabaseAccess) {
  return (
    <AccountRegistrationRequired 
      microserviceName="Your Microservice Name"
      contactEmail="admin@refugehouse.org"
    />
  )
}
```

#### `useDatabaseAccess` Hook
**Location:** `packages/shared-core/hooks/use-database-access.ts`

A hook that checks if the user is authenticated with Clerk AND found in the database.

**Usage:**
```tsx
import { useDatabaseAccess } from "@refugehouse/shared-core/hooks/use-database-access"

function MyProtectedPage() {
  const { user } = useUser()
  const { hasAccess, isLoading } = useDatabaseAccess()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (user && !hasAccess) {
    return <AccountRegistrationRequired microserviceName="My App" />
  }
  
  // User has database access - show protected content
  return <ProtectedContent />
}
```

### 2. Required Pattern for All Protected Pages

Every protected page MUST follow this pattern:

```tsx
"use client"

import { useUser } from "@clerk/nextjs"
import { useDatabaseAccess } from "@refugehouse/shared-core/hooks/use-database-access"
import { AccountRegistrationRequired } from "@refugehouse/shared-core/components/account-registration-required"

export default function MyProtectedPage() {
  const { user, isLoaded } = useUser()
  const { hasAccess, isLoading } = useDatabaseAccess()
  
  // Show loading while checking
  if (!isLoaded || isLoading) {
    return <LoadingState />
  }
  
  // SECURITY: Show registration required if user not found in database
  if (user && !hasAccess) {
    return (
      <AccountRegistrationRequired 
        microserviceName="Your Microservice"
        contactEmail="admin@refugehouse.org"
      />
    )
  }
  
  // User has database access - show protected content
  return (
    <div>
      {/* Your protected content here */}
    </div>
  )
}
```

### 3. What NOT to Show

When a user is authenticated with Clerk but NOT found in the database, you MUST NOT show:

- ❌ Dashboard cards or links
- ❌ Navigation items
- ❌ Protected content
- ❌ Any functional UI elements
- ❌ Any information about the application structure
- ❌ Any links to other pages

### 4. What TO Show

When a user is authenticated with Clerk but NOT found in the database, you MUST show:

- ✅ "Account Registration Required" message
- ✅ User's email address (from Clerk)
- ✅ Clear explanation that Clerk authentication succeeded but database registration is needed
- ✅ Contact information for requesting access
- ✅ Nothing else

## Examples

### ✅ CORRECT Implementation

```tsx
// app/(protected)/my-page/page.tsx
import { useDatabaseAccess } from "@refugehouse/shared-core/hooks/use-database-access"
import { AccountRegistrationRequired } from "@refugehouse/shared-core/components/account-registration-required"

export default function MyPage() {
  const { user } = useUser()
  const { hasAccess, isLoading } = useDatabaseAccess()
  
  if (isLoading) return <Loading />
  
  if (user && !hasAccess) {
    return <AccountRegistrationRequired microserviceName="My App" />
  }
  
  return <MyProtectedContent />
}
```

### ❌ INCORRECT Implementation

```tsx
// DON'T DO THIS - Shows dashboard even when user not found
export default function MyPage() {
  const { user } = useUser()
  
  // Missing database access check!
  return (
    <div>
      <h1>Dashboard</h1>
      <Link href="/admin">Admin</Link> {/* SECURITY RISK! */}
      <Link href="/settings">Settings</Link> {/* SECURITY RISK! */}
    </div>
  )
}
```

## Pages That Must Follow This Protocol

All pages in `app/(protected)/` must implement this check:

- ✅ `dashboard/page.tsx` - Updated
- ✅ `globaladmin/page.tsx` - Updated
- ⚠️ All other protected pages - **MUST BE UPDATED**

## Testing

To test this security protocol:

1. Sign in with Clerk using an account that is NOT in the database
2. Navigate to any protected page
3. Verify you see ONLY the "Account Registration Required" screen
4. Verify NO navigation links, dashboard cards, or protected content is visible

## Security Impact

**Failure to implement this protocol creates a critical security vulnerability:**

- Users can see application structure and navigation
- Users can potentially access protected routes
- Sensitive information about the application may be exposed
- Attackers could enumerate application features

## Related Components

- `AccessGuard` - Handles platform-level access (external users)
- `useDatabaseAccess` - Checks database-level access
- `AccountRegistrationRequired` - Standard UI for unregistered users

## Questions?

Contact: jduarte@refugehouse.org

