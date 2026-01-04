-- ============================================================================
-- MIGRATION: Add Continuum Model and Dual-Source Identity Columns
-- Database: RadiusBifrost (Azure SQL)
-- Date: 2026-01-03
--
-- Purpose: Updates visit service tables to support:
--   1. Dual-source actor pattern (ActorRadiusGuid / ActorEntityGuid)
--   2. ContinuumMark integration for event tracking
--   3. Trips table for mileage/travel linked to visits
--
-- Run Order: This script should be run BEFORE deploying code changes
-- Rollback: See bottom of script for rollback statements
-- ============================================================================

PRINT '=== Starting Migration: Continuum and Identity Columns ==='
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120)
GO

-- ============================================================================
-- PART 1: UPDATE EXISTING TABLES WITH DUAL-SOURCE ACTOR COLUMNS
-- ============================================================================

PRINT ''
PRINT '--- Part 1: Adding dual-source actor columns to existing tables ---'
GO

-- -----------------------------------------------------------------------------
-- 1.1 visit_forms table
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visit_forms') AND name = 'actor_radius_guid')
BEGIN
    PRINT 'Adding actor_radius_guid to visit_forms...'
    ALTER TABLE visit_forms ADD actor_radius_guid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visit_forms') AND name = 'actor_entity_guid')
BEGIN
    PRINT 'Adding actor_entity_guid to visit_forms...'
    ALTER TABLE visit_forms ADD actor_entity_guid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visit_forms') AND name = 'actor_user_type')
BEGIN
    PRINT 'Adding actor_user_type to visit_forms...'
    ALTER TABLE visit_forms ADD actor_user_type NVARCHAR(50) NULL
END
GO

-- -----------------------------------------------------------------------------
-- 1.2 appointments table
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('appointments') AND name = 'actor_radius_guid')
BEGIN
    PRINT 'Adding actor_radius_guid to appointments...'
    ALTER TABLE appointments ADD actor_radius_guid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('appointments') AND name = 'actor_entity_guid')
BEGIN
    PRINT 'Adding actor_entity_guid to appointments...'
    ALTER TABLE appointments ADD actor_entity_guid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('appointments') AND name = 'actor_user_type')
BEGIN
    PRINT 'Adding actor_user_type to appointments...'
    ALTER TABLE appointments ADD actor_user_type NVARCHAR(50) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('appointments') AND name = 'assigned_to_radius_guid')
BEGIN
    PRINT 'Adding assigned_to_radius_guid to appointments...'
    ALTER TABLE appointments ADD assigned_to_radius_guid UNIQUEIDENTIFIER NULL
END
GO

-- -----------------------------------------------------------------------------
-- 1.3 travel_legs table
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('travel_legs') AND name = 'staff_radius_guid')
BEGIN
    PRINT 'Adding staff_radius_guid to travel_legs...'
    ALTER TABLE travel_legs ADD staff_radius_guid UNIQUEIDENTIFIER NULL
END
GO

-- -----------------------------------------------------------------------------
-- 1.4 app_users table - ensure comm_bridge_id exists
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('app_users') AND name = 'comm_bridge_id')
BEGIN
    PRINT 'Adding comm_bridge_id to app_users...'
    ALTER TABLE app_users ADD comm_bridge_id UNIQUEIDENTIFIER NULL
END
GO

PRINT 'Part 1 complete: Dual-source actor columns added'
GO

-- ============================================================================
-- PART 2: CREATE CONTINUUM MARK TABLES
-- ============================================================================

PRINT ''
PRINT '--- Part 2: Creating ContinuumMark tables ---'
GO

