-- Assign admin permissions to the mock user for development
-- This script gives the mock user (admin@example.com) full admin permissions

PRINT '=== ASSIGNING MOCK USER PERMISSIONS ==='

-- First, let's see what we're working with
PRINT ''
PRINT '1. CURRENT MOCK USER:'
SELECT 
    id,
    clerk_user_id,
    email,
    first_name,
    last_name,
    is_active
FROM app_users 
WHERE email = 'admin@example.com'

PRINT ''
PRINT '2. AVAILABLE PERMISSIONS:'
SELECT 
    p.id,
    p.permission_code,
    p.permission_name,
    p.description,
    ma.app_code
FROM permissions p
INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
WHERE ma.app_code = 'home-visits'
ORDER BY p.permission_code

-- Get the mock user ID and microservice ID
DECLARE @mock_user_id UNIQUEIDENTIFIER
DECLARE @microservice_id UNIQUEIDENTIFIER

SELECT @mock_user_id = id FROM app_users WHERE email = 'admin@example.com'
SELECT @microservice_id = id FROM microservice_apps WHERE app_code = 'home-visits'

PRINT ''
PRINT '3. ASSIGNING PERMISSIONS TO MOCK USER:'
PRINT 'Mock User ID: ' + CAST(@mock_user_id AS VARCHAR(50))
PRINT 'Microservice ID: ' + CAST(@microservice_id AS VARCHAR(50))

-- Assign all admin permissions to the mock user
INSERT INTO user_permissions (user_id, permission_id, granted_at, is_active)
SELECT 
    @mock_user_id,
    p.id,
    GETDATE(),
    1
FROM permissions p
INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
WHERE ma.app_code = 'home-visits'
  AND p.permission_code IN ('manage_users', 'system_admin', 'view_dashboard', 'view_homes', 'edit_homes', 'view_diagnostics')
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = @mock_user_id 
      AND up.permission_id = p.id
  )

PRINT ''
PRINT '4. VERIFICATION - MOCK USER PERMISSIONS:'
SELECT 
    au.email,
    au.first_name,
    au.last_name,
    p.permission_code,
    p.permission_name,
    up.granted_at,
    up.is_active
FROM app_users au
INNER JOIN user_permissions up ON au.id = up.user_id
INNER JOIN permissions p ON up.permission_id = p.id
INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
WHERE au.email = 'admin@example.com'
  AND ma.app_code = 'home-visits'
  AND up.is_active = 1
ORDER BY p.permission_code

PRINT ''
PRINT '=== MOCK USER PERMISSIONS SETUP COMPLETE ==='
