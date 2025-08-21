-- =============================================
-- RadiusBiFrost Database Schema
-- Complete schema for Foster Care Management System
-- Generated: 8/21/2025
-- =============================================

-- Database Configuration (Azure SQL Database)
-- Note: Database creation and configuration should be done through Azure portal
-- This script focuses on tables, views, procedures, and data

-- =============================================
-- 1. USER MANAGEMENT AND SECURITY
-- =============================================

-- Application Users Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'app_users')
BEGIN
    CREATE TABLE [dbo].[app_users](
        [id] [uniqueidentifier] NOT NULL DEFAULT (newid()),
        [clerk_user_id] [nvarchar](255) NOT NULL,
        [email] [nvarchar](255) NOT NULL,
        [first_name] [nvarchar](100) NULL,
        [last_name] [nvarchar](100) NULL,
        [is_active] [bit] NULL DEFAULT ((1)),
        [created_at] [datetime2](7) NULL DEFAULT (getdate()),
        [updated_at] [datetime2](7) NULL DEFAULT (getdate()),
        [radius_person_guid] [uniqueidentifier] NULL,
        [radius_foster_home_guid] [uniqueidentifier] NULL,
        [user_type] [nvarchar](50) NULL,
        PRIMARY KEY CLUSTERED ([id] ASC),
        UNIQUE NONCLUSTERED ([clerk_user_id] ASC)
    );
END

-- =============================================
-- 2. FOSTER HOME MANAGEMENT
-- =============================================

-- Active Foster Homes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncActiveHomes')
BEGIN
    CREATE TABLE [dbo].[SyncActiveHomes](
        [HomeName] [nvarchar](255) NULL,
        [Street] [nvarchar](500) NULL,
        [City] [nvarchar](100) NULL,
        [State] [nvarchar](50) NULL,
        [Zip] [nvarchar](20) NULL,
        [HomePhone] [nvarchar](50) NULL,
        [Xref] [int] NULL,
        [CaseManager] [nvarchar](255) NULL,
        [Unit] [varchar](3) NULL,
        [Guid] [uniqueidentifier] NULL,
        [CaseManagerEmail] [nvarchar](255) NULL,
        [CaseManagerPhone] [nvarchar](50) NULL,
        [CaregiverEmail] [nvarchar](255) NULL,
        [LastSync] [datetime] NULL,
        [Latitude] [decimal](9, 6) NULL,
        [Longitude] [decimal](9, 6) NULL
    );
END

-- Foster Facility Relationships
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncCurrentFosterFacility')
BEGIN
    CREATE TABLE [dbo].[SyncCurrentFosterFacility](
        [SyncID] [int] IDENTITY(1,1) NOT NULL,
        [FosterHomeGuid] [uniqueidentifier] NOT NULL,
        [Home] [nvarchar](255) NOT NULL,
        [facilityId] [int] NOT NULL,
        [County] [nvarchar](50) NULL,
        [Relation Name] [nvarchar](255) NULL,
        [Relationship] [nvarchar](100) NULL,
        [relationId] [int] NULL,
        [Current Age] [int] NULL,
        [PersonGUID] [uniqueidentifier] NULL,
        [unit] [varchar](3) NULL,
        [LastSync] [datetime] NULL DEFAULT (getdate()),
        PRIMARY KEY CLUSTERED ([SyncID] ASC)
    );
END

-- Children in Placement
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncChildrenInPlacement')
BEGIN
    CREATE TABLE [dbo].[SyncChildrenInPlacement](
        [ChildGUID] [int] NULL,
        [ChildMedicaid] [nvarchar](25) NULL,
        [ChildPersonID] [nvarchar](25) NULL,
        [FosterHomeGUID] [uniqueidentifier] NULL,
        [Unit] [varchar](3) NULL,
        [FirstName] [nvarchar](100) NULL,
        [LastName] [nvarchar](100) NULL,
        [DateOfBirth] [date] NULL,
        [Contract] [nvarchar](50) NULL,
        [ServicePackage] [nvarchar](100) NULL,
        [PlacementDate] [date] NULL,
        [Status] [nvarchar](50) NULL,
        [NextCourtDate] [date] NULL,
        [NextAnnualMedicalDue] [date] NULL,
        [NextSemiAnnualDentalDue] [date] NULL,
        [NextMedCheckDue] [date] NULL,
        [NextCANSDue] [date] NULL,
        [SafetyPlanJSON] [nvarchar](max) NULL,
        [SafetyPlanNextReview] [date] NULL,
        [HasActiveSafetyPlan] [bit] NULL DEFAULT ((0)),
        [LastSync] [datetime] NULL DEFAULT (getdate())
    );