-- -----------------------------------------------------------------------------
-- 2.1 ContinuumMark - Point-in-time events (visits, contacts, approvals)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('ContinuumMark') AND type = 'U')
BEGIN
    PRINT 'Creating ContinuumMark table...'

    CREATE TABLE ContinuumMark (
        MarkID              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        MarkType            NVARCHAR(50) NOT NULL,          -- 'HOME_VISIT', 'CONTACT_PHONE', etc.
        MarkTime            DATETIME2 NOT NULL,             -- When the event occurred
        Unit                VARCHAR(3) NOT NULL,            -- 'DAL' or 'SAN'

        -- Actor identity (dual-source pattern: one or the other, never both)
        ActorClerkId        NVARCHAR(255) NULL,             -- Clerk user ID
        ActorRadiusGuid     UNIQUEIDENTIFIER NULL,          -- Staff or foster parent (has on-prem record)
        ActorEntityGuid     UNIQUEIDENTIFIER NULL,          -- External via EntityCommunicationBridge
        ActorCommBridgeId   UNIQUEIDENTIFIER NULL,          -- Third-party pro CommunicationID
        ActorName           NVARCHAR(255) NOT NULL,         -- Denormalized for display
        ActorEmail          NVARCHAR(255) NULL,
        ActorUserType       NVARCHAR(50) NULL,              -- 'staff', 'foster_parent', 'therapist', etc.

        -- Content
        Notes               NVARCHAR(MAX) NULL,
        JsonPayload         NVARCHAR(MAX) NULL,             -- Structured data (visit form content, etc.)

        -- Status
        MarkStatus          NVARCHAR(20) DEFAULT 'active',  -- 'active', 'cancelled', 'superseded'

        -- Audit
        CreatedAt           DATETIME2 DEFAULT GETDATE(),
        CreatedBy           NVARCHAR(255) NOT NULL,
        UpdatedAt           DATETIME2 NULL,
        UpdatedBy           NVARCHAR(255) NULL,

        -- Soft delete
        IsDeleted           BIT DEFAULT 0,
        DeletedAt           DATETIME2 NULL,
        DeletedBy           NVARCHAR(255) NULL,

        -- Constraints
        CONSTRAINT CK_ContinuumMark_Unit CHECK (Unit IN ('DAL', 'SAN')),
        CONSTRAINT CK_ContinuumMark_ActorExclusive CHECK (
            -- At least one actor identifier must be present
            ActorClerkId IS NOT NULL
            OR ActorRadiusGuid IS NOT NULL
            OR ActorEntityGuid IS NOT NULL
            OR ActorCommBridgeId IS NOT NULL
        )
    )

    PRINT 'ContinuumMark table created'
END
ELSE
BEGIN
    PRINT 'ContinuumMark table already exists, skipping...'
END
GO

-- -----------------------------------------------------------------------------
-- 2.2 MarkSubject - Links marks to entities (children, homes)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('MarkSubject') AND type = 'U')
BEGIN
    PRINT 'Creating MarkSubject table...'

    CREATE TABLE MarkSubject (
        SubjectID           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        MarkID              UNIQUEIDENTIFIER NOT NULL,
        EntityGUID          UNIQUEIDENTIFIER NOT NULL,      -- PersonGUID, FacilityGUID, etc.
        EntityType          NVARCHAR(50) NOT NULL,          -- 'facility', 'child', 'person'
        SubjectRole         NVARCHAR(50) NOT NULL,          -- 'primary', 'participant', 'observer'

        -- Optional denormalized info
        EntityName          NVARCHAR(255) NULL,
        EntityXref          INT NULL,                       -- home_xref or person PID for quick lookups

        -- Audit
        CreatedAt           DATETIME2 DEFAULT GETDATE(),

        -- Foreign key
        CONSTRAINT FK_MarkSubject_Mark FOREIGN KEY (MarkID) REFERENCES ContinuumMark(MarkID)
    )

    PRINT 'MarkSubject table created'
END
ELSE
BEGIN
    PRINT 'MarkSubject table already exists, skipping...'
END
GO

-- -----------------------------------------------------------------------------
-- 2.3 MarkParty - People involved in marks (attendees, notified parties)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('MarkParty') AND type = 'U')
BEGIN
    PRINT 'Creating MarkParty table...'

    CREATE TABLE MarkParty (
        PartyID             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        MarkID              UNIQUEIDENTIFIER NOT NULL,

        -- Party identity (dual-source pattern)
        PartyRadiusGuid     UNIQUEIDENTIFIER NULL,          -- Staff or foster parent
        PartyEntityGuid     UNIQUEIDENTIFIER NULL,          -- External party
        PartyCommBridgeId   UNIQUEIDENTIFIER NULL,          -- Third-party pro
        PartyName           NVARCHAR(255) NOT NULL,         -- Denormalized for display

        -- Party details
        PartyRole           NVARCHAR(50) NOT NULL,          -- 'PRESENT', 'NOTIFIED', 'ABSENT', 'VIRTUAL'
        PartyType           NVARCHAR(50) NULL,              -- 'foster_parent', 'child', 'dfps', 'therapist', etc.

        -- Optional contact info snapshot
        PartyEmail          NVARCHAR(255) NULL,
        PartyPhone          NVARCHAR(20) NULL,

        -- Audit
        CreatedAt           DATETIME2 DEFAULT GETDATE(),

        -- Foreign key
        CONSTRAINT FK_MarkParty_Mark FOREIGN KEY (MarkID) REFERENCES ContinuumMark(MarkID),

        -- Constraint: at least one identifier
        CONSTRAINT CK_MarkParty_Identity CHECK (
            PartyRadiusGuid IS NOT NULL
            OR PartyEntityGuid IS NOT NULL
            OR PartyCommBridgeId IS NOT NULL
            OR PartyName IS NOT NULL  -- Allow name-only for unmanaged external parties
        )
    )

    PRINT 'MarkParty table created'
