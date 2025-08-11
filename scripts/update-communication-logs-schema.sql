-- Add missing columns if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'user_id')
BEGIN
    ALTER TABLE communication_logs ADD user_id UNIQUEIDENTIFIER;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'sender_name')
BEGIN
    ALTER TABLE communication_logs ADD sender_name NVARCHAR(255);
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'sender_email')
BEGIN
    ALTER TABLE communication_logs ADD sender_email NVARCHAR(255);
END

-- Adding sender_phone column that was missing
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'sender_phone')
BEGIN
    ALTER TABLE communication_logs ADD sender_phone NVARCHAR(20);
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'subject')
BEGIN
    ALTER TABLE communication_logs ADD subject NVARCHAR(500);
END

-- Adding message_text column (service expects this name, not message_content)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'message_text')
BEGIN
    ALTER TABLE communication_logs ADD message_text NTEXT;
END

-- Adding message_html column for email HTML content
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'message_html')
BEGIN
    ALTER TABLE communication_logs ADD message_html NTEXT;
END

-- Adding template_used column (service expects string template name, not ID)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'template_used')
BEGIN
    ALTER TABLE communication_logs ADD template_used NVARCHAR(255);
END

-- Adding template_variables column for JSON template data
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'template_variables')
BEGIN
    ALTER TABLE communication_logs ADD template_variables NTEXT;
END

-- Adding provider-specific message ID columns
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'sendgrid_message_id')
BEGIN
    ALTER TABLE communication_logs ADD sendgrid_message_id NVARCHAR(255);
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'twilio_message_sid')
BEGIN
    ALTER TABLE communication_logs ADD twilio_message_sid NVARCHAR(255);
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'error_message')
BEGIN
    ALTER TABLE communication_logs ADD error_message NTEXT;
END

-- Adding scheduled_for column for future message scheduling
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'scheduled_for')
BEGIN
    ALTER TABLE communication_logs ADD scheduled_for DATETIME2;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'communication_logs' AND COLUMN_NAME = 'delivered_at')
BEGIN
    ALTER TABLE communication_logs ADD delivered_at DATETIME2;
END
