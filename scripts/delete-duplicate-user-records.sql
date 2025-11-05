-- =============================================
-- SAFELY DELETE DUPLICATE USER RECORDS
-- =============================================
-- ⚠️  WARNING: Run identify-active-user-record.sql FIRST
-- ⚠️  Verify which record is active before deleting
-- =============================================

-- Replace with your email address
DECLARE @user_email NVARCHAR(255) = 'jduarte@refugehouse.org';

-- Replace with the ID of the record you want to KEEP (the active one)
DECLARE @keep_user_id UNIQUEIDENTIFIER = NULL; -- SET THIS TO THE ACTIVE USER ID

-- =============================================
-- STEP 1: VERIFY BEFORE DELETING
-- =============================================
PRINT '=== VERIFICATION: Records that will be DELETED ==='
PRINT ''

IF @keep_user_id IS NULL
BEGIN
    PRINT '❌ ERROR: @keep_user_id is not set!';
    PRINT 'Please set @keep_user_id to the ID of the record you want to KEEP';
    PRINT '';
    PRINT 'Run identify-active-user-record.sql first to find the active record ID';
    RETURN;
END

-- Show what will be deleted
SELECT 
    id,
    'WILL BE DELETED' as action,
    clerk_user_id,
    email,
    first_name,
    last_name,
    created_at,
    updated_at
FROM app_users
WHERE email = @user_email
    AND id != @keep_user_id;

PRINT ''
PRINT '=== Record that will be KEPT ==='
SELECT 
    id,
    'WILL BE KEPT' as action,
    clerk_user_id,
    email,
    first_name,
    last_name,
    created_at,
    updated_at
FROM app_users
WHERE id = @keep_user_id;

PRINT ''
PRINT '=== BEFORE DELETING, VERIFY: ==='
PRINT '1. The KEEP record has a clerk_user_id (non-null)';
PRINT '2. The KEEP record has your roles/permissions';
PRINT '3. The DELETE records are truly duplicates';
PRINT ''
PRINT 'Press Ctrl+C to cancel, or uncomment the DELETE statement below to proceed';
PRINT ''

-- =============================================
-- STEP 2: DELETE DUPLICATES (UNCOMMENT TO EXECUTE)
-- =============================================

-- First, delete related records (user_roles, user_permissions)
-- This prevents foreign key constraint errors

/*
BEGIN TRANSACTION;

-- Delete user roles for duplicate records
DELETE ur
FROM user_roles ur
INNER JOIN app_users u ON ur.user_id = u.id
WHERE u.email = @user_email
    AND u.id != @keep_user_id;

PRINT 'Deleted user_roles for duplicate records';

-- Delete user permissions for duplicate records
DELETE up
FROM user_permissions up
INNER JOIN app_users u ON up.user_id = u.id
WHERE u.email = @user_email
    AND u.id != @keep_user_id;

PRINT 'Deleted user_permissions for duplicate records';

-- Delete the duplicate user records
DELETE FROM app_users
WHERE email = @user_email
    AND id != @keep_user_id;

PRINT 'Deleted duplicate app_users records';

-- Verify deletion
SELECT 
    id,
    clerk_user_id,
    email,
    first_name,
    last_name
FROM app_users
WHERE email = @user_email;

-- If everything looks good, commit the transaction
-- COMMIT TRANSACTION;

-- If something looks wrong, rollback:
-- ROLLBACK TRANSACTION;
*/

PRINT ''
PRINT '⚠️  Remember to uncomment the DELETE statements above to actually delete!';
PRINT '⚠️  The transaction is commented out for safety - review carefully before executing!';

GO

