-- ============================================================================
-- MIGRATION FIX: Add Missing Columns to Existing ContinuumMark Tables
-- Database: RadiusBifrost (Azure SQL)
-- Date: 2026-01-03
--
-- Purpose: The ContinuumMark, MarkSubject, and MarkParty tables already exist
--          but are missing columns. This script adds the missing columns.
-- ============================================================================

PRINT '=== Fix Migration: Adding Missing Columns to Continuum Tables ==='
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120)
GO

-- ============================================================================
-- PART 1: Fix ContinuumMark table - add missing columns
-- ============================================================================

PRINT ''
PRINT '--- Fixing ContinuumMark table ---'
GO

-- Check what columns exist
PRINT 'Current ContinuumMark columns:'
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ContinuumMark'
ORDER BY ORDINAL_POSITION
GO

-- Add missing columns one by one
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'MarkTime')
BEGIN
    PRINT 'Adding MarkTime to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD MarkTime DATETIME2 NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'Unit')
BEGIN
    PRINT 'Adding Unit to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD Unit VARCHAR(3) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorClerkId')
BEGIN
    PRINT 'Adding ActorClerkId to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD ActorClerkId NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorRadiusGuid')
BEGIN
    PRINT 'Adding ActorRadiusGuid to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD ActorRadiusGuid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorEntityGuid')
BEGIN
    PRINT 'Adding ActorEntityGuid to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD ActorEntityGuid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorCommBridgeId')
BEGIN
    PRINT 'Adding ActorCommBridgeId to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD ActorCommBridgeId UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorName')
BEGIN
    PRINT 'Adding ActorName to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD ActorName NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorEmail')
BEGIN
    PRINT 'Adding ActorEmail to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD ActorEmail NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorUserType')
BEGIN
    PRINT 'Adding ActorUserType to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD ActorUserType NVARCHAR(50) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'Notes')
BEGIN
    PRINT 'Adding Notes to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD Notes NVARCHAR(MAX) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'JsonPayload')
BEGIN
    PRINT 'Adding JsonPayload to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD JsonPayload NVARCHAR(MAX) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'MarkStatus')
BEGIN
    PRINT 'Adding MarkStatus to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD MarkStatus NVARCHAR(20) DEFAULT 'active'
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'CreatedAt')
BEGIN
    PRINT 'Adding CreatedAt to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD CreatedAt DATETIME2 DEFAULT GETDATE()
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'CreatedBy')
BEGIN
    PRINT 'Adding CreatedBy to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD CreatedBy NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'UpdatedAt')
BEGIN
    PRINT 'Adding UpdatedAt to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD UpdatedAt DATETIME2 NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'UpdatedBy')
BEGIN
    PRINT 'Adding UpdatedBy to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD UpdatedBy NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'IsDeleted')
BEGIN
    PRINT 'Adding IsDeleted to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD IsDeleted BIT DEFAULT 0
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'DeletedAt')
BEGIN
    PRINT 'Adding DeletedAt to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD DeletedAt DATETIME2 NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'DeletedBy')
BEGIN
    PRINT 'Adding DeletedBy to ContinuumMark...'
    ALTER TABLE ContinuumMark ADD DeletedBy NVARCHAR(255) NULL
END
GO

PRINT 'ContinuumMark table fixed'
GO

-- ============================================================================
-- PART 2: Fix MarkSubject table - add missing columns
-- ============================================================================

PRINT ''
PRINT '--- Fixing MarkSubject table ---'
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkSubject') AND name = 'EntityName')
BEGIN
    PRINT 'Adding EntityName to MarkSubject...'
    ALTER TABLE MarkSubject ADD EntityName NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkSubject') AND name = 'EntityXref')
BEGIN
    PRINT 'Adding EntityXref to MarkSubject...'
    ALTER TABLE MarkSubject ADD EntityXref INT NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkSubject') AND name = 'CreatedAt')
BEGIN
    PRINT 'Adding CreatedAt to MarkSubject...'
    ALTER TABLE MarkSubject ADD CreatedAt DATETIME2 DEFAULT GETDATE()
END
GO

PRINT 'MarkSubject table fixed'
GO

-- ============================================================================
-- PART 3: Fix MarkParty table - add missing columns
-- ============================================================================

PRINT ''
PRINT '--- Fixing MarkParty table ---'
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyRadiusGuid')
BEGIN
    PRINT 'Adding PartyRadiusGuid to MarkParty...'
    ALTER TABLE MarkParty ADD PartyRadiusGuid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyEntityGuid')
BEGIN
    PRINT 'Adding PartyEntityGuid to MarkParty...'
    ALTER TABLE MarkParty ADD PartyEntityGuid UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyCommBridgeId')
BEGIN
    PRINT 'Adding PartyCommBridgeId to MarkParty...'
    ALTER TABLE MarkParty ADD PartyCommBridgeId UNIQUEIDENTIFIER NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyName')
