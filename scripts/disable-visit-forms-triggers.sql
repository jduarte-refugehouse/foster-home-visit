-- Script to identify and disable triggers on visit_forms table that may be causing recursion
-- Run this to temporarily disable triggers and resolve the "nesting level exceeded" error

-- First, check what triggers exist on the visit_forms table
SELECT 
    t.name AS trigger_name,
    t.is_disabled,
    OBJECT_NAME(t.parent_id) AS table_name,
    t.create_date,
    t.modify_date
FROM sys.triggers t
WHERE OBJECT_NAME(t.parent_id) = 'visit_forms'
ORDER BY t.name;

-- Check for any UPDATE triggers that might be causing recursion
SELECT 
    t.name AS trigger_name,
    m.definition AS trigger_definition
FROM sys.triggers t
INNER JOIN sys.sql_modules m ON t.object_id = m.object_id
WHERE OBJECT_NAME(t.parent_id) = 'visit_forms'
    AND t.is_disabled = 0;

-- Disable all triggers on visit_forms table temporarily
-- (Uncomment the lines below to actually disable triggers)

/*
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'DISABLE TRIGGER ' + QUOTENAME(t.name) + ' ON ' + QUOTENAME(OBJECT_NAME(t.parent_id)) + ';' + CHAR(13)
FROM sys.triggers t
WHERE OBJECT_NAME(t.parent_id) = 'visit_forms'
    AND t.is_disabled = 0;

PRINT 'Disabling triggers:';
PRINT @sql;
EXEC sp_executesql @sql;
*/

-- To re-enable triggers later, use this:
/*
DECLARE @sql_enable NVARCHAR(MAX) = '';
SELECT @sql_enable = @sql_enable + 'ENABLE TRIGGER ' + QUOTENAME(t.name) + ' ON ' + QUOTENAME(OBJECT_NAME(t.parent_id)) + ';' + CHAR(13)
FROM sys.triggers t
WHERE OBJECT_NAME(t.parent_id) = 'visit_forms';

PRINT 'Re-enabling triggers:';
PRINT @sql_enable;
EXEC sp_executesql @sql_enable;
*/