END
ELSE
BEGIN
    PRINT 'MarkParty table already exists, skipping...'
END
GO

-- -----------------------------------------------------------------------------
-- 2.4 ContinuumSignal - Duration-based states (optional, for future use)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('ContinuumSignal') AND type = 'U')
BEGIN
    PRINT 'Creating ContinuumSignal table...'

    CREATE TABLE ContinuumSignal (
        SignalID            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        SignalType          NVARCHAR(50) NOT NULL,          -- 'SERVICE_PLAN', 'CREDENTIAL', 'PLACEMENT'
        EntityGUID          UNIQUEIDENTIFIER NOT NULL,      -- The entity this signal applies to
        EntityType          NVARCHAR(50) NOT NULL,          -- 'child', 'foster_home', 'staff'
        Unit                VARCHAR(3) NOT NULL,            -- 'DAL' or 'SAN'

        -- Duration
        StartDate           DATE NOT NULL,
        EndDate             DATE NULL,                      -- NULL = ongoing

        -- Status
        SignalStatus        NVARCHAR(20) DEFAULT 'active',  -- 'active', 'expired', 'cancelled'

        -- Content
        JsonPayload         NVARCHAR(MAX) NULL,
        Notes               NVARCHAR(MAX) NULL,

        -- Actor who created/modified
        ActorRadiusGuid     UNIQUEIDENTIFIER NULL,
        ActorEntityGuid     UNIQUEIDENTIFIER NULL,
        ActorName           NVARCHAR(255) NULL,

        -- Audit
        CreatedAt           DATETIME2 DEFAULT GETDATE(),
        CreatedBy           NVARCHAR(255) NOT NULL,
        UpdatedAt           DATETIME2 NULL,
        UpdatedBy           NVARCHAR(255) NULL,

        -- Constraints
        CONSTRAINT CK_ContinuumSignal_Unit CHECK (Unit IN ('DAL', 'SAN'))
    )

    PRINT 'ContinuumSignal table created'
END
ELSE
BEGIN
    PRINT 'ContinuumSignal table already exists, skipping...'
END
GO

PRINT 'Part 2 complete: ContinuumMark tables created'
GO

-- ============================================================================
-- PART 3: CREATE TRIPS TABLE
-- ============================================================================

