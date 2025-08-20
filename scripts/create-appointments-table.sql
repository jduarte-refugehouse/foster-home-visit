-- Create appointments table for managing various types of appointments
-- This table is designed to be flexible for different appointment types (home visits, meetings, etc.)

-- First, check if the table exists and drop it if needed (for development)
IF OBJECT_ID('dbo.appointments', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.appointments;
    PRINT 'Existing appointments table dropped.';
END

-- Create the appointments table
CREATE TABLE dbo.appointments (
    -- Primary key
    appointment_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Basic appointment information
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    appointment_type NVARCHAR(50) NOT NULL DEFAULT 'home_visit', -- home_visit, meeting, assessment, follow_up, etc.
    
    -- Date and time information
    start_datetime DATETIME2(7) NOT NULL,
    end_datetime DATETIME2(7) NOT NULL,
    duration_minutes AS DATEDIFF(MINUTE, start_datetime, end_datetime) PERSISTED,
    
    -- Status tracking
    status NVARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, in_progress, rescheduled
    
    -- Location information (for home visits)
    home_xref INT NULL, -- Foreign key to SyncActiveHomes.Xref
    home_name NVARCHAR(255) NULL, -- Denormalized for performance
    location_address NVARCHAR(500) NULL,
    location_notes NVARCHAR(MAX) NULL,
    
    -- Staff assignment
    assigned_to_user_id NVARCHAR(255) NOT NULL, -- Clerk user ID
    assigned_to_name NVARCHAR(255) NOT NULL, -- User display name
    assigned_to_role NVARCHAR(100) NULL, -- Case Manager, Social Worker, etc.
    
    -- Creator information
    created_by_user_id NVARCHAR(255) NOT NULL,
    created_by_name NVARCHAR(255) NOT NULL,
    
    -- Additional metadata
    priority NVARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    is_recurring BIT DEFAULT 0,
    recurring_pattern NVARCHAR(100) NULL, -- weekly, monthly, etc.
    parent_appointment_id UNIQUEIDENTIFIER NULL, -- For recurring appointments
    
    -- Notes and outcomes
    preparation_notes NVARCHAR(MAX) NULL,
    completion_notes NVARCHAR(MAX) NULL,
    outcome NVARCHAR(50) NULL, -- successful, needs_followup, cancelled, etc.
    
    -- Audit fields
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_by_user_id NVARCHAR(255) NULL,
    
    -- Soft delete
    is_deleted BIT DEFAULT 0,
    deleted_at DATETIME2(7) NULL,
    deleted_by_user_id NVARCHAR(255) NULL,
    
    -- Constraints
    CONSTRAINT CK_appointments_end_after_start CHECK (end_datetime > start_datetime),
    CONSTRAINT CK_appointments_status CHECK (status IN ('scheduled', 'completed', 'cancelled', 'in_progress', 'rescheduled')),
    CONSTRAINT CK_appointments_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT CK_appointments_type CHECK (appointment_type IN ('home_visit', 'meeting', 'assessment', 'follow_up', 'court_hearing', 'training', 'other')),
    CONSTRAINT FK_appointments_parent FOREIGN KEY (parent_appointment_id) REFERENCES dbo.appointments(appointment_id)
);

-- Create indexes for performance
CREATE INDEX IX_appointments_start_datetime ON dbo.appointments(start_datetime) WHERE is_deleted = 0;
CREATE INDEX IX_appointments_assigned_to ON dbo.appointments(assigned_to_user_id) WHERE is_deleted = 0;
CREATE INDEX IX_appointments_home_xref ON dbo.appointments(home_xref) WHERE is_deleted = 0;
CREATE INDEX IX_appointments_status ON dbo.appointments(status) WHERE is_deleted = 0;
CREATE INDEX IX_appointments_type ON dbo.appointments(appointment_type) WHERE is_deleted = 0;
CREATE INDEX IX_appointments_created_by ON dbo.appointments(created_by_user_id);

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER TR_appointments_update_timestamp
ON dbo.appointments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.appointments
    SET updated_at = GETUTCDATE()
    FROM dbo.appointments a
    INNER JOIN inserted i ON a.appointment_id = i.appointment_id;
END;

-- Insert some sample data for testing
INSERT INTO dbo.appointments (
    title,
    description,
    appointment_type,
    start_datetime,
    end_datetime,
    status,
    home_xref,
    home_name,
    location_address,
    assigned_to_user_id,
    assigned_to_name,
    assigned_to_role,
    created_by_user_id,
    created_by_name,
    priority,
    preparation_notes
) VALUES 
(
    'Initial Home Visit - Johnson Family',
    'First home visit to assess living conditions and meet the family',
    'home_visit',
    DATEADD(DAY, 1, GETDATE()),
    DATEADD(HOUR, 1.5, DATEADD(DAY, 1, GETDATE())),
    'scheduled',
    1001, -- Assuming this home exists in SyncActiveHomes
    'Johnson Family Home',
    '123 Main St, City, State 12345',
    'user_sarah_wilson',
    'Sarah Wilson',
    'Case Manager',
    'user_admin',
    'Admin User',
    'high',
    'Bring assessment forms and safety checklist'
),
(
    'Follow-up Visit - Smith Family',
    'Monthly check-in visit to review progress',
    'home_visit',
    DATEADD(DAY, 3, GETDATE()),
    DATEADD(HOUR, 1, DATEADD(DAY, 3, GETDATE())),
    'scheduled',
    1002,
    'Smith Family Home',
    '456 Oak Ave, City, State 12345',
    'user_mike_davis',
    'Mike Davis',
    'Social Worker',
    'user_admin',
    'Admin User',
    'normal',
    'Review previous action items'
),
(
    'Safety Assessment - Brown Family',
    'Urgent safety assessment following incident report',
    'assessment',
    DATEADD(HOUR, 4, GETDATE()),
    DATEADD(HOUR, 5, GETDATE()),
    'in_progress',
    1003,
    'Brown Family Home',
    '789 Pine St, City, State 12345',
    'user_lisa_chen',
    'Lisa Chen',
    'Home Visitor',
    'user_admin',
    'Admin User',
    'urgent',
    'Bring safety assessment forms and camera'
);

PRINT 'Appointments table created successfully with sample data.';
PRINT 'Table includes support for:';
PRINT '- Multiple appointment types (home visits, meetings, assessments, etc.)';
PRINT '- Flexible scheduling with start/end times';
PRINT '- Staff assignment and role tracking';
PRINT '- Status management and priority levels';
PRINT '- Location information and home references';
PRINT '- Audit trail and soft delete capability';
PRINT '- Recurring appointment support';
PRINT '- Notes for preparation and completion';
