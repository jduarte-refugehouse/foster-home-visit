DECLARE @microservice_id UNIQUEIDENTIFIER;
DECLARE @category NVARCHAR(100) = 'Administration';

-- Get the microservice ID
SELECT @microservice_id = id 
FROM microservice_apps 
WHERE app_name = 'Home Visits Application';

-- Insert or update the Test Logging navigation item
MERGE navigation_items AS target
USING (VALUES (
    @microservice_id,
    'test_logging',
    'Test Logging',
    '/admin/test-logging',
    'TestTube',
    'admin',
    @category,
    65,
    1
)) AS source (microservice_id, code, title, url, icon, permission_required, category, order_index, is_active)
ON target.microservice_id = source.microservice_id AND target.code = source.code
WHEN MATCHED THEN
    UPDATE SET 
        title = source.title,
        url = source.url,
        icon = source.icon,
        permission_required = source.permission_required,
        category = source.category,
        order_index = source.order_index,
        is_active = source.is_active
WHEN NOT MATCHED THEN
    INSERT (microservice_id, code, title, url, icon, permission_required, category, order_index, is_active)
    VALUES (source.microservice_id, source.code, source.title, source.url, source.icon, source.permission_required, source.category, source.order_index, source.is_active);
