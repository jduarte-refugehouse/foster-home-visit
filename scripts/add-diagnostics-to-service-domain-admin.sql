-- =============================================
-- Add Diagnostics Navigation Item to Service Domain Admin
-- =============================================
-- This adds the Diagnostics page to the service-domain-admin microservice navigation

DECLARE @microserviceId UNIQUEIDENTIFIER = (SELECT id FROM microservice_apps WHERE app_code = 'service-domain-admin')

IF @microserviceId IS NULL
BEGIN
    PRINT '❌ ERROR: service-domain-admin microservice not found'
    RETURN
END

PRINT '✅ Found service-domain-admin microservice: ' + CAST(@microserviceId AS NVARCHAR(50))
PRINT ''

-- Add Diagnostics navigation item
IF NOT EXISTS (SELECT 1 FROM navigation_items WHERE code = 'diagnostics' AND microservice_id = @microserviceId)
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
        'diagnostics',
        'Diagnostics',
        '/diagnostics',
        'Database',
        'System',
        10,
        NULL,  -- No permission required - available to all global admins
        1,
        GETDATE()
    )
    PRINT '✅ Navigation item created: Diagnostics'
END
ELSE
BEGIN
    PRINT 'ℹ️  Diagnostics navigation item already exists - updating to ensure it is active'
    UPDATE navigation_items
    SET is_active = 1,
        updated_at = GETDATE()
    WHERE code = 'diagnostics' 
        AND microservice_id = @microserviceId
    PRINT '✅ Diagnostics navigation item updated'
END

PRINT ''
PRINT '============================================='
PRINT '✅ Diagnostics Navigation Item Added!'
PRINT '============================================='
PRINT 'Navigation Item: Diagnostics'
PRINT 'URL: /diagnostics'
PRINT 'Category: System'
PRINT 'Available to: All global_admin users'
PRINT ''

