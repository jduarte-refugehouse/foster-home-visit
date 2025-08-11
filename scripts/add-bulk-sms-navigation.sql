-- Add Bulk SMS page to navigation
-- This script adds the Bulk SMS page to the navigation system
-- Compatible with SQL Server - using correct column names and data types

-- First, get the microservice ID for home-visits (it's a uniqueidentifier, not int)
DECLARE @microservice_id UNIQUEIDENTIFIER;
DECLARE @admin_category_id UNIQUEIDENTIFIER;

-- Get the microservice ID (assuming this is the main microservice)
SELECT TOP 1 @microservice_id = id FROM microservices WHERE name = 'foster-home-visit' OR is_primary = 1;

-- Get or create the Administration category
SELECT @admin_category_id = id FROM navigation_categories WHERE category = 'Administration';

-- If Administration category doesn't exist, create it
IF @admin_category_id IS NULL
BEGIN
    SET @admin_category_id = NEWID();
    INSERT INTO navigation_categories (id, category, order_index, microservice_id, created_at, updated_at)
    VALUES (@admin_category_id, 'Administration', 100, @microservice_id, GETDATE(), GETDATE());
END

IF @microservice_id IS NULL
BEGIN
    PRINT 'ERROR: Microservice foster-home-visit not found. Please ensure the microservice is registered first.';
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
        order_index = 60,
        category_id = @admin_category_id,
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
        code,
        title,
        url,
        icon,
        permission_required,
        order_index,
        category_id,
        microservice_id,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEWID(),
        'bulk_sms',
        'Bulk SMS',
        '/admin/bulk-sms',
        'MessageSquare',
        'admin',
        60,
        @admin_category_id,
        @microservice_id,
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
    ni.order_index,
    ni.category_id,
    ni.is_active,
    ma.app_code as microservice_code,
    nc.category as category_name
FROM navigation_items ni
INNER JOIN microservice_apps ma ON ni.microservice_id = ma.id
INNER JOIN navigation_categories nc ON ni.category_id = nc.id
WHERE ni.code = 'bulk_sms' 
AND ma.app_code = 'home-visits';

PRINT 'Bulk SMS navigation verification complete.';
