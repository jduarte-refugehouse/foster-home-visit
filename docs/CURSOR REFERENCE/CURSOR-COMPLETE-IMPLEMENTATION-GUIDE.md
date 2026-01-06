# Visit Service Upgrade - Complete Implementation Guide for Cursor AI

**Generated:** 2026-01-03
**Database Schema:** COMPLETED (migrations already applied)

---

## REPOSITORY STRUCTURE

The visit service is a Next.js monorepo. Key directories:

```
foster-home-visit/                    # Root of repository
├── app/                              # Next.js App Router
│   ├── api/                          # API routes (THIS IS WHERE MOST CHANGES GO)
│   │   ├── visit-forms/              # Visit form CRUD
│   │   │   ├── route.ts              # GET/POST visit forms
│   │   │   └── [id]/route.ts         # GET/PUT single form
│   │   ├── appointments/             # Appointment CRUD
│   │   │   ├── route.ts
│   │   │   └── [appointmentId]/route.ts
│   │   ├── travel-legs/              # Travel tracking
│   │   │   └── route.ts
│   │   ├── continuum/                # Continuum entries (needs migration)
│   │   │   └── entries/route.ts
│   │   ├── auth/                     # Authentication
│   │   └── radius/                   # Radius API Hub endpoints
│   └── (protected)/                  # Protected pages
├── lib/                              # Utilities (CREATE identity-resolver.ts HERE)
│   ├── microservice-config.ts        # Config for API routing decisions
│   └── api-cache-utils.ts
├── packages/                         # Shared packages
│   ├── radius-api-client/            # API client for admin.refugehouse.app
│   │   ├── client.ts                 # MODIFY THIS - add createVisit, createTrip
│   │   └── types.ts                  # MODIFY THIS - add new types
│   ├── shared-core/                  # Shared utilities
│   │   └── lib/
│   │       ├── db.ts                 # Database query function
│   │       └── auth-utils.ts         # Auth helpers
│   └── api-config/                   # API endpoint definitions
├── scripts/                          # SQL scripts
│   └── migrations/                   # Database migrations (ALREADY RAN)
└── docs/
    └── CURSOR REFERENCE/             # This documentation
```

### Admin Service (admin.refugehouse.app)

The API Hub endpoints need to be created in the **admin service** (separate repository/deployment):

```
admin.refugehouse.app/
├── app/
│   └── api/
│       └── radius/
│           ├── visits/route.ts       # CREATE THIS
│           └── trips/route.ts        # CREATE THIS
```

---

## YOUR TASK

Upgrade the visit service (visit.refugehouse.app) to:

1. **Use ContinuumMark tables** instead of local `continuum_entries` table
2. **Implement dual-source actor pattern** (ActorRadiusGuid/ActorEntityGuid)
3. **Route all CRUD operations** through admin.refugehouse.app API Hub

**DATABASE SCHEMA IS ALREADY UPDATED.** Do NOT run any SQL migrations.

---

## CRITICAL SCHEMA NOTES

The existing ContinuumMark table uses these column names (NOT what you might expect):

| Expected | Actual | Notes |
|----------|--------|-------|
| MarkTime | **MarkDate** | Use MarkDate for timestamps |
| IsDeleted | **IsArchived** (existing) + **IsDeleted** (new) | Filter on both |
| - | **ActorPID** | NOT NULL - use `0` for web-only users |
| - | **SourceSystem** | Set to `'VisitService'` for new marks |

---

## ARCHITECTURE

```
visit.refugehouse.app (this service)
        │
        │ API calls (for non-admin microservices)
        ▼
admin.refugehouse.app (API Hub)
        │
        │ Direct DB access
        ▼
RadiusBifrost (Azure SQL)
   ├── ContinuumMark (extended with GUID columns)
   ├── MarkSubject (extended)
   ├── MarkParty (extended)
   ├── Trips (new)
   ├── visit_forms (extended)
   ├── appointments (extended)
   └── travel_legs (extended)
```

