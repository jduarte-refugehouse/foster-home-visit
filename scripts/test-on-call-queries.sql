-- =============================================
-- ON-CALL SCHEDULE API QUERY TESTING
-- =============================================
-- Test the exact SQL queries used by the on-call API
-- Run each section in SSMS to identify any issues
-- =============================================

-- STEP 1: Verify table exists and check structure
-- =============================================
PRINT '=== STEP 1: Verify Table Exists ==='

SELECT 
    TABLE_NAME, 
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'on_call_schedule'

-- Check all columns
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'on_call_schedule'
ORDER BY ORDINAL_POSITION

GO

-- STEP 2: Check if table has any data
-- =============================================
PRINT ''
PRINT '=== STEP 2: Check Existing Data ==='

SELECT COUNT(*) as total_rows
FROM on_call_schedule

SELECT TOP 5 *
FROM on_call_schedule
ORDER BY created_at DESC

GO

-- STEP 3: Test the GET query (what API uses to fetch schedules)
-- =============================================
PRINT ''
PRINT '=== STEP 3: Test GET Query ==='

-- Simulate the API query with date parameters
DECLARE @startDate DATETIME2 = '2025-11-03T08:00:00'
DECLARE @endDate DATETIME2 = '2025-12-03T08:00:00'

SELECT 
    ocs.id,
    ocs.user_id,
    ocs.user_name,
    ocs.user_email,
    ocs.user_phone,
    ocs.start_datetime,
    ocs.end_datetime,
    ocs.duration_hours,
    ocs.on_call_type,
    ocs.on_call_category,
    ocs.role_required,
    ocs.department,
    ocs.region,
    ocs.escalation_level,
    ocs.is_active,
    ocs.notes,
    ocs.priority_level,
    ocs.created_by_name,
    ocs.created_at,
    ocs.updated_at,
    ocs.updated_by_name,
    -- Calculate if currently on call
    CASE 
        WHEN GETDATE() BETWEEN ocs.start_datetime AND ocs.end_datetime 
        THEN 1 
        ELSE 0 
    END as is_currently_active,
    -- User details from app_users if linked
    u.first_name,
    u.last_name,
    u.email as user_app_email
FROM on_call_schedule ocs
LEFT JOIN app_users u ON ocs.user_id = u.id
WHERE ocs.is_active = 1
    AND ocs.is_deleted = 0
    AND ocs.end_datetime >= @startDate
    AND ocs.start_datetime <= @endDate
ORDER BY ocs.start_datetime ASC

PRINT 'GET query executed successfully'

GO

-- STEP 4: Test the INSERT query (what API uses to create schedules)
-- =============================================
PRINT ''
PRINT '=== STEP 4: Test INSERT Query ==='

-- Test parameters (replace with actual test data)
DECLARE @userId UNIQUEIDENTIFIER = NULL  -- Can be NULL
DECLARE @userName NVARCHAR(255) = 'Test User'
DECLARE @userEmail NVARCHAR(255) = 'test@example.com'
DECLARE @userPhone NVARCHAR(50) = '555-1234'
DECLARE @startDatetime DATETIME2 = '2025-11-04 08:00:00'
DECLARE @endDatetime DATETIME2 = '2025-11-04 20:00:00'
DECLARE @notes NVARCHAR(MAX) = 'Test on-call assignment'
DECLARE @priorityLevel NVARCHAR(20) = 'normal'
DECLARE @onCallType NVARCHAR(100) = 'general'
DECLARE @onCallCategory NVARCHAR(100) = NULL
DECLARE @roleRequired NVARCHAR(100) = 'liaison'
DECLARE @department NVARCHAR(100) = NULL
DECLARE @region NVARCHAR(100) = NULL
DECLARE @escalationLevel INT = 1
DECLARE @createdByUserId NVARCHAR(255) = 'test_clerk_user_id'
DECLARE @createdByName NVARCHAR(255) = 'Test Creator'

