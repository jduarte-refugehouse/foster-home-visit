-- Grant database permissions for appointments table to v0_app_user
-- This script grants the necessary database-level permissions for the appointments functionality

PRINT '=== GRANTING DATABASE PERMISSIONS FOR APPOINTMENTS ==='
PRINT ''

-- Grant permissions on appointments table to v0_app_user
IF EXISTS (SELECT * FROM sysobjects WHERE name='appointments' AND xtype='U')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO v0_app_user;
    PRINT '✅ Granted SELECT, INSERT, UPDATE, DELETE permissions on appointments table to v0_app_user';
END
ELSE
BEGIN
    PRINT '❌ ERROR: appointments table not found! Please run create-appointments-table.sql first';
END

-- Verify permissions by testing a simple query
BEGIN TRY
    DECLARE @test_count INT;
    SELECT @test_count = COUNT(*) FROM appointments;
    PRINT '✅ Permission test successful - appointments table accessible';
    PRINT 'Current appointment count: ' + CAST(@test_count AS NVARCHAR(10));
END TRY
BEGIN CATCH
    PRINT '❌ Permission test failed: ' + ERROR_MESSAGE();
    PRINT 'Please check that v0_app_user has the necessary permissions';
END CATCH

PRINT ''
PRINT '=== DATABASE PERMISSIONS SETUP COMPLETE ==='