---

## USER IDENTITY ARCHITECTURE

### Four User Types

| Type | ActorRadiusGuid | ActorEntityGuid | Resolution Path |
|------|-----------------|-----------------|-----------------|
| **Staff** | Populated | NULL | app_users.radius_person_guid → SyncRadiusUsers.guid |
| **Foster Parent** | Populated | Populated (same GUID) | app_users.radius_person_guid → EntityCommunicationBridge.EntityGUID |
| **Third-Party Pro** | NULL | Maybe populated | app_users.comm_bridge_id → EntityCommunicationBridge.CommunicationID |
| **System** | NULL | NULL | ActorName = 'SYSTEM' |

**Rule:** One or the other, never both. Both NULL = system action.

---

## IMPLEMENTATION PHASES

### Phase 1: Create Identity Resolver (Priority: HIGH)

**Create file:** `lib/identity-resolver.ts`

```typescript
/**
 * Identity Resolver - Implements dual-source actor pattern
 * Resolves Clerk users to RadiusGuid or EntityGuid
 */

import { query } from "@refugehouse/shared-core/db"

export interface UserIdentity {
  clerkId: string
  email: string
  name: string
  userType: 'staff' | 'foster_parent' | 'therapist' | 'external'

  // Dual-source identity (one or the other, never both)
  radiusGuid: string | null      // Staff + Foster parents
  entityGuid: string | null      // External via EntityCommunicationBridge
  commBridgeId: string | null    // For third-party pros
  fosterHomeGuid: string | null  // Foster parents only

  // Staff-specific (for PULSE compatibility)
  pid: number | null             // From SyncRadiusUsers
  unit: 'DAL' | 'SAN' | null     // From SyncRadiusUsers
}

export async function resolveUserIdentity(clerkUserId: string): Promise<UserIdentity> {
  // 1. Get app_user record
  const appUserResult = await query(
    `SELECT id, clerk_user_id, email, first_name, last_name,
            user_type, radius_person_guid, radius_foster_home_guid, comm_bridge_id
     FROM app_users
     WHERE clerk_user_id = @param0 AND is_active = 1`,
    [clerkUserId]
  )

  if (!appUserResult.length) {
    throw new Error(`User not found in app_users: ${clerkUserId}`)
  }

  const appUser = appUserResult[0]

  const identity: UserIdentity = {
    clerkId: clerkUserId,
    email: appUser.email,
    name: `${appUser.first_name || ''} ${appUser.last_name || ''}`.trim(),
    userType: appUser.user_type || 'external',
    radiusGuid: null,
    entityGuid: null,
    commBridgeId: appUser.comm_bridge_id || null,
    fosterHomeGuid: appUser.radius_foster_home_guid || null,
    pid: null,
    unit: null
  }

  // 2. Resolve based on user type
  if (appUser.user_type === 'staff' && appUser.radius_person_guid) {
    // Staff: radius_person_guid → SyncRadiusUsers.guid
    identity.radiusGuid = appUser.radius_person_guid

    const staffResult = await query(
      `SELECT DAL_personID, SAN_personID,
              CASE WHEN DAL_personID IS NOT NULL THEN 'DAL' ELSE 'SAN' END as Unit
       FROM SyncRadiusUsers
       WHERE guid = @param0`,
      [appUser.radius_person_guid]
    )

    if (staffResult.length) {
      identity.pid = staffResult[0].DAL_personID || staffResult[0].SAN_personID
      identity.unit = staffResult[0].Unit
    }
  } else if (appUser.user_type === 'foster_parent' && appUser.radius_person_guid) {
    // Foster Parent: radius_person_guid = EntityGUID (same value)
    identity.radiusGuid = appUser.radius_person_guid
    identity.entityGuid = appUser.radius_person_guid
  } else if (appUser.comm_bridge_id) {
    // Third-party: comm_bridge_id → EntityCommunicationBridge.CommunicationID
    const commBridgeResult = await query(
      `SELECT EntityGUID, EntityType, EntityFullName
       FROM EntityCommunicationBridge
       WHERE CommunicationID = @param0`,
      [appUser.comm_bridge_id]
    )

    if (commBridgeResult.length) {
      identity.entityGuid = commBridgeResult[0].EntityGUID || null
      identity.userType = commBridgeResult[0].EntityType || 'external'
    }
  }

  return identity
}

/**
 * Get actor fields for database insert/update
 */
export function getActorFields(identity: UserIdentity) {
  return {
    actorClerkId: identity.clerkId,
    actorRadiusGuid: identity.radiusGuid,
    actorEntityGuid: identity.entityGuid,
    actorCommBridgeId: identity.commBridgeId,
    actorName: identity.name,
    actorEmail: identity.email,
    actorUserType: identity.userType,
    actorPid: identity.pid || 0  // ActorPID is NOT NULL, use 0 for web-only
  }
}
```

