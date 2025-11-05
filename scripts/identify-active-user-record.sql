-- =============================================
-- IDENTIFY ACTIVE USER RECORD AND DUPLICATES
-- =============================================
-- This script helps identify which app_users record is the active one
-- and which duplicates should be removed
-- =============================================

-- Replace with your email address
DECLARE @user_email NVARCHAR(255) = 'jduarte@refugehouse.org';

PRINT '=== Finding all records for your email ==='
PRINT ''

-- Find all records with this email
SELECT 
    id,
    clerk_user_id,
    email,
    first_name,
    last_name,
    core_role,
    is_active,
    created_at,
    updated_at,
    CASE 
        WHEN clerk_user_id IS NOT NULL AND clerk_user_id != '' THEN 'HAS CLERK ID'
        ELSE 'NO CLERK ID'
    END as clerk_status
FROM app_users
WHERE email = @user_email
ORDER BY updated_at DESC, created_at DESC;

PRINT ''
PRINT '=== Checking which record has active roles ==='
PRINT ''

-- Check which record has active roles
SELECT 
    u.id as user_id,
    u.email,
    u.clerk_user_id,
    COUNT(ur.id) as active_roles_count,
    STRING_AGG(ur.role_name, ', ') as roles
FROM app_users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
WHERE u.email = @user_email
GROUP BY u.id, u.email, u.clerk_user_id
ORDER BY active_roles_count DESC;

PRINT ''
PRINT '=== Checking which record has active permissions ==='
PRINT ''

-- Check which record has active permissions
SELECT 
    u.id as user_id,
    u.email,
    u.clerk_user_id,
    COUNT(up.id) as active_permissions_count,
    STRING_AGG(p.permission_code, ', ') as permissions
FROM app_users u
LEFT JOIN user_permissions up ON u.id = up.user_id AND up.is_active = 1
LEFT JOIN permissions p ON up.permission_id = p.id
WHERE u.email = @user_email
GROUP BY u.id, u.email, u.clerk_user_id
ORDER BY active_permissions_count DESC;

PRINT ''
PRINT '=== RECOMMENDATION: Keep the record with ==='
PRINT '1. A clerk_user_id (non-null, non-empty) - THIS IS THE ACTIVE ONE'
PRINT '2. Most recent updated_at timestamp'
PRINT '3. Active roles/permissions'
PRINT '4. is_active = 1'
PRINT ''
PRINT '=== To identify your current Clerk user ID, check your browser console ==='
PRINT 'or run this query to see which record Clerk is using:'
PRINT ''

-- The active record should be the one with a clerk_user_id
-- You can get your current Clerk user ID from:
-- 1. Browser console: window.location -> check Clerk session
-- 2. Or check the most recently updated record with a clerk_user_id

DECLARE @active_user_id UNIQUEIDENTIFIER;
DECLARE @inactive_user_ids NVARCHAR(MAX) = '';

-- Find the active record (one with clerk_user_id, most recent)
SELECT TOP 1 @active_user_id = id
FROM app_users
WHERE email = @user_email
    AND clerk_user_id IS NOT NULL 
    AND clerk_user_id != ''
ORDER BY updated_at DESC, created_at DESC;

IF @active_user_id IS NOT NULL
BEGIN
    PRINT '✅ ACTIVE RECORD IDENTIFIED: ' + CAST(@active_user_id AS NVARCHAR(50));
    PRINT '';
    
    -- Find all other records (duplicates to remove)
    SELECT 
        id,
        'DUPLICATE - CAN BE DELETED' as status,
        clerk_user_id,
        email,
        created_at,
        updated_at
    FROM app_users
    WHERE email = @user_email
        AND id != @active_user_id;
    
    PRINT '';
    PRINT '=== SAFE DELETE QUERY (commented out - uncomment to execute) ===';
    PRINT '-- DELETE FROM app_users WHERE email = @user_email AND id != @active_user_id;';
    PRINT '';
    PRINT '⚠️  BEFORE DELETING, verify:';
    PRINT '   1. The active record has your Clerk user ID';
    PRINT '   2. The active record has your roles/permissions';
    PRINT '   3. You are currently logged in and the app works';
END
ELSE
BEGIN
    PRINT '⚠️  WARNING: No record found with clerk_user_id';
    PRINT 'This might mean:';
    PRINT '   1. You need to log in again to sync Clerk user ID';
    PRINT '   2. Or the clerk_user_id is stored differently';
    PRINT '';
    PRINT 'In this case, keep the most recently updated record:';
    SELECT TOP 1 
        id,
        'KEEP THIS RECORD (most recent)' as status,
        clerk_user_id,
        email,
        created_at,
        updated_at
    FROM app_users
    WHERE email = @user_email
    ORDER BY updated_at DESC, created_at DESC;
END

GO