END

-- =============================================
-- 3. APPOINTMENT SYSTEM
-- =============================================

-- Appointments Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'appointments')
BEGIN
    CREATE TABLE [dbo].[appointments](
        [appointment_id] [uniqueidentifier] NOT NULL DEFAULT (newid()),
        [title] [nvarchar](255) NOT NULL,
        [description] [nvarchar](max) NULL,
        [appointment_type] [nvarchar](50) NOT NULL DEFAULT ('home_visit'),
        [start_datetime] [datetime2](7) NOT NULL,
        [end_datetime] [datetime2](7) NOT NULL,
        [duration_minutes] AS (datediff(minute,[start_datetime],[end_datetime])) PERSISTED,
        [status] [nvarchar](20) NOT NULL DEFAULT ('scheduled'),
        [home_xref] [int] NULL,
        [location_address] [nvarchar](500) NULL,
        [location_notes] [nvarchar](max) NULL,
        [assigned_to_user_id] [nvarchar](255) NOT NULL,
        [assigned_to_name] [nvarchar](255) NOT NULL,
        [assigned_to_role] [nvarchar](100) NULL,
        [created_by_user_id] [nvarchar](255) NOT NULL,
        [created_by_name] [nvarchar](255) NOT NULL,
        [priority] [nvarchar](20) NULL DEFAULT ('normal'),
        [is_recurring] [bit] NULL DEFAULT ((0)),
        [recurring_pattern] [nvarchar](100) NULL,
        [parent_appointment_id] [uniqueidentifier] NULL,
        [preparation_notes] [nvarchar](max) NULL,
        [completion_notes] [nvarchar](max) NULL,
        [outcome] [nvarchar](50) NULL,
        [created_at] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        [updated_at] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        [updated_by_user_id] [nvarchar](255) NULL,
        [is_deleted] [bit] NULL DEFAULT ((0)),
        [deleted_at] [datetime2](7) NULL,
        [deleted_by_user_id] [nvarchar](255) NULL,
        PRIMARY KEY CLUSTERED ([appointment_id] ASC),
        CONSTRAINT [FK_appointments_parent] FOREIGN KEY([parent_appointment_id]) REFERENCES [dbo].[appointments] ([appointment_id]),
        CONSTRAINT [CK_appointments_end_after_start] CHECK (([end_datetime]>[start_datetime])),
        CONSTRAINT [CK_appointments_status] CHECK (([status]='rescheduled' OR [status]='in_progress' OR [status]='cancelled' OR [status]='completed' OR [status]='scheduled')),
        CONSTRAINT [CK_appointments_type] CHECK (([appointment_type]='other' OR [appointment_type]='training' OR [appointment_type]='court_hearing' OR [appointment_type]='follow_up' OR [appointment_type]='assessment' OR [appointment_type]='meeting' OR [appointment_type]='home_visit')),
        CONSTRAINT [CK_appointments_priority] CHECK (([priority]='urgent' OR [priority]='high' OR [priority]='normal' OR [priority]='low'))
    );
END

-- =============================================
-- 4. VISIT FORMS SYSTEM
-- =============================================

-- Visit Form Templates
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'visit_form_templates')
BEGIN
    CREATE TABLE [dbo].[visit_form_templates](
        [template_id] [uniqueidentifier] NOT NULL DEFAULT (newid()),
        [template_name] [nvarchar](100) NOT NULL,
        [template_type] [nvarchar](50) NOT NULL,
        [form_version] [nvarchar](20) NULL DEFAULT ('1.0'),
        [template_data] [nvarchar](max) NULL,
        [is_active] [bit] NULL DEFAULT ((1)),
        [created_at] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        [updated_at] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        PRIMARY KEY CLUSTERED ([template_id] ASC)
    );
END

-- Visit Types Lookup
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'visit_types')
BEGIN
    CREATE TABLE [dbo].[visit_types](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [type_name] [nvarchar](100) NOT NULL,
        [description] [nvarchar](255) NULL,
        [is_active] [bit] NULL DEFAULT ((1)),
        PRIMARY KEY CLUSTERED ([id] ASC)
    );