---

### Phase 2: Create API Hub Endpoints (in admin.refugehouse.app)

**Create file:** `app/api/radius/visits/route.ts`

```typescript
/**
 * Visits API Hub - Creates ContinuumMark + MarkSubject + MarkParty
 * Route: admin.refugehouse.app/api/radius/visits
 */

import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { validateApiKey } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
  const apiKeyValidation = await validateApiKey(request)
  if (!apiKeyValidation.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    markDate,                    // Use MarkDate (existing column)
    markType = 'HOME_VISIT',
    fosterHomeGuid,
    fosterHomeName,
    fosterHomeXref,
    childGuids = [],
    notes,
    jsonPayload,
    unit,
    sourceSystem = 'VisitService',

    // Actor identity
    actorPid,
    actorClerkId,
    actorRadiusGuid,
    actorEntityGuid,
    actorCommBridgeId,
    actorName,
    actorEmail,
    actorUserType,

    parties = []
  } = body

  try {
    // 1. Create ContinuumMark
    const markResult = await query(
      `INSERT INTO ContinuumMark (
         MarkType, MarkDate, Unit, SourceSystem,
         ActorPID,
         ActorClerkId, ActorRadiusGuid, ActorEntityGuid, ActorCommBridgeId,
         ActorName, ActorEmail, ActorUserType,
         Notes, JsonPayload, MarkStatus, CreatedBy
       )
       OUTPUT INSERTED.MarkID
       VALUES (
         @param0, @param1, @param2, @param3,
         @param4,
         @param5, @param6, @param7, @param8,
         @param9, @param10, @param11,
         @param12, @param13, @param14, @param15
       )`,
      [
        markType, markDate, unit, sourceSystem,
        actorPid || 0,  // ActorPID is NOT NULL
        actorClerkId, actorRadiusGuid, actorEntityGuid, actorCommBridgeId,
        actorName, actorEmail, actorUserType,
        notes, JSON.stringify(jsonPayload), 'active', actorClerkId
      ]
    )

    const markId = markResult[0].MarkID

    // 2. Create MarkSubject for foster home
    await query(
      `INSERT INTO MarkSubject (MarkID, EntityGUID, EntityType, SubjectRole, EntityName, EntityXref)
       VALUES (@param0, @param1, 'facility', 'primary', @param2, @param3)`,
      [markId, fosterHomeGuid, fosterHomeName, fosterHomeXref]
    )

    // 3. Create MarkSubject for each child
    for (const child of childGuids) {
      await query(
        `INSERT INTO MarkSubject (MarkID, EntityGUID, EntityType, SubjectRole, EntityName)
         VALUES (@param0, @param1, 'child', 'participant', @param2)`,
        [markId, child.guid, child.name || null]
      )
    }

    // 4. Create MarkParty for each attendee
    for (const party of parties) {
      await query(
        `INSERT INTO MarkParty (
           MarkID, PartyName, PartyRole,
           EntityGUID, PartyRadiusGuid, PartyEntityGuid, PartyCommBridgeId,
           PartyType, PartyEmail, PartyPhone
         )
         VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9)`,
        [
          markId, party.name, party.role || 'PRESENT',
          party.entityGuid || null, party.radiusGuid || null,
          party.entityGuid || null, party.commBridgeId || null,
          party.type || 'unknown', party.email || null, party.phone || null
        ]
      )
    }

    return NextResponse.json({ success: true, markId }, { status: 201 })

  } catch (error) {
    console.error("Error creating visit mark:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const apiKeyValidation = await validateApiKey(request)
  if (!apiKeyValidation.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const homeGuid = searchParams.get('homeGuid')
  const staffGuid = searchParams.get('staffGuid')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let whereConditions = ["1=1"]
  const params: any[] = []
  let paramIndex = 0

  if (homeGuid) {
    whereConditions.push(`FosterHomeGuid = @param${paramIndex}`)
    params.push(homeGuid)
    paramIndex++
  }

  if (staffGuid) {
    whereConditions.push(`ActorRadiusGuid = @param${paramIndex}`)
    params.push(staffGuid)
    paramIndex++
  }

  if (startDate) {
    whereConditions.push(`MarkDate >= @param${paramIndex}`)
    params.push(startDate)
    paramIndex++
  }

  if (endDate) {
    whereConditions.push(`MarkDate <= @param${paramIndex}`)
    params.push(endDate)
    paramIndex++
  }

  // Use the vw_VisitDetails view
  const visits = await query(
    `SELECT * FROM vw_VisitDetails
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY MarkDate DESC`,
    params
  )

  return NextResponse.json({ success: true, visits })
}
```

