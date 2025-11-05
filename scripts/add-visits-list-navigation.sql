-- Add "Visits List" navigation item to the Visits category
-- This provides a simple sequential list view of visits

-- First, check if the navigation item already exists
IF NOT EXISTS (SELECT 1 FROM navigation_items WHERE code = 'visits_list')
BEGIN
    INSERT INTO navigation_items (
        code,
        title,
        url,
        icon,
        category,
        [order],
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        'visits_list',           -- code
        'Visits List',           -- title
        '/visits-list',          -- url
        'List',                  -- icon (Lucide icon name)
        'Visits',                -- category
        2,                       -- order (after calendar, before forms)
        1,                       -- is_active
        GETDATE(),               -- created_at
        GETDATE()                -- updated_at
    );
    
    PRINT '✅ Added "Visits List" navigation item';
END
ELSE
BEGIN
    PRINT 'ℹ️ "Visits List" navigation item already exists';
END

-- Update the order of other visit-related items to make room
UPDATE navigation_items 
SET [order] = 1 
WHERE code = 'visits_calendar' AND category = 'Visits';

UPDATE navigation_items 
SET [order] = 3 
WHERE code = 'visit_forms' AND category = 'Visits';

PRINT '✅ Updated navigation item ordering';

-- Show the current Visits category navigation
SELECT 
    code,
    title,
    url,
    icon,
    category,
    [order],
    is_active
FROM navigation_items
WHERE category = 'Visits'
ORDER BY [order];

