-- =============================================
-- Create Service Domain Admin Microservice
-- =============================================
-- This script sets up the global administration microservice
-- for managing users, microservices, and domain configuration

-- Step 1: Register the Microservice
-- =============================================
IF NOT EXISTS (SELECT 1 FROM microservice_apps WHERE app_code = 'service-domain-admin')
BEGIN
    INSERT INTO microservice_apps (
        id,
        app_code,
        app_name,
        app_url,
        description,
        is_active,
        created_at
    )
    VALUES (
        NEWID(),
        'service-domain-admin',
        'Refuge House Microservice Domain Administration',
        '/globaladmin',
        'User Administration and Service Configuration for the complete Microservice Domain Framework',
        1,
        GETDATE()
    )
    PRINT '✅ Microservice registered: service-domain-admin'
END
ELSE
BEGIN
    PRINT 'ℹ️ Microservice already exists: service-domain-admin'
    -- Update app_url if it's NULL
    UPDATE microservice_apps
    SET app_url = '/globaladmin'
    WHERE app_code = 'service-domain-admin' AND app_url IS NULL
    IF @@ROWCOUNT > 0
    BEGIN
        PRINT '✅ Updated app_url to /globaladmin'
    END
END

-- Step 2: Get the Microservice ID
-- =============================================
DECLARE @microserviceId UNIQUEIDENTIFIER = (
    SELECT id FROM microservice_apps WHERE app_code = 'service-domain-admin'
)

PRINT '📋 Microservice ID: ' + CAST(@microserviceId AS VARCHAR(36))

-- Step 3: Create Permissions
-- =============================================
-- Permission: manage_users
IF NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'manage_users' AND microservice_id = @microserviceId)
BEGIN
    INSERT INTO permissions (
        id,
        microservice_id,
        permission_code,
        permission_name,
        description,
        created_at
    )
    VALUES (
        NEWID(),
        @microserviceId,
        'manage_users',
        'Manage Users',
        'Allows managing users across all microservices, including roles and permissions',
        GETDATE()
    )
    PRINT '✅ Permission created: manage_users'
END

-- Permission: manage_configuration
IF NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'manage_configuration' AND microservice_id = @microserviceId)
BEGIN
    INSERT INTO permissions (
        id,
        microservice_id,
        permission_code,
        permission_name,
        description,
        created_at
    )
    VALUES (
        NEWID(),
        @microserviceId,
        'manage_configuration',
        'Manage Configuration',
        'Allows managing microservice configuration, navigation, and domain settings',
        GETDATE()
    )
    PRINT '✅ Permission created: manage_configuration'
END

-- Step 4: Note on Roles
-- =============================================
-- Roles are not stored in a separate table - they are just strings stored in user_roles.role_name
-- Roles will be granted directly to users via the user_roles table when needed.
-- The roles for this microservice are:
--   - 'global_admin' (full system administration access)
--   - 'domain_admin' (domain-level administrative access)
-- 
-- To grant roles to users, use the user_roles table directly:
--   INSERT INTO user_roles (id, user_id, microservice_id, role_name, granted_by, granted_at, is_active)
--   VALUES (NEWID(), @userId, @microserviceId, 'global_admin', 'system', GETDATE(), 1)
--
-- Note: Permissions can be granted directly to users via user_permissions table,
-- or users can be granted roles. The application code should handle role-to-permission mapping.
PRINT 'ℹ️  Roles are stored as strings in user_roles.role_name (no separate roles table)'
PRINT '   Roles: global_admin, domain_admin'

-- Step 6: Create Navigation Items
-- =============================================
-- Navigation: User Admin
IF NOT EXISTS (SELECT 1 FROM navigation_items WHERE code = 'user_admin' AND microservice_id = @microserviceId)
BEGIN
    INSERT INTO navigation_items (
        id,
        microservice_id,
        code,
        title,
        url,
        icon,
        category,
        order_index,
        permission_required,
        is_active,
        created_at
    )
    VALUES (
        NEWID(),
        @microserviceId,
        'user_admin',
        'User Admin',
        '/globaladmin/users',
        'Users',
        'Main',
        1,
        'manage_users',
        1,
        GETDATE()
    )
    PRINT '✅ Navigation item created: User Admin'
END

