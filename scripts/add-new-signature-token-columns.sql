-- Add new columns to signature_tokens table for enhanced signature functionality
-- These columns support the new public signature route system

-- Add signer_role column (for role-based signature tracking)
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'signer_role'
)
BEGIN
    ALTER TABLE [dbo].[signature_tokens]
    ADD [signer_role] [nvarchar](100) NULL;
    
    PRINT 'Added signer_role column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'signer_role column already exists in signature_tokens table';
END
GO

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
    
    -- Copy data from signature_type to signer_type for existing records
    UPDATE [dbo].[signature_tokens]
    SET [signer_type] = [signature_type]
    WHERE [signer_type] IS NULL;
    
    PRINT 'Added signer_type column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'signer_type column already exists in signature_tokens table';
END
GO

-- Add phone_number column
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'phone_number'
)
BEGIN
    ALTER TABLE [dbo].[signature_tokens]
    ADD [phone_number] [nvarchar](20) NULL;
    
    PRINT 'Added phone_number column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'phone_number column already exists in signature_tokens table';
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
    
    -- Copy data from recipient_email to email_address for existing records
    UPDATE [dbo].[signature_tokens]
    SET [email_address] = [recipient_email]
    WHERE [email_address] IS NULL;
    
    PRINT 'Added email_address column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'email_address column already exists in signature_tokens table';
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
    
    -- Set is_used based on used_at for existing records
    UPDATE [dbo].[signature_tokens]
    SET [is_used] = CASE WHEN [used_at] IS NOT NULL THEN 1 ELSE 0 END;
    
    PRINT 'Added is_used column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'is_used column already exists in signature_tokens table';
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
    
    -- Set updated_at to created_at for existing records
    UPDATE [dbo].[signature_tokens]
    SET [updated_at] = [created_at]
    WHERE [updated_at] IS NULL;
    
    PRINT 'Added updated_at column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'updated_at column already exists in signature_tokens table';
END
GO

-- Make visit_form_id nullable (for standalone test signatures)
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'visit_form_id'
    AND is_nullable = 0
)
BEGIN
    ALTER TABLE [dbo].[signature_tokens]
    ALTER COLUMN [visit_form_id] [uniqueidentifier] NULL;
    
    PRINT 'Made visit_form_id nullable in signature_tokens table';
END
ELSE
BEGIN
    PRINT 'visit_form_id is already nullable in signature_tokens table';
END
GO

-- Make appointment_id nullable (for standalone test signatures)
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'appointment_id'
    AND is_nullable = 0
)
BEGIN
    ALTER TABLE [dbo].[signature_tokens]
    ALTER COLUMN [appointment_id] [uniqueidentifier] NULL;
    
    PRINT 'Made appointment_id nullable in signature_tokens table';
END
ELSE
BEGIN
    PRINT 'appointment_id is already nullable in signature_tokens table';
END
GO

PRINT 'Migration completed successfully!';
GO

