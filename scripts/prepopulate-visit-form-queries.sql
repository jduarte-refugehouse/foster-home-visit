-- =============================================
-- HOME VISIT FORM PRE-POPULATION QUERIES
-- =============================================
-- These queries are designed to pre-populate the enhanced home visit form
-- with current home composition data and carry forward appropriate data
-- from previous visits by the same liaison.
-- =============================================

-- PARAMETERS YOU'LL NEED TO TEST WITH:
-- Replace these with actual values from your database
DECLARE @HomeXref INT = 123456  -- Replace with actual home_xref from appointments table
DECLARE @CurrentUserClerkId NVARCHAR(255) = 'user_123abc' -- Replace with actual clerk_user_id
DECLARE @FosterHomeGUID UNIQUEIDENTIFIER -- Will be populated from HomeXref

-- =============================================
-- QUERY 1: GET HOME COMPOSITION (CURRENT STATE)
-- =============================================
-- This query retrieves:
-- - Foster home details (address, contact info, license info)
-- - Household members (foster parents and adults)
-- - Children currently in placement
-- - Active medications for children
-- =============================================

-- First, get the Foster Home GUID from the Xref
SELECT @FosterHomeGUID = Guid
FROM SyncActiveHomes
WHERE Xref = @HomeXref

PRINT 'Foster Home GUID: ' + CAST(@FosterHomeGUID AS NVARCHAR(50))

-- Home Basic Information
SELECT 
    'HOME_INFO' as DataType,
    h.Guid as home_guid,
    h.Xref as home_xref,
    h.HomeName as family_name,
    h.Street as address,
    h.City as city,
    h.State as state,
    h.Zip as zip,
    h.HomePhone as phone,
    h.CaregiverEmail as email,
    h.CaseManager as case_manager,
    h.CaseManagerEmail as case_manager_email,
    h.CaseManagerPhone as case_manager_phone,
    h.Unit as unit,
    h.LastSync as last_sync_date
FROM SyncActiveHomes h
WHERE h.Xref = @HomeXref

-- Household Members (Foster Parents and Adults)
SELECT 
    'HOUSEHOLD_MEMBERS' as DataType,
    ff.PersonGUID as person_guid,
    ff.[Relation Name] as person_name,
    ff.Relationship as relationship,
    ff.[Current Age] as age,
    ff.relationId as person_id,
    -- Flag if they can administer medications
    dbo.CanAdministerMedications(ff.Relationship) as can_administer_meds,
    -- Check if they have an app user account
    CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as has_app_account,
    u.email as app_email,
    u.user_type as app_user_type
FROM SyncCurrentFosterFacility ff
LEFT JOIN app_users u ON u.radius_person_guid = ff.PersonGUID
WHERE ff.FosterHomeGuid = @FosterHomeGUID
ORDER BY 
    CASE ff.Relationship
        WHEN 'Foster Parent' THEN 1
        WHEN 'Caregiver' THEN 2
        WHEN 'Provider' THEN 3
        WHEN 'Other Adult' THEN 4
        ELSE 5
    END,
    ff.[Relation Name]

-- Children in Placement
SELECT 
    'CHILDREN_IN_PLACEMENT' as DataType,
    c.ChildGUID as child_guid,
    c.ChildPersonID as child_person_id,
    c.FirstName as first_name,
    c.LastName as last_name,
    c.DateOfBirth as date_of_birth,
    DATEDIFF(YEAR, c.DateOfBirth, GETDATE()) - 
        CASE WHEN MONTH(c.DateOfBirth) > MONTH(GETDATE()) 
            OR (MONTH(c.DateOfBirth) = MONTH(GETDATE()) AND DAY(c.DateOfBirth) > DAY(GETDATE()))
        THEN 1 ELSE 0 END as current_age,
    c.PlacementDate as placement_date,
    DATEDIFF(DAY, c.PlacementDate, GETDATE()) as days_in_placement,
    c.Status as placement_status,
    c.ServicePackage as service_level,
    c.Contract as contract_type,
    -- Important dates
    c.NextCourtDate as next_court_date,
    c.NextAnnualMedicalDue as next_annual_medical,
    c.NextSemiAnnualDentalDue as next_dental,
    c.NextMedCheckDue as next_med_check,
    c.NextCANSDue as next_cans_due,
    -- Safety plan info
    c.HasActiveSafetyPlan as has_safety_plan,
    c.SafetyPlanNextReview as safety_plan_review_date,
    -- ASQ Screening requirement (age 10+)
    CASE 
        WHEN DATEDIFF(YEAR, c.DateOfBirth, GETDATE()) >= 10 THEN 1 
        ELSE 0 
    END as requires_asq_screening,
    c.LastSync as last_sync_date