**Create file:** `app/api/radius/trips/route.ts`

```typescript
/**
 * Trips API Hub
 * Route: admin.refugehouse.app/api/radius/trips
 */

import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { validateApiKey } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
  const apiKeyValidation = await validateApiKey(request)
  if (!apiKeyValidation.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    tripDate,
    staffClerkId,
    staffRadiusGuid,
    staffEmail,
    staffName,
    tripPurpose,
    originType,
    originAddress,
    destinationType,
    destinationAddress,
    destinationFosterHomeGuid,
    milesEstimated,
    milesActual,
    costCenterUnit,
    relatedMarkId
  } = body

  const result = await query(
    `INSERT INTO Trips (
       TripDate, StaffClerkId, StaffRadiusGuid, StaffEmail, StaffName,
       TripPurpose, OriginType, OriginAddress,
       DestinationType, DestinationAddress, DestinationFosterHomeGuid,
       MilesEstimated, MilesActual, CostCenterUnit, RelatedMarkID, TripStatus
     )
     OUTPUT INSERTED.TripID
     VALUES (
       @param0, @param1, @param2, @param3, @param4,
       @param5, @param6, @param7,
       @param8, @param9, @param10,
       @param11, @param12, @param13, @param14, 'completed'
     )`,
    [
      tripDate, staffClerkId, staffRadiusGuid, staffEmail, staffName,
      tripPurpose, originType, originAddress,
      destinationType, destinationAddress, destinationFosterHomeGuid,
      milesEstimated, milesActual, costCenterUnit, relatedMarkId
    ]
  )

  return NextResponse.json({ success: true, tripId: result[0].TripID }, { status: 201 })
}
```

---

### Phase 3: Update Radius API Client

**Modify:** `packages/radius-api-client/client.ts`

Add these methods:

