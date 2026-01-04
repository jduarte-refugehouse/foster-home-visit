# Visit Service Upgrade - Cursor Transfer Prompt

Copy this prompt directly into Cursor to begin the review:

---

## PROMPT START

You are reviewing the **visit service** in the Refuge House monorepo. Your task is to analyze the current implementation and determine what changes are needed to:

1. **Support the Continuum model** - Events become ContinuumMarks, with linked subjects and parties
2. **Fully API-based data access** - All CRUD through admin.refugehouse.app APIs

### Architecture Context

**Database**: RadiusBifrost (Azure SQL) is the integration layer. Key tables:
- `ContinuumMark` - Point-in-time events (visits become marks)
- `MarkSubject` - Links marks to entities (children, homes)
- `MarkParty` - People involved (attendees, notified parties)
- `Trips` - Travel/mileage records linked to visits
- `app_users` - Clerk auth bridge with `radius_person_guid` and `comm_bridge_id`
- `SyncRadiusUsers` - Staff identity (Guid, PID, Unit)
- `EntityCommunicationBridge` - External contact identity

**Identity Pattern**: GUID-based with four user types:
- Staff: `app_users.radius_person_guid` → `SyncRadiusUsers.Guid`
- Foster Parent: `app_users.radius_person_guid` → `EntityCommunicationBridge.EntityGUID`
- Third-Party Pro: `app_users.comm_bridge_id` → `EntityCommunicationBridge.CommunicationID` (no RadiusGuid!)
- Unmanaged External: Referenced by name only or CommBridgeId

**Critical Rule**: Foster parents have on-prem `person.Guid` (so `EntityGUID` is populated). Third-party professionals do NOT have on-prem records (so `EntityGUID = NULL`, use `CommunicationID` instead).

### Required API Structure

```
admin.refugehouse.app/api/
├── visits/
│   ├── GET    /                  # List visits
│   ├── POST   /                  # Create visit → ContinuumMark + Trips
│   ├── GET    /:markId           # Get visit details
│   ├── PUT    /:markId           # Update visit
│   └── DELETE /:markId           # Cancel visit
├── trips/
│   ├── GET    /                  # List trips
│   ├── POST   /                  # Create trip
│   └── GET    /:tripId           # Get trip
└── continuum/
    ├── POST   /mark              # Create any mark
    └── GET    /timeline/:guid    # Entity timeline
```

### Visit → ContinuumMark Mapping

When a visit is created:
1. Create `ContinuumMark` with `MarkType = 'HOME_VISIT'`
2. Create `MarkSubject` for the foster home (EntityType = 'facility')
3. Create `MarkSubject` for each child present (EntityType = 'child')
4. Create `MarkParty` for each person present/notified
5. Optionally create `Trips` record if travel involved

Store on ContinuumMark:
- `ActorClerkId` - Clerk user ID (from auth)
- `ActorRadiusGuid` - For staff/foster parents
- `ActorCommBridgeId` - For third-party pros
- `ActorName` - Always store for display
- `ActorUserType` - 'staff', 'foster_parent', 'therapist', etc.

### Your Task

1. **Explore the codebase** - Find all visit-related code
2. **Document current state** - How are visits created/stored/retrieved?
3. **Identify gaps** - What's missing for Continuum/API requirements?
4. **Propose changes** - List files to create/modify

### Questions to Answer

1. Where does visit data currently live? (table, API, localStorage?)
2. How are users identified? (Clerk, email, PID, GUID?)
3. Is there trip/mileage tracking?
4. What API routes exist?
5. What form components are used?

### Output Format

Produce a structured report:

```markdown
## Current State Analysis

### Directory Structure
[Relevant paths]

### Data Access
- Database queries: [where/how]
- API calls: [endpoints used]
- Identity fields: [what's stored]

### Existing Visit Flow
[Trace from UI to storage]

## Gap Analysis

| Requirement | Current | Gap |
|-------------|---------|-----|
| ContinuumMark creation | | |
| MarkSubject linking | | |
| MarkParty tracking | | |
| Trip creation | | |
| GUID-based identity | | |
| API-only data access | | |

## Implementation Plan

### New Files
- [list]

### Files to Modify
- [list with specific changes]

### Database Changes
- [if any]
```

Begin by listing the contents of the project root and identifying the visit service directory.

## PROMPT END

---

## Additional Context Files

If Cursor needs more context, reference these:

1. **Full Identity Architecture**: See `USER-IDENTITY-ARCHITECTURE.md`
2. **ContinuumMark Schema**: Available in RadiusBifrost
3. **Trips Schema**: See `visit-app-schema-updates.sql`

## Key Gotchas to Watch For

1. **PID vs GUID**: Legacy code may use integer PIDs. Convert to GUIDs.
2. **Direct DB queries**: Should route through APIs instead.
3. **Missing identity resolution**: Ensure getUserIdentity pattern exists.
4. **Foster parent vs therapist**: Different identity bridges!
5. **Unit assignment**: 'DAL' or 'SAN' must be tracked on all records.
