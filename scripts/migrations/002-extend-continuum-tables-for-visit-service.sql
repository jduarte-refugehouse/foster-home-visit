-- ============================================================================
-- MIGRATION: Extend Existing Continuum Tables for Visit Service
-- Database: RadiusBifrost (Azure SQL)
-- Date: 2026-01-03
--
-- Purpose: Adds columns to existing ContinuumMark, MarkSubject, MarkParty
--          tables to support the visit service requirements while preserving
--          compatibility with existing PULSE-based data.
--
-- Existing Schema Uses:
--   - ActorPID (int) for staff identity
--   - EntityPID (int) for entity identity
--   - MarkDate (not MarkTime)
--   - IsArchived (not IsDeleted)
--
-- This migration ADDS (not replaces):
--   - GUID-based actor fields for Clerk/web app users
--   - Additional metadata fields for visit forms
--   - Soft delete support
-- ============================================================================

PRINT '=== Migration: Extend Continuum Tables for Visit Service ==='
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120)
GO

-- ============================================================================
-- PART 1: Extend ContinuumMark table
-- ============================================================================

PRINT ''
PRINT '--- Part 1: Extending ContinuumMark table ---'
GO

-- Actor identity fields (for Clerk-authenticated users)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorClerkId')
BEGIN
    PRINT 'Adding ActorClerkId...'
    ALTER TABLE ContinuumMark ADD ActorClerkId NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorRadiusGuid')
BEGIN
    PRINT 'Adding ActorRadiusGuid...'
    ALTER TABLE ContinuumMark ADD ActorRadiusGuid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorEntityGuid')
BEGIN
    PRINT 'Adding ActorEntityGuid...'
    ALTER TABLE ContinuumMark ADD ActorEntityGuid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorCommBridgeId')
BEGIN
    PRINT 'Adding ActorCommBridgeId...'
    ALTER TABLE ContinuumMark ADD ActorCommBridgeId UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorName')
BEGIN
    PRINT 'Adding ActorName...'
    ALTER TABLE ContinuumMark ADD ActorName NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorEmail')
BEGIN
    PRINT 'Adding ActorEmail...'
    ALTER TABLE ContinuumMark ADD ActorEmail NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorUserType')
BEGIN
    PRINT 'Adding ActorUserType...'
    ALTER TABLE ContinuumMark ADD ActorUserType NVARCHAR(50) NULL
END
GO

-- Visit-specific fields
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'JsonPayload')
BEGIN
    PRINT 'Adding JsonPayload...'
    ALTER TABLE ContinuumMark ADD JsonPayload NVARCHAR(MAX) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'MarkStatus')
BEGIN
    PRINT 'Adding MarkStatus...'
    ALTER TABLE ContinuumMark ADD MarkStatus NVARCHAR(20) NULL
END
GO

-- Audit fields
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'CreatedBy')
BEGIN
    PRINT 'Adding CreatedBy...'
    ALTER TABLE ContinuumMark ADD CreatedBy NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'UpdatedAt')
BEGIN
    PRINT 'Adding UpdatedAt...'
    ALTER TABLE ContinuumMark ADD UpdatedAt DATETIME2 NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'UpdatedBy')
BEGIN
    PRINT 'Adding UpdatedBy...'
    ALTER TABLE ContinuumMark ADD UpdatedBy NVARCHAR(255) NULL
END
GO

-- Soft delete (in addition to existing IsArchived)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'IsDeleted')
BEGIN
    PRINT 'Adding IsDeleted...'
    ALTER TABLE ContinuumMark ADD IsDeleted BIT DEFAULT 0
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'DeletedAt')
BEGIN
    PRINT 'Adding DeletedAt...'
    ALTER TABLE ContinuumMark ADD DeletedAt DATETIME2 NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'DeletedBy')
BEGIN
    PRINT 'Adding DeletedBy...'
    ALTER TABLE ContinuumMark ADD DeletedBy NVARCHAR(255) NULL
END
GO

-- Set default for IsDeleted on existing rows
UPDATE ContinuumMark SET IsDeleted = 0 WHERE IsDeleted IS NULL
GO

PRINT 'ContinuumMark table extended'
GO

-- ============================================================================
-- PART 2: Extend MarkSubject table
-- ============================================================================

PRINT ''
PRINT '--- Part 2: Extending MarkSubject table ---'
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkSubject') AND name = 'EntityName')
BEGIN
    PRINT 'Adding EntityName...'
    ALTER TABLE MarkSubject ADD EntityName NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkSubject') AND name = 'EntityXref')
BEGIN
    PRINT 'Adding EntityXref...'
    ALTER TABLE MarkSubject ADD EntityXref INT NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkSubject') AND name = 'CreatedAt')
BEGIN
    PRINT 'Adding CreatedAt...'
    ALTER TABLE MarkSubject ADD CreatedAt DATETIME2 DEFAULT GETDATE()
