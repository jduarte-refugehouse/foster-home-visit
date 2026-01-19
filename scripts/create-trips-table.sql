-- Trips Table
-- This table tracks complete journeys (trips) that consist of one or more travel legs
-- Each trip has a journey_id (PK) that matches the journey_id FK in travel_legs
-- This allows rolling up totals from all legs in a journey

-- Check if table exists before creating
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'trips' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[trips] (
        -- Primary key (matches journey_id FK in travel_legs)
        [journey_id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        
        -- Staff tracking
        [staff_user_id] NVARCHAR(255) NOT NULL,
        [staff_name] NVARCHAR(255) NULL,
        
        -- Trip purpose (matches leg purpose)
        [travel_purpose] NVARCHAR(500) NULL,
        [trip_type] NVARCHAR(50) NULL, -- Optional: 'home_visit', 'training', etc.
        
        -- Timing (first leg start, last leg end)
        [start_timestamp] DATETIME2(7) NOT NULL, -- First leg start
        [end_timestamp] DATETIME2(7) NULL, -- Last leg end (set when trip completes)
        
        -- Rolled-up totals from all legs
        [total_mileage] DECIMAL(10,2) NULL, -- SUM of calculated_mileage or manual_mileage from all legs
        [total_duration_minutes] INT NULL, -- SUM of duration_minutes from all legs
        [total_tolls_estimated] DECIMAL(10,2) NULL, -- SUM of estimated_toll_cost from all legs
        [total_tolls_actual] DECIMAL(10,2) NULL, -- SUM of actual_toll_cost from all legs
        
        -- Optional overall origin/destination (can be derived from first/last leg)
        [origin_name] NVARCHAR(500) NULL,
        [origin_address] NVARCHAR(500) NULL,
        [destination_name] NVARCHAR(500) NULL,
        [destination_address] NVARCHAR(500) NULL,
        
        -- Flags
        [is_manual_entry] BIT NOT NULL DEFAULT 0, -- TRUE if any leg is manual
        [is_backdated] BIT NOT NULL DEFAULT 0, -- TRUE if any leg is backdated
        [reimbursable] BIT NOT NULL DEFAULT 1, -- Whether trip is eligible for reimbursement
        
        -- Status
        [trip_status] NVARCHAR(50) NOT NULL DEFAULT 'in_progress', -- 'draft', 'in_progress', 'completed'
        
        -- Audit
        [created_at] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        [created_by_user_id] NVARCHAR(255) NULL,
        [updated_at] DATETIME2(7) NULL,
        [updated_by_user_id] NVARCHAR(255) NULL,
        [is_deleted] BIT NOT NULL DEFAULT 0,
        
        -- Optional: unit/staff_radius_guid if schema uses it
        [staff_radius_guid] UNIQUEIDENTIFIER NULL,
        [unit] NVARCHAR(10) NULL, -- 'DAL', 'SAN', etc.
    )
    GO

    -- Indexes for common queries
    CREATE INDEX [IX_trips_staff_date] ON [dbo].[trips] ([staff_user_id], [start_timestamp], [is_deleted])
    CREATE INDEX [IX_trips_status] ON [dbo].[trips] ([trip_status], [is_deleted])
    CREATE INDEX [IX_trips_purpose] ON [dbo].[trips] ([travel_purpose], [is_deleted])
    GO

    -- Add comments
    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Tracks complete journeys (trips) consisting of one or more travel legs. Each trip has a journey_id (PK) that matches the journey_id FK in travel_legs. Totals are rolled up from all legs when the trip completes.', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'trips'
    GO

    PRINT 'Table trips created successfully.'
END
ELSE
BEGIN
    PRINT 'Table trips already exists. Skipping creation.'
END
GO