PRINT ''
PRINT '--- Part 3: Creating Trips table ---'
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('Trips') AND type = 'U')
BEGIN
    PRINT 'Creating Trips table...'

    CREATE TABLE Trips (
        TripID                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TripDate                    DATE NOT NULL,

        -- Staff identity (staff-only table, uses dual-source for staff)
        StaffClerkId                NVARCHAR(255) NOT NULL,
        StaffRadiusGuid             UNIQUEIDENTIFIER NULL,      -- -> SyncRadiusUsers.guid
        StaffEmail                  NVARCHAR(255) NOT NULL,
        StaffName                   NVARCHAR(255) NOT NULL,

        -- Trip details
        TripPurpose                 NVARCHAR(100) NOT NULL,     -- 'Home Visit', 'Training', etc.

        -- Origin
        OriginType                  NVARCHAR(50) NOT NULL,      -- 'office', 'home', 'foster_home', 'other'
        OriginAddress               NVARCHAR(500) NULL,
        OriginLatitude              FLOAT NULL,
        OriginLongitude             FLOAT NULL,

        -- Destination
        DestinationType             NVARCHAR(50) NOT NULL,      -- 'office', 'home', 'foster_home', 'other'
        DestinationAddress          NVARCHAR(500) NULL,
        DestinationLatitude         FLOAT NULL,
        DestinationLongitude        FLOAT NULL,
        DestinationFosterHomeGuid   UNIQUEIDENTIFIER NULL,      -- If destination is a foster home

        -- Mileage
        MilesEstimated              DECIMAL(8,2) NULL,
        MilesActual                 DECIMAL(8,2) NULL,
        MilesManualOverride         DECIMAL(8,2) NULL,          -- User override

        -- Tolls/Costs
        EstimatedTollCost           DECIMAL(10,2) NULL,
        ActualTollCost              DECIMAL(10,2) NULL,

        -- Duration
        DepartureTime               TIME NULL,
        ArrivalTime                 TIME NULL,
        DurationMinutes             INT NULL,

        -- Cost allocation
        CostCenterUnit              VARCHAR(3) NOT NULL,        -- 'DAL' or 'SAN'
        CostCenterType              NVARCHAR(50) DEFAULT 'operations',

        -- Link to ContinuumMark (visit)
        RelatedMarkID               UNIQUEIDENTIFIER NULL,

        -- Status
        TripStatus                  NVARCHAR(50) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled'
        IsReimbursable              BIT DEFAULT 1,
        ReimbursementStatus         NVARCHAR(50) NULL,          -- 'pending', 'approved', 'paid'

        -- Audit
        CreatedAt                   DATETIME2 DEFAULT GETDATE(),
        CreatedBy                   NVARCHAR(255) NULL,
        UpdatedAt                   DATETIME2 NULL,
        UpdatedBy                   NVARCHAR(255) NULL,

        -- Soft delete
        IsDeleted                   BIT DEFAULT 0,
        DeletedAt                   DATETIME2 NULL,
        DeletedBy                   NVARCHAR(255) NULL,

        -- Constraints
        CONSTRAINT CK_Trips_CostCenterUnit CHECK (CostCenterUnit IN ('DAL', 'SAN')),
        CONSTRAINT FK_Trips_Mark FOREIGN KEY (RelatedMarkID) REFERENCES ContinuumMark(MarkID)
    )

    PRINT 'Trips table created'
END
ELSE
BEGIN
    PRINT 'Trips table already exists, skipping...'
END
GO

PRINT 'Part 3 complete: Trips table created'
GO

-- ============================================================================
-- PART 4: CREATE INDEXES
-- ============================================================================

PRINT ''
PRINT '--- Part 4: Creating indexes for performance ---'
GO

-- ContinuumMark indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_MarkType_MarkTime')
BEGIN
    PRINT 'Creating IX_ContinuumMark_MarkType_MarkTime...'
    CREATE NONCLUSTERED INDEX IX_ContinuumMark_MarkType_MarkTime
    ON ContinuumMark(MarkType, MarkTime DESC)
    WHERE IsDeleted = 0
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_ActorRadiusGuid')
BEGIN
    PRINT 'Creating IX_ContinuumMark_ActorRadiusGuid...'
    CREATE NONCLUSTERED INDEX IX_ContinuumMark_ActorRadiusGuid
    ON ContinuumMark(ActorRadiusGuid)
    WHERE ActorRadiusGuid IS NOT NULL AND IsDeleted = 0
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_ActorEntityGuid')
BEGIN
    PRINT 'Creating IX_ContinuumMark_ActorEntityGuid...'
    CREATE NONCLUSTERED INDEX IX_ContinuumMark_ActorEntityGuid
    ON ContinuumMark(ActorEntityGuid)
    WHERE ActorEntityGuid IS NOT NULL AND IsDeleted = 0
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_Unit_MarkTime')
BEGIN
    PRINT 'Creating IX_ContinuumMark_Unit_MarkTime...'
    CREATE NONCLUSTERED INDEX IX_ContinuumMark_Unit_MarkTime
    ON ContinuumMark(Unit, MarkTime DESC)
    WHERE IsDeleted = 0
END
GO

-- MarkSubject indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MarkSubject_MarkID')
BEGIN
    PRINT 'Creating IX_MarkSubject_MarkID...'
    CREATE NONCLUSTERED INDEX IX_MarkSubject_MarkID
    ON MarkSubject(MarkID)
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MarkSubject_EntityGUID')
BEGIN
    PRINT 'Creating IX_MarkSubject_EntityGUID...'
    CREATE NONCLUSTERED INDEX IX_MarkSubject_EntityGUID
    ON MarkSubject(EntityGUID)
    INCLUDE (MarkID, EntityType, SubjectRole)
END
GO

