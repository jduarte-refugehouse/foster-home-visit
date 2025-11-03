-- =============================================
-- On-Call Schedule Management System
-- =============================================
-- This table manages the on-call rotation schedule for staff members
-- Supports 24/7 coverage tracking and gap detection

CREATE TABLE [dbo].[on_call_schedule](
    [id] [uniqueidentifier] NOT NULL PRIMARY KEY DEFAULT NEWID(),
    
    -- Staff member information
    [user_id] [uniqueidentifier] NULL, -- Links to app_users if available
    [user_name] [nvarchar](255) NOT NULL, -- Full name for display
    [user_email] [nvarchar](255) NULL,
    [user_phone] [nvarchar](50) NULL,
    
    -- Schedule information
    [start_datetime] [datetime2](7) NOT NULL,
    [end_datetime] [datetime2](7) NOT NULL,
    [duration_hours] AS (DATEDIFF(HOUR, [start_datetime], [end_datetime])) PERSISTED,
    
    -- Status and metadata
    [is_active] [bit] NOT NULL DEFAULT 1,
    [notes] [nvarchar](max) NULL,
    [priority_level] [nvarchar](20) NULL DEFAULT 'normal', -- normal, backup, primary
    
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
GO

-- Create indexes for performance
CREATE NONCLUSTERED INDEX [IX_OnCallSchedule_DateRange] 
ON [dbo].[on_call_schedule]([start_datetime], [end_datetime])
INCLUDE ([user_name], [is_active], [is_deleted]);
GO

CREATE NONCLUSTERED INDEX [IX_OnCallSchedule_UserId] 
ON [dbo].[on_call_schedule]([user_id])
WHERE [is_active] = 1 AND [is_deleted] = 0;
GO

-- =============================================
-- View: Current On-Call Schedule
-- =============================================
CREATE VIEW [dbo].[vw_CurrentOnCallSchedule] AS
SELECT 
    ocs.id,
    ocs.user_id,
    ocs.user_name,
    ocs.user_email,
    ocs.user_phone,
    ocs.start_datetime,
    ocs.end_datetime,
    ocs.duration_hours,
    ocs.priority_level,
    ocs.notes,
    ocs.created_by_name,
    ocs.created_at,
    -- Calculate if currently on call
    CASE 
        WHEN GETDATE() BETWEEN ocs.start_datetime AND ocs.end_datetime 
        THEN 1 
        ELSE 0 
    END as is_currently_active,
    -- Days until shift starts
    DATEDIFF(DAY, GETDATE(), ocs.start_datetime) as days_until_shift,
    -- User details from app_users if linked
    u.first_name,
    u.last_name,
    u.is_active as user_is_active
FROM on_call_schedule ocs
LEFT JOIN app_users u ON ocs.user_id = u.id
WHERE ocs.is_active = 1 
  AND ocs.is_deleted = 0
  AND ocs.end_datetime >= GETDATE(); -- Only show current and future shifts
GO

-- =============================================
-- View: On-Call Coverage Gaps
-- =============================================
CREATE VIEW [dbo].[vw_OnCallCoverageGaps] AS
WITH ShiftRanges AS (
    SELECT 
        start_datetime,
        end_datetime,
        user_name
    FROM on_call_schedule
    WHERE is_active = 1 
      AND is_deleted = 0
      AND end_datetime >= GETDATE()
),
TimeSlots AS (
    SELECT 
        s1.end_datetime as gap_start,
        s2.start_datetime as gap_end,
        DATEDIFF(HOUR, s1.end_datetime, s2.start_datetime) as gap_hours
    FROM ShiftRanges s1
    CROSS APPLY (
        SELECT TOP 1 start_datetime
        FROM ShiftRanges s2
        WHERE s2.start_datetime > s1.end_datetime
        ORDER BY s2.start_datetime
    ) s2
)
SELECT 
    gap_start,
    gap_end,
    gap_hours,
    CASE 
        WHEN gap_hours > 0 THEN 'COVERAGE GAP'
        ELSE 'No Gap'
    END as status
FROM TimeSlots
WHERE gap_hours > 0;
GO

-- =============================================
-- Sample Data (for testing only - remove in production)
-- =============================================
/*
-- Example: Add a sample on-call schedule
INSERT INTO on_call_schedule (
    user_name, 
    user_email, 
    start_datetime, 
    end_datetime, 
    notes,
    created_by_user_id,
    created_by_name
) VALUES 
(
    'John Doe', 
    'john.doe@refugehouse.org', 
    DATEADD(HOUR, -4, GETDATE()), 
    DATEADD(HOUR, 4, GETDATE()), 
    'Regular shift',
    'system',
    'System'
);
*/

PRINT 'On-call schedule table and views created successfully';
GO

