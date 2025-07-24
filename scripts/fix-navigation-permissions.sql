-- Fix navigation permissions to allow basic items for all users
PRINT '=== FIXING NAVIGATION PERMISSIONS ==='
PRINT ''

-- Get the microservice ID for home-visits
DECLARE @microservice_id UNIQUEIDENTIFIER
SELECT @microservice_id = id FROM microservice_apps WHERE app_code = 'home-visits'

IF @microservice_id IS NULL
BEGIN
    PRINT '❌ ERROR: home-visits microservice not found!'
    RETURN
END

PRINT '✅ Found home-visits microservice'
PRINT ''

-- Show current navigation items before changes
PRINT 'BEFORE - Navigation items with permissions:'
SELECT 
    code, 
    title, 
    category, 
    permission_required, 
    is_active
FROM navigation_items 
WHERE microservice_id = @microservice_id
ORDER BY category, order_index

PRINT ''

-- Update basic navigation items to have NULL permission requirements
UPDATE navigation_items 
SET permission_required = NULL
WHERE microservice_id = @microservice_id
  AND code IN ('dashboard', 'visits_calendar', 'reports', 'homes_map', 'homes_list')

PRINT '✅ Updated basic navigation items to require no permissions'
PRINT ''

-- Show navigation items after changes
PRINT 'AFTER - Navigation items with permissions:'
SELECT 
    code, 
    title, 
    category, 
    permission_required, 
    is_active
FROM navigation_items 
WHERE microservice_id = @microservice_id
ORDER BY category, order_index

PRINT ''
PRINT '=== NAVIGATION PERMISSIONS FIXED ==='
