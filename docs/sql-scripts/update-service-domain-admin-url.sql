-- =============================================
-- Update Service Domain Admin app_url
-- =============================================
-- This script updates the app_url for the service-domain-admin microservice

UPDATE microservice_apps
SET app_url = '/globaladmin'
WHERE app_code = 'service-domain-admin'

IF @@ROWCOUNT > 0
BEGIN
    PRINT '✅ Updated app_url to /globaladmin for service-domain-admin'
END
ELSE
BEGIN
    PRINT '⚠️  No rows updated. Check that app_code = ''service-domain-admin'' exists.'
END

-- Verify the update
SELECT 
    app_code,
    app_name,
    app_url,
    description
FROM microservice_apps
WHERE app_code = 'service-domain-admin'