-- Navigation: Microservice Configuration
IF NOT EXISTS (SELECT 1 FROM navigation_items WHERE code = 'microservice_config' AND microservice_id = @microserviceId)
BEGIN
    INSERT INTO navigation_items (
        id,
        microservice_id,
        code,
        title,
        url,
        icon,
        category,
        order_index,
        permission_required,
        is_active,
        created_at
    )
    VALUES (
        NEWID(),
        @microserviceId,
        'microservice_config',
        'Microservice Configuration',
        '/globaladmin/microservices',
        'Settings',
        'Main',
        2,
        'manage_configuration',
        1,
        GETDATE()
    )
    PRINT '✅ Navigation item created: Microservice Configuration'
END

-- Navigation: Domain Admin
IF NOT EXISTS (SELECT 1 FROM navigation_items WHERE code = 'domain_admin' AND microservice_id = @microserviceId)
BEGIN
    INSERT INTO navigation_items (
        id,
        microservice_id,
        code,
        title,
        url,
        icon,
        category,
        order_index,
        permission_required,
        is_active,
        created_at
    )
    VALUES (
        NEWID(),
        @microserviceId,
        'domain_admin',
        'Domain Admin',
        '/globaladmin/domains',
        'Globe',
        'Main',
        3,
        'manage_configuration',
        1,
        GETDATE()
    )
    PRINT '✅ Navigation item created: Domain Admin'
END

-- Navigation: Dashboard (always accessible)
IF NOT EXISTS (SELECT 1 FROM navigation_items WHERE code = 'dashboard' AND microservice_id = @microserviceId)
BEGIN
    INSERT INTO navigation_items (
        id,
        microservice_id,
        code,
        title,
        url,
        icon,
        category,
        order_index,
        permission_required,
        is_active,
        created_at
    )
    VALUES (
        NEWID(),
        @microserviceId,
        'dashboard',
        'Dashboard',
        '/globaladmin',
        'Home',
        'Main',
        0,
        NULL,
        1,
        GETDATE()
    )
    PRINT '✅ Navigation item created: Dashboard'
END

-- Step 7: Grant Roles to Users
-- =============================================
-- Grant global_admin role to specified users
PRINT ''
PRINT '=== Granting global_admin role to users ==='

-- Grant role to user (handles multiple users with same email by selecting the most recent active user)
INSERT INTO user_roles (
    id,
    user_id,
    microservice_id,
    role_name,
    granted_by,
    granted_at,
    is_active
)
SELECT TOP 1
    NEWID() as id,
    u.id as user_id,
    @microserviceId as microservice_id,
    'global_admin' as role_name,
    'system' as granted_by,
    GETDATE() as granted_at,
    1 as is_active
FROM app_users u
WHERE u.email = 'jduarte@refugehouse.org'
    AND u.is_active = 1
    -- Only grant to users who don't already have this role for this microservice
    AND NOT EXISTS (
        SELECT 1 
        FROM user_roles ur 
        WHERE ur.user_id = u.id 
            AND ur.microservice_id = @microserviceId 
            AND ur.role_name = 'global_admin'
            AND ur.is_active = 1
    )
ORDER BY u.created_at DESC  -- Get the most recent user if multiple exist

DECLARE @usersGranted INT = @@ROWCOUNT
PRINT 'Granted global_admin role to ' + CAST(@usersGranted AS NVARCHAR(10)) + ' user(s)'
PRINT ''

-- Step 8: Summary
-- =============================================
PRINT ''
PRINT '============================================='
PRINT '✅ Service Domain Admin Setup Complete!'
PRINT '============================================='
PRINT 'Microservice Code: service-domain-admin'
PRINT 'Display Name: Refuge House Microservice Domain Administration'
PRINT ''
PRINT 'Roles Available (grant via user_roles table):'
PRINT '  - global_admin (full system access)'
PRINT '  - domain_admin (domain-level access)'
PRINT ''
PRINT 'Permissions Created:'
PRINT '  - manage_users'
PRINT '  - manage_configuration'
PRINT ''
PRINT 'Navigation Items Created:'
PRINT '  - Dashboard (/globaladmin)'
PRINT '  - User Admin (/globaladmin/users)'
PRINT '  - Microservice Configuration (/globaladmin/microservices)'
PRINT '  - Domain Admin (/globaladmin/domains)'
PRINT ''
PRINT 'Next Steps:'
PRINT '  1. Verify users were granted global_admin role (see output above)'
PRINT '  2. Create Vercel project with MICROSERVICE_CODE=service-domain-admin'
PRINT '  3. Configure production and preview branches'
PRINT ''
PRINT 'Note: To add more users, update the @usersToGrant table variable in Step 7'
PRINT '============================================='

