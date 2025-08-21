CREATE TABLE dbo.visit_form_templates (
    template_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_name NVARCHAR(100) NOT NULL,
    template_type NVARCHAR(50) NOT NULL, -- 'home_visit', 'assessment', 'follow_up'
    form_version NVARCHAR(20) DEFAULT '1.0',
    template_data NVARCHAR(MAX), -- JSON template structure
    is_active BIT DEFAULT 1,
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
);

-- Create lookup tables for form dropdowns
CREATE TABLE dbo.visit_types (
    id INT IDENTITY(1,1) PRIMARY KEY,
    type_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    is_active BIT DEFAULT 1
);

CREATE TABLE dbo.visit_modes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    mode_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    is_active BIT DEFAULT 1
);

CREATE TABLE dbo.attendee_roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    role_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    is_active BIT DEFAULT 1
);

-- Insert default lookup data
INSERT INTO dbo.visit_types (type_name, description) VALUES
('Initial Visit', 'First visit to establish relationship and assess needs'),
('Quarterly Visit', 'Regular quarterly check-in visit'),
('Follow-up Visit', 'Follow-up on specific issues or recommendations'),
('Emergency Visit', 'Urgent visit due to safety concerns or incidents'),
('Assessment Visit', 'Formal assessment or evaluation visit'),
('Support Visit', 'Supportive visit to provide assistance');

INSERT INTO dbo.visit_modes (mode_name, description) VALUES
('In-Person', 'Face-to-face visit at the home'),
('Virtual', 'Video call or phone visit'),
('Hybrid', 'Combination of in-person and virtual elements');

INSERT INTO dbo.attendee_roles (role_name, description) VALUES
('Foster Parent', 'Primary caregiver in the home'),
('Foster Child', 'Child placed in foster care'),
('Case Manager', 'Assigned case management staff'),
('Social Worker', 'Licensed social worker'),
('Supervisor', 'Supervisory staff member'),
('Other Family Member', 'Extended family or household member'),
('Service Provider', 'External service provider or therapist');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.visit_form_templates TO v0_app_user;
GRANT SELECT ON dbo.visit_types TO v0_app_user;
GRANT SELECT ON dbo.visit_modes TO v0_app_user;
GRANT SELECT ON dbo.attendee_roles TO v0_app_user;

PRINT 'Form lookup tables created successfully!';
