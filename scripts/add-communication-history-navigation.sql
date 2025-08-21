-- Add Communication History to admin navigation
DECLARE @microservice_id UNIQUEIDENTIFIER

-- Get the microservice ID
SELECT TOP 1 @microservice_id = id 
FROM microservice_apps 
WHERE app_name LIKE '%Foster%' OR app_name = 'Foster Home Visit System'
ORDER BY created_at DESC

-- If no specific microservice found, get the first one
IF @microservice_id IS NULL
BEGIN
    SELECT TOP 1 @microservice_id = id 
    FROM microservice_apps 
    ORDER BY created_at ASC
END

-- Insert or update the Communication History navigation item
IF EXISTS (SELECT 1 FROM navigation_items WHERE code = 'communication_history' AND microservice_id = @microservice_id)
BEGIN
    UPDATE navigation_items 
    SET 
        title = 'Communication History',
        url = '/admin/communication-history',
        icon = 'History',
        category = 'Administration',
        permission_required = 'admin',
        order_index = 65,
        is_active = 1,
        updated_at = GETDATE()
    WHERE code = 'communication_history' AND microservice_id = @microservice_id
    
    PRINT 'Updated Communication History navigation item'
END
ELSE
BEGIN
    INSERT INTO navigation_items (
        microservice_id, code, title, url, icon, category, 
        permission_required, order_index, is_active
    )
    VALUES (
        @microservice_id, 'communication_history', 'Communication History', 
        '/admin/communication-history', 'History', 'Administration',
        'admin', 65, 1
    )
    
    PRINT 'Added Communication History navigation item'
END
