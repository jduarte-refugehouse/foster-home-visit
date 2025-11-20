-- ============================================================================
-- Grant Home Liaison Access to All Existing Users
-- ============================================================================
-- This script grants the "home_liaison" role to all existing users in the
-- home-visits microservice so they can access the application.
--
-- Run this script after the monorepo migration to restore access for existing users.
-- ============================================================================

-- Step 1: Verify the microservice exists and get its ID
DECLARE @microserviceId UNIQUEIDENTIFIER
DECLARE @microserviceCode NVARCHAR(50) = 'home-visits'

SELECT @microserviceId = id 
FROM microservice_apps 
WHERE app_code = @microserviceCode

IF @microserviceId IS NULL
BEGIN
    PRINT 'ERROR: Microservice "home-visits" not found in microservice_apps table'
    PRINT 'Please ensure the microservice is registered before running this script'
    RETURN
END

PRINT 'Found microservice: ' + CAST(@microserviceId AS NVARCHAR(50))
PRINT ''

-- Step 2: Check existing roles for this microservice (for reference)
PRINT '=== Existing Roles in home-visits microservice ==='
SELECT 
    role_name,
    COUNT(*) as user_count
FROM user_roles
WHERE microservice_id = @microserviceId
    AND is_active = 1
GROUP BY role_name
ORDER BY role_name
PRINT ''

-- Step 3: Check how many users currently have access
PRINT '=== Current Access Status ==='
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT ur.user_id) as users_with_roles,
    COUNT(DISTINCT up.user_id) as users_with_permissions,
    COUNT(DISTINCT CASE WHEN ur.user_id IS NOT NULL OR up.user_id IS NOT NULL THEN u.id END) as users_with_access
FROM app_users u
LEFT JOIN user_roles ur ON ur.user_id = u.id 
    AND ur.microservice_id = @microserviceId 
    AND ur.is_active = 1
LEFT JOIN user_permissions up ON up.user_id = u.id
    AND up.is_active = 1
    AND EXISTS (
        SELECT 1 FROM permissions p 
        WHERE p.id = up.permission_id 
        AND p.microservice_id = @microserviceId
    )
WHERE u.is_active = 1
PRINT ''

-- Step 4: Grant "home_liaison" role to all active users who don't already have it
PRINT '=== Granting home_liaison role to users without access ==='

INSERT INTO user_roles (
    id,
    user_id,
    microservice_id,
    role_name,
    granted_by,
    granted_at,
    is_active
)
SELECT 
    NEWID() as id,
    u.id as user_id,
    @microserviceId as microservice_id,
    'home_liaison' as role_name,
    'system' as granted_by,
    GETDATE() as granted_at,
    1 as is_active
FROM app_users u
WHERE u.is_active = 1
    -- Only grant to users who don't already have a role for this microservice
    AND NOT EXISTS (
        SELECT 1 
        FROM user_roles ur 
        WHERE ur.user_id = u.id 
            AND ur.microservice_id = @microserviceId
            AND ur.is_active = 1
    )

DECLARE @usersGranted INT = @@ROWCOUNT
PRINT 'Granted home_liaison role to ' + CAST(@usersGranted AS NVARCHAR(10)) + ' users'
PRINT ''

-- Step 5: Verify the grants
PRINT '=== Verification: Users with home_liaison role ==='
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    ur.role_name,
    ur.granted_at
FROM app_users u
INNER JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.microservice_id = @microserviceId
    AND ur.role_name = 'home_liaison'
    AND ur.is_active = 1
    AND u.is_active = 1
ORDER BY u.email
PRINT ''

-- Step 6: Final summary
PRINT '=== Final Access Summary ==='
SELECT 
    COUNT(DISTINCT u.id) as total_active_users,
    COUNT(DISTINCT ur.user_id) as users_with_roles,
    COUNT(DISTINCT up.user_id) as users_with_permissions,
    COUNT(DISTINCT CASE WHEN ur.user_id IS NOT NULL OR up.user_id IS NOT NULL THEN u.id END) as users_with_access
FROM app_users u
LEFT JOIN user_roles ur ON ur.user_id = u.id 
    AND ur.microservice_id = @microserviceId 
    AND ur.is_active = 1
LEFT JOIN user_permissions up ON up.user_id = u.id
    AND up.is_active = 1
    AND EXISTS (
        SELECT 1 FROM permissions p 
        WHERE p.id = up.permission_id 
        AND p.microservice_id = @microserviceId
    )
WHERE u.is_active = 1

PRINT ''
PRINT '=== Script Complete ==='
PRINT 'All active users should now have access to the home-visits microservice.'
PRINT 'Users can now log in without seeing the "Request Access" page.'