END

-- Visit Modes Lookup
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'visit_modes')
BEGIN
    CREATE TABLE [dbo].[visit_modes](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [mode_name] [nvarchar](100) NOT NULL,
        [description] [nvarchar](255) NULL,
        [is_active] [bit] NULL DEFAULT ((1)),
        PRIMARY KEY CLUSTERED ([id] ASC)
    );
END

-- Attendee Roles Lookup
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'attendee_roles')
BEGIN
    CREATE TABLE [dbo].[attendee_roles](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [role_name] [nvarchar](100) NOT NULL,
        [description] [nvarchar](255) NULL,
        [is_active] [bit] NULL DEFAULT ((1)),
        PRIMARY KEY CLUSTERED ([id] ASC)
    );
END

-- Main Visit Forms Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'visit_forms')
BEGIN
    CREATE TABLE [dbo].[visit_forms](
        [visit_form_id] [uniqueidentifier] NOT NULL DEFAULT (newid()),
        [appointment_id] [uniqueidentifier] NOT NULL,
        [form_type] [nvarchar](50) NOT NULL DEFAULT ('home_visit'),
        [form_version] [nvarchar](20) NULL DEFAULT ('1.0'),
        [status] [nvarchar](20) NOT NULL DEFAULT ('draft'),
        [visit_date] [date] NOT NULL,
        [visit_time] [time](7) NOT NULL,
        [visit_number] [int] NULL DEFAULT ((1)),
        [quarter] [nvarchar](5) NULL,
        [visit_variant] [int] NULL DEFAULT ((1)),
        [visit_info] [nvarchar](max) NULL,
        [family_info] [nvarchar](max) NULL,
        [attendees] [nvarchar](max) NULL,
        [observations] [nvarchar](max) NULL,
        [recommendations] [nvarchar](max) NULL,
        [signatures] [nvarchar](max) NULL,
        [home_environment] [nvarchar](max) NULL,
        [child_interviews] [nvarchar](max) NULL,
        [parent_interviews] [nvarchar](max) NULL,
        [compliance_review] [nvarchar](max) NULL,
        [last_auto_save] [datetime2](7) NULL,
        [auto_save_count] [int] NULL DEFAULT ((0)),
        [created_at] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        [updated_at] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        [created_by_user_id] [nvarchar](255) NOT NULL,
        [created_by_name] [nvarchar](255) NOT NULL,
        [updated_by_user_id] [nvarchar](255) NULL,
        [updated_by_name] [nvarchar](255) NULL,
        [is_deleted] [bit] NULL DEFAULT ((0)),
        [deleted_at] [datetime2](7) NULL,
        [deleted_by_user_id] [nvarchar](255) NULL,
        [deleted_by_name] [nvarchar](255) NULL,
        PRIMARY KEY CLUSTERED ([visit_form_id] ASC),
        CONSTRAINT [FK_visit_forms_appointment] FOREIGN KEY([appointment_id]) REFERENCES [dbo].[appointments] ([appointment_id])
    );
END

-- Visit Form Sections (for granular tracking)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'visit_form_sections')
BEGIN
    CREATE TABLE [dbo].[visit_form_sections](
        [section_id] [uniqueidentifier] NOT NULL DEFAULT (newid()),
        [visit_form_id] [uniqueidentifier] NOT NULL,
        [section_name] [nvarchar](100) NOT NULL,
        [section_data] [nvarchar](max) NULL,
        [section_order] [int] NULL DEFAULT ((0)),
        [is_completed] [bit] NULL DEFAULT ((0)),
        [completion_percentage] [decimal](5, 2) NULL DEFAULT ((0.00)),
        [created_at] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        [updated_at] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        PRIMARY KEY CLUSTERED ([section_id] ASC),
        CONSTRAINT [FK_visit_form_sections_form] FOREIGN KEY([visit_form_id]) REFERENCES [dbo].[visit_forms] ([visit_form_id]) ON DELETE CASCADE
    );
END