```typescript
async createVisit(params: {
  markDate: string
  markType?: string
  fosterHomeGuid: string
  fosterHomeName?: string
  fosterHomeXref?: number
  childGuids?: Array<{ guid: string; name?: string }>
  notes?: string
  jsonPayload?: Record<string, any>
  unit: 'DAL' | 'SAN'
  sourceSystem?: string
  actorPid?: number
  actorClerkId: string
  actorRadiusGuid?: string | null
  actorEntityGuid?: string | null
  actorCommBridgeId?: string | null
  actorName: string
  actorEmail?: string
  actorUserType: string
  parties?: Array<{
    name: string
    role?: string
    radiusGuid?: string | null
    entityGuid?: string | null
    commBridgeId?: string | null
    type?: string
    email?: string
    phone?: string
  }>
}): Promise<{ markId: string }> {
  return this.apiRequest('/visits', {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

async getVisits(params?: {
  homeGuid?: string
  staffGuid?: string
  startDate?: string
  endDate?: string
}): Promise<any[]> {
  const queryString = new URLSearchParams(
    Object.entries(params || {}).filter(([_, v]) => v != null) as [string, string][]
  ).toString()
  const result = await this.apiRequest(`/visits${queryString ? `?${queryString}` : ''}`)
  return result.visits || []
}

async createTrip(params: {
  tripDate: string
  staffClerkId: string
  staffRadiusGuid?: string | null
  staffEmail: string
  staffName: string
  tripPurpose: string
  originType: string
  originAddress?: string
  destinationType: string
  destinationAddress?: string
  destinationFosterHomeGuid?: string
  milesEstimated?: number
  milesActual?: number
  costCenterUnit: 'DAL' | 'SAN'
  relatedMarkId?: string
}): Promise<{ tripId: string }> {
  return this.apiRequest('/trips', {
    method: 'POST',
    body: JSON.stringify(params)
  })
}
```

---

### Phase 4: Migrate Visit Service Endpoints

**Modify:** `app/api/visit-forms/route.ts`

Update POST handler:

```typescript
import { resolveUserIdentity, getActorFields } from "@/lib/identity-resolver"
import { shouldUseRadiusApiClient } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const useApiClient = shouldUseRadiusApiClient()

  // Always resolve user identity
  const identity = await resolveUserIdentity(body.createdByUserId)
  const actorFields = getActorFields(identity)

  if (useApiClient) {
    // Non-admin: Create ContinuumMark via API Hub
    const visitResult = await radiusApiClient.createVisit({
      markDate: `${body.visitDate}T${body.visitTime}`,
      markType: 'HOME_VISIT',
      fosterHomeGuid: body.homeGuid,
      fosterHomeName: body.homeName,
      fosterHomeXref: body.homeXref,
      childGuids: body.childGuids || [],
      notes: body.notes,
      jsonPayload: {
        visitInfo: body.visitInfo,
        familyInfo: body.familyInfo,
        attendees: body.attendees,
        observations: body.observations,
        recommendations: body.recommendations,
        homeEnvironment: body.homeEnvironment,
        childInterviews: body.childInterviews,
        parentInterviews: body.parentInterviews,
        complianceReview: body.complianceReview,
        signatures: body.signatures
      },
      unit: identity.unit || 'DAL',
      sourceSystem: 'VisitService',
      ...actorFields,
      parties: (body.attendees?.list || []).map(attendee => ({
        name: attendee.name,
        role: 'PRESENT',
        entityGuid: attendee.entityGuid || null,
        type: attendee.type || 'unknown'
      }))
    })

    console.log(`Created ContinuumMark: ${visitResult.markId}`)
  }

  // Continue with existing visit_forms INSERT, but add actor fields:
  // actor_radius_guid = actorFields.actorRadiusGuid
  // actor_entity_guid = actorFields.actorEntityGuid
  // actor_user_type = actorFields.actorUserType

  // ... rest of existing logic
}
```

---

## DATABASE SCHEMA REFERENCE

### ContinuumMark (Extended)

