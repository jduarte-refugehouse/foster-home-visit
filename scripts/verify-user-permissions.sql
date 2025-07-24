-- Comprehensive verification of user permissions setup
-- This script checks all aspects of the permission system

PRINT '=== USER PERMISSIONS VERIFICATION ==='

PRINT ''
PRINT '1. ALL APP USERS:'
SELECT 
    id,
    clerk_user_id,
    email,
    first_name,
    last_name,
    is_active,
    created_at
FROM app_users 
ORDER BY email

PRINT ''
PRINT '2. MICROSERVICE APPS:'
SELECT 
    id,
    app_code,
    app_name,
    description,
    is_active,
    created_at
FROM microservice_apps
ORDER BY app_code

PRINT ''
PRINT '3. PERMISSIONS FOR HOME-VISITS:'
SELECT 
    p.id,
    p.permission_code,
    p.permission_name,
    p.description,
    p.category,
    ma.app_code
FROM permissions p
INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
WHERE ma.app_code = 'home-visits'
ORDER BY p.category, p.permission_code

PRINT ''
PRINT '4. ALL USER PERMISSIONS:'
SELECT 
    au.email,
    au.first_name,
    au.last_name,
    p.permission_code,
    p.permission_name,
    up.granted_at,
    up.expires_at,
    up.is_active,
    ma.app_code
FROM app_users au
INNER JOIN user_permissions up ON au.id = up.user_id
INNER JOIN permissions p ON up.permission_id = p.id
INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
WHERE up.is_active = 1
  AND (up.expires_at IS NULL OR up.expires_at > GETDATE())
ORDER BY au.email, ma.app_code, p.permission_code

PRINT ''
PRINT '5. NAVIGATION ITEMS:'
SELECT 
    ni.code,
    ni.title,
    ni.category,
    ni.permission_required,
    ni.order_index,
    ni.is_active,
    ma.app_code
FROM navigation_items ni
INNER JOIN microservice_apps ma ON ni.microservice_id = ma.id
WHERE ma.app_code = 'home-visits'
  AND ni.is_active = 1
ORDER BY ni.category, ni.order_index

PRINT ''
PRINT '6. PERMISSION MAPPING CHECK:'
PRINT 'Checking if navigation permission requirements match actual permissions...'

SELECT 
    ni.permission_required as 'Navigation Requires',
    CASE 
        WHEN EXISTS (SELECT 1 FROM permissions p INNER JOIN microservice_apps ma ON p.microservice_id = ma.id WHERE p.permission_code = ni.permission_required AND ma.app_code = 'home-visits') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as 'Permission Exists'
FROM navigation_items ni
INNER JOIN microservice_apps ma ON ni.microservice_id = ma.id
WHERE ma.app_code = 'home-visits'
  AND ni.permission_required IS NOT NULL
  AND ni.permission_required != ''
GROUP BY ni.permission_required

PRINT ''
PRINT '=== VERIFICATION COMPLETE ==='
