-- Setup user permissions for Jeannie Duarte
PRINT '=== SETTING UP USER PERMISSIONS ==='
PRINT ''

-- Get the microservice ID for home-visits
DECLARE @microservice_id UNIQUEIDENTIFIER
SELECT @microservice_id = id FROM microservice_apps WHERE app_code = 'home-visits'

IF @microservice_id IS NULL
BEGIN
    PRINT '❌ ERROR: home-visits microservice not found!'
    RETURN
END

PRINT '✅ Found home-visits microservice'

-- Find Jeannie Duarte's user record
DECLARE @user_id UNIQUEIDENTIFIER
SELECT @user_id = id FROM app_users WHERE email = 'jduarte@refugehouse.org'

IF @user_id IS NULL
BEGIN
    PRINT '❌ ERROR: Jeannie Duarte user not found!'
    RETURN
END

PRINT '✅ Found Jeannie Duarte user record'
PRINT ''

-- Show current permissions for Jeannie
PRINT 'CURRENT PERMISSIONS for Jeannie Duarte:'
SELECT 
    p.permission_code,
    p.permission_name,
    up.granted_at,
    up.is_active
FROM user_permissions up
INNER JOIN permissions p ON up.permission_id = p.id
WHERE up.user_id = @user_id
  AND up.is_active = 1
ORDER BY p.permission_code

PRINT ''

-- Show all available admin permissions
PRINT 'AVAILABLE ADMIN PERMISSIONS:'
SELECT 
    permission_code,
    permission_name,
    description
FROM permissions 
WHERE microservice_id = @microservice_id
  AND (permission_code LIKE '%admin%' 
       OR permission_code LIKE '%manage%' 
       OR permission_code LIKE '%system%'
       OR permission_code = 'user_manage')
ORDER BY permission_code

PRINT ''

-- Grant any missing admin permissions to Jeannie
DECLARE @permission_id UNIQUEIDENTIFIER
DECLARE @permission_code NVARCHAR(100)
DECLARE @permissions_granted INT = 0

-- Cursor to iterate through admin permissions
DECLARE permission_cursor CURSOR FOR
SELECT id, permission_code
FROM permissions 
WHERE microservice_id = @microservice_id
  AND (permission_code LIKE '%admin%' 
       OR permission_code LIKE '%manage%' 
       OR permission_code LIKE '%system%'
       OR permission_code = 'user_manage')

OPEN permission_cursor
FETCH NEXT FROM permission_cursor INTO @permission_id, @permission_code

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Check if user already has this permission
    IF NOT EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_id = @user_id 
          AND permission_id = @permission_id 
          AND is_active = 1
    )
    BEGIN
        -- Grant the permission
        INSERT INTO user_permissions (id, user_id, permission_id, granted_at, granted_by, is_active)
        VALUES (NEWID(), @user_id, @permission_id, GETDATE(), 'system-setup', 1)
        
        PRINT '✅ Granted permission: ' + @permission_code
        SET @permissions_granted = @permissions_granted + 1
    END
    
    FETCH NEXT FROM permission_cursor INTO @permission_id, @permission_code
END

CLOSE permission_cursor
DEALLOCATE permission_cursor

PRINT ''
PRINT 'PERMISSIONS GRANTED: ' + CAST(@permissions_granted AS NVARCHAR(10))
PRINT ''

-- Also create/update mock user for development
DECLARE @mock_user_id UNIQUEIDENTIFIER = NEWID()
DECLARE @mock_clerk_id NVARCHAR(100) = 'mock-user-1234'

-- Check if mock user exists
IF NOT EXISTS (SELECT 1 FROM app_users WHERE clerk_user_id = @mock_clerk_id)
BEGIN
    INSERT INTO app_users (id, clerk_user_id, email, first_name, last_name, is_active, created_at)
    VALUES (@mock_user_id, @mock_clerk_id, 'admin@example.com', 'Admin', 'User', 1, GETDATE())
    
    PRINT '✅ Created mock user for development'
    
    -- Grant all admin permissions to mock user
    INSERT INTO user_permissions (id, user_id, permission_id, granted_at, granted_by, is_active)
    SELECT NEWID(), @mock_user_id, id, GETDATE(), 'system-setup', 1
    FROM permissions 
    WHERE microservice_id = @microservice_id
      AND (permission_code LIKE '%admin%' 
           OR permission_code LIKE '%manage%' 
           OR permission_code LIKE '%system%'
           OR permission_code = 'user_manage')
    
    PRINT '✅ Granted all admin permissions to mock user'
END
ELSE
BEGIN
    PRINT '✅ Mock user already exists'
END

PRINT ''

-- Final verification - show all user permissions
PRINT 'FINAL VERIFICATION - All user permissions:'
SELECT 
    au.email,
    au.first_name,
    au.last_name,
    p.permission_code,
    up.granted_at,
    up.is_active
FROM app_users au
INNER JOIN user_permissions up ON au.id = up.user_id
INNER JOIN permissions p ON up.permission_id = p.id
WHERE up.is_active = 1
ORDER BY au.email, p.permission_code

PRINT ''
PRINT '=== USER PERMISSIONS SETUP COMPLETE ==='
