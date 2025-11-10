-- Add description column to signature_tokens table if it doesn't exist
-- This allows adding context/description to signature requests

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.signature_tokens') 
    AND name = 'description'
)
BEGIN
    ALTER TABLE [dbo].[signature_tokens]
    ADD [description] [nvarchar](500) NULL;
    
    PRINT 'Added description column to signature_tokens table';
END
ELSE
BEGIN
    PRINT 'Description column already exists in signature_tokens table';
END
GO