```sql
-- Existing (PULSE)
MarkID, MarkType, MarkDate, ActorPID, SourceSystem, Unit, Notes, MarkContext, CreatedAt, IsArchived

-- Added (Visit Service)
ActorClerkId, ActorRadiusGuid, ActorEntityGuid, ActorCommBridgeId,
ActorName, ActorEmail, ActorUserType,
JsonPayload, MarkStatus, CreatedBy, UpdatedAt, UpdatedBy,
IsDeleted, DeletedAt, DeletedBy
```

### MarkSubject (Extended)

```sql
-- Existing
MarkSubjectID, MarkID, EntityGUID, EntityType, EntityPID, SubjectRole

-- Added
EntityName, EntityXref, CreatedAt
```

### MarkParty (Extended)

```sql
-- Existing
MarkPartyID, MarkID, PartyName, PartyRole, ContactMethod, ContactAddress, EntityGUID, EntityType, EntityPID

-- Added
PartyRadiusGuid, PartyEntityGuid, PartyCommBridgeId, PartyType, PartyEmail, PartyPhone, CreatedAt
```

### Trips (New)

```sql
TripID, TripDate, StaffClerkId, StaffRadiusGuid, StaffEmail, StaffName,
TripPurpose, OriginType, OriginAddress, DestinationType, DestinationAddress,
DestinationFosterHomeGuid, MilesEstimated, MilesActual, CostCenterUnit,
RelatedMarkID, TripStatus, IsDeleted
```

### Views Available

- `vw_VisitDetails` - Visits with home/children/trip info
- `vw_EntityTimeline` - Timeline for any entity

---

## FILES TO CREATE

| Exact Path | Purpose |
|------------|---------|
| `lib/identity-resolver.ts` | User identity resolution (dual-source pattern) |
| **In admin.refugehouse.app repo:** | |
| `app/api/radius/visits/route.ts` | Visits API Hub endpoint |
| `app/api/radius/trips/route.ts` | Trips API Hub endpoint |

## FILES TO MODIFY

| Exact Path | Changes |
|------------|---------|
| `packages/radius-api-client/client.ts` | Add createVisit, getVisits, createTrip methods |
| `packages/radius-api-client/types.ts` | Add ContinuumMark, MarkSubject, MarkParty, Trip, UserIdentity types |
| `app/api/visit-forms/route.ts` | Import identity resolver, resolve identity, create ContinuumMark via API, add actor_radius_guid/actor_entity_guid/actor_user_type to INSERT |
| `app/api/visit-forms/[id]/route.ts` | Add actor fields on UPDATE |
| `app/api/appointments/route.ts` | Import identity resolver, add actor fields and assigned_to_radius_guid |
| `app/api/appointments/[appointmentId]/route.ts` | Add actor fields on UPDATE |
| `app/api/travel-legs/route.ts` | Add staff_radius_guid field |
| `app/api/continuum/entries/route.ts` | Migrate to use ContinuumMark table instead of continuum_entries (via API Hub)

---

## TESTING CHECKLIST

- [ ] Identity resolution works for staff (returns radiusGuid, pid, unit)
- [ ] Identity resolution works for foster parents (returns radiusGuid = entityGuid)
- [ ] Identity resolution works for third-party pros (returns entityGuid via commBridgeId)
- [ ] ContinuumMark created with ActorPID = 0 for web users
- [ ] ContinuumMark created with SourceSystem = 'VisitService'
- [ ] MarkSubject created for foster home (EntityType = 'facility')
- [ ] MarkSubject created for children (EntityType = 'child')
- [ ] MarkParty created for attendees
- [ ] Trips linked via RelatedMarkID
- [ ] vw_VisitDetails returns data correctly
- [ ] Non-admin microservices route through API Hub

---

## START HERE

1. Create `lib/identity-resolver.ts`
2. Create `app/api/radius/visits/route.ts` in admin service
3. Create `app/api/radius/trips/route.ts` in admin service
4. Update `packages/radius-api-client/client.ts`
5. Update `app/api/visit-forms/route.ts` to use identity resolver and create marks
