-- ============================================================
-- WORKFORCE TIME TRACKING & T3C COST REPORTING
-- Schema Creation Script
--
-- Run this script to create all workforce-related tables
-- Prerequisites: None (standalone tables)
-- ============================================================

-- ============================================================
-- ACTIVITY TYPES
-- Configurable activity type definitions with stable codes
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'workforce_activity_types')
BEGIN
    CREATE TABLE workforce_activity_types (
        id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

        -- Stable identifier (never changes)
        code                    VARCHAR(50) UNIQUE NOT NULL,

        -- Display properties (can be updated)
        name                    VARCHAR(100) NOT NULL,
        description             NVARCHAR(500),
        category                VARCHAR(30) NOT NULL,
        -- Categories: CM, TX, DC, MED, TRV, ADM, TRANS, PP, KIN, ADOPT, HDEV, INTAKE

        icon                    VARCHAR(20),           -- Emoji for UI

        -- Cost reporting
        cost_report_category    VARCHAR(50) NOT NULL,
        -- Values: CASE_MGMT, TREATMENT_COORD, DIRECT_CARE, MEDICAL, TRAVEL, ADMIN

        -- Behavior flags
        is_travel               BIT DEFAULT 0,
        requires_concerning     BIT DEFAULT 1,
        valid_concerning_types  NVARCHAR(MAX),         -- JSON array of allowed concerning types

        -- UI configuration
        display_order           INT DEFAULT 100,
        is_quick_access         BIT DEFAULT 0,
        is_active               BIT DEFAULT 1,

        -- Audit
        created_at              DATETIME2 DEFAULT GETUTCDATE(),
        updated_at              DATETIME2 DEFAULT GETUTCDATE()
    );

    PRINT 'Created table: workforce_activity_types';
END
ELSE
    PRINT 'Table already exists: workforce_activity_types';
GO

-- ============================================================
-- CONCERNING TYPES
-- Configurable concerning type definitions
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'workforce_concerning_types')
BEGIN
    CREATE TABLE workforce_concerning_types (
        id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

        -- Stable identifier
        code                    VARCHAR(50) UNIQUE NOT NULL,

        -- Display properties
        name                    VARCHAR(100) NOT NULL,
        description             NVARCHAR(500),

        -- Cost allocation behavior
        cost_center_type        VARCHAR(50),
        allows_child_select     BIT DEFAULT 0,
        allows_home_select      BIT DEFAULT 0,
        auto_split_children     BIT DEFAULT 0,

        -- UI configuration
        display_order           INT DEFAULT 100,
        group_name              VARCHAR(50),           -- For grouping in UI
        is_active               BIT DEFAULT 1,

        -- Audit
        created_at              DATETIME2 DEFAULT GETUTCDATE(),
        updated_at              DATETIME2 DEFAULT GETUTCDATE()
    );

    PRINT 'Created table: workforce_concerning_types';
END
ELSE
    PRINT 'Table already exists: workforce_concerning_types';
GO

-- ============================================================
-- WORK DAYS
-- Tracks daily work status for each staff member
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'workforce_days')
BEGIN
    CREATE TABLE workforce_days (
        id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

        -- Staff reference
        staff_user_id           VARCHAR(100) NOT NULL,
        staff_email             VARCHAR(255) NOT NULL,
        staff_name              VARCHAR(255),

        -- Day identification
        work_date               DATE NOT NULL,

        -- State machine
        status                  VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
        -- Values: NOT_STARTED, ACTIVE, PENDING_COMPLETION, COMPLETED, SICK, TIME_OFF, ON_CALL

        -- Timestamps
        day_start_time          DATETIME2,
        day_end_time            DATETIME2,

        -- Calculated totals (updated on reconciliation)
        total_minutes           INT DEFAULT 0,
        total_drive_miles       DECIMAL(10,2) DEFAULT 0,

        -- Metadata
        notes                   NVARCHAR(MAX),
        created_at              DATETIME2 DEFAULT GETUTCDATE(),
        updated_at              DATETIME2 DEFAULT GETUTCDATE(),

        -- Constraints
        CONSTRAINT uq_workforce_staff_date UNIQUE (staff_user_id, work_date)
    );

    -- Indexes
    CREATE INDEX ix_workforce_days_work_date ON workforce_days(work_date);
    CREATE INDEX ix_workforce_days_staff_status ON workforce_days(staff_user_id, status);

    PRINT 'Created table: workforce_days';
