-- Update appointments table to properly integrate with SyncActiveHomes
-- This script modifies the existing table to better align with the existing database structure

-- First, clear any sample data that doesn't reference real homes
DELETE FROM dbo.appointments WHERE home_xref IN (1001, 1002, 1003);

-- Add foreign key constraint to properly link to SyncActiveHomes
-- Note: We can't add a formal FK constraint since SyncActiveHomes might be in a different schema
-- But we'll add a check constraint to ensure data integrity

-- Add index for better performance when joining with SyncActiveHomes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_appointments_home_xref_active')
BEGIN
    CREATE INDEX IX_appointments_home_xref_active ON dbo.appointments(home_xref) 
    WHERE is_deleted = 0 AND home_xref IS NOT NULL;
END

-- Update the table to remove the denormalized home_name field since we'll get it from SyncActiveHomes
-- We'll keep location_address for additional location notes beyond the home address
ALTER TABLE dbo.appointments DROP COLUMN IF EXISTS home_name;

-- Add a computed column comment to clarify the relationship
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Foreign key reference to SyncActiveHomes.Xref - links appointment to specific foster home', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'appointments', 
    @level2type = N'COLUMN', @level2name = N'home_xref';

-- Add constraint to ensure home_xref is provided for home visit appointments
ALTER TABLE dbo.appointments ADD CONSTRAINT CK_appointments_home_visit_requires_home 
    CHECK (appointment_type != 'home_visit' OR home_xref IS NOT NULL);

PRINT 'Appointments table updated to properly integrate with SyncActiveHomes';
PRINT 'Key changes:';
PRINT '- Removed denormalized home_name field (will be fetched from SyncActiveHomes)';
PRINT '- Added constraint requiring home_xref for home visit appointments';
PRINT '- Added performance index for home_xref lookups';
PRINT '- Added documentation for the foreign key relationship';
