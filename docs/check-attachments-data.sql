-- SQL Queries to check if attachment data is being saved
-- Run these queries on the Bifrost database to verify data storage
-- NOTE: Run scripts/add-file-data-to-attachments.sql first to add missing columns

USE [Bifrost]
GO

-- 1. Check what columns exist in the table
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME = 'visit_form_attachments'
ORDER BY ORDINAL_POSITION
GO

-- 2. List all attachments with metadata (works before migration)
-- This version works even if file_data and is_deleted columns don't exist yet
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
    -- Show first 50 chars of file_path to see what's stored there
    LEFT(file_path, 50) AS file_path_preview
FROM dbo.visit_form_attachments
ORDER BY created_at DESC
GO

-- 3. Check attachments for a specific visit form (replace with actual visit_form_id)
-- Example: SELECT * FROM dbo.visit_form_attachments WHERE visit_form_id = 'YOUR-VISIT-FORM-ID-HERE'

-- 4. Count attachments by type (works before migration)
SELECT 
    attachment_type,
    COUNT(*) AS count,
    SUM(file_size) AS total_size_bytes
FROM dbo.visit_form_attachments
GROUP BY attachment_type
GO

-- 5. Check recent uploads (last 24 hours) - works before migration
SELECT 
    attachment_id,
    file_name,
    mime_type,
    attachment_type,
    file_size,
    created_at,
    LEFT(file_path, 50) AS file_path_preview
FROM dbo.visit_form_attachments
WHERE created_at >= DATEADD(hour, -24, GETUTCDATE())
ORDER BY created_at DESC
GO

-- ============================================
-- QUERIES BELOW REQUIRE MIGRATION TO BE RUN FIRST
-- Run scripts/add-file-data-to-attachments.sql first
-- ============================================

-- 6. Check if file_data column exists (after migration)
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

-- 7. List attachments with file_data status (after migration)
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
    -- Show first 50 chars of file_path
    LEFT(file_path, 50) AS file_path_preview
FROM dbo.visit_form_attachments
WHERE is_deleted = 0 OR is_deleted IS NULL
ORDER BY created_at DESC
GO

-- 8. Count attachments by type with file_data status (after migration)
SELECT 
    attachment_type,
    COUNT(*) AS count,
    SUM(file_size) AS total_size_bytes,
    COUNT(CASE WHEN file_data IS NOT NULL THEN 1 END) AS with_file_data,
    COUNT(CASE WHEN file_data IS NULL THEN 1 END) AS without_file_data
FROM dbo.visit_form_attachments
WHERE is_deleted = 0 OR is_deleted IS NULL
GROUP BY attachment_type
GO

