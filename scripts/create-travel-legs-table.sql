-- Travel Legs Table
-- Flexible travel tracking system that supports any travel scenario
-- Each leg represents a single travel segment from point A to point B
-- Legs can be tied to appointments or be standalone/ad-hoc

-- Check if table exists before creating
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'travel_legs' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[travel_legs] (
    [leg_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    
    -- Staff tracking
    [staff_user_id] NVARCHAR(255) NOT NULL,
    [staff_name] NVARCHAR(255) NULL,
    
    -- Journey/Route grouping (optional - for grouping legs into a single trip/journey)
    [journey_id] UNIQUEIDENTIFIER NULL, -- Groups related legs together (e.g., all legs from one day)
    [leg_sequence] INT NULL, -- Order within the journey (1, 2, 3, etc.)
    
    -- Start point
    [start_latitude] FLOAT NULL,
    [start_longitude] FLOAT NULL,
    [start_timestamp] DATETIME2(7) NOT NULL,
    [start_location_name] NVARCHAR(500) NULL, -- "Office", "Home Name", "123 Main St", etc.
    [start_location_address] NVARCHAR(500) NULL,
    [start_location_type] NVARCHAR(50) NULL, -- 'office', 'appointment', 'home', 'other'
    [appointment_id_from] UNIQUEIDENTIFIER NULL, -- If starting from an appointment
    
    -- End point
    [end_latitude] FLOAT NULL,
    [end_longitude] FLOAT NULL,
    [end_timestamp] DATETIME2(7) NULL, -- NULL if leg is in progress
    [end_location_name] NVARCHAR(500) NULL,
    [end_location_address] NVARCHAR(500) NULL,
    [end_location_type] NVARCHAR(50) NULL,
    [appointment_id_to] UNIQUEIDENTIFIER NULL, -- If ending at an appointment
    
    -- Calculated data
    [calculated_mileage] DECIMAL(10,2) NULL,
    [estimated_toll_cost] DECIMAL(10,2) NULL,
    [actual_toll_cost] DECIMAL(10,2) NULL,
    [duration_minutes] INT NULL, -- Calculated from timestamps
    
    -- Status and flags
    [leg_status] NVARCHAR(20) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'cancelled'
    [is_final_leg] BIT NOT NULL DEFAULT 0, -- TRUE for the last leg of a journey (return to office/home)
    [is_manual_entry] BIT NOT NULL DEFAULT 0, -- TRUE if manually entered/edited (for forgotten travel)
    [is_backdated] BIT NOT NULL DEFAULT 0, -- TRUE if timestamps were manually adjusted
    
    -- Manual overrides (for corrections/forgotten travel)
    [manual_mileage] DECIMAL(10,2) NULL, -- Manual mileage entry (overrides calculated)
    [manual_notes] NVARCHAR(MAX) NULL, -- Notes about manual entry/corrections
    
    -- Metadata
    [travel_purpose] NVARCHAR(500) NULL, -- "Home visit", "Training", "Meeting", etc.
    [vehicle_type] NVARCHAR(50) NULL, -- "Personal vehicle", "Company vehicle", etc.
    [reimbursable] BIT NOT NULL DEFAULT 1, -- Whether this leg is eligible for reimbursement
    
    -- System tracking
    [created_at] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [created_by_user_id] NVARCHAR(255) NULL,
    [updated_at] DATETIME2(7) NULL,
    [updated_by_user_id] NVARCHAR(255) NULL,
    [is_deleted] BIT NOT NULL DEFAULT 0,
    
    CONSTRAINT [PK_travel_legs] PRIMARY KEY CLUSTERED ([leg_id] ASC),
    CONSTRAINT [FK_travel_legs_appointments_from] FOREIGN KEY ([appointment_id_from]) 
        REFERENCES [appointments]([appointment_id]),
    CONSTRAINT [FK_travel_legs_appointments_to] FOREIGN KEY ([appointment_id_to]) 
        REFERENCES [appointments]([appointment_id])
    )
    GO

    -- Indexes for common queries
    CREATE INDEX [IX_travel_legs_staff_date] ON [dbo].[travel_legs] ([staff_user_id], [start_timestamp], [is_deleted])
    CREATE INDEX [IX_travel_legs_journey] ON [dbo].[travel_legs] ([journey_id], [leg_sequence])
    CREATE INDEX [IX_travel_legs_appointments] ON [dbo].[travel_legs] ([appointment_id_from], [appointment_id_to])
    CREATE INDEX [IX_travel_legs_status] ON [dbo].[travel_legs] ([leg_status], [is_deleted])
    GO

    -- Add comments
    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Flexible travel tracking system. Each leg represents a single travel segment from point A to point B. Supports ad-hoc travel, backdating, manual entry, and any travel scenario.', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'travel_legs'
    GO

    PRINT 'Table travel_legs created successfully.'
END
ELSE
BEGIN
    PRINT 'Table travel_legs already exists. Skipping creation.'
END
GO

-- Indexes for common queries
CREATE INDEX [IX_travel_legs_staff_date] ON [dbo].[travel_legs] ([staff_user_id], [start_timestamp], [is_deleted])
CREATE INDEX [IX_travel_legs_journey] ON [dbo].[travel_legs] ([journey_id], [leg_sequence])
CREATE INDEX [IX_travel_legs_appointments] ON [dbo].[travel_legs] ([appointment_id_from], [appointment_id_to])
CREATE INDEX [IX_travel_legs_status] ON [dbo].[travel_legs] ([leg_status], [is_deleted])
GO

-- Add comments
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Flexible travel tracking system. Each leg represents a single travel segment from point A to point B. Supports ad-hoc travel, backdating, manual entry, and any travel scenario.', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'travel_legs'
GO

