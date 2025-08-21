-- Check for triggers on visit_forms table that might cause recursion
SELECT 
    t.name AS trigger_name,
    t.type_desc AS trigger_type,
    OBJECT_NAME(t.parent_id) AS table_name,
    m.definition AS trigger_definition
FROM sys.triggers t
INNER JOIN sys.sql_modules m ON t.object_id = m.object_id
WHERE OBJECT_NAME(t.parent_id) = 'visit_forms'
ORDER BY t.name;

-- Check for any stored procedures that might be called by triggers
SELECT 
    p.name AS procedure_name,
    m.definition AS procedure_definition
FROM sys.procedures p
INNER JOIN sys.sql_modules m ON p.object_id = m.object_id
WHERE m.definition LIKE '%visit_forms%'
ORDER BY p.name;

-- Check for any functions that might be involved
SELECT 
    f.name AS function_name,
    m.definition AS function_definition
FROM sys.objects f
INNER JOIN sys.sql_modules m ON f.object_id = m.object_id
WHERE f.type IN ('FN', 'IF', 'TF') 
AND m.definition LIKE '%visit_forms%'
ORDER BY f.name;
