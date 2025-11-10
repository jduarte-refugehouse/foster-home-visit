-- Continuum Entries Table
-- Tracks multi-dimensional activity logs for the continuum concept
-- Supports home visits, staff activities, and entity relationships

CREATE TABLE [dbo].[continuum_entries] (
    [entry_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [appointment_id] UNIQUEIDENTIFIER NULL, -- Links to appointment (can be NULL for non-appointment activities)
    [activity_type] NVARCHAR(50) NOT NULL, -- 'drive_start', 'drive_end', 'visit_start', 'visit_end', etc.
    [activity_status] NVARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'complete', 'cancelled'
    
    -- Temporal dimension (When)
    [timestamp] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [duration_minutes] INT NULL, -- Calculated duration if applicable
    
    -- Relational dimension (Who)
    [staff_user_id] NVARCHAR(255) NULL, -- Staff member conducting activity
    [staff_name] NVARCHAR(255) NULL,
    [home_guid] UNIQUEIDENTIFIER NULL, -- Home entity
    [home_xref] INT NULL, -- Home XREF for quick lookup
    [home_name] NVARCHAR(500) NULL,
    [entity_guids] NVARCHAR(MAX) NULL, -- JSON array of related entity GUIDs (children, household members, etc.)
    
    -- Functional dimension (What)
    [activity_description] NVARCHAR(MAX) NULL,
    [metadata] NVARCHAR(MAX) NULL, -- JSON for additional activity-specific data
    
    -- Contextual dimension (Where)
    [location_latitude] FLOAT NULL,
    [location_longitude] FLOAT NULL,
    [location_address] NVARCHAR(500) NULL,
    [context_notes] NVARCHAR(MAX) NULL,
    
    -- Outcome dimension (Why)
    [outcome] NVARCHAR(MAX) NULL,
    [triggered_by_entry_id] UNIQUEIDENTIFIER NULL, -- Links to entry that triggered this one
    
    -- System tracking
    [created_at] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [created_by_user_id] NVARCHAR(255) NULL,
    [is_deleted] BIT NOT NULL DEFAULT 0,
    
    CONSTRAINT [PK_continuum_entries] PRIMARY KEY CLUSTERED ([entry_id] ASC),
    CONSTRAINT [FK_continuum_entries_appointments] FOREIGN KEY ([appointment_id]) 
        REFERENCES [dbo].[appointments]([appointment_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_continuum_entries_triggered_by] FOREIGN KEY ([triggered_by_entry_id]) 
        REFERENCES [dbo].[continuum_entries]([entry_id])
)

GO

-- Indexes for performance
CREATE NONCLUSTERED INDEX [IX_continuum_entries_appointment_id] 
    ON [dbo].[continuum_entries]([appointment_id]) 
    WHERE [is_deleted] = 0

GO

CREATE NONCLUSTERED INDEX [IX_continuum_entries_home_guid] 
    ON [dbo].[continuum_entries]([home_guid]) 
    WHERE [is_deleted] = 0 AND [home_guid] IS NOT NULL

GO

CREATE NONCLUSTERED INDEX [IX_continuum_entries_staff_user_id] 
    ON [dbo].[continuum_entries]([staff_user_id]) 
    WHERE [is_deleted] = 0 AND [staff_user_id] IS NOT NULL

GO

CREATE NONCLUSTERED INDEX [IX_continuum_entries_timestamp] 
    ON [dbo].[continuum_entries]([timestamp] DESC) 
    WHERE [is_deleted] = 0

GO

CREATE NONCLUSTERED INDEX [IX_continuum_entries_activity_type] 
    ON [dbo].[continuum_entries]([activity_type], [timestamp] DESC) 
    WHERE [is_deleted] = 0

GO

-- Grant permissions to v0_application_role
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[continuum_entries] TO [v0_application_role]

GO

