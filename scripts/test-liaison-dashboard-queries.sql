-- ============================================
-- Test Queries for Home Liaison Dashboard
-- ============================================
-- These queries match the logic in /api/dashboard/home-liaison
-- Replace 'jduarte@refugehouse.org' with your email address

DECLARE @UserEmail NVARCHAR(255) = 'jduarte@refugehouse.org'
DECLARE @Today DATETIME = CAST(GETDATE() AS DATE)
DECLARE @EndDate DATETIME = DATEADD(DAY, 30, @Today)
DECLARE @TodayStart DATETIME = CAST(GETDATE() AS DATE)
DECLARE @TodayEnd DATETIME = DATEADD(DAY, 1, @TodayStart)
DECLARE @WeekEnd DATETIME = DATEADD(DAY, 7, @TodayStart)

PRINT '============================================'
PRINT '1. CHECK APP_USER RECORDS FOR EMAIL'
PRINT '============================================'
SELECT 
    id,
    email,
    first_name,
    last_name,
    clerk_user_id,
    is_active,
    created_at
FROM app_users
WHERE email = @UserEmail
ORDER BY created_at DESC

PRINT ''
PRINT '============================================'
PRINT '2. CHECK APPOINTMENTS (ASSIGNED TO EMAIL)'
PRINT '============================================'
SELECT 
    a.appointment_id,
    a.title,
    h.HomeName as home_name,
    a.start_datetime,
    a.end_datetime,
    a.status,
    a.assigned_to_user_id,
    a.assigned_to_name,
    a.created_by_user_id,
    au_assigned.email AS assigned_to_email,
    au_created.email AS created_by_email,
    a.is_deleted
FROM appointments a
LEFT JOIN app_users au_assigned ON 
    (TRY_CAST(a.assigned_to_user_id AS UNIQUEIDENTIFIER) = au_assigned.id 
     OR a.assigned_to_user_id = au_assigned.clerk_user_id)
LEFT JOIN app_users au_created ON 
    (TRY_CAST(a.created_by_user_id AS UNIQUEIDENTIFIER) = au_created.id 
     OR a.created_by_user_id = au_created.clerk_user_id)
LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
WHERE (au_assigned.email = @UserEmail OR au_created.email = @UserEmail)
    AND a.is_deleted = 0
ORDER BY a.start_datetime DESC

PRINT ''
PRINT '============================================'
PRINT '3. UPCOMING APPOINTMENTS (NEXT 30 DAYS)'
PRINT '============================================'
SELECT DISTINCT
    a.appointment_id,
    a.title,
    h.HomeName as home_name,
    a.start_datetime,
    a.end_datetime,
    a.status,
    a.priority,
    a.location_address,
    a.assigned_to_user_id,
    a.assigned_to_name,
    a.created_by_user_id,
    vf.status as form_status,
    vf.visit_form_id,
    au_assigned.email AS assigned_to_email,
    au_created.email AS created_by_email
FROM appointments a
LEFT JOIN visit_forms vf ON a.appointment_id = vf.appointment_id
LEFT JOIN app_users au_assigned ON 
    (TRY_CAST(a.assigned_to_user_id AS UNIQUEIDENTIFIER) = au_assigned.id 
     OR a.assigned_to_user_id = au_assigned.clerk_user_id)
LEFT JOIN app_users au_created ON 
    (TRY_CAST(a.created_by_user_id AS UNIQUEIDENTIFIER) = au_created.id 
     OR a.created_by_user_id = au_created.clerk_user_id)
LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
WHERE (au_assigned.email = @UserEmail OR au_created.email = @UserEmail)
    AND a.start_datetime >= @Today
    AND a.start_datetime <= @EndDate
    AND a.is_deleted = 0
ORDER BY a.start_datetime ASC

PRINT ''
PRINT '============================================'
PRINT '4. TODAY''S APPOINTMENTS COUNT'
PRINT '============================================'
SELECT COUNT(DISTINCT a.appointment_id) as count
FROM appointments a
LEFT JOIN app_users au_assigned ON 
    (TRY_CAST(a.assigned_to_user_id AS UNIQUEIDENTIFIER) = au_assigned.id 
     OR a.assigned_to_user_id = au_assigned.clerk_user_id)
LEFT JOIN app_users au_created ON 
    (TRY_CAST(a.created_by_user_id AS UNIQUEIDENTIFIER) = au_created.id 
     OR a.created_by_user_id = au_created.clerk_user_id)
WHERE (au_assigned.email = @UserEmail OR au_created.email = @UserEmail)
    AND a.start_datetime >= @TodayStart
    AND a.start_datetime <= @TodayEnd
    AND a.is_deleted = 0

PRINT ''
PRINT '============================================'
PRINT '5. THIS WEEK''S APPOINTMENTS COUNT'
PRINT '============================================'
SELECT COUNT(DISTINCT a.appointment_id) as count
FROM appointments a
LEFT JOIN app_users au_assigned ON 
    (TRY_CAST(a.assigned_to_user_id AS UNIQUEIDENTIFIER) = au_assigned.id 
     OR a.assigned_to_user_id = au_assigned.clerk_user_id)
LEFT JOIN app_users au_created ON 
    (TRY_CAST(a.created_by_user_id AS UNIQUEIDENTIFIER) = au_created.id 
     OR a.created_by_user_id = au_created.clerk_user_id)
