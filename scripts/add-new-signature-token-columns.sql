-- Add optional columns to signature_tokens table for enhanced signature functionality
-- Based on actual database schema as of 11/10/2025
-- Note: signer_role and phone_number already exist in the schema

-- Add signer_type column (alias for signature_type, for consistency)
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'signer_type'
)
BEGIN
    ALTER TABLE [dbo].[signature_tokens]
    ADD [signer_type] [nvarchar](50) NULL;
    
    PRINT 'Added signer_type column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'signer_type column already exists in signature_tokens table';
END
GO

-- Copy data from signature_type to signer_type for existing records (only if column exists)
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'signer_type'
)
BEGIN
    UPDATE [dbo].[signature_tokens]
    SET [signer_type] = [signature_type]
    WHERE [signer_type] IS NULL;
    
    PRINT 'Copied data from signature_type to signer_type';
END
GO

-- Add email_address column (alias for recipient_email, for consistency)
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'email_address'
)
BEGIN
    ALTER TABLE [dbo].[signature_tokens]
    ADD [email_address] [nvarchar](255) NULL;
    
    PRINT 'Added email_address column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'email_address column already exists in signature_tokens table';
END
GO

-- Copy data from recipient_email to email_address for existing records (only if column exists)
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'email_address'
)
BEGIN
    UPDATE [dbo].[signature_tokens]
    SET [email_address] = [recipient_email]
    WHERE [email_address] IS NULL;
    
    PRINT 'Copied data from recipient_email to email_address';
END
GO

-- Add is_used column (computed from used_at for easier querying)
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'is_used'
)
BEGIN
    ALTER TABLE [dbo].[signature_tokens]
    ADD [is_used] [bit] NOT NULL DEFAULT 0;
    
    PRINT 'Added is_used column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'is_used column already exists in signature_tokens table';
END
GO

-- Set is_used based on used_at for existing records (only if column exists)
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'is_used'
)
BEGIN
    UPDATE [dbo].[signature_tokens]
    SET [is_used] = CASE WHEN [used_at] IS NOT NULL THEN 1 ELSE 0 END;
    
    PRINT 'Set is_used values based on used_at';
END
GO

-- Add updated_at column
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'updated_at'
)
BEGIN
    ALTER TABLE [dbo].[signature_tokens]
    ADD [updated_at] [datetime2](7) NULL;
    
    PRINT 'Added updated_at column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'updated_at column already exists in signature_tokens table';
END
GO

-- Set updated_at to created_at for existing records (only if column exists)
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'updated_at'
)
BEGIN
    UPDATE [dbo].[signature_tokens]
    SET [updated_at] = [created_at]
    WHERE [updated_at] IS NULL;
    
    PRINT 'Set updated_at values based on created_at';
END
GO

PRINT 'Migration completed successfully!';
PRINT 'Note: signer_role and phone_number already exist in the schema';
PRINT 'Note: visit_form_id and appointment_id are already nullable';
GO

