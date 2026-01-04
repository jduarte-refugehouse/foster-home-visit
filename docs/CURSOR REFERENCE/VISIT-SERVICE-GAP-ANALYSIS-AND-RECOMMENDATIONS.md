# Visit Service Gap Analysis & Cursor AI Implementation Recommendations

**Generated:** 2026-01-03
**Updated:** 2026-01-03 (Schema migration completed)
**Reviewed Against:** CURSOR-VISIT-SERVICE-REVIEW-INSTRUCTIONS.md, USER-IDENTITY-ARCHITECTURE.md, CURSOR-TRANSFER-PROMPT.md

---

## Executive Summary

The visit.refugehouse.app microservice requires updates to comply with three key architectural requirements:

1. **Continuum Model Integration** - Events must become ContinuumMarks with linked subjects/parties
2. **User Identity Architecture** - Implement dual-source actor pattern (ActorRadiusGuid/ActorEntityGuid)
3. **API-Based Data Access** - Route all CRUD operations through admin.refugehouse.app

### Database Schema Status: COMPLETED

The following database migrations have been applied:
- `001-add-continuum-and-identity-columns.sql` - Added dual-source columns to visit_forms, appointments, travel_legs
- `002-extend-continuum-tables-for-visit-service.sql` - Extended existing ContinuumMark, MarkSubject, MarkParty tables

---

## Current Database Schema

### ContinuumMark Table (Extended)

The ContinuumMark table now supports **both** PULSE (PID-based) and Visit Service (GUID-based) identity patterns:

```sql
-- Existing columns (PULSE compatibility)
MarkID              UNIQUEIDENTIFIER PK
MarkType            NVARCHAR(50) NOT NULL      -- 'HOME_VISIT', 'CONTACT_PHONE', etc.
MarkDate            DATETIME2 NOT NULL         -- When the event occurred
ActorPID            INT NOT NULL               -- Staff PID (PULSE system)
SourceSystem        NVARCHAR(50) NOT NULL      -- 'Pulse', 'VisitService', etc.
ContactMethod       NVARCHAR(20) NULL
ContactDirection    NVARCHAR(20) NULL
Notes               NVARCHAR(MAX) NULL
MarkContext         NVARCHAR(MAX) NULL
Unit                CHAR(3) NOT NULL           -- 'DAL' or 'SAN'
CreatedAt           DATETIME2 NOT NULL
IsArchived          BIT NOT NULL

-- NEW columns (Visit Service - added by migration)
ActorClerkId        NVARCHAR(255) NULL         -- Clerk user ID
ActorRadiusGuid     UNIQUEIDENTIFIER NULL      -- Staff/foster parent GUID
ActorEntityGuid     UNIQUEIDENTIFIER NULL      -- External party GUID
ActorCommBridgeId   UNIQUEIDENTIFIER NULL      -- Third-party pro CommunicationID
ActorName           NVARCHAR(255) NULL         -- Denormalized display name
ActorEmail          NVARCHAR(255) NULL
ActorUserType       NVARCHAR(50) NULL          -- 'staff', 'foster_parent', 'therapist'
JsonPayload         NVARCHAR(MAX) NULL         -- Structured visit form data
MarkStatus          NVARCHAR(20) NULL          -- 'active', 'cancelled', 'superseded'
CreatedBy           NVARCHAR(255) NULL
UpdatedAt           DATETIME2 NULL
UpdatedBy           NVARCHAR(255) NULL
IsDeleted           BIT DEFAULT 0
DeletedAt           DATETIME2 NULL
DeletedBy           NVARCHAR(255) NULL
```

### MarkSubject Table (Extended)

```sql
-- Existing columns
MarkSubjectID       UNIQUEIDENTIFIER PK
MarkID              UNIQUEIDENTIFIER NOT NULL  -- FK to ContinuumMark
EntityGUID          UNIQUEIDENTIFIER NOT NULL  -- PersonGUID, FacilityGUID, etc.
EntityType          NVARCHAR(50) NOT NULL      -- 'facility', 'child', 'person'
EntityPID           INT NULL                   -- PID for PULSE compatibility
SubjectRole         NVARCHAR(50) NOT NULL      -- 'primary', 'participant', 'observer'

-- NEW columns (added by migration)
EntityName          NVARCHAR(255) NULL         -- Denormalized display name
EntityXref          INT NULL                   -- home_xref for quick lookups
CreatedAt           DATETIME2 DEFAULT GETDATE()
```