FROM SyncChildrenInPlacement c
WHERE c.FosterHomeGUID = @FosterHomeGUID
    AND c.Status = 'Active'
ORDER BY c.DateOfBirth

-- Active Medications for Children
SELECT 
    'CHILD_MEDICATIONS' as DataType,
    m.childGUID as child_guid,
    m.childPersonID as child_person_id,
    c.FirstName + ' ' + c.LastName as child_name,
    m.medName as medication_name,
    m.medStrength as strength,
    m.medDose as dose,
    m.medFrequency as frequency,
    m.prescription as is_prescription,
    m.instructions as instructions,
    m.physicianName as prescriber,
    m.reason as reason,
    m.effectiveStart as start_date,
    m.effectiveEnd as end_date,
    -- Calculate if medication is current
    CASE 
        WHEN m.effectiveEnd IS NULL OR m.effectiveEnd >= GETDATE() THEN 1
        ELSE 0
    END as is_current,
    m.lastSync as last_sync_date
FROM SyncChildMedications m
INNER JOIN SyncChildrenInPlacement c ON c.ChildGUID = m.childGUID
WHERE m.familyGUID = @FosterHomeGUID
    AND m.isActive = 1
    AND (m.effectiveEnd IS NULL OR m.effectiveEnd >= GETDATE())
ORDER BY c.FirstName, c.LastName, m.medName

-- Summary Counts
SELECT 
    'SUMMARY_COUNTS' as DataType,
    (SELECT COUNT(*) FROM SyncCurrentFosterFacility WHERE FosterHomeGuid = @FosterHomeGUID) as total_household_members,
    (SELECT COUNT(*) FROM SyncCurrentFosterFacility WHERE FosterHomeGuid = @FosterHomeGUID 
        AND dbo.CanAdministerMedications(Relationship) = 1) as can_administer_meds_count,
    (SELECT COUNT(*) FROM SyncChildrenInPlacement WHERE FosterHomeGUID = @FosterHomeGUID AND Status = 'Active') as total_children,
    (SELECT COUNT(*) FROM SyncChildrenInPlacement WHERE FosterHomeGUID = @FosterHomeGUID AND Status = 'Active'
        AND DATEDIFF(YEAR, DateOfBirth, GETDATE()) >= 10) as children_requiring_asq,
    (SELECT COUNT(*) FROM SyncChildMedications WHERE familyGUID = @FosterHomeGUID 
        AND isActive = 1 AND (effectiveEnd IS NULL OR effectiveEnd >= GETDATE())) as total_active_medications

GO

-- =============================================
-- QUERY 2: GET PREVIOUS VISIT DATA FOR CARRY-FORWARD
-- =============================================
-- This query retrieves the most recent completed visit form
-- by the SAME LIAISON to the SAME HOME to carry forward
-- appropriate data that doesn't change frequently.
-- =============================================

DECLARE @HomeXref INT = 123456  -- Replace with actual home_xref
DECLARE @CurrentUserClerkId NVARCHAR(255) = 'user_123abc' -- Replace with actual clerk_user_id