-- MarkParty indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MarkParty_MarkID')
BEGIN
    PRINT 'Creating IX_MarkParty_MarkID...'
    CREATE NONCLUSTERED INDEX IX_MarkParty_MarkID
    ON MarkParty(MarkID)
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MarkParty_PartyRadiusGuid')
BEGIN
    PRINT 'Creating IX_MarkParty_PartyRadiusGuid...'
    CREATE NONCLUSTERED INDEX IX_MarkParty_PartyRadiusGuid
    ON MarkParty(PartyRadiusGuid)
    WHERE PartyRadiusGuid IS NOT NULL
END
GO

-- Trips indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Trips_StaffRadiusGuid_TripDate')
BEGIN
    PRINT 'Creating IX_Trips_StaffRadiusGuid_TripDate...'
    CREATE NONCLUSTERED INDEX IX_Trips_StaffRadiusGuid_TripDate
    ON Trips(StaffRadiusGuid, TripDate DESC)
    WHERE IsDeleted = 0
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Trips_RelatedMarkID')
BEGIN
    PRINT 'Creating IX_Trips_RelatedMarkID...'
    CREATE NONCLUSTERED INDEX IX_Trips_RelatedMarkID
    ON Trips(RelatedMarkID)
    WHERE RelatedMarkID IS NOT NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Trips_CostCenterUnit_TripDate')
BEGIN
    PRINT 'Creating IX_Trips_CostCenterUnit_TripDate...'
    CREATE NONCLUSTERED INDEX IX_Trips_CostCenterUnit_TripDate
    ON Trips(CostCenterUnit, TripDate DESC)
    WHERE IsDeleted = 0
END
GO

-- Existing table indexes for new columns
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_visit_forms_actor_radius_guid')
BEGIN
    PRINT 'Creating IX_visit_forms_actor_radius_guid...'
    CREATE NONCLUSTERED INDEX IX_visit_forms_actor_radius_guid
    ON visit_forms(actor_radius_guid)
    WHERE actor_radius_guid IS NOT NULL AND is_deleted = 0
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_appointments_actor_radius_guid')
BEGIN
    PRINT 'Creating IX_appointments_actor_radius_guid...'
    CREATE NONCLUSTERED INDEX IX_appointments_actor_radius_guid
    ON appointments(actor_radius_guid)
    WHERE actor_radius_guid IS NOT NULL AND is_deleted = 0
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_appointments_assigned_to_radius_guid')
BEGIN
    PRINT 'Creating IX_appointments_assigned_to_radius_guid...'
    CREATE NONCLUSTERED INDEX IX_appointments_assigned_to_radius_guid
    ON appointments(assigned_to_radius_guid)
    WHERE assigned_to_radius_guid IS NOT NULL AND is_deleted = 0
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_travel_legs_staff_radius_guid')
BEGIN
    PRINT 'Creating IX_travel_legs_staff_radius_guid...'
    CREATE NONCLUSTERED INDEX IX_travel_legs_staff_radius_guid
    ON travel_legs(staff_radius_guid)
    WHERE staff_radius_guid IS NOT NULL AND is_deleted = 0
END
GO

PRINT 'Part 4 complete: Indexes created'
GO

-- ============================================================================
-- PART 5: CREATE LOOKUP VIEWS (Optional but helpful)
-- ============================================================================

PRINT ''
PRINT '--- Part 5: Creating lookup views ---'
GO

-- View to get timeline for any entity
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'vw_EntityTimeline')
    DROP VIEW vw_EntityTimeline
GO

CREATE VIEW vw_EntityTimeline AS
SELECT
    ms.EntityGUID,
    ms.EntityType,
    ms.EntityName,
    m.MarkID,
    m.MarkType,
    m.MarkTime,
    m.Unit,
    m.ActorName,
    m.ActorUserType,
    m.Notes,
    m.MarkStatus,
    ms.SubjectRole,
    -- Parties present (aggregated)
    (SELECT STRING_AGG(mp.PartyName, ', ')
     FROM MarkParty mp
     WHERE mp.MarkID = m.MarkID AND mp.PartyRole = 'PRESENT') AS PartiesPresent
FROM ContinuumMark m
INNER JOIN MarkSubject ms ON m.MarkID = ms.MarkID
WHERE m.IsDeleted = 0
GO

PRINT 'vw_EntityTimeline view created'
GO

-- View to get visits with full details
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'vw_VisitDetails')
    DROP VIEW vw_VisitDetails
GO

