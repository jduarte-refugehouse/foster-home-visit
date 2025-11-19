# Multi-Microservice Architecture Plan

> **Status**: ✅ **IMPLEMENTED** - See `docs/monorepo-completion-status.md` for completion status.
> 
> **Quick Start**: See `docs/microservice-creation-guide.md` for creating new microservices.
> 
> **Reference**: See `docs/shared-core-reference.md` for complete API documentation.

## Overview
This document outlines the plan to repurpose the current Home Visits application into a multi-microservice platform that supports multiple subdomains (placements.refugehouse.org, my.refugehouse.org, training.refugehouse.org, etc.) using a single codebase with shared core functionality.

## Current Architecture

### What We Already Have ✅
- **Microservice configuration system** (`lib/microservice-config.ts`) - Currently hardcoded to "home-visits"
- **Permission system** - Already microservice-aware with `microserviceCode` parameter
- **Database schema** - Includes `microservice_apps` table for service registration
- **Shared core functionality**:
  - Authentication (Clerk-based)
  - Database connection (Azure SQL)
  - User management
  - Admin pages
  - Diagnostics
  - Navigation system (database-driven with config fallback)

## Proposed Architecture

### Core Concept
- **Single codebase** for all microservices
- **Shared database** (RadiusBifrost) with microservice-specific permissions
- **Subdomain-based routing** in production
- **Environment variable-based** for test/preview deployments
- **Shared core** + **Service-specific** routes/components

## Implementation Strategy

### 1. Tiered Microservice Detection

#### Tier 1: Environment Variable (Highest Priority - for test/preview)
```typescript
// Explicit override for test deployments
if (process.env.MICROSERVICE_CODE) {
  return process.env.MICROSERVICE_CODE
}
```

#### Tier 2: Branch Name Detection (for Vercel preview deployments)
```typescript
// Automatic based on branch name
if (process.env.VERCEL_BRANCH) {
  const branch = process.env.VERCEL_BRANCH.toLowerCase()
  if (branch.includes('placements')) return 'placements'
  if (branch.includes('training')) return 'training'
  if (branch.includes('my-refugehouse')) return 'my-refugehouse'
  if (branch.includes('home-visits') || branch.includes('static-ip')) return 'home-visits'
}
```

#### Tier 3: Subdomain Detection (for production)
```typescript
// Production subdomain mapping
const hostname = request.headers.get('host') || ''
const subdomain = hostname.split('.')[0]
const subdomainMap: Record<string, string> = {
  'visits': 'home-visits',
  'placements': 'placements',
  'my': 'my-refugehouse',
  'training': 'training',
}
```

#### Tier 4: Default Fallback
```typescript
// Safe default
return 'home-visits'
```

### 2. Dynamic Configuration System

**Current**: Hardcoded `MICROSERVICE_CONFIG` in `lib/microservice-config.ts`

**Proposed**: Dynamic function that loads config based on detected microservice code:

```typescript
// lib/microservice-config.ts
export function getMicroserviceConfig(request?: NextRequest): MicroserviceConfig {
  const code = getMicroserviceCode(request)
  return getConfigForMicroservice(code)
}

function getConfigForMicroservice(code: string): MicroserviceConfig {
  const configs: Record<string, MicroserviceConfig> = {
    'home-visits': { /* current config */ },
    'placements': { 
      code: 'placements',
      name: 'Placements Management',
      description: 'Foster care placement tracking and management',
      url: '/placements',
      organizationDomain: 'refugehouse.org',
      roles: { /* placements-specific */ },
      permissions: { /* placements-specific */ },
      defaultNavigation: [ /* placements nav */ ],
    },
    'my-refugehouse': { /* user portal config */ },
    'training': { /* training config */ },
  }
  
  return configs[code] || configs['home-visits']
}
```

### 3. Middleware Updates

**Current**: Passive middleware (no-op)

**Proposed**: Subdomain detection and microservice context setting:

```typescript
// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SUBDOMAIN_MAP: Record<string, string> = {
  'visits': 'home-visits',
  'placements': 'placements',
  'my': 'my-refugehouse',
  'training': 'training',
}

export function middleware(request: NextRequest) {
  // Determine microservice code using tiered approach
  const microserviceCode = getMicroserviceCode(request)
  
  // Add microservice context to headers for API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-microservice-code', microserviceCode)
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Set cookie for client-side access
  response.cookies.set('microservice-code', microserviceCode)
  
  return response
}
```

### 4. Route Organization Strategy

```
app/
├── (protected)/
│   ├── [microservice]/          # Service-specific routes
│   │   ├── placements/
│   │   │   ├── page.tsx         # placements.refugehouse.org/dashboard
│   │   │   └── cases/
│   │   ├── training/
│   │   │   └── courses/
│   │   └── my-refugehouse/
│   │       └── profile/
│   │
│   ├── _shared/                 # Shared across all microservices
│   │   ├── dashboard/
│   │   ├── admin/
│   │   ├── homes-map/
│   │   ├── homes-list/
│   │   └── diagnostics/
│   │
│   └── layout.tsx               # Detects microservice, applies config
│
└── api/
    ├── [microservice]/          # Service-specific APIs
    │   └── placements/
    │
    └── _shared/                 # Shared APIs
        ├── navigation/
        ├── permissions/
        └── diagnostics/
```

