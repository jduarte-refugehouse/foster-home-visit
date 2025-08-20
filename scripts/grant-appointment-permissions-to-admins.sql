-- Grant appointment permissions to all system administrators
PRINT '=== GRANTING APPOINTMENT PERMISSIONS TO ALL SYSTEM ADMINS ==='
PRINT ''

-- Get the microservice ID for home-visits
DECLARE @microservice_id UNIQUEIDENTIFIER
SELECT @microservice_id = id FROM microservice_apps WHERE app_code = 'home-visits'

IF @microservice_id IS NULL
BEGIN
    PRINT '❌ ERROR: home-visits microservice not found!'
    RETURN
END

-- Find all users with system_admin permission
DECLARE @admin_permission_id UNIQUEIDENTIFIER
SELECT @admin_permission_id = id FROM permissions WHERE permission_code = 'system_admin'

IF @admin_permission_id IS NULL
BEGIN
    PRINT '❌ ERROR: system_admin permission not found!'
    RETURN
END

-- Get all appointment permission IDs
DECLARE @appointment_permissions TABLE (
    permission_id UNIQUEIDENTIFIER,
    permission_code NVARCHAR(100)
)

INSERT INTO @appointment_permissions (permission_id, permission_code)
SELECT id, permission_code
FROM permissions 
WHERE microservice_id = @microservice_id
  AND category = 'Appointments'

DECLARE @total_permissions_granted INT = 0

-- Grant appointment permissions to all system admins
DECLARE @user_id UNIQUEIDENTIFIER
DECLARE @user_email NVARCHAR(255)

DECLARE admin_cursor CURSOR FOR
SELECT DISTINCT u.id, u.email
FROM app_users u
INNER JOIN user_permissions up ON u.id = up.user_id
WHERE up.permission_id = @admin_permission_id
  AND up.is_active = 1
  AND u.is_active = 1

OPEN admin_cursor
FETCH NEXT FROM admin_cursor INTO @user_id, @user_email

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT '✅ Processing admin user: ' + @user_email
    
    -- Grant each appointment permission to this admin
    DECLARE @permission_id UNIQUEIDENTIFIER
    DECLARE @permission_code NVARCHAR(100)
    
    DECLARE permission_cursor CURSOR FOR
    SELECT permission_id, permission_code FROM @appointment_permissions
    
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
            
            PRINT '  ✅ Granted: ' + @permission_code
            SET @total_permissions_granted = @total_permissions_granted + 1
        END
        ELSE
        BEGIN
            PRINT '  ⚠️  Already has: ' + @permission_code
        END
        
        FETCH NEXT FROM permission_cursor INTO @permission_id, @permission_code
    END
    
    CLOSE permission_cursor
    DEALLOCATE permission_cursor
    
    FETCH NEXT FROM admin_cursor INTO @user_id, @user_email
END

CLOSE admin_cursor
DEALLOCATE admin_cursor

PRINT ''
PRINT 'TOTAL PERMISSIONS GRANTED: ' + CAST(@total_permissions_granted AS NVARCHAR(10))
PRINT ''
PRINT '=== APPOINTMENT PERMISSIONS GRANTING TO ADMINS COMPLETE ==='
