-- =============================================
-- TEST INSERT BASED ON ACTUAL UI DATA
-- =============================================
-- This simulates the exact insert the UI is trying to make
-- =============================================

-- The problem: UI is sending Clerk user ID (string) 
-- but table expects app_users.id (UNIQUEIDENTIFIER)

PRINT '=== Testing User ID Lookup ==='
PRINT ''

-- The Clerk user ID from the error
DECLARE @ClerkUserId NVARCHAR(255) = 'user_2zxYO2240Vi6TWa1w0iVztNQc1N'

-- Find the corresponding app_users.id (UNIQUEIDENTIFIER)
SELECT 
    id as app_user_id,
    clerk_user_id,
    first_name + ' ' + last_name as full_name,
    email
FROM app_users
WHERE clerk_user_id = @ClerkUserId

PRINT ''
PRINT '=== If the query above returns a result, we found the user ==='
PRINT 'The id column is the UNIQUEIDENTIFIER we should use'
PRINT ''

-- Now test the INSERT with both the GUID and Clerk ID
DECLARE @AppUserId UNIQUEIDENTIFIER
SELECT @AppUserId = id FROM app_users WHERE clerk_user_id = @ClerkUserId

IF @AppUserId IS NOT NULL
BEGIN
    PRINT 'Found user with GUID: ' + CAST(@AppUserId AS NVARCHAR(50))
    
    -- Simulate the INSERT
    BEGIN TRY
        BEGIN TRANSACTION
        
        DECLARE @TestId UNIQUEIDENTIFIER = NEWID()
        
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
        VALUES (
            @TestId,
            @AppUserId,  -- Using the GUID from app_users
            'Test User',
            'test@example.com',
            '555-1234',
            '2025-11-03 08:00:00',
            '2025-11-03 20:00:00',
            'Test assignment',
            'normal',
            'general',
            NULL,
            'liaison',
            NULL,
            NULL,
            1,
            1,
            @ClerkUserId,  -- Store Clerk ID in created_by_user_id
            'Test Creator',
            GETDATE()
        )
        
        PRINT 'SUCCESS! Insert worked with GUID'
        SELECT * FROM on_call_schedule WHERE id = @TestId
        
        ROLLBACK TRANSACTION
        PRINT 'Rolled back test insert'
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        PRINT 'ERROR: ' + ERROR_MESSAGE()
    END CATCH
END
ELSE
BEGIN
    PRINT 'ERROR: User not found with Clerk ID: ' + @ClerkUserId
    PRINT 'This user needs to be in app_users table first'
END

GO

-- =============================================
-- TEST THE PROBLEMATIC WHERE CLAUSE
-- =============================================
PRINT ''
PRINT '=== Testing the WHERE clause that''s failing ==='
PRINT ''

-- This will FAIL because we're comparing UNIQUEIDENTIFIER to string
BEGIN TRY
    DECLARE @ClerkId NVARCHAR(255) = 'user_2zxYO2240Vi6TWa1w0iVztNQc1N'
    
    SELECT COUNT(*) as count_with_clerk_id
    FROM on_call_schedule
    WHERE user_id = @ClerkId  -- This comparison will fail!
        AND is_active = 1
        AND is_deleted = 0
    
    PRINT 'Query succeeded (unexpected!)'
END TRY
BEGIN CATCH
    PRINT 'Query FAILED as expected:'
    PRINT 'Error: ' + ERROR_MESSAGE()
    PRINT ''
    PRINT 'This is the bug! Cannot compare UNIQUEIDENTIFIER (user_id) to NVARCHAR (Clerk ID)'
END CATCH

GO

-- =============================================
-- SOLUTION: Look up the GUID first
-- =============================================
PRINT ''
PRINT '=== Testing the CORRECTED query ==='
PRINT ''

DECLARE @ClerkId2 NVARCHAR(255) = 'user_2zxYO2240Vi6TWa1w0iVztNQc1N'
DECLARE @UserId UNIQUEIDENTIFIER

-- First get the GUID
SELECT @UserId = id FROM app_users WHERE clerk_user_id = @ClerkId2

IF @UserId IS NOT NULL
BEGIN
    -- Now query with the GUID
    SELECT COUNT(*) as count_with_guid
    FROM on_call_schedule
    WHERE user_id = @UserId  -- Using GUID now!
        AND is_active = 1
        AND is_deleted = 0
    
    PRINT 'Query succeeded with GUID lookup!'
END
ELSE
BEGIN
    PRINT 'User not found - would skip the overlap check (which is fine)'
END

GO

PRINT ''
PRINT '=== DIAGNOSIS COMPLETE ==='
PRINT ''
PRINT 'THE FIX: The API needs to:'
PRINT '1. Accept clerkUserId as a string parameter'
PRINT '2. Look up the app_users.id (GUID) from clerk_user_id'
PRINT '3. Use the GUID for all database queries'
PRINT ''