-- First, check for overlaps (conflict detection)
PRINT 'Checking for overlaps...'
SELECT COUNT(*) as overlap_count
FROM on_call_schedule
WHERE user_id = @userId
    AND is_active = 1
    AND is_deleted = 0
    AND (
        (start_datetime <= @startDatetime AND end_datetime >= @startDatetime)
        OR (start_datetime <= @endDatetime AND end_datetime >= @endDatetime)
        OR (start_datetime >= @startDatetime AND end_datetime <= @endDatetime)
    )

-- Now try the INSERT
PRINT 'Attempting INSERT...'
BEGIN TRY
    BEGIN TRANSACTION
    
    INSERT INTO on_call_schedule (
        id,
        user_id,
        user_name,
        user_email,
        user_phone,
        start_datetime,
        end_datetime,
        notes,
        priority_level,
        on_call_type,
        on_call_category,
        role_required,
        department,
        region,
        escalation_level,
        is_active,
        created_by_user_id,
        created_by_name,
        created_at
    )
    OUTPUT INSERTED.id
    VALUES (
        NEWID(),
        @userId,
        @userName,
        @userEmail,
        @userPhone,
        @startDatetime,
        @endDatetime,
        @notes,
        @priorityLevel,
        @onCallType,
        @onCallCategory,
        @roleRequired,
        @department,
        @region,
        @escalationLevel,
        1,
        @createdByUserId,
        @createdByName,
        GETDATE()
    )
    
    PRINT 'INSERT successful!'
    
    -- Show the inserted record
    SELECT TOP 1 *
    FROM on_call_schedule
    ORDER BY created_at DESC
    
    -- Rollback the test insert
    ROLLBACK TRANSACTION
    PRINT 'Transaction rolled back (test only)'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION
    
    PRINT 'ERROR during INSERT:'
    PRINT 'Error Number: ' + CAST(ERROR_NUMBER() AS VARCHAR)
    PRINT 'Error Message: ' + ERROR_MESSAGE()
    PRINT 'Error Line: ' + CAST(ERROR_LINE() AS VARCHAR)
END CATCH

GO

-- STEP 5: Check permissions
-- =============================================
PRINT ''
PRINT '=== STEP 5: Check Permissions for v0_app_user ==='

-- Check if v0_app_user has necessary permissions
SELECT 
    dp.permission_name,
    dp.state_desc
FROM sys.database_permissions dp
JOIN sys.database_principals dpr ON dp.grantee_principal_id = dpr.principal_id
JOIN sys.objects o ON dp.major_id = o.object_id
WHERE dpr.name = 'v0_application_role'
    AND o.name = 'on_call_schedule'

-- Check role membership
SELECT 
    USER_NAME(member_principal_id) as member,
    USER_NAME(role_principal_id) as role
FROM sys.database_role_members
WHERE USER_NAME(role_principal_id) = 'v0_application_role'

GO

-- STEP 6: Verify indexes exist
-- =============================================
PRINT ''
PRINT '=== STEP 6: Check Indexes ==='

SELECT 
    i.name as index_name,
    i.type_desc as index_type,
    COL_NAME(ic.object_id, ic.column_id) as column_name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE OBJECT_NAME(i.object_id) = 'on_call_schedule'
ORDER BY i.name, ic.key_ordinal

GO

-- STEP 7: Test with actual user data
-- =============================================
PRINT ''
PRINT '=== STEP 7: Test with Actual Staff Data ==='

-- Find actual staff members to use for testing
SELECT TOP 5
    id as user_id,
    clerk_user_id,
    first_name + ' ' + last_name as full_name,
    email,
    user_type
FROM app_users
WHERE is_active = 1
    AND user_type IN ('LIAISON', 'CASE_MANAGER', 'STAFF')
ORDER BY created_at DESC

PRINT ''
PRINT '=== Testing Complete ==='
PRINT 'If all steps passed without errors, the table is ready.'
PRINT 'If you see errors, note the step number and error message.'

