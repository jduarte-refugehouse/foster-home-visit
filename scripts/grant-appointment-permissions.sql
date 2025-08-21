-- Grant appointment permissions to existing users
PRINT '=== GRANTING APPOINTMENT PERMISSIONS ==='
PRINT ''

-- Get the microservice ID for home-visits
DECLARE @microservice_id UNIQUEIDENTIFIER
SELECT @microservice_id = id FROM microservice_apps WHERE app_code = 'home-visits'

IF @microservice_id IS NULL
BEGIN
    PRINT '❌ ERROR: home-visits microservice not found!'
    RETURN
END

-- Find Jeannie Duarte's user record
DECLARE @user_id UNIQUEIDENTIFIER
SELECT @user_id = id FROM app_users WHERE email = 'jduarte@refugehouse.org'

IF @user_id IS NULL
BEGIN
    PRINT '❌ ERROR: Jeannie Duarte user not found!'
    RETURN
END

PRINT '✅ Found Jeannie Duarte user record'

-- Grant all appointment permissions to Jeannie
DECLARE @permission_id UNIQUEIDENTIFIER
DECLARE @permission_code NVARCHAR(100)
DECLARE @permissions_granted INT = 0

-- Cursor to iterate through appointment permissions
DECLARE permission_cursor CURSOR FOR
SELECT id, permission_code
FROM permissions 
WHERE microservice_id = @microservice_id
  AND category = 'Appointments'

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
    ELSE
    BEGIN
        PRINT '⚠️  Permission already exists: ' + @permission_code
    END
    
    FETCH NEXT FROM permission_cursor INTO @permission_id, @permission_code
END

CLOSE permission_cursor
DEALLOCATE permission_cursor

-- Also grant to mock user if exists
DECLARE @mock_user_id UNIQUEIDENTIFIER
SELECT @mock_user_id = id FROM app_users WHERE clerk_user_id = 'mock-user-1234'

IF @mock_user_id IS NOT NULL
BEGIN
    PRINT '✅ Found mock user, granting appointment permissions'
    
    -- Grant all appointment permissions to mock user
    INSERT INTO user_permissions (id, user_id, permission_id, granted_at, granted_by, is_active)
    SELECT NEWID(), @mock_user_id, id, GETDATE(), 'system-setup', 1
    FROM permissions 
    WHERE microservice_id = @microservice_id
      AND category = 'Appointments'
      AND id NOT IN (
          SELECT permission_id FROM user_permissions 
          WHERE user_id = @mock_user_id AND is_active = 1
      )
    
    PRINT '✅ Granted appointment permissions to mock user'
END

PRINT ''
PRINT 'PERMISSIONS GRANTED: ' + CAST(@permissions_granted AS NVARCHAR(10))
PRINT ''
PRINT '=== APPOINTMENT PERMISSIONS GRANTING COMPLETE ==='
