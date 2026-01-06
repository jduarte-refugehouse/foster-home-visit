# User Identity Architecture - Refuge House Systems

## Core Principle: Dual-Source Actor Pattern

Every action in the system is attributed to an actor using **two mutually exclusive GUID fields** that reference existing authoritative sources:

| Field | Source Table | Used For |
|-------|--------------|----------|
| `ActorRadiusGuid` | SyncRadiusUsers.guid | Staff (@refugehouse.org) |
| `ActorEntityGuid` | EntityCommunicationBridge.EntityGUID | External parties |

**Plus a denormalized name for display:**
| Field | Purpose |
|-------|---------|
| `ActorName` | Always populated - no joins needed for display |

---

## The Two Authoritative Sources

### SyncRadiusUsers (Staff Identity)

Staff members with @refugehouse.org emails. Bridges GUID to unit-specific PersonIDs.

```sql
-- SyncRadiusUsers
email           VARCHAR(100) PK      -- @refugehouse.org
commonName      VARCHAR(100)
guid            UNIQUEIDENTIFIER     -- person.Guid (THE KEY)
DAL_personID    INT                  -- PID in radius (Dallas)
SAN_personID    INT                  -- PID in radiusrhsa (San Antonio)
```

**Resolution**: `ActorRadiusGuid` → `SyncRadiusUsers.guid` → `DAL_personID` or `SAN_personID`

### EntityCommunicationBridge (External Identity)

All external parties - foster parents, therapists, DFPS workers, etc. Manages contact info and legal compliance.

```sql
-- EntityCommunicationBridge
CommunicationID           UNIQUEIDENTIFIER PK
EntityGUID                UNIQUEIDENTIFIER     -- THE KEY (always populated)
EntityFullName            NVARCHAR(255)
PrimaryMobilePhoneE164    VARCHAR(20)
EmailAddress              NVARCHAR(255)
FosterHomeGUID            UNIQUEIDENTIFIER NULL
EntityType                NVARCHAR(50)         -- 'foster_parent', 'therapist', etc.
-- Legal/Consent
TermsAcceptedDate         DATETIME2
PrivacyAcceptedDate       DATETIME2
SMSConsentDate            DATETIME2
SMSOptOut                 BIT
```

**Resolution**: `ActorEntityGuid` → `EntityCommunicationBridge.EntityGUID`

**Note**: EntityGUID is ALWAYS populated. For Radius-managed contacts (foster parents), it equals their on-prem `person.Guid`. For non-Radius contacts (therapists), we generate/assign a GUID.

---

## Standard Actor Fields

Apply this pattern to any table that needs to track who performed an action:

```sql
-- Standard actor columns
[ActorRadiusGuid]   UNIQUEIDENTIFIER NULL,     -- Staff (→ SyncRadiusUsers.guid)
[ActorEntityGuid]   UNIQUEIDENTIFIER NULL,     -- External (→ EntityCommBridge.EntityGUID)
[ActorName]         NVARCHAR(255) NOT NULL,    -- Denormalized display name
```

### Usage by Actor Type

| Actor | ActorRadiusGuid | ActorEntityGuid | ActorName |
|-------|-----------------|-----------------|-----------|
| Staff | ✅ Populated | NULL | 'Jane Smith' |
| External | NULL | ✅ Populated | 'John Foster' |
| System/Automated | NULL | NULL | 'SYSTEM' |

**Rule**: One or the other, never both. Both NULL = system action.

---

## Single Query Resolution

