-- Grant Permissions for Policy Documents Tables
-- Run this script as a database administrator to grant necessary permissions
-- to the application user (v0_app_user)

USE [RadiusBifrost]
GO

-- Grant permissions on policy_documents table
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[policy_documents] TO [v0_app_user]
GO

-- Grant permissions on policy_document_versions table
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[policy_document_versions] TO [v0_app_user]
GO

-- Grant permissions on policy_document_approvals table
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[policy_document_approvals] TO [v0_app_user]
GO

-- Verify permissions (optional - run as admin to check)
-- SELECT 
--     p.name AS principal_name,
--     prm.permission_name,
--     prm.state_desc,
--     o.name AS object_name
-- FROM sys.database_permissions prm
-- JOIN sys.objects o ON prm.major_id = o.object_id
-- JOIN sys.database_principals p ON prm.grantee_principal_id = p.principal_id
-- WHERE o.name IN ('policy_documents', 'policy_document_versions', 'policy_document_approvals')
--     AND p.name = 'v0_app_user'
-- ORDER BY o.name, prm.permission_name
-- GO

PRINT 'Permissions granted successfully to v0_app_user'
GO

