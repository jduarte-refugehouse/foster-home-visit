-- Test script for visit forms functionality
-- Run this in SSMS to verify the tables and basic operations work

USE RadiusBifrost;
GO

-- Test 1: Check if tables exist
PRINT '=== Testing Table Existence ==='
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'visit_forms')
    PRINT '✅ visit_forms table exists'
ELSE
    PRINT '❌ visit_forms table missing'

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'appointments')
    PRINT '✅ appointments table exists'
ELSE
    PRINT '❌ appointments table missing'

-- Test 2: Check table structure
PRINT '=== Testing Table Structure ==='
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'visit_forms'
ORDER BY ORDINAL_POSITION

-- Test 3: Insert a test record (you'll need to replace with real appointment_id)
PRINT '=== Testing Insert Operation ==='
DECLARE @TestAppointmentId UNIQUEIDENTIFIER
DECLARE @TestVisitFormId UNIQUEIDENTIFIER = NEWID()

-- Get a real appointment ID for testing
SELECT TOP 1 @TestAppointmentId = appointment_id 
FROM appointments 
WHERE is_deleted = 0

IF @TestAppointmentId IS NOT NULL
BEGIN
    INSERT INTO visit_forms (
        visit_form_id,
        appointment_id,
        form_type,
        status,
        visit_date,
        visit_time,
        created_by_user_id,
        created_by_name,
        visit_info
    ) VALUES (
        @TestVisitFormId,
        @TestAppointmentId,
        'home_visit',
        'draft',
        GETDATE(),
        '10:00:00',
        'test-user-123',
        'Test User',
        '{"visitType": "Initial", "visitMode": "In-Person"}'
    )
    
    PRINT '✅ Test record inserted successfully'
    PRINT 'Visit Form ID: ' + CAST(@TestVisitFormId AS NVARCHAR(50))
    
    -- Test 4: Query the test record
    SELECT * FROM visit_forms WHERE visit_form_id = @TestVisitFormId
    
    -- Test 5: Update the test record
    UPDATE visit_forms 
    SET status = 'completed',
        updated_at = GETUTCDATE(),
        observations = '{"atmosphere": "Positive", "concerns": "None"}'
    WHERE visit_form_id = @TestVisitFormId
    
    PRINT '✅ Test record updated successfully'
    
    -- Test 6: Clean up test record
    DELETE FROM visit_forms WHERE visit_form_id = @TestVisitFormId
    PRINT '✅ Test record cleaned up'
END
ELSE
BEGIN
    PRINT '❌ No appointments found for testing'
END

PRINT '=== Test Complete ==='