**Alternative Approach** (Less restructuring):
- Keep current route structure
- Use middleware to filter routes based on microservice
- Service-specific features in their own directories

### 5. Vercel Configuration

#### Environment Variables Setup

For each preview/test deployment, set in Vercel dashboard:

**Option A: Per-Branch Environment Variables**
- Go to Project → Settings → Environment Variables
- Add `MICROSERVICE_CODE` for specific branches:
  - Branch: `feature/placements` → `MICROSERVICE_CODE=placements`
  - Branch: `static-ip-trial` → `MICROSERVICE_CODE=home-visits`
  - Branch: `training-v2` → `MICROSERVICE_CODE=training`

**Option B: Automatic Branch Detection**
- No manual setup needed
- Relies on branch name patterns (Tier 2 detection)

#### Production Setup
- Configure subdomains in DNS:
  - `visits.refugehouse.org` → Vercel deployment
  - `placements.refugehouse.org` → Same Vercel deployment
  - `my.refugehouse.org` → Same Vercel deployment
- All point to same Vercel project
- Middleware detects subdomain and routes accordingly

### 6. Database Considerations

#### Shared Database Structure
- **`app_users`** - Shared user table (all microservices)
- **`microservice_apps`** - Registry of all microservices
- **`permissions`** - Microservice-specific (has `microservice_id`)
- **`user_roles`** - Microservice-specific (has `microservice_id`)
- **`user_permissions`** - Microservice-specific (has `permission_id` → `permissions` → `microservice_id`)
- **`navigation_items`** - Microservice-specific (has `microservice_id`)

#### Service-Specific Tables
- Each microservice can have its own domain tables
- Example: `placements` table for placements microservice
- Example: `training_courses` for training microservice
- All accessible via same database connection

### 7. Permission System Updates

**Current**: Already microservice-aware ✅

**Updates Needed**:
- Ensure all permission checks use dynamic microservice code
- Update `checkPermission()` calls to use detected microservice
- Update navigation filtering to use detected microservice

### 8. Navigation System Updates

**Current**: Loads from database with microservice filtering ✅

**Updates Needed**:
- Ensure navigation API uses dynamic microservice config
- Update `MICROSERVICE_CONFIG.code` references to use dynamic function

## Implementation Phases

### Phase 1: Foundation (Low Risk)
1. ✅ Create this plan document
2. Create `getMicroserviceCode()` function with tiered detection
3. Create `getMicroserviceConfig()` dynamic function
4. Update `MICROSERVICE_CONFIG` references to use dynamic function
5. Test with environment variable override

### Phase 2: Middleware (Medium Risk)
1. Update middleware to detect subdomain
2. Set microservice context in headers/cookies
3. Test with different subdomains in local dev

### Phase 3: Route Organization (Higher Risk)
1. Decide on route structure (shared vs service-specific)
2. Reorganize routes if needed
3. Update route guards/filters

### Phase 4: Testing (Critical)
1. Test with environment variables in Vercel preview
2. Test with branch name detection
3. Test with subdomain detection (production simulation)
4. Verify permissions work correctly per microservice

### Phase 5: Production Deployment
1. Configure DNS subdomains
2. Deploy to production
3. Verify each subdomain loads correct microservice

## Benefits of This Approach

- ✅ **Single Codebase**: All microservices in one repo
- ✅ **Shared Core**: Auth, database, user management reused
- ✅ **Service-Specific**: Each microservice has its own routes/permissions
- ✅ **Easy Deployment**: One Vercel project, multiple domains
- ✅ **Code Reuse**: Shared components, utilities, hooks
- ✅ **Flexible Testing**: Environment variable override for any branch
- ✅ **Scalable**: Easy to add new microservices

## Considerations

### Code Splitting
- Next.js will automatically code-split by route
- Consider lazy loading for service-specific components
- Monitor bundle size as services grow

### Environment Variables
- Need to set `MICROSERVICE_CODE` for each test branch initially
- Could automate with branch name patterns
- Local dev uses `.env.local`

### Route Conflicts
- Ensure no route conflicts between microservices
- Shared routes (`/dashboard`, `/admin`) work for all
- Service-specific routes should be namespaced

### Database Performance
- Shared database connection pool
- Monitor query performance as services grow
- Consider read replicas if needed

## Questions to Resolve

1. **Route Structure**: Should we use path prefixes (`/placements/dashboard`) or keep flat structure (`/dashboard` with microservice filtering)?
2. **Navigation**: Should navigation be completely different per microservice, or shared with service-specific additions?
3. **Admin Pages**: Should admin pages be completely shared, or have service-specific admin sections?
4. **Deployment Strategy**: Single Vercel project or multiple projects pointing to same codebase?

## Next Steps

1. ✅ Document this plan
2. Continue stabilizing current Home Visits functionality
3. Return to this plan when ready to implement
4. Start with Phase 1 (low-risk foundation work)

---

**Created**: December 2024  
**Status**: Planning Phase - Not Yet Implemented  
**Priority**: After Home Visits functionality is stabilized

