-- Add Home Visit Guide navigation item to the database
-- This script adds the guide navigation entry so it appears in the sidebar for all users

DECLARE @microservice_id UNIQUEIDENTIFIER;

-- Get the microservice ID for the current application
SELECT @microservice_id = id 
FROM microservice_apps 
WHERE app_code = 'home-visits' AND is_active = 1;

-- Check if microservice exists
IF @microservice_id IS NULL
BEGIN
    PRINT 'ERROR: Microservice "home-visits" not found in microservice_apps table';
    PRINT 'Please ensure the microservice is registered first';
    RETURN;
END

-- Check if guide navigation item already exists
IF EXISTS (
    SELECT 1 FROM navigation_items 
    WHERE microservice_id = @microservice_id 
    AND code = 'guide' 
    AND is_active = 1
)
BEGIN
    PRINT 'Guide navigation item already exists - updating...';
    
    -- Update existing item
    UPDATE navigation_items 
    SET 
        title = 'Home Visit Guide',
        url = '/guide',
        icon = 'BookOpen',
        permission_required = NULL,
        category = 'Main',
        order_index = 15,
        is_active = 1
    WHERE microservice_id = @microservice_id 
    AND code = 'guide';
    
    PRINT 'Guide navigation item updated successfully';
END
ELSE
BEGIN
    PRINT 'Adding new guide navigation item...';
    
    -- Insert new guide navigation item
    INSERT INTO navigation_items (
        microservice_id, 
        code, 
        title, 
        url, 
        icon, 
        permission_required, 
        category, 
        order_index,
        is_active,
        created_at
    )
    VALUES (
        @microservice_id,
        'guide',
        'Home Visit Guide',
        '/guide',
        'BookOpen',
        NULL, -- No permission required - available to all users
        'Main',
        15, -- Order after other main items
        1,
        GETDATE()
    );
    
    PRINT 'Guide navigation item added successfully';
END

-- Verify the insertion
SELECT 
    ni.code,
    ni.title,
    ni.url,
    ni.icon,
    ni.permission_required,
    ni.category,
    ni.order_index,
    ma.app_name,
    ma.app_code
FROM navigation_items ni
INNER JOIN microservice_apps ma ON ni.microservice_id = ma.id
WHERE ni.code = 'guide' 
AND ma.app_code = 'home-visits'
AND ni.is_active = 1;

PRINT 'Guide navigation setup complete!';
