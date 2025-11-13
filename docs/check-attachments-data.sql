-- SQL Queries to check if attachment data is being saved
-- Run these queries on the Bifrost database to verify data storage

USE [Bifrost]
GO

-- 1. Check if file_data column exists
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME = 'visit_form_attachments'
  AND COLUMN_NAME = 'file_data'
GO

-- 2. List all attachments with metadata (without file_data to avoid huge results)
SELECT 
    attachment_id,
    visit_form_id,
    file_name,
    file_size,
    mime_type,
    attachment_type,
    description,
    created_at,
    created_by_name,
    -- Check if file_data exists and its length
    CASE 
        WHEN file_data IS NULL THEN 'NULL'
        ELSE CONCAT('EXISTS (', LEN(file_data), ' chars)')
    END AS file_data_status,
    -- Show first 50 chars of file_path to see what's stored there
    LEFT(file_path, 50) AS file_path_preview
FROM dbo.visit_form_attachments
WHERE is_deleted = 0
ORDER BY created_at DESC
GO

-- 3. Check attachments for a specific visit form (replace with actual visit_form_id)
-- Example: SELECT * FROM dbo.visit_form_attachments WHERE visit_form_id = 'YOUR-VISIT-FORM-ID-HERE'

-- 4. Count attachments by type
SELECT 
    attachment_type,
    COUNT(*) AS count,
    SUM(file_size) AS total_size_bytes,
    COUNT(CASE WHEN file_data IS NOT NULL THEN 1 END) AS with_file_data,
    COUNT(CASE WHEN file_data IS NULL THEN 1 END) AS without_file_data
FROM dbo.visit_form_attachments
WHERE is_deleted = 0
GROUP BY attachment_type
GO

-- 5. Check recent uploads (last 24 hours)
SELECT 
    attachment_id,
    file_name,
    mime_type,
    attachment_type,
    file_size,
    created_at,
    CASE 
        WHEN file_data IS NULL THEN 'NO DATA'
        ELSE CONCAT('HAS DATA (', LEN(file_data), ' chars)')
    END AS data_status
FROM dbo.visit_form_attachments
WHERE is_deleted = 0
  AND created_at >= DATEADD(hour, -24, GETUTCDATE())
ORDER BY created_at DESC
GO

