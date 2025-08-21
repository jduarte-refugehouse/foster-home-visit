-- =============================================
-- Complete Visit Forms Database Schema
-- Generated: 2025-08-21
-- =============================================

-- Create visit_forms table with all required fields
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='visit_forms' AND xtype='U')
BEGIN
    CREATE TABLE dbo.visit_forms (
        visit_form_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        appointment_id UNIQUEIDENTIFIER NOT NULL,
        form_type NVARCHAR(50) NOT NULL DEFAULT 'home_visit',
        form_version NVARCHAR(10) DEFAULT '1.0',
        status NVARCHAR(20) NOT NULL DEFAULT 'draft',
        visit_date DATE NOT NULL,
        visit_time TIME NOT NULL,
        visit_number INT DEFAULT 1,
        quarter NVARCHAR(10),
        visit_variant INT DEFAULT 1,
        visit_info NVARCHAR(MAX),
        family_info NVARCHAR(MAX),
        attendees NVARCHAR(MAX),
        observations NVARCHAR(MAX),
        recommendations NVARCHAR(MAX),
        signatures NVARCHAR(MAX),
        home_environment NVARCHAR(MAX),
        child_interviews NVARCHAR(MAX),
        parent_interviews NVARCHAR(MAX),
        compliance_review NVARCHAR(MAX),
        last_auto_save DATETIME2,
        auto_save_count INT DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        created_by_user_id NVARCHAR(255) NOT NULL,
        created_by_name NVARCHAR(255) NOT NULL,
        updated_by_user_id NVARCHAR(255),
        updated_by_name NVARCHAR(255),
        is_deleted BIT DEFAULT 0,
        deleted_at DATETIME2,
        deleted_by_user_id NVARCHAR(255),
        deleted_by_name NVARCHAR(255),
        
        CONSTRAINT PK_visit_forms PRIMARY KEY (visit_form_id)
    );
    
    PRINT '✓ visit_forms table created successfully';
END
ELSE
BEGIN
    PRINT '✓ visit_forms table already exists';
END

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_visit_forms_appointment_id')
BEGIN
    CREATE INDEX IX_visit_forms_appointment_id ON dbo.visit_forms (appointment_id);
    PRINT '✓ Index on appointment_id created';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_visit_forms_status')
BEGIN
    CREATE INDEX IX_visit_forms_status ON dbo.visit_forms (status);
    PRINT '✓ Index on status created';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_visit_forms_visit_date')
BEGIN
    CREATE INDEX IX_visit_forms_visit_date ON dbo.visit_forms (visit_date);
    PRINT '✓ Index on visit_date created';
END

-- Create lookup tables for form data
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='visit_form_templates' AND xtype='U')
BEGIN
    CREATE TABLE dbo.visit_form_templates (
        template_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        template_name NVARCHAR(100) NOT NULL,
        template_type NVARCHAR(50) NOT NULL,
        template_data NVARCHAR(MAX) NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        
        CONSTRAINT PK_visit_form_templates PRIMARY KEY (template_id)
    );
    
    PRINT '✓ visit_form_templates table created successfully';
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='visit_types' AND xtype='U')
BEGIN
    CREATE TABLE dbo.visit_types (
        type_id INT IDENTITY(1,1) NOT NULL,
        type_name NVARCHAR(50) NOT NULL,
        description NVARCHAR(255),
        is_active BIT DEFAULT 1,
        
        CONSTRAINT PK_visit_types PRIMARY KEY (type_id)
    );
    
    -- Insert default visit types
    INSERT INTO dbo.visit_types (type_name, description) VALUES
    ('Initial', 'Initial home visit'),
    ('Quarterly', 'Quarterly review visit'),
    ('Follow-up', 'Follow-up visit'),
    ('Emergency', 'Emergency visit'),
    ('Final', 'Final visit');
    
    PRINT '✓ visit_types table created and populated';
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='visit_modes' AND xtype='U')
BEGIN
    CREATE TABLE dbo.visit_modes (
        mode_id INT IDENTITY(1,1) NOT NULL,
        mode_name NVARCHAR(50) NOT NULL,
        description NVARCHAR(255),
        is_active BIT DEFAULT 1,
        
        CONSTRAINT PK_visit_modes PRIMARY KEY (mode_id)
    );
    
    -- Insert default visit modes
    INSERT INTO dbo.visit_modes (mode_name, description) VALUES
    ('In-Person', 'In-person visit at the home'),
    ('Virtual', 'Virtual visit via video call'),
    ('Hybrid', 'Combination of in-person and virtual'),
    ('Phone', 'Phone call only');
    
    PRINT '✓ visit_modes table created and populated';
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='attendee_roles' AND xtype='U')
BEGIN
    CREATE TABLE dbo.attendee_roles (
        role_id INT IDENTITY(1,1) NOT NULL,
        role_name NVARCHAR(50) NOT NULL,
        description NVARCHAR(255),
        is_active BIT DEFAULT 1,
        
        CONSTRAINT PK_attendee_roles PRIMARY KEY (role_id)
    );
    
    -- Insert default attendee roles
    INSERT INTO dbo.attendee_roles (role_name, description) VALUES
    ('Foster Parent', 'Foster parent or caregiver'),
    ('Case Manager', 'Assigned case manager'),
    ('Liaison', 'Agency liaison'),
    ('Child', 'Foster child'),
    ('Supervisor', 'Supervising staff member'),
    ('Other', 'Other attendee');
    
    PRINT '✓ attendee_roles table created and populated';
END

-- Grant permissions for application access
PRINT '=== Granting Permissions ===';

-- Grant permissions to application user (adjust username as needed)
DECLARE @sql NVARCHAR(MAX);
DECLARE @username NVARCHAR(128) = 'your_app_user'; -- Replace with actual username

SET @sql = 'GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.visit_forms TO [' + @username + ']';
EXEC sp_executesql @sql;

SET @sql = 'GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.visit_form_templates TO [' + @username + ']';
EXEC sp_executesql @sql;

SET @sql = 'GRANT SELECT ON dbo.visit_types TO [' + @username + ']';
EXEC sp_executesql @sql;

SET @sql = 'GRANT SELECT ON dbo.visit_modes TO [' + @username + ']';
EXEC sp_executesql @sql;

SET @sql = 'GRANT SELECT ON dbo.attendee_roles TO [' + @username + ']';
EXEC sp_executesql @sql;

PRINT '✓ Permissions granted successfully';

-- Create update trigger for updated_at timestamp
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_visit_forms_updated_at')
BEGIN
    EXEC('
    CREATE TRIGGER TR_visit_forms_updated_at
    ON dbo.visit_forms
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE dbo.visit_forms 
        SET updated_at = GETUTCDATE()
        FROM dbo.visit_forms vf
        INNER JOIN inserted i ON vf.visit_form_id = i.visit_form_id;
    END
    ');
    
    PRINT '✓ Update trigger created successfully';
END

PRINT '=== Schema Creation Complete ===';
PRINT 'All tables, indexes, and permissions have been set up successfully.';
