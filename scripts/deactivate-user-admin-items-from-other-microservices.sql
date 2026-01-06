-- =============================================
-- Deactivate User Admin and System Admin Navigation Items
-- =============================================
-- This script safely deactivates (soft-deletes) user admin and system admin
-- navigation items from microservices OTHER than service-domain-admin
-- 
-- SAFETY: Uses soft-delete (is_active = 0) so items can be restored if needed
-- Only affects items in microservices that are NOT service-domain-admin

DECLARE @adminMicroserviceId UNIQUEIDENTIFIER = (
    SELECT id FROM microservice_apps WHERE app_code = 'service-domain-admin'
)

IF @adminMicroserviceId IS NULL
BEGIN
    PRINT '❌ ERROR: service-domain-admin microservice not found'
    RETURN
END

PRINT '✅ Found service-domain-admin microservice: ' + CAST(@adminMicroserviceId AS NVARCHAR(50))
PRINT ''

-- Deactivate user admin related items (from other microservices)
UPDATE navigation_items
SET 
    is_active = 0,
    updated_at = GETDATE()
WHERE microservice_id != @adminMicroserviceId
  AND (
      code IN ('user_management', 'user_admin', 'user_invitations', 'sysadmin_user_management', 'user_administration')
      OR title LIKE '%User Management%'
      OR title LIKE '%User Admin%'
      OR title LIKE '%User Administration%'
  )
  AND is_active = 1

DECLARE @userAdminCount INT = @@ROWCOUNT
IF @userAdminCount > 0
BEGIN
    PRINT '✅ Deactivated ' + CAST(@userAdminCount AS NVARCHAR(10)) + ' user admin navigation item(s)'
END
ELSE
BEGIN
    PRINT 'ℹ️  No user admin items found to deactivate'
END

-- Deactivate system admin related items (from other microservices)
UPDATE navigation_items
SET 
    is_active = 0,
    updated_at = GETDATE()
WHERE microservice_id != @adminMicroserviceId
  AND (
      code IN ('system_admin', 'system_administration', 'sysadmin_system_config', 'system_configuration')
      OR title LIKE '%System Admin%'
      OR title LIKE '%System Administration%'
      OR title LIKE '%System Configuration%'
  )
  AND is_active = 1

DECLARE @systemAdminCount INT = @@ROWCOUNT
IF @systemAdminCount > 0
BEGIN
    PRINT '✅ Deactivated ' + CAST(@systemAdminCount AS NVARCHAR(10)) + ' system admin navigation item(s)'
END
ELSE
BEGIN
    PRINT 'ℹ️  No system admin items found to deactivate'
END

-- Show summary of what was deactivated
PRINT ''
PRINT '============================================='
PRINT 'Summary of Deactivated Items:'
PRINT '============================================='

SELECT 
    ni.code,
    ni.title,
    ni.url,
    ma.app_code as microservice_code,
    ma.app_name as microservice_name,
    ni.category,
    ni.is_active,
    ni.updated_at
FROM navigation_items ni
INNER JOIN microservice_apps ma ON ni.microservice_id = ma.id
WHERE ni.microservice_id != @adminMicroserviceId
  AND ni.is_active = 0
  AND (
      ni.code IN ('user_management', 'user_admin', 'user_invitations', 'sysadmin_user_management', 'user_administration', 
                  'system_admin', 'system_administration', 'sysadmin_system_config', 'system_configuration')
      OR ni.title LIKE '%User Management%'
      OR ni.title LIKE '%User Admin%'
      OR ni.title LIKE '%User Administration%'
      OR ni.title LIKE '%System Admin%'
      OR ni.title LIKE '%System Administration%'
      OR ni.title LIKE '%System Configuration%'
  )
  AND ni.updated_at >= DATEADD(minute, -5, GETDATE()) -- Only show items updated in last 5 minutes
ORDER BY ma.app_code, ni.category, ni.title

PRINT ''
PRINT '============================================='
PRINT '✅ Deactivation Complete!'
PRINT '============================================='
PRINT 'Total items deactivated: ' + CAST((@userAdminCount + @systemAdminCount) AS NVARCHAR(10))
PRINT ''
PRINT 'NOTE: Items are soft-deleted (is_active = 0) and can be restored if needed.'
PRINT 'To restore an item, set is_active = 1 in the navigation_items table.'
PRINT ''
PRINT 'To permanently delete, run:'
PRINT 'DELETE FROM navigation_items WHERE is_active = 0 AND [conditions]'
PRINT ''

