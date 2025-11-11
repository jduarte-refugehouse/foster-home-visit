-- ============================================
-- Test SQL for EntityCommunicationBridge Lookup
-- ============================================
-- This script helps troubleshoot why signature contact lookup isn't working
-- Replace the placeholder values with actual values from your form

-- STEP 1: Find the Foster Home GUID from SyncActiveHomes
-- This should match formData.fosterHome?.homeId
-- Replace 'YOUR_HOME_NAME' or 'YOUR_HOME_XREF' with actual values
-- ============================================
PRINT '=== STEP 1: Find Foster Home GUID ==='
SELECT 
    h.Guid AS FosterHomeGuid,
    h.HomeName,
    h.Xref,
    h.Unit
FROM dbo.SyncActiveHomes h
WHERE 
    -- Replace with actual home name or Xref
    h.HomeName LIKE '%YOUR_HOME_NAME%'
    -- OR h.Xref = YOUR_XREF_NUMBER
ORDER BY h.HomeName

-- STEP 2: Find Foster Parents (Providers) from SyncCurrentFosterFacility
-- This should match the providers array in the form
-- Replace 'YOUR_FOSTER_HOME_GUID' with the Guid from Step 1
-- ============================================
PRINT '=== STEP 2: Find Foster Parents (Providers) ==='
SELECT 
    ff.PersonGUID AS ProviderPersonGUID,
    ff.[Relation Name] AS ProviderName,
    ff.Relationship,
    ff.FosterHomeGuid,
    h.HomeName,
    h.Guid AS HomeGuid
FROM dbo.SyncCurrentFosterFacility ff
INNER JOIN dbo.SyncActiveHomes h ON ff.FosterHomeGuid = h.Guid
WHERE 
    -- Replace with the Guid from Step 1
    ff.FosterHomeGuid = 'YOUR_FOSTER_HOME_GUID'
    AND ff.Relationship IN ('Provider', 'Primary Caregiver')
ORDER BY ff.[Relation Name]

-- STEP 3: Check EntityCommunicationBridge by EntityGUID (PRIMARY MATCH)
-- This is the PRIMARY and most reliable match since EntityGUID is enforced
-- Replace 'YOUR_PERSON_GUID' with the PersonGUID from Step 2
-- ============================================
PRINT '=== STEP 3: Check EntityCommunicationBridge by EntityGUID (PRIMARY MATCH) ==='
PRINT 'NOTE: EntityGUID is the PRIMARY match (enforced field)'
SELECT 
    ecb.CommunicationID,
    ecb.EntityGUID,
    ecb.EntityFullName,
    ecb.FosterFacilityGUID,
    ecb.FosterHomeName,
    ecb.RelationshipType,
    ecb.PrimaryMobilePhone,
    ecb.PrimaryMobilePhoneE164,
    ecb.EmailAddress,
    ecb.IsActive,
    ff.PersonGUID AS SyncCurrentFosterFacility_PersonGUID,
    ff.[Relation Name] AS SyncCurrentFosterFacility_Name,
    CASE 
        WHEN ecb.EntityGUID = ff.PersonGUID THEN 'MATCH'
        ELSE 'NO MATCH'
    END AS EntityGUIDMatch
FROM dbo.EntityCommunicationBridge ecb
LEFT JOIN dbo.SyncCurrentFosterFacility ff ON ecb.EntityGUID = ff.PersonGUID
WHERE 
    -- Replace with the PersonGUID from Step 2
    ecb.EntityGUID = 'YOUR_PERSON_GUID'
    AND ecb.IsActive = 1
ORDER BY ecb.EntityFullName

