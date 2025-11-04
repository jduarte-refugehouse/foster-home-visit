-- Add "On-Call Schedule" navigation item to the database
-- This script is idempotent - safe to run multiple times

USE [RadiusBifrost]
GO

-- First, get the microservice ID for 'home-visits'
DECLARE @microservice_id UNIQUEIDENTIFIER
DECLARE @permission_id UNIQUEIDENTIFIER

SELECT @microservice_id = id 
FROM microservice_apps 
WHERE app_code = 'home-visits' AND is_active = 1

IF @microservice_id IS NULL
BEGIN
    PRINT 'ERROR: Could not find home-visits microservice'
    PRINT 'Please ensure the microservice is registered in microservice_apps table'
    RETURN
END

PRINT 'Found microservice ID: ' + CAST(@microservice_id AS VARCHAR(50))

-- Get the view_visits permission ID
SELECT @permission_id = id 
FROM permissions 
WHERE microservice_id = @microservice_id 
  AND permission_code = 'view_visits'

PRINT 'Found view_visits permission ID: ' + CAST(@permission_id AS VARCHAR(50))

-- Check if the navigation item already exists
IF EXISTS (
    SELECT 1 
    FROM navigation_items 
    WHERE microservice_id = @microservice_id 
      AND code = 'on_call_schedule'
)
BEGIN
    PRINT 'Navigation item "on_call_schedule" already exists - updating it'
    
    UPDATE navigation_items
    SET 
        title = 'On-Call Schedule',
        url = '/on-call-schedule',
        icon = 'Shield',
        permission_required = @permission_id,
        category = 'Navigation',
        order_index = 4,
        is_active = 1,
        updated_at = GETDATE(),
        updated_by_user_id = 'system'
    WHERE microservice_id = @microservice_id 
      AND code = 'on_call_schedule'
    
    PRINT '✓ Navigation item updated successfully'
END
ELSE
BEGIN
    PRINT 'Creating new navigation item "on_call_schedule"'
    
    INSERT INTO navigation_items (
        id,
        microservice_id,
        code,
        title,
        url,
        icon,
        permission_required,
        category,
        order_index,
        is_active,
        created_at,
        created_by_user_id
    )
    VALUES (
        NEWID(),
        @microservice_id,
        'on_call_schedule',
        'On-Call Schedule',
        '/on-call-schedule',
        'Shield',
        @permission_id,
        'Navigation',
        4,
        1,
        GETDATE(),
        'system'
    )
    
    PRINT '✓ Navigation item created successfully'
END

-- Display all navigation items for this microservice
PRINT ''
PRINT 'Current navigation items for home-visits:'
PRINT '----------------------------------------'
SELECT 
    ni.code,
    ni.title,
    ni.url,
    ni.category,
    ni.order_index,
    ni.is_active,
    p.permission_code as permission
FROM navigation_items ni
LEFT JOIN permissions p ON ni.permission_required = p.id
WHERE ni.microservice_id = @microservice_id
ORDER BY ni.category, ni.order_index

GO