WHERE (au_assigned.email = @UserEmail OR au_created.email = @UserEmail)
    AND a.start_datetime >= @TodayStart
    AND a.start_datetime <= @WeekEnd
    AND a.is_deleted = 0

PRINT ''
PRINT '============================================'
PRINT '6. PENDING VISITS COUNT'
PRINT '============================================'
SELECT COUNT(DISTINCT a.appointment_id) as count
FROM appointments a
LEFT JOIN app_users au_assigned ON 
    (TRY_CAST(a.assigned_to_user_id AS UNIQUEIDENTIFIER) = au_assigned.id 
     OR a.assigned_to_user_id = au_assigned.clerk_user_id)
LEFT JOIN app_users au_created ON 
    (TRY_CAST(a.created_by_user_id AS UNIQUEIDENTIFIER) = au_created.id 
     OR a.created_by_user_id = au_created.clerk_user_id)
WHERE (au_assigned.email = @UserEmail OR au_created.email = @UserEmail)
    AND a.status = 'scheduled'
    AND a.start_datetime >= @Today
    AND a.is_deleted = 0

PRINT ''
PRINT '============================================'
PRINT '7. ON-CALL SCHEDULES FOR EMAIL'
PRINT '============================================'
SELECT 
    ocs.id,
    ocs.start_datetime,
    ocs.end_datetime,
    ocs.on_call_type,
    ocs.on_call_category,
    ocs.duration_hours,
    ocs.user_id,
    ocs.user_email,
    ocs.is_active,
    ocs.is_deleted,
    au.email AS app_user_email
FROM on_call_schedule ocs
LEFT JOIN app_users au ON ocs.user_id = au.id
WHERE (ocs.user_email = @UserEmail OR au.email = @UserEmail)
    AND ocs.end_datetime >= @Today
    AND ocs.is_active = 1
    AND ocs.is_deleted = 0
ORDER BY ocs.start_datetime ASC

PRINT ''
PRINT '============================================'
PRINT '8. ALL APPOINTMENTS (NO DATE FILTER)'
PRINT '============================================'
SELECT 
    a.appointment_id,
    a.title,
    a.start_datetime,
    a.status,
    au_assigned.email AS assigned_to_email,
    au_created.email AS created_by_email,
    a.is_deleted
FROM appointments a
LEFT JOIN app_users au_assigned ON 
    (TRY_CAST(a.assigned_to_user_id AS UNIQUEIDENTIFIER) = au_assigned.id 
     OR a.assigned_to_user_id = au_assigned.clerk_user_id)
LEFT JOIN app_users au_created ON 
    (TRY_CAST(a.created_by_user_id AS UNIQUEIDENTIFIER) = au_created.id 
     OR a.created_by_user_id = au_created.clerk_user_id)
WHERE (au_assigned.email = @UserEmail OR au_created.email = @UserEmail)
    AND a.is_deleted = 0
ORDER BY a.start_datetime DESC

PRINT ''
PRINT '============================================'
PRINT '9. DEBUG: CHECK IF APPOINTMENTS EXIST'
PRINT '============================================'
SELECT 
    'Total appointments' AS description,
    COUNT(*) AS count
FROM appointments
WHERE is_deleted = 0

UNION ALL

SELECT 
    'Appointments with assigned_to_user_id' AS description,
    COUNT(*) AS count
FROM appointments
WHERE assigned_to_user_id IS NOT NULL
    AND is_deleted = 0

UNION ALL

SELECT 
    'Appointments with created_by_user_id' AS description,
    COUNT(*) AS count
FROM appointments
WHERE created_by_user_id IS NOT NULL
    AND is_deleted = 0

UNION ALL

SELECT 
    'Appointments matching email (assigned)' AS description,
    COUNT(*) AS count
FROM appointments a
INNER JOIN app_users au ON 
    (TRY_CAST(a.assigned_to_user_id AS UNIQUEIDENTIFIER) = au.id 
     OR a.assigned_to_user_id = au.clerk_user_id)
WHERE au.email = @UserEmail
    AND a.is_deleted = 0

UNION ALL

SELECT 
    'Appointments matching email (created)' AS description,
    COUNT(*) AS count
FROM appointments a
INNER JOIN app_users au ON 
    (TRY_CAST(a.created_by_user_id AS UNIQUEIDENTIFIER) = au.id 
     OR a.created_by_user_id = au.clerk_user_id)
WHERE au.email = @UserEmail
    AND a.is_deleted = 0

PRINT ''
PRINT '============================================'
PRINT '10. CHECK APPOINTMENT USER IDS'
PRINT '============================================'
SELECT DISTINCT
    a.assigned_to_user_id,
    au_assigned.email AS assigned_email,
    a.created_by_user_id,
    au_created.email AS created_email
FROM appointments a
LEFT JOIN app_users au_assigned ON 
    (TRY_CAST(a.assigned_to_user_id AS UNIQUEIDENTIFIER) = au_assigned.id 
     OR a.assigned_to_user_id = au_assigned.clerk_user_id)
LEFT JOIN app_users au_created ON 
    (TRY_CAST(a.created_by_user_id AS UNIQUEIDENTIFIER) = au_created.id 
     OR a.created_by_user_id = au_created.clerk_user_id)
WHERE a.is_deleted = 0
    AND (a.assigned_to_user_id IS NOT NULL OR a.created_by_user_id IS NOT NULL)
ORDER BY a.assigned_to_user_id, a.created_by_user_id