### MarkParty Table (Extended)

```sql
-- Existing columns
MarkPartyID         UNIQUEIDENTIFIER PK
MarkID              UNIQUEIDENTIFIER NOT NULL  -- FK to ContinuumMark
PartyName           NVARCHAR(255) NOT NULL     -- Display name
PartyRole           NVARCHAR(50) NOT NULL      -- 'PRESENT', 'NOTIFIED', 'ABSENT'
ContactMethod       NVARCHAR(20) NULL
ContactAddress      NVARCHAR(255) NULL
EntityGUID          UNIQUEIDENTIFIER NULL      -- Already existed
EntityType          NVARCHAR(50) NULL
EntityPID           INT NULL                   -- PID for PULSE compatibility

-- NEW columns (added by migration)
PartyRadiusGuid     UNIQUEIDENTIFIER NULL      -- Staff/foster parent GUID
PartyEntityGuid     UNIQUEIDENTIFIER NULL      -- External party GUID
PartyCommBridgeId   UNIQUEIDENTIFIER NULL      -- Third-party pro CommunicationID
PartyType           NVARCHAR(50) NULL          -- 'foster_parent', 'child', 'dfps', 'therapist'
PartyEmail          NVARCHAR(255) NULL
PartyPhone          NVARCHAR(20) NULL
CreatedAt           DATETIME2 DEFAULT GETDATE()
```

### Trips Table (New)

```sql
TripID                      UNIQUEIDENTIFIER PK
TripDate                    DATE NOT NULL
StaffClerkId                NVARCHAR(255) NOT NULL
StaffRadiusGuid             UNIQUEIDENTIFIER NULL
StaffEmail                  NVARCHAR(255) NOT NULL
StaffName                   NVARCHAR(255) NOT NULL
TripPurpose                 NVARCHAR(100) NOT NULL
OriginType                  NVARCHAR(50) NOT NULL
OriginAddress               NVARCHAR(500) NULL
DestinationType             NVARCHAR(50) NOT NULL
DestinationAddress          NVARCHAR(500) NULL
DestinationFosterHomeGuid   UNIQUEIDENTIFIER NULL
MilesEstimated              DECIMAL(8,2) NULL
MilesActual                 DECIMAL(8,2) NULL
CostCenterUnit              VARCHAR(3) NOT NULL
RelatedMarkID               UNIQUEIDENTIFIER NULL  -- FK to ContinuumMark
TripStatus                  NVARCHAR(50) DEFAULT 'planned'
IsDeleted                   BIT DEFAULT 0
```

### Extended Existing Tables

**visit_forms** - Added columns:
- `actor_radius_guid` UNIQUEIDENTIFIER NULL
- `actor_entity_guid` UNIQUEIDENTIFIER NULL
- `actor_user_type` NVARCHAR(50) NULL

**appointments** - Added columns:
- `actor_radius_guid` UNIQUEIDENTIFIER NULL
- `actor_entity_guid` UNIQUEIDENTIFIER NULL
- `actor_user_type` NVARCHAR(50) NULL
- `assigned_to_radius_guid` UNIQUEIDENTIFIER NULL

**travel_legs** - Added columns:
- `staff_radius_guid` UNIQUEIDENTIFIER NULL

**app_users** - Added columns:
- `comm_bridge_id` UNIQUEIDENTIFIER NULL

---

## Current State Analysis

### API Routing Status

| Endpoint | Current Routing | Required Routing | Status |
|----------|-----------------|------------------|--------|
| `GET /api/visit-forms` | API Client | API Client | ✅ Done |
| `POST /api/visit-forms` | Direct DB | API Hub | ❌ Needs Migration |
| `PUT /api/visit-forms/[id]` | Direct DB | API Hub | ❌ Needs Migration |
| `GET /api/appointments` | API Client | API Client | ✅ Done |
| `POST /api/appointments` | Direct DB | API Hub | ❌ Needs Migration |
| `PUT /api/appointments/[id]` | Direct DB | API Hub | ❌ Needs Migration |
| `GET/POST /api/travel-legs` | Direct DB | API Hub | ❌ Needs Migration |
| `POST /api/continuum/entries` | Direct DB (local table) | API Hub + ContinuumMark | ❌ Needs Migration |