BEGIN
    PRINT 'Adding PartyName to MarkParty...'
    ALTER TABLE MarkParty ADD PartyName NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyRole')
BEGIN
    PRINT 'Adding PartyRole to MarkParty...'
    ALTER TABLE MarkParty ADD PartyRole NVARCHAR(50) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyType')
BEGIN
    PRINT 'Adding PartyType to MarkParty...'
    ALTER TABLE MarkParty ADD PartyType NVARCHAR(50) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyEmail')
BEGIN
    PRINT 'Adding PartyEmail to MarkParty...'
    ALTER TABLE MarkParty ADD PartyEmail NVARCHAR(255) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyPhone')
BEGIN
    PRINT 'Adding PartyPhone to MarkParty...'
    ALTER TABLE MarkParty ADD PartyPhone NVARCHAR(20) NULL
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'CreatedAt')
BEGIN
    PRINT 'Adding CreatedAt to MarkParty...'
    ALTER TABLE MarkParty ADD CreatedAt DATETIME2 DEFAULT GETDATE()
END
GO

PRINT 'MarkParty table fixed'
GO

-- ============================================================================
-- PART 4: Now create the indexes that failed
-- ============================================================================

PRINT ''
PRINT '--- Creating indexes that previously failed ---'
GO

-- ContinuumMark indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_MarkType_MarkTime')
BEGIN
    PRINT 'Creating IX_ContinuumMark_MarkType_MarkTime...'
    -- Only create if MarkType column exists
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'MarkType')
       AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'MarkTime')
       AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'IsDeleted')
    BEGIN
        CREATE NONCLUSTERED INDEX IX_ContinuumMark_MarkType_MarkTime
        ON ContinuumMark(MarkType, MarkTime DESC)
        WHERE IsDeleted = 0
        PRINT 'Index created'
    END
    ELSE
        PRINT 'Skipped - required columns missing'
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_ActorRadiusGuid')
BEGIN
    PRINT 'Creating IX_ContinuumMark_ActorRadiusGuid...'
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorRadiusGuid')
       AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'IsDeleted')
    BEGIN
        CREATE NONCLUSTERED INDEX IX_ContinuumMark_ActorRadiusGuid
        ON ContinuumMark(ActorRadiusGuid)
        WHERE ActorRadiusGuid IS NOT NULL AND IsDeleted = 0
        PRINT 'Index created'
    END
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_ActorEntityGuid')
BEGIN
    PRINT 'Creating IX_ContinuumMark_ActorEntityGuid...'
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'ActorEntityGuid')
       AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'IsDeleted')
    BEGIN
        CREATE NONCLUSTERED INDEX IX_ContinuumMark_ActorEntityGuid
        ON ContinuumMark(ActorEntityGuid)
        WHERE ActorEntityGuid IS NOT NULL AND IsDeleted = 0
        PRINT 'Index created'
    END
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContinuumMark_Unit_MarkTime')
BEGIN
    PRINT 'Creating IX_ContinuumMark_Unit_MarkTime...'
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'Unit')
       AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'MarkTime')
       AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ContinuumMark') AND name = 'IsDeleted')
    BEGIN
        CREATE NONCLUSTERED INDEX IX_ContinuumMark_Unit_MarkTime
        ON ContinuumMark(Unit, MarkTime DESC)
        WHERE IsDeleted = 0
        PRINT 'Index created'
    END
END
GO

-- MarkParty index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MarkParty_PartyRadiusGuid')
BEGIN
    PRINT 'Creating IX_MarkParty_PartyRadiusGuid...'
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('MarkParty') AND name = 'PartyRadiusGuid')
    BEGIN
        CREATE NONCLUSTERED INDEX IX_MarkParty_PartyRadiusGuid
        ON MarkParty(PartyRadiusGuid)
        WHERE PartyRadiusGuid IS NOT NULL
        PRINT 'Index created'
    END
END
GO

PRINT 'Indexes created'
GO

-- ============================================================================
-- PART 5: Recreate the views
-- ============================================================================

PRINT ''
PRINT '--- Recreating views ---'
GO

-- Drop and recreate vw_EntityTimeline
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

PRINT 'vw_EntityTimeline created'
GO

-- Drop and recreate vw_VisitDetails
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

PRINT 'vw_VisitDetails created'
GO

-- ============================================================================
-- VERIFICATION
-- ============================================================================

PRINT ''
PRINT '=== Verification ==='
GO

PRINT 'ContinuumMark columns:'
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ContinuumMark'
ORDER BY ORDINAL_POSITION
GO

PRINT 'MarkSubject columns:'
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'MarkSubject'
ORDER BY ORDINAL_POSITION
GO

PRINT 'MarkParty columns:'
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'MarkParty'
ORDER BY ORDINAL_POSITION
GO

PRINT ''
PRINT '=== Fix Migration Complete ==='
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120)
GO
