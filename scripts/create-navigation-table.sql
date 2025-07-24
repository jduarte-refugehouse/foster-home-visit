-- Create navigation system tables for microservice template
-- Run this script once to set up the navigation system

-- Create microservice_apps table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='microservice_apps' AND xtype='U')
BEGIN
    CREATE TABLE microservice_apps (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        app_code NVARCHAR(50) NOT NULL UNIQUE,
        app_name NVARCHAR(255) NOT NULL,
        app_url NVARCHAR(255),
        description NVARCHAR(500),
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    PRINT 'Created microservice_apps table';
    
    -- Grant permissions to v0_app_user
    GRANT SELECT, INSERT, UPDATE, DELETE ON microservice_apps TO v0_app_user;
    PRINT 'Granted permissions on microservice_apps to v0_app_user';
END
ELSE
BEGIN
    PRINT 'microservice_apps table already exists';
    -- Ensure permissions are granted even if table exists
    GRANT SELECT, INSERT, UPDATE, DELETE ON microservice_apps TO v0_app_user;
    PRINT 'Ensured permissions on microservice_apps for v0_app_user';
END

-- Create navigation_items table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='navigation_items' AND xtype='U')
BEGIN
    CREATE TABLE navigation_items (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        microservice_id UNIQUEIDENTIFIER NOT NULL,
        code NVARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        url NVARCHAR(500) NOT NULL,
        icon NVARCHAR(50) NOT NULL,
        permission_required NVARCHAR(100) NULL,
        category NVARCHAR(100) NOT NULL,
        order_index INT NOT NULL DEFAULT 0,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        FOREIGN KEY (microservice_id) REFERENCES microservice_apps(id),
        UNIQUE (microservice_id, code)
    );
    
    PRINT 'Created navigation_items table';
    
    -- Grant permissions to v0_app_user
    GRANT SELECT, INSERT, UPDATE, DELETE ON navigation_items TO v0_app_user;
    PRINT 'Granted permissions on navigation_items to v0_app_user';
END
ELSE
BEGIN
    PRINT 'navigation_items table already exists';
    -- Ensure permissions are granted even if table exists
    GRANT SELECT, INSERT, UPDATE, DELETE ON navigation_items TO v0_app_user;
    PRINT 'Ensured permissions on navigation_items for v0_app_user';
END

-- Register the home-visits microservice if it doesn't exist
IF NOT EXISTS (SELECT * FROM microservice_apps WHERE app_code = 'home-visits')
BEGIN
    INSERT INTO microservice_apps (app_code, app_name, app_url, description, is_active)
    VALUES ('home-visits', 'Home Visits Application', '/home-visits', 'Foster care home visit scheduling and management', 1);
    
    PRINT 'Registered home-visits microservice';
END
ELSE
BEGIN
    PRINT 'home-visits microservice already registered';
END

-- Get the microservice ID for home-visits
DECLARE @microservice_id UNIQUEIDENTIFIER;
SELECT @microservice_id = id FROM microservice_apps WHERE app_code = 'home-visits';

-- Insert default navigation items for home-visits if they don't exist
IF NOT EXISTS (SELECT * FROM navigation_items WHERE microservice_id = @microservice_id)
BEGIN
    -- Navigation section
    INSERT INTO navigation_items (microservice_id, code, title, url, icon, permission_required, category, order_index, is_active)
    VALUES 
        (@microservice_id, 'dashboard', 'Dashboard', '/dashboard', 'Home', NULL, 'Navigation', 1, 1),
        (@microservice_id, 'visits_calendar', 'Visits Calendar', '/visits-calendar', 'Calendar', NULL, 'Navigation', 2, 1),
        (@microservice_id, 'reports', 'Reports', '/reports', 'BarChart3', NULL, 'Navigation', 3, 1),
        (@microservice_id, 'homes_map', 'Homes Map', '/homes-map', 'Map', NULL, 'Navigation', 4, 1),
        (@microservice_id, 'homes_list', 'Homes List', '/homes-list', 'List', NULL, 'Navigation', 5, 1);
    
    -- Administration section
    INSERT INTO navigation_items (microservice_id, code, title, url, icon, permission_required, category, order_index, is_active)
    VALUES 
        (@microservice_id, 'user_invitations', 'User Invitations', '/admin/invitations', 'Users', 'user_management', 'Administration', 1, 1),
        (@microservice_id, 'user_management', 'User Management', '/admin/users', 'UserCog', 'user_management', 'Administration', 2, 1),
        (@microservice_id, 'system_admin', 'System Admin', '/system-admin', 'Settings', 'system_config', 'Administration', 3, 1),
        (@microservice_id, 'diagnostics', 'Diagnostics', '/diagnostics', 'Database', 'view_diagnostics', 'Administration', 4, 1);
    
    PRINT 'Inserted default navigation items for home-visits';
END
ELSE
BEGIN
    PRINT 'Navigation items already exist for home-visits';
END

-- Verify permissions by testing a simple query
BEGIN TRY
    DECLARE @test_count INT;
    SELECT @test_count = COUNT(*) FROM navigation_items WHERE microservice_id = @microservice_id;
    PRINT 'Permission test successful - found ' + CAST(@test_count AS NVARCHAR(10)) + ' navigation items';
END TRY
BEGIN CATCH
    PRINT 'Permission test failed: ' + ERROR_MESSAGE();
END CATCH

-- Show the results
SELECT 
    ma.app_name,
    ma.app_code,
    ni.category,
    ni.title,
    ni.url,
    ni.permission_required,
    ni.order_index
FROM microservice_apps ma
INNER JOIN navigation_items ni ON ma.id = ni.microservice_id
WHERE ma.app_code = 'home-visits'
ORDER BY ni.category, ni.order_index;

PRINT 'Navigation setup complete with permissions granted!';
