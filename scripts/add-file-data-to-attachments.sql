-- Add file_data column to visit_form_attachments table for storing base64 file data
-- This is needed for Vercel serverless environment where filesystem is read-only

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.visit_form_attachments') 
    AND name = 'file_data'
)
BEGIN
    ALTER TABLE [dbo].[visit_form_attachments]
    ADD [file_data] [nvarchar](max) NULL
    
    PRINT 'Added file_data column to visit_form_attachments table'
END
ELSE
BEGIN
    PRINT 'file_data column already exists in visit_form_attachments table'
END
GO