END
GO

PRINT 'MarkSubject table extended'
GO

-- ============================================================================
-- PART 3: Extend MarkParty table
-- ============================================================================

PRINT ''
PRINT '--- Part 3: Extending MarkParty table ---'
GO

-- GUID-based identity fields (dual-source pattern)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyRadiusGuid')
BEGIN
    PRINT 'Adding PartyRadiusGuid...'
    ALTER TABLE MarkParty ADD PartyRadiusGuid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyEntityGuid')
BEGIN
    PRINT 'Adding PartyEntityGuid...'
    ALTER TABLE MarkParty ADD PartyEntityGuid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyCommBridgeId')
BEGIN
    PRINT 'Adding PartyCommBridgeId...'
    ALTER TABLE MarkParty ADD PartyCommBridgeId UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyType')
BEGIN
    PRINT 'Adding PartyType...'
    ALTER TABLE MarkParty ADD PartyType NVARCHAR(50) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyEmail')
BEGIN
    PRINT 'Adding PartyEmail...'
    ALTER TABLE MarkParty ADD PartyEmail NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyPhone')
BEGIN
    PRINT 'Adding PartyPhone...'
    ALTER TABLE MarkParty ADD PartyPhone NVARCHAR(20) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'CreatedAt')
BEGIN
    PRINT 'Adding CreatedAt...'
    ALTER TABLE MarkParty ADD CreatedAt DATETIME2 DEFAULT GETDATE()
END
GO

PRINT 'MarkParty table extended'
GO

-- ============================================================================
-- PART 4: Create indexes for new columns
-- ============================================================================

PRINT ''
PRINT '--- Part 4: Creating indexes ---'
GO

-- ContinuumMark indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_ActorRadiusGuid')
BEGIN
    PRINT 'Creating IX_ContinuumMark_ActorRadiusGuid...'
    CREATE NONCLUSTERED INDEX IX_ContinuumMark_ActorRadiusGuid
    ON ContinuumMark(ActorRadiusGuid)
    WHERE ActorRadiusGuid IS NOT NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_ActorEntityGuid')
BEGIN
    PRINT 'Creating IX_ContinuumMark_ActorEntityGuid...'
    CREATE NONCLUSTERED INDEX IX_ContinuumMark_ActorEntityGuid
    ON ContinuumMark(ActorEntityGuid)
    WHERE ActorEntityGuid IS NOT NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_ActorClerkId')
BEGIN
    PRINT 'Creating IX_ContinuumMark_ActorClerkId...'
    CREATE NONCLUSTERED INDEX IX_ContinuumMark_ActorClerkId
    ON ContinuumMark(ActorClerkId)
    WHERE ActorClerkId IS NOT NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_MarkType_MarkDate')
BEGIN
    PRINT 'Creating IX_ContinuumMark_MarkType_MarkDate...'
    CREATE NONCLUSTERED INDEX IX_ContinuumMark_MarkType_MarkDate
    ON ContinuumMark(MarkType, MarkDate DESC)
    WHERE IsArchived = 0
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_SourceSystem')
BEGIN
    PRINT 'Creating IX_ContinuumMark_SourceSystem...'
    CREATE NONCLUSTERED INDEX IX_ContinuumMark_SourceSystem
    ON ContinuumMark(SourceSystem)
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

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MarkParty_EntityGUID')
BEGIN
    PRINT 'Creating IX_MarkParty_EntityGUID...'
    CREATE NONCLUSTERED INDEX IX_MarkParty_EntityGUID
    ON MarkParty(EntityGUID)
    WHERE EntityGUID IS NOT NULL
END
GO

PRINT 'Indexes created'
GO

-- ============================================================================
-- PART 5: Create views for visit service
-- ============================================================================

PRINT ''
PRINT '--- Part 5: Creating views ---'
GO

-- View to get timeline for any entity
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'vw_EntityTimeline')
BEGIN
    PRINT 'Dropping existing vw_EntityTimeline...'
    DROP VIEW vw_EntityTimeline
END
GO

PRINT 'Creating vw_EntityTimeline...'
GO

CREATE VIEW vw_EntityTimeline AS
SELECT
    ms.EntityGUID,
    ms.EntityType,
    ms.EntityName,
    ms.EntityPID,
    m.MarkID,
    m.MarkType,
    m.MarkDate,
    m.Unit,
    -- Support both PID-based (PULSE) and GUID-based (Visit Service) actors
    m.ActorPID,
    m.ActorName,
    m.ActorRadiusGuid,
    m.ActorUserType,
    m.SourceSystem,
    m.Notes,
    m.MarkStatus,
    ms.SubjectRole,
    -- Parties present (aggregated)
    (SELECT STRING_AGG(mp.PartyName, ', ')
     FROM MarkParty mp
     WHERE mp.MarkID = m.MarkID AND mp.PartyRole = 'PRESENT') AS PartiesPresent