---

## Implementation Recommendations for Cursor AI

### Phase 1: Identity Resolution Service (Priority: HIGH)

**File to Create:** `lib/identity-resolver.ts`

```typescript
/**
 * Identity Resolver - Implements USER-IDENTITY-ARCHITECTURE.md
 * Resolves Clerk users to dual-source actor pattern
 */

import { query } from "@refugehouse/shared-core/db"

export interface UserIdentity {
  clerkId: string
  email: string
  name: string
  userType: 'staff' | 'foster_parent' | 'therapist' | 'external'

  // Dual-source identity (one or the other, never both)
  radiusGuid: string | null      // Staff + Foster parents (has on-prem record)
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
    // Foster Parent: radius_person_guid → EntityCommunicationBridge.EntityGUID
    identity.radiusGuid = appUser.radius_person_guid
    identity.entityGuid = appUser.radius_person_guid
  } else if (appUser.comm_bridge_id) {
    // Third-party professional: comm_bridge_id → EntityCommunicationBridge.CommunicationID
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
    actorPid: identity.pid  // For PULSE compatibility
  }
}
```

### Phase 2: API Hub Routes for Visits (admin.refugehouse.app)

**File to Create:** `app/api/radius/visits/route.ts` (in admin service)

```typescript
/**
 * Visits API Hub - Creates ContinuumMark + MarkSubject + MarkParty
 * Route: admin.refugehouse.app/api/radius/visits
 *
 * IMPORTANT: Uses existing ContinuumMark schema with both PID and GUID fields
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
    // Visit data
    markDate,                    // Use MarkDate (existing column name)
    markType = 'HOME_VISIT',
    fosterHomeGuid,
    fosterHomeName,
    fosterHomeXref,
    childGuids = [],
    notes,
    jsonPayload,
    unit,
    sourceSystem = 'VisitService',

    // Actor identity (dual-source pattern)
    actorPid,                    // For PULSE compatibility
    actorClerkId,
    actorRadiusGuid,
    actorEntityGuid,
    actorCommBridgeId,
    actorName,
    actorEmail,
    actorUserType,

    // Parties present
    parties = []
  } = body

  try {
    // 1. Create ContinuumMark (using existing + new columns)
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
        actorPid || 0,  // ActorPID is NOT NULL, use 0 for web-only users
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
          markId,
          party.name,
          party.role || 'PRESENT',
          party.entityGuid || null,
          party.radiusGuid || null,
          party.entityGuid || null,
          party.commBridgeId || null,
          party.type || 'unknown',
          party.email || null,
          party.phone || null
        ]
      )
    }

    return NextResponse.json({
      success: true,
      markId,
      message: "Visit mark created successfully"
    }, { status: 201 })

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

  // Use the vw_VisitDetails view created by migration
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

  const visits = await query(
    `SELECT * FROM vw_VisitDetails
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY MarkDate DESC`,
    params
  )

  return NextResponse.json({ success: true, visits })
}
```

### Phase 3: Update Radius API Client Package

**File to Modify:** `packages/radius-api-client/client.ts`

Add these methods to the existing radiusApiClient:

```typescript
/**
 * Create a visit (ContinuumMark + MarkSubject + MarkParty)
 */
async createVisit(params: {
  markDate: string                    // ISO datetime
  markType?: string                   // Default: 'HOME_VISIT'
  fosterHomeGuid: string
  fosterHomeName?: string
  fosterHomeXref?: number
  childGuids?: Array<{ guid: string; name?: string }>
  notes?: string
  jsonPayload?: Record<string, any>
  unit: 'DAL' | 'SAN'
  sourceSystem?: string               // Default: 'VisitService'
  // Actor identity
  actorPid?: number                   // For PULSE compatibility
  actorClerkId: string
  actorRadiusGuid?: string | null
  actorEntityGuid?: string | null
  actorCommBridgeId?: string | null
  actorName: string
  actorEmail?: string
  actorUserType: string
  // Parties
  parties?: Array<{
    name: string
    role?: string                     // 'PRESENT', 'NOTIFIED', 'ABSENT'
    radiusGuid?: string | null
    entityGuid?: string | null
    commBridgeId?: string | null
    type?: string                     // 'foster_parent', 'child', 'dfps', etc.
    email?: string
    phone?: string
  }>
}): Promise<{ markId: string }> {
  return this.apiRequest('/visits', {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * Get visits with optional filtering
 */
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

/**
 * Create a trip linked to a visit
 */
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

**File to Modify:** `packages/radius-api-client/types.ts`

Add these types:

```typescript
export interface ContinuumMark {
  MarkID: string
  MarkType: string
  MarkDate: string                    // Note: MarkDate not MarkTime
  Unit: 'DAL' | 'SAN'
  SourceSystem: string
  // PID-based identity (PULSE)
  ActorPID: number
  // GUID-based identity (Visit Service)
  ActorClerkId: string | null
  ActorRadiusGuid: string | null
  ActorEntityGuid: string | null
  ActorCommBridgeId: string | null
  ActorName: string | null
  ActorEmail: string | null
  ActorUserType: string | null
  // Content
  Notes: string | null
  MarkContext: string | null
  JsonPayload: Record<string, any> | null
  MarkStatus: string | null
  // Audit
  CreatedAt: string
  CreatedBy: string | null
  IsArchived: boolean
  IsDeleted: boolean
}

export interface MarkSubject {
  MarkSubjectID: string
  MarkID: string
  EntityGUID: string
  EntityType: 'facility' | 'child' | 'person'
  EntityPID: number | null
  SubjectRole: 'primary' | 'participant' | 'observer'
  EntityName: string | null
  EntityXref: number | null
}

export interface MarkParty {
  MarkPartyID: string
  MarkID: string
  PartyName: string
  PartyRole: 'PRESENT' | 'NOTIFIED' | 'ABSENT' | 'VIRTUAL'
  EntityGUID: string | null
  EntityPID: number | null
  PartyRadiusGuid: string | null
  PartyEntityGuid: string | null
  PartyCommBridgeId: string | null
  PartyType: string | null
  PartyEmail: string | null
  PartyPhone: string | null
}

export interface Trip {
  TripID: string
  TripDate: string
  StaffClerkId: string
  StaffRadiusGuid: string | null
  StaffEmail: string
  StaffName: string
  TripPurpose: string
  OriginType: string
  DestinationType: string
  DestinationFosterHomeGuid: string | null
  MilesEstimated: number | null
  MilesActual: number | null
  CostCenterUnit: 'DAL' | 'SAN'
  RelatedMarkID: string | null
  TripStatus: string
  IsDeleted: boolean
}