```sql
-- Get full actor details from any record with actor fields
SELECT 
    m.*,
    -- Resolved name (prefer source, fall back to denormalized)
    COALESCE(s.commonName, e.EntityFullName, m.ActorName) AS ResolvedActorName,
    -- Staff details
    s.email AS StaffEmail,
    s.DAL_personID,
    s.SAN_personID,
    -- External details
    e.EntityType,
    e.FosterHomeGUID,
    e.PrimaryMobilePhoneE164,
    e.EmailAddress,
    -- Actor type derived from data
    CASE 
        WHEN m.ActorRadiusGuid IS NOT NULL THEN 'staff'
        WHEN m.ActorEntityGuid IS NOT NULL THEN 'external'
        ELSE 'system'
    END AS ActorType
FROM SomeTable m
LEFT JOIN SyncRadiusUsers s ON m.ActorRadiusGuid = s.guid
LEFT JOIN EntityCommunicationBridge e ON m.ActorEntityGuid = e.EntityGUID;
```

---

## app_users: Clerk Login Layer

The `app_users` table is specifically for Clerk-based authentication to microservice apps. It references one of the two authoritative sources:

```sql
-- app_users (Clerk login credentials)
clerk_user_id             NVARCHAR(255) UNIQUE  -- From Clerk
email                     NVARCHAR(255)
first_name, last_name     NVARCHAR(100)
user_type                 NVARCHAR(50)          -- 'staff', 'foster_parent', etc.

-- Links to authoritative source
radius_person_guid        UNIQUEIDENTIFIER NULL -- Staff → SyncRadiusUsers.guid
comm_bridge_id            UNIQUEIDENTIFIER NULL -- External → EntityCommBridge.CommunicationID
radius_foster_home_guid   UNIQUEIDENTIFIER NULL -- Foster parents → their home
```

**When creating records from a Clerk session:**

```typescript
async function getActorFromClerk(clerkUser: ClerkUser) {
  const appUser = await db.appUsers.findUnique({
    where: { clerk_user_id: clerkUser.id }
  });
  
  if (appUser.user_type === 'staff') {
    return {
      actorRadiusGuid: appUser.radius_person_guid,
      actorEntityGuid: null,
      actorName: `${appUser.first_name} ${appUser.last_name}`.trim()
    };
  } else {
    // External user - get EntityGUID from EntityCommunicationBridge
    const contact = await db.entityCommunicationBridge.findFirst({
      where: { CommunicationID: appUser.comm_bridge_id }
    });
    return {
      actorRadiusGuid: null,
      actorEntityGuid: contact.EntityGUID,
      actorName: contact.EntityFullName
    };
  }
}
```

---

## Authentication Methods

| Method | Actor Resolution |
|--------|------------------|
| **Clerk Login** | app_users → radius_person_guid (staff) or comm_bridge_id → EntityGUID (external) |
| **Passwordless (magic link)** | EntityCommunicationBridge lookup by email → EntityGUID |
| **PULSE tokenized link** | Token contains EntityGUID directly |
| **SMS Response** | EntityCommunicationBridge lookup by phone → EntityGUID |

All paths resolve to either a RadiusGuid (staff) or EntityGuid (external).

---

## Applying to Existing Tables

### ContinuumMark

```sql
-- Add/verify these columns exist
[ActorRadiusGuid]   UNIQUEIDENTIFIER NULL,
[ActorEntityGuid]   UNIQUEIDENTIFIER NULL,
[ActorName]         NVARCHAR(255) NOT NULL,
```

### Trips

```sql
-- Staff-only table
[StaffRadiusGuid]   UNIQUEIDENTIFIER NOT NULL,  -- → SyncRadiusUsers.guid
[StaffName]         NVARCHAR(255) NOT NULL,
[StaffEmail]        NVARCHAR(255) NOT NULL,     -- For contact/notifications
```

### workforce_days

```sql
[staff_radius_guid] UNIQUEIDENTIFIER NOT NULL,  -- → SyncRadiusUsers.guid
[staff_name]        NVARCHAR(255) NOT NULL,
[staff_email]       NVARCHAR(255) NOT NULL,
```

### MarkParty (participants in events)

```sql
[PartyRadiusGuid]   UNIQUEIDENTIFIER NULL,    -- If staff
[PartyEntityGuid]   UNIQUEIDENTIFIER NULL,    -- If external
[PartyName]         NVARCHAR(255) NOT NULL,
[PartyRole]         NVARCHAR(50) NOT NULL,    -- 'PRESENT', 'NOTIFIED', etc.
```

