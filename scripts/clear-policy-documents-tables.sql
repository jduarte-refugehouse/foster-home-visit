-- Clear Policy Documents Tables
-- Use this to reset the document tracking tables before re-syncing

-- Delete in order to respect foreign key constraints
DELETE FROM [dbo].[policy_document_approvals]
DELETE FROM [dbo].[policy_document_versions]
DELETE FROM [dbo].[policy_documents]

GO

-- Verify tables are empty
SELECT 
    'policy_documents' AS table_name,
    COUNT(*) AS row_count
FROM [dbo].[policy_documents]
UNION ALL
SELECT 
    'policy_document_versions' AS table_name,
    COUNT(*) AS row_count
FROM [dbo].[policy_document_versions]
UNION ALL
SELECT 
    'policy_document_approvals' AS table_name,
    COUNT(*) AS row_count
FROM [dbo].[policy_document_approvals]

GO