CREATE VIEW vw_VisitDetails AS
SELECT
    m.MarkID,
    m.MarkType,
    m.MarkTime,
    m.Unit,
    m.ActorClerkId,
    m.ActorRadiusGuid,
    m.ActorEntityGuid,
    m.ActorName,
    m.ActorEmail,
    m.ActorUserType,
    m.Notes,
    m.JsonPayload,
    m.MarkStatus,
    m.CreatedAt,
    m.CreatedBy,
    -- Foster home (primary subject)
    home.EntityGUID AS FosterHomeGuid,
    home.EntityName AS FosterHomeName,
    home.EntityXref AS FosterHomeXref,
    -- Children (comma-separated)
    (SELECT STRING_AGG(CAST(c.EntityGUID AS NVARCHAR(36)), ',')
     FROM MarkSubject c
     WHERE c.MarkID = m.MarkID AND c.EntityType = 'child') AS ChildGuids,
    (SELECT STRING_AGG(c.EntityName, ', ')
     FROM MarkSubject c
     WHERE c.MarkID = m.MarkID AND c.EntityType = 'child') AS ChildNames,
    -- Related trip
    t.TripID,
    t.MilesActual,
    t.MilesEstimated,
    t.TripStatus
FROM ContinuumMark m
LEFT JOIN MarkSubject home ON m.MarkID = home.MarkID AND home.EntityType = 'facility' AND home.SubjectRole = 'primary'
LEFT JOIN Trips t ON m.MarkID = t.RelatedMarkID AND t.IsDeleted = 0
WHERE m.MarkType IN ('HOME_VISIT', 'HOME_VISIT_SCHEDULED', 'HOME_VISIT_CANCELLED', 'HOME_VISIT_RESCHEDULED')
  AND m.IsDeleted = 0
GO

PRINT 'vw_VisitDetails view created'
GO

PRINT 'Part 5 complete: Views created'
GO

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

PRINT ''
PRINT '=== Migration Complete ==='
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120)
PRINT ''
PRINT 'Summary of changes:'
PRINT '  - Added dual-source actor columns to: visit_forms, appointments, travel_legs, app_users'
PRINT '  - Created tables: ContinuumMark, MarkSubject, MarkParty, ContinuumSignal, Trips'
PRINT '  - Created indexes for performance'
PRINT '  - Created views: vw_EntityTimeline, vw_VisitDetails'
PRINT ''
PRINT 'Next steps:'
PRINT '  1. Deploy updated API code'
PRINT '  2. Run backfill script to populate GUID columns for existing records'
PRINT '  3. Monitor for any issues'
GO

-- ============================================================================
-- ROLLBACK SCRIPT (Run separately if needed)
-- ============================================================================
/*
-- WARNING: This will DROP tables and remove columns. Use with caution!

PRINT 'Starting rollback...'

-- Drop views
DROP VIEW IF EXISTS vw_VisitDetails
DROP VIEW IF EXISTS vw_EntityTimeline

-- Drop indexes on existing tables
DROP INDEX IF EXISTS IX_travel_legs_staff_radius_guid ON travel_legs
DROP INDEX IF EXISTS IX_appointments_assigned_to_radius_guid ON appointments
DROP INDEX IF EXISTS IX_appointments_actor_radius_guid ON appointments
DROP INDEX IF EXISTS IX_visit_forms_actor_radius_guid ON visit_forms

-- Drop new tables (in order due to foreign keys)
DROP TABLE IF EXISTS Trips
DROP TABLE IF EXISTS MarkParty
DROP TABLE IF EXISTS MarkSubject
DROP TABLE IF EXISTS ContinuumSignal
DROP TABLE IF EXISTS ContinuumMark

-- Remove columns from existing tables
ALTER TABLE travel_legs DROP COLUMN IF EXISTS staff_radius_guid
ALTER TABLE appointments DROP COLUMN IF EXISTS assigned_to_radius_guid
ALTER TABLE appointments DROP COLUMN IF EXISTS actor_user_type
ALTER TABLE appointments DROP COLUMN IF EXISTS actor_entity_guid
ALTER TABLE appointments DROP COLUMN IF EXISTS actor_radius_guid
ALTER TABLE visit_forms DROP COLUMN IF EXISTS actor_user_type
ALTER TABLE visit_forms DROP COLUMN IF EXISTS actor_entity_guid
ALTER TABLE visit_forms DROP COLUMN IF EXISTS actor_radius_guid
ALTER TABLE app_users DROP COLUMN IF EXISTS comm_bridge_id

PRINT 'Rollback complete'
*/