-- Visit Form Attachments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'visit_form_attachments')
BEGIN
    CREATE TABLE [dbo].[visit_form_attachments](
        [attachment_id] [uniqueidentifier] NOT NULL DEFAULT (newid()),
        [visit_form_id] [uniqueidentifier] NOT NULL,
        [file_name] [nvarchar](255) NOT NULL,
        [file_path] [nvarchar](500) NOT NULL,
        [file_size] [bigint] NULL,
        [mime_type] [nvarchar](100) NULL,
        [attachment_type] [nvarchar](50) NULL,
        [description] [nvarchar](500) NULL,
        [created_at] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        [created_by_user_id] [nvarchar](255) NOT NULL,
        [created_by_name] [nvarchar](255) NOT NULL,
        PRIMARY KEY CLUSTERED ([attachment_id] ASC),
        CONSTRAINT [FK_visit_form_attachments_form] FOREIGN KEY([visit_form_id]) REFERENCES [dbo].[visit_forms] ([visit_form_id]) ON DELETE CASCADE
    );
END

-- =============================================
-- 5. COMMUNICATION SYSTEM
-- =============================================

-- Communication Logs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'communication_logs')
BEGIN
    CREATE TABLE [dbo].[communication_logs](
        [id] [uniqueidentifier] NOT NULL DEFAULT (newid()),
        [source_application] [nvarchar](100) NOT NULL DEFAULT ('home-visit-app'),
        [source_feature] [nvarchar](100) NULL,
        [source_reference_id] [uniqueidentifier] NULL,
        [sent_by_user_id] [uniqueidentifier] NULL,
        [sent_by_user_name] [nvarchar](255) NULL,
        [sent_by_user_email] [nvarchar](255) NULL,
        [sent_by_role] [nvarchar](100) NULL,
        [communication_type] [nvarchar](50) NOT NULL,
        [delivery_method] [nvarchar](20) NOT NULL,
        [recipient_email] [nvarchar](255) NULL,
        [recipient_phone] [nvarchar](20) NULL,
        [recipient_name] [nvarchar](255) NULL,
        [email_sent_from] [nvarchar](255) NULL,
        [email_sent_from_name] [nvarchar](255) NULL,
        [sms_sent_from] [nvarchar](50) NULL,
        [subject] [nvarchar](500) NULL,
        [message_text] [ntext] NOT NULL,
        [message_html] [ntext] NULL,
        [template_used] [nvarchar](100) NULL,
        [template_variables] [ntext] NULL,
        [sendgrid_message_id] [nvarchar](255) NULL,
        [twilio_message_sid] [nvarchar](255) NULL,
        [status] [nvarchar](20) NOT NULL DEFAULT ('pending'),
        [error_message] [ntext] NULL,
        [scheduled_for] [datetime2](7) NULL,
        [sent_at] [datetime2](7) NULL,
        [delivered_at] [datetime2](7) NULL,
        [created_at] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [updated_at] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [sender_name] [nvarchar](255) NULL,
        [sender_email] [nvarchar](255) NULL,
        [template_id] [uniqueidentifier] NULL,
        [provider_message_id] [nvarchar](255) NULL,
        [user_id] [uniqueidentifier] NULL,
        [sender_phone] [nvarchar](20) NULL,
        PRIMARY KEY CLUSTERED ([id] ASC)
    );
END

-- =============================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================

-- Appointments indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_appointments_start_datetime')
    CREATE NONCLUSTERED INDEX [IX_appointments_start_datetime] ON [dbo].[appointments] ([start_datetime] ASC) WHERE ([is_deleted]=(0));

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_appointments_home_xref')
    CREATE NONCLUSTERED INDEX [IX_appointments_home_xref] ON [dbo].[appointments] ([home_xref] ASC) WHERE ([is_deleted]=(0));

