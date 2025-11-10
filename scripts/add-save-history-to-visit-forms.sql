-- Add save history tracking fields to visit_forms table
-- This tracks session-based save history for progressive history maintenance

-- Add current session tracking fields
ALTER TABLE [dbo].[visit_forms]
ADD 
    [current_session_id] [nvarchar](100) NULL,
    [current_session_last_save] [datetime2](7) NULL,
    [current_session_save_type] [nvarchar](20) NULL, -- 'auto' or 'manual'
    [current_session_user_id] [nvarchar](100) NULL,
    [current_session_user_name] [nvarchar](200) NULL,
    [save_history_json] [nvarchar](max) NULL; -- JSON array of previous session saves

-- Add index for session queries
CREATE NONCLUSTERED INDEX [IX_visit_forms_current_session_id] 
ON [dbo].[visit_forms] ([current_session_id])
INCLUDE ([current_session_last_save], [current_session_save_type]);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[visit_forms] TO [v0_application_role];

GO

