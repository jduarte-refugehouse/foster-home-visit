-- Register MyHouse Portal Microservice
-- This script registers the myhouse-portal microservice in the database
-- Run this script on the RadiusBifrost database before deploying the microservice

-- ============================================================================
-- 1. Register the Microservice
-- ============================================================================

INSERT INTO microservice_apps (
    id,
    app_code,
    app_name,
    description,
    is_active,
    created_at
)
VALUES (
    NEWID(),
    'myhouse-portal',
    'MyHouse Portal',
    'Foster parent information sharing and communication portal',
    1,
    GETDATE()
);

-- ============================================================================
-- 2. Create Navigation Items
-- ============================================================================

-- Get the microservice ID
DECLARE @microserviceId UNIQUEIDENTIFIER = (
    SELECT id FROM microservice_apps WHERE app_code = 'myhouse-portal'
);

-- Add navigation items
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
VALUES
    -- Main navigation
    (NEWID(), @microserviceId, 'dashboard', 'Dashboard', '/dashboard', 'Home', 'Main', 1, NULL, 1, GETDATE());

-- ============================================================================
-- 3. Create Permissions (Optional - for future use)
-- ============================================================================

INSERT INTO permissions (
    id,
    microservice_id,
    permission_code,
    permission_name,
    description,
    is_active,
    created_at
)
VALUES
    (NEWID(), @microserviceId, 'view_dashboard', 'View Dashboard', 'Allows viewing the MyHouse Portal dashboard', 1, GETDATE()),
    (NEWID(), @microserviceId, 'view_documents', 'View Documents', 'Allows viewing shared documents', 1, GETDATE()),
    (NEWID(), @microserviceId, 'send_messages', 'Send Messages', 'Allows sending messages to case workers', 1, GETDATE());

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify microservice was created
SELECT * FROM microservice_apps WHERE app_code = 'myhouse-portal';

-- Verify navigation items were created
SELECT ni.* 
FROM navigation_items ni
INNER JOIN microservice_apps ma ON ni.microservice_id = ma.id
WHERE ma.app_code = 'myhouse-portal'
ORDER BY ni.category, ni.order_index;

-- Verify permissions were created
SELECT p.* 
FROM permissions p
INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
WHERE ma.app_code = 'myhouse-portal'
ORDER BY p.permission_code;

-- ============================================================================
-- Grant Access to Test Users (Optional)
-- ============================================================================

-- Example: Grant view_dashboard permission to a specific user
-- Uncomment and modify as needed:

/*
DECLARE @userId UNIQUEIDENTIFIER = (SELECT id FROM app_users WHERE email = 'test@refugehouse.org');
DECLARE @permissionId UNIQUEIDENTIFIER = (
    SELECT p.id 
    FROM permissions p
    INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
    WHERE ma.app_code = 'myhouse-portal' AND p.permission_code = 'view_dashboard'
);

INSERT INTO user_permissions (id, user_id, permission_id, is_active, created_at)
VALUES (NEWID(), @userId, @permissionId, 1, GETDATE());
*/