END
ELSE
    PRINT 'Table already exists: workforce_days';
GO

-- ============================================================
-- TIME BLOCKS
-- Individual activity blocks within a work day
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'workforce_time_blocks')
BEGIN
    CREATE TABLE workforce_time_blocks (
        id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

        -- Parent reference
        workforce_day_id        UNIQUEIDENTIFIER NOT NULL,

        -- Timing
        start_time              DATETIME2 NOT NULL,
        end_time                DATETIME2 NOT NULL,
        duration_minutes        INT NOT NULL,  -- Calculated, must be multiple of 15

        -- Activity classification
        activity_code           VARCHAR(50) NOT NULL,  -- References workforce_activity_types.code

        -- Concerning classification
        concerning_type         VARCHAR(50) NOT NULL,  -- References workforce_concerning_types.code

        -- Entity references (based on concerning_type)
        home_guid               UNIQUEIDENTIFIER,      -- When concerning HOME_* types
        child_guids             NVARCHAR(MAX),         -- JSON array of child GUIDs

        -- Travel-specific fields
        is_travel               BIT DEFAULT 0,
        travel_leg_id           UNIQUEIDENTIFIER,      -- Links to travel_legs table
        mileage                 DECIMAL(10,2),

        -- Continuum integration
        continuum_entry_id      UNIQUEIDENTIFIER,      -- Links to continuum_entries if applicable

        -- Notes
        notes                   NVARCHAR(MAX),

        -- Audit
        created_at              DATETIME2 DEFAULT GETUTCDATE(),
        updated_at              DATETIME2 DEFAULT GETUTCDATE(),
        created_by              VARCHAR(100),

        -- Foreign keys
        CONSTRAINT fk_time_block_day FOREIGN KEY (workforce_day_id)
            REFERENCES workforce_days(id)
    );

    -- Indexes
    CREATE INDEX ix_workforce_blocks_day_id ON workforce_time_blocks(workforce_day_id);
    CREATE INDEX ix_workforce_blocks_activity ON workforce_time_blocks(activity_code);
    CREATE INDEX ix_workforce_blocks_concerning ON workforce_time_blocks(concerning_type);
    CREATE INDEX ix_workforce_blocks_home ON workforce_time_blocks(home_guid);
    CREATE INDEX ix_workforce_blocks_time_range ON workforce_time_blocks(start_time, end_time);

    PRINT 'Created table: workforce_time_blocks';
END
ELSE
    PRINT 'Table already exists: workforce_time_blocks';
GO

-- ============================================================
-- COST ALLOCATIONS
-- Computed allocations to service packages (generated from time blocks)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'workforce_cost_allocations')
BEGIN
    CREATE TABLE workforce_cost_allocations (
        id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

        -- Source reference
        time_block_id           UNIQUEIDENTIFIER NOT NULL,

        -- Allocation target
        child_guid              UNIQUEIDENTIFIER,      -- NULL for non-child allocations
        service_package         VARCHAR(100),          -- From SyncChildrenInPlacement
        cost_center             VARCHAR(100),          -- For non-child allocations

        -- Texas HHSC cost report category
        cost_report_category    VARCHAR(50) NOT NULL,
        -- Values: CASE_MGMT, TREATMENT_COORD, DIRECT_CARE, MEDICAL, TRAVEL, ADMIN

        -- Allocated time
        allocated_minutes       INT NOT NULL,
        allocation_percentage   DECIMAL(5,2),          -- For weighted distribution

        -- Allocation method
        allocation_method       VARCHAR(30) NOT NULL DEFAULT 'EQUAL',
        -- Values: EQUAL, WEIGHTED, MANUAL, DIRECT

        -- Audit
        created_at              DATETIME2 DEFAULT GETUTCDATE(),

        -- Foreign keys
        CONSTRAINT fk_allocation_block FOREIGN KEY (time_block_id)
            REFERENCES workforce_time_blocks(id) ON DELETE CASCADE
    );

    -- Indexes
    CREATE INDEX ix_workforce_alloc_block_id ON workforce_cost_allocations(time_block_id);
    CREATE INDEX ix_workforce_alloc_child ON workforce_cost_allocations(child_guid);
    CREATE INDEX ix_workforce_alloc_service_package ON workforce_cost_allocations(service_package);
    CREATE INDEX ix_workforce_alloc_cost_category ON workforce_cost_allocations(cost_report_category);

    PRINT 'Created table: workforce_cost_allocations';
