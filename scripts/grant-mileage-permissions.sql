-- =============================================
-- Grant Permissions for Mileage Tracking Columns
-- =============================================
-- This script grants permissions to v0_application_role
-- (which includes v0_app_user) for the new mileage tracking
-- columns in the appointments table
-- =============================================

USE RadiusBifrost;
GO

-- Grant permissions to v0_application_role
-- Note: v0_app_user is a member of v0_application_role
-- Permissions are table-level, so this covers all columns including the new ones
GRANT SELECT, INSERT, UPDATE ON [dbo].[appointments] TO [v0_application_role];
GO

PRINT 'Permissions granted to v0_application_role for mileage tracking columns';
PRINT 'v0_app_user can now:';
PRINT '  - SELECT mileage tracking data from appointments';
PRINT '  - INSERT/UPDATE start_drive and arrived locations';
PRINT '  - UPDATE calculated_mileage';
GO