### appointments

```sql
-- Staff-only assignment
[assigned_to_radius_guid]  UNIQUEIDENTIFIER NULL,  -- → SyncRadiusUsers.guid
[assigned_to_name]         NVARCHAR(255) NULL,     -- Denormalized display

-- DEPRECATED - do not use in new code:
-- [assigned_to_user_id]   -- Contains Clerk IDs, will be removed
```

---

## Cross-System Queries

### PULSE needs trips for a staff member (knows PID)

```sql
-- Find staff GUID from PID, then query Trips
DECLARE @StaffGuid UNIQUEIDENTIFIER;
SELECT @StaffGuid = guid 
FROM SyncRadiusUsers 
WHERE DAL_personID = @PID OR SAN_personID = @PID;

SELECT * FROM Trips WHERE StaffRadiusGuid = @StaffGuid;
```

### Find all actions by a foster parent

```sql
SELECT m.*, e.FosterHomeName
FROM ContinuumMark m
JOIN EntityCommunicationBridge e ON m.ActorEntityGuid = e.EntityGUID
WHERE e.FosterHomeGUID = @HomeGuid;
```

### Find all actions by anyone (staff or external)

```sql
SELECT 
    m.MarkTime,
    m.MarkType,
    m.ActorName,
    CASE 
        WHEN m.ActorRadiusGuid IS NOT NULL THEN 'Staff'
        ELSE e.EntityType
    END AS ActorCategory,
    s.email AS StaffEmail,
    e.PrimaryMobilePhoneE164 AS ExternalPhone
FROM ContinuumMark m
LEFT JOIN SyncRadiusUsers s ON m.ActorRadiusGuid = s.guid
LEFT JOIN EntityCommunicationBridge e ON m.ActorEntityGuid = e.EntityGUID
ORDER BY m.MarkTime DESC;
```

---

## Summary: The Rules

1. **Two GUID fields, mutually exclusive**: `ActorRadiusGuid` (staff) OR `ActorEntityGuid` (external)
2. **Existing sources remain authoritative**: SyncRadiusUsers for staff, EntityCommunicationBridge for external
3. **Always denormalize name**: No joins needed for simple display
4. **app_users is just for Clerk login**: It references one of the two sources
5. **EntityGUID is always populated**: Radius-managed get person.Guid, others get assigned GUID
6. **Single query can resolve both**: LEFT JOIN to both source tables

---

## Schema Updates Required

| Table | Columns to Add | Notes |
|-------|---------------|-------|
| app_users | `comm_bridge_id UNIQUEIDENTIFIER NULL` | Links external Clerk users to EntityCommBridge |
| ContinuumMark | `ActorRadiusGuid`, `ActorEntityGuid` | Verify ActorName exists |
| Trips | `StaffRadiusGuid` | NOT NULL - staff identity |
| workforce_days | `staff_radius_guid` | NOT NULL - staff identity |
| MarkParty | `PartyRadiusGuid`, `PartyEntityGuid` | Mutually exclusive |
| appointments | `assigned_to_radius_guid` | Migrated from assigned_to_user_id |

### Deprecated Columns (do not use in new code)

| Table | Column | Replacement |
|-------|--------|-------------|
| appointments | `assigned_to_user_id` | `assigned_to_radius_guid` |

---

## Validation Checklist

- [ ] All staff have SyncRadiusUsers records with guid populated
- [ ] All external contacts have EntityCommunicationBridge records with EntityGUID populated
- [ ] app_users.radius_person_guid populated for staff
- [ ] app_users.comm_bridge_id populated for external users with Clerk login
- [ ] appointments.assigned_to_radius_guid populated (migrated from assigned_to_user_id)
- [ ] New tables use dual-source actor pattern
- [ ] Existing tables migrated to dual-source pattern where applicable
