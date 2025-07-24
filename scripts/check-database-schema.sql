-- Check database schema and current data
PRINT '=== DATABASE SCHEMA AND DATA CHECK ==='
PRINT ''

-- Check if tables exist
PRINT '1. TABLE EXISTENCE CHECK:'
IF OBJECT_ID('microservice_apps', 'U') IS NOT NULL
    PRINT '✅ microservice_apps table exists'
ELSE
    PRINT '❌ microservice_apps table missing'

IF OBJECT_ID('navigation_items', 'U') IS NOT NULL
    PRINT '✅ navigation_items table exists'
ELSE
    PRINT '❌ navigation_items table missing'

IF OBJECT_ID('app_users', 'U') IS NOT NULL
    PRINT '✅ app_users table exists'
ELSE
    PRINT '❌ app_users table missing'

IF OBJECT_ID('permissions', 'U') IS NOT NULL
    PRINT '✅ permissions table exists'
ELSE
    PRINT '❌ permissions table missing'

IF OBJECT_ID('user_permissions', 'U') IS NOT NULL
    PRINT '✅ user_permissions table exists'
ELSE
    PRINT '❌ user_permissions table missing'

PRINT ''
PRINT '2. MICROSERVICE APPS:'
SELECT app_code, app_name, description, is_active, created_at FROM microservice_apps

PRINT ''
PRINT '3. NAVIGATION ITEMS:'
SELECT 
    ni.code, 
    ni.title, 
    ni.url, 
    ni.icon, 
    ni.permission_required, 
    ni.category, 
    ni.order_index, 
    ni.is_active,
    ma.app_code
FROM navigation_items ni
INNER JOIN microservice_apps ma ON ni.microservice_id = ma.id
ORDER BY ni.category, ni.order_index

PRINT ''
PRINT '4. APP USERS:'
SELECT clerk_user_id, email, first_name, last_name, is_active, created_at FROM app_users

PRINT ''
PRINT '5. PERMISSIONS:'
SELECT 
    p.permission_code, 
    p.permission_name, 
    p.description,
    ma.app_code
FROM permissions p
INNER JOIN microservice_apps ma ON p.microservice_id = ma.id

PRINT ''
PRINT '6. USER PERMISSIONS:'
SELECT 
    au.email,
    au.first_name,
    au.last_name,
    p.permission_code,
    up.granted_at,
    up.is_active
FROM app_users au
INNER JOIN user_permissions up ON au.id = up.user_id
INNER JOIN permissions p ON up.permission_id = p.id
ORDER BY au.email, p.permission_code

PRINT ''
PRINT '=== SCHEMA CHECK COMPLETE ==='
