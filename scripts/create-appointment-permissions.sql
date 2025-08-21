-- Create permissions for appointments functionality
PRINT '=== CREATING APPOINTMENT PERMISSIONS ==='
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

-- Create appointment permissions
INSERT INTO permissions (id, microservice_id, permission_code, permission_name, description, category, created_at) VALUES
(NEWID(), @microservice_id, 'view_appointments', 'View Appointments', 'View appointment calendar and appointment details', 'Appointments', GETDATE()),
(NEWID(), @microservice_id, 'create_appointments', 'Create Appointments', 'Create new appointments on the calendar', 'Appointments', GETDATE()),
(NEWID(), @microservice_id, 'edit_appointments', 'Edit Appointments', 'Modify existing appointments', 'Appointments', GETDATE()),
(NEWID(), @microservice_id, 'delete_appointments', 'Delete Appointments', 'Cancel or delete appointments', 'Appointments', GETDATE()),
(NEWID(), @microservice_id, 'manage_all_appointments', 'Manage All Appointments', 'Full access to all appointments including those assigned to other staff', 'Appointments', GETDATE()),
(NEWID(), @microservice_id, 'assign_appointments', 'Assign Appointments', 'Assign appointments to other staff members', 'Appointments', GETDATE())

PRINT '✅ Created appointment permissions'

-- Show created permissions
PRINT ''
PRINT 'CREATED APPOINTMENT PERMISSIONS:'
SELECT 
    permission_code,
    permission_name,
    description,
    category
FROM permissions 
WHERE microservice_id = @microservice_id
  AND category = 'Appointments'
ORDER BY permission_code

PRINT ''
PRINT '=== APPOINTMENT PERMISSIONS CREATION COMPLETE ==='