-- Visit forms indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_visit_forms_appointment_id')
    CREATE NONCLUSTERED INDEX [IX_visit_forms_appointment_id] ON [dbo].[visit_forms] ([appointment_id] ASC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_visit_forms_status')
    CREATE NONCLUSTERED INDEX [IX_visit_forms_status] ON [dbo].[visit_forms] ([status] ASC) WHERE ([is_deleted]=(0));

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_visit_forms_visit_date')
    CREATE NONCLUSTERED INDEX [IX_visit_forms_visit_date] ON [dbo].[visit_forms] ([visit_date] ASC) WHERE ([is_deleted]=(0));

-- Communication logs indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_communication_logs_source')
    CREATE NONCLUSTERED INDEX [IX_communication_logs_source] ON [dbo].[communication_logs] ([source_application] ASC, [source_feature] ASC, [created_at] ASC);

-- =============================================
-- 7. POPULATE LOOKUP TABLES
-- =============================================

-- Visit Types
IF NOT EXISTS (SELECT * FROM visit_types WHERE type_name = 'Initial Visit')
BEGIN
    INSERT INTO visit_types (type_name, description) VALUES
    ('Initial Visit', 'First visit to assess placement'),
    ('Quarterly Visit', 'Regular quarterly check-in'),
    ('Follow-up Visit', 'Follow-up on specific issues'),
    ('Emergency Visit', 'Urgent visit due to concerns'),
    ('Annual Review', 'Annual comprehensive review'),
    ('Placement Review', 'Review for placement changes'),
    ('Court-Ordered Visit', 'Visit required by court order');
END

-- Visit Modes
IF NOT EXISTS (SELECT * FROM visit_modes WHERE mode_name = 'In-Person')
BEGIN
    INSERT INTO visit_modes (mode_name, description) VALUES
    ('In-Person', 'Face-to-face visit at the home'),
    ('Virtual', 'Video conference visit'),
    ('Hybrid', 'Combination of in-person and virtual'),
    ('Phone', 'Phone call only'),
    ('Unannounced', 'Surprise visit without prior notice');
END

-- Attendee Roles
IF NOT EXISTS (SELECT * FROM attendee_roles WHERE role_name = 'Foster Parent')
BEGIN
    INSERT INTO attendee_roles (role_name, description) VALUES
    ('Foster Parent', 'Primary caregiver'),
    ('Case Manager', 'Assigned case manager'),
    ('Liaison', 'Agency liaison'),
    ('Child', 'Child in placement'),
    ('Supervisor', 'Case manager supervisor'),
    ('Therapist', 'Child therapist'),
    ('Guardian ad Litem', 'Court-appointed advocate'),
    ('Other Family Member', 'Extended family member'),
    ('Service Provider', 'External service provider');
END

-- Form Templates
IF NOT EXISTS (SELECT * FROM visit_form_templates WHERE template_name = 'Standard Home Visit')
BEGIN
    INSERT INTO visit_form_templates (template_name, template_type, template_data) VALUES
    ('Standard Home Visit', 'home_visit', '{"sections":["visit_info","family_info","attendees","home_environment","child_interviews","parent_interviews","observations","compliance_review","recommendations","signatures"]}'),
    ('Quarterly Review', 'quarterly_review', '{"sections":["visit_info","family_info","attendees","quarterly_assessment","compliance_review","recommendations","signatures"]}'),
    ('Emergency Assessment', 'emergency', '{"sections":["visit_info","emergency_details","immediate_safety","recommendations","signatures"]}');
END

-- =============================================
-- 8. UPDATE TRIGGERS
-- =============================================

-- Update trigger for visit_forms
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_visit_forms_update')
BEGIN
    EXEC('
    CREATE TRIGGER tr_visit_forms_update
    ON visit_forms
    AFTER UPDATE
    AS
    BEGIN
        UPDATE visit_forms 
        SET updated_at = GETUTCDATE()
        FROM visit_forms vf
        INNER JOIN inserted i ON vf.visit_form_id = i.visit_form_id
    END
    ');
END

-- =============================================
-- 9. PERMISSIONS
-- =============================================

-- Grant permissions to v0_application_role
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'v0_application_role')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON visit_forms TO v0_application_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON visit_form_sections TO v0_application_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON visit_form_attachments TO v0_application_role;
    GRANT SELECT ON visit_form_templates TO v0_application_role;
    GRANT SELECT ON visit_types TO v0_application_role;
    GRANT SELECT ON visit_modes TO v0_application_role;
    GRANT SELECT ON attendee_roles TO v0_application_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO v0_application_role;
    GRANT SELECT ON SyncActiveHomes TO v0_application_role;
    GRANT SELECT ON SyncChildrenInPlacement TO v0_application_role;
    GRANT SELECT, INSERT ON communication_logs TO v0_application_role;
END

PRINT 'Database schema creation completed successfully!';
PRINT 'Tables created: visit_forms, visit_form_templates, visit_types, visit_modes, attendee_roles';
PRINT 'Indexes created for performance optimization';
PRINT 'Lookup data populated';
PRINT 'Permissions granted to application role';
