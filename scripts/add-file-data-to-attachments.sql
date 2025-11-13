-- Add file_data column to visit_form_attachments table
-- This column stores the base64-encoded file data for attachments
-- Run this script on the Bifrost database

USE [Bifrost]
GO

-- Check if column already exists
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.visit_form_attachments') 
    AND name = 'file_data'
)
BEGIN
    ALTER TABLE dbo.visit_form_attachments
    ADD file_data nvarchar(max) NULL
    
    PRINT 'file_data column added successfully'
END
ELSE
BEGIN
    PRINT 'file_data column already exists'
END
GO

-- Add index for better query performance (optional)
-- Note: You can't create an index on nvarchar(max), but you can add a computed column if needed

