-- Add is_collapsible and item_type fields to navigation_items table
-- is_collapsible: determines if a navigation item should be displayed as collapsible (with sub-items) or fixed (always visible)
-- item_type: specifies the type of menu item - 'domain' (looks like a menu item), 'button' (stands alone for an action), etc.

-- Add is_collapsible field
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.navigation_items') 
    AND name = 'is_collapsible'
)
BEGIN
    ALTER TABLE [dbo].[navigation_items]
    ADD [is_collapsible] [bit] NOT NULL DEFAULT 0;
    
    PRINT 'Added is_collapsible column to navigation_items table';
END
ELSE
BEGIN
    PRINT 'Column is_collapsible already exists in navigation_items table';
END
GO

-- Add item_type field
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.navigation_items') 
    AND name = 'item_type'
)
BEGIN
    ALTER TABLE [dbo].[navigation_items]
    ADD [item_type] [nvarchar](50) NOT NULL DEFAULT 'domain';
    
    PRINT 'Added item_type column to navigation_items table';
END
ELSE
BEGIN
    PRINT 'Column item_type already exists in navigation_items table';
END
GO

-- Update existing items: if they have sub-items (parent_navigation_id is not null for children), 
-- mark the parent as collapsible
UPDATE ni
SET ni.is_collapsible = 1
FROM navigation_items ni
WHERE EXISTS (
    SELECT 1 
    FROM navigation_items children
    WHERE children.parent_navigation_id = ni.id
    AND children.is_active = 1
)
AND ni.is_active = 1;

PRINT 'Updated existing navigation items: parents with children are now marked as collapsible';
GO