END
ELSE
    PRINT 'Table already exists: workforce_cost_allocations';
GO

-- ============================================================
-- ON-CALL EPISODES
-- Tracks individual on-call response episodes
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'workforce_oncall_episodes')
BEGIN
    CREATE TABLE workforce_oncall_episodes (
        id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

        -- Parent reference
        workforce_day_id        UNIQUEIDENTIFIER NOT NULL,

        -- Episode timing
        start_time              DATETIME2 NOT NULL,
        end_time                DATETIME2,
        duration_minutes        INT,

        -- Classification
        episode_type            VARCHAR(50),           -- PHONE, IN_PERSON, etc.

        -- Related entities
        home_guid               UNIQUEIDENTIFIER,
        child_guids             NVARCHAR(MAX),         -- JSON array

        -- Notes
        description             NVARCHAR(MAX),
        resolution              NVARCHAR(MAX),

        -- Audit
        created_at              DATETIME2 DEFAULT GETUTCDATE(),
        updated_at              DATETIME2 DEFAULT GETUTCDATE(),

        CONSTRAINT fk_oncall_day FOREIGN KEY (workforce_day_id)
            REFERENCES workforce_days(id)
    );

    CREATE INDEX ix_workforce_oncall_day ON workforce_oncall_episodes(workforce_day_id);

    PRINT 'Created table: workforce_oncall_episodes';
END
ELSE
    PRINT 'Table already exists: workforce_oncall_episodes';
GO

-- ============================================================
-- SMS PROMPTS LOG
-- Tracks SMS prompts sent to staff
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'workforce_sms_prompts')
BEGIN
    CREATE TABLE workforce_sms_prompts (
        id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

        -- Staff reference
        staff_user_id           VARCHAR(100) NOT NULL,
        phone_number            VARCHAR(20) NOT NULL,

        -- Prompt details
        prompt_type             VARCHAR(50) NOT NULL,
        -- Values: DAY_START, DAY_END, REMINDER, COMPLETION_REQUIRED

        -- Twilio tracking
        twilio_message_sid      VARCHAR(50),

        -- Status
        sent_at                 DATETIME2 DEFAULT GETUTCDATE(),
        delivered_at            DATETIME2,
        response_received_at    DATETIME2,
        response_text           NVARCHAR(500),

        -- Metadata
        metadata                NVARCHAR(MAX)          -- JSON
    );

    CREATE INDEX ix_workforce_sms_staff ON workforce_sms_prompts(staff_user_id);
    CREATE INDEX ix_workforce_sms_sent ON workforce_sms_prompts(sent_at);

    PRINT 'Created table: workforce_sms_prompts';
END
ELSE
    PRINT 'Table already exists: workforce_sms_prompts';
GO

-- ============================================================
-- SUMMARY
-- ============================================================
PRINT '';
PRINT '========================================';
PRINT 'Workforce Tables Creation Complete';
PRINT '========================================';
PRINT 'Tables created:';
PRINT '  - workforce_activity_types';
PRINT '  - workforce_concerning_types';
PRINT '  - workforce_days';
PRINT '  - workforce_time_blocks';
PRINT '  - workforce_cost_allocations';
PRINT '  - workforce_oncall_episodes';
PRINT '  - workforce_sms_prompts';
PRINT '';
PRINT 'Next step: Run seed-workforce-data.sql to populate reference data';
PRINT '========================================';
GO
