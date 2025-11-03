-- Enhanced On-Call Schedule table with support for multiple roles/scenarios
-- Run this in Azure Query Editor

CREATE TABLE [dbo].[on_call_schedule](
    [id] [uniqueidentifier] NOT NULL PRIMARY KEY DEFAULT NEWID(),
    
    -- Staff member information
    [user_id] [uniqueidentifier] NULL,
    [user_name] [nvarchar](255) NOT NULL,
    [user_email] [nvarchar](255) NULL,
    [user_phone] [nvarchar](50) NULL,
    
    -- Schedule information
    [start_datetime] [datetime2](7) NOT NULL,
    [end_datetime] [datetime2](7) NOT NULL,
    [duration_hours] AS (DATEDIFF(HOUR, [start_datetime], [end_datetime])) PERSISTED,
    
    -- NEW: Support for multiple on-call scenarios
    [on_call_type] [nvarchar](100) NULL DEFAULT 'general', -- e.g., 'general', 'crisis_response', 'medical', 'supervisor'
    [on_call_category] [nvarchar](100) NULL, -- e.g., 'primary', 'backup', 'escalation'
    [role_required] [nvarchar](100) NULL, -- e.g., 'liaison', 'case_manager', 'supervisor'
    [department] [nvarchar](100) NULL, -- e.g., 'foster_care', 'residential', 'admin'
    [region] [nvarchar](100) NULL, -- For geographic coverage
    [skills_required] [nvarchar](500) NULL, -- Comma-separated: 'crisis,medical,bilingual'
    [escalation_level] [int] NULL DEFAULT 1, -- 1=primary, 2=backup, 3=tertiary
    
    -- Status and metadata
    [is_active] [bit] NOT NULL DEFAULT 1,
    [notes] [nvarchar](max) NULL,
    [priority_level] [nvarchar](20) NULL DEFAULT 'normal', -- Kept for backward compatibility
    
    -- Audit fields
    [created_at] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [created_by_user_id] [nvarchar](255) NOT NULL,
    [created_by_name] [nvarchar](255) NOT NULL,
    [updated_at] [datetime2](7) NULL,
    [updated_by_user_id] [nvarchar](255) NULL,
    [updated_by_name] [nvarchar](255) NULL,
    
    -- Soft delete support
    [is_deleted] [bit] NOT NULL DEFAULT 0,
    [deleted_at] [datetime2](7) NULL,
    [deleted_by_user_id] [nvarchar](255) NULL,
    
    CONSTRAINT [FK_OnCallSchedule_AppUsers] FOREIGN KEY ([user_id]) 
        REFERENCES [dbo].[app_users]([id]),
    
    CONSTRAINT [CK_OnCallSchedule_DateRange] 
        CHECK ([end_datetime] > [start_datetime])
);

-- Create indexes for performance
CREATE NONCLUSTERED INDEX [IX_OnCallSchedule_DateRange] 
ON [dbo].[on_call_schedule]([start_datetime], [end_datetime])
INCLUDE ([user_name], [is_active], [is_deleted], [on_call_type]);

CREATE NONCLUSTERED INDEX [IX_OnCallSchedule_Type] 
ON [dbo].[on_call_schedule]([on_call_type], [is_active], [is_deleted])
INCLUDE ([start_datetime], [end_datetime], [user_name]);

CREATE NONCLUSTERED INDEX [IX_OnCallSchedule_Escalation] 
ON [dbo].[on_call_schedule]([escalation_level], [on_call_type])
WHERE [is_active] = 1 AND [is_deleted] = 0;

-- Grant permissions to v0_application_role
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[on_call_schedule] TO [v0_application_role];

PRINT 'Enhanced on-call schedule table created successfully!';
PRINT 'Permissions granted to v0_application_role';
PRINT '';
PRINT 'New features available:';
PRINT '  - Multiple on-call types (general, crisis, medical, etc.)';
PRINT '  - Role-based assignments';
PRINT '  - Department/Region filtering';
PRINT '  - Escalation chains (primary, backup, tertiary)';
PRINT '  - Skills-based matching';

