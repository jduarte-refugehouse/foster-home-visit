-- Remove "Home Visit Guide" from main navigation menu
-- The guide will now be accessible from the Home Liaison dashboard instead

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

-- Check if guide navigation item exists
IF EXISTS (
    SELECT 1 FROM navigation_items 
    WHERE microservice_id = @microservice_id 
    AND code = 'guide'
)
BEGIN
    PRINT 'Deactivating "Home Visit Guide" navigation item...';
    
    -- Deactivate the guide navigation item (don't delete, just set is_active = 0)
    UPDATE navigation_items 
    SET 
        is_active = 0,
        updated_at = GETDATE()
    WHERE microservice_id = @microservice_id 
    AND code = 'guide';
    
    PRINT '✅ "Home Visit Guide" removed from navigation menu';
    PRINT '   Note: The guide is still accessible at /guide';
    PRINT '   It will be prominently featured on the Home Liaison dashboard instead';
END
ELSE
BEGIN
    PRINT 'ℹ️ "Home Visit Guide" navigation item not found - may already be removed';
END

-- Verify the change
SELECT 
    ni.code,
    ni.title,
    ni.url,
    ni.icon,
    ni.category,
    ni.order_index,
    ni.is_active
FROM navigation_items ni
WHERE ni.microservice_id = @microservice_id 
AND ni.code = 'guide';

GO

