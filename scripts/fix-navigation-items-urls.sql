-- =============================================
-- Fix Navigation Items and Menu Management URLs
-- =============================================
-- Updates both "Navigation Items" and "Menu Management" to point to /menu-management
-- instead of /system-admin with query parameters

-- Update Navigation Items
UPDATE navigation_items
SET 
    url = '/menu-management',
    updated_at = GETDATE()
WHERE code = 'sysadmin_navigation_items'
  AND microservice_id = (SELECT id FROM microservice_apps WHERE app_code = 'service-domain-admin')

IF @@ROWCOUNT > 0
BEGIN
    PRINT '✅ Updated Navigation Items URL to /menu-management'
END
ELSE
BEGIN
    PRINT '⚠️  Navigation Items not found or already updated'
END

-- Update Menu Management
UPDATE navigation_items
SET 
    url = '/menu-management',
    updated_at = GETDATE()
WHERE code = 'sysadmin_menu_management'
  AND microservice_id = (SELECT id FROM microservice_apps WHERE app_code = 'service-domain-admin')

IF @@ROWCOUNT > 0
BEGIN
    PRINT '✅ Updated Menu Management URL to /menu-management'
END
ELSE
BEGIN
    PRINT '⚠️  Menu Management not found or already updated'
END

-- Verify the updates
SELECT 
    code,
    title,
    url,
    category,
    is_active
FROM navigation_items
WHERE code IN ('sysadmin_navigation_items', 'sysadmin_menu_management')
  AND microservice_id = (SELECT id FROM microservice_apps WHERE app_code = 'service-domain-admin')

PRINT ''
PRINT '============================================='
PRINT '✅ Navigation Items URLs Updated!'
PRINT '============================================='