FROM ContinuumMark m
INNER JOIN MarkSubject ms ON m.MarkID = ms.MarkID
WHERE m.IsArchived = 0 AND ISNULL(m.IsDeleted, 0) = 0
GO

PRINT 'vw_EntityTimeline created'
GO

-- View to get visits with full details
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'vw_VisitDetails')
BEGIN
    PRINT 'Dropping existing vw_VisitDetails...'
    DROP VIEW vw_VisitDetails
END
GO

PRINT 'Creating vw_VisitDetails...'
GO

CREATE VIEW vw_VisitDetails AS
SELECT
    m.MarkID,
    m.MarkType,
    m.MarkDate,
    m.Unit,
    m.SourceSystem,
    -- PID-based identity (for PULSE compatibility)
    m.ActorPID,
    -- GUID-based identity (for Visit Service)
    m.ActorClerkId,
    m.ActorRadiusGuid,
    m.ActorEntityGuid,
    m.ActorName,
    m.ActorEmail,
    m.ActorUserType,
    -- Content
    m.Notes,
    m.MarkContext,
    m.JsonPayload,
    m.MarkStatus,
    m.CreatedAt,
    m.CreatedBy,
    -- Foster home (primary subject)
    home.EntityGUID AS FosterHomeGuid,
    home.EntityName AS FosterHomeName,
    home.EntityXref AS FosterHomeXref,
    home.EntityPID AS FosterHomePID,
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
LEFT JOIN MarkSubject home ON m.MarkID = home.MarkID
    AND home.EntityType = 'facility'
    AND home.SubjectRole = 'primary'
LEFT JOIN Trips t ON m.MarkID = t.RelatedMarkID AND t.IsDeleted = 0
WHERE m.MarkType IN ('HOME_VISIT', 'HOME_VISIT_SCHEDULED', 'HOME_VISIT_CANCELLED', 'HOME_VISIT_RESCHEDULED')
  AND m.IsArchived = 0
  AND ISNULL(m.IsDeleted, 0) = 0
GO

PRINT 'vw_VisitDetails created'
GO

-- ============================================================================
-- PART 6: Update recommendations document
-- ============================================================================

PRINT ''
PRINT '=== Schema Mapping Reference ==='
PRINT ''
PRINT 'ContinuumMark Identity Resolution:'
PRINT '  PULSE (on-prem):     ActorPID -> person.PID'
PRINT '  Visit Service:       ActorRadiusGuid -> SyncRadiusUsers.guid'
PRINT '                       ActorEntityGuid -> EntityCommunicationBridge.EntityGUID'
PRINT '                       ActorClerkId -> app_users.clerk_user_id'
PRINT ''
PRINT 'MarkParty Identity Resolution:'
PRINT '  PULSE (on-prem):     EntityPID -> person.PID'
PRINT '  Visit Service:       PartyRadiusGuid -> SyncRadiusUsers.guid'
PRINT '                       PartyEntityGuid -> EntityCommunicationBridge.EntityGUID'
PRINT '                       EntityGUID -> (existing column, same purpose)'
PRINT ''
PRINT 'Date Column Mapping:'
PRINT '  Existing:            MarkDate (used by PULSE)'
PRINT '  Visit Service uses:  MarkDate (same column - compatible!)'
PRINT ''
PRINT 'Archive/Delete Mapping:'
PRINT '  Existing:            IsArchived (PULSE)'
PRINT '  Visit Service:       IsDeleted (added, separate from archive)'
PRINT '  Views filter on:     BOTH (IsArchived = 0 AND IsDeleted = 0)'
GO

-- ============================================================================
-- VERIFICATION
-- ============================================================================

PRINT ''
PRINT '=== Verification ==='
GO

PRINT ''
PRINT 'ContinuumMark columns:'
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ContinuumMark'
ORDER BY ORDINAL_POSITION
GO

PRINT ''
PRINT 'MarkSubject columns:'
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'MarkSubject'
ORDER BY ORDINAL_POSITION
GO

PRINT ''
PRINT 'MarkParty columns:'
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'MarkParty'
ORDER BY ORDINAL_POSITION
GO

PRINT ''
PRINT '=== Migration Complete ==='
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120)
PRINT ''
PRINT 'Summary:'
PRINT '  - Extended ContinuumMark with GUID-based actor fields'
PRINT '  - Extended MarkSubject with EntityName, EntityXref'
PRINT '  - Extended MarkParty with GUID-based party fields'
PRINT '  - Created performance indexes'
PRINT '  - Created views: vw_EntityTimeline, vw_VisitDetails'
PRINT ''
PRINT 'Backward Compatibility:'
PRINT '  - Existing ActorPID, EntityPID columns preserved'
PRINT '  - Existing IsArchived column preserved'
PRINT '  - PULSE data remains fully functional'
PRINT '  - Visit Service uses new GUID-based columns'
GO
