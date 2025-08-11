-- Create communication_logs table for tracking all SMS and email communications
-- This table stores detailed logs of all sent messages with delivery tracking

-- First, check if the table already exists and drop it if needed (for development)
IF OBJECT_ID('communication_logs', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing communication_logs table...'
    DROP TABLE communication_logs
END

PRINT 'Creating communication_logs table...'

CREATE TABLE communication_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    microservice_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NULL,
    communication_type NVARCHAR(50) NOT NULL, -- 'appointment_reminder', 'invitation', etc.
    delivery_method NVARCHAR(20) NOT NULL, -- 'email', 'sms', 'both'
    
    -- Recipient info
    recipient_email NVARCHAR(255) NULL,
    recipient_phone NVARCHAR(20) NULL,
    recipient_name NVARCHAR(255) NULL,
    
    -- Sender info
    sender_email NVARCHAR(255) NULL,
    sender_phone NVARCHAR(20) NULL,
    sender_name NVARCHAR(255) NULL,
    
    -- Content
    subject NVARCHAR(500) NULL, -- For email
    message_text NTEXT NOT NULL,
    message_html NTEXT NULL, -- For email
    
    -- Template info
    template_used NVARCHAR(100) NULL,
    template_variables NTEXT NULL, -- JSON
    
    -- Provider tracking
    sendgrid_message_id NVARCHAR(255) NULL,
    twilio_message_sid NVARCHAR(255) NULL,
    
    -- Status tracking
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message NTEXT NULL,
    
    -- Timing
    scheduled_for DATETIME2 NULL,
    sent_at DATETIME2 NULL,
    delivered_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT FK_communication_logs_microservice FOREIGN KEY (microservice_id) REFERENCES microservice_apps(id),
    CONSTRAINT FK_communication_logs_user FOREIGN KEY (user_id) REFERENCES app_users(id)
)

-- Create indexes for better query performance
CREATE INDEX IX_communication_logs_created_at ON communication_logs(created_at DESC)
CREATE INDEX IX_communication_logs_recipient_email ON communication_logs(recipient_email)
CREATE INDEX IX_communication_logs_recipient_phone ON communication_logs(recipient_phone)
CREATE INDEX IX_communication_logs_status ON communication_logs(status)
CREATE INDEX IX_communication_logs_communication_type ON communication_logs(communication_type)
CREATE INDEX IX_communication_logs_delivery_method ON communication_logs(delivery_method)

PRINT 'Communication logs table created successfully with indexes!'