-- STEP 4: Check EntityCommunicationBridge with FosterFacilityGUID as secondary filter
-- This shows how FosterFacilityGUID can be used as an additional filter (but it's NOT enforced)
-- Replace 'YOUR_PERSON_GUID' with the PersonGUID from Step 2
-- Replace 'YOUR_FOSTER_HOME_GUID' with the Guid from Step 1 (optional - can be NULL)
-- ============================================
PRINT '=== STEP 4: Check EntityCommunicationBridge with FosterFacilityGUID filter (SECONDARY) ==='
PRINT 'NOTE: FosterFacilityGUID is NOT enforced, so it''s only used as a secondary filter'
SELECT 
    ecb.CommunicationID,
    ecb.EntityGUID,
    ecb.EntityFullName,
    ecb.FosterFacilityGUID,
    ecb.FosterHomeName,
    ecb.RelationshipType,
    ecb.PrimaryMobilePhone,
    ecb.PrimaryMobilePhoneE164,
    ecb.EmailAddress,
    ecb.IsActive,
    h.Guid AS SyncActiveHomes_Guid,
    h.HomeName AS SyncActiveHomes_HomeName,
    CASE 
        WHEN ecb.FosterFacilityGUID = h.Guid THEN 'MATCH'
        WHEN ecb.FosterFacilityGUID IS NULL THEN 'NULL (not enforced)'
        ELSE 'NO MATCH'
    END AS FosterFacilityGUIDMatch
FROM dbo.EntityCommunicationBridge ecb
LEFT JOIN dbo.SyncActiveHomes h ON ecb.FosterFacilityGUID = h.Guid
WHERE 
    -- Replace with the PersonGUID from Step 2 (PRIMARY match)
    ecb.EntityGUID = 'YOUR_PERSON_GUID'
    AND ecb.IsActive = 1
    -- Replace with the Guid from Step 1 (SECONDARY filter - optional)
    AND (ecb.FosterFacilityGUID IS NULL OR ecb.FosterFacilityGUID = 'YOUR_FOSTER_HOME_GUID')
ORDER BY ecb.EntityFullName

-- STEP 5: Combined lookup (what the API should find - CORRECTED)
-- This is the exact query the API uses (PRIMARY match by EntityGUID)
-- Replace 'YOUR_PERSON_GUID' with the PersonGUID from Step 2 (REQUIRED)
-- Replace 'YOUR_FOSTER_HOME_GUID' with the Guid from Step 1 (OPTIONAL - secondary filter)
-- ============================================
PRINT '=== STEP 5: Combined Lookup (API Query - CORRECTED) ==='
PRINT 'NOTE: EntityGUID is PRIMARY (required), FosterFacilityGUID is SECONDARY (optional)'
DECLARE @EntityGUID uniqueidentifier = 'YOUR_PERSON_GUID'  -- Replace with actual GUID (REQUIRED)
DECLARE @FosterFacilityGUID uniqueidentifier = 'YOUR_FOSTER_HOME_GUID'  -- Replace with actual GUID (OPTIONAL - can be NULL)

SELECT TOP 1
    ecb.EntityGUID,
    ecb.EntityFullName,
    ecb.PrimaryMobilePhone,
    ecb.PrimaryMobilePhoneE164,
    ecb.EmailAddress,
    ecb.FosterFacilityGUID,
    ecb.IsActive
FROM dbo.EntityCommunicationBridge ecb
WHERE ecb.IsActive = 1
    -- PRIMARY MATCH: EntityGUID (enforced field)
    AND ecb.EntityGUID = CAST(@EntityGUID AS uniqueidentifier)
    -- SECONDARY FILTER: FosterFacilityGUID (not enforced, so optional)
    AND (@FosterFacilityGUID IS NULL OR ecb.FosterFacilityGUID IS NULL OR ecb.FosterFacilityGUID = CAST(@FosterFacilityGUID AS uniqueidentifier))
ORDER BY ecb.EntityFullName

-- STEP 6: Verify GUID types match
-- This checks if the GUIDs are the correct type and format
-- ============================================
PRINT '=== STEP 6: Verify GUID Types ==='
SELECT 
    'SyncActiveHomes.Guid' AS TableColumn,
    h.Guid,
    SQL_VARIANT_PROPERTY(h.Guid, 'BaseType') AS BaseType,
    SQL_VARIANT_PROPERTY(h.Guid, 'Precision') AS Precision
FROM dbo.SyncActiveHomes h
WHERE h.Guid = 'YOUR_FOSTER_HOME_GUID'  -- Replace with actual GUID
UNION ALL
SELECT 
    'EntityCommunicationBridge.FosterFacilityGUID' AS TableColumn,
    ecb.FosterFacilityGUID,
    SQL_VARIANT_PROPERTY(ecb.FosterFacilityGUID, 'BaseType') AS BaseType,
    SQL_VARIANT_PROPERTY(ecb.FosterFacilityGUID, 'Precision') AS Precision
FROM dbo.EntityCommunicationBridge ecb
WHERE ecb.FosterFacilityGUID = 'YOUR_FOSTER_HOME_GUID'  -- Replace with actual GUID
UNION ALL
SELECT 
    'SyncCurrentFosterFacility.PersonGUID' AS TableColumn,
    ff.PersonGUID,
    SQL_VARIANT_PROPERTY(ff.PersonGUID, 'BaseType') AS BaseType,
    SQL_VARIANT_PROPERTY(ff.PersonGUID, 'Precision') AS Precision
FROM dbo.SyncCurrentFosterFacility ff
WHERE ff.PersonGUID = 'YOUR_PERSON_GUID'  -- Replace with actual GUID
UNION ALL
SELECT 
    'EntityCommunicationBridge.EntityGUID' AS TableColumn,
    ecb.EntityGUID,
    SQL_VARIANT_PROPERTY(ecb.EntityGUID, 'BaseType') AS BaseType,
    SQL_VARIANT_PROPERTY(ecb.EntityGUID, 'Precision') AS Precision
FROM dbo.EntityCommunicationBridge ecb
WHERE ecb.EntityGUID = 'YOUR_PERSON_GUID'  -- Replace with actual GUID

-- STEP 7: Find all active EntityCommunicationBridge records for a home
-- This shows all possible matches even if GUIDs don't match exactly
-- ============================================
PRINT '=== STEP 7: All Active Records for Home (by name match) ==='
SELECT 
    ecb.*,
    h.Guid AS SyncActiveHomes_Guid,
    h.HomeName AS SyncActiveHomes_HomeName,
    CASE 
        WHEN ecb.FosterFacilityGUID = h.Guid THEN 'MATCH'
        ELSE 'NO MATCH'
    END AS GuidMatch
FROM dbo.EntityCommunicationBridge ecb
LEFT JOIN dbo.SyncActiveHomes h ON ecb.FosterHomeName = h.HomeName
WHERE 
    -- Replace with actual home name
    ecb.FosterHomeName LIKE '%YOUR_HOME_NAME%'
    AND ecb.IsActive = 1
ORDER BY ecb.EntityFullName