-- Get the most recent completed visit form by this liaison to this home
SELECT TOP 1
    'PREVIOUS_VISIT_DATA' as DataType,
    vf.visit_form_id,
    vf.visit_date as previous_visit_date,
    vf.form_type as previous_form_type,
    vf.status as previous_status,
    vf.quarter as previous_quarter,
    
    -- Parse JSON data (you'll need to extract specific fields in your application)
    -- These are the sections that contain data we want to carry forward
    vf.family_info,              -- License info, capacity, service levels
    vf.home_environment,         -- Physical environment details that don't change often
    vf.compliance_review,        -- Previous compliance status
    vf.observations,             -- Historical observations
    
    -- Metadata
    vf.created_by_name as previous_visitor_name,
    vf.created_at as previous_visit_created_date,
    vf.updated_at as previous_visit_updated_date,
    
    -- Calculate how long ago this visit was
    DATEDIFF(DAY, vf.visit_date, GETDATE()) as days_since_last_visit,
    
    -- Get the appointment details
    a.home_xref,
    a.location_address,
    a.assigned_to_name,
    a.assigned_to_role
    
FROM visit_forms vf
INNER JOIN appointments a ON a.appointment_id = vf.appointment_id
WHERE 
    a.home_xref = @HomeXref
    AND vf.created_by_user_id = @CurrentUserClerkId  -- Same liaison
    AND vf.status = 'completed'
    AND vf.is_deleted = 0
ORDER BY vf.visit_date DESC

-- Get specific carry-forward items from the most recent visit
-- (This helps identify what specific data should be pre-populated)
SELECT TOP 1
    'CARRY_FORWARD_SUGGESTIONS' as DataType,
    vf.visit_date as source_visit_date,
    
    -- Suggest what to carry forward based on age of last visit
    CASE 
        WHEN DATEDIFF(DAY, vf.visit_date, GETDATE()) <= 30 THEN 'RECENT'
        WHEN DATEDIFF(DAY, vf.visit_date, GETDATE()) <= 90 THEN 'QUARTERLY'
        WHEN DATEDIFF(DAY, vf.visit_date, GETDATE()) <= 365 THEN 'ANNUAL'
        ELSE 'STALE'
    END as data_freshness,
    
    -- Recommendations for what to carry forward
    -- NOTE: License info is NEVER carried forward - always pulled fresh from database
    CASE 
        WHEN DATEDIFF(DAY, vf.visit_date, GETDATE()) <= 30 THEN 
            'Carry forward: Inspection dates, bedroom configurations, vehicle info, swimming area details'
        WHEN DATEDIFF(DAY, vf.visit_date, GETDATE()) <= 90 THEN 
            'Carry forward: Bedroom configurations, vehicle info. Re-verify: Inspection dates, training dates'
        WHEN DATEDIFF(DAY, vf.visit_date, GETDATE()) <= 365 THEN 
            'Carry forward: Basic physical layout only. Re-verify everything else'
        ELSE 
            'Data is stale. Recommend fresh start with manual entry'
    END as carry_forward_recommendation,
    
    DATEDIFF(DAY, vf.visit_date, GETDATE()) as days_ago
    
FROM visit_forms vf
INNER JOIN appointments a ON a.appointment_id = vf.appointment_id
WHERE 
    a.home_xref = @HomeXref
    AND vf.created_by_user_id = @CurrentUserClerkId
    AND vf.status = 'completed'
    AND vf.is_deleted = 0
ORDER BY vf.visit_date DESC

GO

-- =============================================
-- QUERY 3: GET ALL PREVIOUS VISITS TO THIS HOME
-- =============================================
-- This provides context about visit history
-- =============================================

DECLARE @HomeXref INT = 123456  -- Replace with actual home_xref

SELECT 
    'VISIT_HISTORY' as DataType,
    vf.visit_form_id,
    vf.visit_date,
    vf.form_type,
    vf.quarter,
    vf.status,
    vf.created_by_name as visitor_name,
    vf.created_by_user_id as visitor_clerk_id,
    
    -- Count of each type of visit
    COUNT(*) OVER (PARTITION BY vf.form_type) as count_by_type,
    
    -- Overall visit count
    ROW_NUMBER() OVER (ORDER BY vf.visit_date DESC) as visit_sequence,
    
    DATEDIFF(DAY, vf.visit_date, GETDATE()) as days_ago
    
FROM visit_forms vf
INNER JOIN appointments a ON a.appointment_id = vf.appointment_id
WHERE 
    a.home_xref = @HomeXref
    AND vf.is_deleted = 0
ORDER BY vf.visit_date DESC

GO

-- =============================================
-- TESTING INSTRUCTIONS
-- =============================================
-- 1. Replace @HomeXref with an actual Xref from SyncActiveHomes
-- 2. Replace @CurrentUserClerkId with an actual clerk_user_id from app_users
-- 3. Run each query section separately in SSMS
-- 4. Verify the data returned makes sense
-- 5. Note any NULL values or missing data
-- 6. Check that the JSON fields in visit_forms contain expected data structure
-- =============================================

-- To find a valid @HomeXref for testing:
SELECT TOP 10 Xref, HomeName, City, State 
FROM SyncActiveHomes 
WHERE Guid IS NOT NULL
ORDER BY LastSync DESC

-- To find a valid @CurrentUserClerkId for testing:
SELECT TOP 10 clerk_user_id, email, first_name, last_name, user_type
FROM app_users 
WHERE is_active = 1
ORDER BY created_at DESC

