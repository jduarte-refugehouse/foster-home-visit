CREATE TABLE communication_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    microservice_id UNIQUEIDENTIFIER NOT NULL,
    communication_type NVARCHAR(50) NOT NULL,
    delivery_method NVARCHAR(20) NOT NULL,
    recipient_email NVARCHAR(255),
    recipient_phone NVARCHAR(20),
    recipient_name NVARCHAR(255),
    sender_name NVARCHAR(255),
    sender_email NVARCHAR(255),
    subject NVARCHAR(500),
    message_content NTEXT,
    template_id UNIQUEIDENTIFIER,
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    provider_message_id NVARCHAR(255),
    error_message NTEXT,
    sent_at DATETIME2,
    delivered_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Add missing columns if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'sender_name')
BEGIN
    ALTER TABLE communication_logs ADD sender_name NVARCHAR(255);
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'sender_email')
BEGIN
    ALTER TABLE communication_logs ADD sender_email NVARCHAR(255);
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'subject')
BEGIN
    ALTER TABLE communication_logs ADD subject NVARCHAR(500);
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'template_id')
BEGIN
    ALTER TABLE communication_logs ADD template_id UNIQUEIDENTIFIER;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'provider_message_id')
BEGIN
    ALTER TABLE communication_logs ADD provider_message_id NVARCHAR(255);
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'error_message')
BEGIN
    ALTER TABLE communication_logs ADD error_message NTEXT;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'delivered_at')
BEGIN
    ALTER TABLE communication_logs ADD delivered_at DATETIME2;
END
