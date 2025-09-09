-- Grant permissions for visit forms tables to v0_app_user
-- This follows the same pattern as the appointments permissions

USE RadiusBifrost;
GO

-- Grant permissions on visit_forms table
GRANT SELECT, INSERT, UPDATE ON dbo.visit_forms TO v0_app_user;
GRANT DELETE ON dbo.visit_forms TO v0_app_user; -- For soft deletes

-- Grant permissions on visit_form_sections table
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.visit_form_sections TO v0_app_user;

-- Grant permissions on visit_form_attachments table
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.visit_form_attachments TO v0_app_user;

PRINT 'Visit forms permissions granted to v0_app_user successfully!';
