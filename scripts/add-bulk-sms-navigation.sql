-- Add Bulk SMS page to navigation
-- This script adds the Bulk SMS page to the navigation system
-- Compatible with SQL Server - using correct schema from create-navigation-table.sql

-- Fixed to use correct table names and schema structure
-- Get the microservice ID for home-visits
DECLARE @microservice_id UNIQUEIDENTIFIER;

-- Get the microservice ID from microservice_apps table (not microservices)
SELECT @microservice_id = id FROM microservice_apps WHERE app_code = 'home-visits';

IF @microservice_id IS NULL
BEGIN
    PRINT 'ERROR: Microservice home-visits not found. Please ensure the microservice is registered first.';
    RETURN;
END

-- Check if the navigation item already exists and update or insert accordingly
IF EXISTS (
    SELECT 1 FROM navigation_items 
    WHERE code = 'bulk_sms' 
    AND microservice_id = @microservice_id
)
BEGIN
    -- Update existing record
    UPDATE navigation_items 
    SET 
        title = 'Bulk SMS',
        url = '/admin/bulk-sms',
        icon = 'MessageSquare',
        permission_required = 'admin',
        category = 'Administration',
        order_index = 60,
        is_active = 1,
        updated_at = GETDATE()
    WHERE code = 'bulk_sms' 
    AND microservice_id = @microservice_id;
    
    PRINT 'Bulk SMS navigation item updated successfully.';
END
ELSE
BEGIN
    -- Insert new record
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
        updated_at
    ) VALUES (
        NEWID(),
        @microservice_id,
        'bulk_sms',
        'Bulk SMS',
        '/admin/bulk-sms',
        'MessageSquare',
        'admin',
        'Administration',
        60,
        1,
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Bulk SMS navigation item inserted successfully.';
END

-- Verify the operation
SELECT 
    ni.code,
    ni.title,
    ni.url,
    ni.icon,
    ni.permission_required,
    ni.category,
    ni.order_index,
    ni.is_active,
    ma.app_code as microservice_code
FROM navigation_items ni
INNER JOIN microservice_apps ma ON ni.microservice_id = ma.id
WHERE ni.code = 'bulk_sms' 
AND ma.app_code = 'home-visits';

PRINT 'Bulk SMS navigation verification complete.';
