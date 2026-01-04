# Cursor AI: Visit Service Review & Upgrade Instructions

## Context

You are reviewing the **visit service** test branch in the Refuge House monorepo. The visit service currently handles visit scheduling and tracking for foster home visits. It needs to be upgraded to:

1. **Support the Continuum model** - A unified event/signal tracking system
2. **Fully API-based data access** - All CRUD operations routed through admin.refugehouse.app APIs

---

## Architecture Overview

### System Landscape

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REFUGE HOUSE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  VERCEL (Microservices)              AZURE SQL                  ON-PREM     │
│  ┌─────────────────────┐           ┌───────────────┐         ┌──────────┐   │
│  │ visit.refugehouse   │           │ RadiusBifrost │         │ radius   │   │
│  │ .app                │           │ (Integration  │◄───────►│ radiusrhsa│   │
│  │                     │◄─────────►│  Layer)       │         │ rhdata   │   │
│  └─────────────────────┘           └───────────────┘         └──────────┘   │
│            │                              │                                  │
│            │ API calls                    │ Sync                            │
│            ▼                              │                                  │
│  ┌─────────────────────┐                 │                                  │
│  │ admin.refugehouse   │◄────────────────┘                                  │
│  │ .app (API Hub)      │                                                    │
│  │                     │                                                    │
│  │ Routes:             │                                                    │
│  │ /api/visits/*       │                                                    │
│  │ /api/continuum/*    │                                                    │
│  │ /api/trips/*        │                                                    │
│  └─────────────────────┘                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Layer (RadiusBifrost)

Key tables you'll interact with:

| Table | Purpose |
|-------|---------|
| `ContinuumMark` | Point-in-time events (visits, contacts, approvals, etc.) |
| `ContinuumSignal` | Duration-based states (active service plan, credentials, etc.) |
| `MarkSubject` | Links marks to entities (children, homes) |
| `MarkParty` | People involved in marks (attendees, notified parties) |
| `Trips` | Travel/mileage tracking for visits |
| `SyncRadiusUsers` | Staff identity sync from on-prem |
| `EntityCommunicationBridge` | External contact identity (foster parents, therapists) |
| `app_users` | Clerk authentication bridge to internal identity |

---

## User Identity Architecture

### Four User Types

| Type | Has Radius GUID? | Has EntityCommBridge? | Has app_users? | Example |
|------|------------------|----------------------|----------------|---------|
| **Staff** | ✅ Yes | ❌ No | ✅ Yes | Case managers |
| **Foster Parent** | ✅ Yes | ✅ Yes | ✅ Yes | Foster families |
| **Third-Party Pro** | ❌ No | ✅ Yes | ✅ Yes | Therapists |
| **Unmanaged External** | ❌ No | ⚠️ Maybe | ❌ No | DFPS workers |

### Identity Resolution Pattern

```typescript
// THIS IS THE STANDARD PATTERN - USE IT
interface UserIdentity {
  clerkId: string;
  email: string;
  name: string;
  userType: string;              // 'staff', 'foster_parent', 'therapist', etc.
  
  // Identity bridges (one or the other based on userType)
  radiusGuid: string | null;     // For staff + foster parents (has on-prem record)
  commBridgeId: string | null;   // For third-party pros (NO on-prem record)
  fosterHomeGuid: string | null; // For foster parents (their home)
  
  // Resolved details
  pid: number | null;            // Staff only (from SyncRadiusUsers)
  unit: string | null;           // Staff only ('DAL' or 'SAN')
}

async function getUserIdentity(clerkUser: ClerkUser): Promise<UserIdentity> {
  const appUser = await db.appUsers.findUnique({
    where: { clerk_user_id: clerkUser.id }
  });
  
  if (!appUser) {
    throw new Error('User not found in app_users');
  }
  
  const identity: UserIdentity = {
    clerkId: clerkUser.id,
    email: appUser.email,
    name: `${appUser.first_name || ''} ${appUser.last_name || ''}`.trim(),
    userType: appUser.user_type,
    radiusGuid: appUser.radius_person_guid,
    commBridgeId: appUser.comm_bridge_id,
    fosterHomeGuid: appUser.radius_foster_home_guid,
    pid: null,
    unit: null,
  };
  
  // Resolve PID/Unit for staff
  if (appUser.user_type === 'staff' && appUser.radius_person_guid) {
    const staff = await db.syncRadiusUsers.findFirst({
      where: { Guid: appUser.radius_person_guid }
    });
    if (staff) {
      identity.pid = staff.PID;
      identity.unit = staff.Unit;
    }
  }
  
  return identity;
}
```

### Key Rules

1. **Staff**: `radius_person_guid` → `SyncRadiusUsers.Guid`
2. **Foster Parent**: `radius_person_guid` → `EntityCommunicationBridge.EntityGUID` (same person.Guid!)
3. **Third-Party Pro**: `comm_bridge_id` → `EntityCommunicationBridge.CommunicationID` (EntityGUID is NULL)
4. **Always store denormalized name** - for display without lookups
5. **Always store userType** - determines which bridge column to use

---

## Continuum Model Integration

### What is a ContinuumMark?

A `ContinuumMark` is a point-in-time event. When a visit occurs, it becomes a mark.

```sql
-- ContinuumMark schema (key columns)
CREATE TABLE ContinuumMark (
    MarkID              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    MarkType            NVARCHAR(50) NOT NULL,      -- 'HOME_VISIT', 'CONTACT', etc.
    MarkTime            DATETIME2 NOT NULL,         -- When it happened
    Unit                VARCHAR(3) NOT NULL,        -- 'DAL' or 'SAN'
    
    -- Actor identity (who performed the action)
    ActorClerkId        NVARCHAR(255) NULL,
    ActorRadiusGuid     UNIQUEIDENTIFIER NULL,      -- Staff or foster parent
    ActorCommBridgeId   UNIQUEIDENTIFIER NULL,      -- Third-party pro
    ActorName           NVARCHAR(255) NOT NULL,
    ActorEmail          NVARCHAR(255) NULL,
    ActorUserType       NVARCHAR(50) NULL,
    
    -- Content
    Notes               NVARCHAR(MAX) NULL,
    JsonPayload         NVARCHAR(MAX) NULL,         -- Structured data
    
    -- Audit
    CreatedAt           DATETIME2 DEFAULT GETDATE(),
    CreatedBy           NVARCHAR(255) NOT NULL
);
```

### Mark Types for Visits

| MarkType | Description |
|----------|-------------|
| `HOME_VISIT` | In-person foster home visit |
| `HOME_VISIT_SCHEDULED` | Visit scheduled (future) |
| `HOME_VISIT_CANCELLED` | Visit cancelled |
| `HOME_VISIT_RESCHEDULED` | Visit rescheduled |
| `CONTACT_PHONE` | Phone contact |
| `CONTACT_EMAIL` | Email contact |
| `CONTACT_TEXT` | SMS contact |

### Creating a Visit Mark

```typescript
async function createVisitMark(
  identity: UserIdentity,
  visitData: VisitInput
): Promise<string> {
  
  // 1. Create the ContinuumMark
  const mark = await db.continuumMark.create({
    data: {
      MarkID: uuidv4(),
      MarkType: 'HOME_VISIT',
      MarkTime: visitData.visitDateTime,
      Unit: identity.unit || visitData.unit,
      
      // Actor identity
      ActorClerkId: identity.clerkId,
      ActorRadiusGuid: identity.radiusGuid,
      ActorCommBridgeId: identity.commBridgeId,
      ActorName: identity.name,
      ActorEmail: identity.email,
      ActorUserType: identity.userType,
      
      // Content
      Notes: visitData.notes,
      JsonPayload: JSON.stringify({
        visitType: visitData.visitType,
        duration: visitData.durationMinutes,
        childrenPresent: visitData.childrenPresent,
        // ... other structured data
      }),
      
      CreatedAt: new Date(),
      CreatedBy: identity.clerkId
    }
  });
  
  // 2. Create MarkSubject for the foster home
  await db.markSubject.create({
    data: {
      SubjectID: uuidv4(),
      MarkID: mark.MarkID,
      EntityGUID: visitData.fosterHomeGuid,
      EntityType: 'facility',
      SubjectRole: 'primary'
    }
  });
  
  // 3. Create MarkSubject for each child
  for (const childGuid of visitData.childGuids) {
    await db.markSubject.create({
      data: {
        SubjectID: uuidv4(),
        MarkID: mark.MarkID,
        EntityGUID: childGuid,
        EntityType: 'child',
        SubjectRole: 'participant'
      }
    });
  }
  
  // 4. Create MarkParty for attendees
  for (const party of visitData.parties) {
    await db.markParty.create({
      data: {
        PartyID: uuidv4(),
        MarkID: mark.MarkID,
        PartyRadiusGuid: party.radiusGuid,
        PartyCommBridgeId: party.commBridgeId,
        PartyName: party.name,
        PartyRole: party.role,  // 'PRESENT', 'NOTIFIED', etc.
        PartyType: party.type   // 'foster_parent', 'dfps', etc.
      }
    });
  }
  
  return mark.MarkID;
}
```

---

## Trips Integration

Visits that involve travel should also create a `Trips` record:

```sql
-- Trips table (key columns)
CREATE TABLE Trips (
    TripID              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TripDate            DATE NOT NULL,
    
    -- Staff identity
    StaffClerkId        NVARCHAR(255) NOT NULL,
    StaffRadiusGuid     UNIQUEIDENTIFIER NULL,
    StaffEmail          NVARCHAR(255) NOT NULL,
    StaffName           NVARCHAR(255) NOT NULL,
    
    -- Trip details
    TripPurpose         NVARCHAR(100) NOT NULL,     -- 'Home Visit', etc.
    OriginType          NVARCHAR(50) NOT NULL,      -- 'office', 'home', 'foster_home'
    OriginAddress       NVARCHAR(500) NULL,
    DestinationType     NVARCHAR(50) NOT NULL,
    DestinationAddress  NVARCHAR(500) NULL,
    DestinationFosterHomeGuid UNIQUEIDENTIFIER NULL,
    
    -- Mileage
    MilesEstimated      DECIMAL(8,2) NULL,
    MilesActual         DECIMAL(8,2) NULL,
    
    -- Cost allocation
    CostCenterUnit      VARCHAR(3) NOT NULL,        -- 'DAL' or 'SAN'
    CostCenterType      NVARCHAR(50) DEFAULT 'operations',
    
    -- Link to ContinuumMark
    RelatedMarkID       UNIQUEIDENTIFIER NULL,
    
    -- Status
    TripStatus          NVARCHAR(50) DEFAULT 'planned',
    
    CreatedAt           DATETIME2 DEFAULT GETDATE()
);
```

### Creating Trip with Visit

```typescript
async function createVisitWithTrip(
  identity: UserIdentity,
  visitData: VisitInput
): Promise<{ markId: string; tripId: string | null }> {
  
  // 1. Create the visit mark
  const markId = await createVisitMark(identity, visitData);
  
  // 2. Create trip if travel involved
  let tripId = null;
  if (visitData.includesTravel) {
    const trip = await db.trips.create({
      data: {
        TripID: uuidv4(),
        TripDate: visitData.visitDateTime,
        
        StaffClerkId: identity.clerkId,
        StaffRadiusGuid: identity.radiusGuid,
        StaffEmail: identity.email,
        StaffName: identity.name,
        
        TripPurpose: 'Home Visit',
        OriginType: visitData.originType,
        OriginAddress: visitData.originAddress,
        DestinationType: 'foster_home',
        DestinationAddress: visitData.fosterHomeAddress,
        DestinationFosterHomeGuid: visitData.fosterHomeGuid,
        
        MilesEstimated: visitData.estimatedMiles,
        
        CostCenterUnit: identity.unit,
        CostCenterType: 'operations',
        
        RelatedMarkID: markId,
        TripStatus: 'completed'
      }
    });
    tripId = trip.TripID;
  }
  
  return { markId, tripId };
}
```

---

## API Structure Requirements

All operations MUST route through admin.refugehouse.app APIs. Here's the required structure:

### Visit API Routes

```
admin.refugehouse.app/
├── api/
│   ├── visits/
│   │   ├── GET    /                    # List visits (with filters)
│   │   ├── POST   /                    # Create visit
│   │   ├── GET    /:markId             # Get visit details
│   │   ├── PUT    /:markId             # Update visit
│   │   ├── DELETE /:markId             # Cancel visit
│   │   ├── GET    /upcoming            # Upcoming visits for user
│   │   ├── GET    /by-home/:homeGuid   # Visits for a foster home
│   │   └── GET    /by-child/:childGuid # Visits for a child
│   │
│   ├── trips/
│   │   ├── GET    /                    # List trips
│   │   ├── POST   /                    # Create trip
│   │   ├── GET    /:tripId             # Get trip
│   │   ├── PUT    /:tripId             # Update trip
│   │   └── GET    /by-staff            # Trips for current user
│   │
│   └── continuum/
│       ├── POST   /mark                # Create any mark type
│       ├── GET    /timeline/:entityGuid # Get timeline for entity
│       └── GET    /marks               # Query marks
```

### Example Route Implementations

```typescript
// routes/visits.ts

import { Router } from 'express';
import { requireAuth, getUserIdentity } from '../middleware/auth';
import { db } from '../lib/database';

const router = Router();

// GET /api/visits - List visits
router.get('/', requireAuth, async (req, res) => {
  const identity = await getUserIdentity(req.auth);
  
  const { startDate, endDate, homeGuid, childGuid, limit = 50 } = req.query;
  
  const marks = await db.continuumMark.findMany({
    where: {
      MarkType: { in: ['HOME_VISIT', 'HOME_VISIT_SCHEDULED'] },
      MarkTime: {
        gte: startDate ? new Date(startDate as string) : undefined,
        lte: endDate ? new Date(endDate as string) : undefined,
      },
      // Filter by home or child via MarkSubject join
      ...(homeGuid || childGuid ? {
        MarkSubjects: {
          some: {
            EntityGUID: homeGuid || childGuid
          }
        }
      } : {}),
      // Staff only see their own unless supervisor
      ...(identity.userType === 'staff' && !identity.isSupervisor ? {
        ActorRadiusGuid: identity.radiusGuid
      } : {})
    },
    include: {
      MarkSubjects: true,
      MarkParties: true
    },
    orderBy: { MarkTime: 'desc' },
    take: parseInt(limit as string)
  });
  
  res.json({ visits: marks });
});

// POST /api/visits - Create visit
router.post('/', requireAuth, async (req, res) => {
  const identity = await getUserIdentity(req.auth);
  
  // Validate staff only
  if (identity.userType !== 'staff') {
    return res.status(403).json({ error: 'Only staff can create visits' });
  }
  
  const { markId, tripId } = await createVisitWithTrip(identity, req.body);
  
  res.status(201).json({ markId, tripId });
});

// GET /api/visits/:markId - Get visit details
router.get('/:markId', requireAuth, async (req, res) => {
  const mark = await db.continuumMark.findUnique({
    where: { MarkID: req.params.markId },
    include: {
      MarkSubjects: true,
      MarkParties: true
    }
  });
  
  if (!mark) {
    return res.status(404).json({ error: 'Visit not found' });
  }
  
  // Get related trip if exists
  const trip = await db.trips.findFirst({
    where: { RelatedMarkID: mark.MarkID }
  });
  
  res.json({ visit: mark, trip });
});

export default router;
```

---

## Review Checklist

When reviewing the test branch, evaluate each area:

### 1. Current Data Access Patterns

- [ ] **Identify direct database calls** - Any code that queries the database directly instead of through APIs
- [ ] **Document existing endpoints** - What API routes exist currently?
- [ ] **List data models used** - What tables/schemas are being accessed?
- [ ] **Check for PID-based identity** - Is the code using integer PIDs instead of GUIDs?

### 2. Identity Management

- [ ] **Check authentication flow** - Is Clerk being used?
- [ ] **Verify identity resolution** - Is there a getUserIdentity pattern?
- [ ] **Check stored identity** - What user fields are stored on records?
- [ ] **Identify hardcoded users** - Any test user IDs embedded in code?

### 3. Visit Workflow

- [ ] **Current visit creation** - How are visits being created?
- [ ] **Visit status tracking** - How are statuses managed?
- [ ] **Visit scheduling** - Is there scheduling functionality?
- [ ] **Trip/mileage tracking** - Is travel being tracked?

### 4. Continuum Integration Readiness

- [ ] **Event logging** - Are events being logged? Where?
- [ ] **Subject tracking** - Are visits linked to homes/children?
- [ ] **Party tracking** - Are attendees being recorded?
- [ ] **Timeline queries** - Can visit history be retrieved?

### 5. API Architecture

- [ ] **Route organization** - How are routes structured?
- [ ] **Error handling** - Is there consistent error handling?
- [ ] **Validation** - Is input being validated?
- [ ] **Response format** - Is there a consistent response format?

---

## Expected Output

After reviewing the codebase, produce a report with:

### 1. Current State Assessment

```markdown
## Current State

### Files Reviewed
- [ ] List key files in the visit service

### Database Access
- Direct queries: [list any]
- API calls: [list any]
- Data models: [list schemas/types used]

### Identity Handling
- Authentication: [Clerk/other/none]
- User fields stored: [list]
- Issues: [list any PID usage, missing GUID, etc.]
```

### 2. Gap Analysis

```markdown
## Gap Analysis

### Missing for Continuum Model
| Requirement | Current State | Gap |
|-------------|---------------|-----|
| ContinuumMark creation | [status] | [gap] |
| MarkSubject linking | [status] | [gap] |
| MarkParty tracking | [status] | [gap] |
| Timeline queries | [status] | [gap] |

### Missing for API-Based Architecture
| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Visit CRUD routes | [status] | [gap] |
| Trip routes | [status] | [gap] |
| Proper auth middleware | [status] | [gap] |
| Identity resolution | [status] | [gap] |
```

### 3. Implementation Plan

```markdown
## Implementation Plan

### Phase 1: API Foundation
1. [ ] Create/update route structure
2. [ ] Implement auth middleware
3. [ ] Add identity resolution

### Phase 2: Continuum Integration
1. [ ] Add ContinuumMark creation
2. [ ] Add MarkSubject linking
3. [ ] Add MarkParty tracking

### Phase 3: Trip Integration
1. [ ] Add Trips table interaction
2. [ ] Link trips to visits
3. [ ] Add mileage calculation

### Phase 4: Frontend Updates
1. [ ] Update forms to use new APIs
2. [ ] Add trip creation UI
3. [ ] Update visit list/detail views
```

### 4. Code Changes Required

```markdown
## Code Changes Required

### New Files Needed
- `routes/visits.ts` - Visit API routes
- `routes/trips.ts` - Trip API routes
- `services/continuum.ts` - Continuum mark creation
- `services/identity.ts` - Identity resolution
- `middleware/auth.ts` - Authentication middleware

### Files to Modify
- [List existing files that need changes]

### Database Changes
- [List any schema changes needed in RadiusBifrost]
```

---

## Questions to Answer

As you review, answer these questions:

1. **Where does visit data currently live?** (Database table, localStorage, external API?)
2. **How are users identified?** (Clerk ID, email, PID, GUID?)
3. **Is there existing trip/mileage functionality?** (If so, where?)
4. **What's the current form structure?** (React components, form libraries?)
5. **Are there any existing API routes?** (If so, what patterns do they follow?)
6. **Is there a shared API client?** (Axios instance, fetch wrapper?)
7. **What testing exists?** (Unit tests, integration tests?)

---

## Reference Documents

These documents contain additional context:

| Document | Location | Purpose |
|----------|----------|---------|
| Identity Architecture | `/home/claude/USER-IDENTITY-ARCHITECTURE.md` | GUID-based identity patterns |
| Visit Schema | RadiusBifrost | ContinuumMark, Trips tables |
| Workforce Integration | `/home/claude/workforce-implementation-spec-UPDATED.md` | Trip/workforce patterns |

---

## Start Here

1. **Clone and checkout the test branch**
2. **Explore the directory structure** - Identify where visit-related code lives
3. **Read the package.json** - Identify dependencies and scripts
4. **Trace the visit flow** - From UI to data storage
5. **Document findings** using the templates above
6. **Propose implementation plan** based on gaps identified

Good luck! 🚀
