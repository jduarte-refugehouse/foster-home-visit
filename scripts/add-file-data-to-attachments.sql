-- Add missing columns to visit_form_attachments table
-- This script adds:
-- 1. file_data column - stores the base64-encoded file data for attachments
-- 2. is_deleted column - soft delete flag (used by API code)
-- Run this script on the Bifrost database

USE [Bifrost]
GO

-- Add file_data column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.visit_form_attachments') 
    AND name = 'file_data'
)
BEGIN
    ALTER TABLE dbo.visit_form_attachments
    ADD file_data nvarchar(max) NULL
    
    PRINT '✅ file_data column added successfully'
END
ELSE
BEGIN
    PRINT 'ℹ️ file_data column already exists'
END
GO

-- Add is_deleted column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.visit_form_attachments') 
    AND name = 'is_deleted'
)
BEGIN
    ALTER TABLE dbo.visit_form_attachments
    ADD is_deleted bit NOT NULL DEFAULT 0
    
    PRINT '✅ is_deleted column added successfully'
END
ELSE
BEGIN
    PRINT 'ℹ️ is_deleted column already exists'
END
GO

-- Verify columns were added
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME = 'visit_form_attachments'
  AND COLUMN_NAME IN ('file_data', 'is_deleted')
ORDER BY COLUMN_NAME
GO

