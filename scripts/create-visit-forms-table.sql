-- Create visit forms table for storing home visit form data
-- This table stores both draft and completed visit forms
-- Links to appointments table via appointment_id foreign key

USE RadiusBifrost;
GO

-- Create the main visit forms table
CREATE TABLE dbo.visit_forms (
    visit_form_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    appointment_id UNIQUEIDENTIFIER NOT NULL, -- FK to appointments table
    
    -- Form metadata
    form_type NVARCHAR(50) NOT NULL DEFAULT 'home_visit', -- home_visit, assessment, follow_up
    form_version NVARCHAR(20) DEFAULT '1.0',
    status NVARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, in_progress, completed, submitted, approved
    
    -- Visit details
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    visit_number INT DEFAULT 1,
    quarter NVARCHAR(5), -- Q1, Q2, Q3, Q4
    visit_variant INT DEFAULT 1, -- 1, 2, 3 (based on quarter position)
    
    -- Form data stored as JSON for flexibility
    visit_info NVARCHAR(MAX), -- JSON: type, mode, conducted_by, role, etc.
    family_info NVARCHAR(MAX), -- JSON: family details, contact info
    attendees NVARCHAR(MAX), -- JSON: attendee list with roles and presence
    observations NVARCHAR(MAX), -- JSON: observations, atmosphere, concerns
    recommendations NVARCHAR(MAX), -- JSON: recommendations and next steps
    signatures NVARCHAR(MAX), -- JSON: signature data
    
    -- Extended form sections (for comprehensive forms)
    home_environment NVARCHAR(MAX), -- JSON: safety, medications, bedrooms, etc.
    child_interviews NVARCHAR(MAX), -- JSON: child interview responses
    parent_interviews NVARCHAR(MAX), -- JSON: parent interview responses
    compliance_review NVARCHAR(MAX), -- JSON: TAC 749 compliance checklist
    
    -- Auto-save tracking
    last_auto_save DATETIME2(7) NULL,
    auto_save_count INT DEFAULT 0,
    
    -- Audit fields (following appointments pattern)
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    created_by_user_id NVARCHAR(255) NOT NULL,
    created_by_name NVARCHAR(255) NOT NULL,
    updated_by_user_id NVARCHAR(255) NULL,
    updated_by_name NVARCHAR(255) NULL,
    
    -- Soft delete
    is_deleted BIT DEFAULT 0,
    deleted_at DATETIME2(7) NULL,
    deleted_by_user_id NVARCHAR(255) NULL,
    deleted_by_name NVARCHAR(255) NULL,
    
    -- Add foreign key constraint to appointments table
    CONSTRAINT FK_visit_forms_appointment FOREIGN KEY (appointment_id) REFERENCES dbo.appointments(appointment_id)
);
GO

-- Create indexes for performance
CREATE INDEX IX_visit_forms_appointment_id ON dbo.visit_forms(appointment_id);
CREATE INDEX IX_visit_forms_status ON dbo.visit_forms(status) WHERE is_deleted = 0;
CREATE INDEX IX_visit_forms_created_by ON dbo.visit_forms(created_by_user_id) WHERE is_deleted = 0;
CREATE INDEX IX_visit_forms_visit_date ON dbo.visit_forms(visit_date) WHERE is_deleted = 0;
GO

-- Create visit form sections table for detailed section tracking
CREATE TABLE dbo.visit_form_sections (
    section_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    visit_form_id UNIQUEIDENTIFIER NOT NULL,
    
    section_name NVARCHAR(100) NOT NULL, -- 'visit_info', 'family_home', 'attendees', etc.
    section_data NVARCHAR(MAX), -- JSON data for the section
    section_order INT DEFAULT 0,
    is_completed BIT DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
    
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_visit_form_sections_form FOREIGN KEY (visit_form_id) REFERENCES dbo.visit_forms(visit_form_id) ON DELETE CASCADE
);
GO

-- Create index for sections
CREATE INDEX IX_visit_form_sections_form_id ON dbo.visit_form_sections(visit_form_id);
CREATE INDEX IX_visit_form_sections_name ON dbo.visit_form_sections(section_name);
GO

-- Create visit form attachments table for file uploads
CREATE TABLE dbo.visit_form_attachments (
    attachment_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    visit_form_id UNIQUEIDENTIFIER NOT NULL,
    
    file_name NVARCHAR(255) NOT NULL,
    file_path NVARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type NVARCHAR(100),
    attachment_type NVARCHAR(50), -- 'photo', 'document', 'signature', 'evidence'
    description NVARCHAR(500),
    
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    created_by_user_id NVARCHAR(255) NOT NULL,
    created_by_name NVARCHAR(255) NOT NULL,
    
    CONSTRAINT FK_visit_form_attachments_form FOREIGN KEY (visit_form_id) REFERENCES dbo.visit_forms(visit_form_id) ON DELETE CASCADE
);
GO

-- Create index for attachments
CREATE INDEX IX_visit_form_attachments_form_id ON dbo.visit_form_attachments(visit_form_id);
CREATE INDEX IX_visit_form_attachments_type ON dbo.visit_form_attachments(attachment_type);
GO

PRINT 'Visit forms tables created successfully!';