export interface UserIdentity {
  clerkId: string
  email: string
  name: string
  userType: 'staff' | 'foster_parent' | 'therapist' | 'external'
  radiusGuid: string | null
  entityGuid: string | null
  commBridgeId: string | null
  fosterHomeGuid: string | null
  pid: number | null
  unit: 'DAL' | 'SAN' | null
}
```

### Phase 4: Migrate Visit Service Endpoints

**File to Modify:** `app/api/visit-forms/route.ts`

Update the POST handler to:
1. Resolve user identity using `resolveUserIdentity()`
2. Create ContinuumMark via API Hub (for non-admin)
3. Store actor GUID fields in visit_forms table

```typescript
import { resolveUserIdentity, getActorFields } from "@/lib/identity-resolver"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const useApiClient = shouldUseRadiusApiClient()

  // Resolve user identity (always do this)
  const identity = await resolveUserIdentity(body.createdByUserId)
  const actorFields = getActorFields(identity)

  if (useApiClient) {
    // Non-admin: Create visit via API Hub
    const visitResult = await radiusApiClient.createVisit({
      markDate: `${body.visitDate}T${body.visitTime}`,
      markType: 'HOME_VISIT',
      fosterHomeGuid: body.homeGuid,
      fosterHomeName: body.homeName,
      fosterHomeXref: body.homeXref,
      childGuids: body.childGuids || [],
      notes: body.notes,
      jsonPayload: {
        visitFormId: null,  // Will be updated after local save
        visitInfo: body.visitInfo,
        familyInfo: body.familyInfo,
        // ... other form sections
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

    // Also save to local visit_forms table with actor fields
    // ... existing INSERT logic, but add actor_radius_guid, actor_entity_guid, actor_user_type
  }

  // ... rest of existing logic
}
```

---

## Files Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `lib/identity-resolver.ts` | User identity resolution (dual-source pattern) |
| `admin: app/api/radius/visits/route.ts` | Visits API Hub endpoint |
| `admin: app/api/radius/trips/route.ts` | Trips API Hub endpoint |

### Files to Modify

| File | Changes |
|------|---------|
| `packages/radius-api-client/client.ts` | Add createVisit, getVisits, createTrip methods |
| `packages/radius-api-client/types.ts` | Add ContinuumMark, MarkSubject, MarkParty, Trip, UserIdentity types |
| `app/api/visit-forms/route.ts` | Use identity resolver, add actor fields, optionally create ContinuumMark |
| `app/api/visit-forms/[id]/route.ts` | Add actor fields on update |
| `app/api/appointments/route.ts` | Use identity resolver, add actor fields |
| `app/api/travel-legs/route.ts` | Add staff_radius_guid, route through API Hub |
| `app/api/continuum/entries/route.ts` | Migrate to use ContinuumMark table instead of continuum_entries |

### Database Schema - COMPLETED

| Table | Status | New Columns |
|-------|--------|-------------|
| `ContinuumMark` | ✅ Extended | ActorClerkId, ActorRadiusGuid, ActorEntityGuid, ActorCommBridgeId, ActorName, ActorEmail, ActorUserType, JsonPayload, MarkStatus, IsDeleted, etc. |
| `MarkSubject` | ✅ Extended | EntityName, EntityXref, CreatedAt |
| `MarkParty` | ✅ Extended | PartyRadiusGuid, PartyEntityGuid, PartyCommBridgeId, PartyType, PartyEmail, PartyPhone, CreatedAt |
| `Trips` | ✅ Created | Full schema with GUID-based staff identity |
| `visit_forms` | ✅ Extended | actor_radius_guid, actor_entity_guid, actor_user_type |
| `appointments` | ✅ Extended | actor_radius_guid, actor_entity_guid, actor_user_type, assigned_to_radius_guid |
| `travel_legs` | ✅ Extended | staff_radius_guid |
| `app_users` | ✅ Extended | comm_bridge_id |

---

## Key Schema Notes for Implementation

1. **Use `MarkDate` not `MarkTime`** - The existing column is named `MarkDate`

2. **ActorPID is NOT NULL** - When creating marks for web-only users without a PID, use `0` as a placeholder

3. **SourceSystem distinguishes origin** - Use `'VisitService'` for marks created by the visit app, `'Pulse'` for PULSE-created marks

4. **IsArchived vs IsDeleted** - PULSE uses `IsArchived`, Visit Service uses `IsDeleted`. Views filter on both.

5. **Views are available** - Use `vw_VisitDetails` and `vw_EntityTimeline` for querying

---

## Testing Checklist

- [ ] Identity resolution returns correct radiusGuid for staff users
- [ ] Identity resolution returns correct entityGuid for foster parents
- [ ] Identity resolution handles third-party professionals (commBridgeId only)
- [ ] Visit creation creates ContinuumMark with proper actor fields
- [ ] Visit creation sets ActorPID = 0 for web-only users
- [ ] Visit creation sets SourceSystem = 'VisitService'
- [ ] Visit creation creates MarkSubject for foster home
- [ ] Visit creation creates MarkSubject for each child
- [ ] Visit creation creates MarkParty for attendees
- [ ] Trip creation links to ContinuumMark via RelatedMarkID
- [ ] vw_VisitDetails returns expected data
- [ ] vw_EntityTimeline returns expected data
- [ ] All writes route through admin.refugehouse.app (non-admin microservices)

---

## Migration Order

1. ~~Deploy schema updates to RadiusBifrost~~ ✅ COMPLETED
2. **Create identity-resolver.ts** (safe - new file)
3. **Deploy API Hub endpoints** to admin.refugehouse.app
4. **Update radius-api-client** package
5. **Migrate visit-forms POST/PUT** - add actor fields, optionally create marks
6. **Migrate appointments POST/PUT** - add actor fields
7. **Migrate travel-legs** - add staff_radius_guid and API routing
8. **Migrate continuum/entries** - switch to ContinuumMark table
9. **Backfill existing records** with GUID fields (separate script)

---

**Note:** All code changes are backward-compatible. The dual-source actor fields are nullable, allowing gradual migration without breaking existing functionality. PULSE data continues to work via PID-based columns.
